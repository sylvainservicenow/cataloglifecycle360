# Adding Extensions to an Existing App

Use this reference when the user's intent is to **overlay pages onto a host application** rather than add a page to the current standalone app. Extensions live in `<srcDir>/extensions/` and do not modify host application code. `<srcDir>` is the value of `srcDir` in `aiux.json` (scaffolded as `src/lux`). If `srcDir` is not set in `aiux.json`, extensions are the one exception to the usual project-root fallback: they live at `src/extensions/`, not project-root `extensions/`. Follow the normal UI discovery, accessibility, and internationalization gates. For editable widget regions, also read `../config-framework/regions.md`.

## When This Applies

- User says "add an extension page", "extend `<host app>`", "overlay a page on `<host>`", "create an extension for `<host-project-id>`"
- The target route belongs to a **different, existing host experience** — not a page under this app's own `<srcDir>/pages/` directory
- Distinguish from a normal BUILD-mode page: a normal page lives at `<srcDir>/pages/<route>/page.js` in _this_ app; an extension page lives at `<srcDir>/extensions/<host-project-id>/<host-basename>/pages/<route>/page.js` (or `<srcDir>/extensions/<experience-sys_id>/pages/<route>/page.js`) and targets a _host_ app.
- Distinguish from a **page collection**: an extension contributes a competing page from a _different scoped app_; a collection has several pages competing within **your own** app's `<srcDir>/pages/` tree. Both resolve through the same specificity → order → access machinery, so `@order()`/`@acl()` behave identically — see `references/app/page-collections.md`.

## Scaffolding Options

**Option A — Scaffold a new extension project from scratch:**

```bash
npx @servicenow/sdk@latest init --template javascript.aiux-extension
```

This scaffolds a complete extension project with `<srcDir>/extensions/`, `application.js`, a hello-world page, and `now.config.json` pre-configured.

**Option B — Add extensions to an existing AIUX application:**

If you already have a working AIUX app and want it to extend another host experience, no re-scaffold is needed. Just:

1. Create the `<srcDir>/extensions/<host-project-id>/<host-basename>/pages/<route>/page.js` directory structure
2. Optionally add a per-host lifecycle module at `<srcDir>/extensions/<host-project-id>/<host-basename>/application.js` for nav contributions
3. Build and deploy as normal — `pnpm build && pnpm run deploy`

The build auto-discovers `<srcDir>/extensions/` pages and emits the host-targeting records alongside your app's own pages. **Mixed projects are supported by current SDK builds:** with `aiux.json.basename` present, the app retains its own experience, theme, lifecycle, and page memberships; each extension page targets its host separately, even when both pages use `/home`. Older builds incorrectly assigned ordinary pages to the host and suppressed the local experience. Verify generated metadata with the consumer's installed build; do not assume a newer Karuna checkout proves its installed SDK has the fix. Do not upgrade pinned dependencies without approval.

### Preserve the host shell in a mixed project

A root `application.js` can also be registered as an extension lifecycle for the host. A standalone app's `navLayoutContext.set(...)` would then overwrite host navigation. Add a dedicated `src/extensions/<host>/application.js` so the build does not reuse the root lifecycle for that host. When no navigation contribution is wanted, this is sufficient:

```js
export default {
  setup() {}
};
```

**Check the generated manifest before relying on this.** On a build that predates the fix keeping extension lifecycle bundles out of the host app's isolate list, this module's isolate bundle is also appended to the app's own `dist/manifest.json` `isolateBundlePaths`. It and the root lifecycle end with the same `globalThis.__applicationModule = …` footer, and bundles load in list order — so the dedicated module loads last, overwrites the root one, and `__runSetup` runs this empty `setup()` as the base lifecycle. The app's own `setup()` then never runs and its experience silently loses whatever that contributed (no nav items, no logo), with no error in the console or the build. `isolateBundlePaths` must list only `isolate/application.js`; if it also lists `isolate/src/extensions/…/application.js`, the installed build lacks the fix. On such a build, omit the dedicated module and accept the root lifecycle being registered against the host — a host shell wearing the app's nav is recoverable, an app whose own `setup()` never runs is not.

Do not copy the standalone shell, theme, or `applicationLayout` into this module. Omit extension `layout.js` files when the page should inherit the host layout. Verify that the host's `sys_aix_experience_extension` row references this dedicated lifecycle, while the local experience still references the root lifecycle.

### Core UI home and numeric order

Core UI is a deployed scoped experience. Resolve the target instance's experience rather than assuming its sys_id from a different instance. With the project's configured SDK credential alias, these read-only queries establish the host and its current home order:

```bash
pnpm exec now-sdk query sys_aix_experience --query 'sys_scope.scope=sn_aixf' --fields sys_id,title --output json
pnpm exec now-sdk query sys_aix_page --query 'sys_scope.scope=sn_aixf^path_pattern=/home' --fields sys_id,title,order,active --output json
```

Use `--auth <alias>` if needed to select the intended instance. If multiple experiences are returned, resolve the intended one rather than choosing the first. Target its sys_id via `src/extensions/<experience-sys_id>/pages/home/page.js`; the existing host supplies navigation to `/home`.

**Higher numeric order is not higher priority.** Equally specific accessible candidates sort by ascending numeric order. Normal pages default to **100**; extension pages default to **10**. To deliberately put a demo after a host home at 100, declare **`@order(200)`**. To make it take precedence, choose a lower number instead. Respect which behavior the user requested; never silently invert a request for higher numeric order.

```js
import {decorators} from '@servicenow/aiux/aiux-components-core';
const {title, order} = decorators;
```

Place `@title('Demo Home')` and `@order(200)` below the topmost `@customElement(...)` decorator. The argument must be a numeric literal, not a string or computed expression. The page remains another `/home` candidate; a higher number does not create a new route or make it the default. Existing variant preferences and access checks can also affect selection. Do not deactivate the host page, change ACLs, or change the user's saved preference to force the demo to appear.

