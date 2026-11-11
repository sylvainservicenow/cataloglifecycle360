# Time selector

> Source: `@servicenow/aiux-components-time-selector@4.0.2` · `components/external/time-selector/docs/usage/aiux-time-selector.md`

`<aiux-time-selector>` is a text input plus a clock button that opens a
column picker (hours, minutes, and AM/PM for 12-hour formats). Set `value` in
the configured `format`; the element validates typed input, updates `value`
itself when the user commits a time, and reports it through
`aiux-time-selector:value-set`. It never stores or submits the time; that is
the host's job.

Built in: format validation with an error state, infinite-scrolling columns,
and keyboard navigation in the picker. Seconds are never shown or emitted.

## Import

```js
import '@servicenow/aiux-components-time-selector';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-time-selector';

@customElement('my-start-time')
export class MyStartTime extends AIUXElement {
  @state() private _time = '09:30 AM';
  @state() private _error = '';

  render() {
    return html`
      <aiux-time-selector
        label="Start time"
        .value=${this._time}
        @aiux-time-selector:value-set=${(e: CustomEvent) =>
          (this._time = e.detail.value ?? '')}
        @aiux-time-selector:input-change=${() => (this._error = '')}
        @aiux-time-selector:invalid-set=${(e: CustomEvent) =>
          (this._error = e.detail.message)}
      ></aiux-time-selector>
      ${this._error ? html`<p class="text-error">${this._error}</p>` : ''}
    `;
  }
}
```

**What happens:** `value-set` fires 250 ms after the user commits a valid or
empty time (input `change`, i.e. blur or Enter, or closing the picker after
selecting). Invalid typed text shows the error border and fires
`invalid-set`; `value` is not changed. The element does not render the error
message, and clears its error state on the next keystroke or picker selection
(`input-change`). Host state lags the commit by 250 ms, so a Save click right
after blur can read the previous value.

### Additional patterns

24-hour format with a dot separator:

```js
html`<aiux-time-selector
  format="HH.mm"
  value="14.45"
  size="sm"
></aiux-time-selector>`;
```

## API

### Properties and attributes

Attributes are lowercased property names; none reflect.

| Property         | Attribute          | Type           | Default         | Update behavior                        | Description                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ------------------ | -------------- | --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `value`            | `string`       | `''`            | Updates immediately                    | Time in the output form of `format`: 12-hour `hh:mm AM` / `hh.mm PM`, 24-hour `HH:mm` / `HH.mm`. Hours may be one or two digits; AM/PM is case-insensitive. An unparseable value is shown as typed with the error state and fires `invalid-set`. `''` clears. The element sets `value` itself on each commit. Setting it never fires `value-set`. |
| `format`         | `format`           | `string`       | `'HH:mm:ss aa'` | Updates immediately; re-parses `value` | Supported: `HH:mm aa`, `HH.mm aa`, `hh:mm a`, `hh.mm a` (12-hour), `HH:mm`, `HH.mm` (24-hour), each optionally with `:ss`/`.ss`, which is stripped. Any other string falls back to the default (12-hour, colon) with a console warning. A Config Editor value overrides it.                                                                       |
| `size`           | `size`             | `'sm' \| 'md'` | `'md'`          | Updates immediately                    | Height 32 px or 40 px. A Config Editor value overrides it.                                                                                                                                                                                                                                                                                        |
| `disabled`       | `disabled`         | `boolean`      | `false`         | Updates immediately                    | Disables the input and the clock button.                                                                                                                                                                                                                                                                                                          |
| `readonly`       | `readonly`         | `boolean`      | `false`         | Updates immediately                    | Input is read-only and the picker does not open.                                                                                                                                                                                                                                                                                                  |
| `placeholder`    | `placeholder`      | `string`       | `''`            | Updates immediately                    | Empty uses `HH:MM AM` (12-hour) or `HH:MM` (24-hour), with the format's separator.                                                                                                                                                                                                                                                                |
| `label`          | `label`            | `string`       | `''`            | Updates immediately                    | `aria-label` of the input. Empty uses localized "Time input". Not rendered visibly.                                                                                                                                                                                                                                                               |
| `formattedValue` | read-only property | `string`       | —               | —                                      | Current selected time in the output form of `format`, or `''` when hours or minutes are unset.                                                                                                                                                                                                                                                    |

### Events

Each event is also dispatched with the same detail under a legacy name:
`aiux-timeselector-value-set`, `aiux-timeselector-input-change`,
`aiux-timeselector-invalid-set`. Listen to one name only, or handlers run twice.

| Event                             | `detail`                        | Delivery                          | Fires when                                                                                                                 | Notes                                                                                                                                |
| --------------------------------- | ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aiux-time-selector:value-set`    | `TimeSelectorValueSetDetail`    | Bubbles, composed, not cancelable | Debounced 250 ms after the input's `change` with a valid or empty value, or after the picker closes following a selection. | `value` is `null` and `isCleared` is `true` when the input was emptied. Not fired for invalid input or programmatic `value` changes. |
| `aiux-time-selector:input-change` | `TimeSelectorInputChangeDetail` | Bubbles, composed, not cancelable | Each keystroke in the input and each picker selection (click or arrow key).                                                | `isValid` is `true` for empty input.                                                                                                 |
| `aiux-time-selector:invalid-set`  | `TimeSelectorInvalidSetDetail`  | Bubbles, composed, not cancelable | The state changes from valid to invalid: committed typed input or a set `value` that does not parse.                       | Not fired again while already invalid, nor when the error clears (typing, a picker selection, or a valid value clears it).           |

### Slots

None.

### Methods

None.

### Data shapes

```ts
interface TimeSelectorValueSetDetail {
  value: string | null; // null when cleared
  isCleared: boolean;
}

interface TimeSelectorInputChangeDetail {
  value: string; // raw input text
  isValid: boolean;
}

interface TimeSelectorInvalidSetDetail {
  message: string; // localized "Invalid time: {value}. Must be a valid time in the format {pattern}"
  value: string;
}
```

These types are not exported from the package entry.

## Integration details

### Sizing and layout

- `display: inline-block`; fixed width of 140 px at both sizes.
- The picker renders in a popover attached to `document.body`, placed below
  the input.

## Accessibility, localization, and customization

- **Accessibility:** set `label`; it is the input's only accessible name. The
  input has `aria-invalid` in the error state. In the picker: arrow Up/Down
  steps the focused column (wrapping), Tab/Shift+Tab moves between columns
  (wrapping), Enter closes, Escape or an outside click closes. Typing in the
  input closes the picker. Opening focuses the selected hour.
- **Localization:** ARIA labels, the default `label`, and the error message
  are localized. The placeholder, `AM`/`PM`, and the value format are not.
- **Customization:** no parts or element-specific custom properties. Input
  and button colors use the theme tokens `--color-background-primary`,
  `--color-background-secondary`, `--color-border-default`, `--color-error`,
  and `--radius-field`.
