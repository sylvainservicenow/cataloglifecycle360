# aiux-control-order-index

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-order-index.md`

A form-field control for entering a whole-number order/position index. Wraps `aiux-control-input` restricted to digits, normalizing typed input to a locale-formatted integer string on commit and emitting both the normalized display value and its parsed integer value. Host sets `value` (as a string, e.g. `"100,000"`), `name`, `label`, and `locale`; the control reports back a committed integer via `value-changed`-style events.

**Value ownership.** The control only reformats on commit (blur/enter) — it never reformats a `value` you set programmatically, so if you write an unformatted `"5000"` back from your own state after a commit instead of the `displayValue` the event gave you, the input will silently show `"5000"` until the user blurs it again and re-triggers formatting. Always persist `detail.displayValue` (not your own re-derivation of it) as the next `value`.

Built in: digit-only input pattern, locale-aware integer parsing/formatting (grouping separators), rounding of decimal input on commit, and revert-to-previous-value on unparseable or negative input. Do not build these yourself. The digit-only `pattern="[0-9]*"` forwarded to the inner input is an HTML5 validation hint, not a keystroke filter — the underlying element is `type="text"`, so the user can type letters, decimals, or a leading `-`; it is `normalize()`'s parse-on-commit step, not the pattern, that actually rejects or rounds that input.

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

class MyOrderIndexHost extends AIUXElement {
  static properties = {
    order: {type: String}
  };

  constructor() {
    super();
    this.order = '';
  }

  render() {
    if (isServer) return html``;
    return html`
      <aiux-control-order-index
        name="order"
        label="Order"
        .value=${this.order}
        @AIUX_CONTROL_ORDER_INDEX#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-order-index>
    `;
  }

  _onValueChanged(e) {
    const {value, displayValue} = e.detail;
    this.order = displayValue;
    // value is the parsed integer (number | null); persist as needed
  }
}

customElements.define('my-order-index-host', MyOrderIndexHost);
```

**What happens:** the user types digits into the inner input. On commit (blur/enter), the raw text is parsed as an integer per `locale`, rounded if it was a decimal, and re-rendered as a formatted string (e.g. `10.5` → `11`, or `100000` → `100,000` for `en-US`). The handler then updates the control's own `value` to that formatted string and dispatches `VALUE_CHANGED` with the parsed integer. If the result can't be parsed, or is negative, `normalize()` returns `null`, the control's `value` is left unchanged (so the input reverts to showing the prior formatted text on re-render), and nothing is dispatched — so a bad keystroke (`'abc'`, `'-300'`) is invisible to the host. Clearing the field entirely is different: an empty commit normalizes to `''`, which does differ from a non-empty prior value, so it *does* dispatch `VALUE_CHANGED` with `value: null, displayValue: ''` — treat `null` in the handler as "field was cleared," not as "nothing happened."

### Additional patterns

Listening for uncommitted keystrokes, e.g. to drive a live preview:

```js
html`
  <aiux-control-order-index
    name="order"
    label="Order"
    .value=${this.order}
    @AIUX_CONTROL_ORDER_INDEX#STAGED_VALUE_CHANGED=${e => {
      const {value, displayValue} = e.detail;
      // value may be null while the user is mid-type (e.g. "12a")
    }}
  ></aiux-control-order-index>
`;
```

Non-default locale (grouping separator changes accordingly):

```js
html`
  <aiux-control-order-index
    name="order"
    label="Order"
    locale="de-DE"
    .value=${'1000'}
  ></aiux-control-order-index>
`;
```

Clearing a previously-set order (handling the `null` commit explicitly rather than treating it as a no-op):

