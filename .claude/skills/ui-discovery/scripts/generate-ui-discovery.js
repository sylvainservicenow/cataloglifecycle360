#!/usr/bin/env node
/**
 * @fileoverview Phase 3 (minimal) — turn a widget manifest into skill markdown.
 *
 * Offline by design: reads only `widgets.json` (or the Phase 0 fixture) and
 * writes markdown. This is the §5A split — swapping the search mechanism later
 * touches nothing in the acquisition layer, and vice versa.
 *
 * Widget rows are merged with the pack-generated component seed into one unified
 * index while preserving each deployed catalog entry independently.
 *
 * Usage:
 *   node generate-ui-discovery.js --manifest <widgets.json> --out <dir>
 *   node generate-ui-discovery.js --fixture ../test/fixtures/widget-catalog-localhost.json
 */
import {readFile, writeFile, mkdir, rm, rename} from 'fs/promises';
import {existsSync} from 'fs';
import {join, resolve} from 'path';
import {summarizeWidget} from './lib/widget-api-summary.js';
import {sameInstance} from './lib/normalize-origin.js';
import {isMainModule} from './lib/is-main-module.js';

const DEFAULT_FETCH_COMMAND =
  'node .claude/skills/ui-discovery/scripts/fetch-widget-source.js';

function parseArgs(argv) {
  const args = {
    manifest: undefined,
    fixture: undefined,
    out: undefined,
    auth: undefined,
    fetchCommand: DEFAULT_FETCH_COMMAND,
    // Set by sync-widgets.mjs when the refresh failed and the previous snapshot
    // was preserved. Changes what the rows are CALLED, never whether they print.
    degraded: undefined,
    cwd: process.cwd()
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key && key in args) args[key] = argv[i + 1];
  }
  return args;
}

/**
 * The fixture is a raw recon dump; the manifest is sync output. Same records,
 * different envelopes — normalize so the generator only knows one shape.
 */
async function loadWidgets(args) {
  if (args.manifest) {
    const manifest = JSON.parse(await readFile(resolve(args.manifest), 'utf8'));
    return {widgets: manifest.widgets, provenance: manifest.provenance};
  }
  const fixture = JSON.parse(await readFile(resolve(args.fixture), 'utf8'));
  // The fixture is unfiltered — apply the same filters the sync query applies.
  const widgets = fixture.records.filter(
    r =>
      r.type === 'aix_widget' &&
      r.category !== 'internal' &&
      r.category !== 'system'
  );
  return {
    widgets,
    provenance: {
      instance: fixture._provenance?.instance,
      instanceFrom: 'fixture',
      authAlias: fixture._provenance?.now_sdk_alias,
      syncedAt: fixture._provenance?.captured,
      widgetCount: widgets.length
    }
  };
}

const escapeCell = text =>
  (text || '').replaceAll('|', '\\|').replaceAll('\n', ' ');

export function renderWidgetRows(widgets) {
  return widgets.map(
    widget =>
      `| \`${widget.tag}\` | widget | \`${widget.scope}\` | ${widget.category} | ${escapeCell(widget.description)} | ${escapeCell(widget.bestFor) || '—'} | \`references/widgets/${widget.key}.md\` |`
  );
}

export function replaceSection(template, start, end, content) {
  const pattern = new RegExp(`(${start})[\\s\\S]*?(${end})`);
  if (!pattern.test(template))
    throw new Error(`missing generated section ${start}`);
  return template.replace(
    pattern,
    (_match, open, close) => `${open}\n${content}\n${close}`
  );
}

