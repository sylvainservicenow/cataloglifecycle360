#!/usr/bin/env node
/**
 * @fileoverview Phase 2 (thin) — pull the widget catalog off an instance into a
 * local manifest.
 *
 * Deliberately NOT built yet, and why:
 *   - watermark / incremental refresh, and the id-set reconcile for deletions.
 *     Both are caching machinery justified by a large corpus and slow refreshes.
 *     A full re-pull is currently one sub-second query, so the watermark would
 *     optimize nothing while adding a path where a deleted row survives forever.
 *   - deriving the now-sdk alias from GLIDE_ORIGIN. Blocked on loopback
 *     equivalence (`localhost` vs `127.0.0.1`) — see spec §5.7. Pass --auth.
 *
 * Usage:
 *   node sync-widget-catalog.js --cwd ~/git/toast-widget-consumer [--auth local]
 *                              [--out <dir>]
 */
import {readFile, writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import {join, resolve} from 'path';
import {classifyInstanceError} from './lib/classify-instance-error.js';
import {
  resolveInstanceSource,
  resolveDeployTarget,
  queryTable
} from './lib/instance-source.js';
import {sameInstance} from './lib/normalize-origin.js';
import {hasServerScript} from './lib/widget-api-summary.js';
import {isMainModule} from './lib/is-main-module.js';

/**
 * INDEX fields only — everything needed to rank a widget and decide it is a
 * candidate. Deliberately excludes `component` and `sourcemap`: those are the
 * heavy wire-up payload and are fetched per widget, on demand (§14).
 *
 * At 4 widgets that saves ~40 KB. At 10k it is the difference between a ~1.5 MB
 * index pull and a ~50 MB one for source almost nobody will read.
 */
const INDEX_FIELDS = [
  'sys_id',
  'id',
  'name',
  'description',
  'best_for',
  'category',
  'type',
  'chat_compatible',
  'input_schema',
  'roles',
  'sys_scope',
  'sys_updated_on',
  // Fetched to derive the `hasServerScript` boolean, then DISCARDED before the
  // manifest is written (see the mapping in main): a server script can be many
  // KB and the index only needs true/false. Persisting the raw text would bloat
  // widgets.json — the file the generator and future search parse in full — for
  // no gain.
  'script',
  // Carries elementClassName, the import map, and `asset` — which is how origin
  // is detected without selecting the multi-hundred-KB `sourcemap` (§11.3/11.4).
  'component_compile_metadata',
  'dependent_widget_ids'
];

/** Wire-up payload, fetched one widget at a time by fetch-widget-source.js. */
export const SOURCE_FIELDS = [
  'sys_id',
  'id',
  'component',
  'sourcemap',
  'component_compile_metadata'
];

// `type=aix_widget` must be a positive match. Page and layout records live in
// this table with an EMPTY type column, so a negative filter matches nothing
// (§11.2).
//
// category: index `platform` + `custom`, exclude `internal` + `system` (§12).
//   internal — author does not want it reused (`@discoverable(false)`, or the
//              decorator omitted, which reads as false). Also hardcoded on
//              plumbing records: page widgets and the app's lifecycle module.
//   system   — platform-created only; the SDK's enum cannot emit it.
// Do NOT narrow to `platform`: it is self-declared and unenforced, and every
// widget that exists today is `custom` despite having opted into discovery.
export const QUERY =
  'type=aix_widget^category!=internal^category!=system^ORDERBYname';

// The digest is the whole freshness contract for the index. `count` catches
// adds and deletes; `maxUpdated` (the latest sys_updated_on across the set)
// catches edits — an edit stamps the row "now", which can only raise the max.
// Together they detect any change to the widget set in one tiny query, without
// pulling index fields for every widget.
const DIGEST_FIELDS = ['sys_id', 'sys_updated_on'];

/**
 * Exit code for "the refresh failed but an earlier snapshot was preserved".
 *
 * Distinct from 0 because the wrapper cannot otherwise tell a real sync from a
 * degraded one: it would regenerate from the untouched old manifest and
 * announce those rows as current, directly contradicting the warning printed
 * seconds earlier. Distinct from 1 because this is NOT a failed command —
 * widget discovery is optional and the install/task must continue.
 */
export const DEGRADED_EXIT = 2;

/** Exported for tests: this is the whole freshness contract for the index. */
export function computeDigest(records) {
  let maxUpdated = '';
  for (const record of records) {
    if (record.sys_updated_on && record.sys_updated_on > maxUpdated) {
      maxUpdated = record.sys_updated_on;
    }
  }
  return {count: records.length, maxUpdated};
}

function parseArgs(argv) {
  const args = {cwd: process.cwd(), auth: undefined, out: undefined};
  const flags = {check: false};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]?.replace(/^--/, '');
    if (key === 'check') flags.check = true;
    else if (key && key in args) args[key] = argv[++i];
  }
  return {...args, ...flags};
}

