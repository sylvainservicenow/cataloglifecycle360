# AIUXControlModal

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-modal.md`

A blocking modal dialog built on the native `<dialog>` element's `showModal()`, with `header`, `body`, `footer`, and `trigger` slots, a size preset system, optional drag-resize (via CSS `resize`) with keyboard-accessible resizing, a focus trap, and declarative footer action buttons. This is a non-form-field utility control — it does not extend the form-field control stack and has no `value`/`name`/`required` properties.

**Open/close state ownership.** `open` is the single source of truth and reflects as an attribute, but the component also opens/closes imperatively through the native dialog in response to user action (close button, backdrop, Escape, the native `close` event). Treat `open` as two-way: write it back from `OPENED`/`CLOSED` the same way a form control's host writes back `onValueChange`, or your own state will drift out of sync with what's actually on screen — e.g. the host still thinks the modal is open after the user pressed Escape, so a later `.open=${true}` from the host is a no-op against the dialog's internal "already open" check in `show()`.

Built in: the native-`<dialog>` open/close lifecycle, a focus trap with an explicit header→body→footer→resize-handle tab order, Escape-to-close, backdrop-click handling, keyboard resizing (arrow keys, Shift for larger steps) with min/max clamping, and a slotted-trigger click-to-open wiring. Do not reimplement dialog focus trapping or resize clamping yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyModalHost extends AIUXElement {
  static properties = {
    open: {type: Boolean}
  };

  render() {
    return html`
      <button slot="trigger" @click=${() => (this.open = true)}>
        Open dialog
      </button>
      <aiux-control-modal
        .open=${this.open}
        @AIUX_CONTROL_MODAL#CLOSED=${() => (this.open = false)}
      >
        <span slot="header">Confirm</span>
        <div slot="body">Are you sure?</div>
      </aiux-control-modal>
    `;
  }
}
```

**What happens:** setting `open` to `true` calls the modal's internal `show()`, which invokes native `showModal()`, activates the focus trap, and fires `AIUX_CONTROL_MODAL#OPENED` once. Closing (Escape, backdrop click if enabled, the built-in close button, or setting `open` back to `false`) invokes `hide()`, deactivates the trap, and fires `AIUX_CONTROL_MODAL#CLOSED`.

### Additional patterns

Declarative footer actions instead of building your own footer buttons:

```js
html`
  <aiux-control-modal
    open
    .footerActions=${[
      {action: 'cancel', label: 'Cancel', variant: 'secondary'},
      {action: 'ok', label: 'OK', variant: 'primary'}
    ]}
    @AIUX_CONTROL_MODAL#FOOTER_ACTION=${e => console.log(e.detail.action.action)}
  >
    <span slot="header">Title</span>
    <div slot="body">Body content</div>
  </aiux-control-modal>
`;
```

A trigger element that opens the modal itself, without the host managing `open`:

```js
html`
  <aiux-control-modal size="sm">
    <button slot="trigger">Open</button>
    <span slot="header">Title</span>
    <div slot="body">Body content</div>
  </aiux-control-modal>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Reflects. Setting it opens/closes the dialog and toggles the focus trap. | Whether the modal is open. |
| `resize` | `resize` | `'none' \| 'both' \| 'horizontal' \| 'vertical'` | `'none'` | Read on render; determines whether the resize handle and CSS `resize` are enabled and which axes. | Enables user resizing, and along which axis. |
| `minWidth` | `min-width` | `string` (CSS length, e.g. `'400px'`) | `''` | Read when computing effective min size; falls back to 150px (or 480px when resizable and unset). | Minimum modal box width. |
| `minHeight` | `min-height` | `string` | `''` | Same as `minWidth`; falls back to 150px. | Minimum modal box height. |
| `size` | `size` | `'auto' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'lg'` | Read on render; ignored (overridden by resizable width classes) when `resize !== 'none'`. | Preset modal width. |
| `modalOffsetTop` | `offset-top` | `string` (px number as string) | `''` | Read on render; when set, pins the modal near the top instead of centering. | Top offset in pixels for a top-anchored (instead of centered) layout. A value below `100` is silently clamped up to `100` — passing `offset-top="40"` still renders with a 100px top padding, not 40px. |
| `headerVariant` | `header-variant` | `'default' \| 'muted'` | `'default'` | Read on render; toggles header divider and background styling. | Visual variant of the header. |
| `bodyScroll` | `body-scroll` | `'both' \| 'x' \| 'y' \| 'none'` | `'both'` | Read on render. | Which axes the body region scrolls on overflow. |
| `initialFocus` | `initial-focus` | `'close' \| 'body'` | `'close'` | Read when the modal opens/activates the focus trap. | Whether the close button or the first focusable body element receives initial focus. |
| `appendToPayload` | `append-to-payload` | JSON-serializable value, via a JSON attribute converter | `null` | Deep-cloned into every dispatched event's `detail.appendToPayload`. | Arbitrary caller data echoed back on every modal event. |
| `closeOnBackdrop` | `close-on-backdrop` | `boolean` | `false` | Read on backdrop click. | Whether clicking the backdrop closes the modal. |
| `closeOnEscape` | `close-on-escape` | `boolean` | `true` | Read on Escape keydown. | Whether pressing Escape closes the modal. **Gotcha:** this only gates the component's own `document`-level Escape listener. The underlying native `<dialog>` shown via `showModal()` has its own built-in Escape-to-cancel behavior that this component never calls `preventDefault()` on, so setting `closeOnEscape="false"` does not actually stop Escape from closing the modal — the native dialog still fires its own `close` event, which the component treats like any other close and dispatches `CLOSED` for. |
| `content` | — (`attribute: false`, property only) | `unknown` (string is rendered via `unsafeHTML`; anything else is rendered as-is) | `null` | Read on render; when set, replaces the `body` slot entirely. | Programmatic body content, bypassing the `body` slot. |
| `footerActions` | `footer-actions` | `ModalFooterAction[]` (`{action?, label?, variant?, additionalConfig?}[]`), via a JSON-array attribute converter | `[]` | Read on render; each entry becomes a footer button. | Declarative footer action buttons. |

