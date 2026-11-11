# AIUXControlDocumentIdConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-document-id-connected.md`

A form-field control for ServiceNow's polymorphic "document ID" field type: a reference whose target table is not fixed, but comes from another field on the same form (the "dependent field", e.g. a `document` field paired with a `table_name` field). It wraps `<aiux-control-reference-connected>` for the inline reference input and adds a modal picker for choosing the table and the document together.

Built in: the effective-value/effective-display-value suppression while no dependent table is set, the lookup-button visibility rule, a two-step modal (table picker + document picker) that lets a user pick or change the target table and the record together, and the info message shown when no dependent table is selected yet. Do not build this table-then-record picker flow yourself.

**Value ownership.** This control never clears `value`/`displayValue` on your
behalf when the dependent table changes out from under it — it only
*suppresses the display* of a stale value while `dependentValue` is empty.
If your own `table_name` field changes to a different table (outside this
control's own modal, e.g. the user edits a sibling choice field directly) and
you do not also clear this field's `value`/`displayValue` in your handler,
the old sys_id for the previous table is still sitting in `value`; the moment
`dependentValue` is set again the control starts showing and submitting that
stale, now-mismatched-table reference again. The modal's own OK flow avoids
this because picking a different table there resets the local document
selection to empty before it can be committed — but that safety only applies
inside the modal, not to `dependentValue` changes driven by the rest of your
form.

Gotcha: the control's own internal reference query always passes
`sysparm_ignore_ref_qual: true` and `ignoreDepAsRefQual: true` to the server.
That means this field's own dictionary reference qualifier (if the
`document_id` column has one configured) is never applied, and the
dependent-table relationship itself is never layered on as an additional
qualifier — the dependent value is used purely to pick the target table, not
to filter rows within it. `ignoreReferenceQualifier`/`disableReferenceQualifier`-style
opt-outs you may know from `aiux-control-reference-connected` are therefore
redundant here; there is no qualifier to disable.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {isServer} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {html} from 'lit';
import '@servicenow/aiux-components-control';

class MyDocumentIdField extends AIUXElement {
  static properties = {
    tableChoice: {type: String},
    tableChoiceDisplay: {type: String},
    docId: {type: String},
    docIdDisplay: {type: String}
  };

  constructor() {
    super();
    this.tableChoice = '';
    this.tableChoiceDisplay = '';
    this.docId = '';
    this.docIdDisplay = '';
  }

  render() {
    if (isServer) return html``;
    return html`
      <aiux-control-document-id-connected
        name="document_id"
        label="Document"
        dependent-field="table_name"
        dependent-field-label="Table name"
        .dependentValue=${this.tableChoice}
        .dependentTableName=${this.tableChoiceDisplay}
        .value=${this.docId}
        .displayValue=${this.docIdDisplay}
        record-sys-id="a1b2c3d4"
        table-name="task"
        field-name="document_id"
        @AIUX_CONTROL_DOCUMENT_ID_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-document-id-connected>
    `;
  }

  _onValueChanged(e) {
    const {name, value, displayValue} = e.detail;
    if (name === 'table_name') {
      this.tableChoice = value;
      this.tableChoiceDisplay = displayValue;
    } else {
      this.docId = value;
      this.docIdDisplay = displayValue;
    }
  }
}
customElements.define('my-document-id-field', MyDocumentIdField);
```

**What happens:** until `dependentValue` (the dependent field's current value, i.e. the chosen table name) is set, the control shows an informational message and suppresses its own value/display-value — even if `value`/`displayValue` already hold a sys_id from before, nothing is shown or searchable until `dependentValue` is non-empty. Once a dependent table is set, the inline reference input searches that table directly; clicking the lookup (magnifying-glass) button seeds the modal's table and document pickers from the control's *current* `dependentValue`/`value` and opens it, also kicking off a cached fetch of the dependent field's `tableChoicesScript` dictionary attribute (used to restrict which tables the table picker offers). Changing the table inside the modal immediately clears the modal's in-progress document selection, so a document picked for the old table can never be committed against the new one. Clicking OK then fires `AIUX_CONTROL_DOCUMENT_ID_CONNECTED#VALUE_CHANGED` for the dependent field (`table_name` in this example) — but only if the table actually changed from what `dependentValue` was before the modal opened — immediately followed by the same event for this control's own field with the newly picked record. Clicking Cancel, the backdrop, or Escape discards all of the modal's local selections without dispatching anything.

