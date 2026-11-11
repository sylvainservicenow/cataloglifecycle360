#!/usr/bin/env node
/**
 * PostToolUse hook — lints the files Claude Code just changed.
 *
 * Runs ESLint on the changed files using the project's flat config
 * (eslint.config.mjs). This surfaces SSR-safety, accessibility, i18n, and style
 * violations back to Claude in the same turn it made the edit, instead of
 * waiting for a manual `pnpm lint`.
 *
 * Two payload shapes are handled, because the tool that edits a file depends on
 * the permission mode:
 *
 *   Edit|Write — the edited path arrives as tool_input.file_path.
 *   Bash       — auto mode routes edits through `sed`, heredocs, and scripts,
 *                whose payload carries no file path at all. For those we detect
 *                what changed by mtime: any lintable file touched since the
 *                previous hook run. This is shape-independent, so it does not
 *                depend on the changed-file list that bashEditDiffEnabled puts
 *                in tool_response (whose field name is version-specific).
 *
 * Set AIUX_LINT_HOOK_DEBUG=1 to append each raw payload to
 * $TMPDIR/aiux-lint-hook-debug.json — use this to inspect tool_response if you
 * want to switch to the harness-provided list.
 *
 * Degrades gracefully: if ESLint is not installed yet (e.g. before the first
 * `pnpm install`), nothing lintable changed, or the paths live in a
 * generated/vendored directory, the hook exits 0 and does nothing — it never
 * blocks a freshly scaffolded project.
 *
 * Exit codes:
 *   0 — clean, nothing to lint, or ESLint unavailable (no-op)
 *   2 — ESLint found problems; the output on stderr is fed back to Claude
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SKIP_DIRS = [
  'node_modules',
  'dist',
  'dist-metadata',
  '.now',
  'target',
  '.git',
  '.aiux-runtime',
  '.types',
  'coverage'
];
const LINTABLE = /\.(mjs|js)$/;

// Fallback window for the first run of a session, and the ceiling on how far
// back a stale marker may reach — without it, a long gap between hook runs
// would sweep in files that some earlier turn already reported.
const FIRST_RUN_WINDOW_MS = 30_000;
const MAX_WINDOW_MS = 300_000;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

let payload;
try {
  payload = JSON.parse(readStdin() || '{}');
} catch {
  process.exit(0); // malformed payload — never block
}

if (process.env.AIUX_LINT_HOOK_DEBUG === '1') {
  try {
    fs.appendFileSync(
      path.join(os.tmpdir(), 'aiux-lint-hook-debug.json'),
      JSON.stringify(payload) + '\n'
    );
  } catch {
    // debugging is best-effort — never block an edit over it
  }
}

// The mtime marker is keyed by project so several checkouts don't share state.
const markerPath = path.join(
  os.tmpdir(),
  `aiux-lint-hook-${crypto.createHash('sha256').update(projectDir).digest('hex').slice(0, 12)}`
);

function readMarker() {
  try {
    return fs.statSync(markerPath).mtimeMs;
  } catch {
    return 0;
  }
}

function writeMarker() {
  try {
    fs.writeFileSync(markerPath, '');
  } catch {
    // if the marker can't be written we fall back to the fixed window
  }
}

/** Lintable files under `dir` whose mtime is newer than `cutoff`. */
function findChangedSince(dir, cutoff, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      findChangedSince(path.join(dir, entry.name), cutoff, out);
    } else if (entry.isFile() && LINTABLE.test(entry.name)) {
      const full = path.join(dir, entry.name);
      try {
        if (fs.statSync(full).mtimeMs > cutoff) out.push(full);
      } catch {
        // file vanished between readdir and stat — ignore
      }
    }
  }
  return out;
}

/** Keep only lintable project files outside generated/vendored directories. */
function toLintableRelPaths(absPaths) {
  const seen = new Set();
  for (const abs of absPaths) {
    if (!LINTABLE.test(abs)) continue;
    const rel = path.relative(projectDir, path.resolve(abs));
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
    if (rel.split(path.sep).some(seg => SKIP_DIRS.includes(seg))) continue;
    if (!fs.existsSync(path.resolve(projectDir, rel))) continue;
    seen.add(rel);
  }
  return [...seen];
}

let targets;
const directPath = payload?.tool_input?.file_path;
if (directPath) {
  // Edit|Write — the harness told us exactly which file changed.
  targets = toLintableRelPaths([directPath]);
} else {
  // Bash (or any tool without a file path) — detect changes by mtime.
  const marker = readMarker();
  const cutoff = Math.max(
    marker || Date.now() - FIRST_RUN_WINDOW_MS,
    Date.now() - MAX_WINDOW_MS
  );
  targets = toLintableRelPaths(findChangedSince(projectDir, cutoff));
  writeMarker();
}

if (targets.length === 0) process.exit(0);

// Resolve the local ESLint binary; if it's missing, the project hasn't been
// installed yet — skip silently rather than failing the edit.
const isWin = process.platform === 'win32';
const eslintBin = path.join(
  projectDir,
  'node_modules',
  '.bin',
  isWin ? 'eslint.cmd' : 'eslint'
);
if (!fs.existsSync(eslintBin)) process.exit(0);

const result = spawnSync(eslintBin, targets, {
  cwd: projectDir,
  encoding: 'utf-8',
  shell: isWin
});

if (result.status === 0) process.exit(0);

process.stderr.write(
  `ESLint reported problems in ${targets.join(', ')}:\n` +
    `${result.stdout || ''}${result.stderr || ''}`
);
process.exit(2);
