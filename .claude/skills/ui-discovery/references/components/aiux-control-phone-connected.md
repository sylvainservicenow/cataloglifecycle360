# aiux-control-phone-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-phone-connected.md`

Phone number input that operates in one of two modes depending on whether `countryCodes` is populated: **standard mode** (freeform entry, optional US formatting) or **E.164 mode** (country-code dropdown plus per-country format validation). It reports both intermediate keystrokes and a validated, committed value.

Built in: country-code resolution across prop/session/default sources, a searchable country dropdown, per-country phone-format fetching and validation (E.164 mode), US 10/11-digit auto-formatting (standard mode), and readonly/inline-view rendering. Do not build these yourself.

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

class MyForm extends AIUXElement {
  render() {
    return html`
      <aiux-control-phone-connected
        name="phone"
        label="Phone number"
        .value=${'5551234567'}
        @AIUX_CONTROL_PHONE_CONNECTED#VALUE_CHANGED=${this._onChange}
      ></aiux-control-phone-connected>
    `;
  }

  _onChange(e) {
    const {value, displayValue, error} = e.detail;
    // persist value; error is set when the entered number failed validation
  }
}
```

**What happens:** with `countryCodes` left empty, the control runs in standard mode — a plain phone input that formats 10/11-digit US numbers as `(XXX) XXX-XXXX` on blur (unless `formatUsPhone` is `false`). `AIUX_CONTROL_PHONE_CONNECTED#VALUE_CHANGED` fires on blur with the parsed value, formatted display value, and any validation error.

### Additional patterns

E.164 international mode — set `countryCodes` to enable the country dropdown and per-country format validation:

```js
html`
  <aiux-control-phone-connected
    name="phone"
    label="Business phone"
    .countryCodes=${[
      {code: '1', name: 'United States', value: '1'},
      {code: '44', name: 'United Kingdom', value: '44'}
    ]}
    countryCode="1"
    @AIUX_CONTROL_PHONE_CONNECTED#VALUE_CHANGED=${this._onChange}
  ></aiux-control-phone-connected>
`;
```

Listening for in-progress typing (not yet validated):

```js
html`
  <aiux-control-phone-connected
    name="phone"
    label="Phone"
    @AIUX_CONTROL_PHONE_CONNECTED#STAGED_VALUE_CHANGED=${e =>
      console.log('typing', e.detail.value)}
  ></aiux-control-phone-connected>
`;
```

## API

### Properties and attributes

