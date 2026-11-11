# `@configProperty` Field Types Reference

The `@configProperty` decorator declares a component property as admin-configurable **and** as a reactive Lit property. The options object you pass is pushed onto the class prototype's `configSchema` array, which the config editor props pane reads at runtime to render the appropriate field UI; the four Lit options (`attribute`, `reflect`, `converter`, `hasChanged`) are peeled off and handed to Lit instead.

> **Important:** `@configProperty` is the decorator for an admin-configurable field — it already **is** the composition of config-schema registration and Lit's `@property()`. Never add `@property()` or `@state()` alongside it. The field behaves exactly like a `@property()` field in every respect (observed attribute, reactivity, `changedProperties`, `updateComplete`, SSR, and a parent may bind it with `.title=${…}`), with exactly one addition: when the admin config editor has a saved value for that key, that value wins over whatever the code set.
>
> **The runtime default is the field initializer, not an option.** There is no `default` option — the type signature omits it, and passing one logs a warning and is ignored (it never reaches the config schema). Write the default where you declare the field.

```js
// ✗ WRONG — @configProperty is already the Lit property declaration.
@property({type: String})
@configProperty({type: String, label: i18n.getMessage('Title')})
title;

// ✗ WRONG — `default` is not an option: it warns, is ignored, and the
// field reads `undefined`.
@configProperty({type: String, label: i18n.getMessage('Title'), default: 'Open incidents'})
title;

// ✓ CORRECT
@configProperty({type: String, label: i18n.getMessage('Title')})
title = i18n.getMessage('Open incidents');
```

> **Ordering:** `@customElement` must be the **topmost** class decorator. It does not return the class, so any class-level decorator (e.g. `@externalConfig`, `@discoverable`, `@name`) declared above it receives `undefined` and breaks.

> **Instance binding:** Declaring `@configProperty` makes a widget configurable, but each instance must also carry a static `aiux-config-id` attribute in the host page/layout to expose its config to admins. See `config-id.md`.

## Semantics

Five rules explain every behavior this decorator has.

**1. A `@configProperty` field is a `@property` field plus an override channel.** Everything Lit's `@property()` gives you is intact: an observed attribute (the lowercased property name unless `attribute` says otherwise), assignments that trigger an update and appear in `changedProperties`, `updateComplete`, SSR, and a parent that can set the value from a template (`.actionLabel=${…}`).

**2. The admin override wins over the element's own value.** The getter returns this key's entry in `aiuxConfigData` whenever that entry is not `undefined`; otherwise it returns the element's own value. An explicit `null` — or `''`, `0`, `false` — is a real override and wins. Only `undefined`, or an absent key, falls through. Assignments made while an override is active are still recorded underneath, so if the override is later cleared the last assigned value comes back.

**3. The field initializer is the runtime default.** There is no `default` option; the type signature omits it. Set the default where you declare the field:

```js
@configProperty({type: String, label: i18n.getMessage('Action label')})
actionLabel = i18n.getMessage('Review task');
```

Every other option (`label`, `description`, `dependsOn`, `group`, and all type-specific options such as `choices`, `min`, `max`, `list`, `table`, `component`) goes to the config schema unchanged. A field with no initializer reads `undefined` until an attribute, a parent, or an admin supplies a value.

**4. Four Lit options may ride along in the same object:** `attribute`, `reflect`, `converter`, `hasChanged`. Any other Lit `PropertyDeclaration` key (`state`, `noAccessor`, `useDefault`, …) is **not** forwarded to Lit — it lands in the config schema instead and is silently ignored. Lit's `type` is not settable: the attribute converter is derived from the config `type`. `Number`, `Boolean`, and `Array` pass through; `'select-multi'` becomes `Array`; `'table-picker'` and `'reference-picker'` with `multi: true` become `Object`; every other type — `String`, `'url'`, `'color'`, `'textarea'`, `'datetime'`, `'table-picker'`, `'reference-picker'`, `'table-reference'`, `'role-picker'`, `'condition-builder'`, `'custom'` — uses `String`. Pass `converter` when you need different parsing.

**5. A live admin edit re-renders through `aiuxConfigData`, not through this key.** When the config editor writes a value it reassigns `aiuxConfigData` (a reactive property on every `AIUXElement`), which triggers the update, and the getter then reads the new override. The property's own key does **not** appear in `changedProperties`. Code that must react to an override change watches `aiuxConfigData`:

```js
updated(changed) {
  if (changed.has('aiuxConfigData')) this._refetch();
}
```

## Consuming Config Values in `render()`

Use `this.myField` directly — the field initializer provides the default, and an admin override (if any) is returned transparently by the getter:

