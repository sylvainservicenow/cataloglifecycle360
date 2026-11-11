# AIUXControlTablenameConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-tablename-connected.md`

A form-field control for searching and selecting a ServiceNow table name. It wraps the internal `aiux-control-typeahead` control, feeding it a server-driven, debounced table search and translating classic table-name dictionary attributes (`base_table`, `no_system_tables`, `skip_root`, etc.) into the search query.

Built in: debounced server-side table search (via GraphQL) as the user types, an automatic "select the only match" commit on blur, table-label resolution for a pre-set `value` (looking up the human-readable label), and delegation of all label/messages/decoration rendering to the nested type-ahead. Do not reimplement table search or table-label lookup yourself — this control owns both.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class MyTablePicker extends AIUXElement {
  static properties = {
    tableName: {type: String}
  };

  render() {
    return html`
      <aiux-control-tablename-connected
        name="table_name"
        label="Table"
        .value=${this.tableName ?? ''}
        @AIUX_CONTROL_TABLENAME_CONNECTED#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-tablename-connected>
    `;
  }

  _onValueChange(e) {
    const {value, displayValue} = e.detail;
    this.tableName = value;
    // persist value/displayValue, e.g. update this.tableName and request an update
  }
}
```

**What happens:** as the user types, matching table names are fetched and shown in the nested type-ahead's dropdown. Selecting one (or the browser auto-committing the sole remaining match on blur) dispatches `AIUX_CONTROL_TABLENAME_CONNECTED#VALUE_CHANGED` with the table name and its label.

### Additional patterns

Restrict the list to non-system tables under a base table, and always show every table up front (search-on-click):

```js
html`
  <aiux-control-tablename-connected
    name="table_name"
    label="Table"
    .dictionaryAttributes=${{baseTable: 'task', noSystemTables: true}}
    .searchOnClick=${true}
    @AIUX_CONTROL_TABLENAME_CONNECTED#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-tablename-connected>
`;
```

## API

### `aiux-control-tablename-connected`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects to attribute; re-seeds the search controller | Selected table name. |
| `displayValue` | `displayvalue` | `string` | `''` | Reflects to attribute | Table label. If `value` is set and equals `displayValue` (i.e. no label resolved yet), the component fetches the table's label automatically. |
| `name` | `name` | `string` | `''` | Re-renders | Form field name, echoed back in dispatched event details. |
| `label` | `label` | `string` | `''` | Forwarded as a property to the inner type-ahead | This control never renders its own `<label>` — labeling is fully delegated. |
| `readonly` | `readonly` | `boolean` | `false` | Forwarded to inner type-ahead | — |
| `disabled` | `disabled` | `boolean` | `false` | Forwarded to inner type-ahead | — |
| `required` | `required` | `boolean` | `false` | Forwarded to inner type-ahead | — |
| `invalid` | `invalid` | `boolean` | `false` | Forwarded to inner type-ahead | — |
| `loading` | `loading` | `boolean` | `false` | Not currently used. | Declared but not read anywhere in `render()`; the inner type-ahead's loading state is driven by the search controller instead. |
| `tableName` | `tablename` | `string` | `''` | Re-seeds the search controller | Table the search is scoped/anchored to (server-side scoping, e.g. via `base_table`-style filtering), separate from the selected `value`. |
| `scopeId` | `scopeid` | `string` | `''` | Re-seeds the search controller | Application-scope id forwarded to the search query. |
| `resultLimit` | `resultlimit` | `number` | `25` | Re-seeds the search controller | Max results per search. |
| `searchOnClick` | `searchonclick` | `boolean` | `true` | Re-seeds the search controller | When `true`, clicking with an empty input searches with a wildcard (`**`) instead of nothing. |
| `searchUsingStartsWith` | `searchusingstartswith` | `boolean` | `true` | Re-seeds the search controller | Declared and forwarded through props, but not read by the query-variable builder — has no observed effect on the current search query. |
| `dictionaryAttributes` | (property only) | `DictionaryAttributes` | `{}` | Re-seeds the search controller | See **Data shapes**; maps to classic table-name dictionary attributes. |
| `serializedChanges` | `serializedchanges` | `string` | `''` | Re-seeds the search controller | Pending unsaved form changes, serialized, forwarded to the search query. |
| `encodedRecord` | `encodedrecord` | `string` | `''` | Re-seeds the search controller | Encoded record snapshot forwarded to the search query. |
| `showTableLabels` | `showtablelabels` | `boolean` | `true` | Re-renders | When `false` and `readonly`, shows the literal table name instead of its label (`glide.ui.table.labels`). Has no effect while editable. |
| `showTableNames` | `showtablenames` | `boolean` | `false` | Re-seeds the search controller | Appends `[table_name]` to each dropdown option's label (`glide.ui.show_table_names`). |
| `showAllTables` | `showalltables` | `boolean` | `true` | Re-seeds the search controller | Maps to the `setAll` search query variable. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Re-seeds the search controller | Sys ID forwarded to the search query as `recordSysId`. |
| `referringTable` | `referring-table` | `string` | `''` | Re-renders | NACM/context property; not read by the search query builder. |
| `fieldLayout`, `messages`, `helperContent`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `variant`, `fieldContextMenu`, `nowAssistConfig` | various | various | see base identity/layout properties | Forwarded as property bindings straight through to the inner `aiux-control-typeahead`, which renders the label/messages/decorations. | 

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TABLENAME_CONNECTED#VALUE_CHANGED` | `{name, value, displayValue, additionalInfo: {secondary}}` | bubbles, composed, cancelable | A table is selected from the dropdown, the sole remaining match is auto-committed on blur, or the value is cleared | `secondary` is the raw table name as returned by the search (currently always `[value]`). |
| `AIUX_CONTROL_TABLENAME_CONNECTED#STAGED_VALUE_CHANGED` | — | — | Never — declared as an action type and wired as a listener attribute by the controls-factory renderer, but the component does not dispatch it. | Only `VALUE_CHANGED` fires; there is no staged/preview event for this control. |

