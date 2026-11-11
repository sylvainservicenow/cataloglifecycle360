# 360 degree visualization

> Source: `@servicenow/aiux-360-degree-visualization@1.4.2` · `components/external/360-degree-visualization/docs/usage/aiux-360-degree-visualization.md`

`<aiux-360-degree-visualization>` draws `entity` at the hub and one wedge per
item in `relations`, each holding that relation's nodes as pills. It is
presentational: it never loads data, never navigates, and does not keep the
selection. The host sets `selectedNodeId` from the `selection-change` event.
Node, "View all", and hub clicks only fire events; the host decides what they
do.

Built in: per-sector carousel paging over the supplied nodes, "View all (N)"
per non-empty sector (N counts the supplied nodes, not badges or a server-side
total; the component never loads more), "No relationships" for empty sectors,
text truncation with hover titles, selected-sector highlight, keyboard
operation, screen-reader announcements, and RTL mirroring.

## Import

```js
import '@servicenow/aiux-360-degree-visualization';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-360-degree-visualization';

@customElement('my-server-relations')
export class MyServerRelations extends AIUXElement {
  @state() private _selectedId: string | null = null;

  private _entity = {
    title: 'Server-01',
    overline: 'SRV001',
    subtitle: 'Production'
  };

  private _relations = [
    {
      name: 'Runs',
      nodes: [
        {id: 'app-a', label: 'App A', count: 3},
        {id: 'app-b', label: 'App B'}
      ]
    },
    {name: 'Depends on', nodes: [{id: 'db-1', label: 'Database', count: 0}]},
    {name: 'Used by', nodes: []}
  ];

  render() {
    return html`
      <aiux-360-degree-visualization
        .entity=${this._entity}
        .relations=${this._relations}
        .selectedNodeId=${this._selectedId}
        @aiux-360-degree-visualization:selection-change=${(e: CustomEvent) =>
          (this._selectedId = e.detail.selectedNodeId)}
      ></aiux-360-degree-visualization>
    `;
  }
}
```

**What happens:** clicking a pill fires `node-click`, then `selection-change`
with the toggled id (clicking the selected pill yields `null`). The pill and
its sector show as selected only after the host sets `selectedNodeId`.

## API

### Properties and attributes

| Property         | Attribute          | Type             | Default       | Update behavior         | Description                                                                                                                                                                                                                                   |
| ---------------- | ------------------ | ---------------- | ------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`         | property only      | `EntityInfo`     | `{title: ''}` | On new object reference | Hub content.                                                                                                                                                                                                                                  |
| `relations`      | property only      | `Relation[]`     | `[]`          | On new array reference  | One sector per item, in order clockwise from 12 o'clock. Assigning a new array resets every carousel to page 1, so keep the same array when the data has not changed. In-place mutations do not trigger an update. `[]` renders only the hub. |
| `selectedNodeId` | `selected-node-id` | `string \| null` | `null`        | Updates immediately     | Highlights every pill with this `id`, across all relations, and their sectors. Controlled by the host.                                                                                                                                        |
| `size`           | `size`             | `number` (px)    | unset         | Updates immediately     | Fixed width (the graph is square). Applied in the browser, not in server-rendered markup. Unset, `0`, or negative: fills the container up to 800px.                                                                                           |

### Events

Use the literal event names; they are not exported as constants.

| Event                                             | `detail`                 | Delivery                          | Fires when                                       | Notes                                                                                                     |
| ------------------------------------------------- | ------------------------ | --------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `aiux-360-degree-visualization:node-click`        | `NodeClickDetail`        | Bubbles, composed, not cancelable | A pill is clicked or activated with Enter/Space. | Fires before `selection-change`.                                                                          |
| `aiux-360-degree-visualization:selection-change`  | `SelectionChangeDetail`  | Bubbles, composed, not cancelable | Right after every `node-click`.                  | `selectedNodeId` is the clicked id, or `null` when it was already selected. Set `selectedNodeId` from it. |
| `aiux-360-degree-visualization:view-all`          | `ViewAllDetail`          | Bubbles, composed, not cancelable | "View all (N)" is clicked or activated.          | Not rendered for sectors with no nodes.                                                                   |
| `aiux-360-degree-visualization:carousel-navigate` | `CarouselNavigateDetail` | Bubbles, composed, not cancelable | A sector's previous/next arrow changes its page. | Informational; paging is internal.                                                                        |
| `aiux-360-degree-visualization:center-node-click` | `CenterNodeClickDetail`  | Bubbles, composed, not cancelable | The hub title is clicked or activated.           | Only when `entity.enableNavigation` is `true`; the title then renders as a link.                          |

### Slots

None.

### Methods

None.

### Data shapes

```ts
interface EntityInfo {
  title: string; // long text is truncated; full text on hover
  overline?: string; // above the title
  subtitle?: string; // below the title
  caption?: string; // bottom line
  enableNavigation?: boolean; // title becomes a link that fires center-node-click
  meta?: Record<string, unknown>; // passed through untouched in event details
}

interface Relation {
  name: string; // sector label, truncated to the wedge width
  nodes: RelationNode[];
  color?: string; // CSS color for the wedge fill; hover/selected fill still overrides it
}

interface RelationNode {
  id: string; // matched against selectedNodeId across all relations; keep ids
  // unique if each pill should be selectable on its own (e.g. qualify a record
  // that appears in several relations, and keep the record identity in meta)
  label: string; // pill width is capped; longer labels are ellipsized
  count?: number; // badge before the label; 0 renders "0"; omit to hide it.
  // Display only: not a paging or server-side total
  meta?: Record<string, unknown>; // passed through untouched in event details
}

interface NodeClickDetail {
  node: RelationNode; // the same object you passed in
  sectorIndex: number;
}

interface SelectionChangeDetail {
  selectedNodeId: string | null;
  previousNodeId: string | null; // the selectedNodeId at click time
}

interface ViewAllDetail {
  relation: Relation;
  sectorIndex: number;
}

interface CarouselNavigateDetail {
  sectorIndex: number;
  direction: 'next' | 'prev';
  page: number; // 0-based
}

interface CenterNodeClickDetail {
  entity: EntityInfo;
}
```

These shapes are not exported as types.

## Integration details

### SSR

Renders on the server.

### Lifecycle

Direction (LTR/RTL) is read once from the element's computed `direction`
after first render; later changes are not detected.

### Sizing and layout

- `display: block`, centered with `margin: 0 auto`. Width is `100%` capped at
  800px, or `size` px once applied in the browser; height equals width.
- Pills per carousel page are set automatically; more relations mean fewer
  pills per page.

## Accessibility, localization, and customization

- **Accessibility:** the graph is labelled; pills, "View all", arrows, and the
  hub link are focusable buttons operated with Enter or Space. Pills expose
  `aria-pressed`. Page changes ("Page 1 of 3") and selection changes are
  announced through a polite live region.
- **Localization:** "View all", "No relationships", arrow labels,
  announcements, and the graph label are localized. `entity`, relation names,
  and node labels are shown as given; translate them.
- **Customization:** colors come from platform `--now-color--*` theme tokens,
  with `--color-*` used only when those are not defined, so changing a
  `--color-*` token has no effect under a platform theme. `Relation.color` sets
  a wedge's fill. Fonts, sizes, and geometry are fixed.
