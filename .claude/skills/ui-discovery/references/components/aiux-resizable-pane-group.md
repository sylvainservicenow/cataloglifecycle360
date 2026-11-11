# Resizable panes

> Source: `@servicenow/aiux-resizable-panes@1.3.2` · `components/external/resizable-panes/docs/usage/aiux-resizable-pane-group.md`

`<aiux-resizable-pane-group>` lays out two `<aiux-resizable-pane>` children
around one `<aiux-resizable-pane-handle>`. The host declares each pane's
baseline size and bounds; the group owns the live split and reports every
committed change through `aiux-resizable-pane-group:layout-changed`. No
property sets the current size or collapsed state, and there are no methods.
The group never persists sizes; to restore a saved split, pass it back as
`defaultSize`. The children must be exactly pane, handle, pane (see Slots).

Built in: pointer drag (grab the line or grip; `Escape` cancels), keyboard
resize on the separator, collapse/expand buttons for `collapsible` panes,
drag-to-collapse, focus handoff out of a collapsing pane, screen-reader
announcements, and re-layout when the container resizes. Do not build these
yourself.

## Import

```js
import '@servicenow/aiux-resizable-panes'; // registers all three elements
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-resizable-panes';

@customElement('my-split-view')
export class MySplitView extends AIUXElement {
  render() {
    return html`
      <div class="h-[600px]">
        <aiux-resizable-pane-group label="Workspace">
          <aiux-resizable-pane
            id="nav"
            label="Navigation"
            default-size="25%"
            min-size-px="200"
            max-size-pct="50"
            collapsible
          >
            <nav class="p-4">…</nav>
          </aiux-resizable-pane>
          <aiux-resizable-pane-handle
            id="nav-handle"
            label="Resize navigation"
          ></aiux-resizable-pane-handle>
          <aiux-resizable-pane id="main" label="Details" min-size-pct="30">
            <main class="p-4">…</main>
          </aiux-resizable-pane>
        </aiux-resizable-pane-group>
      </div>
    `;
  }
}
```

**What happens:** the second pane takes whatever the first pane and the
handle leave. A drag fires `layout-changed` once, on release; listening is
optional. The group fills its parent's height, so the parent needs a definite
height.

## API

### aiux-resizable-pane-group

#### Properties and attributes

| Property       | Attribute                 | Type          | Default        | Update behavior     | Description                                                                                                                                                                                                                  |
| -------------- | ------------------------- | ------------- | -------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation`  | `orientation` (reflected) | `Orientation` | `'horizontal'` | Updates immediately | `horizontal`: panes side by side. `vertical`: panes stacked. A change re-lays out along the new axis and fires `layout-changed` with `source: 'orientation'` when sizes change.                                              |
| `disabled`     | `disabled` (reflected)    | `boolean`     | `false`        | Updates immediately | Blocks drag, keyboard resize, and collapse buttons (shown disabled), removes the separator from the tab order, and cancels an active drag. Sizes are kept, and pane property changes and container resizes still re-lay out. |
| `keyboardStep` | `keyboard-step`           | `number`      | `5`            | Updates immediately | Percentage of the group's axis that one arrow press moves the separator. Valid range `> 0` to `100`; an invalid value keeps the last valid one.                                                                              |
| `label`        | `label`                   | `string`      | `''`           | Updates immediately | Non-empty: the group is exposed as `role="group"` with this name.                                                                                                                                                            |

#### Events

| Event                                      | `detail`                   | Delivery                          | Fires when                                                                                                                                                                                                                                      | Notes                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-resizable-pane-group:layout-changed` | `LayoutChangedEventDetail` | Bubbles, composed, not cancelable | An applied layout changes a pane's pixel size or collapsed flag. Drag: once, on release. Keyboard, collapse button, container resize: immediately. Pane property, `orientation`, and child changes: once for all changes made in the same turn. | The only event for resize, collapse, and expand. Not fired for the first layout at mount; if the group has no size at mount (e.g. hidden), its first measured layout fires it with `source: 'property'`. Not fired during a drag, for a drag cancelled with `Escape`, disablement, or a pointer interruption, or in the fallback. `sizes` are the applied, clamped values. |

#### Slots

