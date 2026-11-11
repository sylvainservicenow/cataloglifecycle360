# aiux-control-data-structure

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-data-structure.md`

A row-based editor for `{name, type}` field definitions. The host sets `value` to a JSON array string (e.g. `[{"name":"count","type":"Integer"}]`); the control renders one row per field with a name input and a type dropdown (from a fixed set of type options), and keeps `value` serialized back to that same JSON-array shape as the user edits. Duplicate names, empty names on a non-trailing row, and invalid types are flagged inline and block the serialized value from updating until fixed.

Built in: JSON array parsing/serialization, the fixed type dropdown (`Integer`, `boolean`, `array`, `encrypted`, `string`, `decimal`, `object`), duplicate/empty-name and invalid-type validation with inline error styling, and per-row add/remove/focus management. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
// complete host component
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MySchemaField extends AIUXElement {
  static properties = {
    schemaJson: {type: String}
  };

  render() {
    return html`
      <aiux-control-data-structure
        name="payload_schema"
        label="Payload schema"
        .value=${this.schemaJson ?? ''}
        @AIUX_CONTROL_DATA_STRUCTURE#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-data-structure>
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    if (!error) this.schemaJson = value;
  }
}
```

**What happens:** typing in a row's name input dispatches `AIUX_CONTROL_DATA_STRUCTURE#STAGED_VALUE_CHANGED`. Choosing a type in the dropdown, blurring a row, or adding/removing a row validates the rows, updates `value` to the serialized JSON array (only when valid), and dispatches `AIUX_CONTROL_DATA_STRUCTURE#VALUE_CHANGED` with an `error` when validation fails.

A row's remove (✕) button, and the add (+) button on the trailing row, are both hidden until that row has a non-blank name — type into "Name" first, then the buttons appear. The type `<select>` for a row is likewise disabled until the row has a name, independently of the control's own `readonly`/`disabled` state. A coding agent driving the UI (or writing an interaction test) that adds a row and immediately looks for its remove button, or opens its type dropdown, needs to type a name into that row first.

### Additional patterns

Checking a value against the known type list before ever setting it, since the control itself does not validate a value that arrives from outside: an externally-set `value` with duplicate names, a blank name, or an unrecognized type (silently coerced to `'string'` on parse) renders without any error state until the user next edits a row. `DATA_TYPE_OPTIONS`/`DEFAULT_TYPE` are not importable from this package (see **Internal constants** below) — duplicate the list yourself:

```js
const DATA_TYPE_OPTIONS = ['Integer', 'boolean', 'array', 'encrypted', 'string', 'decimal', 'object'];

function isKnownGoodSchema(rows) {
  return (
    rows.length > 0 &&
    rows.every(r => r.name.trim() !== '' && DATA_TYPE_OPTIONS.includes(r.type))
  );
}

// Before trusting a server-fetched schema for display/edit:
const rows = JSON.parse(storedSchemaJson);
if (!isKnownGoodSchema(rows)) {
  // surface this to the host's own messaging instead of letting the
  // control show a clean, unflagged (but stale/invalid) initial state
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Reactive; an externally-set `value` is re-parsed into rows in `willUpdate` (unless the change originated internally from this control's own serialization) | JSON-array string of `{name, type}` objects, e.g. `'[{"name":"count","type":"Integer"}]'`. An unparseable, non-array, or empty-object-item value resets the rows to a single placeholder row. An item whose `type` is not one of the fixed type options is coerced to `'string'` on parse. |
| `label` | `label` | `string` | `''` | Reactive | Field label, also appended to every row's per-input `aria-label`. |
| `name` | `name` | `string` | `''` | Reactive | Field name, echoed in every dispatched event's `detail.name`. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Reactive | Hides the add/remove-row buttons; applies a `readonly` row class and `?readonly` on the name input (the type `<select>` is disabled instead — selects have no native readonly). |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Reactive | Disables each row's name input and type `<select>`, and also hides the add/remove buttons (in addition to `readonly` doing so). |
| `required` | `required` (reflected) | `boolean` | `false` | Reactive | Forwarded to each row's name input as native `?required`. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Reactive; the control also sets this internally to the result of its own validation | Drives the `aiux-input-error` class on rows with a duplicate or invalid empty name. |
| `nowId` | `now-id` | `string` | `''` | Reactive | Opaque identifier forwarded from the host record. |
| `controlStyles` | `control-styles` | `string` | `''` | Reactive | Raw CSS declarations from an admin field-style rule. Inherited; not applied by this control's own template. |
| `autofocus`, `placeholder`, `labelUrl`, `labelUrlTarget`, `helperText` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited identity properties; not read by this control's own render logic (each row uses fixed "Name" placeholder text and no `autofocus` binding of its own — unlike `aiux-control-name-value`, this control does not forward `autofocus` to a row input). |
| `fieldLayout`, `variant`, `optional`, `helperContent`, `hideRequiredIndicator`, `wrapLabel`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `fieldContextMenu` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Standard shared form-field layout properties, forwarded to `renderWithLayout()`. |
| `messages` | `messages` (array property; set via `.messages`) | `ControlMessage[]` | `[]` | Reactive | Messages shown below the rows. The control writes its own validation error into this array only when the host hasn't already set custom messages (it won't overwrite a non-empty host-supplied `messages` array). |
| `nowAssistConfig`, `referringRecordId`, `referringTable`, `formData` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited NACM/form-context properties. Not currently used — this control has no NACM integration of its own. |

### Internal constants (not importable)

`src/data-structure/types/index.ts` defines `DATA_TYPE_OPTIONS: readonly ['Integer', 'boolean', 'array', 'encrypted', 'string', 'decimal', 'object']` and `DEFAULT_TYPE: 'string'`. They're exported from that submodule, but `src/index.ts` only side-effect-imports `./data-structure` and the package's `exports` map exposes just `"."` — so neither constant can actually be imported from `@servicenow/aiux-components-control`. If you need the same type list to pre-validate a value, duplicate it yourself.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_DATA_STRUCTURE#STAGED_VALUE_CHANGED` | `{name, value, displayValue}` (`value`/`displayValue` are the same serialized string) | Bubbles, composed, cancelable | On every keystroke in a row's name input | Fires even while the rows are in an invalid state — `value` reflects whatever the last successful serialization produced. |
| `AIUX_CONTROL_DATA_STRUCTURE#VALUE_CHANGED` | `{name, value, displayValue, error?}` — `error` is `{type: 'error', message: string}` | Bubbles, composed, cancelable | On blur of a row's name input or type select, on choosing a type in the dropdown, and after adding or removing a row | `error` message text is either "Each field must have a valid type" (an unrecognized type — normally unreachable through the UI, since the dropdown only offers valid types) or "Duplicate or empty field names are not allowed" (localized via `msg()`). |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the first row's name input (inherited `_inputEl` query resolves to the first `<input>` in the shadow root). |
| `reset()` | Resets `value` and shared identity/error state. Does not directly clear `_rows` — that happens as a side effect of `value` becoming `''` and `willUpdate` re-parsing it. |

