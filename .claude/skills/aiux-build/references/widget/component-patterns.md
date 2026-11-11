# Component Patterns

## Property Declaration

### Public Properties (Attributes)

```js
static properties = {
  title: {type: String},
  count: {type: Number},
  enabled: {type: Boolean},
  items: {type: Array},
  config: {type: Object},
  userName: {type: String, attribute: 'user-name'}  // custom attribute name
};

constructor() {
  super();
  this.title = '';
  this.count = 0;
  this.enabled = true;
  this.items = [];
  this.config = {};
  this.userName = 'Default Name';
}
```

### Internal State

Use `state: true` for properties that shouldn't reflect to attributes:

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _error: {type: String, state: true},
  _selectedIndex: {type: Number, state: true},
  _items: {type: Array, state: true}
};
```

Every property assigned anywhere in the class must be declared — Lit only re-renders when a declared reactive property changes:

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _items: {type: Array, state: true},
  _error: {type: String, state: true}
};
```

---

## Base Class Selection

| Scenario                             | Base Class                       |
| ------------------------------------ | -------------------------------- |
| Page, layout, custom component       | `AIUXElement`                    |
| Standalone widget with server script | `AIUXWidgetElement`              |
| Widget with auto data binding        | `WithData(AIUXWidgetElement)`    |
| Chat-integrated widget               | `withWidgetContext(AIUXElement)` |
| Record-provider page or widget       | `AIUXRecordElement` from the record package root |
| List-provider page or widget         | `AIUXListElement` from the list package root |

**Prefer the exported context base classes for provider-bound UI.** They inherit `AIUXElement` and expose the live `_record` / `_list` accessor with automatic context subscription. Do not expand them into `withRecordContext(AIUXElement)` / `withListContext(AIUXElement)` just to satisfy an old build walker. Use a mixin when a different base is genuinely required (for example `AIUXWidgetElement` for `this.server`) or when placement without a provider is intentional. Base-class accessors throw outside their provider; mixin accessors return null. Optional chaining does not prevent a throwing getter. For general-purpose Builder-authored widgets that read record or list context, see `record-widgets.md` and `list-widgets.md` — those use the mixin form exclusively.

Read context in `render()` / `willUpdate()`; start browser-side aggregate requests in `updated()`, not construction or `connectedCallback()`. The provider may not have upgraded when a consumer connects. A render-only consumer needs no custom subscription, provider id, or prop plumbing. Import from the package root shared with the host, not a separately bundled context subpath.

For full-list charts, reuse standard `aiux-visualizations-*` components and supply a `DataResponse`. `rowDefinitions` covers loaded rows, not all matching records. Query aggregates through the platform's authenticated API using the live table and query **plus** fixed constraints: `state.resolvedQuery` does not include `state.fixedQuery`. Preserve `^NQ` semantics when combining filters and include `resolvedFixedQuery` for a related-list binding. Observe provider loading/error/filter-only states, discard stale responses on query change or disconnect, and never substitute mock data after a failed request. Pagination and selection are not aggregate filters.

When region authors need independent placement, resizing or removal, expose each visualization as its own discoverable widget and place sibling tags in `regions/` rather than hiding several charts inside one widget. Share lifecycle, authenticated aggregate fetching and status rendering in an app-local base extending `AIUXListElement`, but let each widget own its aggregate and failure state. A total-score widget uses an ungrouped count request and a numerical metric with `groupedBy: []`, `dataShape: 'single'`, `order: 0`, and a row such as `['0']`; zero is valid data, not an empty state. Keep previously deployed combined tags as non-discoverable compatibility wrappers if saved layouts may reference them, and never clear saved region overrides without approval.

For grouped aggregates, each numerical metric must declare `dataShape: 'single'` and `groupedBy: ['<dimension key>']` in `metadata.columns`, for example `count.groupedBy: ['state']`. The axis renderer discards rows with populated dimensions missing from that metric's `groupedBy`; the result is empty axes even when the API returns counts and a composition/donut chart renders the same payload. Verify generated series points, not only HTTP success or raw totals.

---

## Lifecycle Patterns

### Data Fetching

```js
connectedCallback() {
  super.connectedCallback();
  this._fetchData();
}

async _fetchData() {
  if (this._fetching) return;  // in-flight guard
  this._fetching = true;
  this._loading = true;
  try {
    const response = await this.server.get({action: 'getData'});
    if (response.isError) {
      this._error = response.errorMessage;
    } else {
      this._items = response.items || [];
      this._error = '';
    }
  } catch (e) {
    this._error = i18n.getMessage('Failed to load data');
  } finally {
    this._loading = false;
    this._fetching = false;
  }
}
```

### In-Flight Guard for Event-Triggered Server Calls

When event handlers (approve, reject, save, delete) trigger server calls, guard against overlapping requests with a boolean flag:

