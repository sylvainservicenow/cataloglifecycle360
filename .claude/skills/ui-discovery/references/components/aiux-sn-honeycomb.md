# Honeycomb

> Source: `@servicenow/aiux-sn-honeycomb@7.0.2` · `components/external/honeycomb/docs/usage/aiux-sn-honeycomb.md`

`<aiux-sn-honeycomb>` renders a Highcharts tilemap of hexagons. The host passes
data as `tiles` (one grid) or `groups` (several labelled clusters in one
chart); the element computes tile positions itself. It does not load data and
reports only rendering failures.

Built in: category or value coloring, hover tooltip (or an `aiux-sn-popover`
with custom content), optional zoom toolbar, background grid, tile icons,
empty state, and an error panel with a Retry button. Do not build these
yourself.

## Import

```js
import '@servicenow/aiux-sn-honeycomb';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-sn-honeycomb';

@customElement('my-agent-health')
export class MyAgentHealth extends AIUXElement {
  private _tiles = [
    {name: 'Triage Bot', category: 'ITSM', value: 92},
    {name: 'Password Reset', category: 'ITSM', value: 45},
    {name: 'Onboarding', category: 'HR', value: 78, title: 'Onb'},
    {name: 'Payroll', category: 'HR', value: 12}
  ];

  private _config = {
    title: 'Agent health',
    colorClasses: [
      {from: 0, to: 50, color: '#ef4444', name: 'Poor'},
      {from: 50, to: 80, color: '#f59e0b', name: 'Fair'},
      {from: 80, to: 101, color: '#22c55e', name: 'Good'}
    ],
    plotOptions: {series: {dataLabels: {enabled: true}}},
    enableToolbar: true
  };

  render() {
    return html`
      <aiux-sn-honeycomb
        groupby="value"
        .tiles=${this._tiles}
        .honeycombConfig=${this._config}
      ></aiux-sn-honeycomb>
    `;
  }
}
```

**What happens:** `colorClasses` apply only with `groupBy="value"` or with
`groups`. With the default `groupBy="category"` and `tiles`, each category
gets its own palette color and `colorClasses` is ignored.

### Additional patterns

Named clusters with a custom hover popover:

```ts
html`
  <aiux-sn-honeycomb
    .groups=${[
      {name: 'fin', title: 'Finance', value: 0, items: financeTiles},
      {name: 'hr', title: 'HR', value: 0, items: hrTiles}
    ]}
    .honeycombConfig=${{colorClasses, groupColumns: 2, showBackground: true}}
    .usePopover=${true}
    .renderPopoverContent=${(p: {
      name: string;
      value: number;
      groupName?: string;
    }) =>
      html`<b>${p.name}</b>
        <div>${p.groupName}: ${p.value}</div>`}
  ></aiux-sn-honeycomb>
`;
```

Overlay content in a corner slot:

```js
html`
  <aiux-sn-honeycomb .tiles=${tiles}>
    <span slot="bottom-start" class="text-xs">Updated 5 min ago</span>
  </aiux-sn-honeycomb>
`;
```

## API

### Properties and attributes

Changes apply asynchronously (the chart is rebuilt and updated after render).
Assign new arrays/objects; mutating `tiles`, `groups`, or `honeycombConfig` in
place does not update the chart.