/**
 * `sys_scope` → `scope` is a required join, not an optimization: the prefix
 * truncates at 18 chars, so it cannot be derived from the app name (§11.6).
 */
async function resolveScopes({source, cwd, records}) {
  const sysIds = [...new Set(records.map(r => r.sys_scope))].filter(
    id => id && id !== 'global'
  );
  const byId = {global: 'global'};
  if (!sysIds.length) return byId;

  const {records: scopes} = await queryTable({
    source,
    cwd,
    table: 'sys_scope',
    query: `sys_idIN${sysIds.join(',')}`,
    fields: ['sys_id', 'name', 'scope']
  });
  for (const scope of scopes) byId[scope.sys_id] = scope.scope;

  for (const id of sysIds) {
    if (!byId[id]) {
      console.warn(`   ⚠ unresolved sys_scope ${id} — widget will be skipped`);
    }
  }
  return byId;
}

/**
 * Compare where discovery reads from against where `now-sdk deploy` would
 * install, and report the verdict.
 *
 * These are two independent notions of "the instance" with nothing binding
 * them: dev — and therefore discovery — resolves `GLIDE_ORIGIN`/`aiux.json`
 * first (core/sdk/src/serve.js), while deploy reads only a now-sdk alias, by
 * default the mutable global one. So a project can index widgets from instance
 * A and ship the app to instance B, where those widgets are absent or a
 * different version. Both sides look healthy; the import only 404s at request
 * time.
 *
 * We flag, never reconcile — the project author owns this configuration. An
 * undeterminable alias host is `unknown`, never `diverged`: a scrape that
 * stopped working must not manufacture warnings.
 *
 * @returns {Promise<{status:'ok'|'diverged'|'unknown', deployTarget:object|null}>}
 */
async function checkDeployTarget({cwd, auth, readOrigin}) {
  const deployTarget = await resolveDeployTarget({cwd, auth});
  if (!deployTarget) return {status: 'unknown', deployTarget: null};

  const status = sameInstance(readOrigin, deployTarget.host)
    ? 'ok'
    : 'diverged';
  if (status === 'diverged') {
    console.warn(
      `\n   ⚠ this index is being built from a DIFFERENT instance than deploy targets`
    );
    console.warn(`     discovery reads from : ${readOrigin}`);
    console.warn(
      `     deploy installs to   : ${deployTarget.host}  (now-sdk alias "${deployTarget.alias}")`
    );
    console.warn(
      '     widgets found here may be missing or a different version after deploy'
    );
    console.warn(
      '     align the project config and the now-sdk alias, or pass -a on deploy\n'
    );
  }
  return {status, deployTarget};
}

