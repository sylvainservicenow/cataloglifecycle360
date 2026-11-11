#!/usr/bin/env node
/**
 * Run directly as `node .claude/skills/ui-discovery/scripts/sync-widgets.mjs` — sync
 * the widget catalog, then generate the skill.
 *
 * Two steps, deliberately separate (§5A): sync is the only networked part, and
 * generate is a pure file transformation. Source is NOT synced — it is fetched
 * per widget on first use by fetch-widget-source.js (§14.1).
 *
 * Not a postinstall hook: this needs network access and instance credentials, and
 * `pnpm install` has to keep working offline, in CI, and with --prod.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();
const manifestDir = path.join(projectRoot, '.agents', 'cache', 'ui-discovery');
const skillDir = path.join(projectRoot, '.claude', 'skills', 'ui-discovery');

// A leading `--` is tolerated (and stripped) so both `sync-widgets.mjs --auth dc`
// and `sync-widgets.mjs -- --auth dc` forward the same passthrough args.
const passthrough = process.argv.slice(2).filter(arg => arg !== '--');
const authIndex = passthrough.indexOf('--auth');
const auth = authIndex !== -1 ? passthrough[authIndex + 1] : undefined;

/**
 * Run a step and return its exit status instead of throwing.
 *
 * Returning the status is what lets the caller recognize DEGRADED_EXIT — but it
 * also means EVERY non-zero becomes a value that can be ignored by accident.
 * Each call site must therefore decide explicitly: only the degraded status is
 * survivable, and everything else has to propagate. A generator failure that
 * exits 0 here would leave widgets.json refreshed and SKILL.md stale while
 * reporting success — a silent orchestration failure.
 */
const step = (script, args) => {
  try {
    execFileSync(process.execPath, [path.join(SCRIPTS, script), ...args], {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    return 0;
  } catch (error) {
    if (typeof error.status === 'number') return error.status;
    throw error;
  }
};

/** Mirrors DEGRADED_EXIT in sync-widget-catalog.js. */
const DEGRADED_EXIT = 2;

// `--check` is a read-only freshness probe, not a sync: it only asks whether the
// existing index is stale, so it stops after the catalog step and never
// regenerates the skill. The agent reads the verdict line and, if outdated,
// narrates then re-runs without --check.
if (passthrough.includes('--check')) {
  // The probe prints its own verdict and exits 0 even when the instance is
  // unreachable ("freshness-unknown"), so any non-zero here is an unexpected
  // failure — not a verdict — and must not be reported as success.
  const checkStatus = step('sync-widget-catalog.js', [
    '--cwd',
    projectRoot,
    '--out',
    manifestDir,
    ...passthrough
  ]);
  process.exit(checkStatus);
}

// A degraded sync means the instance could not be read and any existing
// snapshot was left untouched. Generation still runs — a stale index beats no
// index — but the rows must be labelled as preserved rather than current.
const syncStatus = step('sync-widget-catalog.js', [
  '--cwd',
  projectRoot,
  '--out',
  manifestDir,
  ...passthrough
]);
const degraded = syncStatus === DEGRADED_EXIT;
if (syncStatus !== 0 && !degraded) process.exit(syncStatus);

const manifestPath = path.join(manifestDir, 'widgets.json');
if (!fs.existsSync(manifestPath)) {
  console.warn(
    'ui-discovery: installed widgets were not checked; continue with the offline component catalog'
  );
  process.exit(0);
}

// Generation is not optional the way the instance read is: if it fails, the
// index on disk no longer matches the catalog just written, and the agent would
// rank rows that were never regenerated. Propagate the failure.
const generateStatus = step('generate-ui-discovery.js', [
  // --cwd so the instance-mismatch check resolves GLIDE_ORIGIN / aiux.json from
  // the project, not from the scripts directory.
  '--cwd',
  projectRoot,
  '--manifest',
  manifestPath,
  '--out',
  skillDir,
  ...(auth ? ['--auth', auth] : []),
  ...(degraded ? ['--degraded', 'true'] : [])
]);
process.exit(generateStatus);
