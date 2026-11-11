# List Widgets

This file covers creating and editing general-purpose, Builder-authored widgets built on the list context (`withListContext`) — **not** page or `sys_ui_view` view-page recipes, and **not** aggregate/chart widgets that query `resolvedQuery`/`fixedQuery` directly (that's `component-patterns.md`).

**A list widget adds to the list page; it never presents the list's records.** core-ui's list Default view hard-codes the header, grid, pagination and split view, and the only place a widget can go is one empty region above the grid. So don't render `<aiux-list-body>`, `<aiux-list-pagination>`, `<aiux-list>` or `<aiux-gallery-list>`, and don't build your own grid, table, rows or cards from `rowDefinitions` / `columnDefinitions` — whatever the request calls the layout ("card-based", "compact", "responsive"). Use `this._list.state` and `this._list.api` for counts, summaries, filters and actions. If the request is for a different presentation of the page's own records, say that a widget can't do that.

## `withListContext` vs `<aiux-list-connected>` — choose the right pattern

These are two completely different patterns. Pick the wrong one and the widget either shows nothing (no provider) or duplicates the page's grid.

| Signal in the request | Pattern | Why |
|---|---|---|
| "on the list page" / "alongside the list" / "on `/list/<table>`" | `withListContext(AIUXWidgetElement)` — this file | The list page already has a `<aiux-list-provider>` and renders its own header, grid and pagination. The widget reads from the provider via context — no data fetching — and adds to the page; it never renders the grid. |
| "on the home page" / "on a dashboard" / standalone widget | `<aiux-list-connected>` | No provider exists. The widget needs a self-contained component that fetches its own data. |
| "show a list of `<table>`" / "create a page that lists…" with no custom layout or fixed filter | None — link to core-ui's existing `/list/<table>` route | Core-ui already serves it with a provider, pagination and URL sync. Only build a page if you need a custom layout or fixed scoping. |
| "create a page that lists…" with a custom layout or fixed filter | `<aiux-list-connected>` | You are building the page itself, not a widget inside an existing page. That is a page recipe, outside this file. |
| "create a page with widgets that read list data" | `<aiux-list-provider>` | The page needs to expose list state to child widgets via context. That is a page recipe, outside this file. |

**If the request doesn't say where the widget will live, ask.** The answer determines the entire architecture — guessing risks a widget that silently fails at runtime.

**If the page uses `<aiux-list-connected>` and the request needs a widget that reads list state**, the page must be restructured to use `<aiux-list-provider>` instead. `<aiux-list-connected>` does not expose its internal state to sibling widgets.

## When to Use This File

- Building a new widget meant to be placed on a list page (a page with `<aiux-list-provider>`), reading the surrounding list context, not fetching its own data.
- Editing an existing widget of that shape.
- Cross-refs: record-context widgets → `record-widgets.md`; aggregate/chart list widgets → `component-patterns.md`.

---

## Imports

```js
import { AIUXWidgetElement, decorators } from '@servicenow/aiux-components-core';
import { withListContext } from '@servicenow/aiux-components-list';
```

Import from the package root, `@servicenow/aiux-components-list` (or `@servicenow/aiux/aiux-components-list` if the project uses the meta-package). Older runtimes export `withRecordListContext` instead of `withListContext`; check what the target exports.

---

## Base Class — List

| Widget type | Base | Package |
| --- | --- | --- |
| List | `withListContext(AIUXWidgetElement)` | `@servicenow/aiux-components-list` |

Use the mixin form for general-purpose widgets that need `AIUXWidgetElement` capabilities (`this.server`, `this.logger`, `this.deps`). The convenience class `AIUXListElement` extends `AIUXElement` directly and is preferred for view pages — but for Builder-authored widgets, the mixin on `AIUXWidgetElement` is the right choice.

Two things to know:

1. Wrapping `AIUXWidgetElement` means `this.server`, `this.logger`, `this.deps` (the DI proxy), and AIEL/`aiContext` surfacing are all available — nothing is lost by using the mixin. There's no equivalent gap the way there would be extending a plain `AIUXElement` base.
2. The mixin's `this._list` is **nullable** — it returns `null` instead of throwing when there's no ancestor provider. Always guard for that (optional chaining or an explicit "no list" render branch) rather than assuming a provider is present.

The accessor is named exactly `this._list`. There is no `this._listData`, `this.list`, `this._listContext` or `this.listData` on the mixin, and reading one gives `undefined` with no error, so the widget silently renders its "no list" branch. `this._list` is the curated context object, not raw rows: read `this._list.state` for data and `this._list.api` for actions.

It is a getter with no setter, so assigning to it throws a `TypeError`, and declaring your own `@state() _list` (or `static properties` entry) in a widget that uses the mixin shadows the accessor, so every context read returns your state (`undefined` until you set it) instead. If the widget keeps its own list of items, give it a different name, such as `_items`.

---

## Fixed List Page Components — do NOT render from widgets

core-ui's list Default view hard-codes the header, grid, pagination and split view as page markup. The only part a widget can be added to is one empty region between the header and the grid, so a widget on `/list/<table>` sits above the page's own grid and cannot replace, move or hide any of it. **Do not render these from a widget** — a second copy shows the records or the pagination twice:

- `<aiux-list-body>` — the list renderer (tabular grid, or card grid in gallery mode)
- `<aiux-list-pagination>` — pagination controls
- `<aiux-list>` and `<aiux-gallery-list>` — the presentational grids `<aiux-list-body>` renders

If the user asks for a widget that "shows list data as a table", "renders a grid" or "shows cards" of the page's own records, a widget can't do that: the page already shows those records and the grid isn't replaceable. Say so, and offer what a widget can add — counts, summaries, filter shortcuts, or actions through `this._list.api`. A widget that needs to show a *record* (for example a form for one row) wraps record components in its own `<aiux-record-provider>`; see `record-widgets.md`.

### Wiring from context

Key state fields from `this._list.state`:

| Field | Type | Description |
| --- | --- | --- |
| `table` | `string` | Table name |
| `view` | `string` | View name |
| `query` | `string` | Query the user's conditions produced |
| `resolvedQuery` | `string` | Query that actually ran — base query plus sort/group. Prefer this when reporting or reusing the list's filter |
| `fixedQuery` | `string` | Fixed query (not user-editable) |
| `resolvedFixedQuery` | `string` \| `null` | Fixed query after the server resolves any parent-record binding |
| `sortColumns` | `Array` | Current sort |
| `groupBy` | `string` | Current group-by field |
| `currentPage` | `number` | Current page |
| `pageSize` | `number` | Rows per page |
| `selectedRecords` | `string[]` | Sys IDs of selected rows |
| `columnDefinitions` | `Array` | Column metadata, `{key, label, type, …}` — there is no `name` field. Read it for derived values; don't render the grid from it |
| `rowDefinitions` | `Array` | Row data. Read it for counts and other derived values; don't render the rows |
| `loadingState` | `string` | `'idle'` \| `'loading'` \| `'success'` \| `'error'` |
| `errorMessage` | `string` | Error message when `loadingState === 'error'` |
| `showGridOnlyWhenFiltered` | `boolean` | `true` while the grid is hidden until the user applies a filter |

`rowDefinitions` mixes row types, so branch on `row.type`. Standard rows (`type` undefined) and `'hierarchical'` rows are `{key, cells, …}`: `key` is the row's unique id (the record's sys_id on a table list) and `cells` is an object keyed by each column's `key` (the `key` of its `columnDefinitions` entry), not an array. Each cell is `{value, displayValue}`. Show `displayValue`; `value` depends on the field type (a sys_id for references, a pills array for tags, a date string for dates). `'grouped'` rows have no `cells`, only `label`, `count` and nested `rows`, so recurse into them. Skip `'aggregate'` rows (their cells hold `sum`/`avg`/`min`/`max`) and `'customRow'`, `'insertRow'` and `'embeddedTempRow'` entries (unsaved placeholders).