```js
@configProperty({type: String, label: i18n.getMessage('Action label')})
actionLabel = i18n.getMessage('Review task');

@configProperty({type: Boolean, label: i18n.getMessage('Show footer')})
showFooter = true;

render() {
  return html`
    <button>${this.actionLabel}</button>
    ${this.showFooter ? html`<span>${i18n.getMessage('Updated just now')}</span>` : nothing}
  `;
}
```

No nullish coalescing or fallback logic is needed — `@configProperty`'s getter falls back to the field initializer when no admin override exists.

## Quick Reference

> `type: Object` is not a valid config `type` — it logs a warning. For a composite value use `type: 'custom'`. There is no `order` option: fields render in source order; use `group` with `static configGroups` to organize them.

| `type`                | Editor Field                            | Value Shape                         | `input_schema` type | Extra Options                                                 |
| --------------------- | --------------------------------------- | ----------------------------------- | ------------------- | ------------------------------------------------------------- |
| `String`              | Text input (or select if `choices` set) | `string`                            | `String`            | `choices`, `maxlength`, `minlength`, `pattern`, `placeholder` |
| `Number`              | Number input                            | `number`                            | `Number`            | `min`, `max`, `step`                                          |
| `Boolean`             | Toggle switch                           | `boolean`                           | `Boolean`           | —                                                             |
| `Array`               | External config editor                  | `array`                             | `Array`             | `list` (required)                                             |
| `'url'`               | URL text input                          | `string`                            | `String`            | `maxlength`, `minlength`, `pattern`, `placeholder`            |
| `'textarea'`          | Multi-line textarea                     | `string`                            | `String`            | `rows`, `maxlength`, `minlength`, `placeholder`               |
| `'select-multi'`      | Multi-select typeahead                  | `string[]`                          | `Array`             | `choices` (required)                                          |
| `'table-picker'`      | Table search typeahead                  | `string` (or `{table: string[]}` with `multi`; adds `columns` with `columnPicker`) | `String` (or `Object` with `multi`/`columnPicker`) | `items`, `multi`, `maxItems`, `reorderable`, `tableQuery`, `columnPicker` |
| `'reference-picker'`  | Record search typeahead                 | `string` (or `{record: string[]}` with `multi`; adds `columns` with `columnPicker`) | `String` (or `Object` with `multi`/`columnPicker`) | `table` (required), `items`, `multi`, `maxItems`, `reorderable`, `recordQuery`, `columnPicker`, `sideLabelField`, `subLabelFields` |
| `'table-reference'`   | Two stacked typeaheads                  | `{table, record}` (`record` is `string[]` with `recordMulti`; adds `columns` with `columnPicker`) | `String` [^1] (`Object` with `columnPicker`) | `recordMulti`, `maxItems`, `reorderable`, `tableQuery`, `recordQuery`, `columnPicker`, `sideLabelField`, `subLabelFields` |
| `'role-picker'`       | Role search typeahead                   | `string[]`                          | `String` [^1]       | `items`, `maxItems`, `reorderable`, `recordQuery`             |
| `'datetime'`          | Date + time picker (calendar + time)    | `string` (`YYYY-MM-DD HH:mm:ss`)    | `String`            | `hideTime` (date-only when `true`)                            |
| `'color'`             | Color swatch picker                     | `string` (CSS custom property name) | `String`            | `choices`                                                     |
| `'condition-builder'` | Filter condition builder                | `string` or `{table, encodedQuery}` | `String` [^1]       | `tableName`                                                   |
| `'custom'`            | Author-supplied Lit component           | any JSON-serializable value         | `String` [^1]       | `component` (required), `parse`, `props`                      |

The `input_schema` column applies to `@configProperty` only (bare `@config` is not an input and is omitted from `input_schema`). It reports the data type the property's Lit attribute converter actually produces, mirroring `_litTypeFromConfigType`.

[^1]: The declared value shape is richer than `String`, but `_litTypeFromConfigType` maps these types to the `String` converter, so `input_schema` reports `String` and the dashboard props pane will not JSON-coerce the value. Mirroring the runtime is deliberate — reporting the value shape instead would contradict the converter Lit installed. Fixing the converter would change attribute deserialization for shipped widgets, so it is tracked separately.

## Base Schema — `@configProperty(opts)`

Every `@configProperty` call accepts this base shape. Type-specific options are layered on top depending on the `type` value.

`type` and `label` are both required, and the options object must be written inline at the decorator — the SDK build reads it statically and fails on a `@configProperty` that omits either option, passes no object, or builds one by reference or spread. Wrapping the label in `i18n.getMessage()` still counts as declaring it. (Bare `@config` is not validated; it predates this rule.)

