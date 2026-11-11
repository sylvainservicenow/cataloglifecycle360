# Popover

> Source: `@servicenow/aiux-sn-popover@1.6.2` · `components/external/popover/docs/usage/aiux-sn-popover.md`

`<aiux-sn-popover>` wraps a trigger element and shows a floating panel next to
it. Clicking the trigger toggles the panel; the element manages `opened`
itself unless the host cancels its request events. It does nothing with the
panel content beyond showing it.

Built in: placement with flip and viewport clamping, repositioning on scroll
and resize, optional heading row with a close button, arrow, Escape and
outside-click dismissal, focus trapping (`dialog` mode), Tab dismissal and
arrow-key navigation (other modes), trigger ARIA (`aria-expanded`,
`aria-haspopup`, `aria-controls`), and nested popovers (Escape closes the
innermost first; clicks inside a child panel do not close the parent). Do not
build these yourself. `placement`, `heading`, `offset`, `arrow`, `bare`,
`noPadding`, and `disableScroll` can also be set by page admin configuration;
an admin value overrides the bound property.

## Import

```js
import '@servicenow/aiux-sn-popover';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-sn-popover';

@customElement('my-filter-button')
export class MyFilterButton extends AIUXElement {
  render() {
    return html`
      <aiux-sn-popover heading="Filters" placement="bottom-start">
        <button slot="trigger" class="aiux-btn aiux-btn-sm">Filters</button>
        <div slot="content" class="flex flex-col gap-2">
          <label><input type="checkbox" autofocus /> Active only</label>
          <label><input type="checkbox" /> Assigned to me</label>
        </div>
      </aiux-sn-popover>
    `;
  }
}
```

**What happens:** while open, the `slot="content"` nodes are moved into a
page-level panel (under `document.body` by default) and moved back on close.
CSS scoped to your component's shadow root does not reach them, and their
events do not bubble through your component, so bind handlers directly on the
content controls.

### Additional patterns

Controlled open state. Cancel both requests and set `opened` yourself:

```js
html`
  <aiux-sn-popover
    .opened=${this._open}
    @aiux-sn-popover:open-request=${e => {
      e.preventDefault();
      this._open = true;
    }}
    @aiux-sn-popover:close-request=${e => {
      e.preventDefault();
      if (e.detail.actionSource !== 'outside-click') this._open = false;
    }}
  >
    <button slot="trigger">Details</button>
    <div slot="content">…</div>
  </aiux-sn-popover>
`;
```

Panel sized to the trigger with arrow-key focus movement. The component only
moves focus; selection, `aria-selected`, and actions are yours to add:

```js
html`
  <aiux-sn-popover
    interaction-type="listbox"
    .constrain=${{minWidth: 'target', maxHeight: 300}}
    .configAria=${{panel: {role: 'listbox', 'aria-label': 'Sort by'}}}
    no-padding
  >
    <button slot="trigger">Sort</button>
    <div slot="content">
      <div role="option" tabindex="0">Newest</div>
      <div role="option" tabindex="0">Oldest</div>
    </div>
  </aiux-sn-popover>
`;
```

## API

### Properties and attributes

Panel appearance and positioning are read when the panel opens and again on
each reposition (scroll, resize, trigger resize); they do not re-render an
open panel otherwise.

