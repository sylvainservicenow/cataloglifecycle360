# Density context

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/densityContext.md`

`densityContext` holds the current user's display density, resolved on the
server from three user preferences (`glide.ui.density_mode` and the polaris
compact flags `glide.ui.polaris.theme.infodensity` and `glide.ui.compact`) and
sent to the browser with the page. Density CSS tokens follow the `data-density`
attribute on `<html>`, which the server sets at page load; the context is for
code that needs the mode in JS. Saving any of the preferences with
`setUserPreference` does not change this context; call `setDensity` as well.

## Import

```js
import {densityContext} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement, densityContext} from '@servicenow/aiux-components-core';

const ROW_HEIGHT = {comfy: 48, normal: 40, cozy: 32};

export class TaskRows extends AIUXElement {
  static contexts = [densityContext];
  static properties = {tasks: {type: Array}};

  constructor() {
    super();
    this.tasks = [];
  }

  render() {
    const height = ROW_HEIGHT[densityContext.get()] ?? ROW_HEIGHT.normal;
    return html`
      <ul>
        ${this.tasks.map(
          t => html`<li style="height:${height}px" class="flex items-center">${t.label}</li>`
        )}
      </ul>
    `;
  }
}
customElements.define('task-rows', TaskRows);
```

## API

### Value

A `string` (see Data shapes).

| Field or method | Type | Meaning |
| --- | --- | --- |
| value | `'comfy' \| 'normal' \| 'cozy'` | `comfy`: more spacing, larger elements (UI label "Spacious"). `normal`: default ("Default"). `cozy`: tighter spacing, smaller elements ("Compact"). Default `'normal'`. |
| `get()` | `() => string` | Current value. |
| `subscribe(callback)` | `(cb: (value: string) => void) => () => void` | Called with the new value on every `setDensity` call, even when unchanged; not called with the current value. Returns an unsubscribe function. |
| `set()` | — | Throws `Error`: the context is immutable. Use `setDensity`. |

All three preferences are pre-fetched on every page. The value resolves in
this order:

1. A polaris compact flag that says compact (`infodensity` is `'compact'`, or,
   when `infodensity` is unset, `glide.ui.compact` is `true`): `'cozy'`,
   whatever `density_mode` holds.
2. `density_mode` is not one of the three modes: `'normal'`.
3. `density_mode` is `'cozy'` but a polaris flag explicitly says not compact
   (`infodensity` is `'default'`, or, when `infodensity` is unset,
   `glide.ui.compact` is `false`): `'normal'`.
4. Otherwise: `density_mode`.

So writing `density_mode` alone does not switch compact on or off while a
polaris flag is set.

### Providing

Provided automatically. The framework resolves it on every server request (and
in the browser on client-rendered pages) and hydrates it from the page data. Do
not provide it yourself.

### Consuming

```js
// AIUXElement
static contexts = [densityContext];
render() {
  const density = densityContext.get(); // 'comfy' | 'normal' | 'cozy'
}
```

- **Updates when:** `setDensity(...)` is called. Every call notifies all
  subscribers. Not updated by client navigation, by `setUserPreference` on any
  of the three density preferences, or by a preference changing elsewhere.
- **Before a provider exists:** not applicable. In the browser the value is
  hydrated before elements render; code running before hydration reads
  `'normal'`.
- There is no `@lit/context` bridge; `ContextConsumer` and `@consume` receive
  nothing. Use `static contexts` or `subscribe`.
- For styling, prefer the density tokens (they follow `html[data-density]`, or
  `:host([data-density])`) over reading the context.

### Updating

`setDensity(mode)` sets the value for the page and notifies subscribers. It
does not validate `mode`, does not save the preference, and does not change
`<html data-density>`, so token-based styling keeps the page-load density until
the next full page load. To change density persistently, do what the nav
preferences panel does: write the polaris flags to match first, then
`density_mode`, so the next page load resolves to the same mode:

```js
import {DENSITY_MODES, setDensity, setUserPreference} from '@servicenow/aiux-components-core';

async function changeDensity(mode) {
  if (!DENSITY_MODES.includes(mode)) return;
  const compact = mode === 'cozy';
  // Each call rejects on save failure, leaving setDensity uncalled.
  await setUserPreference('glide.ui.compact', String(compact));
  await setUserPreference('glide.ui.polaris.theme.infodensity', compact ? 'compact' : 'default');
  await setUserPreference('glide.ui.density_mode', mode);
  setDensity(mode);
}
```

### Exported helpers

All exported from `@servicenow/aiux-components-core`.

| Export | Signature | Use |
| --- | --- | --- |
| `setDensity` | `(mode: string) => void` | Set the context value (see Updating). On the server it sets the value for the current request only. |
| `DENSITY_MODES` | `string[]` | `['comfy', 'normal', 'cozy']`. Validate input against it. |
| `DEFAULT_DENSITY` | `'normal'` | Value used when no valid preference is found. |
| `resolveDensity` | `(prefs?: Record<string, unknown>) => Density` | Applies the resolution order above to a `{preferenceName: value}` map and returns the mode. Pure; does not read or set the context. |

### Data shapes

```ts
type Density = 'comfy' | 'normal' | 'cozy';
```

## Integration details

### SSR

- The value is resolved per request on the server, so `densityContext.get()`
  returns the user's density during server rendering, and the same value is
  serialized to the browser.
- When the value is `comfy` or `cozy`, the server also sets
  `data-density` on `<html>`; for `normal` the attribute is absent.
