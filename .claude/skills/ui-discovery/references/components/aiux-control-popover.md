# AIUXControlPopover

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-popover.md`

An anchored popover built on the native HTML Popover API (`popover="auto"`) combined with Floating UI for positioning. A slotted `trigger` element toggles it; content automatically flips and shifts to stay within the viewport and repositions live as the anchor scrolls, resizes, or the window changes. This is a non-form-field utility control — it does not extend the form-field control stack and has no `value`/`name`/`required` properties.

**Open/close ownership.** The component has no reactive `open`/`isOpen` property — the native `.popover` element's own Popover-API state (`:popover-open`) is the single source of truth, and Lit's `render()` does not re-run when it toggles. If the host needs to know whether the popover is open (to style the trigger, gate other UI, etc.), it must listen for `AIUX_CONTROL_POPOVER#OPEN`/`#CLOSE` (or check `:popover-open` itself) rather than tracking its own boolean, because nothing here will invalidate a host property for it. The `popoverEl` reference itself is only resolved after the component's first update, so calling `showPopover()`, `hidePopover()`, or `togglePopover()` on the element before `firstUpdated()` has run (e.g. immediately after constructing/appending it in the same tick) silently no-ops.

Built in: trigger-click toggling, native top-layer stacking (no manual z-index or teleport needed), Floating UI-driven placement with viewport collision handling (`flip`/`shift`), an optional arrow/tail element, focus management on open/close (including auto-dismiss when focus moves outside the popover), and native light-dismiss behavior from the Popover API. Do not reimplement popover positioning or focus-out dismissal yourself.

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

class MyPopoverHost extends AIUXElement {
  render() {
    return html`
      <aiux-control-popover placement="bottom" tail>
        <button slot="trigger">Open</button>
        <p>Content here</p>
      </aiux-control-popover>
    `;
  }
}
```

**What happens:** clicking the slotted `trigger` element calls the internal popover's native `togglePopover()`. The component reads `trigger`'s assigned elements on `slotchange` and wires the click listener and `aria-expanded`/`aria-haspopup` only onto the *first* assigned element — if more than one element is placed in the `trigger` slot, the rest are inert for toggling purposes. On open, `AIUX_CONTROL_POPOVER#BEFORE_TOGGLE` (with `willOpen: true`) fires first and is what actually sets up Floating UI positioning (not `OPEN`), then `AIUX_CONTROL_POPOVER#OPEN` fires once the native popover finishes opening; Floating UI positions the popover relative to the trigger (flipping/shifting to stay in the viewport), and one animation frame later focus moves to the first focusable element inside it (or the popover itself if none is focusable). Clicking outside, pressing Escape, or calling `hidePopover()` closes it, firing `BEFORE_TOGGLE` (`willOpen: false`) then `AIUX_CONTROL_POPOVER#CLOSE`, tears down the Floating UI `autoUpdate` loop, and returns focus to the trigger — unless the close was itself triggered by focus moving outside the popover, in which case the already-focused element keeps focus instead of being yanked back.

### Additional patterns

Anchoring to an element other than the slotted trigger (e.g. a different reference point in a more complex layout):

```js
html`
  <aiux-control-popover .anchor=${this.anchorElement} placement="right-start">
    <button slot="trigger">Open</button>
    <div>Content</div>
  </aiux-control-popover>
`;
```

Sizing the popover content area with the preset `size` property instead of custom CSS:

```js
html`<aiux-control-popover size="lg" placement="top">
  <button slot="trigger">Open</button>
  <div>Larger content area</div>
</aiux-control-popover>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `placement` | `placement` | Floating UI `Placement` (e.g. `'top'`, `'bottom'`, `'left'`, `'right'`, plus `-start`/`-end` variants) | `'bottom'` | Reflects. Read when positioning is set up on open; the rendered position may differ from the requested one after `flip`/`shift` resolve viewport collisions. | Requested placement of the popover relative to its anchor. |
| `tail` | `tail` | `boolean` | `false` | Read when positioning is set up on open; gates whether an arrow element is rendered and tracked. | Renders an arrow/tail pointing at the anchor. |
| `ariaLabel` | `aria-label` | `string` | `''` | Read on render. | Accessible label for the popover's content container. |
| `anchor` | — (`attribute: false`, property only) | `HTMLElement \| undefined` | `undefined` | Read when positioning is set up on open; takes precedence over the slotted trigger element as the position reference. | Explicit reference element to position against, when it differs from the trigger. |
| `size` | `size` | `'auto' \| 'sm' \| 'md' \| 'lg'` | `'auto'` | Reflects. Read on render as a CSS class on the content container. | Preset content-area size. |

