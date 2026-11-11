# aiux-record-related-lists

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-related-lists.md`

Displays the related lists for a ServiceNow record. When used inside `<aiux-record-provider>`, it reads the record's table, view, and sys_id from context; in standalone mode, supply `table` and `view` directly.

Platform-owned record pages already include a provider, so you do not need to add one there; add a provider only on custom pages, home pages, list pages, dashboards, or when the related lists must target a different record than the record page's default provider.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Inside a provider

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-related-lists
      layout-variant="tabs"
      timing-variant="deferred"
    ></aiux-record-related-lists>
  </aiux-record-provider>
`;
```

### Standalone

```js
html`
  <aiux-record-related-lists
    table="incident"
    view="default"
  ></aiux-record-related-lists>
`;
```

## API

### Properties and attributes

| Property            | Attribute         | Type     | Default         | Update behavior | Description                                                                                                      |
| ------------------- | ----------------- | -------- | --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `layoutVariant`     | `layout-variant`  | `String` | user preference | —               | `"accordions"` or `"tabs"`. Falls back to the `tabbed.forms` user preference.                                    |
| `timingVariant`     | `timing-variant`  | `String` | user preference | —               | `"deferred"` loads immediately; `"on-demand"` shows a load button. Falls back to `glide.ui.related_list_timing`. |
| `sectionClass`      | `section-class`   | `String` | `''`            | —               | Extra CSS class applied to each section wrapper.                                                                 |
| `table`             | `table`           | `String` | —               | —               | Standalone mode: parent table name.                                                                              |
| `view`              | `view`            | `String` | —               | —               | Standalone mode: view name.                                                                                      |
| `parentRecordSysId` | — (property only) | `String` | —               | —               | Standalone mode: parent record sys_id.                                                                           |
| `listOptions`       | — (property only) | `Object` | —               | —               | Override default list options for every embedded list.                                                           |

### Events

None.

### Slots

None.

### Methods

None.

## Integration details

In standalone mode, every list is mounted up front so client scripts and UI actions can reach any related list at load time. Tab panels stay in the DOM when inactive to preserve scroll position and selection state.

## Accessibility, localization, and customization

Related lists render with a visually hidden `<h2>` heading. Layout and chrome follow the embedded `<aiux-list-connected>` configuration.
