#!/usr/bin/env node
/**
 * @fileoverview Fetch one widget's authored source on demand, and cache it (§14).
 *
 * Source is the wire-up payload: large, and needed only for the widget that
 * actually gets selected. Syncing it for the whole catalog wastes ~10x the
 * transfer at 4 widgets and becomes untenable at thousands.
 *
 * Cached under .agents/cache/ui-discovery/source-cache/<scope>.<tag>.json, so the second use
 * of a widget is offline. Over time the cache holds exactly the widgets this
 * project actually uses.
 *
 * Usage:
 *   node fetch-widget-source.js --key x_snc_toast_widget.aiux-toast-notification-widget \
 *                              --cwd ~/git/toast-widget-consumer [--auth local] [--refresh]
 */
import {readFile, writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import {join, resolve} from 'path';
import {
  extractAuthoredSource,
  withServerScript
} from './lib/widget-api-summary.js';
import {classifyInstanceError} from './lib/classify-instance-error.js';
import {resolveInstanceSource, queryTable} from './lib/instance-source.js';
import {isMainModule} from './lib/is-main-module.js';

const SOURCE_FIELDS = [
  'sys_id',
  // Fetched alongside the source so the cache entry records the widget's TRUE
  // current version, not the manifest snapshot's (which may itself be stale).
  // Without this, a re-pull would re-cache the stale manifest value and every
  // later freshness probe would see a mismatch and re-pull forever.
  'sys_updated_on',
  'id',
  'component',
  'sourcemap',
  // The server script: dropped from the index (sync keeps only the boolean),
  // but required HERE — it is the contract for `this.server.get(input)`, so
  // wiring a data-backed widget up without it means guessing the input shape.
  'script',
  'component_compile_metadata'
];

// The freshness probe pulls only the version stamp — one row, one column. It is
// what makes the cache trustworthy: we confirm against the live instance rather
// than the manifest, so we never serve wire-up that no longer matches what is
// deployed.
const FRESHNESS_FIELDS = ['sys_id', 'sys_updated_on'];

function parseArgs(argv) {
  const args = {
    key: undefined,
    cwd: process.cwd(),
    auth: undefined,
    manifest: undefined
  };
  const flags = {refresh: false};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]?.replace(/^--/, '');
    if (key === 'refresh') flags.refresh = true;
    else if (key && key in args) args[key] = argv[++i];
  }
  return {...args, ...flags};
}

/**
 * Probe the live instance for one widget's current version stamp.
 *
 * Returns `sys_updated_on` (the version), or `null` if the widget no longer
 * exists on the instance. This is the cheap query that guarantees freshness: the
 * manifest is a snapshot and can be arbitrarily stale, so a cached entry is only
 * trustworthy once it matches what the instance reports RIGHT NOW.
 */
async function probeWidgetVersion(sysId, {source, cwd}) {
  const {records} = await queryTable({
    source,
    cwd,
    table: 'sys_aix_widget',
    query: `sys_id=${sysId}`,
    fields: FRESHNESS_FIELDS,
    limit: 1,
    // Point query — one known sys_id. Skipping pagination saves the extra
    // round-trip the pager spends confirming there is no page 2 when the
    // instance omits x-total-count.
    paginate: false
  });
  return records?.[0]?.sys_updated_on ?? null;
}

/**
 * Fetch (or read from cache) the authored source for one widget.
 *
 * Freshness is confirmed against the LIVE instance, not the manifest: before
 * trusting a cache hit we probe the widget's current `sys_updated_on`. Only if
 * the instance still reports the cached version do we serve the cache — otherwise
 * (edited, deleted, or version differs) we re-pull. This is what lets a second
 * client pick up a source change the first client's sync never saw.
 *
 * Exported so the generator can reuse it — the CLI wrapper below is for an agent
 * or a human invoking it directly.
 */
