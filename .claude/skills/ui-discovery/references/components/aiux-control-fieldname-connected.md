# AIUXControlFieldnameConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-fieldname-connected.md`

A form-field control that lets a user pick a field belonging to a table given in `dependentValue`. In flat mode it is a searchable choice list of that table's fields; when `allowDotWalking` is set it becomes a breadcrumb-driven picker that can descend through reference fields into related tables' fields (e.g. `caller_id.manager.department`).

Built in: server-driven field-metadata lookup (GraphQL) per table, an internal text-search filter over the currently loaded table's fields, dot-walk breadcrumb navigation with a nested picker panel, and full keyboard support (Escape to close, Arrow Down to open/move into the list, Enter to open or select). Do not build a separate field picker or dot-walk UI yourself — this control owns both.

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

class MyFieldPicker extends AIUXElement {
  static properties = {
    fieldName: {type: String}
  };

  render() {
    return html`
      <aiux-control-fieldname-connected
        name="field_name"
        label="Field"
        .value=${this.fieldName ?? ''}
        dependentValue="incident"
        @AIUX_CONTROL_FIELDNAME_CONNECTED#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-fieldname-connected>
    `;
  }

  _onValueChange(e) {
    const {value, displayValue} = e.detail;
    this.fieldName = value;
    // persist value/displayValue, e.g. update this.fieldName and request an update
  }
}
```

**What happens:** the control fetches the field list for the `incident` table and lets the user search/select one. Committing a selection (or clearing it) dispatches `AIUX_CONTROL_FIELDNAME_CONNECTED#VALUE_CHANGED` with the picked field name and its label.

### Additional patterns

Allow dot-walking through reference fields, restricting which reference tables can be walked into:

```js
html`
  <aiux-control-fieldname-connected
    name="field_name"
    label="Field"
    dependentValue="incident"
    .allowDotWalking=${true}
    .referenceTypes=${['sys_user']}
    .showFieldNamesOnLabel=${true}
    @AIUX_CONTROL_FIELDNAME_CONNECTED#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-fieldname-connected>
`;
```