/**
 * `--check`: is the existing index still current? Runs the SAME widget query but
 * pulls only the digest fields, recomputes {count, maxUpdated}, and compares to
 * what the manifest recorded. One tiny round-trip that detects edits, adds and
 * deletes together — it cannot say WHICH widget changed, only that something did.
 *
 * Always non-blocking: prints exactly one machine-stable verdict line the agent
 * reads (`ui-discovery: index <verdict>`) and returns cleanly. It never rewrites
 * the manifest — a stale verdict is the agent's cue to narrate, then run a full
 * `node .claude/skills/ui-discovery/scripts/sync-widgets.mjs`.
 */
async function checkFreshness({source, cwd, outDir, target}) {
  const manifestPath = join(outDir, 'widgets.json');
  if (!existsSync(manifestPath)) {
    // No index yet is not "stale" — it is unsynced. Keep the two distinct so the
    // agent does not treat a pristine project as a change to re-sync away.
    console.log(
      'ui-discovery: index not-synced (no local widget snapshot yet)'
    );
    return;
  }

  let recorded;
  try {
    recorded = JSON.parse(await readFile(manifestPath, 'utf8')).provenance
      ?.digest;
  } catch {
    recorded = undefined;
  }
  if (!recorded) {
    // Pre-digest snapshot (synced before this field existed). Can't compare, so
    // treat as stale: a full sync backfills the digest and future checks work.
    console.log(
      'ui-discovery: index outdated (snapshot predates freshness tracking; re-sync to enable it)'
    );
    return;
  }

  let live;
  try {
    const {records} = await queryTable({
      source,
      cwd,
      table: 'sys_aix_widget',
      query: QUERY,
      fields: DIGEST_FIELDS
    });
    live = computeDigest(records);
  } catch (error) {
    // Probe unreachable — degrade exactly like the sync gate. The existing
    // index stays usable; staleness is simply unknown right now.
    const reason = classifyInstanceError(
      error,
      target,
      source.auth,
      'the widget freshness check'
    );
    console.warn(
      `ui-discovery: index freshness-unknown (could not reach ${target.origin})`
    );
    console.warn(`   reason: ${reason}`);
    console.warn(
      '   widget discovery is optional; continue with the existing widget snapshot and offline component catalog'
    );
    return;
  }

  if (
    live.count === recorded.count &&
    live.maxUpdated === recorded.maxUpdated
  ) {
    console.log(
      'ui-discovery: index current (no widget changes since last sync)'
    );
  } else {
    console.log(
      `ui-discovery: index outdated (was ${recorded.count} widget(s)/${recorded.maxUpdated || 'none'}, now ${live.count}/${live.maxUpdated || 'none'}); re-sync to refresh`
    );
  }
}

