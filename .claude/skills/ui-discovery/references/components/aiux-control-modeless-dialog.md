# AIUXControlModelessDialog

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-modeless-dialog.md`

A floating, non-blocking dialog panel — unlike `aiux-control-modal`, it does not block interaction with the rest of the page and is not centered by a native `<dialog>`. It positions itself at a corner or fixed point of the viewport, and can optionally be dragged by its header and resized from any edge/corner. This is a non-form-field utility control — it does not extend the form-field control stack and has no `value`/`name`/`required` properties.

**Open/close and layout-state ownership.** `open` is the host-owned source of truth for visibility, same as `aiux-control-modal`; write it back from `OPENED`/`CLOSED`. Position, size, minimized, maximized, and dragging/resizing state, however, are owned internally and are **not** exposed as properties — there is no `left`/`top`/`minimized` property to read or set. The only way to observe where the panel ended up is `RESIZE_END`'s `{width, height, left, top}` detail after a resize drag; drag moves and minimize/maximize toggles are not reported with coordinates at all. If you need to persist or restore panel geometry across sessions, you must capture it from `RESIZE_END` yourself — there is no getter.

Built in: viewport-aware initial positioning and clamping on window resize (including forcing fullscreen when the viewport is too small), pointer-based drag and 8-edge/corner resize with min-size and viewport clamping, a z-index stacking counter so the most-recently-interacted panel comes to front, and a teleport mechanism that moves the panel's rendered DOM outside the host's own shadow DOM to escape ancestor clipping/stacking. Do not reimplement any of this drag/resize/positioning logic yourself.

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

class MyPanelHost extends AIUXElement {
  static properties = {
    open: {type: Boolean}
  };

  render() {
    return html`
      <button @click=${() => (this.open = true)}>Open panel</button>
      <aiux-control-modeless-dialog
        .open=${this.open}
        title="My Dialog"
        position="bottom-right"
        .enableDrag=${true}
        .enableResize=${true}
        @AIUX_CONTROL_MODELESS_DIALOG#CLOSED=${() => (this.open = false)}
      >
        <div slot="body">Content here</div>
      </aiux-control-modeless-dialog>
    `;
  }
}
```

**What happens:** setting `open` to `true` creates a teleport element, moves the `heading`/`actions`/`body`/`footer` slotted content into it, computes an initial position from `position`/`offset`/`width`/`height`, and dispatches `AIUX_CONTROL_MODELESS_DIALOG#OPENED`. The panel is draggable by its header (when `enableDrag`) and resizable from its edges (when `enableResize`). Closing (close button, Escape while focused inside, backdrop click if enabled, or `open` set to `false`) restores the slotted content back onto the host and dispatches `AIUX_CONTROL_MODELESS_DIALOG#CLOSED`.

### Additional patterns

Adding minimize/maximize controls and a footer:

```js
html`
  <aiux-control-modeless-dialog open .showMinimize=${true} .showMaximize=${true}>
    <span slot="heading">Assistant</span>
    <div slot="body">Content</div>
    <div slot="footer">Footer actions</div>
  </aiux-control-modeless-dialog>
`;
```

Blocking a close from a listener (the `CLOSE`/`MINIMIZE` request events are cancelable, unlike `OPENED`/`CLOSED`/`MAXIMIZE`/`RESIZE_END`):

```js
html`
  <aiux-control-modeless-dialog
    open
    @AIUX_CONTROL_MODELESS_DIALOG#CLOSE=${e => {
      if (!confirm('Discard unsaved changes?')) e.preventDefault();
    }}
  >
    <div slot="body">Content</div>
  </aiux-control-modeless-dialog>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Reflects. Setting it opens/closes the panel (creates/destroys the teleport). | Whether the dialog is open. |