export function renderReference(summary, fetchCommand) {
  const lines = [
    `# ${summary.name}`,
    '',
    `\`${summary.key}\` · ${summary.category} · ${summary.origin}`,
    ''
  ];

  if (summary.description) lines.push(summary.description, '');
  if (summary.bestFor) lines.push(`**Best for:** ${summary.bestFor}`, '');

  lines.push(
    '## Import',
    '',
    '```js',
    `import '${summary.importSpecifier}';`,
    '```',
    '',
    `Then use \`<${summary.tag}>\` in a template.`,
    ''
  );

  const notes = [];
  if (summary.hasServerScript) {
    notes.push(
      'Has a server script — data is fetched server-side. The source below ' +
        'includes it as `(server script)`. Read it before calling ' +
        '`this.server.get(input)`: it defines which `input` keys are honored and ' +
        'what shape lands in `data`. An input key it does not read is silently ' +
        'ignored — the call succeeds and nothing happens.'
    );
  }
  if (summary.chatCompatible) notes.push('Chat compatible.');
  if (summary.roles.length)
    notes.push(`Requires roles: ${summary.roles.join(', ')}.`);
  if (summary.dependentWidgetIds.length) {
    notes.push(`Depends on widgets: ${summary.dependentWidgetIds.join(', ')}.`);
  }
  // Notes carry only what the source below does NOT reveal. The externalized
  // import list was dropped: the source's own import statements say the same
  // thing more precisely, and the list omits everything Rollup inlined.
  if (notes.length) lines.push('## Notes', '', ...notes.map(n => `- ${n}`), '');

  lines.push(...renderAuthoredSource(summary, fetchCommand));

  return lines.join('\n');
}

/**
 * The wire-up tier (§13). Authored source is ground truth — it replaces the
 * derived props/events/slots tables that used to live here, because a derived
 * table can be confidently wrong, and wrong is worse than absent.
 *
 * This section is CONSTANT — one instruction, always the same: run the fetch
 * command. Two earlier shapes both failed in the same way. Inlining the source
 * made the reference depend on cache state at generate time, so a fetch left it
 * claiming "not cached" until the next sync. Naming the cache FILE was worse: an
 * agent given a local path reads it, skipping the live version probe that is the
 * whole point of the command — observed producing wire-up against an event name
 * the widget no longer dispatched. The path is therefore deliberately absent
 * here; the only documented way to source is the command that verifies it.
 */
function renderAuthoredSource(summary, fetchCommand) {
  return [
    '## Source',
    '',
    'Read this widget’s authored source before wiring it up — it is the',
    'implementation, so it is the authority on properties, events, slots, methods',
    'and how they behave. Say what it does NOT do as well: a widget that only',
    'dispatches an event still needs the page to handle it.',
    '',
    '**Always run this command to get it** — every time, including when you have',
    'used this widget before:',
    '',
    '```bash',
    fetchCommand,
    '```',
    '',
    `Before running it, tell the user: “I found ${summary.name} as a possible match. To confirm its properties, events and behavior, I need to read only this widget’s authored source from the instance. This is read-only and caches the source locally for future use.”`,
    '',
    'The command **is** the cache. It asks the instance for this widget’s current',
    'version (one row, one column), prints the locally stored copy when it still',
    'matches, and re-pulls only when the widget has changed — so running it again',
    'costs almost nothing and is the only way to know the source is current. Do not',
    'substitute any local file for it: a widget edited or redeployed since the last',
    'fetch would give you props and event names that no longer exist, and nothing',
    'anywhere would report it.',
    '',
    'If the fetch fails, it prints one short `reason:` line. Tell the user',
    'specifically what happened: this widget looked like a match, but its current',
    'properties and events could not be read from the instance (give the reason),',
    'so you are setting it aside rather than guessing an API that may have changed.',
    'Make clear this is **not** “no widget matched” — a reusable widget exists and',
    'could not be verified right now. Then continue with the offline component',
    'catalog.',
    '',
    'Do not fall back to an older copy of this widget’s source, and do not build',
    'from what you remember of it. A widget edited or redeployed since then has',
    'different props and events, and code written against the old ones compiles,',
    'renders, and silently does nothing.',
    '',
    'Widget discovery is optional: do not block the work, do not retry during the',
    'same task, and do not expose raw errors, commands or credentials.',
    ''
  ];
}

/**
 * Resolve the instance this project develops against — same order the dev server
 * and the sync use (decision #7).
 */
async function resolveTarget(cwd) {
  if (process.env.GLIDE_ORIGIN) return process.env.GLIDE_ORIGIN;
  const aiuxJson = join(cwd, 'aiux.json');
  if (existsSync(aiuxJson)) {
    const config = JSON.parse(await readFile(aiuxJson, 'utf8'));
    if (config?.development?.glideOrigin) return config.development.glideOrigin;
  }
  return 'http://localhost:8080';
}

