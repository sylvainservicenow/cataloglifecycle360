# aiux-control-number

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-number.md`

A form-field control for a single numeric value. It wraps the shared text-input base, parses and validates what the user types against integer/decimal/long/percent rules, and formats the committed value with locale-aware grouping and decimal separators.

Built in: locale-aware thousands/decimal separator handling (including Arabic/Persian numeral conversion and Hebrew RTL-mark stripping), integer/decimal/long/percent validation, and commit-time formatting. Do not write your own number parsing/formatting regex — configure this control instead.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyHost extends AIUXElement {
  static properties = {
    quantity: {type: String}
  };

  render() {
    return html`
      <aiux-control-number
        name="quantity"
        label="Quantity"
        .value=${this.quantity ?? ''}
        integer
        @AIUX_CONTROL_NUMBER#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-number>
    `;
  }

  _onCommit(e) {
    const {value, error} = e.detail;
    if (!error) this.quantity = value;
  }
}
```

**What happens:** typing updates the visible field and, debounced 250ms, dispatches `AIUX_CONTROL_NUMBER#STAGED_VALUE_CHANGED` with the parsed value (or `undefined` plus an `error` if what's typed doesn't parse). On blur, `AIUX_CONTROL_NUMBER#VALUE_CHANGED` fires with the parsed (unformatted) value in `detail.value` and the formatted value in `detail.displayValue`; an unparseable value is echoed back raw in `detail.value` with `detail.error` set. Either way, the control's own `value` property is never mutated by this control — only its internal `stagedValue`/`_value` tracking is updated to the formatted result on success.

### Additional patterns

Percent field with two fraction digits:

```js
html`<aiux-control-number
  name="discount"
  label="Discount"
  value=${this.discount}
  percent
  .maxFractionDigits=${2}
></aiux-control-number>`;
```

Long integer (up to 20 digits) with formatting turned off:

```js
html`<aiux-control-number
  name="externalId"
  label="External ID"
  value=${this.externalId}
  long
  format="none"