Extension pages are private to their host by default in current builds. Verification must check the emitted `sys_aix_page.order`, `private_experience`, and `sys_aix_experience_page_rel` memberships, not just successful compilation. Runtime selection and rendering still need authenticated verification after deployment.

### Missing picker or a picker that cannot switch

Do not infer picker behavior from a successful install. Verify an authenticated request to the host's `route-resolve` endpoint (Core UI: `/aiux/ui/route-resolve/home`) and the document response:

1. Confirm both active `/home` pages belong to the same experience via `sys_aix_experience_page_rel`.
2. Check `alternateMatches` **and** `currentMatch` in route-resolve JSON. The document equivalents are `window.__AIUX_ALTERNATE_MATCHES__` and `window.__AIUX_CURRENT_MATCH__`. Without both, the shell has nothing to offer in its picker.
3. Check the shell opt-out `features.pageVariantSwitcher === false` and the system property `aiux.nav.page_variant_switcher.enabled` (absent means enabled). Do not change these when the actual problem is missing candidates.
4. With diagnostic tracing enabled (`?dev=true`), `window.__AIUX_DECISION_TRACE__.route.pageModule.source === 'disk-fast-path'` and missing alternatives can indicate an old single-page manifest surviving a deploy. In local memory-cache development, restart the combined launcher with permission to clear generated runtime manifests and reload the instance. A browser refresh alone does not do that. The Valkey-only `/api/cache/evict/tenant` endpoint is not registered in memory-cache mode; the development `/api/cache/evict` endpoint clears memory, not the persisted route manifest. Do not promise automatic deployment invalidation in every local setup.
5. Retest explicit requests for **each** page using `sysparm_collection_page=<page-sys_id>`. Legacy builders can emit an active `sys_aix_page_route_map` direct override even alongside correct page memberships. A trace with `pageModule.source === 'route-map'` and the same winner for both requested variants proves that override is bypassing normal selection. Changing the page's numeric order does not fix it.

A legacy route-map record can be deactivated with explicit approval while retaining page memberships, but an old builder may reactivate it on the next deploy. The durable solution is a separately approved build-tool upgrade/migration that no longer emits that override. Do not delete pages, lower their order, bypass ACLs, or edit security controls to make the picker work. On the inspected platform, route-map table writes require `aix_exp_admin`, and the `active` field has an `aix_config_admin` role gate. If an update returns 403, stop and request an authorized session or an owner-performed update; a saved alias named `admin` is not proof of write access.

Current nav renders a **`View (Dev): <page title>`** flyout in the contextual header, not a native select plus a separate Load button. Older nav releases used the select/Load design. Name the control actually shipped by the running host when giving the user instructions.

## Path Conventions

Three equivalent formats — all discovered identically. A single project can mix conventions across hosts.

**Convention 1 (project id + basename — familiar):**

```
<srcDir>/extensions/<host-project-id>/<host-basename>/pages/<route>/page.js
<srcDir>/extensions/sn_app_aict_ui/aict/pages/home/page.js
```

`<host-project-id>` is the host project's `projectId` from its `aiux.json`. A host created before `aiux.json` had a `projectId` uses its scope as its project id, so its directory name is the scope (e.g. `sn_app_aict_ui`). Look a host's project id up rather than deriving it from the scope or package name, since its form depends on how the host was created. On the instance, it's the experience's `source_aix_project.project_id`:

```bash
pnpm exec now-sdk query sys_aix_experience --query 'url_suffix=aict' --fields sys_id,title,source_aix_project.project_id --output json
```

**Convention 2 (direct sys_id — explicit):**

```
<srcDir>/extensions/<experience-sys_id>/pages/<route>/page.js
<srcDir>/extensions/2f86ed94fdab96a806bbbb5b8573c5d5/pages/home/page.js
```

**Convention 3 (the `glide` alias — for the Glide experience only):**

```
src/extensions/glide/pages/<route>/page.js
```

`glide` is a literal directory name that resolves to `GLIDE_EXPERIENCE_SYS_ID` (`4f3d8d0ecda0d19c568d19a5c25422c0`, the Core UI / Glide experience). Prefer it over convention 2 for that host: same records, same identity, a directory name a human can read. Record identity keys off tag names and the resolved host sys_id, not the directory name, so **renaming an existing `src/extensions/4f3d8d0ecda0d19c568d19a5c25422c0/` to `src/extensions/glide/` changes no `nowIdKey` and orphans nothing** — verify with a build diff of `src/fluent/generated/keys.ts` before and after.

Do **not** keep both. Two directories resolving to the same host experience produce page records with identical identity keys; discovery throws `src/extensions/<a>/pages/ and src/extensions/<b>/pages/ both contribute pages to experience <sys_id>. Use one directory per host experience.` The same guard covers a duplicated `application.js`.

The depth is decided by the first segment alone: a 32-char sys_id or the `glide` alias is a root in its own right and is never read as a project id. A wrong nesting level is a wrong host, so both malformed shapes (`<host>/<x>/pages/` and `<project-id>/pages/`) throw rather than being skipped.

**Key:** extension pages use `page.js` (not `index.js`). The route is derived from the directory path, not the filename.

If the host project id/basename/sys_id is unknown and cannot be inferred from the workspace (e.g. an existing `<srcDir>/extensions/` sibling), ask the user before scaffolding.

## View Pages (`list/<view>/`, `record/<view>/`)

A second, separate convention under the same extension roots. A **route page** answers "what renders at this path"; a **view page** answers "what renders for this table in this UI view". View pages have no route at all — their position on disk is their entire binding.

```
src/extensions/glide/list/<view>/view.js                      # default: table = 'global' wildcard
src/extensions/glide/list/<view>/_variants/<key>/view.js     # table-specific, needs @table([...])
src/extensions/glide/record/<view>/view.js                    # same, for record pages
```

