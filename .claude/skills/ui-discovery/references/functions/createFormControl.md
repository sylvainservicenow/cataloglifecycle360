# createFormControl

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/createFormControl.md`

`createFormControl` takes one `FormField` descriptor and returns a Lit
`TemplateResult` with the matching `aiux-control-*` element (label, required
marker, messages, and control), picked by `field.type`. The host owns the
value: controls report edits through `onValueChange`, and the host writes the
new value back into the field it passes on the next render. It never saves.
For a whole record form wired to the platform, use `aiux-record-form` inside
`aiux-record-provider` instead.

Built in (do not rebuild): the field label, required marker, helper tooltip,
field messages, highlighted-value badges, the unsaved-change marker, inline
edit-on-demand display, and a label right-click menu. Reference, dependent
choice, currency, phone, and other `-connected` controls fetch their options
from the instance themselves.

## Import

```js
import {createFormControl, FieldType, FormFieldEditMode} from '@servicenow/aiux-components-control'; // also registers every aiux-control-* element
import type {FormField, FieldLayout, FormControlOptions} from '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {createFormControl, FieldType} from '@servicenow/aiux-components-control';
import type {FormField, FieldLayout} from '@servicenow/aiux-components-control';

const LAYOUT: FieldLayout = {layout: 'vertical'};

type Values = Record<string, {value: string; displayValue: string}>;

@customElement('my-request-form')
export class MyRequestForm extends AIUXElement {
  @state() private _values: Values = {
    short_description: {value: '', displayValue: ''},
    urgency: {value: '2', displayValue: 'Medium'},
    notify: {value: 'false', displayValue: 'false'}
  };

  private _field(
    name: string,
    label: string,
    type: FieldType,
    extra: Partial<FormField> = {}
  ): FormField {
    const {value, displayValue} = this._values[name];
    return {name, label, type, value, displayValue, visible: true, readonly: false, mandatory: false, ...extra};
  }

  private _onValueChange = (e: CustomEvent) => {
    const {name, value, displayValue} = e.detail;
    this._values = {...this._values, [name]: {value, displayValue: displayValue ?? value}};
  };