```js
_onValueChanged(e) {
  const {value, displayValue} = e.detail;
  this.order = displayValue; // '' when cleared
  if (value === null) {
    this._persistOrderCleared(); // e.g. unset order_index on the record
  } else {
    this._persistOrder(value);
  }
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| value | value (reflect) | String | `''` | Committed formatted value (e.g. `'100,000'`); re-rendered whenever the control commits a valid edit. | The current formatted integer string. |
| locale | locale | String | `'en-US'` | Read on every parse/format call. | BCP 47 locale used for parsing and grouping-formatting the integer. |
| maxlength | maxlength | Number | `undefined` | Forwarded to the inner input as its `maxlength`. | Maximum character length of the raw input. |
| placeholder | placeholder | String | `''` | — | Placeholder text shown when empty. |
| label | label | String | `''` | — | Field label text. |
| helperContent | helper-content | String | `''` | — | Hint text shown next to the label. |
| messages | messages (property) | Array | `[]` | — | Validation/status messages rendered below the control. |
| fieldLayout | fieldLayout (property only) | Object | `{layout: 'auto'}` | — | Layout mode/columns; forwarded to the inner input. |
| variant | variant (reflect) | String | `'default'` | — | Visual density (`'default'` \| `'compact'`); forwarded to the inner input. |
| disabled | disabled (reflect) | Boolean | `false` | — | Disables the control. |
| readonly | readonly (reflect) | Boolean | `false` | — | Read-only state. |
| required | required (reflect) | Boolean | `false` | — | Marks the field required (adds the required indicator via the layout mixin). |
| invalid | invalid (reflect) | Boolean | `false` | — | Error/invalid visual state. |
| autofocus | autofocus | Boolean | `false` | — | Autofocuses the inner input on connect. |
| showAIIndicator | show-ai-indicator | Boolean | `false` | — | Forwarded to the inner input; shows the AI-assisted indicator. |
| name | name | String | `''` | Included as `name` in every dispatched event's `detail`. | Field name identifier. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_ORDER_INDEX#VALUE_CHANGED` | `{name: string, value: number \| null, displayValue: string}` | Bubbles, composed, cancelable | Fires on commit (blur/enter) when **all** of: (1) the raw text parses to a non-negative integer, or to a decimal that rounds to one; (2) the resulting formatted string differs from the control's current `value`. An empty commit counts as a valid parse (formats to `''`) and fires if the prior value was non-empty. | Does **not** fire when the committed text is unparseable (`'abc'`), negative (`'-300'`), or formats to the exact same string already shown — in all three cases the control silently reverts/no-ops with no event and no visible error. `value` is the parsed integer, or `null` when the commit cleared the field; `displayValue` is the locale-formatted string (comma grouping for `en-US`, etc.). |
| `AIUX_CONTROL_ORDER_INDEX#STAGED_VALUE_CHANGED` | `{name: string, value: number \| null, displayValue: string}` | Bubbles, composed, cancelable | Fires on every keystroke in the inner input (debounced ~250ms by `aiux-control-input`), before commit — unlike `VALUE_CHANGED`, it fires unconditionally, even for invalid or unchanged text. | `value` is `null` whenever the raw text can't be parsed as a number (e.g. `'12a'`) or is empty — including mid-type states like a lone `'-'` or `'1,'`; `displayValue` always mirrors the raw, unformatted text exactly as typed (no grouping applied yet). |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Delegates focus to the nested `aiux-control-input`. Does not throw if the inner input isn't present yet. |

## Integration details

No additional requirements.

### Platform requirements

None beyond the standard AIUX runtime; no domain/table context is required.

### SSR

The control renders synchronously from `value`/`label`/etc. and does not touch `window`/`document` in `render()`, so it is SSR-safe.

### Lifecycle

No special lifecycle behavior beyond the base control (`connectedCallback` seeds `stagedValue` from `value`).

### Sizing and layout

Sized by the surrounding `fieldLayout` (`'auto'` resolves to horizontal at ≥480px container width, vertical below it, per the base form-field layout mixin). The inner input stretches to fill its layout cell.

## Accessibility, localization, and customization

`aiux-control-order-index` renders no DOM of its own beyond the nested `aiux-control-input` — `label`, `helperContent`, `messages`, `fieldLayout`, and `variant` are all forwarded straight through as property bindings, and the inner input owns the actual label/messages/layout rendering (including associating the label with the input for screen readers and keyboard `Tab` order). All UI copy this control's own code produces is silent — it has no user-facing English strings of its own; `label`, `placeholder`, and `helperContent` are entirely host-settable. Number parsing/formatting is locale-aware via the `locale` property (BCP 47), controlling the grouping separator shown in `displayValue`. No custom CSS parts or slots are exposed by this control; styling flows through the shared `controlStyles` property (parsed into inline declarations) and the inner `aiux-control-input`'s own styling surface.