With this, selecting a reference field's chevron (rather than the field row itself) descends into that reference's own field list instead of committing a value; `referenceTypes` gates which reference fields are selectable as a final value (they're still drillable regardless), and the resulting `value` is a dot-notation path (e.g. `caller_id.manager`).

Restricting the picker to fields of a specific type, e.g. only string fields for a dictionary-override configuration:

```js
html`
  <aiux-control-fieldname-connected
    name="field_name"
    label="Field"
    dependentValue="incident"
    .types=${['string']}
    @AIUX_CONTROL_FIELDNAME_CONNECTED#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-fieldname-connected>
`;
```

`types` only filters the flat (non-dot-walking) list; it has no effect on which fields are offered while drilling through a reference chain. A server-resolved `script_types`/`script_ref_types` fallback exists for both `types` and `referenceTypes`, but any non-empty static value you pass always wins over it.

## API

### `aiux-control-fieldname-connected`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects to attribute | Selected field name, or a dot-notation path when dot-walked (e.g. `caller_id.manager`). |
| `displayValue` | `displayvalue` | `string` | `''` | Reflects to attribute | Human-readable label for `value` (e.g. `Caller > Manager`). |
| `name` | `name` | `string` | `''` | Re-renders | Form field name, echoed back in dispatched event details. |
| `label` | `label` | `string` | `''` | Re-renders | Field label text. |
| `placeholder` | `placeholder` | `string` | `''` | Re-renders | Overrides the default localized "Search a field" placeholder on the dot-walk mode search input; also forwarded as-is to the nested `aiux-control-choice-connected` in flat mode. |
| `readonly` | `readonly` | `boolean` | `false` | Re-renders | Disables editing; the input still renders but blocks interaction and hides the clear button. |
| `disabled` | `disabled` (reflects — inherited from `ControlIdentityBase`, not redeclared here) | `boolean` | `false` | Re-renders, but has no effect on the rendered output | The component's own `disabled` property is never read in `render()` (`grep` confirms no `this.disabled` usage in `index.ts`). Both the inner `aiux-control-choice-connected`'s `.disabled` (flat mode) and the dot-walk input's `?disabled` are instead driven by a local `isDisabled = !this.dependentValue` — i.e. the field is disabled only when no table has been set, regardless of this property. |
| `required` | `required` (reflects — inherited from `ControlIdentityBase`) | `boolean` | `false` | Re-renders | Marks the field required for validation/label styling. |
| `invalid` | `invalid` (reflects — inherited from `ControlIdentityBase`) | `boolean` | `false` | Re-renders | Shows the field in an error/invalid visual state. |
| `dependentValue` | `dependentvalue` | `string` | `''` | Triggers a field-metadata fetch | The table whose fields are offered (e.g. `incident`). Fields are disabled/inert until this is set. |
| `allowDotWalking` | `allowdotwalking` | `boolean` | `false` | Switches rendering mode | Enables the breadcrumb dot-walk UI (dictionary `allow_references`) instead of the flat choice list. |
| `showFieldNamesOnLabel` | `showfieldnamesonlabel` | `boolean` | `false` | Re-renders | Shows the raw field name as a sublabel next to each option's display label (dictionary `show_field_names_on_label`). |
| `referenceTypes` | `referencetypes` | `string[]` | `[]` | Re-renders | Reference tables a reference field must resolve to in order to be selectable (dictionary `reference_types`). Does not affect whether a reference field can be drilled into. |
| `types` | `types` | `string[]` | `[]` | Re-renders | Field types that are selectable at all (dictionary `types`); flat mode also uses this to exclude non-matching fields from the list. |
| `referringRecordId` | `referringrecordid` (Lit default: lowercased property name — this component redeclares the property without the `referring-record-id` attribute override it has in `ControlIdentityBase`) | `string` | `''` | Included in next fetch's query variables | Sys ID of the record the field metadata query is scoped to. |
| `referringTable` | `referringtable` (Lit default: lowercased property name — this component redeclares the property without the `referring-table` attribute override it has in `ControlIdentityBase`) | `string` | `''` | Included in next fetch's query variables | Table of the referring record (used for script-resolved type/reference-type fallback). |
| `serializedChanges` | `serializedchanges` | `string` | `''` | Included in next fetch's query variables | Pending unsaved form changes, serialized, forwarded to the metadata query. |
| `encodedRecord` | `encodedrecord` | `string` | `''` | Included in next fetch's query variables | Encoded record snapshot forwarded to the metadata query. |
| `fieldLayout` | (property only) | `FieldLayout` | `{layout: 'auto'}` | Re-renders | `{layout?: 'vertical'\|'horizontal'\|'auto'; columns?: string[]}` — see **Data shapes**. |
| `variant` | `variant` | `'default'\|'compact'` | `'default'` | Reflects to attribute | Visual density. |
| `editMode` | `edit-mode` | `FormFieldEditMode` | `'default'` | Reflects to attribute | `'default'` \| `'inline'` \| `'display-only'`. |
| `nowId` | `now-id` | `string` | `''` | Re-renders | Stable id used to build internal element ids. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_FIELDNAME_CONNECTED#VALUE_CHANGED` | `{name, value, displayValue}` | bubbles, composed, cancelable | A field is selected (flat mode, or the terminal field of a dot-walk path), or the selection is cleared | This is the only value-commit event; there is no staged/preview event for this control. |

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the nested `aiux-control-choice-connected` in flat mode, or the native search `<input>` in dot-walk mode. |

### `aiux-control-dot-walk-panel`

Internal companion custom element rendered only inside `aiux-control-fieldname-connected` when `allowDotWalking` is set. It renders the breadcrumb trail and the field listbox for the currently active table in the walk, and reports selection/navigation back to its host via its own action events — it is not meant to be used standalone.

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `path` | `path` (Lit default: lowercased property name; `type: Array`, not `attribute: false`) | `PathItem[]` | `[]` | Re-renders | Breadcrumb trail of reference fields walked so far. |
| `metadata` | `metadata` (Lit default: lowercased property name; `type: Object`, not `attribute: false`) | `MetadataMap` | `{}` | Re-renders | Loaded field metadata, keyed by table name. |
| `leafPathSource` | `leafpathsource` | `string` | `''` | Re-renders | Table whose fields are currently listed (the end of the walk so far). |
| `loading` | `loading` | `boolean` | `false` | Re-renders | Shows a loading spinner in place of the field list. |
| `error` | `error` | `string` | `''` | Re-renders | Error message shown in place of the field list. |
| `searchTerm` | `searchterm` | `string` | `''` | Re-renders | Filters the visible field list by display label or field name. |
| `showFieldNamesOnLabel` | `showfieldnamesonlabel` | `boolean` | `false` | Re-renders | Shows each field's raw name as a sublabel. |
| `allowDotWalking` | `allowdotwalking` | `boolean` | `false` | Re-renders | Whether reference-field rows show a chevron to drill in. |
| `referenceTypes` | `referencetypes` (Lit default: lowercased property name; `type: Array`, not `attribute: false`) | `string[]` | `[]` | Re-renders | Restricts which reference fields are selectable as a final value (drilling is unaffected). |
| `variant` | `variant` | `FormFieldVariant` | `'default'` | Reflects to attribute | Visual density, forwarded from the host. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_FIELDNAME_CONNECTED#FIELD_SELECTED` | `{fieldName, displayValue}` | bubbles, composed, cancelable | A selectable field row is clicked/activated | Consumed internally by the host to commit the final `value`. |
| `AIUX_CONTROL_FIELDNAME_CONNECTED#DOT_WALK_TRIGGERED` | `{fieldName, displayValue, referenceSource, source}` | bubbles, composed, cancelable | A reference field's chevron is clicked/activated | Tells the host to descend into `referenceSource`'s fields. |
| `AIUX_CONTROL_FIELDNAME_CONNECTED#BREADCRUMB_CLICKED` | `{index}` | bubbles, composed, cancelable | A breadcrumb (including "Root") is clicked/activated | `index === -1` means the root breadcrumb. |
| `AIUX_CONTROL_FIELDNAME_CONNECTED#CLOSE_REQUESTED` | `{}` or `{returnFocus: true}` | bubbles, composed, cancelable | Escape is pressed on an option, or Arrow Up is pressed on the first option | Tells the host to close the dropdown. |

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focusFirst()` | Moves focus to the first field option in the current listbox. |

### Data shapes

`PathItem`:

| Property | Type | Description |
| --- | --- | --- |
| `field` | `string` | Field name walked through. |
| `displayValue` | `string` | Label shown for that path segment. |
| `parent` | `string` | Table the field belongs to. |

`FieldData`:

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Field name. |
| `displayValue` | `string` | Field label. |
| `isFieldReferenceType` | `boolean` | Whether the field is a reference field. |
| `referenceDataKey` | `string`, optional | Table the reference resolves to. |
| `internalType` | `string`, optional | Underlying field type. |

`MetadataMap`: `{[tableName: string]: {[fieldName: string]: FieldData}}`.

`DataModel`: `{path: PathItem[]; metadata: MetadataMap; leafPathSource: string}`.

`DictionaryAttributes`: `{allowDotWalking?: boolean; referenceTypes?: string[] | string; showFieldNamesOnLabel?: boolean; types?: string[] | string}` — exported type describing the raw dictionary-attribute shape the four standalone-override properties correspond to.

## Integration details

### Platform requirements

Field metadata is fetched over the platform GraphQL client (`/api/now/graphql`), scoped to `referringTable`/`referringRecordId`/`serializedChanges`/`encodedRecord` when provided. No other platform service is required.

### SSR

Safe to render on the server. `document.addEventListener('click', ...)` (used to close the dropdown on an outside click) is guarded with `isServer` in `connectedCallback`/`disconnectedCallback`, so it is only attached in the browser.

### Lifecycle

On `connectedCallback`, subscribes to document clicks to close the dropdown on an outside click; unsubscribes on `disconnectedCallback`. In `updated()`, changing `dependentValue` — or a change in the ambient domain context (via the inherited `domainContextChanged()`) — while `allowDotWalking` is off triggers a fresh metadata fetch for the new table; while dot-walking, it resets the walk back to the root of the new table.

### Sizing and layout

`:host` is `display: block; position: relative;`. The dot-walk dropdown panel is absolutely positioned below the input (`absolute top-full inset-x-0`) and does not reserve layout space when closed.

## Accessibility, localization, and customization

In dot-walk mode, the search input has `role="combobox"`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`, and `aria-expanded` reflecting dropdown open state; the field list is a `role="listbox"` of `role="option"` rows. Keyboard support: Escape closes the dropdown; Arrow Down opens the dropdown (if closed) and moves focus into the first option; Enter opens the dropdown when closed; within the list, Arrow Down/Up move between options (Arrow Up on the first option closes the dropdown and returns focus to the input); Enter/Space on an option selects it, and on a reference field's chevron drills in. The inline clear button is in the tab order. In flat mode (`allowDotWalking` off), all interaction and accessibility semantics are delegated to the nested `aiux-control-choice-connected`.

All user-facing strings (placeholder, "-- None --", "Clear selection", "Loading fields...", error text, breadcrumb labels, chevron aria-labels) are produced via `@lit/localize`'s `msg()` and are localizable; `placeholder` is the one host-settable override. No CSS custom properties or `::part()` selectors are exposed — style via the host element's box model and Tailwind/DaisyUI utility classes already applied internally.
