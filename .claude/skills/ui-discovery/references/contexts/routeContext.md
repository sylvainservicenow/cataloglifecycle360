# Route context

> Source: `@servicenow/aiux-context@1.2.161` · `context/docs/usage/routeContext.md`

`routeContext` is a global context holding a frozen snapshot of the current
route. `@servicenow/aiux-components-core` creates it when it loads, and the app
layout replaces the snapshot on every client-side navigation. It is
browser-only: on the server it always reads `{matched: false}`.
In a page `static async loader(ctx)`, read route params from `ctx.params`
instead; use `routeContext` when a widget or component needs the route in render.

## Import

```js
import {routeContext} from '@servicenow/aiux-context';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {routeContext} from '@servicenow/aiux-context';

export class RecordHeader extends AIUXElement {
  static contexts = [routeContext];
  static properties = {_hydrated: {state: true}};

  firstUpdated() {
    this._hydrated = true; // server HTML has no route; keep the first client render identical
  }

  render() {
    const route = routeContext.get();
    if (!this._hydrated || !route.matched) return html``;
    const table = route.getParam('table');
    const view = route.getUIState('view') ?? 'default';
    return html`<h2 class="text-lg font-semibold">${table} (${view})</h2>`;
  }
}
customElements.define('record-header', RecordHeader);
```

**What happens:** the first render matches the server HTML (empty); after
`firstUpdated()` the header renders. Declaring `static contexts` re-renders the
element each time the snapshot is replaced. Always read through `routeContext.get()` in
`render()`; do not cache the snapshot in a field.

## API

### Value

A frozen `RouteSnapshot` (see Data shapes).

| Field / method | Meaning |
| --- | --- |
| `matched` | `true` in the browser; `false` on the server (all other fields absent). |
| `path` | Full browser pathname, including the base path (e.g. `/aiux/aict/list/incident`). Same as `fullPath`. |
| `pathWithoutExperience` | Path with the base path removed (e.g. `/list/incident`). `/` becomes the app's landing path. |
| `fullPath` | Full browser pathname. |
| `page` | `pathWithoutExperience` without the leading `/` (e.g. `list/incident`). |
| `pagePattern` | Route pattern of the matched page (e.g. `/list/:table`); `''` if unknown. |
| `experience` | Last segment of the base path (e.g. `aict`); `''` for a single-segment base path. |
| `params` / `patternParams` | Same object: dynamic route segments by name. |
| `query` / `uiState` | Same object: URL query string as `{[key]: string}`; for repeated keys the last value wins. |
| `state` | `history.state` at snapshot time, or `null`. Router navigations store `{path, query, ...state}` there, where `state` is the `state` option passed to navigate. |
| `getParam(key)` / `getPatternParam(key)` | `params[key]`, or `null`. |
| `getUIState(key)` | `query[key]`, or `null`. |
| `hasUIState(key)` | Whether `key` is present in `query`. |
| `getUIStates(keys)` | `{[key]: value \| null}` for each requested key. |
| `getHashSegment(name)` | Raw remainder of hash segment `name` (e.g. `'/a/b?x=1'`), or `null` if absent. |
| `hasHashSegment(name)` | Whether hash segment `name` exists. |
| `getHashPath(name)` | Path part of segment `name` without its leading `/` and query (`'a/b'`); `''` if the segment has no `/` path; `null` if absent. |
| `getHashQuery(name)` | `URLSearchParams` of segment `name`'s `?` part (empty if none); `null` if absent. |
| `getHashQueryParam(name, key)` | One value from segment `name`'s query; `null` if the segment or its query is absent. |
| `test(pattern)` | `URLPattern` pathname match against `pathWithoutExperience`; `false` if `URLPattern` is unavailable or the pattern is invalid. |
| `toObject()` | Plain object `{path, pathWithoutExperience, fullPath, page, pagePattern, experience, params, query, state}`. Here `path` is the path **without** the base path. |

Hash format: the hash (without `#`) is split on `&` into segments, each
`name[/path][?query]`. Hash helpers read `window.location.hash` when called,
not when the snapshot was built.

### Providing

Provided automatically by the platform. `@servicenow/aiux-components-core`
creates it when the module loads, building the first snapshot from
`window.location` and the route globals the server writes into the page, so it
exists before any element connects. `AIUXAppLayoutElement` rebuilds it when it
connects and on each `aiux:route-changed` window event from the router. Do not
provide it yourself.

### Consuming

```js
// AIUXElement (Karuna)
static contexts = [routeContext];
render() { const route = routeContext.get(); /* ... */ }
```

```js
// @lit/context ContextConsumer (aiux-kit style), browser only
import {ContextConsumer} from '@lit/context';

this._route = new ContextConsumer(this, {
  context: routeContext,
  subscribe: true,
  callback: route => { /* called with the current value, then on every change */ }
});
```

- `get()` never returns `undefined`. On the server it returns a frozen
  `{matched: false}`; in the browser `matched` is `true` from the start.
  Check `matched` before reading other fields in code that also runs on the
  server.
- The subscription is made when the consumer connects, and elements connected
  before the app layout still receive every later update.
- Updates on router navigations: link clicks, programmatic full navigation,
  and back/forward. The snapshot is replaced after the URL and params are
  committed and before the new page renders.
- Not updated by shallow navigations (`shallow: true`), hash-only changes,
  or the initial landing-path `replaceState`.
- `subscribe(callback)` is also available and returns an unsubscribe
  function; it does not call `callback` with the current value.

### Updating

Read-only for consumers. The snapshot is frozen. `routeContext.set(value)`
exists: it replaces the value for all subscribers, does not change the URL,
and is overwritten on the next navigation. To change the route, navigate.

### Data shapes

```ts
type RouteSnapshot =
  | Readonly<{matched: false}>
  | Readonly<{
      matched: true;
      path: string;
      pathWithoutExperience: string;
      fullPath: string;
      page: string;
      pagePattern: string;
      experience: string;
      params: Record<string, string>;
      patternParams: Record<string, string>;
      query: Record<string, string>;
      uiState: Record<string, string>;
      state: unknown | null;
      getParam(key: string): string | null;
      getPatternParam(key: string): string | null;
      getUIState(key: string): string | null;
      hasUIState(key: string): boolean;
      getUIStates(keys: string[]): Record<string, string | null>;
      getHashSegment(name: string): string | null;
      hasHashSegment(name: string): boolean;
      getHashPath(name: string): string | null;
      getHashQuery(name: string): URLSearchParams | null;
      getHashQueryParam(name: string, key: string): string | null;
      test(pattern: string): boolean;
      toObject(): {
        path: string; // without base path
        pathWithoutExperience: string;
        fullPath: string;
        page: string;
        pagePattern: string;
        experience: string;
        params: Record<string, string>;
        query: Record<string, string>;
        state: unknown | null;
      };
    }>;
```

## Integration details

### SSR

- Server render and `static loader(ctx)` always see `{matched: false}`. In a
  loader, read route data from `ctx.params` and `ctx.query`.
- The first client render already sees the real snapshot. Render output that
  depends on it only after `firstUpdated()` (as in the example) so the first
  client render matches the server HTML. Data the server must render belongs
  in the page loader (`ctx.params`, `ctx.query`).
- The `ContextConsumer` bridge is installed only in the browser.