/** Exported for tests; the CLI entry point below is the only production caller. */
export async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = resolve(args.cwd);
  const outDir = resolve(
    args.out ?? join(cwd, '.agents', 'cache', 'ui-discovery')
  );
  const source = await resolveInstanceSource({cwd, auth: args.auth});
  // `target` is what the classifier and provenance display. In direct mode it is
  // authoritative (we query exactly this origin); in alias mode it is best-effort
  // display only, and may not be where the alias actually points (known-gap #1).
  const target = {origin: source.origin};

  if (args.check) {
    await checkFreshness({source, cwd, outDir, target});
    return;
  }

  // `credentialFrom`, never `from`: `from` names where the ORIGIN came from, and
  // printing it here claims the credential was read from `glideOrigin` — a URL
  // field that holds no credential. When auth is rejected, that sends the reader
  // to the one field that cannot be the cause.
  const authLabel =
    source.mode === 'direct'
      ? `project credential (${source.credentialFrom ?? 'project config'})`
      : `now-sdk ${args.auth ? `alias "${args.auth}"` : 'default alias'}`;
  console.log(`\n• Widget catalog sync`);
  console.log(`   project:  ${cwd}`);
  console.log(
    `   instance: ${source.origin}  (${source.mode === 'direct' ? source.from : 'alias-resolved'})`
  );
  console.log(`   auth:     ${authLabel}`);

  let records;
  let scopesById;
  try {
    ({records} = await queryTable({
      source,
      cwd,
      table: 'sys_aix_widget',
      query: QUERY,
      fields: INDEX_FIELDS
    }));
    scopesById = await resolveScopes({source, cwd, records});
  } catch (error) {
    // Degrade, never fail (§5.5). An existing manifest is left untouched so a
    // transient outage doesn't wipe a good catalog.
    const reason = classifyInstanceError(
      error,
      target,
      source.auth,
      'the widget query'
    );
    console.warn(
      `\n   ⚠ could not read the widget catalog from ${target.origin}`
    );
    console.warn(`     reason: ${reason}`);
    console.warn(
      '     widget discovery is optional; continue with the offline component catalog'
    );
    console.warn('     leaving any existing widget snapshot in place');
    console.warn(
      '     if an installed widget is required, verify the instance target, network or VPN, and now-sdk authentication\n'
    );
    // Non-fatal, but the caller must know the snapshot was NOT refreshed.
    process.exitCode = DEGRADED_EXIT;
    return;
  }

  // After the catalog is safely in hand: a divergence warning is useless if a
  // failed query already returned above, and this costs a local subprocess.
  const {status: targetMatch, deployTarget} = await checkDeployTarget({
    cwd,
    auth: args.auth,
    readOrigin: source.origin
  });

  const widgets = records
    .filter(record => scopesById[record.sys_scope])
    .map(record => {
      // Derive the one boolean the index needs from `script`, then drop the raw
      // text so it never lands in the persisted manifest. `_has_server_script`
      // follows the same underscore-prefixed "derived field" convention as
      // `_scope_prefix`; summarizeWidget prefers it and falls back to computing
      // from raw `script` for the fixture path, which carries full records.
      const {script, ...rest} = record;
      return {
        ...rest,
        _scope_prefix: scopesById[record.sys_scope],
        _has_server_script: hasServerScript(script)
      };
    });

  const manifest = {
    provenance: {
      instance: source.origin,
      // How the instance was resolved. In direct mode this is authoritative —
      // we queried exactly this origin. In alias mode the now-sdk alias is the
      // real source of truth and this origin is display-only (known-gap #1).
      instanceFrom: source.from,
      resolvedVia: source.mode, // 'direct' | 'alias' — never the credential
      authAlias:
        source.mode === 'alias'
          ? (args.auth ?? '(now-sdk default)')
          : '(project credential)',
      syncedAt: new Date().toISOString(),
      // Where `now-sdk deploy` would install, and whether that agrees with the
      // instance we just read. Persisted so the divergence is visible in the
      // generated SKILL.md — a console warning scrolls away, the index does not.
      deployTarget,
      targetMatch,
      query: QUERY,
      widgetCount: widgets.length,
      // Freshness snapshot. Computed over the RAW query rows (pre scope-filter),
      // NOT `widgets`, so a cheap `--check` probe — which runs the same QUERY
      // but skips the scope join — reproduces it exactly. widgetCount can be
      // lower when a scope fails to resolve; digest.count is the instance truth.
      digest: computeDigest(records)
    },
    widgets
  };

  await mkdir(outDir, {recursive: true});
  await writeFile(
    join(outDir, 'widgets.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  console.log(
    `\n   ${widgets.length} widget(s) → ${join(outDir, 'widgets.json')}`
  );
  for (const widget of widgets) {
    console.log(`   • ${widget._scope_prefix}.${widget.id}`);
  }
  console.log();
}

// Guarded: importing this module for `computeDigest` or `QUERY` must not start
// a catalog synchronization. Unguarded, an import opened a real connection to
// the configured instance — network, credentials and all — from a unit test.
if (isMainModule(import.meta.url)) {
  main().catch(error => {
    console.error('Sync failed:', error.message);
    process.exit(1);
  });
}
