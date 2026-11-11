# Node map

> Source: `@servicenow/aiux-components-coe-node-map@8.0.2` · `components/external/node-map/docs/usage/aiux-node-map.md`

`<aiux-node-map>` draws `nodes` and `edges` on a Cytoscape canvas, lays them
out, and reports user interaction through events. It never changes your data:
context-menu actions, clicks, and drags are only reported; add, remove, or
update nodes by assigning new `nodes` / `edges` arrays.

Built in: seven layouts with animated first reveal and re-fit, drag, pan,
Ctrl+wheel / pinch zoom, click and Tab selection, hover highlight of connected
edges, status indicators, node and edge popovers, node tooltips, a per-node
actions menu (chevron), keyboard pan/zoom, touch support, and an optional
dot-grid background. Search, zoom toolbar, and minimap are companion elements
placed in the map's slots. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-coe-node-map';
// Helpers, if needed:
import {extensions} from '@servicenow/aiux-components-coe-node-map';
```

Importing the package registers every tag in this document.

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {extensions} from '@servicenow/aiux-components-coe-node-map';

const ACTIONS = [
  {
    id: 'remove',
    icon: 'circle-close-outline',
    label: 'Remove',
    action: 'remove',
    status: 'error'
  }
];

@customElement('my-service-map')
export class MyServiceMap extends AIUXElement {
  @state() private _nodes = [
    {id: 'lb', label: 'Load balancer', icon: 'cloud'},
    {
      id: 'app',
      label: 'App server',
      icon: 'database',
      status: 'warning',
      indicators: [{icon: 'warning'}]
    },
    {id: 'db', label: 'Primary DB', sublabel: 'PostgreSQL', icon: 'database'}
  ];
  @state() private _edges = [
    {id: 'e1', source: 'lb', target: 'app', label: 'HTTPS'},
    {
      id: 'e2',
      source: 'app',
      target: 'db',
      status: 'error',
      lineStyle: 'dotted'
    }
  ];

  private _onAction(
    e: CustomEvent<{item: {action: string}; elementId: string}>
  ) {
    const {item, elementId} = e.detail;
    if (item.action === 'remove') {
      // Assign new arrays; mutating in place does not update the map.
      this._nodes = this._nodes.filter(n => n.id !== elementId);
      this._edges = this._edges.filter(
        ed => ed.source !== elementId && ed.target !== elementId
      );
    }
  }

  render() {
    return html`
      <aiux-node-map
        .nodes=${this._nodes}
        .edges=${this._edges}
        layout="horizontal"
        height="600px"
        .nodeActionItems=${ACTIONS}
        @aiux-node-map:context-action=${this._onAction}
      >
        <div slot="top-start">${extensions.search()}</div>
        <div slot="top-end">${extensions.toolbar()}</div>
        <div slot="bottom-end">${extensions.minimap()}</div>
      </aiux-node-map>
    `;
  }
}
```

**What happens:** adding or removing a node or edge id, or changing a node's
size (`nodeWidth`/`nodeHeight`, `componentSize`, `component`, or a renderer's
returned size), re-runs the layout over all nodes and animates a re-fit,
resetting the user's pan and zoom. Status, label, and color changes on existing
ids update in place with no relayout.

### Additional patterns

Card nodes rendered as DOM elements (all nodes, or per node with `component`):

```js
html`
  <aiux-node-map
    node-component-tag="aiux-node-map-card"
    layout="vertical"
    .nodes=${[
      {
        id: 'ai',
        label: 'AI Cluster',
        icon: 'bot-ai-sparkle',
        component: 'aiux-node-map-card-header',
        componentSize: {width: 490, height: 130}
      },
      {
        id: 'req',
        label: 'Generate Request',
        sublabel: 'Agentic workflow',
        icon: 'database',
        componentSize: {width: 490, height: 130}
      }
    ]}
    .edges=${[{id: 'e1', source: 'ai', target: 'req'}]}
  ></aiux-node-map>
`;
```

Click-triggered node and edge popovers with your own content (edge popovers
open only from an edge's `iconIndicator` badge):

```js
html`
  <aiux-node-map
    popover-trigger="click"
    .renderPopoverContent=${node =>
      html` <div class="flex flex-col gap-1">
        <span class="font-semibold">${node.label}</span>
        <span class="text-sm">Owner: ${node.owner}</span>
      </div>`}
    .renderEdgePopoverContent=${edge => html`<span>${edge.label}: ${edge.status}</span>`}
    .nodes=${nodes}
    .edges=${[{id: 'e1', source: 'a', target: 'b', label: 'Sync', status: 'error', iconIndicator: 'error'}]}
  ></aiux-node-map>
`;
```

Custom canvas renderer (one instance renders every node that uses it):

```ts
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';

@customElement('my-ring-node')
export class MyRingNode extends AIUXElement {
  @property({attribute: false}) node: Record<string, unknown> = {id: ''};
  @property() accentColor = '#4b5563';
  @property({attribute: false}) renderContext: unknown = null;

  renderNode() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="${this.accentColor}" stroke-width="8"/></svg>`;
    return {
      backgroundImage: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      backgroundPositionX: '50%',
      backgroundPositionY: '50%',
      backgroundWidth: '80%',
      backgroundHeight: '80%',
      shape: 'ellipse'
    };
  }
}

