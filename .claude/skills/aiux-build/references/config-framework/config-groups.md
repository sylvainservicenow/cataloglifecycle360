# Config Groups

Organize `@configProperty` fields into collapsible accordion sections in the props pane.

There is no `order` option — fields render in source order. Grouping is the only way to reorganize them.

## Example

```js
import {customElement} from 'lit/decorators.js';
import {AIUXElement, configProperty, decorators} from '@servicenow/aiux-components-core';
import {i18n} from '@servicenow/aiux-services';
const {discoverable, name} = decorators;

@customElement('my-settings-widget')
@discoverable(true)
@name('Settings Widget')
export default class MySettingsWidget extends AIUXElement {
  static configGroups = [
    {id: 'appearance', label: i18n.getMessage('Appearance'), defaultExpanded: true},
    {id: 'selection', label: i18n.getMessage('Selection'), defaultExpanded: false}
  ];

  @configProperty({label: i18n.getMessage('Title'), type: String, group: 'appearance'})
  title = i18n.getMessage('Untitled');

  @configProperty({label: i18n.getMessage('Show border'), type: Boolean, group: 'appearance'})
  showBorder = true;

  @configProperty({label: i18n.getMessage('Color'), type: 'color', group: 'selection'})
  accentColor = '--color-primary';
}
```

## `group` Option on `@configProperty`

Assigns the property to a named group. The value is a string id that matches a `configGroups` entry.

## `static configGroups` on the Widget Class

Optional. Defines group order, display labels, and initial expanded state. If absent, groups are auto-derived from first-appearance order in the class, with the label defaulting to the raw id string.

| Field             | Type      | Required | Notes                                       |
| ----------------- | --------- | -------- | ------------------------------------------- |
| `id`              | `string`  | Yes      | Referenced in `@configProperty({group: '...'})` |
| `label`           | `string`  | No       | Display name; defaults to the raw id string |
| `defaultExpanded` | `boolean` | No       | Initial state; defaults to `true`           |

Always wrap `label` in `i18n.getMessage()` from `@servicenow/aiux-services` for translation.

## Fallback Behavior

- Props whose `group` id is not in `configGroups` (or when `configGroups` is absent and the id is otherwise unknown) render **flat, below all accordions**.
- If no props declare a `group` key at all, the panel renders a plain flat list — identical to pre-groups behavior.