### Additional patterns

Read-only rendering: set `readonly` to hide the lookup button, the only way to open the edit modal. The nested inline reference is unconditionally rendered with `readonly`/`readonlyClickthrough` set, whether or not this control's own `readonly` is set, so the displayed value is always click-through (opens the referenced record) rather than directly typeable.

Keeping the document in sync when the dependent table changes elsewhere on the form: because this control only suppresses display rather than clearing state (see **Value ownership** above), a host that lets the user change the dependent table through its own control (not through this control's modal) should clear this field's value in the same handler:

```js
_onTableNameChanged(e) {
  this.tableChoice = e.detail.value;
  this.tableChoiceDisplay = e.detail.displayValue;
  // The previously selected document almost certainly doesn't exist on
  // the new table — drop it so a stale sys_id isn't resubmitted.
  this.docId = '';
  this.docIdDisplay = '';
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | String | `''` | Re-renders | The document sys_id. Only used when `dependentValue` is set; otherwise the control reports an effective value of `''`. |
| `displayValue` | `display-value` | String | `''` | Re-renders | Display text for `value`. If it starts with `"${dependentTableName}:"`, that prefix is stripped before display. |
| `recordSysId` | `record-sys-id` | String | `''` | Re-renders | sys_id of the record that owns this field; forwarded to the reference query and the picker. |
| `tableName` | `table-name` | String | `''` | Re-renders | Table of the record that owns this field. |
| `fieldName` | `field-name` | String | `''` | Re-renders | Name of this field on `tableName`. |
| `dependentField` | `dependent-field` | String | `''` | Re-renders | Name of the sibling field that carries the target table choice. Required for the modal's table picker and for emitting the dependent-field `VALUE_CHANGED` event when the table changes. |
| `dependentValue` | `dependent-value` | String | `''` | Re-renders | Current value (table name) of the dependent field. Empty means "no table chosen yet" — this control then suppresses its own effective value/display value and shows an info message. |
| `dependentFieldLabel` | `dependent-field-label` | String | `''` | Re-renders | Label of the dependent field, used in the info message text ("Select a *label* before modifying this field."). |
| `dependentTableName` | `dependent-table-name` | String | `''` | Re-renders | Display name for the dependent table, used to strip the `"table:"` prefix from `displayValue`. |
| `sortBy` | `sort-by` | String | `''` | Re-renders | Forwarded to the inline reference control's sort. |
| `resultLimit` | `result-limit` | Number | `25` | Re-renders | Forwarded to the inline reference control's search result limit. |
| `showAllTables` | `show-all-tables` | Boolean | `false` | Re-renders | Forwarded to the modal's table-name picker, to allow choosing any table rather than a restricted list. |
| `name` | `name` | String | `''` | Re-renders | Field name, used as the `name` in dispatched event details. |
| `label` | `label` | String | `''` | Re-renders | Field label, rendered by this control's own label (not forwarded to the nested reference control). |
| `placeholder` | `placeholder` | String | `''` | Re-renders | Inherited from the base control identity; forwarded to nothing directly by this control (the nested reference control renders its own placeholder). |
| `autofocus` | `autofocus` | Boolean | `false` | Re-renders | Forwarded to the nested `aiux-control-reference-connected`. |
| `readonly` | `readonly` (reflect) | Boolean | `false` | Re-renders | Hides the lookup button, which is the only way to change the value in edit mode. The nested inline reference is always rendered read-only/click-through regardless of this property — it never accepts direct typing either way. |
| `disabled` | `disabled` (reflect) | Boolean | `false` | Re-renders | Forwarded to the nested reference control. |
| `required` | `required` (reflect) | Boolean | `false` | Re-renders | Forwarded to the nested reference control; drives the required-indicator on this control's own label. |
| `invalid` | `invalid` (reflect) | Boolean | `false` | Re-renders | Forwarded to the nested reference control and to this control's own label styling. |
| `nowId` | `now-id` | String | `''` | Re-renders | Opaque identifier, inherited from the base control identity. |
| `controlStyles` | `control-styles` | String | `''` | Re-renders | Raw CSS declarations applied to this control's elements, inherited from the base control identity. |
| `fieldLayout` | `fieldLayout` | Object | `{layout: 'auto'}` | Re-renders | Vertical/horizontal/auto label layout; also forwarded to the nested reference control. |
| `optional` | `optional` | Boolean | `false` | Re-renders | Shows an "Optional" label indicator instead of a required asterisk. |
| `helperContent` | `helper-content` | String | `''` | Re-renders | Text shown in a helper-info popover next to the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | Boolean | `false` | Re-renders | Suppresses the required asterisk on the label. |
| `wrapLabel` | `wrap-label` | Boolean | `false` | Re-renders | Wraps rather than truncates the label text (vertical layout only). |
| `messages` | `messages` (property) | `ControlMessage[]` | `[]` | Re-renders | Field-level messages rendered below the control; this control prepends its own info message (see **Data shapes**) when no dependent table is chosen. |
| `decorations` | `decorations` (property) | `Decoration[]` | `[]` | Re-renders | Inherited from the base control identity; rendered inline with the label. |
| `decorationWidgets` | `decorationWidgets` (property) | `DecorationWidget[]` | `[]` | Re-renders | Inherited from the base control identity; rendered in the addon column. |
| `highlightedValue` | `highlightedValue` (property) | `HighlightedValue[]` | `[]` | Re-renders | Inherited from the base control identity; renders status badges near the label. |
| `showAIIndicator` | `show-ai-indicator` | Boolean | `false` | Re-renders | Shows an AI-generated-value indicator inline with the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | Boolean | `false` | Re-renders | Shows an unsaved-changes dot next to the label. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Re-renders | Forwarded to the nested reference control; also switches this control's own layout to edit-on-demand/inline-view rendering. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Re-renders | Forwarded to the nested reference control; also switches this control's own layout density. |
| `nowAssistConfig` | `nowAssistConfig` (property) | `NacmConfig \| undefined` | `undefined` | Re-renders | Forwarded to the nested reference control. |
| `referringRecordId` | `referring-record-id` | String | `''` | Re-renders | Forwarded to the nested reference control. |
| `referringTable` | `referring-table` | String | `''` | Re-renders | Forwarded to the nested reference control. |
| `helperText` | `helpertext` | String | `''` | Re-renders | Inherited from `AIUXControlElement`; not read by this control's own render logic. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_DOCUMENT_ID_CONNECTED#VALUE_CHANGED` | `{name: string, value: string, displayValue: string, meta?: any}` | bubbles, composed, cancelable | Re-dispatched whenever the nested `aiux-control-reference-connected`'s own `VALUE_CHANGED` bubbles up to this control, **or** when the user clicks OK in the table/document modal. | Fires with `name` set to this control's own `name` and the new record's value/displayValue when the nested reference control reports a change. On modal OK it instead fires **once or twice**, in this order: (1) only if `_selectorTableValue` (the table picker's current selection when OK was clicked) differs from `dependentValue` as it was when the modal opened — fires with `name` set to `dependentField` and the new table's value/displayValue; (2) always — fires with `name` set to this control's own `name` and the modal's currently selected document's value/displayValue (empty strings if the user never picked one, e.g. changed the table and clicked OK without choosing a new document). Clicking Cancel/backdrop/Escape fires nothing. |

