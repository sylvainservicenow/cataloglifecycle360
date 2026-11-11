# Toolbar

> Source: `@servicenow/aiux-components-coe-toolbar@2.3.2` · `components/external/toolbar/docs/usage/aiux-toolbar.md`

`<aiux-toolbar>` renders `groups` of buttons. The host describes every item
in `groups`; the element reports clicks and toggles through events. It does
not perform actions and does not keep toggle state: after
`aiux-toolbar:item-toggled`, the host must set the item's `active` and pass a
new `groups` array.

Built in: tooltips, dividers between groups, item separators, collapsible
groups, a "More actions" (···) overflow menu when `maxVisible` is set, and
arrow-key navigation.

`size`, `maxVisible`, and `tooltipPlacement` are admin-configurable; an
instance config value for them overrides what the host sets.

## Import

```js
import '@servicenow/aiux-components-coe-toolbar';
// Types, if needed:
import type {ToolbarGroup, ItemClickedDetail} from '@servicenow/aiux-components-coe-toolbar';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-coe-toolbar';
import type {ToolbarGroup} from '@servicenow/aiux-components-coe-toolbar';

@customElement('my-editor-toolbar')
export class MyEditorToolbar extends AIUXElement {
  @state() private _groups: ToolbarGroup[] = [
    {
      id: 'format',
      label: 'Format',
      items: [
        {
          id: 'bold',
          type: 'toggle',
          icon: 'text-bold',
          tooltip: 'Bold',
          active: false
        },
        {
          id: 'italic',
          type: 'toggle',
          icon: 'text-italic',
          tooltip: 'Italic',
          active: false
        }
      ]
    }
  ];

  private _onToggled(e: CustomEvent) {
    const {groupId, itemId, active} = e.detail;
    this._groups = this._groups.map(g =>
      g.id !== groupId
        ? g
        : {
            ...g,
            items: g.items.map(i => (i.id === itemId ? {...i, active} : i))
          }
    );
  }

  render() {
    return html`
      <aiux-toolbar
        .groups=${this._groups}
        aria-label="Editor actions"
        @aiux-toolbar:item-toggled=${this._onToggled}
      ></aiux-toolbar>
    `;
  }
}
```

**What happens:** in-place mutations of `groups` do not trigger an update;
pass a new array, as `_onToggled` does.

### Additional patterns

Collapsible group and overflow:

```js
const groups = [
  {id: 'main', items: [{id: 'new', icon: 'plus', tooltip: 'New record'}]},
  {
    id: 'view',
    label: 'View',
    icon: 'filter',
    collapsible: true,
    defaultCollapsed: true,
    items: [{id: 'filter', icon: 'filter', tooltip: 'Filter'}]
  },
  {id: 'more', items: [{id: 'export', icon: 'download', label: 'Export'}]}
];

html`<aiux-toolbar .groups=${groups} .maxVisible=${2}></aiux-toolbar>`;
// Groups 'main' and 'view' render inline; 'more' moves into the ··· menu.
```

## API

### Properties and attributes

| Property           | Attribute          | Type                                               | Default        | Update behavior           | Description                                                                                            |
| ------------------ | ------------------ | -------------------------------------------------- | -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `groups`           | `groups` (JSON)    | `ToolbarGroup[]`                                   | `[]`           | Re-renders on a new array | Ordered groups. Group and item `id`s must be unique; events and collapse state are keyed by them.      |
| `orientation`      | `orientation`      | `'horizontal' \| 'vertical'`                       | `'horizontal'` | Updates immediately       | Layout and arrow-key axis.                                                                             |
| `size`             | `size`             | `'sm' \| 'md' \| 'lg'`                             | `'md'`         | Updates immediately       | Button and icon size.                                                                                  |
| `ariaLabel`        | `aria-label`       | `string`                                           | `''`           | Updates immediately       | Accessible name of the toolbar. Empty uses the localized "Toolbar".                                    |
| `maxVisible`       | `maxvisible`       | `number`                                           | `0`            | Updates immediately       | Number of groups shown inline; the rest move into the ··· menu. `0` shows all.                         |
| `tooltipPlacement` | `tooltipplacement` | `'auto' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'auto'`       | Updates immediately       | Preferred tooltip side, with automatic fallbacks. `auto`: bottom when horizontal, right when vertical. |