```js
// ✅ flatten to record rows first, then read cells as an object keyed by column `key`
const recordRows = rows =>
  rows.flatMap(row => [
    ...(!row.type || row.type === 'hierarchical' ? [row] : []),
    ...(row.rows ? recordRows(row.rows) : [])
  ]);
const number = row.cells?.number?.displayValue ?? row.cells?.number?.value;
const isP1 = row.cells?.priority?.value === '1';

// ❌ cells is not an array, and a cell has no `column`
const priority = row.cells.find(cell => cell.column.name === 'priority');
```

Cells are keyed by the column's `key`, not `name`: `row.cells?.[col.key]`.

`this._list.api` exposes actions like `reload()`, `setPage()`, `setPageSize()`, `setQuery()`, `sort()`, and `groupBy()`. `api.embedded` holds buffered-edit methods that only matter for embedded lists on a record form; ignore it otherwise.

---

## Creating a New List Widget

1. Base: `withListContext(AIUXWidgetElement)`.
2. Decorator stack — `@customElement`, `@discoverable(true, {requiresPageType: ['list']})`, `@name`, `@description`, `@bestFor`, `@chatCompatible`, `@category`.
3. Read `this._list.state` for `table`/`view`/`query`/`fixedQuery`/`pageSize`/`columnDefinitions`/`rowDefinitions`/`loadingState`/`errorMessage`, and `.api` for actions like `reload()`.
4. Guard for a null `this._list` and for `loadingState === 'error'`. Compute anything derived from `rowDefinitions` as local variables inside `render()`; the list context already re-renders the widget, so don't copy it into `@state()` fields.
5. Don't add `@server(...)` unless the widget needs its own server script. A context-only widget has no `this.server` or `this.data` use, but a widget with `@server` gets a server-script request on every server render of its page, and when the server doesn't return data for it the client falls back to a `this.server.update()` round trip on connect. If you do need a server script, add `static fetchDataOnConnect = false` when the data isn't needed at first paint.
6. Take every import from one style: the package root (`@servicenow/aiux-components-list`, `@servicenow/aiux-components-core`) or the meta-package (`@servicenow/aiux/aiux-components-list`, …) throughout the file. The isolate build normalizes both forms to the same package, but one style keeps the file easy to review.
7. Add to the page; don't present the list. Never render `<aiux-list-body>`, `<aiux-list-pagination>`, `<aiux-list>` or `<aiux-gallery-list>`, and never build your own grid, table, rows or cards from `rowDefinitions`. Use `this._list.state` and `.api` for counts, summaries, filters and actions.