- `<view>` is the **`name` of a `sys_ui_view` record** (e.g. `high_priority`, `ess`), not its title. The runtime looks the widget up with `getPageViewWidget(view)` against that name, so the folder name and the view's `name` field must match exactly. A `view.js` directly under `list/` with no view segment is a build error.
- Only `view.{js,ts}` and a `_variants/` folder are allowed at the `<view>/` level; any other directory there throws. `_variants` must hold at least one `<key>/view.js` — an empty one is a build error — but needs no sibling default page.
- The class must extend `AIUXElement` from `@servicenow/aiux-components-core` (the `@servicenow/<karuna-pkg>/aiux-components-core` subpath form is accepted too). The element tag comes from `@customElement`.
- `@table([...])` (from `decorators`) is **required on an override page and forbidden on a default page** — both are build errors the other way round. `global` and `''` are rejected as table names: they would collide with the default page's own wildcard row and be silently treated as the default.
- `@order(N)` is optional and breaks ties between competing overrides; it defaults to 100.
- **Don't give a view page a `static loader` or `static prefetch`; take its
  data from the host.** On the client-render path (see the next bullet) a
  declared loader leaves `this.loaderData` empty (`{}`), with no build error
  and no runtime warning, and `static prefetch` never runs at all. A declared
  loader also costs time: the client waits out a full 5-second timeout for it
  before the page's client-side loaders run. Page data reaches a view page
  through the host's context instead — `ListContext` or
  `RecordContext` — which is the point of the two sections below.
- **View pages are server-rendered when they can be, so write them
  SSR-safe.** Core UI mounts the resolved view page through
  `<aiux-widget-ssr-loader>`. When the view's source is available on the
  server, the page renders there, inside the loader's declarative shadow root,
  and hydrates. When it is not — the service logs *"discovered widget isolate
  source unavailable — those widgets stay CSR"* — the loader server-renders a
  `<slot>` placeholder and the page renders on the client instead. Guard
  browser APIs with `isServer` exactly as on a route page. Record pages mount
  their view this way, and Core UI list pages checked in September 2026 do
  too, though some Core UI builds defer a list page's view render to the
  client. Look for
  `<aiux-widget-ssr-loader …><template shadowrootmode="open">` in the page HTML
  to tell which you have. Two things hide this from you:
  - **`aiux dev` never takes the server path.** A view page that is not
    SSR-safe passes locally and fails in production.
  - **An older runtime can't hydrate the placeholder.** There, a view that
    falls back to the client leaves the list or record area blank, with a *Hydration Mismatch* on the
    loader whose server digest is `Pz0gobCCM4E=` — the digest of
    `<slot></slot>`. If you see that, the installed
    `@servicenow/aiux-components-widget-loader` predates its client-render
    fallback; it is not your page.

Each view page emits three records: a `sys_aix_page` (its `path_pattern` is a non-route label like `list/high_priority/_variants/incident`, for admin tooling only — nothing matches it as a route), a `sys_aix_widget`, and one `sys_aix_view_widget` row **per table declared** (or exactly one `table: 'global'` row for a default page).

Runtime resolution, per `(table, type)`: table-specific rows outrank `table: 'global'` wildcards; within a tier, `order` ascending then `sys_id`; the first row per view wins; `active === false` rows are skipped so the next sibling can win. The service only prefetches this map for routes under `/list/` and `/record/`, seeding `window.__PAGE_VIEWS_DATA__`.

**The view name is resolved by Glide's View Rule engine, not by Karuna.** Searching this repo for the consumer is misleading: the only `getPageViewWidget` callers here are in the record package (`formDataSourceDef.ts`, `form-builder-api.ts`), because the list consumer ships with Core UI, which is not in this repo. Both types are wired.

**Confirm a row resolves with the service's own endpoint**, rather than inferring it from a clean build or hunting for the consumer:

```bash
# both services answer; core-ui serves /aiux/ui/*
curl --http2-prior-knowledge 'http://localhost:3001/page-views?table=incident&type=list'
# {"pageViews":{"high_priority":{"tagName":"…","scopeName":"…"},
#               "Default view":{"tagName":"core-ui-list-default-view","scopeName":"sn_aixf"}}}
```

It returns the live `(view → widget)` map for that `(table, type)` — the same data seeded into `window.__PAGE_VIEWS_DATA__`. A view page's own key appearing there proves the row resolved.

**A view page only renders when the resolved view matches its key.** With no `sysparm_view` in the URL the view resolves to the Default view (whose key in that map is the literal string `Default view`), so a page keyed on any other view never matches, no matter how correct its row is. Links that need a specific view page must name it: `sysparm_view=<name>`, plus `sysparm_view_forced=true` to suppress a saved `<table>_list.view` preference that would otherwise outrank the request. Overriding the `Default view` key instead makes the bare URL work, but a table-specific row there outranks the host's `table: 'global'` wildcard and takes over **every** list of that table in the default view — rarely what is wanted.

**Wiring the view itself.** A view page selects a view; it does not create one. Declare the view and its column layout in Fluent so both the host list and any standalone app page can use it:

```ts
// src/fluent/<name>.now.ts
import {List, Record} from '@servicenow/sdk/core';

export const highPriorityView = Record({
  $id: Now.ID['high priority incident view'],
  table: 'sys_ui_view',
  data: {title: 'High priority', name: 'high_priority'}
});

export const highPriorityIncidentList = List({
  table: 'incident',
  view: highPriorityView,
  columns: ['number', 'priority', 'state', 'short_description'] // array order = column position
});
```

`List()` emits `sys_ui_list` plus one `sys_ui_list_element` per column, and its ids are derived (its `$id` is deprecated — omit it). `sys_ui_list_control` is typed in Fluent too, as a generic `Record({table: …})` call.

