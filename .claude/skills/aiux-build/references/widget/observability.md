# Observability & Logging

No `console.*` in production code paths. Use structured logging for traceability, filtering, and aggregation.

---

## Backend Logging: `createLogger`

For server-side code (loaders, API helpers, server processes):

```js
import {createLogger} from '@servicenow/aiux-observability';
const log = createLogger('my-module');

export function handleRequest(req, res) {
  log.debug({url: req.url}, 'request received');
  try {
    res.json(processRequest(req));
  } catch (err) {
    log.error({error: err.message, url: req.url}, 'request failed');
    res.status(500).end();
  }
}
```

---

## Browser Logging: `getLogger`

For component code (pages, widgets, event handlers):

```js
import {getLogger} from '@servicenow/aiux-components-core';
const log = getLogger('my-widget');

_handleSaveError(err) {
  log.error({error: err.message}, 'Record save failed');
  this._errorMessage = 'Save failed. Please try again.';
}
```

**SSR safe** — `getLogger()` is fully isomorphic. No `isServer` guard needed.

**Do NOT import `@servicenow/aiux-observability` in components** — use `@servicenow/aiux-components-core` which re-exports the browser-safe API.

---

## Severity Level Guide

| Level   | When to use                        | Examples                                           |
| ------- | ---------------------------------- | -------------------------------------------------- |
| `trace` | Lowest-level detail, dev only      | Raw bytes, function entry/exit                     |
| `debug` | Per-request detail for development | Request received, cache hit/miss, loader timing    |
| `info`  | Significant lifecycle events       | Server started/stopped, config loaded              |
| `warn`  | Degraded but recoverable           | Slow response, retry triggered, fallback activated |
| `error` | Operation failed                   | Unhandled exception, upstream 5xx, timeout         |
| `fatal` | Process-level failure              | Uncaught exception, port binding failure           |

Per-request events go at `debug`; lifecycle events (startup, shutdown, config loaded) go at `info`:

```js
log.debug({url: req.url}, 'request received'); // per-request
log.info({port: 80}, 'server listening'); // lifecycle
```

---

## Scope Rules

### Backend scope (`no_console_in_backend`)

Applies to server-side files (loaders, API modules, server processes). All `console.*` should be `createLogger`.

### Browser scope (`prefer_structured_browser_logging`)

Applies to component files (pages, widgets). Only new `console.warn()` and `console.error()` are flagged — not `console.log`/`console.debug`, not existing code.

### Neither scope (don't flag `console.*`)

- CLI / developer terminal code
- Build tooling, CI scripts
- Test files (`**/*.test.js`)
- Storybook stories
- `catch` blocks that re-throw

### Critical False-Positive

Page and component files are **CLIENT-SIDE** code even though they export a `static async loader(ctx)` that runs on the server. The component class itself (constructor, render, event handlers) runs in the browser. Do NOT apply backend logging rules to these files.

**Loaders** are the exception — they run on the server, so use `createLogger` from `@servicenow/aiux-observability` in loader functions, not `getLogger`.

---

## `lazyImage` Directive

Use `lazyImage` from `@servicenow/aiux-directive-lazy-image` instead of raw `<img>` tags:

```js
import {lazyImage} from '@servicenow/aiux-directive-lazy-image';

render() {
  return html`
    <div class="flex flex-col items-center">
      ${lazyImage({src: 'no-data.png', alt: 'No data', width: 320, height: 240})}
      <p>No records found</p>
    </div>
  `;
}
```

**Benefits:**

- Enforces `loading="lazy"` and `decoding="async"`
- Requires `width`/`height` (prevents CLS)
- Auto-prefixes platform image paths with `/core/images/`
- SSR-safe — no `isServer` guard needed

**Usage rules:**

- Must be in a **child position**: `html\`${lazyImage(...)}\``, not attribute position
- Use filenames only (e.g. `'empty-state.png'`) — auto-prefixed
- For above-fold images: `lazyImage({src: 'hero.png', ..., eager: true})`
- For CSS class: `lazyImage({src: 'avatar.png', ..., class: 'rounded-full'})`
