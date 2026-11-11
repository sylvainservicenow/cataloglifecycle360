# Dialog

> Source: `@servicenow/aiux-components-dialog@2.4.1` · `components/external/dialog/docs/usage/aiux-dialog.md`

`<aiux-dialog>` shows its slotted content in a dialog while `open` is `true`.
The close button, Escape, and backdrop click fire a cancelable
`aiux-dialog-close-request`; unless it is prevented, the element sets `open`
to `false` itself and fires `aiux-dialog-close`. Keep your own open state in
sync from `aiux-dialog-close`.

Built in: backdrop, close button, enter/exit animation (reduced when the user
prefers reduced motion), moving focus in and restoring it on close, Tab
trapping (modal), body scroll lock (modal), stacking of several open dialogs,
header dragging (modeless), and a resize handle (optional). Footer and action
buttons are the host's content.

## Import

```js
import '@servicenow/aiux-components-dialog';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-dialog';

@customElement('my-delete-confirm')
export class MyDeleteConfirm extends AIUXElement {
  @state() private _open = false;

  private _confirm() {
    this.dispatchEvent(
      new CustomEvent('my-delete-requested', {bubbles: true, composed: true})
    );
    this._open = false;
  }

  render() {
    return html`
      <button class="aiux-btn" @click=${() => (this._open = true)}>
        Delete
      </button>
      <aiux-dialog
        size="sm"
        ?open=${this._open}
        @aiux-dialog-close=${() => (this._open = false)}
      >
        <h2 slot="header">Delete record?</h2>
        <p>This cannot be undone.</p>
        <div slot="footer">
          <button class="aiux-btn" @click=${() => (this._open = false)}>
            Cancel
          </button>
          <button class="aiux-btn aiux-btn-error" @click=${this._confirm}>
            Delete
          </button>
        </div>
      </aiux-dialog>
    `;
  }
}
```

**What happens:** without the `aiux-dialog-close` handler, `_open` stays
`true` after the user closes the dialog, so setting it to `true` again does
not reopen it. Focus returns to the Delete button on close.

### Additional patterns

Block user close gestures (close button, Escape, backdrop) while there are
unsaved changes; setting `open` to `false` still closes:

```js
html`
  <aiux-dialog
    ?open=${open}
    @aiux-dialog-close-request=${e => {
      if (dirty) e.preventDefault();
    }}
    @aiux-dialog-close=${() => (open = false)}
    >…</aiux-dialog
  >
`;
```

Modeless, draggable panel (page stays interactive, no backdrop):

```js
html`
  <aiux-dialog
    .isModal=${false}
    ?open=${open}
    dialog-label="Notes"
    @aiux-dialog-close=${() => (open = false)}
  >
    <div slot="header">Notes</div>
    <textarea></textarea>
  </aiux-dialog>
`;
```

## API

### Properties and attributes

Booleans that default to `true` can be turned off only with a property
binding (`.isModal=${false}`); an attribute value of `"false"` still means
`true`.

