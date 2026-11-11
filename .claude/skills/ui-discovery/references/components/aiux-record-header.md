# aiux-record-header

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-header.md`

`<aiux-record-header>` is a pre-composed wrapper around `<aiux-page-header>` that fills its `title`, `title-actions`, `actions`, and `header-row` slots with the record-specific building blocks (`<aiux-record-header-title>`, `<aiux-record-header-title-actions>`, `<aiux-record-header-actions>`, and `<aiux-record-header-secondary-values>`) and adds a draft banner. Use it as-is for the standard record header, or compose your own header by slotting the building blocks into another header shell such as the nav team's `<aiux-page-header>`.

All header components must be used inside `<aiux-record-provider>`. Platform-owned record pages already include a provider, so you do not need to add one there; add a provider only on custom pages, home pages, list pages, dashboards, or when the header must target a different record than the record page's default provider.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Pre-composed header

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-header compact></aiux-record-header>
  </aiux-record-provider>
`;
```

### Custom composition with building blocks

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-page-header>
      <aiux-record-header-title slot="title"></aiux-record-header-title>
      <aiux-record-header-title-actions
        slot="title-actions"
      ></aiux-record-header-title-actions>
      <aiux-record-header-actions slot="actions"></aiux-record-header-actions>
      <aiux-record-header-secondary-values
        slot="header-row"
      ></aiux-record-header-secondary-values>
    </aiux-page-header>
  </aiux-record-provider>
`;
```

## API

### aiux-record-header

#### Properties and attributes

| Property               | Attribute         | Type                         | Default                  | Update behavior | Description                                                                           |
| ---------------------- | ----------------- | ---------------------------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------- |
| `compact`              | `compact`         | `Boolean`                    | `false`                  | Reflected       | Denser visual layout.                                                                 |
| `suppressPageTitle`    | — (property only) | `Boolean`                    | `false`                  | —               | Do not publish the record title as the page/browser title.                            |
| `suppressBreadcrumb`   | — (property only) | `Boolean`                    | `false`                  | —               | Hide the breadcrumb trail above the title row.                                        |
| `suppressPin`          | — (property only) | `Boolean`                    | `false`                  | —               | Hide the pin button next to the title.                                                |
| `suppressContextMenu`  | — (property only) | `Boolean`                    | `false`                  | —               | Disable the right-click context menu on the header.                                   |
| `visibleActionButtons` | — (property only) | `RecordHeaderActionButton[]` | tags, attachments, email | —               | Up to 3 buttons shown in the actions row; extra buttons overflow into the kebab menu. |

#### Events

None.

#### Slots

None. The component fills `<aiux-page-header>` slots internally.

#### Methods

None.

### aiux-record-header-title

Renders the record title (display value or "New Record") and the unsaved-changes indicator dot. Slot into a header shell's `title` slot.

#### Properties and attributes

None.

#### Events

None.

#### Slots

None.

#### Methods

None.

### aiux-record-header-title-actions

Renders the title-area "..." context menu. Contains actions such as Copy URL / sys_id, Show / Export XML, Export PDF, Reload Form, View / History / Configure submenus, and record-specific UI actions. Also owns the right-click context menu for the whole header. Slot into a header shell's `title-actions` slot.

#### Properties and attributes

None.

#### Events

None.

#### Slots

None.

#### Methods

None.

### aiux-record-header-actions

Renders the header's primary action row: tags, attachments, email, and up to three configurable icon buttons. It also renders the record's visible form UI actions (from `sys_ui_action` metadata) via the nested `<aiux-record-actions>` component. Buttons that do not fit overflow into a kebab menu, which also holds templates and additional record actions. Use `visibleActionButtons` to choose which buttons are promoted to the action row. Slot into a header shell's `actions` slot.

#### Properties and attributes

| Property               | Attribute         | Type                         | Default                  | Update behavior | Description                                                                           |
| ---------------------- | ----------------- | ---------------------------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------- |
| `visibleActionButtons` | — (property only) | `RecordHeaderActionButton[]` | tags, attachments, email | —               | Up to 3 buttons shown in the actions row; extra buttons overflow into the kebab menu. |

#### Events

None.

#### Slots

None.

#### Methods

None.

### aiux-record-header-secondary-values

Renders the secondary information row below the title: record number, configured secondary header fields (from `sys_aw_form_header`), view switcher, draft indicator, and customer sentiment. Slot into a header shell's `header-row` slot.

#### Properties and attributes

None.

#### Events

None.

#### Slots

None.

#### Methods

None.

### Data shapes

None.

## Integration details

Use `<aiux-record-header>` for the standard pre-composed layout. For a custom header, slot the building blocks into a header shell such as `<aiux-page-header>`:

| Building block                          | Slot            |
| --------------------------------------- | --------------- |
| `<aiux-record-header-title>`            | `title`         |
| `<aiux-record-header-title-actions>`    | `title-actions` |
| `<aiux-record-header-actions>`          | `actions`       |
| `<aiux-record-header-secondary-values>` | `header-row`    |

List-relative prev/next navigation is driven by the surrounding `<aiux-record-provider>`. Set `record-list-nav-position`, `record-list-nav-total`, `record-list-nav-target`, and `record-list-nav-query` on the provider; the header reads the resulting nav state from `HeaderAPI`.

## Accessibility, localization, and customization

The pre-composed header renders inside `<aiux-page-header>` with `role="banner"` and a localized ARIA label. The right-click context menu is keyboard accessible; disable it with `suppressContextMenu` when the surrounding page already owns that interaction.
