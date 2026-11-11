---
name: migrate-header-config-review
description: Migrate legacy headerConfig.js / computeCurrentHeaderConfig apps to the app-owned header-config.js model. Use when an app still has pages/<route>/headerConfig.js files, a computeCurrentHeaderConfig export, or reads ctx.headerConfig.
metadata:
  author: servicenow
  version: '2.2.0'
---

# headerConfig Migration to the App-Owned Model

Use this skill to migrate an app off the **legacy** header-config patterns onto the **current** app-owned model, and to review the result. There is no codemod — migration is manual. The contract is in [The model you are migrating TO](#the-model-you-are-migrating-to) below.

You may edit files when asked to migrate. When asked only to review, **read and report, do not modify.**

---

## The two legacy patterns you are migrating FROM

| Legacy pattern                                                                                                                                                                                | Signal                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A.** Per-page `pages/<route>/headerConfig.js` exporting `getHeaderConfig({params})`, run in the IVM isolate via `__runHeaderConfig`                                                         | A `headerConfig.js`/`.ts` file under `pages/`; the build hard-fails on these                                                                                           |
| **B.** A `computeCurrentHeaderConfig(ctx)` **named export** in `application.js`, called by the framework, injected as `ctx.headerConfig`, serialized under `__LAYOUT_DATA__['header-config']` | `export ... computeCurrentHeaderConfig` in `application.js`; loaders reading `ctx.headerConfig` — the build hard-fails on this too (except the allowlisted `aict` app) |

Both are gone from the framework. The framework no longer computes, injects, or serializes header config, and does not call any app function for it.

**Both patterns are blocked at build time.** The guards live in the shared build core (`buildManifestAndMetadata` in `@servicenow/aiux-sdk`), so **both** `now-sdk build` and `aiux build` hard-fail: Pattern A on any `pages/**/headerConfig.{js,ts}`, Pattern B on a `computeCurrentHeaderConfig` export in `application.{js,ts}`. The `aict` app is temporarily allowlisted for Pattern B while it rides the framework compat layer. So most migrations are forced by a red build, not discovered by review — but the review categories below still apply to catching a _wrong_ migration (missing route, stale `ctx.headerConfig` read, missing `navigate()` refresh).

## The model you are migrating TO

Header config is **app-owned and nav-layer-only**. The app stores the resolved header-config **object** on `navLayoutContext.headerConfig` and keeps it fresh from two lifecycle hooks — `setup()` (initial route) and `navigate()` (every client URL change). `aiux-nav-layout` is the sole consumer.

```js
// header-config.js — app-owned route → header-config table + resolver
export function getHeaderConfig(path) {
  // …match path → return a header-config object, or null when a nav item
  //   or runtime setHeaderConfig() owns the toolbar.
}
```

```js
// application.js — resolve in setup(), refresh in navigate()
import {navLayoutContext} from '@servicenow/aiux-components-nav';
import {getHeaderConfig} from './header-config.js';

export default {
  applicationLayout: 'aiux-nav-layout',
  setup(ctx) {
    navLayoutContext.set({
      ...navLayoutContext.get(),
      headerConfig: getHeaderConfig(ctx.resolvedPath || ctx.pagePath)
    });
  },
  // Fires before EVERY client navigation, full and shallow. navCtx.toAppPath is
  // the fresh target route; ctx.resolvedPath is stale at hook time.
  navigate(navCtx) {
    navLayoutContext.set({
      ...navLayoutContext.get(),
      headerConfig: getHeaderConfig(navCtx.toAppPath)
    });
  }
};
```

**Why a hook and not a function on the context:** `setup()` runs in the SSR V8 isolate; its context snapshot is JSON-serialized to the host, so a **function would be stripped**. Storing only the resolved object and refreshing it from `navigate()` (which fires on full _and_ shallow navigations) keeps the toolbar correct on every route without ever putting a function on the context. nav-layout subscribes to `navLayoutContext`, so each `.set()` re-renders it.

Per-page enrichment still works: a layout/page loader returning `{headerConfig: {...}}` as ordinary `loaderData` is scanned by nav-layout and ranks above `headerConfig`. `setHeaderConfig()` runtime updates are unchanged.

### Header-config data shape

`getHeaderConfig()` returns this object, or `null`. Every field is optional.

```js
{
  header: boolean,          // show the toolbar; defaults to false, true when l3 has tabs
  l3: [{label: string, path: string, id?: string}], // L3 tab definitions
  pageTitle: string,        // breadcrumb title, overrides the L2 nav label
  title: string,            // alias for pageTitle
  hideToolbar: boolean,     // suppress the toolbar entirely (e.g. a home page)
  transient: boolean,       // don't push onto the breadcrumb stack (e.g. modal flows)
  actionsDropdown: boolean, // show the actions dropdown on the right
  openInSidebar: boolean,   // open the page in the detail side panel
  metadata: [{label, iconName, iconClass?, textClass?}], // tag chips above the tabs
  icon: string              // icon override
}
```

---

## Migration steps

### Step 1 — find the legacy surface

`application.js`/`pages/` live under the app's configured `srcDir` (`aiux.json`; scaffolded as `src/lux`, but most existing apps predate `srcDir` and keep it unset, resolving to the project root). Resolve it the same way the build does rather than hard-coding a path:

```bash
SRC=$(jq -r '.srcDir // "."' aiux.json)

# Pattern A: per-page files (now-sdk build / aiux build both hard-fail on these)
find "$SRC/pages" -name "headerConfig.js" -o -name "headerConfig.ts" | grep -v node_modules

# Pattern B: the old named export (build hard-fails on it too) and the framework-injected context field
grep -rn "computeCurrentHeaderConfig" "$SRC"/application.* "$SRC/pages/"
grep -rn "ctx.headerConfig\|__LAYOUT_DATA__\['header-config'\]\|__runHeaderConfig" "$SRC/pages/" "$SRC"/application.*
```

### Step 2 — build the resolver in `header-config.js`

- Create `header-config.js` (or `.ts`) under `<srcDir>`, next to `application.js` (it's imported relatively via `./header-config.js`, so it lives alongside `application.js` wherever that is).
- Move the route → config logic into `getHeaderConfig(path)` — a function taking the route path string and returning a config object or `null`.
- Collapse Pattern A's per-page `getHeaderConfig({params})` bodies and Pattern B's `computeCurrentHeaderConfig` branches into this one resolver.
- Return a [header-config object](#header-config-data-shape), or `null` for routes whose toolbar a nav item or `setHeaderConfig()` owns. `null` is meaningful — it tells nav-layout "use the nav item" and clears any previous route's config.

### Step 3 — resolve in `setup()`, refresh in `navigate()`

- Import `getHeaderConfig` from `./header-config.js`.
- In `setup(ctx)`, set `headerConfig: getHeaderConfig(ctx.resolvedPath || ctx.pagePath)` on `navLayoutContext` (merge with the existing context value).
- Add a `navigate(navCtx)` hook that sets `headerConfig: getHeaderConfig(navCtx.toAppPath)` — `navCtx.toAppPath` is the fresh target route (the lifecycle `ctx.resolvedPath` is stale at navigate-hook time).
- **Delete** any `computeCurrentHeaderConfig` named export.

### Step 4 — clean up consumers

- Delete every `<srcDir>/pages/<route>/headerConfig.js`.
- Remove loader reads of `ctx.headerConfig`. A loader that wants to enrich should `return {headerConfig: {...}}` as loaderData, or import `getHeaderConfig` from `header-config.js` directly.
- Remove any direct reads of `__LAYOUT_DATA__['header-config']` — that key no longer exists.

### Step 5 — review (issue categories below) and report.

---

## Issue categories to check

### 1. Stale references to removed mechanisms

Flag (these now describe nothing that exists):

- `headerConfig.js` per-page files, or imports from a `./headerConfig` path
- `computeCurrentHeaderConfig` (the export, and any caller)
- `ctx.headerConfig` reads/writes in loaders
- `__LAYOUT_DATA__['header-config']`, `__runHeaderConfig`, `navLayoutContext.currentHeaderConfig`
- comments referencing any of the above

**Report:** file, line, the stale text, suggested replacement.

### 2. Both lifecycle hooks set headerConfig

The app must keep `navLayoutContext.headerConfig` (a resolved **object**, never a function) current from BOTH hooks:

- `setup(ctx)` → `getHeaderConfig(ctx.resolvedPath || ctx.pagePath)` — initial route (SSR + first paint).
- `navigate(navCtx)` → `getHeaderConfig(navCtx.toAppPath)` — every client URL change.

🔴 Missing `navigate()` → **stale toolbar after any CSR navigation** (the initial route's config sticks). 🔴 A function stored on the context (e.g. a leftover `headerConfigResolver`) → dead weight at best; it's stripped crossing the SSR isolate→host boundary. 🔴 `navigate()` using `ctx.resolvedPath` instead of `navCtx.toAppPath` → resolves the route being **left**, not entered.

### 3. Resolver input contract

`getHeaderConfig(path)` takes a single path string. Flag a resolver that still destructures `{pagePath, params}` or a ctx object — both call sites now pass a bare path (`ctx.resolvedPath || ctx.pagePath` in setup, `navCtx.toAppPath` in navigate). If a branch needs URL params, parse them from the path.

### 4. Route / config accuracy

For each branch in `getHeaderConfig`:

- Does the path condition correctly identify the page? (`[id]` → `:id`, `[table]` → `:table`)
- Does the returned config match what the legacy `headerConfig.js` / `computeCurrentHeaderConfig` branch produced (same `l3` tabs, `header`, `hideToolbar`, `transient`, `actionsDropdown`, `openInSidebar`, `pageTitle`/`title`)?
- Returning `null` where a nav item owns the toolbar — correct.

### 5. Missing routes

A legacy `headerConfig.js` or `computeCurrentHeaderConfig` branch with no corresponding branch in `getHeaderConfig` → that page gets no header config in BOTH SSR and CSR.

```bash
SRC=$(jq -r '.srcDir // "."' aiux.json)
find "$SRC/pages" -name "headerConfig.js" -o -name "headerConfig.ts" | grep -v node_modules  # must be empty
```

### 6. Tests

Flag tests importing `./headerConfig.js`, mocking `computeCurrentHeaderConfig`, or asserting on `ctx.headerConfig`. They should now import/mock `getHeaderConfig` from `header-config.js` and assert on the resolver output or on the `navLayoutContext.set(...)` call.

---

## Report format

Structured markdown, sections per file, severity labels:

- 🔴 **REGRESSION** — breaks the feature (e.g. missing `navigate()` refresh, missing route)
- 🟡 **WARNING** — needs developer verification (config mismatch, ambiguous route)
- 🔵 **INFO** — stale comment or minor cleanup

---

## What NOT to report

- Cosmetic formatting differences.
- Changes in files unrelated to header config.
- `header` defaulting to `false` for pages with no `l3` — expected, not a regression unless the page needs a toolbar.
