# aiux-control-template-value

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-template-value.md`

A form control for building a template value from a set of fields on a referring record's table. Host sets `referringTable` (or a dependent-field/value pair for variable templates), `referringRecordId`, and `value` (the encoded template string); the control fetches the available fields for that table over GraphQL, lets the user add, swap, and remove field rows and edit each field's value using the field-type-appropriate control, then serializes the selected fields and their values back into a single encoded `value`.

**Value ownership.** The control tracks the last value it itself dispatched (`_lastSyncedValue`) and only re-fetches field data when an incoming `value` diverges from that — so writing `detail.value` straight back as `.value` on every `VALUE_CHANGED` (the normal round-trip) is cheap and does not re-trigger a GraphQL fetch. But if the host instead holds its own independently-derived copy of the template string and it drifts even slightly from what the control last emitted (different escaping, row order, or a stale snapshot), rebinding it forces a full refetch and rebuild of every row from the parsed string, discarding in-progress row state such as an open-but-unselected new-row picker.

Built in: field-fetch-and-cache via GraphQL, the field-selector dropdown (with search), per-row operator handling (`=`, `SAMEAS`, `DYNAMIC`, custom ops), template-value string parsing/serialization (`field=value^field2=value2^EQ`), original-value baseline sync, and journal-field/system-field/dot-walk exclusion rules. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html, isServer} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class MyTemplateValueHost extends AIUXElement {
  static properties = {
    templateValue: {type: String}
  };

  constructor() {
    super();
    this.templateValue = '';
  }

  render() {
    if (isServer) return html``;
    return html`
      <aiux-control-template-value
        name="template_value"
        label="Template Value"
        .referringTable=${'incident'}
        .referringRecordId=${'552c48888c033300964f4932b03eb092'}
        .value=${this.templateValue}
        @AIUX_CONTROL_TEMPLATE_VALUE#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-template-value>
    `;
  }

  _onValueChanged(e) {
    this.templateValue = e.detail.value;
  }
}

customElements.define('my-template-value-host', MyTemplateValueHost);
```

**What happens:** on mount (client only — `firstUpdated` guards with `isServer`), the control fetches the field definitions for `incident` over GraphQL and parses any preset `value` into rows, each paired with its field's metadata (label, type) so the right inner editor renders. The user picks a field from the dropdown, which immediately commits a new row with an empty value and re-serializes — so a freshly added row shows up in the host's `value` (e.g. `category=^EQ`) before the user has typed anything into it. Editing that row's value with the field-type-appropriate inner control (text input, choice list, boolean toggle, etc.) re-serializes all rows again on every edit, not just on blur, since each inner control's own commit event drives `_commitValue()` directly. Removing a row or swapping its field triggers the same re-serialize-and-dispatch cycle immediately.

### Additional patterns

Variable templates driven by a dependent field instead of a fixed table (`referringTable` left empty):

```js
html`
  <aiux-control-template-value
    name="variable_template"
    label="Variable Template"
    .dependentField=${'table'}
    .dependentValue=${'incident'}
    .value=${this.templateValue}
  ></aiux-control-template-value>
`;
```

Showing the per-row operator dropdown (`=` / `SAMEAS`, or a custom list from `operations`):

```js
html`
  <aiux-control-template-value
    name="template_value"
    label="Template Value"
    .referringTable=${'incident'}
    ?showops=${true}
    operations="DYNAMIC:From email;=:To"
    .value=${this.templateValue}
  ></aiux-control-template-value>
`;
```

Letting a row reference another same-typed field instead of a literal value, via the `SAMEAS` operator (`showops` + `operations` must both be set — `operations` alone has no visible effect):

```js
html`
  <aiux-control-template-value
    name="template_value"
    label="Template Value"
    .referringTable=${'incident'}
    ?showops=${true}
    operations="=:To;SAMEAS:Same as"
    .value=${'description=^EQ'}
  ></aiux-control-template-value>
`;
```

When the user sets that row's operator to `SAMEAS`, its value editor swaps from the field's normal control to a `<select>` listing every other field on the table that shares `description`'s type; picking one serializes as `descriptionSAMEASshort_description`, not as a literal string.

Reverting edited rows to a pre-edit baseline by rebinding `originalValue`:

```js
html`
  <aiux-control-template-value
    name="template_value"
    label="Template Value"
    .referringTable=${'incident'}
    .value=${'category=software^priority=2^EQ'}
    .originalValue=${'category=hardware^priority=3^EQ'}
  ></aiux-control-template-value>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| value | value (reflect) | String | `''` | Encoded template string (`field=value^field2=value2^EQ`); recomputed and dispatched whenever a row is added, edited, removed, or the field data resets. | The current serialized template value. |
