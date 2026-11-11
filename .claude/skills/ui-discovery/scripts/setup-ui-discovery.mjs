#!/usr/bin/env node
/**
 * Postinstall restore: put the widget rows back after `pnpm install` overwrites
 * the installed skill with the packaged copy.
 *
 * The packaged `SKILL.md` ships with ZERO widget rows — the pack build never
 * contacts an instance — so without this step every install would silently drop
 * a project's widget index until the next sync. `.agents/cache/` survives the
 * copy, so the rows are regenerated from it offline.
 *
 * Exits silently when there is nothing to restore: a fresh project must not
 * produce postinstall noise, and this must never fail an install.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const skillDir = path.resolve(projectRoot, '.claude', 'skills', 'ui-discovery');
const manifest = path.resolve(
  projectRoot,
  '.agents',
  'cache',
  'ui-discovery',
  'widgets.json'
);
const generator = path.join(skillDir, 'scripts', 'generate-ui-discovery.js');

if (!fs.existsSync(generator) || !fs.existsSync(manifest)) process.exit(0);

try {
  execFileSync(
    process.execPath,
    [
      generator,
      '--cwd',
      projectRoot,
      '--manifest',
      manifest,
      '--out',
      skillDir
    ],
    {cwd: projectRoot, stdio: 'inherit'}
  );
  console.info(
    'ui-discovery: restored the widget index from the local catalog'
  );
} catch (error) {
  console.warn(
    `ui-discovery: could not restore the widget index: ${error.message}`
  );
}