></aiux-control-number>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `integer` | `integer` | `boolean` | `false` | Read on every parse/format. | Restricts parsing to whole numbers (no decimal point accepted). |
| `decimal` | `decimal` | `boolean` | `true` | Read on every parse/format via `shouldAllowDecimal()` (`!integer && decimal`). | Allows a decimal point. Has no effect when `integer` is `true`. |
| `long` | `long` | `boolean` | `false` | Read in `connectedCallback()` (sets `maxlength`) and on every parse/format. | Long-integer mode: raises `maxlength` to 20 (vs. 14) and skips auto-formatting unless `format` is explicitly non-empty. |
| `percent` | `percent` | `boolean` | `false` | Read on every parse/format. | Strips any `%` characters before parsing and appends a locale-formatted `%` when formatting (via `Intl.NumberFormat`'s percent style). |
| `format` | `format` | `string` | `''` | Read via `shouldFormat()` on connect, on incoming `value` changes, and on blur. | Only the literal value `'none'` is special-cased (disables auto-formatting entirely). Any other non-empty string enables formatting; empty string enables it too **except** when `long` is also `true`. The string's own content otherwise has no effect — formatting style (grouping, percent, decimal places) is driven entirely by `decimal`/`percent`/`maxFractionDigits`/`locale`, not by this value. |
| `locale` | `locale` | `string` | `'en-US'` | Read on every parse/format (via `Intl.NumberFormat`). | BCP 47 locale used to determine thousands/decimal separators. |
| `maxFractionDigits` | `maxfractiondigits` | `number` | `20` | Read on every format. | Maximum decimal places kept when formatting. |

Also inherited from the shared control/input base (`InputBase`/`AIUXControlElement`/`ControlIdentityBase`): `value` (reflects), `placeholder`, `autofocus`, `readonly` (reflects), `disabled` (reflects), `label`, `labelUrl`/`labelUrlTarget`, `name`, `required` (reflects), `invalid` (reflects), `nowId` (attribute `now-id`), `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator` (attribute `show-ai-indicator`), `showUnsavedIndicator` (attribute `show-unsaved-indicator`), `editMode` (attribute `edit-mode`, reflects), `variant` (reflects), `nowAssistConfig`, `referringRecordId` (attribute `referring-record-id`), `referringTable` (attribute `referring-table`), `formData`, `fieldContextMenu`, `helperText`, `type`, `pattern`, `max`, `min`, `maxlength`, `minlength`, `step`, `multiple`, `selection`, `dynamicTranslationEnabled` (attribute `dynamic-translation-enabled`).

A few of those inherited properties behave differently, or not at all, on this control specifically:

- `maxlength` is overwritten automatically every time the element connects (14, or 20 when `long` is `true`) — a host-set value does not stick.
- `type` is accepted but has no effect: the rendered native `<input>` is always `type="text"`, so browser-native numeric semantics (spinner, numeric keyboard, `min`/`max`/`step` enforcement) do not apply even though `max`/`min`/`step`/`pattern`/`multiple` are still rendered onto the element as inert attributes.
- `selection` is declared but not read anywhere in this control's logic. Not currently used.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_NUMBER#STAGED_VALUE_CHANGED` | `{name: string, value: string \| undefined, displayValue: string, error?: {type: string, message: string}}` | `bubbles: true, composed: true, cancelable: true` | The user types, debounced 250ms (fixed — there is no `debounceLength`-style property on this control to configure it). | `value` is the parsed numeric string, or `undefined` if the current text doesn't parse; `displayValue` is always the raw typed text. |
| `AIUX_CONTROL_NUMBER#VALUE_CHANGED` | `{name: string, value: string, displayValue: string, error?: {type: string, message: string}}` | `bubbles: true, composed: true, cancelable: true` | The field is blurred and it is not `readonly`. | On success, `value` is the parsed (unformatted) result and `displayValue` is the formatted result; the control's internal `stagedValue`/`_value` tracking is updated to the formatted value, but the public `value` property itself is never mutated by this control. On parse failure, `value` is the raw unparsed text (echoed back) and `error` is set; the public `value` property is left unchanged either way. |
| `AIUX_CONTROL_INPUT#VALUE_CHANGED` | `{name: string, value: string, fieldValue: string}` | `bubbles: true, composed: true, cancelable: true` | A Now Assist (NACM) insertion completes (via `nowAssistConfig`). | This control does not override the base input's NACM-insert handler, so this path dispatches the shared input control's event name — `AIUX_CONTROL_INPUT#VALUE_CHANGED`, not `AIUX_CONTROL_NUMBER#VALUE_CHANGED`. A host wiring up `nowAssistConfig` on this control needs to listen for this event name in addition to `AIUX_CONTROL_NUMBER#VALUE_CHANGED` to catch AI-inserted values. |

### Slots

| Slot | Description |
| --- | --- |
| `start` | Generic slot before the input, inherited from the shared input base. Nothing is rendered into this position by default for this control. |
| `end` | Generic slot after the input, inherited from the shared input base. When `dynamicTranslationEnabled` is set and translation is available for the field, a translate icon is also rendered in this area (separately from whatever the host slots in). |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Inherited from `AIUXControlElement`; focuses the underlying `<input>`. |
| `reset(): void` | Inherited from `AIUXControlElement`; clears `value`/`stagedValue`/`invalid`/touched/error state. Clearing `value` also triggers this control's own `onValuePropertyChanged('')`, which clears its internal validation-error flag on the next update. |

### Data shapes

Staged/committed event `detail` shape (this control has no dedicated exported type for it — inline the shape below in your own handler):

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Field name. |
| `value` | `string \| undefined` | Parsed numeric value, or (staged event only) `undefined` on parse failure; (committed event) the raw text on parse failure. |
| `displayValue` | `string` | What's shown in the field — raw typed text for the staged event, formatted text for the committed event. |
| `error` | `{type: string, message: string}`, optional | Present when parsing or formatting fails. |

## Integration details

No additional requirements beyond `@servicenow/aiux-components-control`.

### Platform requirements

None — number parsing/formatting uses only `Intl.NumberFormat`.

### SSR

Server-safe: no `window`/`document`/`DOMParser` access in this control or in its parsing/formatting utilities.

### Lifecycle

`connectedCallback()` sets `maxlength` from `long` and, if `value` is non-empty and `shouldFormat()` is true, formats the initial `value` into `stagedValue` (and mirrors it onto the internal `_value`) without mutating the `value` property itself.

After connect, every subsequent write to the `value` property (`onValuePropertyChanged`) is silently ignored while the input has focus (`this.hasFocus`) — it only reparses/reformats `value` into `stagedValue` when the field is blurred. A host that pushes a new `value` while the user is actively typing in the field (e.g. a live update arriving mid-edit) sees no effect until the user tabs or clicks away; there is no warning or error, the write is just dropped for display purposes.

### Sizing and layout

Renders as a single-line input; sizing follows the shared input base's layout (`aiux-input`/`aiux-input-md`).

## Accessibility, localization, and customization

- **Accessibility:** the native `<input>` gets `aria-required` and `aria-invalid` (true when either the host-set `invalid` or this control's own validation-error flag is set).
- **Localization:** formatting errors raised inside `formatNumber` (e.g. "… is not a valid amount") are localized via `@lit/localize` `msg()`. Parsing errors raised inside `parseNumber` (e.g. "Could not parse … as a number/integer") are plain hardcoded English strings, not run through `msg()`.
- **Customization:** styling follows the shared `aiux-input` DaisyUI/Tailwind classes plus `controlStyles` (attribute `control-styles`) for inline overrides. No `::part()` styling surface is exposed.