// In the page (the module above must already be imported):
html`<aiux-node-map
  node-renderer-tag="my-ring-node"
  .nodes=${nodes}
  .edges=${edges}
></aiux-node-map>`;
```

## API

### aiux-node-map

#### Properties and attributes

Set arrays, objects, and functions with property bindings. Booleans that
default to `true` can only be turned off with a property binding.

| Property                   | Attribute                    | Type                                         | Default   | Update behavior                                                                                 | Description                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ---------------------------- | -------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`                    | `nodes`                      | `NodeData[]`                                 | `[]`      | On new array                                                                                    | Nodes. Duplicate ids: first kept. See "What happens" for relayout rules.                                                                                                                                                                                                                                                                                                          |
| `edges`                    | `edges`                      | `EdgeData[]`                                 | `[]`      | On new array                                                                                    | Edges. Duplicate ids: first kept. Edges whose `source` or `target` is not a node id are dropped (console warning only).                                                                                                                                                                                                                                                           |
| `layout`                   | `layout`                     | `LayoutType`                                 | `'cose'`  | Re-runs layout, animated                                                                        | `cose` (force-directed), `grid`, `circle`, `concentric`, `breadthfirst`, `vertical` (top-down tree), `horizontal` (left-right tree).                                                                                                                                                                                                                                              |
| `edgeType`                 | `edge-type`                  | `'straight' \| 'joints' \| 'curved' \| null` | `null`    | Updates immediately                                                                             | Edge routing. `null`: `joints` (right-angle) for `vertical`/`horizontal`, `straight` otherwise. `curved` fans out sibling edges.                                                                                                                                                                                                                                                  |
| `width`                    | `width`                      | `string` (CSS length)                        | `'100%'`  | Updates immediately                                                                             | Map width. Resizing does not re-fit; call `fit()`.                                                                                                                                                                                                                                                                                                                                |
| `height`                   | `height`                     | `string` (CSS length)                        | `'85vh'`  | Updates immediately                                                                             | Map height.                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultIcon`              | `defaulticon`                | `string`                                     | `''`      | Next `nodes`/`edges`/`layout` change                                                            | Icon (same formats as `NodeData.icon`) for nodes without `icon`.                                                                                                                                                                                                                                                                                                                  |
| `popoverTrigger`           | `popover-trigger` (reflects) | `'hover' \| 'click' \| 'none'`               | `'hover'` | Updates immediately                                                                             | Shared by node and edge popovers. `hover`: opens on hover or Tab focus, closes ~150 ms after the pointer leaves the node (or edge badge) and popover. `click`: opens on click/Enter, closes on second click, canvas click, or Escape. In both modes clicking the open node or badge closes it. `none`: no popovers. On touch (coarse-pointer) devices `hover` behaves as `click`. |
| `renderPopoverContent`     | property only                | `(node: NodeData) => TemplateResult`         | —         | Next popover render                                                                             | Node popover body. Receives your original node object. Default shows label (or id), sublabel, and a status badge.                                                                                                                                                                                                                                                                 |
| `renderEdgePopoverContent` | property only                | `(edge: EdgeData) => TemplateResult`         | —         | Next popover render                                                                             | Edge popover body. Opens only from the edge's `iconIndicator` badge (hover, click, or Tab/Enter per `popoverTrigger`), never from the line. Receives your original edge object. Default shows label (or id) and a status badge.                                                                                                                                                   |
| `nodeTooltip`              | `node-tooltip`               | `boolean`                                    | `true`    | Updates immediately                                                                             | Tooltip on node hover showing `tooltip` or `label`. Never shown while `popoverTrigger` is `'hover'` (the default).                                                                                                                                                                                                                                                                |
| `nodeActionItems`          | property only                | `ContextMenuEntry[]`                         | `[]`      | Next hover                                                                                      | Actions menu for every node. A chevron appears beside a hovered or Tab-focused node that has at least one non-divider item; hidden below 50% zoom. Overridden per node by `NodeData.actionItems`.                                                                                                                                                                                 |
| `showEdgeArrows`           | `show-edge-arrows`           | `boolean`                                    | `true`    | Updates immediately                                                                             | Target arrows on all edges; `EdgeData.showArrow` overrides per edge.                                                                                                                                                                                                                                                                                                              |
| `canvasColor`              | `canvas-color`               | `string`                                     | `''`      | Updates immediately                                                                             | Canvas background: a CSS color or `var(--token)`. Invalid values fall back to `--color-base-200`. Cleared when the platform theme changes; stays cleared until set to a different value.                                                                                                                                                                                          |
| `dotBackground`            | `dot-background`             | `boolean`                                    | `false`   | Updates immediately                                                                             | Dot grid that pans and zooms with the graph.                                                                                                                                                                                                                                                                                                                                      |
| `alwaysShowLabels`         | `always-show-labels`         | `boolean`                                    | `true`    | Canvas: immediately; card overlays: next zoom change                                            | `false`: node labels, sublabels, edge labels, and `aiux-node-map-card` text hide once zoomed out below a legible size.                                                                                                                                                                                                                                                            |
| `maxNodeScreenRatio`       | `max-node-screen-ratio`      | `number` (0–1)                               | `0.18`    | Updates immediately (zooms out to the cap, or re-fits)                                          | Caps fit zoom so each node occupies at most this fraction of the container's width and height. `1` = no cap.                                                                                                                                                                                                                                                                      |
| `focusElementId`           | `focus-element-id`           | `string`                                     | `''`      | On change after the map has initialized                                                         | Pans (no zoom change) to center this node or edge id. A value present at first render is not applied. Changed in the same update as `nodes`/`edges`/`layout`, it waits for the next relayout animation to finish. Unknown ids are ignored.                                                                                                                                        |
| `nodeRendererTag`          | `node-renderer-tag`          | `string`                                     | `''`      | Initialization only                                                                             | Tag of a canvas renderer (`NodeRendererContract`) used for all nodes, e.g. `aiux-node-map-node-ellipse`. Shows "Loading graph..." until created; an error message on failure. The tag must be registered, or resolvable through the Karuna component manifest; the map does not wait for later registration.                                                                      |
| `nodeRenderer`             | property only                | `NodeRendererContract \| null`               | `null`    | Updates immediately (re-renders all nodes)                                                      | Renderer instance for all nodes. Takes precedence over `nodeRendererTag`; a node's `rendererTag` takes precedence over both.                                                                                                                                                                                                                                                      |
| `asyncRenderer`            | `async-renderer`             | `boolean`                                    | `false`   | Initialization only                                                                             | With no `nodeRenderer` at first render, shows "Loading graph..." and waits for `nodeRenderer` before drawing. Ignored when `nodeRendererTag` is set.                                                                                                                                                                                                                              |
| `nodeComponentTag`         | `node-component-tag`         | `string`                                     | `''`      | Initialization only (tag loading); applied to nodes on the next `nodes`/`edges`/`layout` change | Custom element rendered as a DOM overlay for every node without its own `component`, e.g. `aiux-node-map-card`. Suppresses node indicators.                                                                                                                                                                                                                                       |
| `nodeComponentProps`       | property only                | `Record<string, unknown>`                    | `{}`      | Next `nodes`/`edges`/`layout` change                                                            | Properties set on every `nodeComponentTag` overlay; a node's `componentProps` are merged on top.                                                                                                                                                                                                                                                                                  |

When the page's Config Editor sets Layout, Width, Height, Default Icon,
Popover Trigger, Node Tooltip, Edge Type, Canvas Color, Show edge arrows,
Always show labels, Dot background, or Max Node Screen Ratio, reading that
property returns the admin value and your assignments have no effect until it
is cleared. Read-only getters `effectiveNodeRenderer`, `effectiveCanvasColor`,
`effectiveShowEdgeArrows`, `effectiveAlwaysShowLabels`, and
`effectiveDotBackground` return the values in use.

#### Events

Use the literal event names; they are not exported as constants. All bubble,
are composed, and are not cancelable.

| Event                             | `detail`                                                          | Fires when                                                                                                        | Notes                                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-node-map:node-click`        | `{node: RenderedNodeData}`                                        | A node, its indicator, or its DOM overlay is clicked, or Enter/Space is pressed on the Tab-selected node.         | Always fires, including when `node-action` also fires.                                                                                        |
| `aiux-node-map:node-action`       | `{node: RenderedNodeData, actionId: string, actionLabel: string}` | A pointer click lands in a zone from the renderer's `actions`, right after `node-click`.                          | `actionLabel` falls back to `actionId`. Not fired by Enter/Space.                                                                             |
| `aiux-node-map:edge-click`        | `{edge: RenderedEdgeData, viaIndicator?: true}`                   | An edge line or its `iconIndicator` badge is clicked, or Enter/Space on the Tab-selected edge.                    | `viaIndicator: true` for a badge click, and for Enter/Space on an edge that has `iconIndicator`; absent for a line click.                     |
| `aiux-node-map:edge-focused`      | `{edge: RenderedEdgeData}`                                        | Pointer enters an edge's `iconIndicator` badge, or Tab selects an edge that has `iconIndicator`.                  | Not fired for edges without `iconIndicator`.                                                                                                  |
| `aiux-node-map:edge-unfocused`    | `{edge: RenderedEdgeData \| undefined}`                           | Pointer leaves the badge, or Tab/Escape moves keyboard focus off that edge.                                       | `edge` is `undefined` if that edge was removed.                                                                                               |
| `aiux-node-map:node-mouseover`    | `{node: RenderedNodeData}`                                        | Pointer enters a node, its sublabel, or its DOM overlay.                                                          | Not fired during layout animation or while dragging. Not fired by keyboard focus.                                                             |
| `aiux-node-map:node-mouseout`     | `null`                                                            | Pointer leaves the node's area, which includes its label and chevron.                                             | One animation frame late.                                                                                                                     |
| `aiux-node-map:node-focused`      | `{node: RenderedNodeData}`                                        | With every `node-mouseover`, and when Tab selects a node.                                                         |                                                                                                                                               |
| `aiux-node-map:node-unfocused`    | `{node: RenderedNodeData \| undefined}`                           | With every `node-mouseout`, when Tab/Escape moves keyboard focus off a node, and on a node's first drag movement. | `node` is `undefined` if that node was removed.                                                                                               |
| `aiux-node-map:canvas-tap`        | `null`                                                            | The empty canvas is clicked.                                                                                      | Clicking the canvas also deselects everything.                                                                                                |
| `aiux-node-map:selection-changed` | `SelectionChangedDetail`                                          | Selection changes: click, Shift/Ctrl/Cmd-click, Tab, Escape, canvas click, `clearSelection()`.                    | Coalesced to one event per microtask.                                                                                                         |
| `aiux-node-map:zoom-change`       | `{zoom: number, baselineZoom: number}`                            | Every zoom step, including each frame of animated zooms and fits.                                                 | Display percent = `Math.round(zoom / baselineZoom * 100)`; the fit level is 100%.                                                             |
| `aiux-node-map:context-action`    | `ContextActionDetail`                                             | The user activates an item in the actions menu.                                                                   | The menu and chevron close. `elementType` is always `'node'`. Disabled items do not fire. On touch devices, tapping a node shows its chevron. |