  render() {
    const fields = [
      this._field('short_description', 'Short description', FieldType.String, {mandatory: true, maxLength: 160}),
      this._field('urgency', 'Urgency', FieldType.Choice, {
        choices: [
          {value: '', displayValue: '-- None --'},
          {value: '1', displayValue: 'High'},
          {value: '2', displayValue: 'Medium'},
          {value: '3', displayValue: 'Low'}
        ]
      }),
      this._field('notify', 'Notify me', FieldType.Boolean)
    ];
    return html`
      <form class="flex flex-col gap-4 max-w-lg">
        ${fields.map(f => createFormControl(f, LAYOUT, this._onValueChange))}
      </form>
    `;
  }
}
```

**What happens:** text controls report on blur, not per keystroke. A boolean
reports `'true'` or `'false'` as a string. A choice whose `value` is empty
shows its first choice without reporting a change, so put a `''` "None" choice
first or set an initial value.

## API

### Signature

```ts
createFormControl(
  field: FormField,
  fieldLayout: FieldLayout | undefined,
  onValueChange: (e: CustomEvent) => void,
  onStagedValueChange?: (e: CustomEvent) => void,
  options?: FormControlOptions
): TemplateResult
```

- `field`: the field descriptor. `field.type` selects the control (see the table under Behavior); the other fields are listed under Data shapes.
- `fieldLayout`: label position. `undefined` or `{layout: 'auto'}` uses horizontal when the control is at least 480px wide and vertical when narrower.
- `onValueChange`: called with a committed change (`ValueChangeDetail`). Required.
- `onStagedValueChange`: called with in-progress edits before commit (`StagedValueChangeDetail`). Optional; see Behavior for which types call it.
- `options`: defaults to `{}`.

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `editMode` | `FormFieldEditMode` | `DEFAULT` | `DEFAULT`: editable control. `INLINE`: shows the value as text; clicking it opens the editor, and an outside click closes it. `DISPLAY_ONLY`: shows the value as text only. HTML fields are read-only in both `INLINE` and `DISPLAY_ONLY`; URL fields use `INLINE` unless `DISPLAY_ONLY` is passed. Checkbox and days-of-week fields render disabled in `DISPLAY_ONLY`. |
| `variant` | `FormFieldVariant` | `'compact'` when the user preference `glide.ui.compact` is true, else `'default'` | Field density. |
| `enableUnsavedFieldIndicator` | `boolean` | `false` | Shows the unsaved-change marker when this is true and `field.isFieldModified` is true. |
| `onOpenRecord` | `(table: string, sysId: string) => void` | none | Reference and currency controls: shows an "Open Record" button in the reference preview and calls this when it is clicked. Without it the button is not shown. |
| `formView` | `string` | `''` | Reference controls: the form view used for the reference preview popup. |
| `fieldContextMenu` | `FieldContextMenuConfig` | Built from `field.tableName` when set; none otherwise | Menu opened by right-clicking the field label. Build it once (stable identity), not inside `render()`. |
| `rowColumns` | `number` | `undefined` | Columns in the form row holding this field. Checkbox fields in a vertical layout reserve label-height space above the box unless this is `1`. |
| `slots` | `{'label-end'?: TemplateResult}` | none | Content projected into the rendered control's `label-end` slot — the supported way to put a button or other markup next to a factory-rendered label, instead of hand-rolling label-adjacent markup yourself. |

### Returns

A `TemplateResult` to place in `render()`. It is keyed by `field.name`: when a
different `name` renders at the same position, Lit destroys and recreates the
control, so its internal state (typed text, open dropdown) is dropped. Keep
`name` stable and unique per field. The factory does not check
`field.visible`; skip hidden fields yourself.

An unregistered `type` renders `aiux-control-input` and logs a console warning.

### Behavior

**Value ownership.** Each control keeps what the user entered locally and
reports it; it re-reads `field.value` only when the value you pass changes. On
every `onValueChange`, write `detail.value` (and `detail.displayValue`) back
into your state so the next render passes it. If you do not, text controls
report the same change again on every blur, and controls that depend on the
value (dependent choices, reference qualifiers) use the old one.

**Handlers.** Read the field from `e.detail.name`, not `e.target`: for
currency and days-of-week fields the handler receives a new `CustomEvent`
that was never dispatched, so `target` is `null`. The original control events
also bubble (composed) to ancestor listeners.

**When `onValueChange` fires.**

- Single-line text types (`aiux-control-input` row): on blur, only when the text differs from the `value` you passed.
- Textarea and number: on every blur while editable, even when unchanged. Compare with your stored value if a no-op matters.
- Checkbox, radio, choice, reference, date, and other pickers: when the user makes a selection.
- A dependent choice (`dependentField` set) whose `dependentValue` changes clears its value and reports `''`.
- Setting `field.value` from the host does not fire it.

**When `onStagedValueChange` fires.** While the user edits, before commit
(text-like controls debounce it by about 250ms). The in-progress text is in
`detail.value` for most controls and in `detail.fieldValue` for textarea-based
ones (`textarea`, `str_long`, `email_script`, ...). It is not called for:
`boolean`, `string_boolean`, `days_of_week`, `choice` and other choice types,
`radio`, reference types, `conditions`, `document_id`, `field_list`,
`field_name`, `field_lookup`, `file_attachment`, `address_simple`,
`slushbucket`, `user_roles`, `annotation`, `color_display`, and the types that
render `aiux-control-input` or `aiux-control-password` (`string` and the rest
of that row).

**Instance-backed controls.** These fetch data themselves and need the page
served by an instance:

- Reference (`reference`, `glide_list`, `glide_action_list`, `domain_id`): set `tableName` (the table the field belongs to), `name` (its column), and `recordSysId` (`'-1'` for a new record). Without all three, search returns nothing. The server applies that column's dictionary reference qualifier; `ignoreReferenceQualifier` or `disableReferenceQualifier` bypasses it. `reference` is the target table. `encodedRecord` and `serializedChanges` carry unsaved form state for dynamic qualifiers.
- Choice: renders `field.choices`. It fetches only when `dependentField` and `dependentValue` are set; that requires `tableName` and `name`. On first render it keeps non-empty `choices` you pass instead of fetching.
- Label menu: when `field.tableName` is set and no `fieldContextMenu` is passed, right-clicking the label fetches menu items for that table and field.

**`FieldType` to control.** Types are the `FieldType` enum values (strings).

| `field.type` | Renders |
| --- | --- |
| `annotation` | `aiux-control-annotation` (display text from `value`; no label, no events) |
| `boolean`, `string_boolean` | `aiux-control-checkbox`; reports `'true'` / `'false'` |
| `days_of_week` | `aiux-control-checkbox-group`; value is digits without separators, e.g. `'145'` |
| `string`, `collection`, `char`, `str_short`, `GUID`, `user_input`, `sysrule_field_name`, `translated`, `tree_code`, `tree_path`, `sys_class_path`, `string_full_utf8`, `composite_field`, `source_table`, `source_name`, `compressed`, `json_translations`, `structure`, `int`, `documentation_field`, `workflow`, `approval_rules` | `aiux-control-input` |
| `domain_path`, `insert_timestamp` | `aiux-control-input`, always read-only |
| `counter` | `aiux-control-input`, read-only, shows `displayValue ?? value` |
| `related_tags` | `aiux-control-input`, read-only, shows `displayValue` |
| `password`, `password2` | `aiux-control-password` |
| `email` | `aiux-control-email` |
| `url` | `aiux-control-url` |
| `color` | `aiux-control-color` |
| `color_display` | `aiux-control-color-display` |
| `composite_name` | `aiux-control-composite-name` |
| `textarea`, `str_long`, `wide_text`, `name_values`, `glide_encrypted`, `multi_two_lines`, `multi_small`, `expression` | `aiux-control-textarea` |
| `translated_field`, `translated_text` | `aiux-control-textarea` when `isMultiText` is true, or is not `false` and `maxLength` > 255; else `aiux-control-input` |
| `script`, `script_plain`, `css`, `xml`, `json`, `condition_string` | `aiux-control-code-editor` (loaded on first use) |
| `date`, `datetime`, `glide_date`, `glide_date_time`, `due_date`, `integer_date`, `glide_precise_time` | `aiux-control-date-picker` |
| `glide_time`, `glide_utc_time`, `integer_time` | `aiux-control-time-input` |
| `integer`, `long`, `longint`, `float`, `decimal`, `percent_complete`, `auto_increment` | `aiux-control-number` |
| `reference`, `domain_id` | `aiux-control-reference-connected` |
| `glide_list`, `glide_action_list` | `aiux-control-reference-connected`, multi-select (`glide_action_list` searches `sys_ui_action`) |
| `choice` | `aiux-control-radio-group` when the count of non-empty choices is from 1 to `glide.ui.radio_max` (dictionary attribute, else system property; 0 when unset); else `aiux-control-choice-connected` |
| `internal_type`, `sysevent_name`, `index_name` | `aiux-control-choice-connected` |
| `radio` | `aiux-control-radio-group` |
| `currency`, `currency2`, `price` | `aiux-control-currency-connected`; value is `'CODE;amount'`, e.g. `'USD;1234.56'` |
| `glide_duration` | `aiux-control-duration` |
| `field_list` | `aiux-control-field-list-connected` |
| `field_name`, `short_field_name` | `aiux-control-fieldname-connected` |
| `file_attachment`, `user_image`, `video`, `audio` | `aiux-control-file-attachment` |
| `html`, `translated_html` | `aiux-control-html-editor`; `aiux-control-input` when `isMultiText === false` |
| `html_script` | `aiux-control-html-script` |
| `email_script` | `aiux-control-email-script` |
| `journal`, `journal_input`, `journal_list` | `aiux-control-journal-input`; `aiux-control-html-editor` when `isRichTextEnabled` is true (unset: system property `glide.ui.journal.use_html`) |
| `ph_number`, `phone_number`, `phone_number_e164` | `aiux-control-phone-connected` |
| `table_name`, `short_table_name` | `aiux-control-tablename-connected` |
| `timer` | `aiux-control-time-worked` |
| `address_simple` | `aiux-control-map` |
| `simple_name_values` | `aiux-control-name-value` |
| `data_structure` | `aiux-control-data-structure` |
| `conditions`, `variable_conditions`, `workflow_conditions` | `aiux-control-conditions-connected` |
| `ip_addr`, `ip_address` | `aiux-control-ip-address` |
| `auto_number` | `aiux-control-auto-number-connected` |
| `document_id`, `source_id` | `aiux-control-document-id-connected` |
| `version` | `aiux-control-version` |
| `template_value`, `variable_template_value`, `snapshot_template_value` | `aiux-control-template-value` |
| `user_roles` | `aiux-control-user-roles-lookup-connected` |
| `wiki_text` | `aiux-control-wiki-text-connected` |
| `slushbucket` | `aiux-control-slushbucket` |
| `order_index` | `aiux-control-order-index` |
| `field_lookup` | `aiux-control-field-lookup-connected` |
| `markdown` | `aiux-control-markdown-editor` (loaded on first use; falls back to a read-only textarea with a "could not be loaded" message if the bundle fails) |
| Any other value, including `input_group` | `aiux-control-input`, with a console warning |

### Exported helpers

| Export | Signature | Use |
| --- | --- | --- |
| `FieldType` | `enum` (string values above) | Set `field.type`. |
| `FormFieldEditMode` | `enum {DEFAULT = 'default', INLINE = 'inline', DISPLAY_ONLY = 'display-only'}` | `options.editMode`. |
| `FIELD_TYPE_MAPPINGS` | `Readonly<Record<FieldType, renderer>>` (frozen) | Check whether a type has a dedicated control (`type in FIELD_TYPE_MAPPINGS`). Read-only. |
| `renderFormFieldLabel` | `(props: {name: string; label: string; invalid: boolean; required: boolean; optional: boolean; helperContent?: string; renderAsElement?: 'label' \| 'span' \| 'legend'; layout?: 'vertical' \| 'horizontal'; variant?: FormFieldVariant; wrapLabel?: boolean; hideRequiredIndicator?: boolean; labelUrl?: string; labelUrlTarget?: string}) => TemplateResult \| nothing` | Label-only rows with no control (e.g. a heading field), styled like the factory's labels. Returns `nothing` when `label` and `helperContent` are both empty. Do not add it next to a factory control; controls render their own label. |
| `createFormContextMenu` | `({form: {table, view, getField(name) => {label?} \| null}, navigation: {openRecord, openList}, onAction?}) => FieldContextMenuConfig` | Build `options.fieldContextMenu` with your form view, field labels, and navigation. Build once per form. |
| `getFormFieldVariant` | `() => FormFieldVariant` | The `variant` default, from user preference `glide.ui.compact`. |

### Data shapes

`FormField`, `FieldLayout`, `FormControlOptions`, `FieldType`, and
`FormFieldEditMode` are exported from the package.

```ts
interface FormField {
  // Required
  name: string;            // key for the value; keys the rendered control
  label: string;
  type: FieldType;
  value: unknown;
  displayValue: unknown;
  visible: boolean;        // not read by the factory
  readonly: boolean;
  mandatory: boolean;      // required marker unless readonly

