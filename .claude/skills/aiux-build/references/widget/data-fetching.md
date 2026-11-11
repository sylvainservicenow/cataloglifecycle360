# Data Fetching & Loading States

## Server Communication

### Basic Fetch

```js
connectedCallback() {
  super.connectedCallback();
  this._fetchData();
}

async _fetchData() {
  if (this._fetching) return;  // in-flight guard (P23)
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

### With Parameters (Action-Based)

```js
async _fetchIncidents(sortOrder = 'recent') {
  const response = await this.server.get({
    action: 'getIncidents',
    sortOrder,
    limit: 10
  });
  this._incidents = response.incidents || [];
}
```

### Re-fetch Default Data

```js
async _handleRefresh() {
  this._loading = true;
  await this.server.update();
  this._loading = false;
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

## Loading State Management

### Full Pattern (try/catch/finally)

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _error: {type: String, state: true},
  _items: {type: Array, state: true}
};

constructor() {
  super();
  this._loading = false;
  this._error = '';
  this._items = [];
  this._fetching = false;
}
```

### Render States

```js
render() {
  if (this._loading) return this._renderSkeletonLoader();
  if (this._error) return this._renderError();
  if (!this._items?.length) return this._renderEmptyState();
  return this._renderData();
}
```

---

## Error Display

```js
_renderError() {
  return html`
    <div class="aiux-alert aiux-alert-error m-4">
      <aiux-icon name="alert-circle-outline" size="sm"></aiux-icon>
      <span>${this._error}</span>
      <button class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._fetchData}>
        ${i18n.getMessage('Retry')}
      </button>
    </div>
  `;
}
```

---

## Truncation Awareness

When the server caps results with `setLimit()`, indicate whether more records exist so the client can display a truncation notice.

### Server Pattern

```js
// After the query loop, get total count with GlideAggregate
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
var totalAvailable = 0;
if (ga.next()) {
  totalAvailable = parseInt(ga.getAggregate('COUNT'), 10);
}

data.items = items;
data.total = items.length;
data.totalAvailable = totalAvailable;
data.hasMore = totalAvailable > items.length;
```

### Client Pattern

```js
static properties = {
  _hasMore: {type: Boolean, state: true},
  _totalAvailable: {type: Number, state: true}
};

constructor() {
  super();
  this._hasMore = false;
  this._totalAvailable = 0;
}

// In _fetchData success path:
this._hasMore = response?.hasMore || false;
this._totalAvailable = response?.totalAvailable || 0;

// Render truncation notice:
_renderTruncationNotice() {
  if (!this._hasMore) return nothing;
  return html`
    <p class="text-xs mt-2 text-text-tertiary">
      ${i18n.getMessage('Showing {0} of {1}', [this._items.length, this._totalAvailable])}
    </p>
  `;
}
```

---

## Real-Time Data with recordWatcherService

Subscribe to live record updates:

```js
import {recordWatcherService} from '@servicenow/aiux-services';

connectedCallback() {
  super.connectedCallback();
  this._subscription = recordWatcherService.subscribe({
    table: 'incident',
    filter: 'active=true',
    callback: (event) => {
      if (event.operation === 'insert' || event.operation === 'update') {
        this._fetchData();  // refresh on change
      }
    }
  });
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._subscription?.unsubscribe();  // REQUIRED cleanup
}
```

---

## Debounced Search

```js
static properties = {
  _searchQuery: {type: String, state: true},
  _searchResults: {type: Array, state: true}
};

constructor() {
  super();
  this._searchQuery = '';
  this._searchResults = [];
  this._debounceTimer = null;
  this._handleSearch = this._handleSearch.bind(this);
}

_handleSearch(e) {
  this._searchQuery = e.target.value;
  clearTimeout(this._debounceTimer);
  this._debounceTimer = setTimeout(() => {
    this._executeSearch(this._searchQuery);
  }, 300);
}

async _executeSearch(query) {
  if (!query.trim()) {
    this._searchResults = [];
    return;
  }
  const response = await this.server.get({
    action: 'search',
    query: query.trim()
  });
  this._searchResults = response.results || [];
}

disconnectedCallback() {
  super.disconnectedCallback();
  clearTimeout(this._debounceTimer);
}
```

---

## Fire-and-Forget (Non-Blocking)

For non-critical operations (analytics, preference saving), update state immediately and fire the async call without awaiting:

```js
_handleSortChange(sortOrder) {
  this._sortOrder = sortOrder;
  this.requestUpdate();
  saveUserPreference('sortOrder', sortOrder).catch(err =>
    log.warn({error: err.message}, 'Failed to save preference')
  );
}
```