#### Slots

Position slots, each absolutely placed 1rem from the map's edges:
`top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`,
`bottom-end`. Slotted elements get `pointer-events: none`; the companion
elements below restore it, but your own interactive content needs
`pointer-events: auto` (e.g. `class="pointer-events-auto"`). Companion
elements must be light-DOM descendants of the map.

#### Methods

All are no-ops until the graph has initialized.

| Method                   | Effect                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fit()`                  | Animates (800 ms) to fit all elements, applying `maxNodeScreenRatio`; the result becomes the new 100% zoom.                                                   |
| `center()`               | Centers the elements immediately, keeping zoom.                                                                                                               |
| `resetZoom()`            | Sets raw zoom to 1 and centers, immediately.                                                                                                                  |
| `zoomIn()` / `zoomOut()` | Animates zoom ×1.1 / ×0.9 around the viewport center, within the map's zoom limits.                                                                           |
| `clearSelection()`       | Deselects all; fires `selection-changed` with empty arrays.                                                                                                   |
| `refreshTheme()`         | Re-reads theme CSS variables and redraws. Runs automatically on platform theme changes; call it only after changing `data-theme` or theme variables directly. |

**Package exports** (functions, not element methods):

| Export                                                                                             | Effect                                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions.toolbar()` / `.search(options?: SearchOptions)` / `.minimap(options?: MinimapOptions)` | Return Lit templates of the companion elements below.                                                                                         |
| `iconUri(name, color = 'currentColor')`                                                            | `data:` SVG URI for a built-in icon or an already-fetched sprite icon; `'none'` otherwise.                                                    |
| `iconUriFromSvg(svgInner, viewBox = '0 0 20 20', color = 'currentColor')`                          | Wraps SVG elements in an `<svg>` and returns a `data:` URI; `currentColor` is replaced by `color`.                                            |
| `resolveIconValue(value)`                                                                          | Icon name to `data:` URI (via `iconUri`); URLs and `data:` URIs unchanged; empty to `'none'`.                                                 |
| `AVAILABLE_ICONS`                                                                                  | `['info', 'warning', 'error', 'success']`: the icons available without fetching.                                                              |
| `prewarmIcons(names)`                                                                              | Fetches sprite icons into the cache; `Promise<void>`, or `undefined` if nothing to fetch. The map does this itself for node and action icons. |
| `collectIconNames(nodes, defaultIcon?)`                                                            | Icon names in `nodes` that need fetching (excludes built-ins, URLs, `data:` URIs).                                                            |
| `clearIconCache()`                                                                                 | Empties the fetched-icon cache.                                                                                                               |
| `isIconName(value)`                                                                                | `true` if `value` is treated as an icon name (non-empty, not `'none'`, no `/`, `:`, or `.`).                                                  |
| `resolveComponentUrl(tag)`                                                                         | Bundle URL for `tag` from the Karuna component manifest, or `null`.                                                                           |
| `ensureComponentLoaded(tag)`                                                                       | Imports the tag's bundle via the manifest unless already registered; resolves immediately without a manifest.                                 |
| `isDivider(entry)`                                                                                 | `true` if a `ContextMenuEntry` is a `ContextMenuDivider`.                                                                                     |
| `resolveItemColor(item)`                                                                           | A `ContextMenuItem`'s label color: `color`, else `var(--color-<status>)`, else `''`.                                                          |