| referringTable | referringtable | String | `''` | Changing it resets all rows and refetches field data. | Table whose fields populate the picker. Leave empty when using `dependentField`/`dependentValue` instead. |
| referringRecordId | referringrecordid | String | `''` | Forwarded on every fetch as `recordSysId`. | Sys ID of the host record, used to scope field metadata/reference qualifiers. |
| dependentField | dependentfield | String | `''` | Merged into the fetch's `serializedChanges` payload. | Name of the field the table is dependent on (variable templates). |
| dependentValue | dependentvalue | String | `''` | Changing it resets all rows and refetches field data. | Current value of `dependentField`; drives which table's fields are fetched for variable templates. |
| originalValue | originalvalue | String | `''` | On change, re-syncs each existing row's baseline (`originalValue`/`originalFieldName`) without altering its current edited value. | Pre-edit baseline template string used to detect per-row overrides. |
| serializedChanges | serializedchanges | String | `'[]'` | Changing it triggers a refetch. | JSON array of unsaved record field changes (`{name, value}`), merged into the fetch's dependent-context payload. |
| ignoreReferenceQualifier | ignorereferencequalifier | Boolean | `false` | Forwarded to `buildFormField` for reference-type rows. | Skips applying the field's reference qualifier when building a reference row's inner control. |
| showOps | showops | Boolean | `false` | Toggling it (with metadata already loaded) recomputes available choices and the operator dropdown. | Shows the per-row operator column. Mirrors Glide's `show_ops` dictionary attribute. |
| allowJournal | allowjournal | Boolean | `false` | Toggling it (with metadata already loaded) recomputes available choices. | Unlocks `journal`/`journal_input` fields in the picker. `journal_list` stays excluded regardless. Mirrors Glide's `allow_journal`. |
| operations | operations | String | `''` | Read by the `_operatorChoices`/`_operatorTokens` getters on every render. | Semicolon-separated `op:label` pairs (e.g. `DYNAMIC:From email;=:To`) defining the operator dropdown when `showOps` is true. Mirrors Glide's `operations`. |
| exclusiveDynamics | exclusivedynamics | Boolean | `false` | Read by the `_operatorChoices` getter. | When `showOps` is true and `operations` is empty, appends `DYNAMIC` ("To (Dynamic)") to the default `[=, SAMEAS]` operator set. Mirrors Glide's `exclusive_dynamics`. |
| extendedChoices | extendedchoices | Boolean | `false` | Forwarded on every fetch as `includeExtendedChoices`. | Mirrors Glide's `extended_choices` dictionary attribute; only honored server-side when the corresponding schema capability is present. |
| label | label | String | `''` | — | Field label text. |
| helperContent | helper-content | String | `''` | — | Hint text shown next to the label. |
| messages | messages (property) | Array | `[]` | — | Validation/status messages rendered below the control. |
| fieldLayout | fieldLayout (property only) | Object | `{layout: 'auto'}` | — | Layout mode/columns. |
| variant | variant (reflect) | String | `'default'` | — | Visual density (`'default'` \| `'compact'`). |
| disabled | disabled (reflect) | Boolean | `false` | — | Disables the control. |
| readonly | readonly (reflect) | Boolean | `false` | — | Hides add/remove/edit affordances; renders each row as read-only text. |
| required | required (reflect) | Boolean | `false` | — | Marks the field required. |
| invalid | invalid (reflect) | Boolean | `false` | — | Error/invalid visual state. |
| name | name | String | `''` | Included as `name` in every dispatched event's `detail`. | Field name identifier, also sent as `fieldName` on every GraphQL fetch. |

None of `referringTable`, `referringRecordId`, `dependentField`, `dependentValue`, `originalValue`, `serializedChanges`, `ignoreReferenceQualifier`, `showOps`, `allowJournal`, `exclusiveDynamics`, or `extendedChoices` declare an explicit `attribute:` option, so per Lit's default their HTML attribute is the property name lowercased as a single word (e.g. `referringTable` → `referringtable`, not `referring-table`) — bind them as JS properties (`.referringTable=`, etc.) in Lit templates to avoid relying on that casing.