Internally, the control also listens for the nested type-ahead's own `AIUX_CONTROL_TYPEAHEAD#STAGED_VALUE_CHANGED`/`#VALUE_CHANGED`/`#CLICK`/`#BLUR` events to drive its search-as-you-type behavior — these are wiring between this control and its inner type-ahead, not part of this control's own event surface.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Delegates focus to the nested `aiux-control-typeahead`. |

### Data shapes

`DictionaryAttributes`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `shortList` | `boolean` | `false` | Limits to a curated short list of tables. |
| `canRead` | `boolean` | `false` | Restricts to tables the current user can read. |
| `includeDefault` | `boolean` | `false` | Includes the field's default table. |
| `selectedOnly` | `boolean` | `false` | Restricts to already-selected tables only. |
| `noViews` | `boolean` | `false` | Excludes database views. |
| `noSystemTables` | `boolean` | `false` | Excludes system tables. |
| `filterEntitledTables` | `boolean` | `false` | Excludes custom tables the plugin/entitlement doesn't license. |
| `skipScopeRestrictions` | `boolean` | `false` | Ignores application-scope restrictions. |
| `showTableNamesOnLabel` | `boolean` | `false` | Appends the table name to each option's label. |
| `tableChoicesScript` | `string` | `''` | Script id used to compute the table choice list server-side. |
| `skipRoot` | `boolean` | `false` | Excludes the root/base table itself from the list. |
| `baseTable` | `string` | `''` | Restricts to extensions of this table. |
| `allowPublic` | `boolean` | `false` | Includes tables marked public. |
| `includeDocumentTables` | `boolean` | `false` | Includes document/`sys_document`-style tables. |
| `noRemoteTables` | `boolean` | `false` | Excludes remote tables (forwarded to the query only when the server declares the matching GraphQL schema capability). |
| `noDfTables` | `boolean` | `false` | Excludes data-federation tables (same capability-gated forwarding). |
| `updateTablesOnly` | `boolean` | `false` | Restricts to tables the user can update (same capability-gated forwarding). |
| `includeNone` | `boolean` | `false` | Includes a "none" choice option. |

## Integration details

### Platform requirements

Table search and label resolution both go over the platform GraphQL client (`/api/now/graphql`).

**Gotcha:** unlike reference-connected, `tableName` is not required for the search to run — the GraphQL query declares it (and `fieldName`, built from `name`) as nullable, so omitting it still returns results, just without the `selectedField` context some server-side dictionary-attribute resolvers use. `referringRecordId` is sent as a non-null `recordSysId` argument, but the component always falls back to `''` when it's unset rather than omitting it, so a missing `referringRecordId` never errors the query — it just scopes the search as if editing a brand-new, unsaved record.

### SSR

No `window`/`document` access in this component; safe to render on the server. (The nested type-ahead is responsible for its own SSR safety.)

### Lifecycle

Debounces search queries (300ms) as the user types via the shared query controller. When `value` is set and equals `displayValue` (no label resolved yet), fetches the table's label on `updated()` and re-seeds the search controller once it resolves.

### Sizing and layout

`:host` is `display: block;`. Renders no layout of its own — the inner type-ahead (bound `class="w-full"`) owns the full form-field layout, label, and messages.

## Accessibility, localization, and customization

This control renders no `<label>` and no ARIA of its own — it forwards `label`, `disabled`, `readonly`, `required`, `invalid`, and all layout/message props straight through to the nested `aiux-control-typeahead`, which owns labeling, combobox semantics, and keyboard interaction. The one control-owned string is the "Please select a value from the list of results in the dropdown." validation message raised on blur when the typed text matches nothing, produced via `@lit/localize`'s `msg()` (localizable). No CSS custom properties or `::part()` selectors are exposed on this element.