`Form()` is the record-page analogue of `List()`, and for a `record/<view>/` page it is **load-bearing rather than cosmetic**. `aiux-record-form` renders this layout, and `FormAPI`'s `getValue()` / `getDisplayValue()` read from the *form layout's* record values — not from the raw record — so **a field that is not on the form reads back `null` however populated the record is**. Any widget on the page that inspects a field needs that field declared here, or its behaviour silently disappears. `Form()` takes no `$id` (ids are derived, as with `List()`) and emits `sys_ui_form` + `sys_ui_form_sections` + `sys_ui_section` + `sys_ui_element`:

```ts
export const highPriorityIncidentForm = Form({
  table: 'incident',
  view: highPriorityView,
  sections: [
    {
      caption: 'Incident',
      content: [
        {
          layout: 'two-column',
          leftElements: [{type: 'table_field', field: 'number'}],
          rightElements: [{type: 'table_field', field: 'priority'}]
        }
      ]
    }
  ]
});
```

**What makes a view page conditional: the view rule.** A view page carries no condition and cannot inspect the record — it binds to `(table, view, type)` and nothing more. The view is chosen by Glide's View Rule engine, so any "show this page only when the record looks like X" requirement lives in a `sysrule_view` row. Note the table name: **`sys_ui_view_rule` does not exist** and the Table API rejects it. There is no typed Fluent builder, so use a generic `Record({table: 'sysrule_view'})`:

```ts
export const highPriorityIncidentViewRule = Record({
  $id: Now.ID['high priority incident view rule'],
  table: 'sysrule_view',
  data: {
    name: 'High priority incident view',
    table: 'incident',
    view: 'high_priority', // a plain string — the view NAME, not a sys_ui_view reference
    condition: 'priority<=2^EQ', // encoded query + the condition builder's trailing ^EQ
    device_type: 'browser',
    overrides_user_preference: true,
    order: 100,
    active: true
  }
});
```

Field notes, all verified against the dictionary: `view` and `condition` are plain strings (`view` is the view's `name`; `condition` is an encoded query carrying the condition builder's `^EQ` terminator, e.g. `priority<=2^EQ`). `sysrule_view` extends `sysrule`, which is where `order`, `name`, and `description` come from — they are not on `sysrule_view` itself, so a dictionary query filtered to `name=sysrule_view` appears to be missing them. `overrides_user_preference` decides whether the rule outranks a user's saved view preference or loses to it; for a deterministic demo you want it `true`.

**Scope the side effect before adding one.** A view rule is a *platform* mechanism, not a Core UI one: every surface that resolves a form view for that table — Core UI, the classic UI, mobile — starts resolving the rule's view for matching records, for every user. That is usually the point, but it is a much wider blast radius than the view page it exists to activate, so say so rather than presenting it as a local change. Without a rule, the view page is only reachable by a URL that names the view explicitly.

### List view pages and list context

A `list/<view>/` page renders inside Core UI's list route page, which owns the
list outright. Its `loader()` reads the sysparms, resolves the effective view,
registers the column-width preference key, calls `ListDataManager.fetch()` and
publishes all of it into `listContext`; its `render()` then wraps every
page-view widget in the provider that consumes that context:

```
<aiux-list-provider id="core-ui-list">   ← owns the ListController: rows, paging,
  <cb-store-provider>                       sorting, selection, UI actions, live updates
    <aiux-widget-ssr-loader>              ← mounts the view page by tag + scope
      <your list view page>               ← composes the provider's leaves
```

So a list view page **composes, and fetches nothing**. This is the list
counterpart of the record rule below, and it is the easier one to get wrong,
because the standalone recipes in `pages-cookbook.md` (§ *Generic List Page*,
§ *Scoped List Page*) are correct for a route page you own and look like they
should apply here. They do not. `ListDataManager.fetch()` in a `static loader`
plus an `<aiux-list-connected>` in `render()` is the shape to avoid; what it
produces is:

- **A second `ListController` over the same table.** `<aiux-list-connected>`
  constructs its own, so the page ends up with two queries in flight, two
  selection states, and two registrations in the page-wide UI-action registry.
- **A loader you can't rely on, so no data and no query.** Per the bullet
  above, a view page's `this.loaderData` comes back empty, so the
  `.data`/`.query` passed down are `undefined` — which means the nested list
  silently client-fetches everything a second time and drops the incoming
  `sysparm_query` on the floor.
- **URL sync driven by the wrong list.** `aiux-list-connected:*` events are
  dispatched `bubbles: true, composed: true`, so they cross the shadow
  boundary and reach the handlers Core UI bound on `<aiux-list-provider>`. The
  host rewrites the URL from the nested list's state while its own provider
  holds different state. Declining to sync the URL from the view page does not
  avoid this; not creating a second list is what avoids it.
- **Every host-resolved option discarded.** `useUIActions`, `coreUIPage`,
  `useNavHeader`, `showSplitViewButton`, `layouts: 'all'`,
  `live-updates="manual_refresh"`, `preference-key` (persisted column widths),
  `firstRow`, `recordCountLimit`, the `sysparm_title` heading, and the
  `filterPinned` / `filterOnly` / `saveFilterHidden` / `disableSort` /
  `omitGlobalOr` filter sysparms all arrive on the provider and reach nothing.

**Recommended: extend `AIUXListElement`, just as a record view extends `AIUXRecordElement`.** Both inherit `AIUXElement`, subscribe to the host's scoped context, and require their provider. Compose the existing leaves; do not introduce another provider or list controller. A headerless page can be as small as:

```js
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {decorators} from '@servicenow/aiux/aiux-components-core';
import {AIUXListElement, listViewStyles} from '@servicenow/aiux/aiux-components-list';
import listBanner from '../../../../../../../regions/core-ui-list/banner.js';

const {table} = decorators;

@customElement('x-acme-incident-list')
@table(['incident'])
export default class IncidentList extends AIUXListElement {
  static styles = [listViewStyles, css`:host { min-width: 0; }`];

  render() {
    return html`
      <div class="list-banner">${listBanner()}</div>
      <div class="list-row">
        <div class="list-column">
          <aiux-list-body></aiux-list-body>
          <aiux-list-pagination></aiux-list-pagination>
        </div>
        <aiux-list-split-view></aiux-list-split-view>
      </div>
    `;
  }
}
```

