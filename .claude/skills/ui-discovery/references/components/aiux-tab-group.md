# Tab group

> Source: `@servicenow/aiux-components-tabs@1.5.2` · `components/external/tabs/docs/usage/aiux-tab-group.md`

`<aiux-tab-group>` renders one tab per entry in `tabs` and, for tabs with
`content`, a panel that shows while that tab is active. The element owns the
selection: the user's clicks and arrow keys change it and fire
`aiux-tab-group:tab-change`. The host can drive it with `activeTab` or
`switchToTab()`.

Built in: ARIA tabs semantics, arrow-key navigation, disabled tabs, icons,
tooltips for icon-only tabs, and a slide transition between panels.

`variant`, `placement`, `size`, and `stretch` are admin-configurable; an
instance config value for them overrides what the host sets.

## Import

```js
import '@servicenow/aiux-components-tabs';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-tabs';

@customElement('my-incident-tabs')
export class MyIncidentTabs extends AIUXElement {
  @state() private _active = 'details';

  render() {
    return html`
      <aiux-tab-group
        tablist-label="Incident sections"
        variant="bordered"
        .activeTab=${this._active}
        .tabs=${[
          {id: 'details', label: 'Details', content: html`<p>Details…</p>`},
          {
            id: 'notes',
            label: 'Notes',
            iconStart: 'comment',
            content: 'No notes yet.'
          },
          {id: 'audit', label: 'Audit', disabled: true, content: 'Audit log'}
        ]}
        @aiux-tab-group:tab-change=${(e: CustomEvent) => (this._active = e.detail.id)}
      ></aiux-tab-group>
    `;
  }
}
```

**What happens:** writing `activeTab` back from the event is safe; it does not
fire another `tab-change` or create an event loop. If you bind `activeTab`, update it from the
event: setting it to the value it already holds does not reselect that tab.

### Additional patterns

Tabs only, host renders the content:

```js
// this.filter starts as 'open': no tab-change fires for the initial selection.
html`
  <aiux-tab-group
    active-tab="open"
    .tabs=${[
      {id: 'open', label: 'Open'},
      {id: 'closed', label: 'Closed'}
    ]}
    @aiux-tab-group:tab-change=${e => (this.filter = e.detail.id)}
  ></aiux-tab-group>
  <my-list .filter=${this.filter}></my-list>
`;
```

## API

### Properties and attributes

| Property           | Attribute        | Type                                      | Default | Update behavior                  | Description                                                                                                                                                                                                                                    |
| ------------------ | ---------------- | ----------------------------------------- | ------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabs`             | `tabs` (JSON)    | `Tab[]`                                   | `[]`    | Re-renders on a new array        | Tab definitions. Give every tab a stable, unique `id`; without one, a generated instance-specific id is used. Selection is kept by id: if the new array has no tab with the current id, no tab is selected until the user or host selects one. |
| `defaultActiveTab` | `active-tab`     | `string`                                  | `''`    | Initialization only              | Initially selected tab id.                                                                                                                                                                                                                     |
| `activeTab`        | property only    | `string`                                  | `''`    | Updates immediately when changed | Selected tab id; takes precedence over `defaultActiveTab` initially. Ids of disabled or missing tabs, and `''`, are ignored. Does not fire `tab-change`.                                                                                       |
| `variant`          | `variant`        | `'' \| 'boxed' \| 'bordered' \| 'lifted'` | `''`    | Updates immediately              | Tab style. `''` is unstyled.                                                                                                                                                                                                                   |
| `placement`        | `placement`      | `'top' \| 'bottom'`                       | `'top'` | Updates immediately              | `bottom` applies bottom-placement tab styling; panels still render after the tab list.                                                                                                                                                         |
| `size`             | `size`           | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`    | `'md'`  | Updates immediately              | Tab and icon size.                                                                                                                                                                                                                             |
| `stretch`          | `stretch`        | `boolean`                                 | `false` | Updates immediately              | Tabs fill the width evenly.                                                                                                                                                                                                                    |
| `tablistLabel`     | `tablist-label`  | `string`                                  | `''`    | Updates immediately              | `aria-label` of the tab list.                                                                                                                                                                                                                  |
| —                  | `reduced-motion` | boolean attribute                         | absent  | Updates immediately              | Replaces the slide with a short fade.                                                                                                                                                                                                          |

Initial selection: `activeTab`, else `defaultActiveTab`, else (or if that tab is
disabled or missing) the first enabled tab (the first tab if all are disabled). It does not fire `tab-change`.

Tab behavior (see Data shapes for fields):

- A tab without `label` is icon-only; `title ?? ariaLabel` becomes its
  tooltip and accessible name. On labelled tabs, `title` and `ariaLabel` are
  not used.
- `content` is a string or a Lit `TemplateResult`, rendered inside the
  element's shadow root. Tabs without `content` get no panel. All panels stay
  in the DOM; inactive ones are hidden.

### Events

| Event                       | `detail`               | Delivery                          | Fires when                                                                            | Notes                                                                                                                                          |
| --------------------------- | ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-tab-group:tab-change` | `TabChangeEventDetail` | Bubbles, composed, not cancelable | The user clicks a tab or moves with arrow keys, or `switchToTab()` runs. Synchronous. | Also fires when the already-active tab is clicked (`id === previousTab`). Not fired for `activeTab`, `defaultActiveTab`, or initial selection. |
| `tab-change`                | `TabChangeEventDetail` | Bubbles, composed, not cancelable | Immediately after every `aiux-tab-group:tab-change`.                                  | Deprecated alias; use `aiux-tab-group:tab-change`.                                                                                             |

### Slots

None.

### Methods

| Method                                     | Effect                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `switchToTab(idOrIndex: string \| number)` | Selects the tab by id or array index and fires `tab-change`. Ignored for disabled or missing tabs. |
| `getActiveTab(): Tab \| undefined`         | Returns the selected tab object.                                                                   |

### Data shapes

```ts
interface Tab {
  id?: string;
  label?: string;
  content?: string | TemplateResult;
  disabled?: boolean; // default false
  iconStart?: string; // icon name before the label
  iconEnd?: string; // icon name after the label
  title?: string; // icon-only tabs: tooltip and accessible name
  ariaLabel?: string; // icon-only tabs: accessible name when title is unset
}

interface TabChangeEventDetail {
  id: string; // new tab's id (generated if the tab has none)
  label?: string;
  index: number; // index in tabs
  previousTab: string; // previous tab's id
}
```

These types are not exported from the package.

## Integration details

### SSR

The server renders the tabs and all panels, with the initial selection
applied. Set `id` on every tab when server rendering.

### Sizing and layout

`display: block`. The panel area takes the height of the active panel;
panels have padding, a surface background, and rounded corners.

## Accessibility, localization, and customization

- **Accessibility:** set `tablist-label`. Only the selected tab is in the tab
  order; `Tab` then moves to its panel, if it has one. Arrow keys (left/right and up/down)
  select and focus the previous/next enabled tab, wrapping. `Home`/`End` are
  not handled.
- **Localization:** no built-in strings; the host translates tab text.
- **Customization:** CSS custom properties on the element:
  `--aiux-tab-panel-transition-duration`, `--aiux-tab-panel-slide-distance`
  (default `100%`), `--aiux-tab-panel-easing`. Tab colors come from the
  DaisyUI theme.