/**
 * Compare the manifest's origin against the project's current target.
 *
 * A mismatch is a silent-wrong-answer bug, not cosmetic: widget `id` is not
 * unique across instances and scope prefixes differ, so an index built from
 * instance A produces `glide-widgets` specifiers that resolve on A and 404 on B.
 * Nothing else detects this — the manifest looks perfectly healthy.
 *
 * Compared loosely via the shared normalizer: trailing slashes and loopback
 * spellings are the same instance, and flagging those would train people to
 * ignore the warning (§5.7).
 */
function checkInstanceMatch(manifestInstance, currentTarget) {
  if (!manifestInstance || !currentTarget) return null;
  return sameInstance(manifestInstance, currentTarget)
    ? null
    : {manifestInstance, currentTarget};
}

/**
 * Render the catalog-source block, plus whichever advisories apply.
 *
 * Exported for tests: this block is the only place a user (or the agent) learns
 * that the index and the deploy target disagree, so its wording is behavior.
 */
export function renderProvenance(provenance, mismatch) {
  const lines = [
    '> **Catalog source**',
    `> Instance \`${provenance.instance}\` (${provenance.instanceFrom}), auth \`${provenance.authAlias}\`.`,
    `> Synced ${provenance.syncedAt}. ${provenance.widgetCount} widget(s).`
  ];
  // Distinct from the mismatch below: that one says the SNAPSHOT is from the
  // wrong instance and a re-sync fixes it. This one says the snapshot is right
  // but the app is being DEPLOYED somewhere else, which no re-sync can fix —
  // it needs a configuration decision from the user.
  if (provenance.targetMatch === 'diverged' && provenance.deployTarget) {
    lines.push(
      '',
      '> ## ⚠ Deploy targets a DIFFERENT instance than this index',
      `> Widgets below were read from \`${provenance.instance}\`. This app deploys to`,
      `> \`${provenance.deployTarget.host}\` (now-sdk alias \`${provenance.deployTarget.alias}\`). Widget records do`,
      '> not travel between instances, so on the deploy target a widget below may',
      '> **not exist** — the import 404s at request time, breaking the deployed page',
      '> while local dev works — or **exist at a different version**, where props,',
      '> events or server-script data differ silently and the UI behaves wrong.',
      '> Neither is caught by the build, by lint, or by local testing.',
      '>',
      '> Tell the user this before wiring up a widget: name both instances and both',
      '> failure modes. Aligning them (project `GLIDE_ORIGIN` / `aiux.json` vs the',
      '> deploy alias) is a configuration decision only they can make. Do not block.'
    );
  }

  // Deploy target undeterminable — no now-sdk, no credential store, or the
  // `auth --list` scrape stopped matching. Deliberately a plain note, not a ⚠:
  // we have no evidence of a problem, and a warning nobody can act on is how a
  // banner becomes background noise. But staying silent hides the risk from
  // exactly the person who has not configured an alias yet, so say it once.
  if (provenance.targetMatch === 'unknown') {
    lines.push(
      '',
      '> **Deploy target unconfirmed.** These widgets come from the instance this',
      '> project develops against (`GLIDE_ORIGIN` / `aiux.json`); `now-sdk deploy`',
      '> uses its own alias instead, and we could not read it to confirm the two',
      '> agree. If they do not, a widget below may be missing or a different version',
      '> after deploy. Worth checking before relying on one — mention it if you wire',
      '> a widget up, but do not block on it.'
    );
  }

  if (mismatch) {
    lines.push(
      '',
      '> ## ⚠ This index is from a DIFFERENT instance',
      `> Synced from \`${mismatch.manifestInstance}\`, but this project now targets`,
      `> \`${mismatch.currentTarget}\`. Widget ids and scope prefixes are not portable`,
      '> between instances, so **the imports below may not resolve**. Tell the user to',
      '> run `node .claude/skills/ui-discovery/scripts/sync-widgets.mjs` before relying on anything here.'
    );
  }
  return lines.join('\n');
}

