# AIUXControlIPAddress

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-ip-address.md`

A single-line text input specialized for IP addresses. It behaves like a plain text field while typing, then on blur strips redundant leading zeros from each IPv4 octet or IPv6 group and validates the result as a syntactically valid IPv4 or IPv6 address (including embedded-IPv4 and zone-index IPv6 forms).

Built in: IPv4/IPv6 syntax validation, leading-zero stripping per octet/group on blur (e.g. `010.002.003.004` → `10.2.3.4`), and the validation-error message. Do not write your own IP-address regex or leading-zero normalization.

**Value ownership and a mid-edit gotcha.** The control holds two internal copies of what the user typed: `stagedValue` (what's shown in the box) and an internal working value used for validation and for what gets dispatched on blur. `stagedValue` only resyncs from the `value` property while the field does **not** have focus, so a host re-render while the user is typing never visibly disturbs the box. The internal working value, however, resyncs from `value` on *every* property update regardless of focus. So if a parent re-renders and passes `value` back in while the user is mid-edit and paused without blurring — a stale prop, a debounce round-trip, an unrelated sibling update that happens to re-pass the old field value — the text the user sees stays correct, but the value that gets validated and dispatched on the eventual blur can silently revert to whatever `value` was last set to externally, not what's on screen. Treat `value` as something you only ever write back from this control's own `VALUE_CHANGED`/`STAGED_VALUE_CHANGED` events, never from an unrelated re-render.

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

class NetworkDeviceForm extends AIUXElement {
  static properties = {
    ip: {type: String},
    ipError: {type: Object}
  };

  constructor() {
    super();
    this.ip = '';
    this.ipError = undefined;
  }

  render() {
    return html`
      <aiux-control-ip-address
        name="ip_address"
        label="IP Address"
        required
        .value=${this.ip}
        ?invalid=${!!this.ipError}
        .messages=${this.ipError ? [{type: 'error', message: this.ipError.message}] : []}
        @AIUX_CONTROL_IP_ADDRESS#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-ip-address>
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    this.ip = value;
    this.ipError = error;
  }
}
customElements.define('network-device-form', NetworkDeviceForm);
```

**What happens:** every keystroke dispatches `AIUX_CONTROL_IP_ADDRESS#STAGED_VALUE_CHANGED` (debounced 250ms) with the raw, unvalidated typed text — useful for a live character counter or preview, but not for validation, since an in-progress address like `10.0.0.` is expected to look invalid mid-type. Only on blur does the control strip leading zeros from each octet/group and run `isIPAddress` against the result, then dispatch `AIUX_CONTROL_IP_ADDRESS#VALUE_CHANGED` with the normalized value and, if it failed validation, an `error` object. The example writes `value` and `error` straight back into `ip`/`ipError` and feeds `ipError` into `invalid`/`messages` on the next render — skip that write-back and the control's own `invalid`/`messages` properties never get set, since this control does not set them itself; the host owns surfacing the error. Nothing is dispatched at all on blur while `readonly` is set — not even an unvalidated echo of the typed text — so a readonly IP field never reports a value through this event.

### Additional patterns

Listening for the intermediate typed value (e.g. for a live preview) before it is committed on blur:

```js
html`
  <aiux-control-ip-address
    name="ip_address"
    @AIUX_CONTROL_IP_ADDRESS#STAGED_VALUE_CHANGED=${e => console.log(e.detail.value)}
  ></aiux-control-ip-address>
`;
```

Enforcing "required" on blur: setting `required` only adds the native `required`/`aria-required` attributes — the control never sets its own `invalid` state or synthesizes an error for an empty required field (an empty value blurs with `error` left `undefined`, same as a non-required empty field), so a required check has to be wired up by the host from the same `VALUE_CHANGED` handler already used for IP validation:

