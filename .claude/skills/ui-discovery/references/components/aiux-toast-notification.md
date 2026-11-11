# Toast

> Source: `@servicenow/aiux-components-toast@1.5.3` · `components/external/toast/docs/usage/aiux-toast-notification.md`

`<aiux-toast-notification>` shows one message at a fixed viewport position.
It is visible as soon as it is connected, auto-dismisses after `duration` ms,
and fires `toast-dismiss` once its exit animation ends. It never removes itself
from the DOM; removing it is the host's job (`triggerTransientToast()` does this
for you).

Built in: type icon and colors, a dismiss button, and enter/exit animations.
`message` is plain text; links and other HTML go in the default slot. Toasts do
not stack: each element positions itself independently, so several at the same
`position` overlap.

## Import

```js
import '@servicenow/aiux-components-toast';
// Helper, if needed:
import {triggerTransientToast} from '@servicenow/aiux-components-toast';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {triggerTransientToast} from '@servicenow/aiux-components-toast';

@customElement('my-save-button')
export class MySaveButton extends AIUXElement {
  // Supplied by the parent; toast only after it settles.
  @property({attribute: false}) save?: () => Promise<unknown>;

  private async _save() {
    if (!this.save) return; // nothing to save: no success toast
    try {
      await this.save();
      triggerTransientToast('Record saved');
    } catch {
      triggerTransientToast('Could not save the record', 'error');
    }
  }

  render() {
    return html`<button
      class="aiux-btn"
      ?disabled=${!this.save}
      @click=${this._save}
    >
      Save
    </button>`;
  }
}
```

**What happens:** `triggerTransientToast(message, type = 'success')` appends a
toast to `document.body` at `bottom-end`, dismissible, with a 5000 ms duration,
and removes it on `toast-dismiss`, with a fallback removal scheduled at
5500 ms. It does nothing on the server.

### Additional patterns

Declarative toast with an action button that stays until dismissed (class
fragment; `state` from `lit/decorators.js`, `nothing` from `lit`, `_undo` is the host's restore):

```ts
@state() private _showUndo = false;

render() {
  return html`
    ${this._showUndo
      ? html`
          <aiux-toast-notification
            type="warning"
            message="Record deleted."
            position="top-center"
            duration="0"
            @toast-dismiss=${() => (this._showUndo = false)}
          >
            <button class="aiux-btn aiux-btn-sm" @click=${this._undo}>Undo</button>
          </aiux-toast-notification>
        `
      : nothing}
  `;
}
```

Toast with a link. `triggerTransientToast()` takes plain text only, so render
the element and put the link in the default slot; `duration="0"` gives the user
time to reach it:

```js
html`
  <aiux-toast-notification type="success" message="Saved." duration="0">
    <a class="aiux-link" href="/incident/123">Open record</a>
  </aiux-toast-notification>
`;
```

## API

### Properties and attributes

Attributes are the lowercased property names.

| Property      | Attribute     | Type                                                                     | Default     | Update behavior            | Description                                                                                                                                              |
| ------------- | ------------- | ------------------------------------------------------------------------ | ----------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `type`        | `'info' \| 'success' \| 'warning' \| 'error'`                            | `'info'`    | Updates immediately        | Colors and default icon. Unknown values render as `info`.                                                                                                |
| `message`     | `message`     | `string`                                                                 | `''`        | Updates immediately        | Plain text. Any markup, `<a>` and `<br />` included, renders as literal text. Put HTML in the default slot (see below).                                  |
| `position`    | `position`    | `` `${'top' \| 'middle' \| 'bottom'}-${'start' \| 'center' \| 'end'}` `` | `'top-end'` | Updates immediately        | Viewport position, 1rem from the edges. Empty string uses `top-end`.                                                                                     |
| `dismissible` | `dismissible` | `boolean`                                                                | `true`      | Updates immediately        | Shows the ✕ button. Set `false` with a property binding (`.dismissible=${false}`).                                                                       |
| `duration`    | `duration`    | `number` (ms)                                                            | `3000`      | On connect and on `show()` | Auto-dismiss delay; `0` disables it. The timer starts when the element connects; changing `duration` later does not restart it. Hover does not pause it. |
| `icon`        | `icon`        | `string`                                                                 | `''`        | Updates immediately        | Text or emoji that replaces the type icon.                                                                                                               |

HTML content (links, line breaks) goes in the default slot. The host owns it:
sanitize HTML from a server, script, or user input before rendering it (never
pass an unsanitized string to `unsafeHTML()` or `innerHTML`), and style it,
since slotted content uses the host's CSS. The toast's `role` container wraps
the slot, so slotted text is part of the live region.

### Events

| Event           | `detail`             | Delivery                          | Fires when                                                                                                                  | Notes                                                                                                                                                                                      |
| --------------- | -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `toast-dismiss` | `ToastDismissDetail` | Bubbles, composed, not cancelable | The exit animation ends after the ✕ button, the auto-dismiss timer, or `dismiss()`. With reduced motion, on the next frame. | Also fires when a visible toast is removed from the DOM; it is already detached then, so only listeners on the element itself receive it. The element stays in the DOM, rendering nothing. |

### Slots

- Default: extra content after the message, before the ✕ button (e.g. an
  action button, a link, or other HTML; see the host's responsibilities above).

### Methods

| Method      | Effect                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `dismiss()` | Plays the exit animation, then hides the toast and fires `toast-dismiss`. No-op when already hidden.   |
| `show()`    | Shows a hidden toast with the entry animation and restarts the auto-dismiss timer when `duration > 0`. |

The `visible` field reports whether the toast is shown; it starts `true`.
Setting it directly skips the timer, animations, and `toast-dismiss`.

### Data shapes

```ts
interface ToastDismissDetail {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string; // the message text as set
}

function triggerTransientToast(
  message: string,
  type?: 'info' | 'success' | 'warning' | 'error' // default 'success'
): void;
```

`triggerTransientToast` is exported from the package root; the types are not.

## Integration details

### SSR

The toast renders on the server when visible; timers and animations start in
the browser. `triggerTransientToast()` is a no-op on the server.

### Lifecycle

Removing a visible toast fires `toast-dismiss` and leaves it hidden;
re-attaching it shows nothing until `show()` is called.

### Sizing and layout

`position: fixed` with `z-index: 50`; the host element takes no layout space.
The toast is 26.5rem to 48rem wide; long messages wrap.

## Accessibility, localization, and customization

- **Accessibility:** `warning` and `error` use `role="alert"`; `info` and
  `success` use `role="status"`. The ✕ button is labelled. Auto-dismiss is on
  by default; use `duration="0"` when the toast has an action the user must
  reach.
- **Localization:** the ✕ button label and tooltip ("Dismiss toast") are
  localized. `message` and slotted content are shown as given; translate them.
- **Customization:** colors come from the page's DaisyUI theme per `type`.
  No other styling hooks.
