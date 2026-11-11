# Experience context

> Source: `@servicenow/aiux-context@1.2.161` · `context/docs/usage/experienceContext.md`

`experienceContext` is a global context holding a frozen snapshot of the
current experience's metadata. Core builds it once in the browser from the
experience config the server writes into the page head. It does not change on
navigation and nothing fetches more metadata automatically; code that has more
can merge it in with `experienceContextManager.setExperienceConfig`.

## Import

```js
import {experienceContext, experienceContextManager} from '@servicenow/aiux-context';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {experienceContext} from '@servicenow/aiux-context';

export class ExperienceBanner extends AIUXElement {
  static contexts = [experienceContext];
  static properties = {_hydrated: {state: true}};

  firstUpdated() {
    this._hydrated = true; // server HTML has no metadata; keep the first client render identical
  }

  render() {
    const experience = experienceContext.get();
    if (!this._hydrated || !experience.isLoaded) return html``;
    const tagline = experience.properties?.tagline ?? '';
    return html`
      <div class="aiux-navbar bg-base-200">
        <span class="text-lg font-semibold">${experience.title ?? experience.name}</span>
        <span class="text-sm opacity-70">${tagline}</span>
      </div>
    `;
  }
}
customElements.define('experience-banner', ExperienceBanner);
```

**What happens:** the first render matches the server HTML (empty); after
`firstUpdated()` the banner renders. `static contexts` re-renders the element
whenever the value is replaced. Read through `experienceContext.get()` in `render()`; do not cache
the snapshot in a field.

## API

### Value

A frozen `ExperienceMetadata` object (see Data shapes).

| Field or method | Type | Meaning |
| --- | --- | --- |
| `sysId` | `string \| null` | sys_id of the experience record (`sys_aix_experience`). |
| `name` | `string` | Experience name (its URL suffix, e.g. `aict`). Without a server config: last segment of the app base path. `''` on the server. |
| `appShell` | `string \| null` | App shell reference from the experience record. |
| `title` | `string \| null` | Experience title. |
| `telemetryConfig` | `unknown \| null` | The app's telemetry configuration when the instance has one for it; otherwise `null`. |
| `theme` | `string \| null` | Theme reference from the experience record. |
| `properties` | `Record<string, string> \| null` | Experience properties (`sys_aix_experience_properties`) as `{name: value}`. |
| `urlSuffix` | `string \| null` | URL suffix of the experience. |
| `dashboardSysIds` | `string[] \| null` | sys_ids of dashboards attached to the experience. |
| `urlRewriteRules` | `{experienceRules, globalRules}` | Always present. `experienceRules` from the experience; `globalRules` are the instance-wide rules. The app layout applies them in `navigate()`. |
| `isLoaded` | `boolean` | `true` when built from the server config; `false` otherwise (other nullable fields are `null`). |

- Only the fields above come from the server config; other keys in it (for
  example `scope` or `themeData`) are not copied.

### Providing

Provided automatically. `@servicenow/aiux-components-core` creates it at
module load, so it exists before any element connects. Do not provide it
yourself.

### Consuming

```js
// AIUXElement (Karuna)
static contexts = [experienceContext];
render() { const experience = experienceContext.get(); /* ... */ }
```

```js
// @lit/context ContextConsumer (aiux-kit style), browser only
import {ContextConsumer} from '@lit/context';

this._experience = new ContextConsumer(this, {
  context: experienceContext,
  subscribe: true,
  callback: experience => { /* called with the current value, then on every change */ }
});
```

```js
// Outside an element: fires immediately with the current value, then on every change
const unsubscribe = experienceContextManager.subscribe(experience => { /* ... */ });
```

- **Updates when:** `experienceContextManager.setExperienceConfig(...)` or
  `experienceContext.set(...)` is called. Not updated by navigation, by editing
  the experience or theme on the instance, or by anything else automatic.
- **Before a provider exists:** not applicable; `get()` never returns
  `undefined`. With no server config (for example a page served without an
  experience record) it returns `isLoaded: false`, all nullable fields `null`,
  `name` from the base path, and empty `experienceRules`.
- `ContextConsumer` requests are answered by a `window` listener; with
  `subscribe: false` the callback runs once with the current value.
- `experienceContext.subscribe(callback)` returns an unsubscribe function and
  does not call `callback` with the current value.

### Updating

The value is frozen; replace it rather than mutating it.
`experienceContextManager.setExperienceConfig(config)` shallow-merges `config`
into the current value, sets `isLoaded: true`, and notifies both
`experienceContext` and manager subscribers. A falsy `config` is ignored.

```js
import {experienceContextManager} from '@servicenow/aiux-context';

// In the browser, e.g. in firstUpdated() after fetching extra metadata:
experienceContextManager.setExperienceConfig({title: record.title, properties: record.properties});
```

Set it in the browser only; do not set it from a loader or during server
render.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `experienceContextManager.subscribe` | `(callback: (value: ExperienceMetadata) => void) => () => void` | Subscribe outside an element; calls `callback` immediately. Throws if `callback` is not a function. |
| `experienceContextManager.get` | `(key: string) => unknown` | `value[key]`, or `null` when absent. |
| `experienceContextManager.sysId` / `.name` / `.isLoaded` | getters | Same as the matching fields of `experienceContext.get()`. |
| `experienceContextManager.setExperienceConfig` | `(config: Partial<ExperienceMetadata>) => void` | Merge `config` into the value and set `isLoaded: true` (see Updating). |
| `experienceContextManager.destroy` | `() => void` | Drop all manager subscribers and reset the value to what was built at page load. For test isolation. |

### Data shapes

```ts
type ExperienceMetadata = Readonly<{
  sysId: string | null;
  name: string;
  appShell: string | null;
  title: string | null;
  telemetryConfig: unknown | null;
  theme: string | null;
  properties: Record<string, string> | null;
  urlSuffix: string | null;
  dashboardSysIds: string[] | null;
  urlRewriteRules: {experienceRules: unknown[]; globalRules: unknown[]};
  isLoaded: boolean;
  [key: string]: unknown; // keys merged in at runtime
}>;
```

## Integration details

### SSR

- Server render sees the default value (`isLoaded: false`, `name: ''`,
  nullable fields `null`).
- The first client render already sees the real metadata. Render output that
  depends on it only after `firstUpdated()` (as in the example) so the first
  client render matches the server HTML.
- The `ContextConsumer` bridge is installed only in the browser.