| Property              | Attribute                | Type                  | Default    | Update behavior         | Description                                                                                                                                                                                |
| --------------------- | ------------------------ | --------------------- | ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `opened`              | `opened` (reflected)     | `boolean`             | `false`    | Updates immediately     | Shows or hides the panel. Setting it directly skips the request events; setting `false` still fires `closed`. Opening does nothing if there is no trigger element and no `positionTarget`. |
| `placement`           | `placement`              | `Placement`           | `'bottom'` | Next open or reposition | Side and alignment. `start`/`end` on `top`/`bottom` swap in RTL. Deprecated physical aliases (`bottom-left`, etc.) work and log a warning.                                                 |
| `flip`                | `flip`                   | `boolean`             | `true`     | Next open or reposition | Flips to the opposite side when the preferred side lacks room. Set `false` with a property binding.                                                                                        |
| `offset`              | `offset`                 | `number` (px)         | `8`        | Next open or reposition | Gap between trigger and panel.                                                                                                                                                             |
| `positionTarget`      | property only            | `HTMLElement \| null` | `null`     | Next open or reposition | Anchors the panel to this element instead of the trigger. Clicking the trigger still toggles.                                                                                              |
| `heading`             | `heading`                | `string`              | `''`       | Next open or reposition | Renders a header row with this text and a close button, and labels the panel.                                                                                                              |
| `arrow`               | `arrow`                  | `boolean`             | `false`    | Next open or reposition | Arrow on the panel edge pointing at the trigger. Not shown with `bare`.                                                                                                                    |
| `bare`                | `bare`                   | `boolean`             | `false`    | Next open or reposition | No border, shadow, background, rounded corners, or padding.                                                                                                                                |
| `noPadding`           | `no-padding`             | `boolean`             | `false`    | Next open or reposition | Removes the 1rem content padding; keeps border, shadow, and background.                                                                                                                    |
| `disableScroll`       | `disable-scroll`         | `boolean`             | `false`    | Next open or reposition | Content area clips instead of scrolling.                                                                                                                                                   |
| `constrain`           | property only            | `Constrain \| null`   | `null`     | Next open or reposition | Pixel size limits; `'target'` uses the trigger's width or height. Without max values, the panel is capped at the space available in the viewport.                                          |
| `configAria`          | property only            | `ConfigAria`          | `{}`       | Next open or reposition | Panel `role` (default `dialog`), `aria-label`, `aria-describedby`, and the close button's `aria-label`. `panel.role` is also written to the trigger's `aria-haspopup`.                     |
| `interactionType`     | `interaction-type`       | `InteractionType`     | `'dialog'` | Next open               | Focus and keyboard mode; see below.                                                                                                                                                        |
| `focusPanel`          | `focus-panel`            | `boolean`             | `false`    | Next open               | Moves focus into the panel on open in `none` and `combo` modes (`dialog` and `listbox` always do).                                                                                         |
| `closeOnEscape`       | `close-on-escape`        | `boolean`             | `true`     | Updates immediately     | Escape closes. Set `false` with a property binding.                                                                                                                                        |
| `closeOnOutsideClick` | `close-on-outside-click` | `boolean`             | `true`     | Updates immediately     | A `mousedown` outside the element and panel closes. Set `false` with a property binding.                                                                                                   |
| `container`           | property only            | `HTMLElement \| null` | `null`     | Next open               | Element the panel is appended to; must be connected. Defaults to page level.                                                                                                               |

`interactionType` values:

| Value     | Focus on open                                                                            | Tab                                        | Other keys                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `dialog`  | Trapped inside the panel; an `[autofocus]` element in the content receives initial focus | Cycles inside the panel                    | Escape closes                                                                                                                        |
| `listbox` | Panel                                                                                    | Tab or Shift+Tab closes                    | Escape closes; ArrowUp/ArrowDown (wrapping), Home, End move focus among options, menu items, buttons, links, and `tabindex` elements |
| `combo`   | Unchanged unless `focusPanel`                                                            | Closes only when focus is inside the panel | Escape closes                                                                                                                        |
| `none`    | Unchanged unless `focusPanel`                                                            | Closes                                     | Escape closes                                                                                                                        |

Closing by Escape, Tab, or the close button returns focus to the trigger (in
`dialog` mode, to the element focused before opening).

### Events

All event names are literal strings; they are not exported as constants.