```js
import {configProperty} from '@servicenow/aiux-components-core';
import {i18n} from '@servicenow/aiux-services';

@configProperty({
  // ── Required ──────────────────────────────────────────────────────────

  // Determines which editor field is rendered.
  // Can be a JS constructor (String, Number, Boolean, Array)
  // or a string identifier (see "String Type Identifiers" below).
  type: String, // or Number, Boolean, Array, 'textarea', 'url', etc.

  // Human-readable label shown next to the field in the props pane.
  // Always wrap in i18n.getMessage() from @servicenow/aiux-services for translation.
  label: i18n.getMessage('My Property'),

  // ── Optional ──────────────────────────────────────────────────────────

  // Help text shown via an ⓘ tooltip icon next to the label.
  // Always wrap in i18n.getMessage() from @servicenow/aiux-services for translation.
  description: i18n.getMessage('Explains what this property controls'),

  // Conditional visibility — show only when another field meets a condition.
  // See config-depends-on.md for exists/equals/one-of modes and auto-clear.
  dependsOn: {key: 'otherField', value: 'someValue'},

  // Assign to a collapsible accordion group.
  // See config-groups.md for configGroups setup and fallback behavior.
  group: 'myGroupId',

  // Flags this field's admin-entered value as text i18n plugins should
  // translate. Only meaningful on string-valued config types.
  translatable: true,

  // ── Optional Lit property options ─────────────────────────────────────
  // These four are forwarded to Lit's @property() instead of the schema.
  // `type` is NOT one of them — Lit's converter is derived from the config
  // `type` above. Pass `converter` when you need different parsing.
  attribute: 'my-field', // rename or (false) disable the observed attribute
  reflect: false, // write the property back out to the attribute
  converter: undefined, // custom attribute ⇄ property conversion
  hasChanged: undefined // custom dirty check
})
// The runtime default lives here — there is no `default` option.
myField = 'initial value';
```

### Localization

