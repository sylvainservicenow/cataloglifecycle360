# User preferences context

> Source: `@servicenow/aiux-context@1.2.161` · `context/docs/usage/userPreferencesContext.md`

`userPreferencesContext` is a global context holding `{[preferenceName]: value}`
for the preferences the server pre-fetched for this page. It is seeded once in
the browser and changes only when code writes to it. `@servicenow/aiux-context`
and `@servicenow/aiux-services` re-export the same object.

## Import

```js
import {userPreferencesContext} from '@servicenow/aiux-components-core';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {
  AIUXElement,
  userPreferencesContext,
  getUserPreference,
  setUserPreference
} from '@servicenow/aiux-components-core';

export class DetailsToggle extends AIUXElement {
  static contexts = [userPreferencesContext];
  static properties = {_error: {state: true}};

  async _onChange(e) {
    const input = e.target;
    this._error = '';
    try {
      await setUserPreference('x_acme_app.show_details', String(input.checked));
    } catch {
      input.checked = !input.checked; // context is unchanged, so restore the control
      this._error = 'Could not save the preference.';
    }
  }

  render() {
    // String literal: the build registers this name for pre-fetching.
    const on = getUserPreference('x_acme_app.show_details') === 'true';
    return html`
      <label class="aiux-label cursor-pointer gap-2">
        <span>Show details</span>
        <input
          type="checkbox"
          class="aiux-toggle"
          .checked=${on}
          @change=${this._onChange}
        />
      </label>
      ${this._error ? html`<p class="text-error text-sm">${this._error}</p>` : ''}
    `;
  }
}
customElements.define('details-toggle', DetailsToggle);
```

**What happens:** `setUserPreference` saves to the instance, then writes the
new value into the context, which re-renders every element that declares
`static contexts = [userPreferencesContext]`. If the save fails it rejects and
the context is unchanged, so the handler restores the checkbox.

## API

### Value

A plain object `UserPreferences` (see Data shapes).

| Field or method | Type | Meaning |
| --- | --- | --- |
| `[preferenceName]` | `string \| null` | Value of `sys_user_preference` `preferenceName` for the current user; `null` when the user has none or it could not be fetched. |

Keys present in the browser:

- Every name passed as a **string literal** to `getUserPreference(...)`
  imported by name from `@servicenow/aiux-components-core`, in the app or the
  platform components it uses. A variable or computed argument is not found.
- Always: `user.language`, `glide.polaris.animation_disabled`,
  `glide.aiux.theme_mode`, `glide.aiux.mobile_theme_mode`,
  `glide.ui.accessibility.accessible.tooltips`,
  `glide.ui.accessibility.voice_input`, `glide.ui.density_mode`,
  `glide.ui.compact`, `glide.ui.polaris.theme.infodensity`.
- Any key written later through `setUserPreference` or `set()`.
- Names pre-fetched later during client navigation are available to
  `getUserPreference` but are not added to this map.

### Providing

Provided automatically. `@servicenow/aiux-components-core` creates it at
module load and seeds it from the page's pre-fetched requirements data. Do not
provide it yourself.

### Consuming

```js
// AIUXElement (Karuna)
static contexts = [userPreferencesContext];
render() {
  const format = getUserPreference('glide.ui.date_format'); // or userPreferencesContext.get()['glide.ui.date_format']
}
```

- **Updates when:** anything calls `userPreferencesContext.set()`, including
  `setUserPreference` after a successful save. Every write notifies all
  subscribers, whichever key changed. Not updated by navigation or by the
  preference changing elsewhere (another tab, the server).
- **Before a provider exists:** not applicable; `get()` never returns
  `undefined`. With no pre-fetched data it returns `{}`.
- There is no `@lit/context` bridge for this context; `ContextConsumer` and
  `@consume` receive nothing. Use `static contexts`.
- `userPreferencesContext.subscribe(callback)` receives the whole map on each
  write, returns an unsubscribe function, and is not called with the current
  value.

### Updating

- `setUserPreference(name, value)` (from `@servicenow/aiux-components-core`)
  saves the preference for the current user on the instance, then sets
  `{...current, [name]: value}`. It resolves once the save succeeds, and
  rejects with an `Error` when the request fails or the response is not OK,
  leaving the context unchanged. Saving `glide.polaris.animation_disabled` also updates reduced
  motion for all `AIUXElement`s.
- `userPreferencesContext.set(map)` replaces the whole map locally without
  saving; spread the current value to keep other keys.
- Set it in the browser only; do not set it from a loader or during server
  render.
- `userPreferencesService` from `@servicenow/aiux-services` writes the same
  context: `setUserPreference` patches one key locally, `saveUserPreference`
  saves and patches.

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `getUserPreference` | `(name: string) => string \| null` | Read one preference. Checks the context, then the pre-fetched data; `null` (with a console error) when not pre-fetched. Pass a string literal. |
| `setUserPreference` | `(name: string, value: string) => Promise<void>` | Save a preference and update the context (see Updating). |

Both are exported from `@servicenow/aiux-components-core`.

### Data shapes

```ts
type UserPreferences = Record<string, string | null>;
```

## Integration details

### SSR

- On the server the context is not filled per request. In server-rendered
  output, read values with `getUserPreference(name)`, which reads the current
  request's pre-fetched data.
- `setUserPreference` only works in the browser.
- Do not call `userPreferencesContext.set()` from a loader or during server
  render.