The element classes `AiuxNodeMap` (also the default export), `AiuxNodeMapNode`,
`AiuxNodeMapNodeEllipse`, `AiuxNodeMapNodeStack`, `AiuxNodeMapCard`, and
`AiuxNodeMapCardHeader` are exported too. The toolbar, search, and minimap
classes are not; use their tags or `extensions`.

### aiux-node-map-toolbar

Vertical toolbar with Zoom in, Zoom out, and Fit to screen, calling the map's
`zoomIn()`, `zoomOut()`, and `fit()`. `extensions.toolbar()` renders
`<aiux-node-map-toolbar></aiux-node-map-toolbar>`.

Properties, events, slots, methods: none.

### aiux-node-map-search

220px search input with suggestions. Matches a case-insensitive substring
against every top-level string field of nodes and edges (including `id`,
`label`, `sublabel`, `status`, `tooltip`, and your own fields), excluding
`icon`, `component`, `rendererTag`, `source`, `target`, and `_`-prefixed keys.
Typing (150 ms debounce) highlights all matches and dims everything else;
choosing a suggestion keeps only that element highlighted and pans to it.
Suggestions are grouped Nodes / Edges, up to 50 each. Arrow keys and Enter pick
suggestions; Escape closes the list, a second Escape clears. The clear button
removes highlights. Assigning a new `nodes` or `edges` array clears the search.
Searching never selects elements or fires map events. When the map is narrower
than 400px, the search collapses to an icon button (the open field then has a
close button) and re-expands when the map widens, unless the user closed it.