- Default: exactly `aiux-resizable-pane`, `aiux-resizable-pane-handle`,
  `aiux-resizable-pane` as direct children, in that order, each with an `id`
  unique among them (use document-unique ids; `PaneSize.id` reports them).
  Whitespace and comments are ignored.
- A single `aiux-resizable-pane` child with an `id` is also valid: it renders
  alone, with no handle and no events.
- Anything else (another element, wrong order, a missing handle, a missing or
  duplicate `id`) switches the group to a fallback: children render in normal
  block flow, the separator is inert, no events fire, and an error is logged
  under `aiux-resizable-pane-group`. Fixing the children restores managed
  layout.
- `aiux-resizable-pane` and `aiux-resizable-pane-handle` do nothing outside a
  group. To split further, place another group inside a pane; each group is
  independent.

#### Methods

None.

### aiux-resizable-pane

A pane property change re-derives the split from `defaultSize`, discarding
the user's resized position; a collapsed pane stays collapsed.

#### Properties and attributes

| Property         | Attribute         | Type             | Default               | Update behavior | Description                                                                                                                                                                                                                                                                           |
| ---------------- | ----------------- | ---------------- | --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultSize`    | `default-size`    | `PaneSizeValue`  | none                  | Re-lays out     | Baseline size at mount, on any pane property change, and when expanding a pane that has no remembered size. The first pane's value wins; the second pane's is used only when the first has none; with neither, panes split evenly. Also paints the first frame and the server render. |
| `minSizePct`     | `min-size-pct`    | `PanePctValue`   | none                  | Re-lays out     | Minimum as a percentage of the group's axis. Combined with `minSizePx`: the larger wins.                                                                                                                                                                                              |
| `minSizePx`      | `min-size-px`     | `PanePxValue`    | none                  | Re-lays out     | Minimum in pixels.                                                                                                                                                                                                                                                                    |
| `maxSizePct`     | `max-size-pct`    | `PanePctValue`   | none                  | Re-lays out     | Maximum as a percentage of the group's axis. Combined with `maxSizePx`: the smaller wins.                                                                                                                                                                                             |
| `maxSizePx`      | `max-size-px`     | `PanePxValue`    | none                  | Re-lays out     | Maximum in pixels.                                                                                                                                                                                                                                                                    |
| `collapsible`    | `collapsible`     | `boolean`        | `false`               | Re-lays out     | Allows collapsing and renders this pane's collapse/expand button on the handle.                                                                                                                                                                                                       |
| `collapsedSize`  | `collapsed-size`  | `PaneSizeValue`  | `0`                   | Re-lays out     | Size while collapsed; not limited by the min/max bounds. A non-zero value leaves a visible empty strip; content is hidden either way.                                                                                                                                                 |
| `resizeBehavior` | `resize-behavior` | `ResizeBehavior` | `'preserve-relative'` | Re-lays out     | When the group's size along its axis changes: `preserve-relative` keeps the ratio between panes; `preserve-pixel` keeps this pane's pixel size and the other pane absorbs the change. Both `preserve-pixel`: both scale proportionally.                                               |
| `label`          | `label`           | `string`         | `''`                  | Re-lays out     | Non-empty: the content is exposed as `role="region"` with this name. Also names the built-in buttons ("Collapse {label}", "Expand {label}") and announcements.                                                                                                                        |

No attribute is reflected. From markup, `default-size` and `collapsed-size`
need a unit (`"300px"`, `"25%"`); a unitless string such as `"300"` is
ignored. The bound attributes accept a bare number (`min-size-px="200"`).
Other CSS units (`rem`, `vh`, …) are ignored everywhere.

#### Events

None.

#### Slots

- Default: the pane's content.

#### Methods

None.

### aiux-resizable-pane-handle

#### Properties and attributes

| Property | Attribute | Type     | Default | Update behavior     | Description                                                              |
| -------- | --------- | -------- | ------- | ------------------- | ------------------------------------------------------------------------ |
| `label`  | `label`   | `string` | `''`    | Updates immediately | Accessible name of the separator. Empty uses a localized "Resize panes". |

#### Events

None.

#### Slots

None.

#### Methods

None.

### Data shapes

```ts
type Orientation = 'horizontal' | 'vertical';

