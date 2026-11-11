# Theme context

> Source: `@servicenow/aiux-components-core@10.6.9` · `components/core/docs/usage/themeContext.md`

`themeContext` holds the page's current theme, `'light'` or `'dark'`. It is set
in the browser when `@servicenow/aiux-components-core` loads and whenever
`setThemeMode` runs; the same call stamps `data-theme` on `<html>` and `<body>`,
which is what theme CSS tokens key off. `@servicenow/aiux-services` re-exports
the same object. The theme preference (`glide.aiux.theme_mode`) is also a key in
`userPreferencesContext`, but writing that key with `setUserPreference` does not
change `themeContext`; use `setThemeMode`.

## Import

```js
import {themeContext} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement, themeContext, setThemeMode} from '@servicenow/aiux-components-core';

export class ThemeSwitch extends AIUXElement {
  static contexts = [themeContext];

  render() {
    const dark = themeContext.get() === 'dark';
    return html`
      <label class="aiux-label cursor-pointer gap-2">
        <span>Dark mode</span>
        <input
          type="checkbox"
          class="aiux-toggle"
          .checked=${dark}
          @change=${e => setThemeMode(e.target.checked ? 'dark' : 'light')}
        />
      </label>
    `;
  }
}
customElements.define('theme-switch', ThemeSwitch);
```

**What happens:** `setThemeMode` updates `data-theme`, the context (re-rendering
every subscriber), the favicon and `localStorage` synchronously, then saves the
preference to the instance.

## API

### Value

A `string` (see Data shapes).

| Field or method | Type | Meaning |
| --- | --- | --- |
| value | `'light' \| 'dark'` | Current theme. Default `'light'`. |
| `get()` | `() => string` | Current value. |
| `set(value)` | `(value: string) => void` | Replaces the value and notifies subscribers. See Updating. |
| `subscribe(callback)` | `(cb: (value: string) => void) => () => void` | Called with the new value on every `set`, even when unchanged; not called with the current value. Returns an unsubscribe function. |

Initial browser value, resolved once at module load:

On a page Karuna serves:

1. The pre-fetched user preference: `glide.aiux.theme_mode`, or
   `glide.aiux.mobile_theme_mode` when the user agent contains `SnMobile`
   (see `getThemePreferenceKey`). Both are pre-fetched on every page Karuna serves.
2. When that preference is empty, a valid theme stored in `localStorage` under
   `<user sys_id>:aiux-theme` (or any key ending in `aiux-theme`).
3. Otherwise `'light'`. An invalid value also resolves to `'light'`.

On a host page Karuna does not serve (e.g. a widget embedded in another
experience), the preference is not pre-fetched and `localStorage` is not read:
the value starts as `'light'`, then the user's instance preferences are
fetched. A style chosen in the instance theme picker
(`glide.ui.polaris.theme.variant`) decides first; without one,
the `getThemePreferenceKey()` preference does. If the result differs, it is
applied to `data-theme`, the context, and the favicon; nothing is saved.

### Providing

Provided automatically by `@servicenow/aiux-components-core` at module load. Do
not provide it yourself.

### Consuming

```js
// AIUXElement: re-render on change
static contexts = [themeContext];
render() {
  const isDark = themeContext.get() === 'dark';
}

// Imperative (non-render) work, e.g. rebuilding a chart or third-party editor
connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    this._apply(themeContext.get());
    this._unsub = themeContext.subscribe(theme => this._apply(theme));
  }
}
disconnectedCallback() {
  super.disconnectedCallback();
  this._unsub?.();
}
```

- **Updates when:** `setThemeMode(...)` or `themeContext.set(...)` is called, and
  once after load on pages Karuna does not serve if the fetched instance
  preference differs. Not updated by client navigation, by `setUserPreference` on the theme
  key, by the preference changing elsewhere (another tab, the server), or by
  code that edits `data-theme` directly.
- **Before a provider exists:** not applicable; the value is set before any
  element connects. On the server see SSR.
- There is no `@lit/context` bridge; `ContextConsumer` and `@consume` receive
  nothing. Use `static contexts` or `subscribe`.
- Styling needs no subscription: theme tokens and DaisyUI classes already follow
  `data-theme`. Subscribe only when JS reads the theme or computed colors.

### Updating

- `setThemeMode(theme)` is the supported way to change the theme; see
  Exported helpers.
- `themeContext.set(value)` changes only the context value and notifies
  subscribers. It does not change `data-theme`, `localStorage`, or the saved
  preference, so styled output does not switch.

### Exported helpers

All exported from `@servicenow/aiux-components-core` (`setThemeMode`, `getThemeMode`, and
`themeService` also from `@servicenow/aiux-services`).

| Export | Signature | Use |
| --- | --- | --- |
| `setThemeMode` | `(theme: 'light' \| 'dark') => Promise<void>` | Rejects with an `Error` for any other value, changing nothing. In the browser: writes `localStorage`, sets `data-theme` on `<html>` and `<body>`, sets the context, updates the favicon, then saves the preference from `getThemePreferenceKey()` with `setUserPreference`. A failed save is logged, not thrown, and the applied theme stays. On the server it only sets the context for the current request. |
| `getThemeMode` | `() => 'light' \| 'dark'` | Reads `data-theme` from `<body>`, or `'light'` when the attribute is absent. Only when `<body>` does not exist yet (a script in `<head>`) does it read `localStorage` instead, then `'light'`. Returns `'light'` on the server. Reads the DOM, not the context. |
| `themeService` | `{setThemeMode, getThemeMode}` | Object form of the two functions above. |
| `getThemePreferenceKey` | `() => string` | `'glide.aiux.mobile_theme_mode'` in the ServiceNow mobile app (user agent contains `SnMobile`), else `'glide.aiux.theme_mode'`. |

### Data shapes

```ts
type Theme = 'light' | 'dark';
```

## Integration details

### SSR

- The context is not resolved on the server: `themeContext.get()` returns
  `'light'` and `getThemeMode()` returns `'light'` during server rendering.
  Do not render theme-dependent markup from the value on the server; use CSS
  keyed off `data-theme`, or guard with `isServer` and apply in the browser.
- The value is never serialized to the client; the browser resolves it itself
  at module load (see Value).