`extensions.search(options)` maps `SearchOptions` to the properties below;
`panToResult: false` has no effect through the helper.

#### Properties and attributes

| Property             | Attribute            | Type      | Default | Update behavior     | Description                                                        |
| -------------------- | -------------------- | --------- | ------- | ------------------- | ------------------------------------------------------------------ |
| `highlightNodeColor` | `highlightnodecolor` | `string`  | `''`    | Next highlight      | Node outline color. Empty: `#1565C0`, or `#42A5F5` on dark themes. |
| `highlightEdgeColor` | `highlightedgecolor` | `string`  | `''`    | Next highlight      | Edge color. Empty: `#0D47A1`, or `#1565C0` on dark themes.         |
| `panToResult`        | `pantoresult`        | `boolean` | `true`  | Updates immediately | Pan to the chosen suggestion. Set `false` with a property binding. |
| `placeholder`        | `placeholder`        | `string`  | `''`    | Updates immediately | Input placeholder. Empty: localized "Find on map".                 |

Events, slots, methods: none.

### aiux-node-map-minimap

Overview of node positions (dots) with the current viewport as a rectangle:
drag it, or click elsewhere to jump. Includes a size menu (Large 220×130,
Medium 170×100 (default), Small 130×76), a zoom menu (25–150% of raw zoom,
where 100% is the `resetZoom()` level, not the fit level), and a button that
shows or hides the minimap. When the map is narrower than 400px it collapses,
and re-expands when the map widens unless the user closed it.

`extensions.minimap(options)` maps `visible: false` to `collapsed`;
`showSizeDropdown: false` and `showZoomDropdown: false` have no effect through
the helper.

#### Properties and attributes