`listViewStyles` is a newer export: verify the target runtime has it. On older list packages, keep the equivalent flex rules shown below rather than importing a missing export. Neither the page nor a banner widget needs to hard-code the provider id. A context-aware banner widget extends `AIUXListElement` too and reads `this._list.state` / `.api`; the region needs only its tag and import, not page-derived properties. Reserve `withListContext(OtherBase)` for a different base or intentionally optional provider placement.

When omitting the header, omit its `<cb-store-provider>` and condition-builder import too. This removes the in-list title, search, filters and column controls, not the host's incoming query or the grid's own column headers. Keep pagination unless its removal is explicitly requested.

**The configuration pencil is independent of the list header.** The global config editor offers it when the user's normal config-admin role check passes and the scanner discovers an editable region or configurable instance. A custom Core UI view's region owner must match the current `__AIUX_INJECTABLE_WIDGETS__.view` registry; `__PAGE_VIEWS_DATA__` is retired and is not emitted by current SSR. If the region marker and page widget ID exist but the editor reports zero entries, inspect that ownership lookup before adding a custom button, fake configuration properties, or changing permissions. A fix in `components/config-editor` needs the shared browser bundle refreshed, not just an app deployment.

**The leaves.** `@servicenow/<karuna-pkg>/aiux-components-list` exports four
provider-bound components. Importing the package root registers all of them as
a side effect:

| Element | Renders |
| --- | --- |
| `<aiux-list-header>` | Title, count, search, condition-builder and edit-columns buttons, batch-actions bar |
| `<aiux-list-body>` | The grid itself (or gallery/kanban layout) and the display-preferences panel |
| `<aiux-list-pagination>` | The pagination footer |
| `<aiux-list-split-view>` | The split-view record preview and its resize separator |

They need no props to work: each resolves rows, columns, paging and selection
from the provider. `<aiux-list-header>`'s display toggles (`heading`,
`show-count`, `show-refresh-button`, `show-readable-fixed-query`, …) are
settable on the leaf, and each falls back to the provider's `listOptions` when
unset — so **leave a toggle off to inherit the host's**, and set it only when
the view genuinely wants something different. Setting `heading` yourself, for
instance, overrides the `sysparm_title` the URL supplied.

**Wrap the header in `<cb-store-provider>`.** The header's filter-overview pill
needs the condition-builder store and logs *"Ensure cb-filter-overview is
rendered inside a cb-store-provider"* without it. `<cb-store-provider>` is
`display: contents` and takes the table:

```js
import '@servicenow/<karuna-pkg>/aiux-components-condition-builder';
// …
html`<cb-store-provider .tableName=${listContext.get()?.table ?? ''}>
       <aiux-list-header></aiux-list-header>
     </cb-store-provider>`
```

**Reading the page-level config: `listContext`.** Read `listContext.get()`. It
carries `table`, `view`, `query`, `fixedQuery`, `pageSize`, `firstRow`,
`title`, `preferenceKey`, the filter sysparms, and the raw `data`.

`listContext` is **ambient, not scoped**, and that difference is the whole
reason this section reads differently from the record one below. It is a plain
`createContext('list', null)`: the context self-registers in a module-global
registry when the list package loads, the host's loader writes a value into
that slot, and `get()` is a module-level read (request scope under SSR, the
global value on the client). Nothing registers as a consumer and nothing gates
access — so a list view page **already has** the context whether or not it
declares anything. `static contexts = [listContext]` buys exactly one thing:
`subscribeToContexts` calls `ctx.subscribe(() => requestUpdate())`, so the
element re-renders when the host republishes. Declare it (Core UI's default
view does) — it is one line, and it is load-bearing for a **default**
`list/<view>/view.js`, whose single `table: 'global'` element can outlive a
client-side navigation from one table to another. For a
`_variants/<table>/` page reading only invariant values it changes nothing.

> **Separate live state from host page configuration.** `AIUXListElement`
> is the recommended provider-bound page/widget base. Its `_list` is
> the scoped live `{state, api}` surface. `listContext` is the ambient loader
> configuration, not the source of live filter changes. Newer packages also
> expose `AIUXListPageElement` / `withListPageContext`, `_listPage`, and
> `resolveListFilterOptions` for host page options. These are separate tools,
> not replacements for the live record-list base. A headerless composition
> needs no page-config accessor at all. If an `AIUXListElement` subclass
> also reads `listContext`, preserve its inherited subscription with
> `static contexts = [...AIUXListElement.contexts, listContext]`.

Two subtleties that make this work at all, both worth knowing before debugging
a null context:

- **Bundle identity is not a problem here, unlike the record `/context` trap
  below.** Both Core UI's client bundle and an app's view-page bundle import
  the list package from the same shared asset (`/aiux/assets/core/list.js` in
  the rendered output), so it is one module instance and one `listContext`.
  Confirm it the same way — `grep -o 'from"[^"]*"'` over both built bundles —
  rather than assuming it.
- **The context is there before the page renders, on either path.**
  `listContext` is serialized with the host's SSR output, so its value is
  already on the client whether the view page was server-rendered or renders
  client-side after an isolate miss (see *View pages are server-rendered when
  they can be*, above). No guard for "data not there yet" is needed beyond the
  usual `?.`/`?? {}`.

`ListContext` is the *other* context, and a different tool: it is scoped
and carries the curated live `{state, api}` surface — table, query, fixed
constraints, rows, selection, `api.reload()` and `api.setPage()`. Consume it
through `AIUXListElement`; use the nullable `withListContext`
mixin only when required. Neither requires a provider id. Do not reach into
the private ListController. For aggregate charts, `rowDefinitions` is only
the loaded page, and `resolvedQuery` contains user conditions plus sort/group
instructions, **not** `fixedQuery`. Use the current conditions plus all fixed
constraints in a separate authenticated aggregate request, preserve `^NQ`
semantics, and suppress requests while the host is filter-only, loading or
failed. Aggregate requests do not create another list controller.