```js
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AIUXWidgetElement, decorators } from '@servicenow/aiux-components-core';
import { i18n } from '@servicenow/aiux-services';
import { withListContext } from '@servicenow/aiux-components-list';

const { name, description, bestFor, chatCompatible, category, discoverable } = decorators;

// Flatten groups and hierarchies down to record rows (see the row types above).
const recordRows = rows =>
    rows.flatMap(row => [
        ...(!row.type || row.type === 'hierarchical' ? [row] : []),
        ...(row.rows ? recordRows(row.rows) : [])
    ]);

@customElement('x-acme-list-row-count')
@name('List Row Count')
@description('Shows how many rows the current list is showing.')
@bestFor('Summarizing the current list context on a list page')
@chatCompatible(false)
@category('custom')
@discoverable(true, { requiresPageType: ['list'] })
export default class ListRowCount extends withListContext(AIUXWidgetElement) {
    static styles = css`
        :host {
            display: block;
        }
    `;

    render() {
        const list = this._list; // null outside a provider — never assumed present
        if (!list) {
            return html`<div class="p-4 text-text-tertiary">${i18n.getMessage('No list available')}</div>`;
        }
        const { table, rowDefinitions, loadingState, errorMessage } = list.state ?? {};
        if (loadingState === 'error') {
            return html`<div class="p-4 text-error">${errorMessage || i18n.getMessage('Failed to load list')}</div>`;
        }
        const recordCount = recordRows(rowDefinitions ?? []).length;
        return html`
            <div class="p-4">
                <div>${i18n.getMessage('{0} — {1} rows loaded', [table, recordCount])}</div>
            </div>
        `;
    }
}
```

---

## @discoverable's Second Argument — requiresPageType

| Value | Effect |
| --- | --- |
| (omitted) | No restriction — widget appears in the toolbox for any page type |
| `{requiresPageType: ['list']}` | Widget only offered on list pages |
| (any value, when 1st arg is `false`) | Ignored entirely — a non-discoverable widget's options are never read |

`requiresPageType`'s value must agree with the widget's context — a list-context widget pairs with `['list']`.

The ESLint rule `page-type-matches-base-class` recognizes both the convenience class (`AIUXListElement`) and the mixin form (`withListContext(...)`) via its `PAGE_TYPE_MIXINS` map. It resolves through intermediate variable bindings and TypeScript casts, so `extends withListContext(AIUXWidgetElement)` is checked the same as `extends AIUXListElement`.

Also note: the `requiresPageType` array must be a static literal (string literals only, from a fixed value set) — it's extracted from the AST at build time, the same mechanism `decorators.md`'s "Build-Time Extraction" section describes for other decorator arguments.

---

## Editing an Existing List Widget

**Safe to change:**

| Change |
| --- |
| Adding/removing rendered fields |
| Adding a new `@configProperty` |
| Changing loading/error/empty-state markup |
| Changing styles |

**Risky to change:**

| Change |
| --- |
| Removing `withListContext(...)` (or swapping `AIUXWidgetElement` out of the mixin call) — loses `this._list` entirely, not just a behavior change |
| Changing `requiresPageType` without re-checking the context still matches (see pairing rule above) |
| Changing where `withListContext` / `ListContext` is imported from — import them from the package root, `@servicenow/aiux-components-list`, and don't deep-import a bundle path. A second copy of the context is a different instance, so a previously-working `this._list` read can silently start returning null forever |

After any "risky" change, re-run this skill's `quality/validation-rules.md` Component Structure and Widget-Specific checks, and manually confirm:

1. The context still matches `requiresPageType`.
2. Context is still only read inside `render()`/`willUpdate()`.
3. Every `this._list` read is guarded for `null` — the mixin never throws, but is nullable whenever there's no ancestor provider.

---

## Cross-References

- [Record Widgets](record-widgets.md) — the record-context counterpart.
- [Component Patterns](component-patterns.md) — aggregate/chart list-context widgets, `resolvedQuery`/`fixedQuery` querying. Only for data that spans all matching records; a widget that summarizes the visible rows reads `rowDefinitions`.
- [Decorators](decorators.md) — full decorator reference, including Build-Time Extraction mechanics.
- [Server Scripts](server-scripts.md) — if the widget also needs `@server(...)` beyond what context already provides.