```js
_onValueChanged(e) {
  const {value, error} = e.detail;
  this.ip = value;
  this.ipError = error ?? (!value ? {type: 'error', message: 'IP address is required'} : undefined);
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | String | `''` | Re-renders; resyncs `stagedValue` from `value` while the field is not focused | The committed IP address text. |
| `name` | `name` | String | `''` | Re-renders | Field name, used as `name` in dispatched event details. |
| `label` | `label` | String | `''` | Re-renders | Field label text. |
| `placeholder` | `placeholder` | String | `''` | Re-renders | Native input placeholder. |
| `autofocus` | `autofocus` | Boolean | `false` | Re-renders | Autofocuses the native input on first render. |
| `readonly` | `readonly` (reflect) | Boolean | `false` | Re-renders | Renders the native input read-only; also skips validation/dispatch on blur. |
| `disabled` | `disabled` (reflect) | Boolean | `false` | Re-renders | Marks the field non-editable for label rendering (renders the label as a `<span>` instead of a `<label>` and suppresses the required asterisk) and hides the inline translate-icon affordance. Does not set the native `disabled` attribute on the underlying `<input>` — the input stays focusable/typable unless `readonly` is also set. |
| `required` | `required` (reflect) | Boolean | `false` | Re-renders | Sets `required`/`aria-required` on the native input. |
| `invalid` | `invalid` (reflect) | Boolean | `false` | Re-renders | Drives `aria-invalid` and the error styling; not set automatically by this control — the host is expected to set it from the `error` reported on `VALUE_CHANGED`. |
| `nowId` | `now-id` | String | `''` | Re-renders | Opaque identifier, inherited from the base control identity. |
| `controlStyles` | `control-styles` | String | `''` | Re-renders | Raw CSS declarations applied to the native input and its wrapper. |
| `fieldLayout` | `fieldLayout` | Object | `{layout: 'auto'}` | Re-renders | Vertical/horizontal/auto label layout. |
| `optional` | `optional` | Boolean | `false` | Re-renders | Shows an "Optional" label indicator instead of a required asterisk. |
| `helperContent` | `helper-content` | String | `''` | Re-renders | Text shown in a helper-info popover next to the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | Boolean | `false` | Re-renders | Suppresses the required asterisk on the label. |
| `wrapLabel` | `wrap-label` | Boolean | `false` | Re-renders | Wraps rather than truncates the label text (vertical layout only). |
| `messages` | `messages` (property) | `ControlMessage[]` | `[]` | Re-renders | Field-level messages rendered below the input. |
| `decorations` | `decorations` (property) | `Decoration[]` | `[]` | Re-renders | Rendered inline with the label. |
| `decorationWidgets` | `decorationWidgets` (property) | `DecorationWidget[]` | `[]` | Re-renders | Rendered in the addon column beside the input. |
| `highlightedValue` | `highlightedValue` (property) | `HighlightedValue[]` | `[]` | Re-renders | Renders status badges near the label. |
| `showAIIndicator` | `show-ai-indicator` | Boolean | `false` | Re-renders | Shows an AI-generated-value indicator inline with the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | Boolean | `false` | Re-renders | Shows an unsaved-changes dot next to the label. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Re-renders | Switches between the editable input and the compact read-state view. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Re-renders | Switches label/input density. |
| `nowAssistConfig` | `nowAssistConfig` (property) | `NacmConfig \| undefined` | `undefined` | Re-renders | Enables the Now Assist contextual menu surface (inherited; no IP-specific behavior). |
| `referringRecordId` | `referring-record-id` | String | `''` | Re-renders | Inherited from the base identity; only meaningful when `nowAssistConfig` is set. |
| `referringTable` | `referring-table` | String | `''` | Re-renders | Inherited from the base identity; only meaningful when `nowAssistConfig` is set. |
| `helperText` | `helperText` | String | `''` | Re-renders | Inherited from `AIUXControlElement`; not read by this control's own render logic. |
| `type` | `type` | String | `'text'` | Re-renders | Inherited from `InputBase`. Does not affect the rendered native input type — this control overrides `nativeInputType` to always return `'text'`. Still forwarded as the field type to the dynamic-translation controller. |
| `pattern` | `pattern` | String | `''` | Re-renders | Native `pattern` attribute on the input. |
| `max` | `max` | Number | `undefined` | Re-renders | Native `max` attribute on the input. |
| `min` | `min` | Number | `undefined` | Re-renders | Native `min` attribute on the input. |
| `maxlength` | `maxlength` | Number | `undefined` | Re-renders | Native `maxlength` attribute on the input. |
| `minlength` | `minlength` | Number | `undefined` | Re-renders | Native `minlength` attribute on the input. |
| `step` | `step` | Number | `undefined` | Re-renders | Native `step` attribute on the input. |
| `multiple` | `multiple` | Boolean | `false` | Re-renders | Native `multiple` attribute on the input. |
| `selection` | `selection` | `SelectionState \| undefined` | `undefined` | Re-renders | Not currently used — declared on `InputBase` but never read anywhere in this control's or the base input's own logic. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | Boolean | `false` | Re-renders | Enables the inline translate icon/panel (inherited generic input behavior; not IP-specific). |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_IP_ADDRESS#STAGED_VALUE_CHANGED` | `{meta?: any, name: string, value: string, displayValue: string}` | bubbles, composed, cancelable | Every native `input` event on the box, debounced 250ms — fires for every character typed, pasted, or deleted, including on an in-progress, not-yet-valid address. No readonly check here; a readonly input doesn't accept typing in the first place, so this never fires in practice while `readonly`. | `value`/`displayValue` are always equal (the raw typed text, no stripping or validation applied). Dispatched via the shared `dispatchAction()` helper, which always includes `meta` (`undefined` here). |
| `AIUX_CONTROL_IP_ADDRESS#VALUE_CHANGED` | `{meta?: any, name: string, value: string, displayValue: string, error?: {type: 'error', message: string}}` | bubbles, composed, cancelable | The input blurs. Does **not** fire at all — not even to report an unvalidated value — when `readonly` is `true`; the blur handler returns before doing any work. Also does not fire from an external `value` property change; only a real blur of the native input triggers it. | On every qualifying blur, leading zeros are stripped from each IPv4 octet or IPv6 group first (`010.002.003.004` → `10.2.3.4`) — this happens unconditionally, even if the result will fail validation. `error` is then set only when the stripped value is non-empty and fails `isIPAddress`; an empty value dispatches with `error` left `undefined`. Note that the IPv4 pattern itself already tolerates leading zeros per octet, so stripping them is purely a display normalization — a value like `010.002.003.004` would already validate successfully *before* stripping; the control just prefers to report the canonical form. |