### Slots

None. This control has no own `<slot>` elements; the modal picker's `<aiux-modal>` renders its own `header`/`footer` slots internally, but those are not exposed by `aiux-control-document-id-connected` itself.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Forwards focus to the nested `aiux-control-reference-connected`. No-op if it is not present. |
| `reset()` | Inherited from `AIUXControlElement`. Resets `value` and internal touched/error state to their defaults. |

### Internal helpers (not importable)

`src/document-id-connected/index.ts` exports `normalizeDisplayValue(displayValue: string, dependentTableName: string) => string` (strips a leading `"${dependentTableName}:"` prefix from a display value, trimming whitespace either way) and `ActionTypes` (`{VALUE_CHANGED: 'AIUX_CONTROL_DOCUMENT_ID_CONNECTED#VALUE_CHANGED'}`). `src/index.ts` only re-exports the component class (`AIUXControlDocumentIdConnected`) from this module, not these two — so they can't be imported from `@servicenow/aiux-components-control`. Use the literal event-name string shown above instead of importing `ActionTypes`.

### Data shapes

`DocumentIdValueChangedDetail`:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The field name the change applies to (either this control's own `name`, or `dependentField`). |
| `value` | `string` | The new sys_id (or table name, for the dependent-field event). |
| `displayValue` | `string` | The new display text. |

Info message auto-prepended to `messages` while no dependent table is chosen (visible unless `readonly`, `disabled`, or `dependentFieldLabel` is empty):

| Property | Value |
| --- | --- |
| `status` | `'info'` |
| `content` | `"Select a ⁨{dependentFieldLabel}⁩ before modifying this field."` |

## Integration details

Importing this control also registers `<aiux-modal>`, `<aiux-control-reference-connected>`, and `<aiux-control-tablename-connected>` as a side effect (it renders instances of all three internally) — no separate imports are needed for those.

### Platform requirements

Requires a GraphQL client reachable via the shared `graphQLClient` (used to look up the dependent field's `tableChoicesScript` dictionary attribute when the lookup modal opens). No other platform service is required directly by this control.

### SSR

No unguarded `window`/`document`/`localStorage` access in this control's own source.

### Lifecycle

The table-choices-script fetch is cached per `tableName`/`dependentField` pair and only re-fetched when that pair changes or the previous fetch failed.

**Gotcha:** if `tableName` or `dependentField` is unset when the lookup button is clicked, `_fetchDependentTableChoicesScript` short-circuits and clears `_dependentTableChoicesScript` to `''` rather than fetching or erroring — the table picker in the modal then opens with no `tableChoicesScript` restriction (i.e. an unrestricted table list) instead of failing visibly. Set both whenever the host wants the dictionary-configured table restriction to apply.

### Sizing and layout

Renders inside the standard form-field grid (see `renderWithLayout`); the modal opens at `size="lg"`.

## Accessibility, localization, and customization

The lookup button has a localized `aria-label` and a matching tooltip ("Select the document"), both from `@lit/localize` `msg()` — translated through the platform's localization pipeline, not host-settable. The info message text and the modal's header/Cancel/OK labels are likewise localized via `msg()`. The label, required/optional/invalid states, and helper-info popover are rendered through this control's own label section (same accessible-label wiring — `aria-labelledby`/`aria-describedby` via `formFieldLabelId`/`formFieldMessagesId` — as other AIUX form controls). Keyboard/screen-reader behavior of the inline reference input and of the table/document pickers is owned by `<aiux-control-reference-connected>` and `<aiux-control-tablename-connected>` respectively — see their own usage docs. This control does not expose its own CSS custom properties or `::part()` targets; styling comes from the shared `aiux-input` wrapper classes and Tailwind/DaisyUI utility classes.
