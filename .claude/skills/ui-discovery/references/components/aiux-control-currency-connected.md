# AIUXControlCurrencyConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-currency-connected.md`

`aiux-control-currency-connected` is a form control for money-valued fields (`currency`, `price`, or `currency2`/FX). The host sets the numeric amount, the currency code, and locale/formatting options; the control renders a text input for the amount next to a currency-code selector, and reports both the raw numeric edits and the committed `CODE;amount` server-format value back to the host.

Built in: locale-aware number formatting and parsing (thousands/decimal separators derived from `Intl` or overridden by `formData.userSession`), a searchable currency-code dropdown (keyboard navigable, filterable by code/name/symbol), inline validation (required, non-numeric, and max-fraction-digit warnings), and an optional "edit in more detail" pencil button that resolves and opens the linked FX detail record (`fx_currency_instance`, `fx_currency2_instance`, or `fx_price`) via the Table API. Do not build these yourself.

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

class MyCurrencyHost extends AIUXElement {
  static properties = {
    amount: {type: String},
    code: {type: String},
    serverValue: {type: String}
  };

  constructor() {
    super();
    this.amount = '';
    this.code = 'USD';
    this.serverValue = '';
  }

  _onValueChanged(e) {
    if (isServer) return;
    // e.detail.value is "CODE;amount" (server format) — keep it separate from
    // `.value`, which expects the plain canonical amount. Feeding
    // `e.detail.value` straight back into `.value` round-trips the wrong shape.
    this.serverValue = e.detail.value;
    this.amount = e.detail.value.split(';')[1] ?? '';
  }

  _onCurrencyChanged(e) {
    if (isServer) return;
    this.code = e.detail.value.split(';')[0];
  }

  render() {
    return html`
      <div style="max-width: 320px;">
        <aiux-control-currency-connected
          label="Amount"
          name="amount"
          .value=${this.amount}
          code=${this.code}
          locale="en-US"
          field-type="currency"
          @AIUX_CONTROL_CURRENCY_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
          @AIUX_CONTROL_CURRENCY_CONNECTED#CURRENCY_CHANGED=${this._onCurrencyChanged}
        ></aiux-control-currency-connected>
      </div>
    `;
  }
}

customElements.define('my-currency-host', MyCurrencyHost);
```
**What happens:** The user types an amount and picks a currency from the dropdown. On blur the control formats the amount with locale separators, validates it, and dispatches `AIUX_CONTROL_CURRENCY_CONNECTED#VALUE_CHANGED` with the canonical `CODE;amount` server value. Picking a currency from the dropdown immediately dispatches `AIUX_CONTROL_CURRENCY_CONNECTED#CURRENCY_CHANGED`; the host is expected to write the new code back onto the `code` property.

**Gotcha:** `CURRENCY_CHANGED`'s `detail.value` is built the same way as `VALUE_CHANGED`'s — `''` whenever the amount field is empty, regardless of which currency was just picked. The example above's `e.detail.value.split(';')[0]` silently evaluates to `''` and loses the newly-picked code in that case; there is no other field in the event detail (no `displayValue`, no `meta`) that carries the code independently. If a user can pick a currency before typing an amount, this is a real gap: the host currently has no reliable way to read the picked code from this event when the amount is empty.

### Additional patterns
To restrict the field to a single, non-switchable currency, set `single-currency`. The dropdown trigger is then replaced by a static, non-interactive label showing the code and symbol (this lock does not apply to `field-type="currency2"`, whose dropdown remains interactive even when `single-currency` is set).

To show the currency options, populate `normalized-currency-codes` with `{value, displayValue, subLabel}` entries (e.g. `{value: 'EUR', displayValue: 'Euro (€)', subLabel: 'Euro'}`); the control derives each entry's symbol from the parenthesized suffix of `displayValue`, falling back to the code itself.

## API

