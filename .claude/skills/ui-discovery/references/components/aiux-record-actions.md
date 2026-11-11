# aiux-record-actions

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-actions.md`

Renders the record's visible form UI actions as a button bar with an overflow split-button. The actions are configured via `sys_ui_action` metadata for the record's table — for example, standard actions like Save, Update, or Delete, as well as any custom actions defined on that table. Presentational component that reads the available actions from `ActionsAPI`; must be used inside `<aiux-record-provider>`.

Platform-owned record pages already include a provider, so you do not need to add one there; add a provider only on custom pages, home pages, list pages, dashboards, or when the actions must target a different record than the record page's default provider.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-actions></aiux-record-actions>
  </aiux-record-provider>
`;
```

### Overflow handled by host

```js
html` <aiux-record-actions overflow-handled-by-host></aiux-record-actions> `;
```

## API

### Properties and attributes

| Property                | Attribute                  | Type      | Default | Update behavior | Description                                                                                                    |
| ----------------------- | -------------------------- | --------- | ------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `overflowHandledByHost` | `overflow-handled-by-host` | `Boolean` | `false` | —               | When true, all visible actions render as up to three plain buttons instead of using the overflow split-button. |

### Events

None.

### Slots

None.

### Methods

None.

## Integration details

`<aiux-record-header>` and its `<aiux-record-header-actions>` already include a form action area, so if you are using either of them you typically do not need to add `<aiux-record-actions>` separately. Use this component when you want record actions in a different location, such as a modal footer.

## Accessibility, localization, and customization

Actions render as a keyboard-operable action bar with localized labels. Overflow actions are reachable through the split-button menu.