Also inherits the base `AIUXElement` properties/lifecycle; it does not carry any of the shared form-field identity properties (`value`, `name`, `required`, `mandatory`, etc.) — those do not apply to this control.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_POPOVER#BEFORE_TOGGLE` | `{id: string, willOpen: boolean, placement: string}` | Bubbles, composed; not cancelable | The native popover element's `beforetoggle` fires, which happens whenever `showPopover()`/`hidePopover()`/`togglePopover()` is invoked — by the trigger click handler, a host call to one of this element's own public methods, outside click/Escape light-dismiss, or focus-out auto-dismiss. | `id` is the host element's own `id` attribute (empty string if unset). When `willOpen` is `true` this is also the moment Floating UI positioning is (re)initialized for this open cycle — `placement` reflects the *requested* placement, not yet the resolved one. |
| `AIUX_CONTROL_POPOVER#OPEN` | `{id: string, placement: string}` | Bubbles, composed; not cancelable | The native popover finishes opening (`toggle` with `newState === 'open'`). | Fires after positioning has already been set up and after focus-out tracking is armed; the focus move into the popover's first focusable element happens one `requestAnimationFrame` after this fires, not synchronously with it. |
| `AIUX_CONTROL_POPOVER#CLOSE` | `{id: string, placement: string}` | Bubbles, composed; not cancelable | The native popover finishes closing (`toggle` with `newState === 'closed'`), which happens on: an outside click, Escape, a host call to `hidePopover()`/`togglePopover()`, or the focus-out auto-dismiss path (focus leaving the popover and its assigned content entirely). | Does **not** fire if the host instead removes the `<aiux-control-popover>` element from the DOM (or its ancestor) while it is open — the native `toggle` event has no chance to fire on removal, so Floating UI's `autoUpdate` and focus-out listeners are torn down via `disconnectedCallback` but no `CLOSE` event is dispatched. Don't rely solely on `CLOSE` to reset open-related host state if the component can be unmounted while open. |

### Slots

| Slot | Description |
| --- | --- |
| `trigger` | The element that toggles the popover on click. Its `aria-expanded`/`aria-haspopup` attributes are managed automatically. |
| *(default, unnamed)* | The popover's content. |

### Methods

| Method | Description |
| --- | --- |
| `showPopover()` | Opens the popover via the native element's `showPopover()`. |
| `hidePopover()` | Closes the popover via the native element's `hidePopover()`. |
| `togglePopover(force?)` | Toggles open/closed state; `force` (optional boolean) forces a specific state, matching the native API. Returns whether the popover ended up open. |
| `focus(options?)` | Focuses the first focusable element inside the popover if open, otherwise focuses the trigger element. |

## Integration details

### Platform requirements

Requires a browser with the native HTML Popover API (`popover` attribute / `showPopover`/`hidePopover`/`togglePopover`). Positioning is computed with `@floating-ui/dom` (`offset(10)`, `flip()`, `shift({padding: 8})`, and `arrow()` when `tail` is set), with `position: fixed` strategy and live `autoUpdate()` tracking ancestor scroll, ancestor resize, element resize, and animation-frame changes.

### SSR

No `isServer` guard is present in this component. `connectedCallback()`/`firstUpdated()` query `this.renderRoot` and attach listeners unconditionally; positioning and native popover calls only run in response to user interaction (trigger click) rather than at connect time, so there is no direct `window`/`document` access during initial render, but this has not been explicitly hardened with an `isServer` check.

### Lifecycle

Listener setup happens in `firstUpdated()`; because the component can be relocated by an external teleport (disconnect/reconnect), `connectedCallback()` re-attaches listeners on any reconnect after the first update. `disconnectedCallback()` tears down positioning (`autoUpdate` cleanup), focus tracking, and toggle listeners.

### Sizing and layout

The popover is promoted to the browser's top-layer automatically by the native Popover API (`popover="auto"`) — no manual z-index or teleport/portal is needed, unlike `aiux-control-modeless-dialog`. The resolved placement (after `flip`/`shift`) is written to a `data-placement` attribute for CSS hooks. The content area's size is controlled by the `size` property's CSS class (`popover-auto`/`popover-sm`/`popover-md`/`popover-lg`).

## Accessibility, localization, and customization

The popover container has `role="dialog"` and an `aria-label` from the `ariaLabel` property (empty by default — hosts should set it for a non-visually-labeled trigger). The trigger element automatically receives `aria-haspopup="dialog"` and a live-updated `aria-expanded`. Escape-to-close and outside-click light-dismiss are provided by the native Popover API itself, not custom code. Focus moves into the popover's first focusable element on open and returns to the trigger on close (unless dismissed by focus moving outside, in which case the focused element's own destination is respected); focus-out tracking auto-dismisses the popover if focus leaves it and its assigned content entirely, with a carve-out so an element being removed from the DOM (rather than an intentional blur) doesn't falsely trigger a dismiss. There are no host-supplied strings for this control to localize — all popover content and the `ariaLabel` text are supplied by the host. There are no documented CSS parts or custom properties for external theming; visual variants are controlled through the `size`/`tail`/`placement` properties.