### `aiux-control-currency-connected`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
|---|---|---|---|---|---|
| `value` | `value` (reflects) | `string` | `''` | Reformatted to locale display format whenever it changes (unless the change came from the user's own typing, which is already formatted) | The field's amount. Written by the host in canonical (period-decimal) format; the control reformats it for display using the current locale's separators. |
| `placeholder` | `placeholder` | `string` | `''` | — | Placeholder for the amount input. Falls back to `'0.00'` unless `field-type` is `currency2`, in which case no fallback placeholder is shown. |
| `autofocus` | `autofocus` | `boolean` | `false` | Focuses the amount input on `firstUpdated` | Autofocus the amount input on first render. |
| `readonly` | `readonly` (reflects) | `boolean` | `false` | Disables the currency dropdown trigger and marks the input readonly | Read-only mode. |
| `disabled` | `disabled` (reflects) | `boolean` | `false` | Inherited from the base control; not read by this component's own render logic | Not currently used by this control's render output — inherited property only. |
| `label` | `label` | `string` | `''` | — | Field label rendered by the shared form-field layout. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | — | Makes the label a link to this URL. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | — | `target` for the label link. |
| `name` | `name` | `string` | `''` | Used as the native `name` attribute, in dispatched event payloads, and to resolve the FX-instance lookup query | Field name. |
| `required` | `required` (reflects) | `boolean` | `false` | Enforced on blur validation | Marks the field required; empty value on blur produces an error message. |
| `invalid` | `invalid` (reflects) | `boolean` | `false` | Set internally on blur based on validation; reset to `false` on every keystroke | Error state, driving `aiux-input-error` styling and `aria-invalid`. |
| `nowId` | `now-id` | `string` | `''` | — | Inherited identity property; not read by this component's own render logic. |
| `controlStyles` | `control-styles` | `string` | `''` | — | Raw CSS declarations applied to the input (typography via `controlStylesMap()`) and the field wrapper (box styles via `containerControlStylesMap()` — these live on different DOM nodes for this control). |
| `code` | `code` | `string` | `'USD'` | Clears any pending dropdown selection once the host echoes it back | Currently selected currency code (ISO code, e.g. `'USD'`). Controlled: the host owns this property and must update it in response to `CURRENCY_CHANGED`. |
| `normalizedCurrencyCodes` | `normalized-currency-codes` | `Array<{displayValue: string; subLabel: string; value: string}>` | `[]` | Rebuilds the internal currency list and dropdown items | The list of selectable currencies. |
| `locale` | `locale` | `string` | `'en-US'` | Recomputes decimal/thousands separators and reformats the on-screen value | BCP-47 locale used for number formatting/parsing. |
| `maxFractionDigits` | `max-fraction-digits` | `number` | `4` | Affects formatting/validation once `useAllFractionDigits` is true | Maximum fraction digits allowed, when `use-all-fraction-digits` is set. Ignored for `field-type="currency2"` (always 12) and otherwise defaults effectively to 2 unless `use-all-fraction-digits` is true. |
| `minFractionDigits` | `min-fraction-digits` | `number` | `0` | Affects formatting | Minimum fraction digits shown. Effective minimum is `minFractionDigits || 2` (0 falls back to 2), except `field-type="currency2"` which always uses 0. |
| `useAllFractionDigits` | `use-all-fraction-digits` | `boolean` | `false` | Switches the effective max fraction digits between 2 and `maxFractionDigits` | When true, honors `maxFractionDigits` instead of the hardcoded default of 2. Ignored for `field-type="currency2"`. |
| `fieldType` | `field-type` | `string` | `''` | Changes fraction-digit defaults, placeholder behavior, dropdown lock exemption, and pencil/FX-lookup table | One of the currency-family field types (`'currency'`, `'price'`, `'currency2'`); see `FieldType` enum values `Currency`/`Price`/`Currency2`. |
| `searchPlaceholder` | `search-placeholder` | `string` | `''` | — | Placeholder text for the dropdown's search input. Falls back to a localized `'Search currencies'`. |
| `singleCurrency` | `single-currency` | `boolean` | `false` | Locks the dropdown to a static label (except for `currency2`) and hides the pencil | Restricts the field to one currency; the raw field-override/sysprop value. |
| `enableSearch` | `enable-search` | `boolean` | `true` | Shows/hides the search input in the dropdown panel and whether it receives focus on open | Enables the search box inside the currency dropdown. |
| `enableSubLabel` | `enable-sub-label` | `boolean` | `true` | Shows/hides each dropdown item's secondary text line | Shows the currency name as a sub-label under each dropdown item. |
| `currencySymbol` | `currency-symbol` | `string` | `'$'` | Used only as a last-resort fallback | Fallback symbol shown when the code is empty and no currency list entry is available. |
| `formData` | not an attribute (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | When it or `locale` changes, recomputes decimal/thousands separators (preferring `formData.userSession.decimalSeparator`/`groupingSeparator` over `Intl`, only when both are present) and reformats the value | Host session/form context bag. |
| `onOpenRecord` | not an attribute (`attribute: false`) | `(table: string, sysId: string) => void \| undefined` | `undefined` | Enables the edit pencil when set | Callback invoked with the resolved FX table name and sys_id when the pencil is clicked. |
| `hidePencil` | `hide-pencil` | `boolean` | `false` | Suppresses the pencil (currency field type only) | Mirrors classic's `glide.ui.currency.hide_pencil`; ignored for `currency2`, which gates on a role instead. |
| `editorIconRole` | `editor-icon-role` | `string \| undefined` | `undefined` | When set, the pencil requires this role (or `admin`) instead of respecting `hidePencil` (currency field type only) | Per-field role restriction on the pencil. |
| `isFieldModified` | `is-field-modified` | `boolean` | `false` | Disables (but does not hide) the pencil while true | Indicates an unsaved edit exists, so the pencil won't open a stale record. |

Inherited from the base control (`AIUXControlElement`/`ControlIdentityBase`/`FormFieldLayoutMixin`), also part of the public API:

| Property | Attribute | Type | Default | Update behavior | Description |
|---|---|---|---|---|---|
| `helperText` | `helpertext` (Lit default: lowercased property name) | `string` | `''` | — | Not rendered by this component's own template; the layout mixin instead renders `helperContent`/`messages`. |
| `helperContent` | `helper-content` | `string` | `''` | — | Helper text shown next to the label. |
| `optional` | `optional` | `boolean` | `false` | — | Shows an "optional" indicator instead of a required one. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | — | Suppresses the required-field asterisk. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | — | Allows the label text to wrap instead of truncating. |
| `messages` | `messages` (Lit default: lowercased property name; `type: Array`) | `ControlMessage[]` | `[]` | Internally overwritten with validation results, but restored to the host's own value if the host sets it to a non-empty array | Messages shown under the field. The control keeps its own error/warning messages in sync with this property using an internal "did we write this" tracking heuristic. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Rendered inline next to the label | Icon+text decorations shown in the label row. |
| `decorationWidgets` | `decorationwidgets` (Lit default) | `DecorationWidget[]` | `[]` | Rendered via `<aiux-widget-loader>` in the addon column | Widget-loader-backed decorations rendered alongside the control. |
| `highlightedValue` | `highlightedvalue` (Lit default) | `HighlightedValue[]` | `[]` | Rendered as badges when the current value matches an entry | Status badges tied to specific values. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | — | Shows an AI-generated indicator inline with the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | — | Shows an unsaved-change indicator. |
| `editMode` | `edit-mode` (reflects) | `FormFieldEditMode` | `FormFieldEditMode.DEFAULT` | Switches between default, inline edit-on-demand, and display-only rendering | Field edit mode. |
| `variant` | `variant` (reflects) | `FormFieldVariant` | `'default'` | Switches compact/default density classes | Visual density variant (e.g. `'compact'`). |
| `fieldLayout` | `fieldlayout` (Lit default; `type: Object`, not `attribute: false`) | `FieldLayout` | `{layout: 'auto'}` | Chooses horizontal vs. vertical label/control layout, or auto-detects | Layout configuration, including column widths for horizontal layout. |
| `nowAssistConfig` | `nowassistconfig` (Lit default; `type: Object`, not `attribute: false`) | `NacmConfig \| undefined` | `undefined` | Enables the Now Assist contextual menu surface | NACM configuration. Not exercised by this component's own render output beyond what the base NACM surface provides. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Required (along with a resolvable FX instance) for the pencil to appear | The host record's sys_id, used to resolve the FX detail record. |
| `referringTable` | `referring-table` | `string` | `''` | Used in the FX-instance lookup query | The host record's table name. |
| `fieldContextMenu` | not an attribute (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Enables right-click personalize/configure menu on the label | Field context menu configuration. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
|---|---|---|---|---|
| `AIUX_CONTROL_CURRENCY_CONNECTED#STAGED_VALUE_CHANGED` | `{meta, value: string, displayValue: string, name: string}` (`value`/`displayValue` both hold the raw, not-yet-committed input text) | `CustomEvent`, `bubbles: true`, `composed: true`, `cancelable: true` | 250ms after the user stops typing in the amount input (debounced) | Dispatched via the shared `dispatchAction()` helper; the action-type string itself is the event name (not the generic `staged-value-changed` from `EVENTS`). Cancelled if a blur happens first. |
| `AIUX_CONTROL_CURRENCY_CONNECTED#VALUE_CHANGED` | `{meta, value: string, displayValue: string, name: string, error?: {type: string; message: string}}` (`value` is the committed server format `CODE;amount` with a period decimal, or the raw invalid text when validation fails) | `CustomEvent`, `bubbles: true`, `composed: true`, `cancelable: true` | On blur, once formatting/validation completes — skipped if the field was empty before and stays empty | Not the generic `value-changed` string from `EVENTS`; this control uses its own namespaced action type. |
| `AIUX_CONTROL_CURRENCY_CONNECTED#CURRENCY_CHANGED` | `{meta, value: string, displayValue: string, name: string, error?: {type: string; message: string}}` (`value` uses the newly picked code, e.g. `'GBP;100'`) | `CustomEvent`, `bubbles: true`, `composed: true`, `cancelable: true` | Immediately when the user picks a currency from the dropdown (click or keyboard) | The host must write the new code back onto the `code` property; until it does, the control tracks the pending selection internally so `CURRENCY_CHANGED`'s own payload already reflects it. |

None of the shared `EVENTS` (`value-changed`, `staged-value-changed`, `control-focus`, `control-blur`, `invalid-set`) or `NUMBER_ACTIONS` (`sn-staged-change`, `sn-change`, `sn-parse-error`, `sn-format-error`, `sn-hold-raw-format-later`) constants are dispatched by this control — verified by grep of `dispatchEvent`/`EVENTS`/`NUMBER_ACTIONS` usage in `index.ts`; it dispatches only its own `ActionTypes` via `dispatchAction()`.

#### Slots

None.

#### Methods

| Method | Description |
|---|---|
| `focus()` | Overridden to focus the amount `<input>` (`[data-currency-input]`), not the base class's generic `_textareaEl`/`_inputEl` query. |
| `reset()` | Inherited from `AIUXControlElement`; clears `value`, `stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage`, and `invalid`. Does not reset `code`. |

### Data shapes

```ts
interface CurrencyField {
  type: 'currency' | 'currency2' | 'price';
  currencyCode?: string;
  defaultCurrency?: string;
  currencyCodes?: Array<{value: string; displayValue: string; subLabel: string}>;
  locale?: string;
  singleCurrency?: boolean;
  maxFractionDigits?: number;
  minFractionDigits?: number;
  useAllFractionDigits?: boolean;
  enableSearch?: boolean;
  enableSubLabel?: boolean;
  currencySymbol?: string;
  hidePencil?: boolean;
}

interface ValueChangeEvent {
  name: string;
  value: any;          // "CODE;amount" server format on success
  displayValue: string;
  error?: {type: string; message: string};
}

interface StagedValueChangeEvent {
  name: string;
  value: any;           // raw, not-yet-formatted typed text
  displayValue: string;
}
```

## Integration details

### Platform requirements
The edit pencil calls `fetch('/api/now/table/...')` with `credentials: 'include'` to resolve the FX detail record's sys_id, so it requires the standard ServiceNow Table API to be reachable from the host page. The pencil's role gate (`_pencilAllowedByGate`) also depends on `userContext` (from `@servicenow/aiux-components-core`) being populated with the current user's roles.

**Gotcha:** pencil visibility (`_showPencil`) is gated on `referringRecordId` being set, but not on `referringTable`. If you set one without the other, the pencil still renders and is clickable; the Table API query it builds on click (`table=<referringTable>^field=<name>^<parentField>=<referringRecordId>`) ends up with an empty `table=` clause, the request still succeeds, and it simply resolves no matching sys_id — the pencil click silently does nothing rather than erroring. Always set `referringTable` and `referringRecordId` together.

### SSR
The render path guards `toggleAttribute('data-open', ...)` behind `!isServer` in `willUpdate`. The FX-instance `fetch()` call only runs from the click handler, never during render, so it does not execute during SSR.

### Lifecycle
On `connectedCallback`, `stagedValue` is seeded from `value` (base class behavior). In `willUpdate`: a `locale`/`formData` change recomputes the cached separators and reformats the display value; a `value` change reformats it via the canonical-value formatter (skipped if the value already matches the control's own last-written output); a `normalizedCurrencyCodes` change only rebuilds the internal currency list and dropdown items (no reformat); and a `code` change only clears the pending dropdown selection (`_pendingCode`) once the host echoes it back — it does not recompute separators or reformat the value. `firstUpdated` autofocuses the input if `autofocus` is set. `disconnectedCallback` clears the pending 250ms staged-value debounce timer.

### Sizing and layout
The control renders as a flex row containing the amount input, the currency trigger/label, and (conditionally) the edit pencil as a sibling outside the input's bordered box. It fills its container's width; no fixed width is set internally. Standard host CSS (e.g. a `max-width` wrapper) controls overall sizing, matching the label/control grid columns from `fieldLayout`.

## Accessibility, localization, and customization

Keyboard support is built in: the currency trigger and dropdown items respond to Arrow Up/Down (open/navigate), Enter/Space (select), Escape (close), and Tab passthrough, via the shared `DropdownTeleportController`. The trigger has `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`; dropdown items carry `role="option"` and `aria-selected`. The amount input has `aria-label`, `aria-invalid`, and `aria-required`. The edit pencil is `aria-disabled` (not natively `disabled`) while `isFieldModified` is true, so it stays keyboard-focusable and its tooltip stays discoverable, but Enter/Space activation is suppressed in that state.

Hard-coded English strings (all via `@lit/localize` `msg()`, so they are translatable through the standard localization pipeline, not host-configurable at runtime): "Currency selection", "Select currency, {currencyLabel}" (the trigger button's aria-label, which always includes the current code/symbol — a standalone "Select currency" string is defined in source but never dispatched), "No items found", "Search currencies", "This field is required", "'{value}' is not a valid number", the fraction-digit-exceeded warning, "Edit the currency/price value in more detail", and "Save your changes to edit the value in more detail". Host-settable strings: `label`, `helperContent`, `placeholder`, `searchPlaceholder`, and any `messages`/`decorations` content.

Number formatting/parsing is fully locale-driven via `Intl.NumberFormat`: decimal and thousands separators are derived from the `locale` property (or overridden by `formData.userSession.decimalSeparator`/`groupingSeparator` when both are present), and the committed server value always normalizes to a period decimal regardless of locale. Currency symbols for codes not present in `normalizedCurrencyCodes` are derived via `Intl.NumberFormat` currency formatting, falling back to the raw code string if `Intl` doesn't recognize it.

Stylable via `controlStyles` (typography on the input, box styles on the field wrapper — these are different DOM nodes for this control) and standard Tailwind/DaisyUI utility classes (`aiux-input`, `aiux-btn`, etc.) used internally; `variant="compact"` switches to a denser button size.