Item and group behavior (see Data shapes for fields):

- Item `type`: `action` (default) fires `item-clicked`; `toggle` fires
  `item-toggled` and exposes `aria-pressed`; `separator` renders a thin line
  and is not interactive.
- An item with `icon` and no `label` is an icon-only square button.
  Tooltip text is `tooltip ?? label ?? ariaLabel`; accessible name is
  `ariaLabel ?? tooltip ?? label ?? "Toolbar action"`.
- `active: true` highlights the button for any item type.
- `disabled: true` renders a native disabled, dimmed button.
- `data` is returned unchanged in `detail.item.data`.
- Non-collapsible group `label` shows as small uppercase text above its items.
- `collapsible: true` renders a trigger button (group `icon`, or `list`, plus
  a chevron) that shows and hides the group's items. The group `label` is the
  trigger's tooltip and accessible name, not visible text.
  `defaultCollapsed` applies only the first time a group `id` appears; later
  collapse state is kept per `id` across `groups` changes.
- Groups in the ··· menu render their label and items flat; collapsible
  groups have no trigger there.

### Events

| Event                        | `detail`             | Delivery                          | Fires when                                                              | Notes                                     |
| ---------------------------- | -------------------- | --------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `aiux-toolbar:item-clicked`  | `ItemClickedDetail`  | Bubbles, composed, not cancelable | The user activates an enabled `action` item, inline or in the ··· menu. |                                           |
| `aiux-toolbar:item-toggled`  | `ItemToggledDetail`  | Bubbles, composed, not cancelable | The user activates an enabled `toggle` item.                            | `active` is `!item.active`.               |
| `aiux-toolbar:group-toggled` | `GroupToggledDetail` | Bubbles, composed, not cancelable | The user clicks a collapsible group's trigger.                          | The element applies the new state itself. |

Native `click` events from toolbar buttons do not propagate out of the
element; listen for the events above.

### Slots

None.

### Methods

None.

### Data shapes

```ts
interface ToolbarGroup {
  id: string;
  label?: string;
  items: ToolbarItem[];
  collapsible?: boolean; // default false
  defaultCollapsed?: boolean; // default false
  icon?: string; // collapsible trigger icon; default 'list'
}

interface ToolbarItem {
  id: string;
  type?: 'action' | 'toggle' | 'separator'; // default 'action'
  icon?: string;
  label?: string;
  tooltip?: string;
  disabled?: boolean;
  active?: boolean;
  ariaLabel?: string;
  data?: Record<string, unknown>;
}

interface ItemClickedDetail {
  itemId: string;
  groupId: string;
  item: ToolbarItem;
}

interface ItemToggledDetail {
  itemId: string;
  groupId: string;
  item: ToolbarItem; // as it was before the click
  active: boolean; // requested new state
}

interface GroupToggledDetail {
  groupId: string;
  collapsed: boolean; // new state
  group: ToolbarGroup;
}
```

`ToolbarGroup` and `ItemClickedDetail` are exported from the package root;
the other types are not.

## Integration details

### SSR

The server renders the full bar, with collapsible groups in their
`defaultCollapsed` state. Keyboard navigation and closing the ··· menu on
outside click start in the browser.

### Lifecycle

Collapse state survives disconnect and re-connect.

### Sizing and layout

- `display: inline-block`; the bar has its own background, border, shadow,
  and rounded corners.
- The ··· menu is absolutely positioned (`z-index: 50`) above the ··· button,
  right-aligned. An ancestor with `overflow: hidden` clips it.
- The ··· menu closes on a second ··· click, `Escape`, or a click outside the
  element. Clicking an item inside it does not close it.

## Accessibility, localization, and customization

- **Accessibility:** set `aria-label` on the element. Give icon-only items a
  `tooltip` or `ariaLabel`. One button is in the tab order; arrow keys along
  the orientation axis move focus (wrapping), `Home`/`End` jump to the ends,
  and `Escape` closes the ··· menu. Arrow-key focus skips disabled items but
  also reaches the hidden items of collapsed groups.
- **Localization:** "Toolbar", "More actions", "Toggle group", and
  "Toolbar action" are localized. The host translates all group and item text.
- **Customization:** no styling hooks. Colors come from the DaisyUI theme
  (`base-100`, `base-300`, `base-content`).