  // Common (all types)
  disabled?: boolean;
  isInvalid?: boolean;     // also set by any messages entry of type 'error'
  invalid?: boolean;       // deprecated alias of isInvalid
  maxLength?: number;      // maxlength: deprecated alias
  placeholder?: string;
  fieldHint?: string;      // helper tooltip; shown only when user pref glide.ui.accessibility.accessible.tooltips is true
  messages?: FieldMessage[];
  labelUrl?: string;
  labelUrlTarget?: string; // default '_blank'
  wrapLabel?: boolean;
  hideRequiredIndicator?: boolean;
  optional?: boolean;
  autofocus?: boolean;
  controlStyles?: string;  // CSS declarations applied to the control's main element
  highlightedValue?: HighlightedValue[];   // badges; ignored for field_name, phone types, document_id, internal_type, sysevent_name, index_name
  decorations?: {icon: string; text: string}[];
  decorationWidgets?: {tagName: string; scopeName: string}[];
  showAIIndicator?: boolean;
  liveUpdate?: {updatedBy?: {displayName?: string}; isUserModified?: boolean; displayValue?: string}; // adds an info message
  recommendation?: Record<string, unknown>; // AI suggestions for input and choice types
  isFieldModified?: boolean;               // with options.enableUnsavedFieldIndicator
  isEncrypted?: boolean;                   // appends "(Encrypted: <encryptionContext>)" to the label (input types)
  encryptionContext?: string;
  originalValue?: unknown;
  originalDisplayValue?: string;
  tableName?: string;      // table the field belongs to: connected lookups and default label menu
  recordSysId?: string;    // record being edited ('-1' for new)
  referringTable?: string; // fallback for tableName
  referringRecordId?: string; // fallback for recordSysId
  dependentField?: string; // choice, conditions, document_id, field_list, field_name, template_value, html_script, email_script
  dependentValue?: unknown;
  attributes?: Record<string, string>;     // dictionary attributes, e.g. radio_none, max_ref_dropdown, no_view
  dictionary?: {attributes?: {name: string; value: string}[]}; // e.g. glide.ui.radio_max, is_searchable_choice
  formData?: {isNewRecord?: boolean; serializedChanges?: string; userSession?: {sysId?: string; [k: string]: unknown}}; // reference, phone, currency, template_value