Also inherits the base `AIUXElement` properties/lifecycle; it does not carry any of the shared form-field identity properties (`value`, `name`, `required`, `mandatory`, etc.) — those do not apply to this control.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_MODAL#OPENED` | `{open: true, appendToPayload}` | Bubbles, composed; not cancelable | The modal finishes opening (once per open cycle). | |
| `AIUX_CONTROL_MODAL#CLOSED` | `{open: false, appendToPayload}` | Bubbles, composed; not cancelable | The modal closes, from any cause: close button, backdrop click (only when `closeOnBackdrop` is true), Escape (via the component's own listener when `closeOnEscape` is true, *or* via the native dialog's own Escape handling regardless of `closeOnEscape` — see the gotcha on that property), the native `close` event, or `open` set to `false` from the host. | Only dispatched if `OPENED` was dispatched for the current open cycle, so `OPENED`/`CLOSED` always come in matched pairs. |
| `AIUX_CONTROL_MODAL#RESIZED` | `{width: number, height: number, appendToPayload}` | Bubbles, composed; not cancelable | The modal box is resized while open and `resize !== 'none'` (or a `minWidth`/`minHeight` enforcement adjusts it). | Throttled to at most once per animation frame while resizing (quantized to 10px steps), followed by one exact-size dispatch ~150ms after resizing stops. Only fires when the size actually changed. |
| `AIUX_CONTROL_MODAL#FOOTER_ACTION` | `{index: number, action: ModalFooterAction, appendToPayload}` | Bubbles, composed; not cancelable | A footer action button (from `footerActions`) is clicked. | `action.additionalConfig`, if present, is deep-cloned before delivery. |

### Slots

| Slot | Description |
| --- | --- |
| `trigger` | An element that opens the modal on click; automatically wired up via a `slotchange` listener, works even if the slotted content changes later. |
| `header` | Header content, shown next to the built-in close button. |
| `body` | Body content. Ignored (not rendered) if the `content` property is set. |
| `footer` | Additional footer content, rendered alongside any `footerActions` buttons. |

### Methods

| Method | Description |
| --- | --- |
| `show()` | Opens the modal (idempotent if already open); sets `open = true`, calls native `showModal()`, dispatches `OPENED`, and schedules initial focus. |
| `hide()` | Closes the modal (idempotent if already closed); sets `open = false` and calls native `close()`, which triggers `CLOSED`. |
| `focus(options?)` | Focuses the resolved initial-focus target (close button, or first body focusable when `initial-focus="body"`). |

## Integration details

### Platform requirements

None beyond a browser that supports the native `<dialog>` element and the CSS `resize` property (used for pointer drag-resize; keyboard resizing works independently of that).

### SSR

No `isServer` guard is present in this component. `connectedCallback()` unconditionally calls `document.addEventListener('keydown', ...)` for Escape handling, so this listener attachment is not itself guarded against a server render — evaluate whether your SSR harness tolerates this before rendering the component server-side with `open` initially `true`.

### Lifecycle

`firstUpdated()` wires the native dialog's `close` event, sets up a `ResizeObserver` on the modal box (enforcing min sizes and emitting `RESIZED` while open), and attaches trigger-slot listeners. The focus trap activates/deactivates in `updated()` whenever `open` changes.

### Sizing and layout

Non-resizable sizes map to fixed max-width classes (`sm`→`max-w-sm`, `md`→`max-w-md`, `lg`→`max-w-5xl`, `full`→no max-width at `11/12` width, `auto`→fit content). When `resize !== 'none'`, the size preset is overridden with `max-w-none` and an inline `max-width: calc(100vw - 96px)` so native resize stays viewport-bounded; minimum width/height are enforced by both the `ResizeObserver` (drag-resize) and the keyboard handler (10px/40px steps). `modalOffsetTop`, when set, switches the dialog from centered to top-anchored with a computed `max-height`. The modal renders inside the host's own shadow DOM using the native `<dialog>`'s top-layer for stacking — it does not use a teleport/portal.

## Accessibility, localization, and customization

The dialog has `aria-labelledby` pointing at the header, a focus trap with an explicit tab order (header → body → footer → resize handle), and a resize handle exposed as `role="button"` with a screen-reader-only usage hint and `aria-label`. Escape-to-close and backdrop-click-to-close are both configurable. Built-in copy — the close button's `aria-label`, the resize handle's `aria-label` and instructions, the hidden backdrop-close button text, and the default footer-action button label ("Action") — all come through `@lit/localize`'s `msg()`, so they follow the host locale rather than being hard-coded English. Footer action button labels themselves are supplied by the host via `footerActions[].label` and are not localized by this control. There are no documented CSS parts or custom properties for external theming; visual variants are controlled entirely through properties (`size`, `headerVariant`, `bodyScroll`, `resize`).