### Slots

| Slot | Description |
| --- | --- |
| `start` | Content before the native input, inside the input box (inherited from `InputBase`). |
| `end` | Content after the native input, inside the input box (inherited from `InputBase`). Coexists with the built-in dynamic-translation icon, which also renders in this position. |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Inherited from `AIUXControlElement`; focuses the underlying native `<input>` (resolved via `InputBase`'s `@query('input')`). |
| `reset()` | Inherited from `AIUXControlElement`. Resets `value` and internal touched/error state to their defaults. |

### Data shapes

`FieldError` (the `error` detail on `VALUE_CHANGED`):

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | Always `'error'` for this control. |
| `message` | `string` | Localized message of the form `"⁨{value}⁩ is not a valid IP address"`. |

## Integration details

No additional requirements.

### Platform requirements

None beyond the package itself.

### SSR

No unguarded `window`/`document`/`localStorage` access in this control's own source.

### Lifecycle

`connectedCallback` seeds `stagedValue` from `value`. `stagedValue` re-syncs from `value` on any update where the field does not currently have focus (inherited from `AIUXControlElement`), so an externally-updated `value` while focused does not clobber what the user is typing.

### Sizing and layout

Renders inside the standard form-field grid (see `renderWithLayout`); the native input fills its container width.

## Accessibility, localization, and customization

The native `<input>` carries `aria-label`/`aria-labelledby` (derived from `label`/`name`), `aria-describedby` (pointing at visible field messages), `aria-invalid`, and `aria-required`, matching every other AIUX text-style input. The validation error message ("is not a valid IP address") is a hardcoded-English string wrapped in `@lit/localize`'s `msg()` — translated through the platform's localization pipeline, not host-settable; the offending value is interpolated into it. Styling is via the shared `aiux-input`/`aiux-input-md` utility classes and `controlStyles`/`containerControlStylesMap()` (parsed from the `control-styles` attribute); this control does not define its own CSS custom properties or `::part()` targets beyond what `InputBase` provides.