| `title` | `title` | `string` | `''` | Read on render as the fallback for the `heading` slot. | Fallback dialog title text. |
| `position` | `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' \| 'centered' \| 'unset'` | `'bottom-right'` | Read when computing initial position on open. | Which viewport corner (or centered/unset) the panel opens at. |
| `width` | `width` | `number` (px) | `380` | Read when computing initial position/size. | Initial panel width. |
| `height` | `height` | `number` (px) | `500` | Read when computing initial position/size. | Initial panel height. |
| `minWidth` | `minwidth` | `number` (px) | `200` | Read during resize clamping and the too-small-viewport check. | Minimum panel width. |
| `minHeight` | `minheight` | `number` (px) | `150` | Read during resize clamping and the too-small-viewport check. | Minimum panel height. |
| `offset` | `offset` | `[number, number]` | `[1, 1]` | Read when computing initial position. | `[x, y]` offset as a percentage of the viewport (`%vw`, `%vh`), not pixels. |
| `variant` | `variant` | `'default' \| 'primary' \| 'neutral'` | `'default'` | Read on render as a CSS class. | Visual variant. |
| `size` | `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Read on render as a CSS class. | Preset visual size (distinct from `width`/`height`, which set actual panel dimensions). |
| `enableDrag` | `enabledrag` | `boolean` | `false` | Read on every header pointer event. | Whether the header can be dragged to reposition the panel. |
| `enableResize` | `enableresize` | `boolean` | `false` | Read on every resize-handle pointer event; also gates whether resize handles render. | Whether the panel can be resized from its edges/corners. |
| `closeOnBackdrop` | `closeonbackdrop` | `boolean` | `false` | Read on document pointerdown while open. | Whether clicking outside the panel closes it. |
| `showMinimize` | `showminimize` | `boolean` | `false` | Read on render; gates the minimize button. | Shows a minimize button that collapses the body/footer. Minimizing while maximized automatically exits fullscreen first (the two states are mutually exclusive). |
| `showMaximize` | `showmaximize` | `boolean` | `false` | Read on render; gates the maximize button. | Shows a maximize/restore (fullscreen toggle) button. Maximizing while minimized automatically un-minimizes first, for the same reason. |
| `hideClose` | `hideclose` | `boolean` | `false` | Read on render; hides the close button when true. | Hides the built-in close button. |
| `enableFocus` | `enablefocus` | `boolean` | `true` | Read on open; when true, auto-focuses the first focusable slotted element. | Whether opening the dialog moves focus into it. |
| `appendToPayload` | (no explicit `attribute:` option; Lit default is the lowercased property name, not kebab-case) | JSON-serializable value, via a JSON attribute converter | `null` | Deep-cloned into every dispatched event's `detail.appendToPayload`. | Arbitrary caller data echoed back on every dialog event. |

None of this component's own properties declare `reflect: true` except `open`. Several boolean/kebab-style names above (`enableDrag`, `minWidth`, etc.) have no explicit `attribute:` option, so per Lit's default their HTML attribute is the property name lowercased as a single word (e.g. `enable-drag` is not valid; use `enabledrag`, or bind the property directly with `.enableDrag=` in a Lit template, which is the recommended pattern shown above).

Also inherits the base `AIUXElement` properties/lifecycle; it does not carry any of the shared form-field identity properties (`value`, `name`, `required`, `mandatory`, etc.) — those do not apply to this control.

### Events

All events are dispatched via the shared `ActionDispatchMixin.dispatchAction()` helper, which sets `bubbles: true, composed: true, cancelable: true` unconditionally — including `OPENED`/`CLOSED`/`MAXIMIZE`/`RESIZE_END`, even though calling `preventDefault()` on those has no effect on the component's own behavior (only `CLOSE` and `MINIMIZE`, dispatched through a separate cancelable-event helper, are actually checked for `defaultPrevented`).

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_MODELESS_DIALOG#OPENED` | `{open: true, appendToPayload}` | Bubbles, composed, cancelable (not actually checked) | The dialog finishes opening. | |
| `AIUX_CONTROL_MODELESS_DIALOG#CLOSED` | `{open: false, appendToPayload}` | Bubbles, composed, cancelable (not actually checked) | The dialog finishes closing, but only if it was actually open before (so `OPENED`/`CLOSED` stay a matched pair; not fired on initial mount). | |
| `AIUX_CONTROL_MODELESS_DIALOG#CLOSE` | `{appendToPayload}` | Bubbles, composed, cancelable | The close button is clicked, or Escape is pressed while focus is inside the dialog or its teleported content. | Calling `preventDefault()` blocks the close — the dialog stays open. |
| `AIUX_CONTROL_MODELESS_DIALOG#MINIMIZE` | `{appendToPayload}` | Bubbles, composed, cancelable | The minimize button is clicked (only rendered when `showMinimize` is true). | Calling `preventDefault()` blocks the minimize toggle. **Gotcha:** the button is a silent no-op — it does not even dispatch this event — while the dialog has been forced into fullscreen by a too-small viewport (see Lifecycle below). Don't rely on this event firing just because `showMinimize` is true. |
| `AIUX_CONTROL_MODELESS_DIALOG#MAXIMIZE` | `{fullscreen: boolean, appendToPayload}` | Bubbles, composed, cancelable (not actually checked) | The maximize/restore button is clicked (only rendered when `showMaximize` is true). | Always proceeds regardless of `preventDefault()`. Same viewport-forced-fullscreen no-op caveat as `MINIMIZE` applies here too. |
| `AIUX_CONTROL_MODELESS_DIALOG#RESIZE_END` | `{width, height, left, top, appendToPayload}` | Bubbles, composed, cancelable (not actually checked) | A resize drag ends (pointer up after resizing). | No continuous "resizing" event is dispatched — only the final result. |