| Property           | Attribute          | Type      | Default | Update behavior                                                                      | Description                                                                                           |
| ------------------ | ------------------ | --------- | ------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `collapsed`        | `collapsed`        | `boolean` | `false` | Read when the minimap connects to the map; later changes only show or hide the panel | Start hidden, showing only the toggle button.                                                         |
| `showSizeDropdown` | `showsizedropdown` | `boolean` | `true`  | Updates immediately                                                                  | Size menu. Set `false` with a property binding. Overridden by the Config Editor's Show Size Dropdown. |
| `showZoomDropdown` | `showzoomdropdown` | `boolean` | `true`  | Updates immediately                                                                  | Zoom menu. Set `false` with a property binding. Overridden by the Config Editor's Show Zoom Dropdown. |

Events, slots, methods: none.

### aiux-node-map-node

Default canvas renderer: the node's icon, recolored to the accent color, on a
rounded rectangle. Nodes use this look when no other
renderer is selected. The map creates and drives renderer elements; do not
place them in the DOM.

Select a canvas renderer for all nodes with `node-renderer-tag="<tag>"` (or
`.nodeRenderer`), or for one node with `rendererTag: '<tag>'`. Canvas renderers
implement `NodeRendererContract`: the map keeps one instance per tag, sets
`node`, `accentColor`, and `renderContext`, then calls `renderNode()`
synchronously for each node on every update. The map always draws the label,
sublabel, selection, and indicators. Accent color resolves from `color`, then
`status`, then `--color-base-content`.

#### Properties and attributes

| Property        | Attribute     | Type                        | Default     | Update behavior | Description                     |
| --------------- | ------------- | --------------------------- | ----------- | --------------- | ------------------------------- |
| `node`          | property only | `NodeData`                  | `{id: ''}`  | Set by the map  | Node being rendered.            |
| `accentColor`   | `accentcolor` | `string`                    | `'#4b5563'` | Set by the map  | Resolved accent color.          |
| `renderContext` | property only | `NodeRenderContext \| null` | `null`      | Set by the map  | Theme colors and `defaultIcon`. |

#### Methods

| Method                           | Effect                   |
| -------------------------------- | ------------------------ |
| `renderNode(): NodeRenderResult` | Returns the node visual. |

Events, slots: none.

### aiux-node-map-node-ellipse

Canvas renderer extending `aiux-node-map-node`: ellipse with a theme-base fill
(no accent tint) and a larger label. Replaces `isParent: true` on canvas nodes.

Properties and `renderNode()`: same as `aiux-node-map-node`. Events, slots: none.

### aiux-node-map-node-stack

Canvas renderer extending `aiux-node-map-node`: three stacked cards with the
icon on the front card and a blue count badge (1–99, then "99+") from
`NodeData.groupCount`. No badge when the count is 0 or unset.

#### Properties and attributes

Same as `aiux-node-map-node`, plus:

| Property     | Attribute     | Type     | Default | Update behavior | Description                                                              |
| ------------ | ------------- | -------- | ------- | --------------- | ------------------------------------------------------------------------ |
| `groupCount` | property only | `number` | `0`     | Next render     | Badge count used when `node.groupCount` is unset. The map never sets it. |

Methods: same as `aiux-node-map-node`. Events, slots: none.

### aiux-node-map-card

DOM overlay card: accent border, tinted background, icon on the left, label
(truncated to 20 characters) and sublabel (ellipsized at the card width).
Select it for all nodes with
`node-component-tag="aiux-node-map-card"` or per node with
`component: 'aiux-node-map-card'`; it is not a canvas renderer, so do not pass
it to `node-renderer-tag` or `rendererTag`. Reads `label` (falls back to `id`),
`sublabel`, `icon` (icon names only; URLs and `data:` URIs show no icon and
`defaultIcon` is not used), accent from `color`/`status`, and `isParent`.
Size it with `componentSize`; `{width: 490, height: 130}` fits the design.

Any other custom element can be an overlay too (see `component` in Data
shapes). Overlays receive `node` (a copy of the rendered node data) plus
`componentProps` as properties, and `zoom` and `alwaysShowLabels` when the
element declares those properties. They scale with zoom, drag the node on
mouse or one-finger touch drag,
select and fire `node-click` on click, and get a `selected` attribute when
selected and a `hover` attribute while the node's hover-mode popover or actions
menu is open. Mouse-down on an overlay prevents default focus, so inputs inside it do
not focus on click. Overlay nodes have no canvas label, sublabel, or
indicators; render your own.

#### Properties and attributes

