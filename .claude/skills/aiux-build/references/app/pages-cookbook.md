# Pages Cookbook

Patterns for page templates in AIUX applications. All examples work in both JS and TS. Paths below are relative to `<srcDir>` (the value of `srcDir` in `aiux.json`, scaffolded as `src/lux`). If `srcDir` is not set in `aiux.json`, paths resolve at the project root.

---

## Root Layout (`<srcDir>/pages/layout.js`)

Apps using the Polaris sidebar/header shell extend `NavLayout` from `@servicenow/aiux-components-nav` and use `navLayoutContext` to drive the sidebar. Apps that do not need the shell (embedded experiences, lightweight prototypes) extend `AIUXAppLayoutElement` directly.

```js
import {NavLayout, navLayoutContext} from '@servicenow/aiux-components-nav';
import {css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {MyAppTheme} from '../theme.js';

@customElement('my-app-layout')
export default class MyAppLayout extends NavLayout {
  static appTheme = MyAppTheme;

  static styles = [
    ...NavLayout.styles,
    css`
      :host {
        --nav-sidebar-bg: linear-gradient(to bottom, #032d42 0%, #044355 100%);
        --nav-layout-bg: #f5f7fa;
      }
    `
  ];

  static async loader(ctx) {
    await super.loader(ctx, {
      appName: 'My App',
      features: {
        menus: false,
        concoursePicker: false
      }
    });

    const pagePath = ctx.pagePath;

    const items = [
      {icon: 'home', title: 'Home', action: {type: 'navigate', path: '/home'}},
      {
        icon: 'list-outline',
        title: 'Incidents',
        action: {type: 'navigate', path: '/list/incident'}
      }
    ];

    navLayoutContext.set({
      ...navLayoutContext.get(),
      items: items.map(item => {
        const isActive = pagePath?.startsWith(item.action?.path);
        return {...item, ...(isActive && {active: true})};
      })
    });
  }
}
```

---

## Generic List Page (`<srcDir>/pages/list/[table]/page.js`)

Uses `ListDataManager` for data and `aiux-list-connected` for rendering. Works with any ServiceNow table.

> **The list recipes below are for a route page your app owns** — a page that
> is the whole list and therefore has to fetch it. A **list view page** under
> `src/extensions/<host>/list/<view>/` is the opposite case: Core UI's list
> route page already fetched the rows and already wraps your page in
> `<aiux-list-provider>`, so `ListDataManager` and `<aiux-list-connected>` are
> both wrong there — they stand up a second list over the same table. Extend
> `AIUXListElement` and compose the provider's leaves instead. For a
> host-backed record view, extend `AIUXRecordElement`. Import both from their
> package roots, reserve mixins for alternative bases, and see
> `extensions.md` § *List view pages and list context*.

**Critical — `display: contents`:** The page host MUST be `display: contents` so `aiux-list-connected`'s internal flex layout inherits the NavLayout height chain. Using `display: block` breaks the layout — the list collapses and row affordances render in a detached column.

**Critical — bind `aiux-list-connected:*` events, not `aiux-list:*`:** Row/link clicks come through `@aiux-list-connected:reference-link-clicked` and UI actions through `@aiux-list-connected:ui-action-clicked`. These are the stable public API. The inner `aiux-list:*` events (e.g. `aiux-list:cell-link-clicked`) are internal and can change without notice.

```js
import '@servicenow/aiux-components-list';
import {ListDataManager} from '@servicenow/aiux-components-list';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {navigate} from '@servicenow/aiux-client';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

@customElement('my-app-list-page')
export default class ListPage extends AIUXElement {
  // REQUIRED: display:contents
  static styles = css`
    :host {
      display: contents;
    }
  `;

  firstUpdated() {
    setDocumentTitle(getMessage('Incidents'));
  }

  static async loader(ctx) {
    const {table} = ctx.params;
    const query = ctx.query?.sysparm_query || '';
    const data = await ListDataManager.fetch({table, query});
    return {table, query, data};
  }

  _handleRowClick(e) {
    const {referenceTable, referenceSysId, listTable, listSysId} = e.detail;
    const table = referenceTable || listTable;
    const sysId = referenceSysId || listSysId;
    if (table && sysId) navigate(`/record/${table}/${sysId}`);
  }

  _handleUIAction(e) {
    const {uiAction, table} = e.detail || {};
    if (uiAction?.name === 'new_record' && table) {
      navigate(`/record/${table}/-1`);
    }
  }

  render() {
    const {data, table, query} = this.loaderData || {};
    return html`
      <aiux-list-connected
        table=${table}
        .query=${query || ''}
        .data=${data}
        @aiux-list-connected:reference-link-clicked=${this._handleRowClick}
        @aiux-list-connected:ui-action-clicked=${this._handleUIAction}
      ></aiux-list-connected>
    `;
  }
}
```

---

## Scoped List Page (`<srcDir>/pages/high-priority-incidents/page.js`)

A curated route whose identity *is* a filter — "high priority incidents", "my open approvals" — rather than a `[table]` route. Three things differ from the generic list page above.

**1. The scope belongs in `fixedQuery`, not `query`.** `fixedQuery` is AND-ed with `query` on every request, and `ListDataManager.fetch` takes it as a first-class param, so SSR rows match what the hydrated list asks for. Keep the value in a module constant — it is the route's identity, not user state.

```js
const SCOPE = 'active=true^priority<=2';

static async loader(ctx) {
  const query = ctx.query?.sysparm_query ?? '';
  const data = await ListDataManager
    .fetch({table: 'incident', query, fixedQuery: SCOPE})
    .catch(() => null);
  return {data, query};
}

// render():
// <aiux-list-connected table="incident" .query=${query} .fixedQuery=${SCOPE}
//   .data=${data} .listOptions=${{showReadableFixedQuery: true}}>
```

Do **not** fold the scope into `query`. `query` is what the condition builder edits and what `aiux-list-connected:query-updated` hands back, so a scope living there is one the user can filter away — and re-applying it on each URL round-trip duplicates the clause. `showReadableFixedQuery: true` renders the scope as readable text in the list header so the constraint is visible rather than invisible.

Writing `query-updated` back to `sysparm_query` is safe: `detail.query` is the user's conditions plus the sort/group fragment and excludes `fixedQuery`.

**2. Anything you stack above the list must re-establish the flex column.** The nav layout nests three containers before your page (`render-layout.js`):

```
.content-area          flex flex-row flex-1 min-h-0 min-w-0
  .layout-main-container  flex flex-col flex-1 min-h-0 min-w-0   <- the min-h-0 that makes height resolvable
    .layout-main            flex flex-col flex-1                 <- renderPage() lands here; note: no min-h-0
```

Because the page host is `display: contents`, a bare list is a direct child of `.layout-main` — a `flex-col` container — and sizes correctly. The moment you add a wrapper to put a banner, heading, or toolbar above it, that wrapper becomes `.layout-main`'s flex child instead, and `aiux-list-connected` (`flex: 1; height: 100%; min-height: 0`) has nothing to resolve its height against:

```html
<!-- wrapper must carry all four, or the list collapses -->
<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4">
  <my-page-banner></my-page-banner>
  <aiux-list-connected class="min-h-0" ...></aiux-list-connected>
</div>
```

Keep `display: contents` on `:host` regardless — moving the page host to `display: block` breaks the chain one level higher up.

**3. Prefer `aiux-list-connected` over `aiux-list-page` here.** `<aiux-list-page>` is the richer component — built-in URL sync, page-size preference, `sysparm_first_row` deep links, UI actions on first paint — but its loader reads `ctx.params.table` and returns early without it, so on a fixed route it renders an unhydrated list and none of that applies. Use it for `[table]` routes; use `aiux-list-connected` plus the page's own loader for curated ones.

If two curated list pages both sync filter/view/sort state to the URL, put that logic in one `utils/` module rather than copying the handlers — page-scoped files are for UI used by exactly one page.

---

## Provider-Based List Page (when widgets need list context)

Use this pattern instead of `<aiux-list-connected>` when the page includes **widgets that need `withListContext`** — e.g. a sidebar widget that reads list state, a custom filter summary, or any widget from `widget/list-widgets.md`. The provider owns the data; child components and `withListContext` widgets all read from it.

```js
import '@servicenow/aiux-components-list';
import {ListDataManager} from '@servicenow/aiux-components-list';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {navigate} from '@servicenow/aiux-client';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';
// Import the withListContext widget so its custom element is registered
import '../../widgets/incident-list-summary/index.js';

@customElement('my-app-provider-list-page')
export default class ProviderListPage extends AIUXElement {
  static styles = css`:host { display: contents; }`;

  firstUpdated() {
    setDocumentTitle(getMessage('Incidents'));
  }

  static async loader(ctx) {
    const table = ctx.params?.table ?? 'incident';
    const query = ctx.query?.sysparm_query ?? '';
    const data = await ListDataManager
      .fetch({table, query})
      .catch(() => null);
    return {data, table, query};
  }

  _handleRowClick(e) {
    const {referenceTable, referenceSysId, listTable, listSysId} = e.detail;
    const table = referenceTable || listTable;
    const sysId = referenceSysId || listSysId;
    if (table && sysId) navigate(`/record/${table}/${sysId}`);
  }

  render() {
    const {data, table, query} = this.loaderData ?? {};
    return html`
      <aiux-list-provider
        table=${table}
        .query=${query}
        .data=${data}
        .listOptions=${{showPagination: true}}
        @aiux-list-connected:reference-link-clicked=${this._handleRowClick}
      >
        <aiux-list-header
          heading=${getMessage('Incidents')}
          show-count
          show-refresh-button
        ></aiux-list-header>
        <aiux-list-body></aiux-list-body>
        <aiux-list-pagination></aiux-list-pagination>
        <!-- The provider exposes list state via Lit context, so any
             withListContext(AIUXWidgetElement) widget placed here gets
             this._list.state populated automatically. -->
        <incident-list-summary></incident-list-summary>
      </aiux-list-provider>
    `;
  }
}
```

`withListContext` widgets are placed inside `<aiux-list-provider>` by importing and rendering them directly — the provider exposes list state via Lit context, so any descendant `withListContext(AIUXWidgetElement)` gets `this._list.state` populated automatically. In core-ui, the Default view renders `<aiux-list-header>`, `<aiux-list-body>` and `<aiux-list-pagination>` directly, with an empty `regions/list/body.ts` region above the body for custom content (the only place a widget can go on that page; the header, grid and pagination aren't replaceable) — consumer apps do not need the regions DSL unless they also need Builder-editable layouts (see `references/app/regions.md`).

**When to use this vs `<aiux-list-connected>`:**
- If the page is self-contained (no widgets reading list state) → use `<aiux-list-connected>` (simpler, see recipes above)
- If the page hosts widgets that need `withListContext` → use `<aiux-list-provider>` (this recipe)

---

## Generic Record Page (`<srcDir>/pages/record/[table]/[id]/page.js`)

Uses `RecordDataManager` and `aiux-record-provider`. `sysId="-1"` opens a new-record form.

**Critical — `onOpenRecord` is a property callback**, not a DOM event. Use `.onOpenRecord=${fn}` (dot-binding). The handler receives `(table, sysId)` as separate arguments, not a `CustomEvent`. Using `@onOpenRecord` silently does nothing.

```js
import '@servicenow/aiux-components-record';
import {RecordDataManager} from '@servicenow/aiux-components-record';
import {AIUXElement, getLogger} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {navigate} from '@servicenow/aiux-client';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

const log = getLogger('my-app-record-page');

@customElement('my-app-record-page')
export default class RecordPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  firstUpdated() {
    const {table, id} = this.loaderData || {};
    setDocumentTitle(getMessage(table || 'Record'));
  }

  static async loader(ctx) {
    const {table, id} = ctx.params;
    let rawData = null;
    if (table && id && id !== '-1') {
      try {
        rawData = await RecordDataManager.fetchRecord({table, sysId: id});
      } catch (e) {
        log.error({error: e.message}, 'Failed to fetch record');
      }
    }
    return {table, id, rawData};
  }

  _handleOpenRecord(table, sysId) {
    if (table && sysId) navigate(`/record/${table}/${sysId}`);
  }

  render() {
    const {rawData, table, id} = this.loaderData || {};
    return html`
      <aiux-record-provider
        .data=${rawData}
        table=${table || ''}
        sysId=${id || ''}
        show-error-details="true"
        .onOpenRecord=${this._handleOpenRecord}
      >
        <aiux-record-form></aiux-record-form>
      </aiux-record-provider>
    `;
  }
}
```

**Troubleshooting — "Error loading record":** Keep `show-error-details="true"` to see the real error. Common causes:

- Invalid or empty `sysId`
- Instance GraphQL schema older than the package version (instance/build mismatch, not an app bug)

---

## Nested Layout (`<srcDir>/pages/[table]/[id]/layout.js`)

For route groups that need shared data via scoped context. The `willUpdate` hook is **required** — without it, navigating between records under the same layout updates `loaderData` but never re-runs `provide()`, leaving child pages with stale data.

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {detailContext} from '../../../contexts/detail-context.js';

@customElement('my-app-detail-layout')
export default class DetailLayout extends AIUXElement {
  _prevLoaderData = null;

  static async loader(ctx) {
    const {id} = ctx.params;
    return {id, record: await fetchRecord(id)};
  }

  connectedCallback() {
    super.connectedCallback();
    const {id, record} = this.loaderData || {};
    detailContext.provide(this, {id, record});
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    detailContext.unprovide(this); // REQUIRED — prevents memory leaks
  }

  willUpdate() {
    if (this.loaderData !== this._prevLoaderData) {
      this._prevLoaderData = this.loaderData;
      const {id, record} = this.loaderData || {};
      detailContext.provide(this, {id, record});
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
```

Child pages consume:

```js
static contexts = [detailContext];
render() {
  const {id, record} = detailContext.get(this) || {};
}
```

---

## Custom Page (AIUXElement)

For pages that don't fit list/record patterns:

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {i18n} from '@servicenow/aiux-services';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

@customElement('my-app-dashboard')
export default class DashboardPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      padding: 1rem;
    }
  `;

  firstUpdated() {
    setDocumentTitle(getMessage('Dashboard'));
  }

  static async loader(ctx) {
    const stats = await fetchDashboardStats(ctx);
    return {stats};
  }

  render() {
    const {stats} = this.loaderData || {};
    return html`
      <h1 class="text-lg font-semibold mb-4">
        ${i18n.getMessage('Dashboard')}
      </h1>
      <div class="grid grid-cols-3 gap-4">
        ${stats?.map(s => html`<stat-card .stat=${s}></stat-card>`)}
      </div>
    `;
  }
}
```