Every property declared directly by this control (`name`, `label`, `placeholder`, `value`, `displayValue`, `countryCode`, `defaultCode`, `countryCodes`, `isStrictEnabled`, `formData`, `phoneAddon`, `messages`, `description`, `originalValue`, `formatUsPhone`, `liveUpdate`, `declarativeUiActions`, `declarativeActionsProps`, `dictionary`, `isModified`, `color`, `configAria`) omits an explicit `attribute:` name, so each one's HTML attribute is its property name **lowercased with no dashes** (e.g. the `countryCode` property is set via the `countrycode` attribute, not `country-code`). `disabled`, `readonly`, `required`, and `invalid` are inherited unchanged from the base control class and follow the same lowercased-no-dash default. `controlStyles` is also inherited from the base class, but the base class gives it an explicit `control-styles` attribute. Prefer setting these as Lit property bindings (`.countryCode=${...}`) over attributes.

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `''` | Read on every commit/dispatch. | Field name; echoed back in event `detail.name`. |
| `label` | `label` | `string` | `''` | Re-renders label; also used in the CTI call button's aria-label. | Visible field label. |
| `value` | `value` (reflects) | `string` | `''` | On change (and it differs from the internally tracked parsed value), reformats and re-displays. | Phone value — E.164 format (`+15551234567`) in E.164 mode, raw digits/string in standard mode. |
| `displayValue` | `displayvalue` (reflects) | `string` | `''` | Declared but not read by this control's own logic. | Not currently used — the control computes its own formatted display internally instead of reading this property. |
| `placeholder` | `placeholder` | `string` | `''` | — | Overrides the auto-generated placeholder (from the country's phone format in E.164 mode, or empty in standard mode). |
| `description` | `description` | `string` | `''` | Rendered as an `info`-status message ahead of any others. | Helper text shown as a message below the field. |
| `disabled` | `disabled` (reflects) | `boolean` | `false` | Reflected as a host attribute. | Not currently used for disabling input — this control does not forward `disabled` to its nested `aiux-control-input`, so the text field and country trigger remain interactive. |
| `readonly` | `readonly` (reflects) | `boolean` | `false` | Switches to the readonly display branch and disables the country-picker trigger button. | Renders a non-editable value (with `+<code>` prefix in E.164 mode) instead of the input. |
| `required` | `required` (reflects) | `boolean` | `false` | Forwarded to the nested input; shows the required indicator on the label. | Marks the field required. |
| `invalid` | `invalid` (reflects) | `boolean` | `false` | OR'd with any internal validation error when forwarded to the nested input. | Marks the field invalid regardless of internal validation state. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Takes precedence over any internally generated validation-error message (description message is still prepended). | External messages to show below the field. |
| `countryCodes` | `countrycodes` | `CountryCode[]` (`{code, name, value, displayValue?, display?}`) | `[]` | Populating this array switches the control into E.164 mode; triggers a territory/format fetch. | Available country codes for the dropdown. Empty = standard mode. |
| `countryCode` | `countrycode` | `string` | `''` | On change, updates the selected country and refetches its phone formats. | Currently selected country dial code (e.g. `'1'`). |
| `defaultCode` | `defaultcode` | `string` | `'61'` | Used only when no other source supplies a code. | Fallback country code (see resolution order below). |
| `isStrictEnabled` | `isstrictenabled` | `boolean` | `true` | Read on every parse/format pass. | See **Strict validation** below. |
| `formatUsPhone` | `formatusphone` | `boolean` | `true` | Read on every parse/format pass (standard mode only). | When `true`, formats 10/11-digit US numbers as `(XXX) XXX-XXXX`; when `false`, the value passes through unformatted. |
| `phoneAddon` | `phoneaddon` | `boolean` | `false` | Toggles the CTI call button. | Shows a call button (slot `end`) when `true` and a value is present. |
| `formData` | `formdata` | `object` (`{userSession?: {countryCallingCode?}}`) | `{}` | Read when resolving the effective country code. | Form-level context; only `userSession.countryCallingCode` is consulted. |
| `originalValue` | `originalvalue` | `string` | `''` | Compared (digits-only) against the input on blur. | Database value — if the typed number's digits match this, the original value/display is restored verbatim and no reformatting error is raised. |
| `controlStyles` | `control-styles` | `string` | `''` | Forwarded as-is to the nested `aiux-control-input`. | Raw CSS declarations applied to the primary interactive element. |
| `liveUpdate` | `liveupdate` | `object` | `{}` | Not currently used. | Declared but never read. |
| `declarativeUiActions` | `declarativeuiactions` | `unknown[]` | `[]` | Not currently used. | Declared but never read. |
| `declarativeActionsProps` | `declarativeactionsprops` | `object` | `{}` | Not currently used. | Declared but never read. |
| `dictionary` | `dictionary` | `object` | `{}` | Not currently used. | Declared but never read. |
| `isModified` | `ismodified` | `boolean` | `false` | Not currently used. | Declared but never read. |
| `color` | `color` | `string` | `'initial'` | Not currently used. | Declared but never read. |
| `configAria` | `configaria` | `object` | `{}` | Not currently used. | Declared but never read. |

Also inherited and functional: `helperContent` (attr `helper-content`, shown below the field), `fieldLayout` (attr `fieldlayout`, `{layout?: 'vertical'|'horizontal'|'auto', columns?: string[]}`), `variant` (attr `variant`, `'default'|'compact'`), `editMode` (attr `edit-mode`, reflects), `autofocus` (attr `autofocus`, forwarded to the nested input), `nowId` (attr `now-id`), `wrapLabel` (attr `wrap-label`), `hideRequiredIndicator` (attr `hide-required-indicator`), `labelUrl`/`labelUrlTarget` (attrs `label-url`/`label-url-target`).

#### Country-code resolution

The effective country code used before the user makes an explicit selection is resolved, in order, from:

1. `countryCode` prop (if set)
2. `formData.userSession.countryCallingCode`
3. `defaultCode` prop
4. First entry in `countryCodes`
5. Fallback: `'61'`

Once the user selects a country from the dropdown, that selection becomes the active country code directly (no re-resolution) until `countryCode` or `countryCodes` changes externally.

#### Strict validation (`isStrictEnabled`)

Only meaningful in E.164 mode. When `true` (default), an entered number is checked against the selected country's fetched phone-format patterns; a number that doesn't match any pattern is rejected with a country-specific error, and a matching number is reformatted using that country's template. When `false`, pattern matching is skipped entirely: the raw digits are accepted as-is (still rejected if they contain letters, or if the field is empty after digit-stripping), and no country-format reformatting is applied.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_PHONE_CONNECTED#VALUE_CHANGED` | `{name, value, displayValue, error}` | bubbles, composed, cancelable | On blur (with the parsed/validated value), and after a country change or `originalValue` match. | `value` is the parsed/E.164 value; `error` is `null` when valid or a `{type, message}` object. |
| `AIUX_CONTROL_PHONE_CONNECTED#STAGED_VALUE_CHANGED` | `{name, value}` | bubbles, composed, cancelable | On every keystroke in the phone input. | Intermediate, unvalidated value as typed. |

### Slots

| Slot | Description |
| --- | --- |
| `controls` | Projected into the nested input's `end` slot — additional trailing controls. |
| (none named) | No default (unnamed) slot. |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?)` | Moves focus to the nested phone-number input (not the country trigger). |
| `reset()` | Inherited from the base control: clears `value`, staged state, touched/error flags. |

## Integration details

Requires network access for E.164 mode: selecting a country or populating `countryCodes` triggers a GraphQL fetch of that country's phone-format patterns and, on connect, a fetch of `sys_phone_territory` records — these calls are aborted on disconnect.

### SSR

Rendering itself is SSR-safe; the country-format/territory fetches only run in `connectedCallback`, which does not execute during server rendering.

### Lifecycle

On connect, if `countryCodes` is non-empty, territories and the effective country's formats are fetched immediately. All in-flight requests are aborted on disconnect.

**Gotcha:** if a country-format fetch resolves while the input still has focus (`hasFocus`), `applyFormats` discards the result for reformatting purposes — it stores the formats for the next blur/validation pass but does not re-run parsing against the currently displayed text. A user who starts typing before the format fetch for a newly selected country completes will still get validated against the new country's rules on blur, just not reformatted live the instant the fetch lands.

### Sizing and layout

Uses the shared form-field grid layout (`fieldLayout`); the country dropdown renders as a `start`-slot button inside the nested input, sized to its own content.

## Accessibility, localization, and customization

Built-in: the country dropdown trigger and its popover list are keyboard-navigable (arrow keys, search-to-filter, `Escape` to close) via the shared dropdown controller, and the trigger exposes `aria-haspopup`, `aria-expanded`, and `aria-controls`. All validation and UI copy (dropdown aria-labels, search placeholder, empty-state text, "call" button label, error messages) is produced through `@lit/localize` `msg()` — none of it is hard-coded English, and none of it is host-settable (it is not exposed as a property). Styling is Tailwind/DaisyUI-based with no exposed `::part()` targets or CSS custom properties; use `controlStyles` to apply raw CSS declarations to the nested input's primary element.