| Property           | Attribute              | Type                 | Default | Update behavior        | Description                           |
| ------------------ | ---------------------- | -------------------- | ------- | ---------------------- | ------------------------------------- |
| `node`             | property only          | `RenderedNodeData`   | —       | Set by the map         | Node data.                            |
| `selected`         | `selected` (reflects)  | `boolean`            | `false` | Set by the map         | Selected styling.                     |
| `zoom`             | property only          | `number`             | `1`     | Set by the map on zoom | Current zoom, used for label hiding.  |
| `alwaysShowLabels` | property only          | `boolean`            | `true`  | Set by the map on zoom | Mirrors the map's `alwaysShowLabels`. |
| `parent`           | `parent` (set on host) | `boolean`, read-only | `false` | —                      | `true` when `node.isParent` is set.   |

Events, slots, methods: none.

### aiux-node-map-card-header

`aiux-node-map-card` with the parent style always on: thick top accent bar,
base background, drop shadow; selected shows a solid dark fill with white text.
Replaces `isParent: true` on card nodes.

Properties: same as `aiux-node-map-card`; `parent` is always `true`. Events,
slots, methods: none.

### Data shapes

```ts
type Status = 'info' | 'success' | 'warning' | 'error'; // colors from --color-{status}
type LayoutType =
  | 'cose'
  | 'grid'
  | 'circle'
  | 'concentric'
  | 'breadthfirst'
  | 'vertical'
  | 'horizontal';

interface NodeData {
  id: string;
  label?: string; // defaults to id; truncated to 20 chars on canvas
  sublabel?: string; // second line below the label; truncated to 20 chars
  icon?: string; // icon name, image URL, or data: URI (data: SVGs are recolored to the accent).
  // Names other than info/warning/error/success are fetched from
  // /aiux/assets/core/icons/<name>.svg (requires the page to be served by an instance);
  // unknown names show no icon.
  shape?: 'round-rectangle' | 'ellipse'; // default 'round-rectangle'; a renderer's shape wins
  status?: Status; // accent (border, icon) color
  color?: string; // accent color; overrides status
  selectedColor?: string; // Not currently used; selected nodes use the accent color
  labelBg?: string; // label pill background; default --color-secondary
  labelColor?: string; // label text; default --color-secondary-content
  hoverBg?: string; // Not currently used
  indicators?: NodeIndicator[]; // up to 2 badges on the node border; not shown on overlay nodes
  tooltip?: string; // tooltip text; '' suppresses; default label
  actionItems?: ContextMenuEntry[]; // replaces nodeActionItems for this node; [] = no chevron
  rendererTag?: string; // canvas renderer tag for this node
  component?: string; // custom element tag: render this node as a DOM overlay
  componentProps?: Record<string, unknown>; // properties set on the overlay element
  componentSize?: {width: number; height: number}; // overlay size in model px; default 200×60
  componentStyle?: Record<string, string>; // inline CSS on the overlay element
  isParent?: boolean; // deprecated: canvas → ellipse with primary accent; card → header style
  x?: number; // initial position before layout; layouts reposition every node
  y?: number;
  nodeWidth?: number; // canvas node size in model px; default 144
  nodeHeight?: number;
  groupCount?: number; // badge count for aiux-node-map-node-stack
  [key: string]: unknown; // extra fields are kept, searchable, and returned in events
}

type NodeIndicator =
  | {status: Status} // solid colored dot
  | {icon: Status}; // colored dot with the status icon

interface EdgeData {
  id: string;
  source: string; // node id
  target: string; // node id
  label?: string; // truncated to 20 chars
  status?: Status; // line color
  lineStyle?: 'solid' | 'dotted'; // default 'solid'
  selectedColor?: string; // line color when selected; default status color, then primary
  hoverColor?: string; // line color while a connected node is hovered
  iconIndicator?: Status; // status badge at the edge midpoint; the only edge popover trigger
  thickness?: 0.5 | 1 | 2 | 3 | 4 | 5; // default 1
  opacity?: number; // 0–1, default 1
  showArrow?: boolean; // overrides showEdgeArrows
  [key: string]: unknown;
}

// Node and edge data as stored by the map and delivered in event details:
// your fields (nodes lose `indicators`), `label` defaulted (to id for nodes,
// '' for edges), plus internal `_`-prefixed and style fields. Look up your
// own object by `id` if you need it unchanged.
type RenderedNodeData = NodeData;
type RenderedEdgeData = EdgeData;

interface SelectionChangedDetail {
  nodes: string[]; // selected node ids
  edges: string[]; // selected edge ids
}

type ContextMenuEntry = ContextMenuItem | ContextMenuDivider; // rendered in array order

interface ContextMenuItem {
  id: string;
  label: string;
  action: string; // returned in context-action; you perform it
  icon?: string; // platform icon name, or info/warning/error/success
  status?: Status; // label and icon color
  color?: string; // label and icon color; overrides status
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string; // default label
}

interface ContextMenuDivider {
  type: 'divider';
  id?: string;
}

interface ContextActionDetail {
  item: ContextMenuItem; // the object you supplied
  elementId: string;
  elementType: 'node' | 'edge';
}

interface NodeRendererContract {
  node: NodeData;
  accentColor: string;
  renderContext: NodeRenderContext | null;
  renderNode(): NodeRenderResult; // synchronous
}

interface NodeRenderContext {
  theme: {
    neutral: string;
    primary: string;
    primary100: string;
    base: string;
    secondaryBg: string;
    secondaryContent: string;
    status: Record<string, string>; // info/success/warning/error
  };
  defaultIcon: string;
}

interface NodeRenderResult {
  backgroundImage: string; // data: URI, URL, or 'none'
  backgroundPositionX: string; // e.g. '50%'
  backgroundPositionY: string;
  backgroundWidth: string;
  backgroundHeight: string;
  actions?: NodeAction[]; // click zones that fire node-action
  // Optional overrides; numbers are design px (the map scales them ~3.43×):
  shape?: 'round-rectangle' | 'ellipse';
  bgFill?: string; // default theme base
  bgOpacity?: number; // 0 hides the node body
  borderWidth?: number; // default 2 (ellipse 3)
  fontSize?: number; // default 12 (ellipse 14)
  textMaxWidth?: number; // default 160 (ellipse 200)
  hoverInnerSvg?: string; // data: URI for the hover visual
  hoverBorderWidth?: number;
  nodeWidth?: number; // default 42
  nodeHeight?: number;
  glowInsetLeft?: number; // left inset of the hover glow
  selectedSvg?: string; // data: URI used when selected instead of recoloring backgroundImage
  textValignCorrectionModelPx?: number; // model px (not scaled): vertical offset of the label pill; default -8.7
}

interface NodeAction {
  id: string;
  label?: string;
  zone: {x: number; y: number; width: number; height: number}; // percent of the node box, 0–100, from top-left
}

interface SearchOptions {
  highlightNodeColor?: string;
  highlightEdgeColor?: string;
  panToResult?: boolean;
  placeholder?: string;
}

interface MinimapOptions {
  visible?: boolean; // false → collapsed
  showSizeDropdown?: boolean;
  showZoomDropdown?: boolean;
}
```

