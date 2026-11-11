# aiux-record-activity-layout

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-activity-layout.md`

`<aiux-record-activity-layout>` wraps `<aiux-record-activity-compose>` and `<aiux-record-activity-stream>` and decides whether they sit side by side or stacked. It measures its own width, tells `<aiux-record-activity-compose>` the result (compose uses it to show the side-by-side toggle and to size its editors), and remembers the user's choice. The host does not measure widths or store the choice itself. The component has no events and no methods.

The layout must be used inside `<aiux-record-provider>`. Platform-owned record pages already include a provider, so you do not need to add one there. Add a provider only on custom pages, home pages, list pages, dashboards, or when the layout must target a different record than the record page's default provider.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-activity-layout layout-name="my-panel" gap="gap-4">
      <aiux-record-activity-compose main></aiux-record-activity-compose>
      <aiux-record-activity-stream></aiux-record-activity-stream>
    </aiux-record-activity-layout>
  </aiux-record-provider>
`;
```

**What happens:** At 700px or wider, and when the record has journal fields to compose, the layout shows compose and the stream side by side. Narrower, or when the user chooses stacked in the compose settings menu, they stack. The choice is saved under `my-panel`.

### Additional patterns

Start stacked, but let the user switch, and keep that switch separate from other layouts on the same table:

```js
html`
  <aiux-record-activity-layout default-force-stacked layout-name="sidebar">
    <aiux-record-activity-compose main></aiux-record-activity-compose>
    <aiux-record-activity-stream></aiux-record-activity-stream>
  </aiux-record-activity-layout>
`;
```

To always stack, place `<aiux-record-activity-compose>` and `<aiux-record-activity-stream>` without the layout wrapper.

## API

### aiux-record-activity-layout

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Config framework | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `defaultForceStacked` | `default-force-stacked` | `boolean` | `false` | Read once, on first render | No | Whether the layout starts stacked when the user has no saved choice. |
| `disablePreserveLayout` | `disable-preserve-layout` | `boolean` | `false` | Checked on each read and save | No | Turns off saving and restoring the user's choice. With it on, the layout always starts from `defaultForceStacked`. |
| `layoutName` | `layout-name` | `string` | `''` | Read when the layout starts and when it saves | No | Name under which the choice is saved. Layouts with the same name share one saved choice. An empty name uses the shared name `default`. |
| `gap` | `gap` | `'gap-0' \| 'gap-1' \| 'gap-2' \| 'gap-3' \| 'gap-4' \| 'gap-5' \| 'gap-6'` | `'gap-3'` | Updates immediately | No | Gap between the slotted elements, as a Tailwind gap class. |

How the starting layout is chosen, in order: the user's saved choice (unless `disablePreserveLayout`), then `defaultForceStacked`.

The layout is side by side only when all of these are true: the layout is at least 700px wide, the record has at least one journal field to compose, and the user has not chosen stacked. The layout is always stacked when the record has no journal fields.

#### Properties controlled by the config framework

None. No property on this component is declared with `@configProperty`.

#### Events

None.

#### Slots

| Slot | Description |
| --- | --- |
| default | The elements to arrange, normally one `<aiux-record-activity-compose>` and one `<aiux-record-activity-stream>`. |

#### Methods

None.

### System properties

None.

### User preferences

None read directly.

### Settings the component saves for the user

Saved automatically when the user toggles side by side in the compose settings menu.

| Setting | Scope | Stored in |
| --- | --- | --- |
| `{forceStacked: boolean}` | Per user, per table, per `layoutName` | Saved for the user |

## Integration details

### Platform requirements

- Must be inside `<aiux-record-provider>`. The layout reads the record's Activity and Compose APIs.
- Needs a container width the page controls. The layout measures its own box, so a zero-width or hidden container stays stacked until it is shown.

### SSR

The server markup is arranged by CSS from the container width, so it can appear side by side before hydration. After hydration the layout measures its width and tells compose, which then shows the side-by-side toggle and sizes its editors. The saved choice is read on the first render on both server and client.

### Sizing and layout

The 700px side-by-side threshold is fixed and not configurable.

## Accessibility, localization, and customization

- The layout adds no interactive controls and no strings of its own. The side-by-side toggle lives in compose's settings menu.
- Spacing is set with `gap`. The component exposes no CSS parts.
