# Condition builder

> Source: `@servicenow/aiux-components-condition-builder@4.0.20` · `components/condition-builder/docs/usage/aiux-condition-builder.md`

`<aiux-condition-builder>` decodes an `encodedQuery` for a `tableName`, lets the user edit it, and reports the new encoded query through `cb-encoded-query-updated`. The host sets the table, the query and `filterOptions`, then listens for the event and applies the query itself (it never loads records). Dot-walk field picking, operator and value editors, sort by, group by, related list conditions, saved filters, undo/redo, labels toggle and record count are built in; do not rebuild them. `filterOptions.mode` picks the layout: `'advanced'` (default) is the full builder; `'simple'` is a refine-results panel with an Apply button.

## Import

```js
import '@servicenow/aiux-components-condition-builder';
```

Importing the package registers `aiux-condition-builder`; its class is exported as `AIUXConditionBuilder`. Named exports (`fetchRowCount`, event-name constants and types) come from the same specifier.

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-condition-builder';
import type {
  CbEncodedQueryUpdatedDetail,
  ConditionBuilderFilterOptions
} from '@servicenow/aiux-components-condition-builder';

@customElement('my-incident-filter')
export class MyIncidentFilter extends AIUXElement {
  @state() private _query = 'active=true^priority=1';

  // Keep filterOptions stable: a new object on every render re-applies the options.
  private readonly _filterOptions: ConditionBuilderFilterOptions = {
    showSortBy: true,
    conditionCountMode: 'auto'
  };

  private _handleQueryUpdated(e: CustomEvent<CbEncodedQueryUpdatedDetail>) {
    // Echo the emitted query back so the element does not re-decode its own output.
    this._query = e.detail.encodedQuery;
  }

  render() {
    return html`
      <aiux-condition-builder
        tableName="incident"
        .encodedQuery=${this._query}
        .filterOptions=${this._filterOptions}
        @cb-encoded-query-updated=${this._handleQueryUpdated}
      ></aiux-condition-builder>
    `;
  }
}
```

**What happens:** the element decodes `active=true^priority=1` and shows one row per condition. Each edit emits `cb-encoded-query-updated` about 150 ms later; the host stores it and passes it back as `encodedQuery`.

### Additional patterns

Simple mode with a field template and curated options:

```ts
// A class field, so the object is stable across renders.
private readonly _simpleFilterOptions: ConditionBuilderFilterOptions = {
  mode: 'simple',
  simpleFilter: {
    encodedQuery: 'stateIN^opened_atIN^assignment_groupIN',
    title: 'Filter incidents',
    rows: [
      {field: 'state', kind: 'choice', selection: 'single'},
      {
        field: 'opened_at',
        kind: 'date',
        options: [{type: 'preset', id: 'last-7-days'}],
        userEntry: {mode: 'range'}
      }
    ]
  }
};

// In render():
// Simple mode fills its parent's height, so give the parent one.
html`<div style="height: 600px">
  <aiux-condition-builder
    tableName="incident"
    .encodedQuery=${this._query}
    .filterOptions=${this._simpleFilterOptions}
    @cb-encoded-query-updated=${this._handleQueryUpdated}
    @cb-close-simple-filter=${this._handleClose}
  ></aiux-condition-builder>
</div>`;
```

Applying on an explicit Apply button in advanced mode: call `flushPendingEmit()` before reading the host's staged query, so an edit made inside the debounce window is not lost.

```ts
import type {AIUXConditionBuilder} from '@servicenow/aiux-components-condition-builder';

this.renderRoot
  .querySelector<AIUXConditionBuilder>('aiux-condition-builder')
  ?.flushPendingEmit();