**The layout CSS is load-bearing.** The grid's scroll container has to be
bounded or the list stops scrolling and pagination is pushed out of view. The
chain Core UI's own default view uses, and the reason for each part:

```css
:host { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; }
/* Always a row: <aiux-list-split-view> is display:contents and renders nothing
   while closed, so it contributes no box and a row with one flex:1 child lays
   out identically to a column. The page never consumes split-view state. */
.list-row    { display: flex; flex-direction: row;    flex: 1; min-height: 0; }
/* min-width:0 is what lets the panel shrink the list column — without it the
   grid's intrinsic width wins and the panel can never open. */
.list-column { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; }
```

Inside `.list-column` the leaves need nothing: `<aiux-list-body>` is
`flex: 1 1 auto; min-height: 0` on its own `:host`, and
`<aiux-list-pagination>` is `display: block` and sizes to content.

**Do not put the list body in a `regions/` file.** A region is the right home
for a self-contained widget — a banner above the list, say — and the wrong one
for the grid, because the region primitives deliberately impose a box the grid
cannot accept:

- Every primitive carries `overflow-hidden`; by design "a region never produces
  scrollbars incidentally" and the one sanctioned scroller is `<column scroll>`.
  `<aiux-list-body>` owns the grid's scroller, so a region clips it.
- A `<column>` normalizes each widget child with
  `[&>:not(div)]:block [&>:not(div)]:w-full [&>:not(div)]:overflow-hidden`.
  Outer-tree rules beat a shadow root's own `:host` rules, so that
  `display: block` replaces `<aiux-list-body>`'s `:host {display: flex; flex: 1
  1 auto; min-height: 0}` — the box it needs — and the clip cuts its cell
  editors and column menus.
- `*:grow` puts `flex-grow: 1` on every child, so a banner or a pagination bar
  sharing a column with the grid takes a share of the free space instead of
  sizing to content.

Core UI's `core-ui-list-default-view` keeps the header, body, pagination and
split view in `render()`; only an empty `list-body` region sits above the grid.
Don't copy an older shape that puts the body in a region: `<stack>` is now
deprecated and expands to `<row><column span=${12}>`, which adds a
`grid grid-cols-12 overflow-hidden` wrapper on top of everything above. Keep
the header, body, pagination and split view in `render()`.

**Replacing the built-in split view with your own panel.** Every built-in
split-view path — the row's *Open in split view* action, a cell click opening
the panel, the panel itself and the `sysparm_show_split_view` deep link — is
gated by one provider option, `listOptions.showSplitViewButton`. With it off,
the list puts an *Edit* row action in that action's place, gated by
`showEditRowAction`. To drive a panel of your own:

- **Leave `<aiux-list-split-view>` out of `render()` and turn both options
  off.** A view page has no supported way to set the provider's options yet,
  so the one lever is the host's `listContext`:
  Core UI's list loader writes `listOptions: {showSplitViewButton: true}` into
  it on every load and builds the provider's options from it on every render.
  So write the two options back from `connectedCallback()` and again from
  `updated()` — declare `static contexts = [...AIUXListElement.contexts,
  listContext]` so a republish lands there — and only when they differ, or
  the write loops. Treat it as a stopgap: it reaches into the host's page
  configuration.
- **Listen for the grid's own events on the page.** `<aiux-list-body>`'s grid
  dispatches them `bubbles: true, composed: true`, so they reach the page
  element:
  - `aiux-list:cell-clicked` — `detail: {rowKey, columnKey}` — open the panel
    for `rowKey`.
  - `aiux-list:row-focused` — `detail: {rowKey}` — move an open panel as the
    user arrows through the grid.
  - `aiux-list:context-action-clicked` —
    `detail: {actionItem, context: {row}}` — your own row action, below.

  `rowKey` is the record's sys_id for a data row; group headers and the insert
  row carry other keys, so check it is one before using it.
- **Give keyboard users a row action.** A cell click is not
  keyboard-operable: Enter on a focused cell opens the inline editor. Build
  `{listActions: {actionDefinitions: {[KEY]: {key: KEY, label, icon, action:
  KEY}}, rowActions: {default: [KEY]}}}` once, as a class field, and pass it
  as `.customActions` to `<aiux-list-body>` — an inline literal in `render()`
  is a new object every render, and its identity has to stay stable. The
  action's clicks arrive as `aiux-list:context-action-clicked` with
  `detail.actionItem.action === KEY`. The provider's action controller ignores
  actions it doesn't know, but stop propagation on yours anyway.
- **`.clickableTextEnabled=${false}` on `<aiux-list-body>`** renders the
  display column as plain text instead of a record link, so a click anywhere
  on the row is a cell click. Put the way to the full record in your panel.

**Read the reference implementation.** `core-ui-list-default-view` is the
canonical consumer — the widget Core UI renders when no custom view page
claims the view — and it is on disk in any workspace that has run the dev
server:

```bash
# the host's list route page + its default view, as shipped
sed -n '1,120p' .aiux-runtime/<host>/ui/dist/server/isolate/pages/list/_table_/page.js
```

It shows the provider's full prop list, the nine `aiux-list-connected:*`
handlers the host binds, the `filterOptions` derivation from the filter
sysparms, and the CSS above with its rationale. Its tag name also appears in
the `/page-views` output quoted earlier in this section, which is how you can
tell a list has fallen back to it rather than resolving your page.

### Record view pages and record context

A `record/<view>/` page renders inside Core UI's record route page, which wraps every page-view widget in the record provider:

```
<aiux-record-provider>          ← owns the fetch, provides RecordContext
  <core-ui-record-layout>
    <aiux-widget-ssr-loader>    ← mounts the custom page-view widget by tag + scope