The package's declared `types` path (`./src/index.ts`) does not exist in this
build, so these names cannot be imported as types; declare local types where
needed.

## Integration details

### SSR

The server renders the empty bordered container and slot wrappers. The graph
initializes in the browser one animation frame after first render, once web
fonts have loaded.

### Lifecycle

Removing the element destroys its graph and overlays. Re-inserting the same
instance does not rebuild them and leaves an empty canvas; render a new
element instead.

### Sizing and layout

- Host is `display: block; width: 100%; height: 100%; overflow: hidden`. The
  map box inside takes `width` and `height`, with a 350px minimum height,
  a `--color-base-300` border, and rounded corners.
- Plain mouse wheel scrolls the page; Ctrl+wheel or pinch (trackpad or
  two-finger touch) zooms at the pointer.

## Accessibility, localization, and customization

- **Accessibility:** the canvas is a focusable `role="application"` region
  whose label states node and edge counts, zoom, and keys. Keys: Tab /
  Shift+Tab step through nodes and edges (leaving the map after the last); Tab from
  a node with actions moves to its chevron; Enter/Space clicks the selected
  element (on an edge with `iconIndicator`, its badge) or opens the chevron
  menu; Arrow keys in the menu; Escape closes the
  popover or menu, then deselects; arrow keys pan; Ctrl+Shift+Up/Down zoom;
  Ctrl+Shift+0 resets zoom; Ctrl+Shift+1 fits. Focus changes are announced.
  Provide a visible heading for the map. DOM overlay components must supply
  their own accessible content.
- **Localization:** built-in strings (loading, error, region label, menus,
  toolbar, search, minimap, status badges) are localized; the region label's
  plural suffix is English. Node, edge, and action text is yours to translate.
- **Customization:** `canvasColor`, `dotBackground`, per-node and per-edge
  colors, and renderers. Colors come from theme tokens `--color-base-100`,
  `--color-base-200`, `--color-base-300`, `--color-base-content`,
  `--color-primary`, `--color-primary-100`, `--color-secondary`,
  `--color-secondary-content`,
  `--color-text-secondary`, and `--color-info` / `-success` / `-warning` /
  `-error`, read at initialization and on theme refresh. No CSS parts or
  component custom properties.