| Event                           | `detail`                                         | Delivery                          | Fires when                                                                                                                                | Notes                                                                                                                         |
| ------------------------------- | ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `aiux-sn-popover:open-request`  | `null`                                           | Bubbles, composed, cancelable     | The user clicks the trigger while closed, or `show()` is called.                                                                          | Opens unless `preventDefault()` is called. Not fired when `opened` is set directly.                                           |
| `aiux-sn-popover:close-request` | `{actionSource: CloseActionSource \| undefined}` | Bubbles, composed, cancelable     | The user clicks the trigger while open, clicks outside, presses Escape or Tab (per mode), clicks the close button, or `hide()` is called. | Closes unless `preventDefault()` is called. `actionSource` is `undefined` for `hide()`.                                       |
| `aiux-sn-popover:opened`        | `{placement: string}`                            | Bubbles, composed, not cancelable | The panel has been positioned and shown.                                                                                                  | `placement` is the resolved value after flip, e.g. `'top-start'`. Not fired on reposition.                                    |
| `aiux-sn-popover:closed`        | `{actionSource: CloseActionSource \| undefined}` | Bubbles, composed, not cancelable | The panel has been removed.                                                                                                               | `actionSource` is `undefined` when `opened` was set to `false` directly or via `hide()`. Not fired if the panel never showed. |

### Slots

- `trigger`: the element that toggles the panel. The first assigned element
  receives the ARIA attributes and is the default anchor. Use a `<button>`;
  a non-interactive element without `role` or `tabindex` logs a console warning.
- `content`: panel content. Must be a direct child of the element with
  `slot="content"`; several are allowed. Nodes are moved into the panel on
  open, so content added while open appears on the next open.

### Methods

| Method   | Effect                                               |
| -------- | ---------------------------------------------------- |
| `show()` | Fires `open-request`; opens unless it is canceled.   |
| `hide()` | Fires `close-request`; closes unless it is canceled. |

### Data shapes

```ts
type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  // deprecated: bottom-left→bottom-end, bottom-right→bottom-start,
  // top-left→top-end, top-right→top-start, left-top→left-end,
  // left-bottom→left-start, right-top→right-end, right-bottom→right-start
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'left-top'
  | 'left-bottom'
  | 'right-top'
  | 'right-bottom';

type InteractionType = 'dialog' | 'none' | 'listbox' | 'combo';

type CloseActionSource =
  | 'outside-click'
  | 'trigger-click'
  | 'escape-press'
  | 'close-button'
  | 'tab-press';

interface Constrain {
  width?: number | 'target';
  minWidth?: number | 'target';
  maxWidth?: number | 'target';
  height?: number | 'target';
  minHeight?: number | 'target';
  maxHeight?: number | 'target';
}

interface ConfigAria {
  panel?: {
    'aria-label'?: string; // overrides the heading-based label and the "Popover" fallback
    'aria-describedby'?: string;
    role?: string;
  };
  closeButton?: {'aria-label'?: string}; // default "Close"
}
```

These types are not exported from the package entry.

## Integration details

### SSR

Only the trigger renders on the server. The panel opens in the browser; an
element that starts with `opened` opens after it upgrades.

### Lifecycle

Removing the element while open removes the panel and returns the content
nodes without firing `closed`; `opened` stays `true`.

### Sizing and layout

- The host is `display: inline-block` around the trigger.
- The panel is `position: fixed`, `z-index: 1010`, `width: max-content`, and
  kept inside the viewport. An ancestor of `container` with `transform`
  or `filter` changes what `fixed` is relative to.

## Accessibility, localization, and customization

- **Accessibility:** give the panel a name with `heading` or
  `configAria.panel['aria-label']`; otherwise it is announced as "Popover".
  `aria-modal="true"` is set only for `role="dialog"` in `dialog` mode. Set
  `configAria.panel.role` to match your content (for example `listbox` or
  `menu`) and give items matching roles.
- **Localization:** the "Close" and "Popover" fallbacks are localized.
  `heading` and `configAria` strings are the caller's to translate.
- **Customization:** no parts or CSS custom properties. The panel uses the
  DaisyUI theme (`base-100` background, `base-300` border); use `bare`,
  `noPadding`, and `constrain` for layout, and style your own content.