```js
static properties = {
  _actioning: {type: Boolean, state: true}
};

constructor() {
  super();
  this._actioning = false;
  this._handleApprove = this._handleApprove.bind(this);
}

async _handleApprove(e) {
  const sysId = e.currentTarget.dataset.id;
  if (!sysId || this._actioning) return;
  this._actioning = true;

  try {
    const response = await this.server.get({action: 'approve', sysId});
    if (response?.isError) {
      this._error = response.errorMessage || i18n.getMessage('Failed to approve');
      return;
    }
    this._fetching = false;
    await this._fetchData();
  } catch (error) {
    this._error = i18n.getMessage('Failed to approve');
  } finally {
    this._actioning = false;
  }
}
```

### Refetch on Property Change

```js
updated(changedProperties) {
  if (changedProperties.has('selectedId') && this.selectedId) {
    this._loadRecord(this.selectedId);
  }
}
```

---

## Event Handling

### Binding

Binding is only needed when passing a handler to `addEventListener`/`removeEventListener` — `removeEventListener` must receive the exact same function reference that was passed to `addEventListener`. Lit template `@event` bindings do not require it.

**Preferred: class field arrow function** — already bound to the instance, stable reference by default:

```js
// Arrow class field = auto-bound, same reference every time
_handleFieldChange = e => {
  const {name, value} = e.detail;
  if (name === 'title') this._title = value;
};

connectedCallback() {
  super.connectedCallback();
  this.addEventListener('AIUX_CONTROL_INPUT#VALUE_CHANGED', this._handleFieldChange);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.removeEventListener('AIUX_CONTROL_INPUT#VALUE_CHANGED', this._handleFieldChange);
}
```

**Alternative: explicit bind** — needed only when the handler is a regular method and you cannot use a class field:

```js
constructor() {
  super();
  this._boundHandleSort = this._handleSort.bind(this);
}

connectedCallback() {
  super.connectedCallback();
  document.addEventListener('keydown', this._boundHandleSort);
}

disconnectedCallback() {
  super.disconnectedCallback();
  document.removeEventListener('keydown', this._boundHandleSort);
}
```

### Dispatching Custom Events

```js
_handleItemSelect(e) {
  const id = e.currentTarget.dataset.id;
  this.dispatchEvent(new CustomEvent('aiux-widget:item-select', {
    detail: {id},
    bubbles: true,
    composed: true
  }));
}
```

### In Loops — Data Attributes

```js
// single handler on the container, item id from data attribute
${this._items.map(item => html`
  <li data-id=${item.sys_id} @click=${this._handleItemSelect}>
    ${item.name}
  </li>
`)}
```

---

## Template Organization

Split complex templates into focused helpers:

```js
render() {
  return html`
    <div class="aiux-card bg-base-100 shadow-sm h-full">
      <div class="aiux-card-body p-6">
        ${this._loading ? this._renderSkeletonLoader()
        : this._error ? this._renderError()
        : !this._items?.length ? this._renderEmptyState()
        : this._renderData()}
      </div>
    </div>
  `;
}

_renderSkeletonLoader() {
  return html`
    <div class="flex flex-col gap-2">
      ${Array(3).fill(0).map(() => html`
        <div class="aiux-skeleton h-12 w-full rounded"></div>
      `)}
    </div>
  `;
}

_renderEmptyState() {
  return html`
    <div class="flex flex-col items-center justify-center h-full p-8">
      <aiux-icon name="inbox-outline" size="lg"></aiux-icon>
      <p class="text-sm mt-2 text-text-tertiary">
        ${i18n.getMessage('No items found')}
      </p>
    </div>
  `;
}

_renderError() {
  return html`
    <div class="aiux-alert aiux-alert-error aiux-alert-soft">
      <span>${this._error}</span>
    </div>
  `;
}
```

---

## Conditional Rendering

### classMap

```js
import {classMap} from 'lit/directives/class-map.js';

render() {
  const classes = classMap({
    'aiux-btn': true,
    'aiux-btn-primary': this._primary,
    'aiux-btn-sm': this._size === 'small'
  });
  return html`<button class=${classes}>Click</button>`;
}
```

### repeat() for Keyed Lists

```js
import {repeat} from 'lit/directives/repeat.js';

${repeat(this._items, item => item.sys_id, item => html`
  <incident-card .incident=${item}></incident-card>
`)}
```

### cache() for State Switching

```js
import {cache} from 'lit/directives/cache.js';

render() {
  return html`${cache(this._view === 'list'
    ? html`<list-view .items=${this._items}></list-view>`
    : html`<detail-view .item=${this._selectedItem}></detail-view>`
  )}`;
}
```

---

## Internationalization

### Client-Side

```js
import {i18n} from '@servicenow/aiux-services';

render() {
  return html`
    <h2>${i18n.getMessage('Incidents')}</h2>
    <p>${i18n.getMessage('{0} items found', [this._items.length])}</p>
  `;
}
```

### Server-Side

```js
data.errorMessage = gs.getMessage('Failed to load data');
data.title = gs.getMessage('Recent Incidents');
```

All user-facing strings use `i18n.getMessage()`.
