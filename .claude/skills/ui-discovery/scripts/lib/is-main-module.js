import {realpathSync} from 'fs';
import {fileURLToPath} from 'url';

/**
 * True when this module is the file node was asked to run, rather than something
 * another module imported.
 *
 * Every script here is both a CLI and an importable module, so each needs this
 * guard: without it, importing one runs its `main()` — starting a catalog
 * synchronization, or calling `process.exit(1)` inside the importing process.
 *
 * Compared by REAL path. A naive `import.meta.url === pathToFileURL(argv[1])`
 * looks right and fails whenever the script is reached through a symlink: node
 * resolves `import.meta.url` through symlinks while `argv[1]` keeps whatever the
 * caller typed. On macOS every temp directory is such a link (`/var/folders/…`
 * → `/private/var/folders/…`), and a pnpm-linked package directory is another.
 * The failure mode is silent — the CLI exits 0 having done nothing at all —
 * which is far worse than a crash.
 *
 * @param {string} importMetaUrl  the caller's `import.meta.url`
 * @returns {boolean}
 */
export function isMainModule(importMetaUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(entry);
  } catch {
    // A path that cannot be resolved is not the entry point we were run as.
    return false;
  }
}