Clicking outside via `closeOnBackdrop` calls `hide()` directly and does **not** go through the cancelable `CLOSE` event.

### Slots

| Slot | Description |
| --- | --- |
| `heading` | Header title content; falls back to the `title` property text if empty. |
| `actions` | Extra header controls, rendered before the minimize/maximize/close buttons. |
| `body` | Main dialog content. Hidden while minimized. |
| `footer` | Footer content; only rendered (and only reserves layout space) if footer content is actually present at open time. |

All slotted content is physically relocated into the teleport element while the dialog is open, and moved back onto the host when it closes.

### Methods

| Method | Description |
| --- | --- |
| `show()` | Opens the dialog (no-op if already open); sets `open = true`. |
| `hide()` | Closes the dialog (no-op if already closed); sets `open = false`. |
| `focus(options?)` | Moves focus to the first focusable element inside the teleported content, or the panel itself as a fallback. |

## Integration details

### Platform requirements

None beyond a browser supporting the Pointer Events API (used for drag and resize).

### SSR

Guarded with `isServer` (imported from `lit`): opening/closing logic (`_openDialog`/`_closeDialog`, which touch `document`/`window`/the teleport) is skipped entirely on the server, and the teleport-template sync in `updated()` only runs `if (this._teleport && this.open && !isServer)`. The host itself renders only slot passthroughs, so SSR output is safe by default.

### Lifecycle

`disconnectedCallback()` closes the dialog if still open (restoring slotted content and removing the teleport) so it never leaks a teleported DOM node. While open, a `window resize` listener keeps the panel clamped to the viewport and forces fullscreen if the viewport becomes smaller than `minWidth`/`minHeight`, reverting once the viewport grows back.

### Sizing and layout

The host itself is `display: none` when closed and `display: contents` when open — all visible dialog chrome lives in the teleported panel, not in the host's own shadow DOM. The panel uses `position: fixed` with an inline `z-index` from a module-level counter (`_zIndexCounter`, starting at 1000) that increments on drag start, resize start, or any interaction — bringing the interacted panel to the front of any other open instances. `createTeleport()`/`removeTeleport()` (from `@servicenow/aiux-components-core`) move the panel's rendered markup to escape the host's own Shadow DOM stacking-context clipping, which is the key difference from `aiux-control-modal` (which relies on the native `<dialog>` top-layer instead). Drag is clamped so the panel stays within the viewport; resize is clamped between `minWidth`/`minHeight` and the viewport bounds.

## Accessibility, localization, and customization

The teleported panel has `role="dialog"`, `aria-modal="false"` (it is explicitly non-blocking), and `aria-labelledby` pointing at the heading. Built-in aria-labels (close/minimize/maximize/restore button labels, and the default "Dialog" label) come through `@lit/localize`'s `msg()`, so they follow the host locale. The `title`/heading text and all slotted body/footer content are supplied by the host and are not translated by this control. Escape-to-close only fires when the dialog (or its teleported content) actually has focus, and is skippable by calling `preventDefault()` on the cancelable `CLOSE` event; there is no dedicated focus-trap controller (unlike `aiux-control-modal`) — instead, opening moves focus once to the first focusable slotted element (unless `enableFocus` is false), and the header action buttons are intentionally excluded from that auto-focus target. There are no documented CSS parts or custom properties for external theming; visual variants are controlled through the `variant` and `size` properties.
