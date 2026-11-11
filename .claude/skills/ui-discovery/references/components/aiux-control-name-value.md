# aiux-control-name-value

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-name-value.md`

A row-based editor for name/value pairs. The host sets `value` to a JSON object string (e.g. `{"HOST":"localhost","PORT":"8080"}`); the control renders one row per key, with add/remove-row buttons, and keeps `value` serialized back to that same JSON-object shape as the user edits. Duplicate or empty names are flagged inline and block the serialized value from updating until fixed.

Built in: JSON parsing/serialization of the name-value pairs, duplicate/empty-name validation with inline error styling, and per-row add/remove/focus management. Do not build these yourself.

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

class MyEnvVarsField extends AIUXElement {
  static properties = {
    envVarsJson: {type: String}
  };

  render() {
    return html`
      <aiux-control-name-value
        name="env_vars"
        label="Environment variables"
        .value=${this.envVarsJson ?? ''}
        @AIUX_CONTROL_NAME_VALUE#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-name-value>
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    if (!error) this.envVarsJson = value;
  }
}
```

**What happens:** each keystroke in a row's name/value input dispatches `AIUX_CONTROL_NAME_VALUE#STAGED_VALUE_CHANGED`. On blur, or after adding/removing a row, the control validates the rows, updates its own `value` to the serialized JSON object (only when valid), and dispatches `AIUX_CONTROL_NAME_VALUE#VALUE_CHANGED` with an `error` when validation fails (duplicate or empty names). Gotcha: when validation fails, the control's internal `value` is **not** updated — it keeps whatever the last successfully-serialized JSON was. So typing a duplicate name into row 2 does not make `e.detail.value` reflect that duplicate; it still reports the JSON from before the duplicate was introduced, with only the `error` field telling you something is wrong. Don't try to recover the in-progress (invalid) row text from `detail.value` — it isn't there.

### Additional patterns

Read-only display renders the same element with populated rows and no add/remove buttons — useful for showing previously-saved metadata on a record detail view without a separate presentation component:

```js
html`
  <aiux-control-name-value
    name="metadata"
    .value=${'{"region":"us-west-2","tier":"premium"}'}
    label="Metadata"
    readonly
  ></aiux-control-name-value>
`;
```