  // Choice types
  choices?: {value: string; displayValue: string; hint?: string}[];
  isSearchable?: boolean;
  optionStack?: unknown;

  // Reference types
  reference?: string;              // target table; default 'global'
  referenceKey?: string;
  displayValueList?: string[];     // glide_list: one display value per id in value
  sortBy?: string;
  orderByDisplayColumn?: boolean;  // default true
  searchOnClick?: boolean;
  ignoreReferenceQualifier?: boolean;
  disableReferenceQualifier?: boolean;
  overrideReferenceTable?: string;
  encodedRecord?: string;
  serializedChanges?: string;

  // Checkbox, days_of_week
  isToggle?: boolean;
  labelPosition?: 'start' | 'end'; // default 'end'
  fullWidth?: boolean;
  description?: string;
  configAria?: Record<string, string>;

  // Text-like
  isMultiText?: boolean;           // translated_* and html: input vs multi-line
  isRichTextEnabled?: boolean;     // journal types
  resizable?: boolean;
  rows?: number;
  showCounter?: boolean;
  autoresize?: boolean;
  isXMLView?: boolean;             // xml
  height?: string;                 // code editor, html editor

  // Currency
  currencyCode?: string;
  defaultCurrency?: string;
  currencyCodes?: {value: string; displayValue: string; subLabel: string}[];
  locale?: string;
  maxFractionDigits?: number;

