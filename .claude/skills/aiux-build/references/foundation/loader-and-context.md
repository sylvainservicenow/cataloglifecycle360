# Loader Pattern & Context API

## Loader Pattern

Every page and layout may define `static async loader(ctx)`. The loader runs **before rendering** — on the server (blocking SSR) and again on the client during navigation. Its return value is available as `this.loaderData`.

```js
static async loader(ctx) {
  const {table} = ctx.params;
  const data = await fetchSomething(table);
  return {table, data};  // becomes this.loaderData
}

render() {
  const {table, data} = this.loaderData || {};
  return html`...`;
}
```

### `ctx` Shape

| Property             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `ctx.params`         | Dynamic route params from `[bracket]` filenames    |
| `ctx.query`          | URL query string params                            |
| `ctx.pagePath`       | Current page path (e.g. `/list/incident`)          |
| `ctx.basePath`       | App basename prefix (e.g. `/aiux/my-app`)          |
| `ctx.protocol`       | `http` or `https`                                  |
| `ctx.hostname`       | ServiceNow instance hostname                       |
| `ctx.csrfToken`      | CSRF token for mutating requests (POST/PUT/DELETE) |
| `ctx.headers.cookie` | Session cookie for authenticated fetches           |

### Headers Helper

`getHeaders(ctx)` from `@servicenow/aiux-components-core` returns standard API headers. Auth and tracing headers are injected automatically by the fetch interceptor (SSR) and `sn-http-request` (client).

```js
import {getHeaders} from '@servicenow/aiux-components-core';

static async loader(ctx) {
  const res = await fetch(`${ctx.protocol}://${ctx.hostname}/api/now/table/incident`, {
    headers: getHeaders(ctx)
  });
  return {incidents: await res.json()};
}
```

### SSR Guard in Loaders

Loaders run on both server and client. Guard browser-only logic:

```js
import {isServer} from 'lit';

static async loader(ctx) {
  if (isServer) return {};
  // client-only logic
}
```

### Full `ctx` Shape

| Property             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `ctx.params`         | Dynamic route params from `[bracket]` filenames  |
| `ctx.query`          | URL query string params                          |
| `ctx.pagePath`       | Current page path (e.g. `/inventory/abc123`)     |
| `ctx.basePath`       | App basename prefix (e.g. `/aiux/my-app`)        |
| `ctx.protocol`       | `http` or `https`                                |
| `ctx.hostname`       | ServiceNow instance hostname                     |
| `ctx.csrfToken`      | CSRF token for POST/PUT/DELETE requests          |
| `ctx.headerConfig`   | Pre-computed header config (may be null in CSR)  |
| `ctx.chat`           | Chat gate `{enabled, deploymentDocumentId, ...}` |
| `ctx.app`            | App object with `routes` array                   |
| `ctx.resolvedPath`   | Fully resolved page path (for nested layouts)    |
| `ctx.headers.cookie` | Session cookie for authenticated fetches (SSR)   |

### Parallel Fetches with `Promise.allSettled`

Always use `Promise.allSettled` (not `Promise.all`) in loaders when fetching multiple independent data sources. A single failing fetch must not crash the entire loader.

```js
static async loader(ctx) {
  const [recordResult, insightsResult, licenseResult] = await Promise.allSettled([
    fetchRecord(ctx, table, sysId),
    fetchInsights(ctx).catch(() => []),
    fetchLicense(ctx)
  ]);

  const record = recordResult.status === 'fulfilled' ? recordResult.value : null;
  if (recordResult.status === 'rejected') {
    log.error({error: recordResult.reason}, 'Failed to fetch record');
  }
  const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : [];
  const license = licenseResult.status === 'fulfilled' ? licenseResult.value : {hasEnterpriseLicense: false};

  return {record, insights, license};
}
```

### `aiuxFetch` for Client-Side API Calls

Use `aiuxFetch` from `@servicenow/aiux-components-core` for REST API calls on the client (not in loaders). It adds XSRF tokens, auth headers, and handles retries. Raw `fetch` is acceptable in loaders where `getHeaders(ctx)` provides the session context.

```js
import {aiuxFetch, getLogger} from '@servicenow/aiux-components-core';

const log = getLogger('my-page');

// Client-side fetch (in connectedCallback, event handlers, firstUpdated)
async _loadTasks() {
  const params = new URLSearchParams({
    sysparm_fields: 'sys_id,short_description,state,assigned_to',
    sysparm_query: 'active=true',
    sysparm_limit: '50'
  });
  const resp = await aiuxFetch(`/api/now/table/task?${params}`, {
    headers: {'Content-Type': 'application/json'}
  });
  if (!resp.ok) {
    log.error({status: resp.status}, 'Failed to fetch tasks');
    return [];
  }
  const data = await resp.json();
  return data?.result ?? [];
}
```

### `fetchDataResource` for Data Broker Calls

Use `fetchDataResource` from `@servicenow/aiux-components-core` to invoke ServiceNow Data Broker definitions by sys_id. This is the platform-idiomatic way to call server-side business logic without writing server scripts.

```js
import {fetchDataResource} from '@servicenow/aiux-components-core';

const LICENSE_BROKER_SYS_ID = '37397e8effa772103812ffffffffff6d';