```

So a record view page — and anything it renders — reads the live record off `RecordContext` and must not fetch it. Two consequences worth knowing before writing one:

- **It is server-rendered when the isolate has its source, and client-rendered otherwise** — see *View pages are server-rendered when they can be*, above. Write it SSR-safe, and don't take a clean `aiux dev` run as proof that it is: `aiux dev` always takes the client path.
- **It inherits no chrome.** Core UI's own `Default view` page owns `aiux-record-header` and its AI summary card, precisely so an overriding view can change or drop them — which means a custom view gets neither automatically. Re-render `aiux-record-header` if the page should still look like a record page.

**Use the same base class for the page and its provider-bound widgets: `AIUXRecordElement`.** The list counterpart is `AIUXListElement`. Import from the package root shared with the host and compose the provider-bound leaves. The accessors `_record` and `_list` throw outside their providers: optional chaining does not make an invalid placement safe. Read context during render/update, not construction or custom-element connection.

Use `withRecordContext(OtherBase)` only when a different base is needed or a missing provider is an intentional supported state. In that optional case the mixin accessor returns null and should be guarded. Do not choose a mixin merely to appease an old build walker.

**Build compatibility: verify the base class was discovered, not only the exit code.** Older SDKs required a bare `AIUXElement` import for view pages, and silently dropped widgets extending a packaged context base when the meta-package had import-only exports. The corrected SDK follows exported base ancestry for view pages and widgets, resolves the exact meta-package subpath to its entry directory, and walks its source barrel. Check the widget count, each expected `sys_aix_widget` record and both view mappings. A published SDK may predate the fix; report that version requirement instead of presenting the mixin workaround as the recommended design.

Recommended record widget:

```js
import {AIUXRecordElement, RecordAPIKey} from '@servicenow/aiux/aiux-components-record';

export default class MyRecordWidget extends AIUXRecordElement {
  static requiredAPIs = [RecordAPIKey.Form];
}
```

The recommendation applies to standalone component packages and both meta-package forms (`@servicenow/aiux/...` and `@servicenow/karuna/...`). Ensure the runtime also exports the selected class; a sibling source checkout alone does not update the served component bundle.

**Trap 2 — import record context from the package root, never the `/context` subpath.** Both `@servicenow/aiux/aiux-components-record` and `.../aiux-components-record/context` export `AIUXRecordElement`, `withRecordContext`, and `RecordContext`, but they are **separate bundles that each call `createScopedContext('record-context', null)`**, and that factory holds its provider/consumer registries in per-call closures with no name-keyed global dedupe. Two calls therefore produce two unrelated contexts. Core UI's `<aiux-record-provider>` comes from the root bundle, so a widget importing the subpath consumes a context nothing ever provides to: `_record` is null forever, and with `AIUXRecordElement` that surfaces as "must be used within AIUXRecordProvider" on an element that is demonstrably inside one. Match the provider's bundle — the root.

**Put the body in an editable region.** A view page can use the `regions/` mechanism exactly like a route page, and Core UI's own `Default view` record page does — its entire body is `regions/record/body.ts`. Two things specific to doing it from a view page:

- **The relative path is seven `../`.** From `record/<view>/_variants/<key>/view.js` back to the project root's `regions/`, that is `../../../../../../../regions/<dir>/body.js` — two deeper than the `pages/<route>/` forms, since a view page has no `pages/` segment. The full depth table is in `../config-framework/regions.md#relative-import-depth`. Getting it wrong fails the build loudly (`Could not resolve …`), so it is self-correcting, but count the segments rather than copying a route page's path.
- **The literals-only rule decides the page/region split for you.** Region interpolations must be literals, so nothing in a region can read page state. On a record page that line falls in a convenient place: `aiux-record-form`, `aiux-record-related-links`, `aiux-record-related-lists` and any `AIUXRecordElement`-style widget all resolve the record, edit mode and hide flags from `RecordContext` themselves, so they drop into a region unchanged. What cannot go in is anything prop-driven from the page — notably `aiux-record-header`, whose `?compact` flag comes from the page's own ResizeObserver. Keep the header in `render()` and the body in the region, which is exactly how Core UI splits it.

**Reading fields.** `this._record.apis.form` exposes `getValue(field)` / `getDisplayValue(field)` plus `table`, `sysId`, `view`, `isValidRecord`, `isNewRecord`. Declare what the widget needs via `static requiredAPIs = [RecordAPIKey.Form]` — `withRecordContext`'s `connectedCallback` forwards it to `registerAPIs()`, which matters under a provider that narrows the API set (Core UI's registers all of them). Remember from the `Form()` note above that these read the form layout, not the record, so pair every field read with a field on the form and guard for `null`.

**Saving from a control of your own.** To edit a few fields in place — a compact form beside a list, say — render `<aiux-record-provider>` (connected mode: `table`, `.sysId`, and `forced-view-name` for a view whose `Form()` holds just those fields) around `<aiux-record-form>` and your own Save button, rather than writing through the Table API: the form brings the platform's controls, mandatory checks, client scripts and ACL-driven read-only fields. Three things to get right:

- **Don't disable Save until the form is dirty.** A field commits its value, and `apis.form.isDirty()` turns true, on the field's `change` event — which fires as focus leaves the field, during the mousedown on your Save button. A button disabled until then swallows the very click that saves the edit. Keep it enabled and check `isDirty()` in the click handler instead.
- **`apis.form.save()` rejects with `FormValidationError`** (exported from the package root) when a mandatory check fails; the form shows the field messages itself, so only say what to do next. Success is reported through the provider's `formHandlers.onSubmitSucceeded(true)` — keep that object's identity stable across renders, or the provider re-initializes the form.
- **Hide Save when nothing is writable.** A user without write access gets every field with `readonly: true` in `apis.form.fields` — check that rather than the user's roles.

**Importing an app-owned widget from an extension page.** Use the glide-widgets specifier instead of a deep relative path:

```js
import '@servicenow/glide-widgets/<ownScope>/<tag>';
```