### Data shapes

`DataStructureRow`: `{name: string; type: string}` — the parsed/edited row shape (not itself exported as a value, only as a type alongside the component).

## Integration details

No additional requirements.

### Platform requirements

None beyond a standard DOM (`shadowRoot.querySelector` is used to move focus after add/remove-row, guarded to no-op if the element isn't found).

### SSR

SSR-safe. `render()`'s only `document` reference is the guarded `getDocumentDir()` helper (`typeof document !== 'undefined'`, falling back to `'auto'`), not Lit's `isServer`; the post-add/remove focus calls run inside `updateComplete.then()`, after the client hydrates.

### Lifecycle

`willUpdate` re-parses `value` into rows whenever it changes from outside the control (an internal serialization round-trip is flagged via `_isInternalUpdate` for one microtask so it isn't immediately re-parsed). That parse never calls validation: a freshly-set external `value` with duplicate names, a blank non-trailing name, or an invalid type renders with no `aiux-input-error` styling and no message, since `invalid` and `messages` are only recomputed inside the row blur/change/add/remove handlers, not from `willUpdate`.

### Sizing and layout

Renders through the shared form-field grid (`renderWithLayout`); each row is a fixed three-part flex row (name input, type `<select>`, a `5.5rem` actions column) that repeats per field, growing the control's height with the row count.

## Accessibility, localization, and customization

Each row's name input and type select have generated `aria-label`s that include the row's 1-based position and, when set, the field's `label` (e.g. "Row 1 field name Payload schema"); duplicate/empty-name rows get `aria-invalid="true"` on the name input. The add/remove buttons carry separate tooltip and `aria-label` text: the add button's tooltip reads "Add Row" while its `aria-label` reads "Add row"; the remove button's tooltip reads "Delete Row" while its `aria-label` reads "Remove field row {n} with name {name} and type {type}". All of these strings — the "Name" placeholder, button labels, tooltips, row aria-labels, and the two validation error messages — are produced via `@lit/localize`'s `msg()`/`msg(str\`...\`)`, so they are host-localizable rather than hard-coded English. The type option values themselves (`Integer`, `boolean`, `array`, `encrypted`, `string`, `decimal`, `object`) are technical data-type identifiers, not localized, since they are the serialized values written into `value`. `label` and `helperContent` are host-supplied strings and are not translated by the control. No CSS custom properties or `::part()` hooks are exposed; the only style customization point inherited from the base is `controlStyles`, which this control does not currently apply to its rows.