> **Default behavior:** When creating new `@configProperty` decorators, **always wrap user-facing strings in `i18n.getMessage()` from `@servicenow/aiux-services`** (see [Localizable fields](#localizable-fields) for the full list). When editing existing decorators with bare strings, suggest adding `i18n.getMessage()` wrapping.

The props pane renders all user-facing strings from the config schema as-is — it does **not** translate them. Widget authors must wrap these strings in `i18n.getMessage()` at the `@configProperty` call site:

```js
import {configProperty} from '@servicenow/aiux-components-core';
import {i18n} from '@servicenow/aiux-services';

@configProperty({
  label: i18n.getMessage('Category'),
  description: i18n.getMessage('Choose a product category'),
  type: String,
  choices: [
    {value: 'shirt', label: i18n.getMessage('Shirt')},
    {value: 'pants', label: i18n.getMessage('Pants')}
  ]
})
category = 'shirt';
```

This works because `i18n.getMessage()` resolves against the active locale when the module loads. The translated values are what get stored in `configSchema` and flow through unchanged to the props pane.

#### Localizable fields

The following `@configProperty` option fields are user-facing and should be wrapped in `i18n.getMessage()`:

| Field                  | Where it appears                                             | Always wrap?                 |
| ---------------------- | ------------------------------------------------------------ | ---------------------------- |
| `label`                | Field label next to the input in the props pane              | Yes                          |
| `description`          | Tooltip text via the ⓘ icon                                  | Yes                          |
| `placeholder`          | Placeholder text inside text/textarea inputs                 | Yes                          |
| `choices[].label`      | Display label for each option in select/multi-select fields  | Yes                          |
| `choices[].group`      | Group heading in the color swatch picker popover             | Yes                          |
| `configGroups[].label` | Group accordion heading in the props pane                    | Yes                          |
| `default`\*            | Pre-filled value in the config editor; also runtime fallback | If human-readable (see note) |
| `items[].label`        | Display label in picker typeahead dropdowns (when hardcoded) | If human-readable (see note) |

\* `@config` only — `@configProperty` has no `default` option (use a field initializer instead).

Fields that are **not** localized (do not wrap): `type`, `min`, `max`, `step`, `pattern`, `group` (the id string on `@configProperty`), `dependsOn`, `translatable`, `choices[].value`, and the four Lit options (`attribute`, `reflect`, `converter`, `hasChanged`). The field initializer is ordinary code — wrap it in `i18n.getMessage()` when it is user-facing text (`title = i18n.getMessage('Open incidents');`).

> **`default` note (`@config` only):** Wrap in `i18n.getMessage()` when the value is a user-facing string (e.g. `default: i18n.getMessage('Review task')`). Non-string defaults (`Boolean`, `Number`, objects) and identifier strings don't need wrapping.

> **`items[].label` note:** Picker types (`table-picker`, `reference-picker`, `role-picker`) fetch labels from the server (GQL) at runtime — those labels are already localized by the platform. When you provide a hardcoded `items` array, the GQL fetch is skipped entirely and **only** the provided items are rendered in the dropdown (typing filters client-side). Wrap each `label` in `i18n.getMessage()` when the text is human-readable (e.g. `i18n.getMessage('Incident')`). Labels that are identifiers or codes (e.g. `'INC0010001'`) don't need translation.

> **Beyond `@configProperty`:** The same localization rule applies to `@externalConfig` labels (see `config-external.md`) and `provideConfigDeepLinking()` return values (see `config-modes.md`) — both surface user-facing text and should use `i18n.getMessage()`.

#### Editing existing decorators

When editing a widget that already has `@configProperty` decorators with bare string values for any localizable field (no `i18n.getMessage()` wrapping), suggest to the user that the untranslated fields should be wrapped in `i18n.getMessage()`. Example:

```js
// Before — bare strings, not translatable
@configProperty({type: String, label: 'Category', description: 'Choose a category'})
category = 'Shirt';

// After — wrapped in i18n.getMessage(), translatable
import {i18n} from '@servicenow/aiux-services';

@configProperty({type: String, label: i18n.getMessage('Category'), description: i18n.getMessage('Choose a category')})
category = i18n.getMessage('Shirt');
```

## Shared Option Shapes

Three option shapes appear across multiple types. The Quick Reference table names these options; this section documents their structure.

### `choices` — String (select mode) / `'select-multi'` / `'color'`

Adding `choices` to `type: String` converts the text input into a select dropdown. Required for `'select-multi'`. Optional for `'color'` (overrides the default platform palette).

| Property | Type     | Required | Notes |
| -------- | -------- | -------- | ----- |
| `value`  | `string` | Yes      | Stored value. For `'color'`: a CSS custom property name (e.g. `'--now-color--primary-1'`). |
| `label`  | `string` | No       | Display text (falls back to `value`). Wrap in `i18n.getMessage()`. |
| `group`  | `string` | No       | `'color'` only — section heading in the swatch popover. Wrap in `i18n.getMessage()`. |

### `items` — `'table-picker'` / `'reference-picker'` / `'role-picker'`

Hardcoded dropdown entries that bypass the default GQL fetch. When provided, **only** these items render (typing filters client-side). When omitted, items are fetched from GQL (already localized by the platform).

| Property | Type     | Required | Notes |
| -------- | -------- | -------- | ----- |
| `id`     | `string` | Yes      | Identifier (table name, sys_id, or role id). |
| `label`  | `string` | Yes      | Display text. Wrap in `i18n.getMessage()` when human-readable. |

> Not supported for `'table-reference'` — both searches are GQL-driven only.

### `multi` / `maxItems` / `reorderable` — `'table-picker'` / `'reference-picker'`

Enables multi-select mode for table and reference pickers. When `multi: true`, the field renders a pill-based multi-select typeahead instead of a single-select combobox. The stored value changes from `string` to an object with a `table` or `record` array.

| Property      | Type      | Required | Notes |
| ------------- | --------- | -------- | ----- |
| `multi`       | `boolean` | No       | When `true`, enables multi-select. Value becomes `{table: string[]}` for table-picker or `{record: string[]}` for reference-picker. |
| `maxItems`    | `number`  | No       | Maximum number of selections (0 = unlimited). Only valid with `multi: true`. Unselected items are disabled in the dropdown when the limit is reached. |
| `reorderable` | `boolean` | No       | When `true`, selected pills can be reordered by dragging them or with Ctrl+ArrowLeft/Right while a pill is focused. Reorders are announced to screen readers via an aria-live region. Only valid with `multi: true`. |

```js
@configProperty({
  type: 'table-picker',
  multi: true,
  maxItems: 5,
  reorderable: true,
  label: i18n.getMessage('Allowed tables')
})
allowedTables = {table: []};

@configProperty({
  type: 'reference-picker',
  multi: true,
  maxItems: 3,
  table: 'incident',
  label: i18n.getMessage('Related incidents')
})
relatedIncidents = {record: []};
```

> For `'table-reference'` use `recordMulti: true` instead of `multi` — the table side stays single while the record side becomes a pill multi-select. The value shape is always `{table: string, record: string | string[]}`; with `recordMulti`, `record` is a `string[]` of sys_ids. `maxItems` and `reorderable` apply to the record side.

### `columnPicker` — `'table-picker'` / `'reference-picker'` / `'table-reference'`

Adds a column-selection UI below the table/record picker(s), letting the admin pick which columns of the resolved table the widget should use — including dot-walked reference fields (e.g. `'assigned_to.name'`). Not supported on `'role-picker'`; combining the two logs a warning and the option is ignored.

| Property       | Type      | Required | Notes |
| -------------- | --------- | -------- | ----- |
| `columnPicker` | `boolean` | No       | When `true`, the value gains a `columns` key: `{[table]: string[]}`, one entry per table currently driving the picker (the picked table(s) for `'table-picker'`, the field's fixed `table` for `'reference-picker'`, the picked table for `'table-reference'`). An absent or empty `columns[table]` means **all columns**, not none. |

```js
@configProperty({
  type: 'table-picker',
  columnPicker: true,
  label: i18n.getMessage('Source table')
})
sourceTable = '';
// → {table: 'incident', columns: {incident: ['number', 'assigned_to.name']}}
```

Switching the driving table drops that table's stored columns from `columns` (they're kept in a session-only stash so re-picking the same table within the same pane session restores them, but nothing is persisted). With `multi`/`recordMulti`, each currently-selected table gets its own column section, stacked.

### `sideLabelField` / `subLabelFields` — Secondary data in the picker dropdown

Adds supporting data to each option in a `'reference-picker'`/`'table-reference'` (record side) dropdown, in addition to the primary display value — so whoever is picking a record has enough context to choose the right one. Display-only: neither option changes the dispatched value shape, and a field the current user can't read (or that's empty) is dropped rather than rendered as null/empty — Glide's GraphQL resolver already enforces field-level read access server-side.

| Property         | Type       | Required | Notes |
| ----------------- | ---------- | -------- | ----- |
| `sideLabelField`  | `string`   | No       | One field, rendered as a badge next to the primary label (e.g. `'state'`). |
| `subLabelFields`  | `string[]` | No       | One or more fields, joined with `" · "` and wrapped to 2 lines (e.g. `['category', 'assigned_to']`). |

```js
@configProperty({
  type: 'reference-picker',
  table: 'incident',
  sideLabelField: 'state',
  subLabelFields: ['category', 'assigned_to'],
  label: i18n.getMessage('Related incident')
})
incident = '';
```

Omitting both preserves the picker's default behavior exactly — only the primary label is shown.

### `tableQuery` / `recordQuery` — Server-side filters

Limits which items are fetched from GQL by prepending a ServiceNow encoded query condition to every API call for that field. The filter is applied server-side before results reach the dropdown.

| Property      | Type     | Applies to                              | Notes |
| ------------- | -------- | --------------------------------------- | ----- |
| `tableQuery`  | `string` | `'table-picker'`, `'table-reference'` (table side) | Encoded query filter for the `sys_db_object` fetch (e.g. `'nameSTARTSWITHcmdb'`). |
| `recordQuery` | `string` | `'reference-picker'`, `'table-reference'` (record side), `'role-picker'` | Encoded query filter for the record/role fetch (e.g. `'active=true'`). For `'role-picker'`, defaults to `'active=true'` when omitted. |

```js
@configProperty({
  type: 'reference-picker',
  table: 'incident',
  recordQuery: 'active=true',
  label: i18n.getMessage('Active incidents')
})
incident;

@configProperty({
  type: 'table-reference',
  recordMulti: true,
  tableQuery: 'nameSTARTSWITHcmdb',
  recordQuery: 'active=true',
  label: i18n.getMessage('CMDB records')
})
cmdbRecords;
```

> **Label resolution is exempt.** Saved values always resolve their display label via an exact-match query regardless of the filter — a sys_id that no longer matches the filter still shows its human-readable label in the pill or input.

### `list` — `Array` (Record List)

Configures the record-list editor source. This is the **inline `@configProperty`** variant — for the class-level `@externalConfig` decorator, see `config-external.md`.

| Property  | Type     | Required | Notes |
| --------- | -------- | -------- | ----- |
| `table`   | `string` | Yes      | ServiceNow table name. |
| `query`   | `string` | No       | Encoded query filter (e.g. `'active=true'`). |
| `view`    | `string` | No       | List view name. |
| `columns` | `string` | No       | Comma-separated column names to display. |

## Type-Specific Notes

Most types only need the base schema + the Quick Reference table. The notes below cover non-obvious behaviors.

- **String / URL:** Same optional attributes (`maxlength: number`, `minlength: number`, `pattern: string`, `placeholder: string`). `placeholder` on URL overrides the default `https://example.com` hint.
- **Textarea:** Same text options as String except `pattern` is **not** supported (HTML spec limitation). `rows: number` sets visible lines (defaults to 3).
- **Boolean:** No extra options.
- **Datetime:** Pass `hideTime: true` for a **date-only** field — stores `YYYY-MM-DD` instead of `YYYY-MM-DD HH:mm:ss` and commits on day-click.
- **Select:** `type: String` + `choices` converts the text input to a select dropdown.
- **Multi-Select:** `type: 'select-multi'` + `choices` (required). Same `choices` shape as Select. Stored value is `string[]`.
- **Reference Picker:** `table: string` (required) — the ServiceNow table to search. Value is a sys_id. With `multi: true`, value becomes `{record: string[]}` of sys_ids; optional `maxItems` caps selections. Optional `recordQuery` filters the GQL fetch (e.g. `'active=true'`).
- **Table Picker (multi):** With `multi: true`, value becomes `{table: string[]}` of table names; optional `maxItems` caps selections. Optional `tableQuery` filters the table GQL fetch.
- **Table + Reference:** Two stacked typeaheads (table → record). Value is `{table, record}` — with `recordMulti: true` the record side becomes a pill multi-select and `record` is a `string[]`; `maxItems` and `reorderable` apply to the record side. `items` and `multi` are not supported. Optional `tableQuery` filters the table side, `recordQuery` filters the record side.
- **Role Picker:** GQL-backed multi-select. Value is `string[]` of role identifiers. Optional `maxItems` caps selections; `reorderable: true` lets users drag pills (or Ctrl+Arrow keys) to reorder. Optional `recordQuery` filters the role GQL fetch. Defaults to `'active=true'` when omitted — callers can override (e.g. `recordQuery: 'active=false'`) without contradiction.
- **Condition Builder:** `tableName: string` (optional). With `tableName` → value is an encoded query string (e.g. `'active=true^category=hardware'`). Without `tableName` → user picks the table in the dialog, value is `{table, encodedQuery}`. Can also pair a `table-picker` field via `dependsOn` (see `config-depends-on.md`).
- **Color Picker:** Uses `choices` shape (see [Shared Option Shapes](#choices)) — `value` is a CSS custom property name, `group` creates section headings in the swatch popover. When `choices` is omitted, the default platform palette renders. Swatches without a `group` render in a flat grid. Unresolved tokens render transparent.

## Custom Component — `type: 'custom'`

Renders an author-supplied Lit component in place of a built-in editor. Use this when the value doesn't fit any built-in type — typically a **composite value** (several related sub-fields edited together, e.g. a label + icon + color) or an editing experience that needs bespoke UI.

```js
@configProperty({
  // ── Required ──────────────────────────────────────────────────────────
  type: 'custom',

  // Tag name of a custom element already registered via customElements.define
  // (or @customElement(...)) by the time the props pane renders.
  // This is a STRING tag name, never a component class reference.
  component: 'my-custom-field',

  // ── Optional ──────────────────────────────────────────────────────────

  // Transform the raw config value before passing it to the component.
  // Receives the current value and must return the transformed value.
  // Common use: merge defaults into a partial object so the component
  // always sees a complete shape.
  // If parse throws, the raw value is passed unchanged and an error is logged.
  parse: (value) => ({label: '', icon: 'tag', color: 'red', ...value}),

  // Static props spread onto the component element — fixed at declaration
  // time, never updated at runtime. For anything live, read `.allConfig`
  // (below). Must be a plain object. Reserved keys (configEntryId,
  // configKey, configValue, configPath, allConfig) are stripped with a
  // warning — the framework sets them.
  props: {theme: 'dark', maxItems: 5}
})
// The runtime default lives here — any JSON-serializable value, commonly an
// object for composite fields. Distinct from `parse`, which shapes what the
// PROPS PANE hands the editor component; the initializer is what the ELEMENT
// renders before any admin edit.
myField = {label: '', icon: 'tag', color: 'red'};
```

#### Custom component contract

The target component must follow this contract:

1. Accept five properties from the props pane:
   - `.configEntryId` — the config entry ID (string, e.g. `'my-widget'` or `'parent.child'` for nested widgets)
   - `.configKey` — the `@configProperty` property key (string, e.g. `'myField'`)
   - `.configValue` — the current value (after `parse` if provided)
   - `.configPath` — a globally unique path: `{experience}/{page}/{topLevelTag}/{entryId}`. Use this to associate external data with a specific config entry across experiences and pages.
   - `.allConfig` — a **live** `{propKey: value}` map of every config value on the same widget instance; the pane pushes a fresh map on any field edit. Declare it reactive to re-render. See [`allConfig` — live sibling values](#allconfig--live-sibling-values).

   Any additional properties declared in `props` are spread onto the element alongside these five.

2. On any change, call `dispatchConfigFieldValueChange` from `@servicenow/aiux-components-core` — the exact same event every built-in field dispatches, there is no separate "custom" event:

   ```js
   import {dispatchConfigFieldValueChange} from '@servicenow/aiux-components-core';

   dispatchConfigFieldValueChange(this, {
     entryId: this.configEntryId,
     key: this.configKey,
     value: /* new value */
   });
   ```

   Prefer this helper over constructing the `CustomEvent` by hand — it's the same event name and detail shape, but you don't have to remember either, and it stays correct if the contract ever changes. It lives in `aiux-components-core` (not the props-pane package) specifically so using it never requires a new dependency — every `@configProperty`-using widget already depends on core for `AIUXElement`. If you need the raw event name (e.g. for a listener), import `CONFIG_FIELD_VALUE_CHANGE_EVENT` from the same package.

3. For composite values, merge onto the previous value rather than replacing it (`{...this.configValue, ...patch}`), so a partial edit doesn't drop sibling sub-fields.

Everything downstream — pending-edit tracking, live preview, Save/PATCH to `sys_aix_configuration` — is generic by key and requires no framework changes; a custom field is indistinguishable from a built-in one once it dispatches the event correctly.

The component's own module must be imported somewhere the widget's bundle reaches (e.g. near the top of the widget file) so the custom element is registered before the props pane tries to render it. The tag name is validated against a hyphen-requiring custom-element-name pattern before rendering — an invalid or unregistered `component` renders nothing and logs a warning rather than throwing.

`dependsOn` on a `'custom'` field only works correctly in "exists" mode (no `value` key) if the field's value is an object — the equals/one-of forms compare with `===`/`.includes()`, which never matches an object literal. A custom field can also be the _parent_ of a `dependsOn` relationship (other fields can depend on its key) same as any built-in field.

#### Minimal component

```js
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {
  AIUXElement,
  dispatchConfigFieldValueChange
} from '@servicenow/aiux-components-core';

@customElement('my-custom-field')
export default class MyCustomField extends AIUXElement {
  @property({attribute: false}) configEntryId = null;
  @property({attribute: false}) configKey = null;
  @property({attribute: false}) configValue = null;
  @property({attribute: false}) configPath = null;
  @property({attribute: false}) allConfig = {}; // live sibling values — must be reactive to update

  _handleInput(e) {
    if (!this.configEntryId || !this.configKey) return;
    dispatchConfigFieldValueChange(this, {
      entryId: this.configEntryId,
      key: this.configKey,
      value: e.target.value
    });
  }

  render() {
    return html`<input
      .value=${this.configValue ?? ''}
      @input=${this._handleInput}
    />`;
  }
}
```

**`parse` option:**

The `parse` function transforms the raw config value before it reaches the component. This is useful for:

- Merging defaults into a partial saved object so the component always sees a complete shape
- Normalizing legacy data formats
- Any pre-processing the component shouldn't be responsible for

```js
@configProperty({
  type: 'custom',
  component: 'my-tag-editor',
  parse: (value) => ({
    label: '', icon: 'tag', color: 'red',
    advanced: {visibility: 'public', expiresOn: ''},
    ...value
  })
})
tagProp = {label: '', icon: 'tag', color: 'red'};
```

If `parse` throws at runtime, the raw value is passed unchanged and an error is logged — the props pane continues to render.

**`props` option:**

Static properties to spread onto the custom component element. Useful for passing configuration that isn't the config value itself — themes, limits, feature flags, etc.

```js
@configProperty({
  type: 'custom',
  component: 'my-rich-editor',
  props: {theme: 'dark', maxItems: 10, showPreview: true}
})
editorProp = {};
```

**`props` values are forever static** — declaration-time schema metadata, spread unchanged on every render. For anything that can change at runtime, declare another `@configProperty` and read it from `.allConfig` instead. Reserved keys `configEntryId`, `configKey`, `configValue`, `configPath`, `allConfig` are stripped with a warning (`props` is spread *after* the framework bindings, so a collision would overwrite them). Non-object values are ignored with a warning.

**`allConfig` — live sibling values:**

The dynamic counterpart to `props`: a `{propKey: value}` map of every config field on the **same widget instance** (not other widgets on the page). The pane pushes a fresh map on any field edit — no subscription or wiring on your side.

```js
@property({attribute: false}) allConfig = {};

render() {
  const showAdvanced = Boolean(this.allConfig.showAdvanced); // sibling Boolean field
  // …re-renders automatically when the admin toggles it
}
```

- **Must be reactive** (`@property({attribute: false})`) — the map is assigned regardless, but only a reactive property re-renders on sibling changes.
- **Stable shape** — built from the full schema, so locked and `dependsOn`-hidden fields are always present; keys never appear or vanish with visibility.
- **Value resolution matches the visible row** — pending edit → saved value → declared default → live element value; unset scalars read `''`, unset `Array`/`Object` read `null`.
- **Read your own value from `.configValue`, not `allConfig[configKey]`** — own edits are debounced (~300ms), so your key lags; sibling keys land immediately.

#### Floating content for custom components

The props pane renders custom fields inside a scrollable container (`overflow-y: auto`). This means any floating content using `position: absolute` will be **clipped** at the scroll boundary — dropdowns, autocomplete panels, date pickers, etc. will be cut off if they extend beyond the visible scroll area.

To avoid clipping, use one of these approaches (in order of preference):

1. **Modal dialog** — open an `<aiux-modal>` or `<dialog>` from a button inside the field. The modal renders in the top layer, completely outside the scroll container. Keep a local `@state()` draft and call `dispatchConfigFieldValueChange` only on confirm. This is the recommended approach for complex editing surfaces.
2. **Popover API** — use `popover="manual"` with `showPopover()`/`hidePopover()`. Popovers render in the browser's top layer and escape all overflow clipping. Close the popover on scroll to avoid it becoming disjointed from its trigger.
3. **`position: fixed`** — positions relative to the viewport instead of the scroll container. Close on scroll to avoid disjoint. Note: `contain: layout` on any ancestor will trap `position: fixed` — the props pane does not set this on the custom field container.
4. **Native `<select>`** — the browser renders native select dropdowns at the OS compositor level, outside the DOM entirely. No clipping issues, but limited styling.

#### Gotchas

- **Tag not registered yet** or **`component` fails the tag-name pattern** → nothing renders, warning logged. Confirm the registering import actually executes before the props pane opens.
- **Replacing instead of merging** a composite value on partial edit silently drops sibling sub-fields — always `{...this.configValue, ...patch}`.
- **Dispatching on every keystroke** for an expensive composite field can feel jumpy in the live preview — batch locally and dispatch once (blur, or a modal's Save) if that's an issue.
- **`configEntryId`/`configKey` can be `null`** during initial render in some timing edge cases — guard with `if (!this.configEntryId || !this.configKey) return;` before dispatching.
- **`parse` errors are caught** — a throwing `parse` function won't crash the props pane; the raw value is used and an error is logged.
- **`props` reserved key conflicts** — if your `props` object contains `configEntryId`, `configKey`, `configValue`, `configPath`, or `allConfig`, those keys are silently stripped (with a warning logged) since the framework always sets them.
- **Expecting `props` to update dynamically** — schema `props` are fixed at declaration time. React to changing values via `.allConfig` (declared reactive — a plain field gets assigned but never re-renders).
- **Reading your own value from `allConfig[configKey]`** — own edits are debounced (~300ms), so that key lags; use `.configValue`.
- Richer editing surfaces (e.g. an `<aiux-modal>` opened from a button inside the field) are fully supported — only call `dispatchConfigFieldValueChange` on confirm, not per-keystroke inside the modal; keep a local draft `@state()` and merge it in on save.

## Migrating from `@config` to `@configProperty`

> **When you encounter `@config` in existing code, suggest migrating it to `@configProperty`.** The codebase is actively moving to `@configProperty` and `@config` should not be used for new code.

For each `@config` field, move the `default` value to a field initializer and drop the `default` option. `@config`'s `default` serves as both editor metadata and a runtime fallback in the getter, so the field initializer is the direct replacement:

```js
// With `default` — the getter returns it as a runtime fallback,
// so the value is never undefined.
@config({type: String, label: i18n.getMessage('Title'), default: i18n.getMessage('Open incidents')})
title;

// Without `default` — the getter returns undefined until an admin saves.
// Field initializers have no effect (@config's setter is a no-op),
// so you need a ?? fallback in render().
@config({type: String, label: i18n.getMessage('Subtitle')})
subtitle;

render() {
  const subtitle = this.subtitle ?? i18n.getMessage('Recent activity');
  return html`
    <h1>${this.title}</h1>
    <h2>${subtitle}</h2>
  `;
}
```

After migration, both cases look the same -- the field initializer handles the default:

```js
// After
@configProperty({type: String, label: i18n.getMessage('Title')})
title = i18n.getMessage('Open incidents');

@configProperty({type: Boolean, label: i18n.getMessage('Show footer')})
showFooter = true;

render() {
  // @configProperty's getter falls back to the field initializer,
  // so no ?? fallback is needed.
  return html`
    <h1>${this.title}</h1>
    ${this.showFooter ? html`<span>${i18n.getMessage('Updated just now')}</span>` : nothing}
  `;
}
```