The build normalizes both directions — prod rewrites a relative app-widget import to this form (then externalizes it to `/aiux/shared/widgets/<scope>/<tag>.js` so the widget's own record serves the code), and dev serve rewrites this form back to a relative path. The two are interchangeable and produce byte-identical output; the specifier just avoids the `../` chain, which runs seven deep at `list/<view>/_variants/<key>/`.

One asymmetry: a route page's record carries `standalone_widget_deps` in its compile metadata, which is what makes prod preload the widget graph. A **view page's record carries none**, under either import form — consistent with view pages' reduced bundling scope (`dependent_widget_ids` and chunk records are intentionally omitted for them). The import still resolves at runtime; it is simply not preloaded.

## Key Concepts

- **Pages = Lit web components** extending `AIUXElement`
- **Loaders = SSR data fetching** via `static async loader(ctx)`
- **Layouts = nested inheritance** with per-level most-specific-wins precedence
- **Extensions = overlay pages** on host applications without modifying host code
- **Host-level chrome** (nav items, etc.) is contributed via `application.js` exporting `setup(ctx)` — `extension.js` is not read by the build

## Extension Page Template

```js
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const {roles} = decorators;
const log = getLogger('{{TAG_NAME}}');

// Save to: <srcDir>/extensions/<host-project-id>/<host-basename>/pages/<route>/page.js

@customElement('x-scope-page-name') // Replace 'x-scope' with your scope prefix
// @roles(['admin', 'user'])  // Uncomment to restrict access to roles
export default class MyPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  constructor() {
    super();
    this._loading = false;
    this._error = null;
  }

  /**
   * Runs on the server during initial render and on the client during
   * navigation. Returned object is embedded as __LOADER_DATA__ and
   * exposed as this.loaderData in render().
   */
  static async loader(ctx) {
    try {
      return {pageTitle: i18n.getMessage('{{PAGE_TITLE}}')};
    } catch (err) {
      log.error({error: err.message}, '{{CLASS_NAME}} loader error');
      throw err;
    }
  }

  render() {
    if (!this.loaderData) {
      return html`<p>${i18n.getMessage('Loading')}</p>`;
    }
    if (this.loaderData.error) {
      return html`<p>${this.loaderData.error}</p>`;
    }
    return html`<h1>${this.loaderData.pageTitle}</h1>`;
  }
}
```

Never use browser APIs (`window`, `document`, `localStorage`) inside `render()` or `loader()` — both run during SSR. Guard with `isServer` per `references/foundation/ssr-safety.md`.

## Loader Module Pattern (optional separate file)

```js
// Location: <srcDir>/extensions/<host>/pages/<route>/loaders/data.js
import {getHeaders, getLogger} from '@servicenow/aiux/aiux-components-core';

const log = getLogger('fetchPageData');

export async function fetchPageData(ctx) {
  try {
    const url = new URL(
      `${ctx.protocol}://${ctx.hostname}/api/v2/your-endpoint`
    );
    if (ctx.params.id) url.searchParams.set('id', ctx.params.id);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(ctx),
      credentials: 'include'
    });
    if (!resp.ok)
      throw new Error(
        `Failed to fetch data: ${resp.status} ${resp.statusText}`
      );
    return await resp.json();
  } catch (err) {
    log.error({error: err.message}, 'fetchPageData error');
    throw err;
  }
}
```

Import it in the page: `static async loader(ctx) { return {pageTitle: '...', data: await fetchPageData(ctx)}; }`

## Layout Override Pattern

Nested layout precedence (highest to lowest):

1. Extension layout at this level
2. Extension layout at parent level (inherited)
3. Host layout at this level
4. Host layout at parent level (inherited)
5. Default layout from core-ui

If no `layout.js` is defined at a level, the extension inherits the host's layout at that level automatically.

```js
// Location: <srcDir>/extensions/<extension>/pages/<route>/layout.js
import {html} from 'lit';
import {NavLayout} from '@servicenow/aiux/aiux-components-nav';

export default class MyLayoutOverride extends NavLayout {
  render() {
    // Option 1: use host layout as-is — return super.render();
    // Option 2: wrap/customize while keeping structure
    return html`<div class="extension-layout">${super.render()}</div>`;
    // Option 3: fully custom layout — must still render <slot> for the child page
  }

  // Override specific regions instead of the whole layout:
  // _renderSidebar() / _renderToolbar() / _renderHeader() / _renderContent()
}
```

**Example:** host defines `layout.js` at `measure/` (L2) and `measure/value/` (L3). Extension defines `layout.js` only at `measure/` (L2). At `/measure/value`: extension L2 layout applies (most-specific), host L3 layout is inherited (no extension override at that level).

## Continue in This Skill

After scaffolding the extension page/loader/layout, run through the normal pipeline for anything the templates above don't cover:

- **Styling** — `references/design/daisyui-patterns.md`, `references/design/css-custom-properties.md`
- **Accessibility** — invoke `accessibility` companion skill (required — extension pages render real UI and must comply with WCAG 2.2 AA)
- **i18n** — invoke `internationalization` companion skill (required — all page/loader strings must use `i18n.getMessage()`, never hardcoded English)
- **UI discovery** — invoke `ui-discovery` before writing any custom UI inside the extension page

## Key Differences From Standalone Pages

| Aspect             | Standalone page (this app)                          | Extension page                                      |
| ------------------ | --------------------------------------------------- | --------------------------------------------------- |
| Location           | `<srcDir>/pages/<route>/page.js`                    | `<srcDir>/extensions/<host>/pages/<route>/page.js`  |
| Filename           | `page.js`                                           | `page.js` (route from directory path, not filename) |
| Layout             | `<srcDir>/pages/layout.js` or `<srcDir>/application.js` | Nested layout override, most-specific-wins      |
| Modifies host code | N/A                                                 | Never — overlay only                                |
| Nav wiring         | `<srcDir>/application.js` setup() / `<srcDir>/pages/layout.js` loader | Host-level chrome via `<srcDir>/application.js` `setup(ctx)` |