type PaneSizeValue = number | string; // number = px; or '240px' / '25%'
type PanePctValue = number | string; // 0–100, or '20%'
type PanePxValue = number | string; // px, or '240px'
type ResizeBehavior = 'preserve-relative' | 'preserve-pixel';

interface LayoutChangedEventDetail {
  sizes: PaneSize[]; // both panes, in DOM order
  source: ResizablePaneGroupEventSource;
}

interface PaneSize {
  id: string; // the pane's id
  percent: number; // share of the whole group axis, separator included, so the two do not sum to exactly 100
  pixels: number; // applied size
  collapsed: boolean; // false for a pane dragged to 0 px without collapsing
}

type ResizablePaneGroupEventSource =
  | 'pointer' // drag release
  | 'keyboard' // arrows, Home, End, Enter on the separator
  | 'collapse-control' // built-in collapse/expand button
  | 'property' // a pane property change, or a container resize
  | 'orientation'
  | 'composition'; // children added, removed, or reordered
```

The package's only export is the group element class `ResizablePaneGroup`
(named and default).

## Integration details

### SSR

The server renders both panes at their declared `defaultSize` (or an even
split) and a non-interactive separator. Min/max bounds are applied once the
browser measures, so a declared size outside them moves on hydration.
Measurement, drag, keyboard, and collapse start in the browser.

### Lifecycle

- Collapse state and each pane's last expanded size live in the group; they
  last as long as the group element does.
- Expanding restores the pane's last expanded size, then its `defaultSize`,
  then half the space.
- After the group is removed and re-inserted, the separator stays
  non-interactive and container resizes no longer re-lay out until a pane
  property, `orientation`, or child change triggers a new layout.

### Sizing and layout

- The group is `display: block` with `block-size: 100%`; give its parent a
  definite height (always for `vertical`). While the group's axis measures 0
  (hidden or not laid out), panes keep their declared sizes.
- `%` values resolve against the group's whole axis; the handle's thickness
  (default 2px) comes out of the panes. When the combined minimums exceed the
  space, both panes shrink below them proportionally; when the combined
  maximums fall short of it, both grow past them proportionally. A minimum
  larger than its maximum wins.
- Each pane clips to its size; its `content` part scrolls (`overflow: auto`)
  and becomes a tab stop only while its content overflows.
- The drag target extends beyond the visible line, wider on coarse pointers,
  without taking layout space. The grip and buttons stay
  within the viewport when the panes are taller than the page.

## Accessibility, localization, and customization

- **Accessibility:** set `label` on each pane (it names the collapse/expand
  buttons) and on the handle. The separator is a focusable `role="separator"`
  whose value is the first pane's percentage and whose range is the first
  pane's reachable range. Keys on the focused separator: `ArrowLeft`/
  `ArrowRight` (horizontal) or `ArrowUp`/`ArrowDown` (vertical) move it one
  `keyboardStep` in that physical direction (also in RTL); `Home`/`End` move
  the first pane to its minimum/maximum; `Enter` toggles the first pane if
  collapsible, else the second. Dragging a collapsible pane past its
  minimum collapses it; dragging back past it expands it; keyboard
  resizing never collapses. A drag snaps to 50/50 near the midpoint. Only one pane
  can be collapsed at a time. Collapse buttons appear on handle hover, during
  a drag, on keyboard focus, and always on touch devices; while one pane is
  collapsed or at 0 px, only its expand button shows. Hidden pane content is
  `inert`; focus inside it moves to the separator (after a button or `Enter`
  collapse, on to the pane's expand button). While focus is inside the group,
  button and `Enter` collapse/expand (with the new percentage) and
  orientation changes are announced.
- **Localization:** the fallback separator name, button names, and
  announcements are localized; percentages use the locale's format. Translate
  your own `label` values.
- **Customization:** CSS parts: group `frame`, `layout`; pane `content`
  (restyle overflow and padding here); handle `separator`, `grip`,
  `collapse-control`. Set the separator thickness on the handle element
  (`aiux-resizable-pane-handle { inline-size: 4px }`, or `block-size` when
  vertical); the group measures it. Colors use `--color-border-default` and
  `--color-border-subtle` when defined, else mixes of `--color-base-content`
  and `--color-base-100`; the focus ring uses `--color-primary`.