```

## API

### Properties and attributes

Attributes are lowercased property names unless a row shows a kebab-case attribute. `filterOptions` is an Object property; bind it with `.filterOptions=${...}` (its attribute would need JSON).

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `tableName` | `tablename` | `string` | `''` | Re-decodes the query | Table the query targets. With an empty value nothing is decoded. |
| `encodedQuery` | `encodedquery` | `string` | `''` | Re-decodes the query | Query to edit. A change re-decodes and replaces the builder's content, except when it equals the last emitted `encodedQuery` (an echo) and nothing else changed, which is ignored so partial edits survive. |
| `fixedEncodedQuery` | `fixedencodedquery` | `string` | `''` | Re-decodes the query | Locked conditions that the user cannot edit or remove; they appear in `fixedEncodedQuery` and `combinedEncodedQuery` of the event. |
| `fixedQueryMode` | `fixedquerymode` | `'SIMPLE' \| 'DISTRIBUTED'` | `'SIMPLE'` | Updates immediately | How fixed conditions join `combinedEncodedQuery`: `SIMPLE` prepends them; `DISTRIBUTED` injects them before each condition set (`^NQ`), so every condition set is constrained. |
| `filterOptions` | `filteroptions` | [`ConditionBuilderFilterOptions`](#conditionbuilderfilteroptions) | `{}` | Updates immediately | Mode and feature flags. Changing `mode` swaps between the advanced and simple views. A new `simpleFilter.encodedQuery` re-fetches in simple mode; a change to `simpleFilter.rows` content re-hydrates and resets unsaved panel edits. |
| `isSimple` | `is-simple` (reflected) | `boolean` | `false` | Not supported | Not supported; leave unset. Set `filterOptions.mode` instead. |
| `showSavedFilters` | `show-saved-filters` | `boolean` | `false` | Not supported | Deprecated. Not supported; leave unset. Use `filterOptions.showSavedFilters`. |
| `useSharedStores` | `use-shared-stores` | `boolean` | `false` | Not supported | Not supported; leave unset. |
| `initialData` | property only | `ConditionBuilderInitialData \| null` | `null` | Not supported | Not supported; leave unset. |

### Events

The host element is the only listener target needed; events come from inside the shadow tree but are composed.

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `cb-encoded-query-updated` | [`CbEncodedQueryUpdatedDetail`](#cbencodedqueryupdateddetail) | Bubbles, composed, not cancelable | Advanced mode: about 150 ms after the last edit (also after a saved filter is applied). Simple mode: when the user clicks Apply. | Not fired for the initial decode. Advanced mode only: it also fires after any later re-decode the host causes (a change to `encodedQuery`, `tableName` or `fixedEncodedQuery`) and after a `fixedQueryMode` change, can fire more than once with the same value, and can carry the previous query while a slow decode is in flight, so treat it as idempotent. In simple mode it fires only on Apply, and emits only what the panel holds: fields of type boolean, choice, due_date, glide_date, glide_date_time or reference, plus fields whose `rows` entry passed validation without a `row-has-no-effect` warning, and this applies to template fields too. OR participants and repeated fields are dropped, later condition sets (`^NQ`) are joined with AND, and operators are normalized except on fields with a configured row; fields left at Any are not emitted. With a template, live conditions on fields outside it are kept (hidden) and re-joined with AND; the live query's related-list conditions and repeat conditions on a template field are dropped. Other `cb-*` events may bubble out of the element; apart from `cb-record-count:view-results` (see `conditionCountMode`) they are internal. |
| `cb-close-simple-filter` | `null` | Bubbles, composed, not cancelable | Simple mode: the user clicks the close button in the panel header. | The host decides what closing means (hide the panel). |
| `cb-record-count:view-results` | `{count: number \| null; encodedQuery: string; tableName: string}` (type not exported) | Bubbles, composed, cancelable | Advanced mode with `conditionCountMode` `'manual'` or `'auto'`: the user clicks the count link, shown only when one or more records match. | `encodedQuery` is the current user query without fixed conditions. By default the link opens the table's record list for that query in a new tab; call `preventDefault()` to stop it. |
| `cb-simple-filter-config-error` | [`CbSimpleFilterConfigErrorDetail`](#simple-filter-config-diagnostics) | Bubbles, composed, not cancelable | Simple mode: a `simpleFilter.rows` entry is rejected, once per invalid row per hydration. | Name is exported as `CB_SIMPLE_FILTER_CONFIG_ERROR_EVENT`. |
| `cb-simple-filter-config-warning` | [`CbSimpleFilterConfigWarningDetail`](#simple-filter-config-diagnostics) | Bubbles, composed, not cancelable | Simple mode: a valid row is kept but changes nothing. | Name is exported as `CB_SIMPLE_FILTER_CONFIG_WARNING_EVENT`. |

### Slots

None.

### Methods

| Method | Signature | Description |
| --- | --- | --- |
| `flushPendingEmit()` | `() => void` | Dispatches a pending debounced `cb-encoded-query-updated` immediately. No-op when nothing is pending. In simple mode there is never a pending emit, so it does nothing. |

### Exported helpers

| Export | Signature | Description |
| --- | --- | --- |
| `fetchRowCount` | `(table: string, query: string) => Promise<number>` | Count of records matching an encoded query, for a host that renders its own count. Browser use; throws on request failure. |
| `CB_SIMPLE_FILTER_CONFIG_ERROR_EVENT`, `CB_SIMPLE_FILTER_CONFIG_WARNING_EVENT` | `string` | Event names `'cb-simple-filter-config-error'` and `'cb-simple-filter-config-warning'`. |
| `fetchConditionBuilderInitialData` | function | Not supported; do not call. |
| `getFieldOperatorRelationship`, `fieldOperatorRelationship` | function, constant | Not supported; do not use. `fieldOperatorRelationship` is deprecated. |
| `ROW_COUNT_QUERY` | `string` | Not supported; do not use. |
| `CbValueReference`, `ValueEditorBase` | classes | Not supported; do not use. |
| `CbStoreProvider` | class | The `cb-store-provider` element class; documented with `cb-filter-overview`. |

These exported types are not supported: `ConditionBuilderInitialData`, `ConditionBuilderProps`, `FetchConditionBuilderDataParams`, `CustomFieldOperator`, `CustomFieldOperatorRelationship`, `CustomFieldTypeConfig`, `FieldOperator`, `FieldTypeDefinition`, `FieldOperatorRelationship`, `EditorValue`, `CbValueSetDetail`, `ValueEditorInterface`, `SelectItem`, `CbSelectChangeDetail`.

### Data shapes

#### CbEncodedQueryUpdatedDetail

| Field | Type | Description |
| --- | --- | --- |
| `encodedQuery` | `string` | The user-editable conditions, related list conditions, sort and group by. Pass this back as `encodedQuery`. |
| `fixedEncodedQuery` | `string` | The fixed conditions only. |
| `combinedEncodedQuery` | `string` | Fixed and normal conditions combined per `fixedQueryMode`; use it to query records. |

#### ConditionBuilderFilterOptions

All fields are optional. Exported types: `ConditionBuilderFilterOptions` and `ConditionBuilderModes` (`'simple' | 'advanced'`).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'advanced' \| 'simple'` | `'advanced'` | Selects the layout. |
| `enableOptionalFeatures` | `boolean` | `false` | Turns on every opt-in flag that is not set explicitly: `includeExcludedOperators`, `includeExtendedOperators`, `showLabelsToggle`, `showRelatedListConditions`, `showSavedFilters`, `showUndoRedo`, `useVariableRow`. An explicit value on a flag always wins, except that the unsupported `showSavedFilters` element property, when `true`, forces saved filters on. |
| `readOnly` | `boolean` | `false` | Disables editing; hides saved filters. |
| `popoverContainer` | `HTMLElement \| null` | `null` | Element the field, operator and value popovers are appended to. |
| `showSortBy` | `boolean` | `true` | Sort by tab or section. |
| `showGroupBy` | `boolean` | `true` | Group by tab or section. |
| `showRelatedListConditions` | `boolean` | `false` | Related list conditions tab (advanced). |
| `showSavedFilters` | `boolean` | `false` | Saved filters menu (advanced; off when `readOnly`). |
| `showLabelsToggle` | `boolean` | `false` | "Hide labels" toggle (advanced); the choice is saved as a user preference. The saved choice applies even when the toggle is hidden. |
| `showUndoRedo` | `boolean` | `false` | Undo and redo buttons (advanced). Read once when the element connects; turning it on later shows no buttons. |
| `showAddConditionSet` | `boolean` | `true` | "Add condition set" button (advanced). |
| `showReferenceLookup` | `boolean` | `true` | Reference lookup in reference value editors. |
| `showTagLookup` | `boolean` | `true` | Lookup button in tag value editors. |
| `conditionCountMode` | `'none' \| 'manual' \| 'auto'` | `'none'` | Matching-record count below the conditions (advanced), with a refresh button. `manual` fetches only on refresh; `auto` also fetches on mount and whenever the conditions or `tableName` change, debounced 150 ms. The count covers `encodedQuery` only; fixed conditions are not applied. When one or more records match, the count is a link that opens the records list in a new tab and fires the cancelable `cb-record-count:view-results` (see Events). The refresh button is disabled when `readOnly`. |
| `enableMaxHeight` | `boolean` | `true` | Caps the advanced card at 320 px with internal scrolling; `false` lets it grow with the page. |
| `includeExcludedOperators` | `boolean` | `false` | Respect per-field excluded operators (advanced). An instance setting can also turn it on; then `false` does not turn it off. |
| `includeExtendedOperators` | `boolean` | `false` | Add "is changed", "is changed from" and "is changed to" operators where the field supports them (advanced). |
| `disableDotwalking` | `boolean` | `false` | Field pickers list only the root table's own columns. |
| `conditions` | `{fieldExclusions?; fieldInclusions?; customField?}` | `undefined` | Conditions field picker: per-table name lists (`Record<table, string[]>`, key `'*'` applies to every table and is unioned with the table's own entry; a field in both lists is excluded). `customField` is not supported; leave it unset. |
| `groupBy` | `{fieldExclusions?; fieldInclusions?}` | `undefined` | Same lists for the Group by picker. |
| `useVariableRow` | `boolean` | `false` | Variable fields use separate catalog item and variable lookups. |
| `variablesSource` | `{sysId?; sourceType?: 'CATALOG_ITEM' \| 'VARIABLE_SET'; encodedQuery?}` | `undefined` | With `useVariableRow`: locks the item lookup to a record and filters the variable lookup. |
| `simpleFilter` | object, see below | `undefined` | Simple mode options. |
| `fieldOperatorRelationship` | object | `undefined` | Not supported; leave unset. |
| `filterOverview` | object | `undefined` | Not currently used. Not supported; leave unset. |
| `showFiltersOnLoad` | `boolean` | `false` | Not currently used. Not supported; leave unset. |

`simpleFilter` fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `encodedQuery` | `string` | `''` | Template: the fields the panel shows, in order (for example `'stateIN^opened_atIN'`). Without it the panel shows the fields of the current query. Fields of other types without a row are not shown. Live conditions outside the template are kept, hidden, and still emitted. |
| `title` | `string` | `''` (shows the localized "Refine results") | Panel header text. |
| `_order` | `('FILTER' \| 'SORT_BY' \| 'GROUP_BY')[]` | `['FILTER', 'SORT_BY', 'GROUP_BY']` | Section order. |
| `disableStickyHeader` | `boolean` | `false` | Header scrolls with the content instead of staying pinned. |
| `groupBy` | `{presets?: {displayValue; internalValue}[]; showNoneOption?: boolean}` | `undefined` | `presets` (5 or fewer recommended) replace the dot-walk picker with radio chips; `internalValue` is a field path such as `'caller_id.email'`. `showNoneOption` (default `true`) adds a "None" radio. |
| `rows` | `readonly SimpleFilterRowConfig[]` | `undefined` | Per-field customization, below. |

#### Simple filter rows

Exported types: `SimpleFilterRowConfig`, `ChoiceRowConfig`, `DateRowConfig`, `IntegerRowConfig`, `ReferenceRowConfig`, `StringRowConfig`, `ChoiceOption`, `DateOption`, `DatePresetId`, `IntegerOption`, `ReferenceOption`, `StringOption`, `SimpleFilterConfigErrorCode`, `SimpleFilterConfigWarningCode`, `CbSimpleFilterConfigErrorDetail`, `CbSimpleFilterConfigWarningDetail`. Rows are additive: each `field` must appear exactly once in `simpleFilter.encodedQuery` (or, without a template, in `encodedQuery`) (dot-walked fields use the full dotted path); rows never add fields. Fields without a row, and a missing `rows`, keep default behavior. Pass option labels already translated.

| `kind` | Accepted field types | `options` entries | `userEntry` (adds a "Custom" radio) | Emits |
| --- | --- | --- | --- | --- |
| `choice` | `choice` | `{id, label, value}`; values non-empty, no commas; plus row `selection: 'multiple' \| 'single'` (default `'multiple'`) | none | `fieldIN` followed by the values |
| `date` | `glide_date`, `glide_date_time`, `due_date`, `date`, `datetime` | `{type: 'preset', id}` with id `today`, `last-7-days`, `last-30-days` or `last-90-days`; or `{type: 'date-string', id, label, date: 'YYYY-MM-DD'}` | `{mode: 'single' \| 'range'}` | Presets: `fieldON` with `gs.*` date expressions. Date strings and Custom: full-day `BETWEEN` |
| `integer` | `integer`, `longint` | `{id, label, type: 'value', value}` or `{id, label, type: 'range', min, max}` (safe whole numbers, `min <= max`) | `{mode: 'single' \| 'range', min?, max?}` | `field=value` or `fieldBETWEENmin@max` |
| `string` | `string` | `{id, label, value}` (non-empty) | `{mode: 'single'}` | `field=value` |
| `reference` | `reference` | `{id, label, sysId}` (32 lowercase hex) | `{mode: 'single'}` | `field=sysId` |

- `integer` and `string` rows need `options`, `userEntry`, or both; a `reference` row needs `options` (`userEntry` only adds Custom, and a `userEntry`-only reference row has no effect and fires the warning); omit `options` rather than passing `[]`. A `date` row with neither keeps the default date chips; `options` without `userEntry` hides Custom.
- A saved condition that no option or `userEntry` can represent is shown read-only as "Current filter" and preserved.
- A row that fails validation is skipped, its field behaves as if unconfigured, and an error event fires. A field configured by more than one row has every such row rejected.
- Unknown keys on a row are ignored.

#### Simple filter config diagnostics

```ts
interface CbSimpleFilterConfigErrorDetail {
  code: SimpleFilterConfigErrorCode;
  context?: Record<string, unknown>; // depends on code
  field: string; // '' when the row has no usable field
  reason: string; // human-facing text, may change; do not match on it
  rowIndex?: number; // absent when rows is not an array
}
interface CbSimpleFilterConfigWarningDetail {
  code: 'row-has-no-effect'; // valid row that only restates default behavior
  field: string;
  reason: string;
  rowIndex: number;
}
```

`SimpleFilterConfigErrorCode` is one of `invalid-row-shape`, `unknown-kind`, `duplicate-configured-field`, `field-missing-from-template`, `field-multiple-in-template`, `kind-metadata-mismatch`, `unknown-user-entry-type`, `missing-options-or-user-entry`, `empty-options`, `unknown-option-type`, `invalid-option-value`, `invalid-integer-option`, `invalid-user-entry-bounds`, `invalid-date-string`, `invalid-reference-sys-id`, `unknown-date-preset`, `duplicate-option-id`, `duplicate-option-signature`. New codes can be added later; always handle a default case. Both events fire once per affected row per hydration. Re-rendering with an identical `rows` array does not hydrate, so it does not loop.

## Integration details

### Platform requirements

- Needs a signed-in instance session.
- Echo each emitted `encodedQuery` back as the `encodedQuery` property. In simple mode every later re-decode starts from the `encodedQuery` property, so a stale value reverts the panel to the old query.
- In simple mode with `simpleFilter.encodedQuery` set and a non-empty `encodedQuery`, the element decodes both and merges them.

### SSR

Only the constructor runs on the server. The stores, `role="search"` and the host `aria-label` are set up when the element connects in the browser. Decoded content is applied in `firstUpdated`, so it exists only in the browser: server markup contains no decoded conditions, and simple mode renders nothing until the browser has applied the decode.

### Lifecycle

Disconnecting destroys the element's stores. Moving or re-inserting a disconnected element starts it with empty content until `encodedQuery`, `tableName` or `fixedEncodedQuery` changes; create a new element instead. Fetch failures show a dismissible banner above the conditions in advanced mode. Simple mode always shows a results count in its header (fixed conditions included; `conditionCountMode` does not apply). A refresh button appears after the user changes a filter or clicks Clear all. Simple mode shows no error banner when a decode fails.

### Sizing and layout

`display: block`. Advanced mode is capped at 320 px tall by default (`enableMaxHeight`). In simple mode the host is `height: 100%`, so give the parent a definite height.

## Accessibility, localization, and customization

- **Accessibility:** the host has `role="search"` and an `aria-label` of "Condition builder". In simple mode the panel is a `region` labelled by `simpleFilter.title` (default "Refine results").
- **Localization:** built-in strings are localized, except the field picker's breadcrumb "… options" label and its screen-reader result announcements, which are English only. The layout follows the page `dir` (RTL supported) with no property to set. Simple filter option labels, `simpleFilter.title` and group-by preset labels are shown as given; translate them before passing them in.
- **Customization:** there are no slots or parts.