| Property               | Attribute     | Type                                        | Default      | Update behavior | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------- | ------------------------------------------- | ------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tiles`                | property only | `HoneycombTile[]`                           | `undefined`  | Updates chart   | Single grid. Ignored when `groups` is non-empty.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `groups`               | property only | `HoneycombGroup[]`                          | `undefined`  | Updates chart   | Named clusters in one chart; takes precedence over `tiles`.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `groupBy`              | `groupby`     | `'category' \| 'value'`                     | `'category'` | Updates chart   | Tile order. `category`: tiles of a category are contiguous; with `tiles`, one palette color per category (12 colors, then repeats) and each tile's `value` is replaced by its category's index (0, 1, …), which is what tooltips and labels show. `value`: sorted low to high, colored by `colorClasses`. With `groups`, orders tiles inside each cluster and keeps real values. A platform configuration value takes precedence; a change to it applies at the next chart rebuild. |
| `honeycombConfig`      | property only | `HoneycombConfig`                           | `undefined`  | Updates chart   | Title, colors, tooltip, layout, toolbar. Not validated.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `usePopover`           | property only | `boolean`                                   | `false`      | Updates chart   | Replaces the Highcharts tooltip with an `aiux-sn-popover` that follows the mouse. A platform configuration value takes precedence, as for `groupBy`.                                                                                                                                                                                                                                                                                                                                |
| `renderPopoverContent` | property only | `(point: HoneycombPoint) => TemplateResult` | `undefined`  | Updates chart   | Popover content when `usePopover` is `true`. Without it, the popover shows `tooltipFormat`.                                                                                                                                                                                                                                                                                                                                                                                         |

`tiles` and `groups` are validated when the chart builds; invalid entries
(e.g. a missing `category` or non-numeric `value`) show the error panel and
fire `chart-error`. When both are empty or unset, a "No Data Available" state
renders instead of the chart.

### Events

| Event                           | `detail`                            | Delivery                          | Fires when                                                                                    | Notes                                                                                        |
| ------------------------------- | ----------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `aiux-sn-honeycomb:chart-error` | `{error: unknown, message: string}` | Bubbles, composed, not cancelable | Building or drawing the chart fails, including invalid `tiles`/`groups`. Async, after render. | `message` is the underlying error text. Fires once per failed attempt, including each Retry. |

While the error panel shows, property changes do not rebuild the chart; the
panel's Retry button (3 attempts, then a "Maximum retry attempts" message)
does. To show corrected data after an error, render a new element (for
example with Lit's `keyed`). Clicks and hovers on tiles do not fire events.

### Slots

`top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`,
`bottom-end`: content absolutely positioned over the chart corners and edges.
Not rendered in the empty or error state. With `enableToolbar`, the toolbar
occupies the top-right corner, over `top-end`.

### Methods

| Member                                | Effect                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `handleToolbarAction(e: CustomEvent)` | Zooms the chart for `e.detail.itemId` of `'zoom-in'`, `'zoom-out'`, or `'reset-zoom'`. Wired to the built-in toolbar; callable directly. |
| `handlePopoverClose()`                | Closes the popover. Wired to the popover's close event.                                                                                  |

Read-only getters: `errorState` (`{message, details?} \| null`), `retryCount`,
`maxRetries` (3), `popoverOpen`, `popoverData` (`HoneycombPoint \| null`),
`cursorPosition` (`{x, y}` viewport px).

### Data shapes

```ts
interface HoneycombTile {
  name: string;
  category: string;
  value: number;
  title?: string; // replaces name everywhere it is displayed
  icon?: string; // icon name, e.g. 'bot-outline'; shown only with showIcon
}

interface HoneycombGroup {
  name: string; // label when title is absent
  value: number; // required; not currently used
  title?: string; // cluster label
  items: HoneycombTile[];
}

// Tile data as passed to renderPopoverContent and tooltip placeholders.
interface HoneycombPoint {
  name: string; // tile title ?? name
  region?: string; // tile category
  x: number;
  y: number;
  value: number; // category index in tiles + groupBy="category"
  icon?: string;
  groupName?: string; // groups only: group title ?? name
}

interface ColorClass {
  from: number;
  to: number;
  color: string; // CSS color
  name?: string; // legend label
}

