# Page Views — Pages Keyed by ServiceNow View, Not Route

**Use a view page when contributing or overriding the page ServiceNow renders for a `sys_ui_view` list/record surface** — not a custom, URL-addressable page. A view page has no route a user types; the platform's View Rule mechanism resolves the view first, and this convention supplies the page that renders once it has. For an ordinary routed page, use [`pages-cookbook.md`](pages-cookbook.md); for a routed page with audience-gated variants, use [`page-collections.md`](page-collections.md) — **don't conflate the view-page `_variants/` here with the page-collection `_variants/` there** — same folder name, different mechanism (see below).

---

## The convention

```
src/extensions/glide/list/<view>/view.js                     # default page — any table, unless overridden
src/extensions/glide/list/<view>/_variants/<key>/view.js     # per-table override(s)
src/extensions/glide/record/<view>/view.js                    # same shape, for record pages
src/extensions/glide/record/<view>/_variants/<key>/view.js
```

- `<view>` is the **literal `sys_ui_view` name** (a string, not a sys_id) — read directly from the folder segment. There is no `@view()` decorator to keep in sync with it.
- `list`/`record` sit as siblings to `glide/pages/`, not nested under it — an app can ship both view pages and ordinary routed pages under `glide/`.
- A view can have a default page with no overrides, overrides with no default, or both.
- `<key>` is a human-readable folder name only — resolution never looks at it, only at `@table([...])`'s contents.

## Decorators

```js
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
const {table} = decorators;
```

| Decorator | Effect |
| --- | --- |
| `@table([...])` | Non-empty array of table names. **Required** on every override page (`_variants/<key>/view.js`); **forbidden** on the default page (`glide/list\|record/<view>/view.js` directly) — the default must stay table-agnostic so it can serve as the fallback for any table. The build throws if you get this backwards. One override page can cover multiple tables — `@table(['incident', 'problem'])` — without duplicating the file. |
| `@order(N)` | Same decorator as [page collections](page-collections.md) — honored on both override and default pages, for cases where two rows might otherwise tie. |

## Walkthrough — default page + one table override

```js
// src/extensions/glide/list/ess/view.js — default, any table
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

@customElement('ess-list-default-page')
export default class EssListDefaultPage extends AIUXElement {
  render() { return html`<h1>Generic list</h1>`; }
}
```

```js
// src/extensions/glide/list/ess/_variants/incident/view.js — incident + problem
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
const {table} = decorators;

@customElement('ess-list-incident-page')
@table(['incident', 'problem'])
export default class EssListIncidentPage extends AIUXElement {
  render() { return html`<h1>Incident/Problem list</h1>`; }
}
```

## View-page `_variants/` vs page-collection `_variants/` — do not treat as the same mechanism

Both folders are named `_variants/` (formerly `_overrides/` and `_collections/`; the old names still build with a deprecation warning). Where the folder sits decides which mechanism applies:

| | `list\|record/<view>/_variants/<key>/` (view pages) | `pages/<route>/_variants/<key>/` (page collections) |
| --- | --- | --- |
| Route | None — resolved by `(view, table)`, not a route | Freezes and shares the sibling base page's route |
| Identity | Each override is its **own independent page**, bound to its own `@table([...])` | Candidates compete for the **same** route/identity |
| Selection | Runtime view-resolver matches `(view, table)`; table-specific rows always outrank the default's wildcard row | `@order()` then live ACL/role check picks first accessible candidate |

## What the build produces

Every view page compiles to a `sys_aix_page` + `sys_aix_widget` pair like any other page, but with a non-route `path_pattern` (`list/<view>` or `list/<view>/_variants/<key>` — no leading slash) used only for identification in admin tooling. View pages never enter the route-keyed manifest pipeline — they're built via their own Rollup pass.

Each view page gets at least one `sys_aix_view_widget` row: one per table for an override, and exactly one with `table = 'global'` (wildcard) for a default page. Table-specific rows always outrank the wildcard.

**`active` is always written explicitly, never left to the dictionary default.** An omitted boolean installs as blank, and the resolver treats blank as inactive — so a row relying on the default silently never resolves.

SSR is fully implemented: the build populates `isolate_compile_metadata` on the view widget record, which lets the runtime inject and server-render the external widget into the isolate at request time. Without it, the view appeared only after hydration. When the isolate has no source for the view, `<aiux-widget-ssr-loader>` falls back to rendering it client-side — and `aiux dev` always takes that path — so write view pages SSR-safe and don't read a clean local run as proof. Details in [`extensions.md`](./extensions.md) (*View pages are server-rendered when they can be*).