`operations` and `exclusiveDynamics` are silently inert unless `showOps` is also `true`: setting either without `showOps` builds the operator choice list internally but never renders the dropdown, so every row still serializes with `=` regardless of what you configured. Likewise `allowJournal` only unlocks `journal`/`journal_input` in the picker — `journal_list` fields (e.g. `work_notes`, `comments`'s list-backed siblings) are excluded from the picker unconditionally, with no property to override that.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TEMPLATE_VALUE#VALUE_CHANGED` | `{name: string, value: string, displayValue: string}` | Bubbles, composed, cancelable | Fires on: a field picked from the dropdown for a new or swapped row (fires immediately, before the row's value is edited); a row's inner value editor committing an edit; a row's operator dropdown changing; a row being removed; and `referringTable`/`dependentValue` changing to a table that fetches no fields or errors — but only if the control previously had rows or a non-empty `value` (an already-empty control resetting again does not fire). | `value` and `displayValue` are always identical — the fully re-serialized encoded string, never a partial/row-level diff. A reset-triggered fire reports `value: '', displayValue: ''`. |

`AIUX_CONTROL_TEMPLATE_VALUE#STAGED_VALUE_CHANGED` is exported from `ActionTypes` and wired up as a listener target in this control's own Storybook stories, but the component never calls `dispatchAction` with it — no code path in the control's source dispatches this event. Not currently used.

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the first row's field-selector trigger button (`button.aiux-input`) in the shadow root, i.e. always the first rendered row regardless of which row is being edited. |

### Data shapes

`TemplateFieldRow` (one edited row, internal but useful for understanding `value`'s shape):

| Field | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | Selected field's name. |
| `fieldLabel` | `string` | Selected field's display label. |
| `path` | `string` | Serialization path (equals `fieldName` for top-level fields). |
| `type` | `FieldType` | Field's type, used to pick the inner editor. |
| `value` | `string` | Current row value. |
| `displayValue` | `string` | Current row display value. |
| `operator` | `string \| undefined` | Per-row operator token (`=`, `SAMEAS`, `DYNAMIC`, or a custom op); only populated when the operator dropdown is shown. |
| `isUnsupported` | `boolean \| undefined` | True when the field's type can't be edited by this control (password, attachment, dot-walk fields, `sys_`-prefixed fields, etc.). |

Encoded `value` string format: `field1=value1^field2{OP}value2^EQ` — fields joined by `^`, each pair either `field=value` (default `=` operator) or `field{OP}value` with no delimiter for a non-`=` operator, terminated by `^EQ`. A literal `^` inside a value is escaped as `^^`.

## Integration details

Requires a GraphQL backend exposing `GlideLayout_Query.templateValueFieldsQuery` (field metadata and existing values for the referring table) — this control fetches through the shared `graphQLClient` and does not work with `referringTable`/`dependentValue` unset and no data ever arriving (it renders its empty state instead).

### Platform requirements

Needs `referringRecordId` and either `referringTable` or a `dependentField`/`dependentValue` pair to resolve fields; without a resolvable table, the field picker never populates.

### SSR

Data fetching is skipped on the server (`isServer` guard around `firstUpdated`'s initial load); the control renders its loading/empty state safely without touching `window`/`document` during SSR.

### Lifecycle

Fetches on `firstUpdated` (client only) and re-fetches whenever `referringTable`, `dependentValue`, `serializedChanges`, or `value` (when it diverges from the last value this control itself produced) changes. In-flight requests are aborted via an internal `AbortController` on `disconnectedCallback` and superseded by a request-id check so a stale response never overwrites a newer one.

### Sizing and layout

Rendered through the same `fieldLayout` mixin as other form controls (`'auto'` resolves to horizontal ≥480px, vertical below it). Each row lays out as a grid of index / field selector / (optional) operator / value editor / remove button.

## Accessibility, localization, and customization

The field-rows container has `role="group"` with an `aria-label` (defaulting to the localized "Template value fields" when no `label` is set). The field-selector trigger is a `<button>` with `aria-haspopup="listbox"` and `aria-expanded`, and its dropdown panel supports keyboard navigation (arrow keys/Enter) via the shared dropdown controller; the search input inside the panel autofocuses on open. Every row's value editor and remove button carries a localized `aria-label` identifying its row number and field. All user-facing copy (button labels, aria-labels, the unsupported-type badge text, the load-failure fallback message) is wrapped in `msg()` and translates; `label`, `placeholder`-equivalents, and `helperContent` are host-settable. No custom CSS parts or slots are exposed; visual density is controlled by `variant`, and typography/box styling flows through the shared `controlStyles` property.