/** Exported for tests; the CLI entry point below is the only production caller. */
export async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifest && !args.fixture) {
    throw new Error(
      'pass --manifest <widgets.json> or --fixture <fixture.json>'
    );
  }

  const outDir = resolve(args.out ?? join(process.cwd(), 'ui-discovery-out'));
  const {widgets, provenance} = await loadWidgets(args);
  const effectiveAuth =
    args.auth ??
    (provenance.authAlias && !provenance.authAlias.startsWith('(')
      ? provenance.authAlias
      : undefined);
  const currentSkill = await readFile(join(outDir, 'SKILL.md'), 'utf8');
  // Where fetch-widget-source.js caches source. The generator never READS it —
  // it only tells the agent where to look — so generation stays independent of
  // fetch state and references never go stale.

  // Instance mismatch: the index describes a DIFFERENT instance than the project
  // now targets. Loud, because every generated import specifier is then suspect.
  const mismatch = args.manifest
    ? checkInstanceMatch(
        provenance.instance,
        await resolveTarget(resolve(args.cwd))
      )
    : null;
  if (mismatch) {
    console.warn('');
    console.warn(
      '   ⚠ INSTANCE MISMATCH — this index describes a different instance'
    );
    console.warn(`     index was synced from : ${mismatch.manifestInstance}`);
    console.warn(`     project now targets   : ${mismatch.currentTarget}`);
    console.warn('     Widget ids and scope prefixes are not portable between');
    console.warn(
      '     instances, so the generated imports may 404 at request time.'
    );
    console.warn(
      '     Re-run `node .claude/skills/ui-discovery/scripts/sync-widgets.mjs` to rebuild against the current target.'
    );
    console.warn('');
  }

  const refsDir = join(outDir, 'references', 'widgets');
  // References are keyed on scope.tag; a stale file from a deleted widget would
  // otherwise linger and be loadable from an index that no longer lists it.
  await rm(refsDir, {recursive: true, force: true});
  await mkdir(refsDir, {recursive: true});

  const summaries = [];
  const seen = new Set();

  for (const record of widgets) {
    const scopePrefix = record._scope_prefix;
    if (!scopePrefix) {
      console.warn(`   ⚠ ${record.id}: no resolved scope prefix — skipping`);
      continue;
    }
    const summary = summarizeWidget(record, scopePrefix);

    // scope.tag, not tag — `id` collides across scopes (decision #5).
    if (seen.has(summary.key)) {
      console.warn(`   ⚠ duplicate ${summary.key} — skipping`);
      continue;
    }
    seen.add(summary.key);

    if (!summary.description && !summary.bestFor) {
      console.warn(
        `   ⚠ ${summary.key}: no description or best_for — unrankable row`
      );
    }

    const fetchCommand =
      `${args.fetchCommand} --key ${summary.key}` +
      (effectiveAuth ? ` --auth ${effectiveAuth}` : '');
    await writeFile(
      join(refsDir, `${summary.key}.md`),
      renderReference(summary, fetchCommand),
      'utf8'
    );
    // `category` is a ranking hint, never a filter (§12) — the query already
    // excluded internal/system, so what reaches here is platform or custom.
    summaries.push(summary);
    console.log(`   • ${summary.key} — ${summary.origin}`);
  }

  const rows = renderWidgetRows(summaries);
  let skillMd = replaceSection(
    currentSkill,
    '<!-- WIDGET_PROVENANCE_START -->',
    '<!-- WIDGET_PROVENANCE_END -->',
    renderProvenance(provenance, mismatch)
  );
  skillMd = replaceSection(
    skillMd,
    '<!-- WIDGET_INDEX_START -->',
    '<!-- WIDGET_INDEX_END -->',
    rows.join('\n')
  );

  const skillPath = join(outDir, 'SKILL.md');
  const temporaryPath = `${skillPath}.tmp`;
  await writeFile(temporaryPath, skillMd, 'utf8');
  await rename(temporaryPath, skillPath);

  // Echo the rows we just wrote.
  //
  // The agent loaded SKILL.md when the skill activated — BEFORE this sync ran —
  // so the copy in its context has no widget rows at all. Telling it to "reread
  // the index" is not enough: re-reading a file the harness already loaded is
  // easy to skip, and when it is skipped the agent ranks against a
  // component-only index and can never see a widget. That failure is invisible,
  // because "no widget matched" and "no widget was ever in context" look
  // identical in the answer.
  //
  // So the rows travel back as command output, which the agent cannot miss.
  console.log(`\n   widgetRows=${rows.length}, outDir=${outDir}`);
  if (rows.length) {
    // Claim only what is always true. This runs on every sync, including one
    // where nothing changed, so asserting "the index changed" is sometimes
    // false — and a banner that is sometimes false is one an agent learns to
    // discount. What IS always true after a sync: the SKILL.md the agent loaded
    // at activation predates it and lacks these rows.
    // Never call preserved rows "current". The refresh failing and the rows
    // being announced as fresh in the same output is worse than either alone:
    // an agent reading the second line has no reason to weigh the first.
    if (args.degraded === 'true') {
      console.log(
        `\nui-discovery: the refresh FAILED — these rows are the PRESERVED earlier` +
          `\nsnapshot from ${provenance.syncedAt ?? 'an unknown time'}, NOT a fresh read of the instance.` +
          `\nA widget may have been added, changed or removed since. Rank them, but say` +
          `\nthey are unverified if you use one, and re-run the sync when the instance` +
          `\nis reachable.\n`
      );
    } else {
      console.log(
        '\nui-discovery: these are the CURRENT widget rows. The SKILL.md already in' +
          '\nyour context was loaded before this sync and does not contain them. Rank' +
          '\nthese alongside the component rows, or re-read the index before ranking.\n'
      );
    }
    console.log(
      '| Capability | Kind | Scope | Category | Description | Best for | Reference |'
    );
    console.log(
      '| ---------- | ---- | ----- | -------- | ----------- | -------- | --------- |'
    );
    for (const row of rows) console.log(row);
    console.log();
    // The required next step, spelled out per widget. The index row carries no
    // API — properties, events and the server contract exist only in the
    // authored source — so picking a row is never enough to write code against.
    // Naming the exact command here puts it in the same output the agent is
    // already reading, rather than only in a reference file it may skim.
    console.log(
      'ui-discovery: an index row is NOT an API. Before writing code against any\nwidget above, run its command below — every time, including when you have\nused it before. It verifies the widget against the instance and re-pulls only\nif it changed:\n'
    );
    for (const summary of summaries) {
      console.log(`  ${args.fetchCommand} --key ${summary.key}`);
    }
    console.log();
  }

  // Deploy divergence, on STDOUT, next to the rows.
  //
  // It is already written into SKILL.md's provenance block and warned about on
  // stderr during the sync — and both channels missed. The provenance block
  // needs a re-read the agent does not do, and stderr can be captured
  // separately from the stdout the agent actually consumes. So the one thing
  // the user must hear travels the same path as the rows they are about to
  // rank.
  if (provenance.targetMatch === 'diverged' && provenance.deployTarget) {
    const {host, alias} = provenance.deployTarget;
    console.log(
      [
        'ui-discovery: INSTANCE MISMATCH — TELL THE USER THIS BEFORE WIRING UP A WIDGET.',
        '',
        `  Widgets above were read from : ${provenance.instance}`,
        `  This app deploys to          : ${host}   (now-sdk alias "${alias}")`,
        '',
        '  These are different instances, and widget records do not travel between',
        '  them. On the deploy target, a widget listed above may:',
        '',
        '    - not exist at all — the import 404s at request time, so the deployed',
        '      page is broken while local dev works perfectly; or',
        '    - exist at a different version — props, events or server-script data',
        '      differ silently, so the UI renders but behaves wrong.',
        '',
        '  Neither is caught by the build, by lint, or by local testing: both sides',
        '  look healthy until someone opens the page on the deploy target.',
        '',
        '  To align, either point the project’s GLIDE_ORIGIN / aiux.json at the',
        '  deploy instance, or deploy with an alias matching the instance read above.',
        '  Which one is correct is the user’s decision — state the risk, name both',
        '  instances, and continue. Do not block the work on it.',
        ''
      ].join('\n')
    );
  }
}

// Run only when invoked as a command, so tests can import the renderers without
// the module trying to generate a skill on import.
if (isMainModule(import.meta.url)) {
  main().catch(error => {
    console.error('Generate failed:', error.message);
    process.exit(1);
  });
}