export async function fetchWidgetSource(
  widget,
  {source, cwd, cacheDir, refresh = false}
) {
  const key = `${widget._scope_prefix}.${widget.id}`;
  const cachePath = join(cacheDir, `${key}.json`);

  if (!refresh && existsSync(cachePath)) {
    const cached = JSON.parse(await readFile(cachePath, 'utf8'));
    if (cached.sys_id === widget.sys_id) {
      // Trust the cache only after the instance confirms the version. A probe
      // failure is intentionally NOT swallowed here — it propagates so main()
      // classifies it and degrades non-blocking, rather than silently serving
      // source we could not verify.
      const liveUpdated = await probeWidgetVersion(widget.sys_id, {
        source,
        cwd
      });
      if (liveUpdated && liveUpdated === cached.sys_updated_on) {
        return {...cached, cacheHit: true};
      }
    }
  }

  const {records} = await queryTable({
    source,
    cwd,
    table: 'sys_aix_widget',
    query: `sys_id=${widget.sys_id}`,
    fields: SOURCE_FIELDS,
    limit: 1,
    paginate: false
  });
  const record = records?.[0];
  if (!record) throw new Error(`no record for sys_id=${widget.sys_id}`);

  // Extract here, then throw the raw sourcemap away — it is ~10x the size of the
  // source it carries, and nothing downstream reads it. The server script is
  // appended so the cached entry carries both halves of the widget's API: the
  // client element and the server contract behind `this.server.get(input)`.
  const authored = withServerScript(extractAuthoredSource(record), record);
  const entry = {
    key,
    sys_id: widget.sys_id,
    // Record the instance's OWN version, not the manifest's — the manifest may
    // be stale, and caching its value would make the next probe mismatch and
    // re-pull on every call. Fall back to the manifest only if the field is
    // somehow absent.
    sys_updated_on: record.sys_updated_on ?? widget.sys_updated_on,
    fetchedAt: new Date().toISOString(),
    authoredSource: authored
  };

  await mkdir(cacheDir, {recursive: true});
  await writeFile(cachePath, JSON.stringify(entry, null, 2) + '\n', 'utf8');
  return {...entry, cacheHit: false};
}

/** Exported for tests; the CLI entry point below is the only production caller. */
export async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.key) throw new Error('pass --key <scope>.<tag>');

  const cwd = resolve(args.cwd);
  const manifestPath = resolve(
    args.manifest ??
      join(cwd, '.agents', 'cache', 'ui-discovery', 'widgets.json')
  );
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  const widget = manifest.widgets.find(
    w => `${w._scope_prefix}.${w.id}` === args.key
  );
  if (!widget) {
    throw new Error(
      `${args.key} is not in the index — re-sync, or check the key (scope.tag)`
    );
  }

  // One resolver for both the probe and the full pull — the instance we verify
  // freshness against is the instance we fetch from (known-gap #1).
  const source = await resolveInstanceSource({cwd, auth: args.auth});

  let result;
  try {
    result = await fetchWidgetSource(widget, {
      source,
      cwd,
      cacheDir: join(resolve(manifestPath, '..'), 'source-cache'),
      refresh: args.refresh
    });
  } catch (error) {
    // Degrade, never block (§5.5). Emit ONE sanitized reason the agent repeats,
    // never the raw error. The cached source, if any, is left untouched.
    const reason = classifyInstanceError(
      error,
      {origin: source.origin},
      source.auth,
      "that widget's authored source"
    );
    // Say WHY this widget is being dropped, in words the agent can pass on.
    // "Widget discovery is unavailable" is too vague: the user watches an
    // indexed widget silently not get used and cannot tell whether it was
    // rejected on merit, never considered, or blocked by a connection problem
    // they could fix.
    //
    // A cached copy may well exist here — it is deliberately NOT served. A
    // widget edited or redeployed since it was cached has different props and
    // events, and wiring against them produces code that compiles, renders, and
    // does nothing, with no error anywhere. Ranking on stale metadata is cheap
    // to be wrong about; wiring on stale source is not.
    console.warn(`\n   ⚠ could not verify the current API of ${args.key}`);
    console.warn(`     reason: ${reason}`);
    console.warn(
      '     TELL THE USER, in your own words: you found this widget in the index and it'
    );
    console.warn(
      '     looked like a match, but you could not read its authored source from the'
    );
    console.warn(
      '     instance, so you cannot know its current properties and events. Wiring it up'
    );
    console.warn(
      '     from memory or from an older copy would risk code that looks right and'
    );
    console.warn(
      '     silently does nothing. You are therefore setting this widget aside and'
    );
    console.warn(
      '     continuing with the offline component catalog — not because no widget'
    );
    console.warn(
      '     matched, but because this one could not be verified right now.'
    );
    process.exit(1);
  }

  const bytes = result.authoredSource.files.reduce(
    (a, f) => a + f.content.length,
    0
  );
  console.log(
    `\n   ${result.key} — ${result.cacheHit ? 'cache hit' : 'fetched'}, ` +
      `from=${result.authoredSource.from}, ${result.authoredSource.files.length} file(s), ${bytes}B\n`
  );
  for (const file of result.authoredSource.files) {
    console.log(`--- ${file.path}`);
    console.log(file.content);
  }
}

// Instance failures are handled inside main() with a sanitized reason. Anything
// reaching here is a setup error (bad --key, missing manifest, widget not in the
// index) — safe to surface, and still non-blocking to the overall build.
//
// Guarded: importing this module for `fetchWidgetSource` must not start the CLI.
// Unguarded, an import ran main() with no --key, fell through to this handler,
// and called process.exit(1) — terminating the importing process.
if (isMainModule(import.meta.url)) {
  main().catch(error => {
    console.error(`\n   ⚠ ${error.message}`);
    console.warn(
      '     widget discovery is optional; continue with the offline component catalog'
    );
    process.exit(1);
  });
}