// In a loader (runs SSR + CSR)
static async loader(ctx) {
  try {
    const result = await fetchDataResource(LICENSE_BROKER_SYS_ID, {}, ctx);
    return {hasLicense: result?.output?.toString().toLowerCase() === 'true'};
  } catch {
    return {hasLicense: false};
  }
}

// Client-side (no ctx arg)
async _startReview(assetSysId) {
  const result = await fetchDataResource(START_REVIEW_BROKER_ID, {assetSysId});
  if (result?.output?.success) {
    this._showToast('success', i18n.getMessage('Review started'));
  }
}
```

### Shared Loader Functions

Data-fetching functions shared across pages belong in a `loaders/` folder. They must accept `ctx` as a parameter and return plain data (not DOM/Lit objects):

```
loaders/
├── insights-loader.js   # fetchInsights(baseUrl, ctx, opts)
├── cost-configured.js   # fetchCostConfigured(ctx)
└── task-detail-loader.js  # fetchTaskDetail(card)
```

Example shared loader:

```js
// loaders/inventory-loader.js
import {getHeaders} from '@servicenow/aiux-components-core';

export async function fetchInventoryData(baseUrl, ctx) {
  const headers = getHeaders(ctx);
  const resp = await fetch(
    `${baseUrl}/api/now/stats/my_table?sysparm_count=true&sysparm_group_by=governed`,
    {headers}
  );
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data?.result ?? [];
}
```

---

## Context API

Use the AIUX context API from `@servicenow/aiux-components-core` — it provides SSR compatibility and platform integration that the raw `@lit/context` package lacks.

### Global Context — `createContext`

Module-level singleton. Use for app-wide state set once per navigation (current user, license info, etc.):

```js
// contexts/user-context.js
import {createContext} from '@servicenow/aiux-components-core';
export const userContext = createContext('user-context', null);
```

**Provider** (typically in a layout's `loader`):

```js
static async loader(ctx) {
  userContext.set(await fetchCurrentUser(ctx));
}
```

**Consumer** (any descendant page):

```js
static contexts = [userContext];
render() {
  const user = userContext.get();
  return html`<p>Hello, ${user?.name}</p>`;
}
```

### Scoped Context — `createScopedContext`

Tree-scoped per host element. Use when a nested layout serves multiple independent subtrees that need isolated values (e.g. a `[id]/layout.js` providing different record data per navigation):

```js
// contexts/detail-context.js
import {createScopedContext} from '@servicenow/aiux-components-core';
export const detailContext = createScopedContext('detail-context', null);
```

**Provider** (nested layout):

```js
_prevLoaderData = null;

connectedCallback() {
  super.connectedCallback();
  detailContext.provide(this, this.loaderData?.record);
}

disconnectedCallback() {
  super.disconnectedCallback();
  detailContext.unprovide(this);  // REQUIRED — prevents memory leaks
}

willUpdate() {
  if (this.loaderData !== this._prevLoaderData) {
    this._prevLoaderData = this.loaderData;
    detailContext.provide(this, this.loaderData?.record);
  }
}
```

**Consumer** (child page):

```js
static contexts = [detailContext];
render() {
  const record = detailContext.get(this);  // `this` is REQUIRED for scoped
  return html`<p>${record?.short_description}</p>`;
}
```

### Context with Auto-Fetch (`createContext` options)

For contexts that need to be auto-fetched before `setup()` runs (e.g. license checks), pass a `fetch` function:

```js
// contexts/license-context.js
import {
  createContext,
  fetchDataResource
} from '@servicenow/aiux-components-core';

const BROKER_SYS_ID = '37397e8effa772103812ffffffffff6d';

export async function fetchLicense(ctx) {
  try {
    const result = await fetchDataResource(BROKER_SYS_ID, {}, ctx);
    return {
      hasEnterpriseLicense: result?.output?.toString().toLowerCase() === 'true'
    };
  } catch {
    return {hasEnterpriseLicense: false};
  }
}

// {immutable: true} — value never changes after first fetch
// {fetch: fetchLicense} — route-pipeline auto-fetches before setup() runs
export const [licenseContext, setLicenseContext] = createContext(
  'my-app-license',
  {hasEnterpriseLicense: false},
  {immutable: true, fetch: fetchLicense}
);
```

Declare in `application.js`:

```js
export default {
  contexts: [licenseContext], // pipeline fetches licenseContext before setup()
  async setup(ctx) {
    const license = licenseContext.get();
    // license is already populated — no manual fetchLicense() needed
  }
};
```

### `createScopedContext` vs `createContext`

Use `createContext` (not `createScopedContext`) when the context is simple and non-nested. The real app (AICT) uses the simpler pattern:

```js
// contexts/inventory-context.js
import {createContext} from '@servicenow/aiux-components-core';

export const inventoryDetailContext = createContext(
  'aict-inventory-detail',
  null,
  {scoped: true} // scoped option on createContext, not createScopedContext
);
```

### Critical Context Rules

1. `detailContext.get()` without `this` silently returns the default value — **always pass `this`** for scoped contexts
2. Scoped providers MUST call `unprovide(this)` in `disconnectedCallback` — memory leak otherwise
3. Use `willUpdate` to re-provide when `loaderData` changes on navigation — prevents stale context
4. `_prevLoaderData` pattern avoids unnecessary re-provision on unrelated property changes
5. Declare app-level contexts in `application.js` `contexts` array for automatic pipeline fetching
6. `fetchDataResource` can be called both in loaders (pass `ctx`) and client-side (no `ctx`)