| Property               | Attribute                 | Type                       | Default | Update behavior                                                                | Description                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------- | -------------------------- | ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`                 | `open` (reflects)         | `boolean`                  | `false` | Updates immediately                                                            | Opens or closes the dialog with animation. The element sets it to `false` on an unprevented close request. When `false`, nothing renders once the exit animation ends.                                                                                                                                                                                           |
| `size`                 | `size` (reflects)         | `DialogSize`               | `'md'`  | Updates immediately                                                            | Width: `sm` 300 px, `md` 512 px, `lg` 800 px, `xl` 1140 px, `fullscreen` full width and viewport height minus 32 px. Ignored while `customSize` is set.                                                                                                                                                                                                          |
| `customSize`           | `custom-size` (JSON)      | `DialogCustomSize \| null` | `null`  | Updates immediately                                                            | Overrides `size`. `width` defaults to `100%`, `height` to `auto`. `maxWidth` is not currently used.                                                                                                                                                                                                                                                              |
| `isModal`              | `is-modal` (reflects)     | `boolean`                  | `true`  | Backdrop and dragging immediately; focus trapping and scroll lock on next open | `true`: backdrop, Tab trapping, scroll lock. `false`: no backdrop, page stays interactive, focus can leave, draggable by the header, starts 50 px from the top-left of the viewport.                                                                                                                                                                             |
| `showCloseButton`      | `show-close-button`       | `boolean`                  | `true`  | Updates immediately                                                            | Close (×) button in the top corner.                                                                                                                                                                                                                                                                                                                              |
| `closeOnEscape`        | `close-on-escape`         | `boolean`                  | `true`  | Updates immediately                                                            | Escape requests close, for the topmost open dialog only.                                                                                                                                                                                                                                                                                                         |
| `closeOnBackdropClick` | `close-on-backdrop-click` | `boolean`                  | `true`  | Updates immediately                                                            | Modal only: clicking outside the dialog box requests close.                                                                                                                                                                                                                                                                                                      |
| `preventScroll`        | `prevent-scroll`          | `boolean`                  | `true`  | Takes effect on next open                                                      | Modal only: locks `document.body` scrolling while open.                                                                                                                                                                                                                                                                                                          |
| `resizable`            | `resizable` (reflects)    | `boolean`                  | `false` | Updates immediately                                                            | Native resize handle; minimum 300 × 200 px. No effect with `size="fullscreen"`.                                                                                                                                                                                                                                                                                  |
| `hidePadding`          | `hide-padding` (reflects) | `boolean`                  | `false` | Updates immediately                                                            | Removes header, body, and footer padding. Also restyles `#preferences-modal-title`, `.preferences-sidebar`, `.preference-wrapper`, `.tabs-wrapper`, `.aiux-form-control.fieldset`, `.toggle-container`, and `.toggle-content` anywhere in the shadow root (or subtree) containing the dialog, and the active-tab underline of slotted `aiux-tab-group` elements. |
| `dialogLabel`          | `dialog-label`            | `string`                   | `''`    | Updates immediately                                                            | Accessible name. When empty, the dialog is labelled by the header slot.                                                                                                                                                                                                                                                                                          |

### Events

| Event                       | `detail` | Delivery                          | Fires when                                                                             | Notes                                                                                                                                                     |
| --------------------------- | -------- | --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-dialog-close-request` | none     | Bubbles, composed, cancelable     | The user clicks the close button, presses Escape, or clicks the backdrop.              | `preventDefault()` keeps the dialog open. Not fired when the host sets `open` to `false`.                                                                 |
| `aiux-dialog-close`         | none     | Bubbles, composed, not cancelable | `open` changes from `true` to `false`, after a close request or when the host sets it. | Fires at the start of the exit animation. Also fired as `aix-dialog-close` with the same delivery. Not fired when an open dialog is removed from the DOM. |
| `aiux-dialog-open`          | none     | Bubbles, composed, not cancelable | `open` changes to `true`.                                                              |                                                                                                                                                           |

### Slots

- `header`: title. Hidden when empty. Slotted elements get the title text
  style. In modeless dialogs, dragging it moves the dialog (except
  from inputs, buttons, links, selects, and textareas).
- Default: body. Scrolls when the dialog reaches the viewport height.
- `footer`: actions. Hidden when empty. The slotted element is laid out as a
  right-aligned, wrapping row.

### Methods

None.

### Data shapes

```ts
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

interface DialogCustomSize {
  width?: string; // CSS length
  height?: string; // CSS length
  maxWidth?: string; // not currently used
}
```

These types are not exported from the package entry.

## Integration details

### SSR

A closed dialog renders nothing on the server. Focus handling, stacking, and
the scroll lock start in the browser.

### Lifecycle

Removing an open dialog from the DOM releases its scroll lock, stack
position, and focus trap without firing `aiux-dialog-close`. Slotted content
stays in the light DOM while closed, so its state persists across opens. A
modeless dialog keeps its dragged position across opens.

### Sizing and layout

- The dialog renders above the page; ancestors' `overflow` does not clip it.
- Several open modal dialogs stack; only the most recently opened is shown,
  and closing it reveals the previous one. Modeless dialogs stay visible.
- Height is at most the viewport height minus 32 px; the body scrolls.

## Accessibility, localization, and customization

- **Accessibility:** provide a `header` or `dialogLabel`. The box has
  `role="dialog"` and `aria-modal`. Opening focuses the first focusable
  element (the close button when shown); closing returns focus to the element
  focused before opening. Dragging is mouse-only.
- **Localization:** the close button's label is localized. All other text is
  slotted by the host.
- **Customization:** `--modal-backdrop` sets the backdrop color (default
  `rgba(0, 0, 0, 0.5)`). Slotted body text defaults to the base size and
  tertiary text color.