## Previewing views locally

A project that only contributes views needs a host to render them in. The `@servicenow/aiux` package ships Core UI prebuilt for this, and a project with `src/extensions/glide/`, no pages of its own and no `development.host` uses it automatically: run `pnpm dev`, with no host to configure and nothing to deploy. An explicit `development.host` still wins.

- Core UI is served from the package as is, never built or watched; only the project itself rebuilds on edits.
- The dev server reads the project's own `sys_aix_view_widget` rows from `dist-metadata/` and picks the winner with the same rules as prod, so each table shows the view prod would.
- Which view name a request gets still comes from the instance (`sys_ui_view`, View Rules). Open a page with `?sysparm_view=<view>` to reach one directly.
- The dev server server-renders the view the page picks, from the project's own server build, and runs its loader. Region widgets inside the view still render in the browser. It runs in plain Node, not prod's sandbox, so a clean local run is good evidence the view is SSR-safe but not proof.

## Known limitations

- **Don't rely on the view page's own `static async loader()`; islands aren't wired either.** The loaders of a view's region and nested widgets run alongside it, but the view page's own loader output did not reach it on the client-render path — `this.loaderData` was `{}` with `has_loader` set — and the server path is unverified. Take the page's data from the host context (`RecordContext`, `ListContext`); see [`extensions.md`](./extensions.md). Island deferral and chunk-dependency tracking are not wired — the bundling pass uses a reduced plugin set intentionally — so don't expect deferred island rendering.
- **`@acl()`/`@roles()` on a view page do nothing.** This is largely redundant by design: which view a request resolves to is decided by ServiceNow View Rules (`sysrule_view`), with the platform's own role and condition evaluation. A user can't reach a view their rules wouldn't give them. Karuna only reads the already-resolved view name.
- **`static prefetch(ctx)` is recorded but never runs.** The build detects it and writes it to metadata, but the runtime dispatches the prefetch phase off the matched route page (Core UI's list or record page), not the view page. A view page's data comes from the host context.
- **View-name uniqueness is unconfirmed.** The build never queries a live instance, so nothing validates that `<view>` matches a real `sys_ui_view` — that's on the author.

## Record view pages

A `record/<view>/` page renders inside Core UI's record route page, nested under `<aiux-record-provider>` → `<aiux-widget-ssr-loader>`. Two behaviors worth knowing:

- **Server-rendered when the isolate has its source, client-rendered otherwise.** See the SSR note above; write the page SSR-safe.
- **No inherited chrome.** Core UI's own Default view page owns `aiux-record-header` and the AI summary card — so an overriding view gets neither automatically. Re-render `aiux-record-header` in your own page if you want it.

### Base class — `AIUXRecordElement` (list pages: `AIUXListElement`)

Extend the provider-bound base from the package root, as [`extensions.md`](./extensions.md) describes; a record view page and its record widgets use the same one. Older SDKs can't resolve these package exports in the view-page build check (`findClassExtending`) or `widget-base-resolver.js`, and fail in two ways — the view page loudly ("does not export a class extending AIUXElement"), a widget silently (skipped with a clean build; the only symptom is the `Discovered N widgets` count being one short) — and the workaround there is `withRecordContext(AIUXElement)` with a directly imported `AIUXElement`. Either way, check the discovered-widget count after the build rather than trusting its exit code.

### Silent-failure traps

**Import record context from the package root, not the `/context` subpath.** Both `@servicenow/aiux/aiux-components-record` and `.../aiux-components-record/context` export `withRecordContext` and `RecordContext`, but each calls `createScopedContext()` in its own closure — they produce **unrelated contexts**. Core UI's provider comes from the root, so a widget importing the subpath reads a context nothing ever provides to: `_record` is permanently null, and `AIUXRecordElement` reports "must be used within AIUXRecordProvider" on an element that demonstrably is inside one.

## Review checklist (before opening the PR)

- Default page has **no** `@table()`; every override page **has** one, non-empty, with no `global` or empty-string entry
- View name (folder segment) matches a real `sys_ui_view` on the target instance
- Record view page class extends `AIUXRecordElement` (list: `AIUXListElement`), and the build's `Discovered N widgets` count includes every view page and widget
- Any record-context widget uses the package root import, not the `/context` subpath
- The page is SSR-safe (browser APIs behind `isServer`) and takes its data from the host context, not a `static loader`
- Don't reach for a view's `_variants/` when you actually want route-sharing variants — use [`page-collections.md`](page-collections.md) instead