  // Other types read further optional fields declared on the exported FormField
  // type (date-picker utcOffset/firstDayOfWeek, duration maxUnit, file-attachment
  // extensions/maxAttachmentSize, slushbucket slushBucketFields, phone countryCode, ...).
}

interface FieldMessage {
  type: 'error' | 'warning' | 'info' | 'debug';
  message: string;
}

interface HighlightedValue {
  value: string;
  status?: string;
  showIcon?: boolean;
  variantName?: string;
  colorName?: string;
  iconName?: string;
}

interface FieldLayout {
  layout?: 'vertical' | 'horizontal' | 'auto'; // omitted = 'auto'
  columns?: string[]; // horizontal grid columns; default ['120px', '1fr', 'auto']
}

type FormFieldVariant = 'default' | 'compact';

interface FormControlOptions {
  editMode?: FormFieldEditMode;
  variant?: FormFieldVariant;
  enableUnsavedFieldIndicator?: boolean;
  onOpenRecord?: (table: string, sysId: string) => void;
  formView?: string;
  fieldContextMenu?: FieldContextMenuConfig;
  rowColumns?: number;
  slots?: Record<'label-end', TemplateResult>;
}

interface FieldContextMenuConfig {
  fetchItems: (name: string) => Promise<({id: string; label: string; disabled?: boolean} | {divider: true})[]>;
  onAction?: (item: {id: string; label: string; disabled?: boolean}, name: string) => void;
}

// onValueChange: e.detail. Keys beyond name and value depend on the control.
interface ValueChangeDetail {
  name: string;
  value: string;                       // checkbox: 'true' | 'false'
  displayValue?: string | string[];    // choice, reference, number, currency; absent for text, checkbox, radio
  error?: {type: string; message: string}; // number, date, reference, currency parse or validation error
  oldValue?: string;                   // choice, date
  additionalInfo?: {referenceSysId?: string; secondaryData?: unknown}; // reference
  fieldValue?: string;                 // textarea-based controls (same as value)
}

// onStagedValueChange: e.detail
interface StagedValueChangeDetail {
  name?: string;
  value?: unknown;          // most controls
  fieldValue?: string;      // textarea-based controls
  displayValue?: string;
  error?: {type: string; message: string};
}
```

## Integration details

### Platform requirements

Reference, dependent-choice, and other `-connected` controls, and the default
label menu, call instance APIs in the user's session; serve the page from an
instance. User preferences (`glide.ui.compact`,
`glide.ui.accessibility.accessible.tooltips`) and system properties
(`glide.ui.radio_max`, `glide.ui.radio_none`, `glide.ui.journal.use_html`)
change which control and styling render.

## Accessibility, localization, and customization

- **Accessibility:** each control renders its own label associated with the input, the required marker (`mandatory` and not `readonly`), and messages; do not add a separate label. Clicking the label focuses the control.
- **Localization:** translate `label`, `placeholder`, `fieldHint`, `messages`, and choice `displayValue`s yourself. Built-in strings (e.g. "-- None --", "Edit", "Open Record", days-of-week names) are translated by the package.
- **Customization:** `variant` sets density and `fieldLayout` sets label position; `controlStyles` applies inline CSS to the main input element.