Setting `messages` yourself (e.g. a server-side error for this field) permanently suppresses the control's own duplicate/empty-name message: it only ever writes its computed validation message into `messages` when that array is still empty or still holds exactly what the control itself last wrote. Once a host sets a non-empty `messages` array of its own, the control stops refreshing it — even if the user later introduces a duplicate name, the host's message keeps showing instead of "Duplicate or empty names are not allowed." Clear `messages` back to `[]` once the host-side condition it represented is resolved, or you can end up with a stale message masking a live validation error.

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Reactive; an externally-set `value` is re-parsed into rows in `willUpdate` (unless the change originated internally from this control's own serialization) | JSON-object string of name-value pairs, e.g. `'{"HOST":"localhost"}'`. An unparseable or non-object value resets the rows to a single empty row. |
| `label` | `label` | `string` | `''` | Reactive | Field label, also appended to every row's per-input `aria-label`. |
| `name` | `name` | `string` | `''` | Reactive | Field name, echoed in every dispatched event's `detail.name`. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Reactive | Hides the add/remove-row buttons and applies a `readonly` row class; the native row inputs still render but with `?readonly` set. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Reactive | Inherited identity property; `this.disabled` itself is not read anywhere in this control's own render logic (only `readonly` affects row editability via that property). Separately, and unrelated to this property, each row's own value input carries native `?disabled` whenever that row's name is empty — the value field can't be edited until a name is entered. |
| `required` | `required` (reflected) | `boolean` | `false` | Reactive | Forwarded to each row's key input as native `?required`. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Reactive; the control also sets this internally to the result of its own duplicate/empty-name validation | Drives the `aiux-input-error` class on rows with a duplicate or empty key. |
| `nowId` | `now-id` | `string` | `''` | Reactive | Opaque identifier forwarded from the host record. |
| `controlStyles` | `control-styles` | `string` | `''` | Reactive | Raw CSS declarations from an admin field-style rule. Inherited; not applied by this control's own template (it renders plain `aiux-input`/`aiux-btn` rows without a `controlStylesMap()` binding). |
| `autofocus` | `autofocus` | `boolean` | `false` | Reactive | When `true`, binds native `autofocus` on the **first row's key input only** — not on every row. |
| `placeholder`, `labelUrl`, `labelUrlTarget`, `helperText` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited identity properties; not read by this control's own logic (each row has its own fixed "Name"/"Value" placeholders instead). |
| `fieldLayout`, `variant`, `optional`, `helperContent`, `hideRequiredIndicator`, `wrapLabel`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `fieldContextMenu` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Standard shared form-field layout properties, forwarded to `renderWithLayout()`. |
| `messages` | `messages` (array property; set via `.messages`) | `ControlMessage[]` | `[]` | Reactive | Messages shown below the rows. The control writes its own duplicate/empty-name error into this array only when the host hasn't already set custom messages (it won't overwrite a non-empty host-supplied `messages` array). |
| `nowAssistConfig`, `referringRecordId`, `referringTable`, `formData` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited NACM/form-context properties. Not currently used — this control has no NACM integration of its own. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_NAME_VALUE#STAGED_VALUE_CHANGED` | `{name, value, displayValue}` (`value`/`displayValue` are the same serialized string) | Bubbles, composed, cancelable | On every keystroke in a row's name or value input | Fires even while the rows are in an invalid state — `value` reflects whatever the last successful serialization produced (unchanged if the current rows are invalid). |
| `AIUX_CONTROL_NAME_VALUE#VALUE_CHANGED` | `{name, value, displayValue, error?}` — `error` is `{type: 'error', message: string}` | Bubbles, composed, cancelable | On blur of any row input, and after adding or removing a row | `error` is present whenever the current rows have a duplicate name or an empty name paired with a non-empty value; message text is "Duplicate or empty names are not allowed" (localized via `msg()`). |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the first row's key input (inherited `_inputEl` query resolves to the first `<input>` in the shadow root). |
| `reset()` | Resets `value` and shared identity/error state. Does not directly clear `_rows` back to a single empty row — that happens as a side effect of `value` becoming `''` and `willUpdate` re-parsing it. |

## Integration details

No additional requirements.

### Platform requirements

None beyond a standard DOM (`shadowRoot.querySelector` is used to move focus after add/remove-row, guarded to no-op if the element isn't found).

### SSR

SSR-safe. `render()` performs no `window`/`document` access; the post-add/remove focus calls run inside `updateComplete.then()`, after the client hydrates.

### Lifecycle

`willUpdate` re-parses `value` into rows whenever it changes from outside the control (an internal serialization round-trip is flagged via `_isInternalUpdate` for one microtask so it isn't immediately re-parsed).

### Sizing and layout

Renders through the shared form-field grid (`renderWithLayout`); each row is a fixed three-column flex row (name input, value input, a `5.5rem` actions column) that repeats per pair, growing the control's height with the row count.

## Accessibility, localization, and customization

Each row's inputs have generated `aria-label`s that include the row's 1-based position and, when set, the field's `label` (e.g. "Row 1 name Environment Variables"); duplicate/empty-name rows get `aria-invalid="true"` on the name input. The add/remove buttons carry tooltip and `aria-label` text ("Add row", "Remove name value row {n} with name {key} and value {value}"). All of these strings — placeholders ("Name", "Value"), button labels, tooltips, row aria-labels, and the validation error message — are produced via `@lit/localize`'s `msg()`/`msg(str\`...\`)`, so they are host-localizable rather than hard-coded English; `label` and `helperContent` themselves are host-supplied strings and are not translated by the control. No CSS custom properties or `::part()` hooks are exposed; the only style customization point inherited from the base is `controlStyles`, which this control does not currently apply to its rows.