interface HoneycombConfig {
  title?: string; // default 'Honeycomb Tilemap' (tiles) or 'Hierarchical Honeycomb' (groups); '' hides it
  subtitle?: string;
  colorClasses?: ColorClass[]; // default: one class, 0 to Number.MAX_VALUE, '#eba3a3'
  tooltipFormat?: string; // Highcharts pointFormat; see notes below
  groupByColor?: boolean; // re-packs tiles into one compact cluster per color class
  showBackground?: boolean; // outline hexagons behind the data; skipped above 2500 cells
  backgroundStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  }; // '#ffffff', '#e0e0e0', 1
  showIcon?: boolean; // draws each tile's icon; see notes below
  chart?: {
    height?: number | string; // tiles: default derived from the grid's aspect ratio (30%–100% of width); groups: 600
    width?: number | string; // groups: default 600
    marginBottom?: number; // groups with labels: default 120
    marginLeft?: number; // groups with labels: default 150
    spacingBottom?: number; // groups with labels: default 30
  };
  plotOptions?: {
    series?: {
      rowSize?: number; // tile height, default 10; groups: background grid only
      colSize?: number; // tile width, default 10; groups: background grid only
      dataLabels?: {
        enabled?: boolean; // default false
        format?: string; // default '{point.name}'; ignored with showIcon
        color?: string; // default '#000000'
        style?: {
          textOutline?: boolean | string; // default false
          fontSize?: string; // not currently used
        };
      };
    };
  };
  xAxis?: object; // Highcharts axis options merged over {visible: false}
  yAxis?: object; // Highcharts axis options merged over {visible: false}
  enablePerformanceLogging?: boolean; // logs build/render timings to the console logger
  enableToolbar?: boolean; // zoom in / zoom out / reset toolbar, top right
  showGroupLabels?: boolean; // groups only; default true
  groupSpacing?: number; // groups only; cells between cluster origins, default 5
  groupColumns?: number; // groups only; clusters per row, default 3
}
```

- `tooltipFormat`: default `Name: <b>{point.name}</b> Value: <b>{point.value}</b>`
  (tiles) or `<b>{point.name}</b><br/>Group: {point.groupName}<br/>Value: {point.value}`
  (groups). In the popover, only `{point.name}`, `{point.value}`, and
  `{point.icon}` are substituted, and scripts, event handlers, and dangerous
  tags are stripped.
- `showIcon`: icons load in the browser from the instance's core icon sprites
  (`<base>-fill` or `<base>-outline`; plain names use `fill`); a generic icon
  shows if one fails. The tile name shows under the icon only when
  `dataLabels.enabled` is `true`.
- `groupSpacing`: each cluster is a square grid about `ceil(√n)` tiles wide;
  clusters wider than `groupSpacing` overlap their neighbors.

The types are not exported; the package root exports only the element class
(`Honeycomb`, also the default export).

## Integration details

### SSR

The server renders the empty chart container and slots (or the empty state).
Highcharts loads and draws in the browser.

### Lifecycle

Disconnecting destroys the chart and resets the retry count. After
re-attaching, the chart area stays empty until `tiles`, `groups`, `groupBy`,
`honeycombConfig`, `usePopover`, or `renderPopoverContent` is reassigned.

### Sizing and layout

- `display: block`; the chart container is full width with a 384px minimum
  height.
- With `tiles`, the chart height defaults to a percentage of its width
  derived from the grid shape; set `honeycombConfig.chart.height` for a fixed
  height. With `groups`, the chart defaults to 600 × 600 px.

## Accessibility, localization, and customization

- **Accessibility:** Highcharts' accessibility module describes the chart
  (from `title`) and each tile as "`{index}. {name}, {value}.`". The popover
  opens on mouse hover only. Toolbar buttons have localized tooltips and the
  toolbar is labelled "Zoom controls".
- **Localization:** empty state, error panel, Retry, and toolbar labels are
  localized. The default titles, default tooltip formats, and the
  accessibility fallback "Honeycomb tilemap chart" are hard-coded English;
  pass `title` and `tooltipFormat` to localize them.
- **Customization:** tile colors via `colorClasses` (or the category palette),
  background via `backgroundStyle`, labels via `dataLabels`. In `groups`,
  tile borders and cluster label styling are fixed. No CSS hooks.
