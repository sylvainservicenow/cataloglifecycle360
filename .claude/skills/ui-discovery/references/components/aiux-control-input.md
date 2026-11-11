# AIUXControlInput

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-input.md`

A form-field control that wraps a single native `<input>`. The host sets `type`, `value`, and validation-related attributes (`pattern`, `min`/`max`, `minlength`/`maxlength`, `step`); the control reports intermediate keystrokes and the committed edit back as two separate events.

Built in: debounced per-keystroke staged-change reporting, commit-on-blur value reporting (only when the value actually changed), `type="ip"` leading-zero octet normalization on blur, an optional dynamic-translation icon/panel, and ARIA `aria-label`/`aria-labelledby`/`aria-describedby` wiring derived from `name`, `label`, and `messages`. Do not build these yourself.

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

class MyTextField extends AIUXElement {
  static properties = {
    shortDescription: {type: String}
  };

  render() {
    return html`
      <aiux-control-input
        name="short_description"
        label="Short description"
        .value=${this.shortDescription ?? ''}
        @AIUX_CONTROL_INPUT#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-input>
    `;
  }

  _onValueChange(e) {
    const {name, value} = e.detail;
    this.shortDescription = value;
    // persist value, e.g. update this.shortDescription and request an update
  }
}
```

**What happens:** typing dispatches `AIUX_CONTROL_INPUT#STAGED_VALUE_CHANGED` on a ~250ms debounce for every keystroke; blurring the field after an edit dispatches `AIUX_CONTROL_INPUT#VALUE_CHANGED` once, committing the new value. Blurring without any edit dispatches nothing.

### Additional patterns

Listening for staged (intermediate) edits, and using `type="ip"` normalization:

```js
html`
  <aiux-control-input
    name="ip_address"
    label="IP address"
    type="ip"
    .value=${this.ipValue ?? ''}
    @AIUX_CONTROL_INPUT#VALUE_CHANGED=${this._onValueChange}
    @AIUX_CONTROL_INPUT#STAGED_VALUE_CHANGED=${this._onStagedChange}
  ></aiux-control-input>
`;
```

With `type="ip"`, leading zeros in each dot-separated octet (e.g. `192.068.001.010`) are stripped to `192.68.1.10` in the field and in `this.value` on blur — but **`AIUX_CONTROL_INPUT#VALUE_CHANGED` does not fire** for that change. `stripIPZeros` sets `this.value` to the stripped result as a side effect before the dispatch's equality check runs, so `value !== this.value` is already false by the time it's checked, and the `forceValueChange` flag meant to cover exactly this case ends up comparing the stripped value to itself — also false. The field and the property both end up normalized, but nothing tells the host. If you need to persist a stripped IP value, you cannot rely on this event for it.

Enabling the dynamic-translation icon/panel for a field tied to a specific record:

```js
html`
  <aiux-control-input
    name="short_description"
    label="Short description"
    dynamic-translation-enabled
    referring-table="incident"
    referring-record-id=${this.recordSysId}
    .value=${this.shortDescription ?? ''}
    @AIUX_CONTROL_INPUT#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-input>
`;
```

`referringTable`, `referringRecordId`, and `name` must all be set — they're the only way the control knows which field's translations to request. The enablement check runs once, the first time `dynamicTranslationEnabled` becomes `true`; toggling it off and back on later does not re-check, so set it to its final value up front rather than flipping it reactively.

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects to attribute; re-renders the native input's value (via Lit's `live()`, so it only overwrites what the user is typing when the property actually changes) | The field's current value. Single source of truth for the committed value. |
| `type` | `type` | `string` | `'text'` | Re-renders; sets the native input's `type` attribute | Native input type: `'text'`, `'email'`, `'number'`, `'tel'`, `'url'`, `'search'`, `'ip'`, `'date'`, `'time'`, `'datetime-local'`, `'month'`, `'week'`, `'color'`, `'file'`, `'hidden'`, `'range'`, or `'password'`. `'ip'` additionally enables leading-zero stripping on blur; the other values only affect native browser input behavior (keyboard, built-in validation, native pickers). |
| `pattern` | `pattern` | `string` | `''` | Re-renders; sets the native `pattern` attribute | Native HTML validation pattern, when set (empty string is omitted). |
| `max` | `max` | `number` (optional) | `undefined` | Re-renders; sets the native `max` attribute | Native HTML `max` constraint (relevant for `type="number"`/`"range"`/date-like types). |
| `min` | `min` | `number` (optional) | `undefined` | Re-renders; sets the native `min` attribute | Native HTML `min` constraint. |
| `maxlength` | `maxlength` | `number` (optional) | `undefined` | Re-renders; sets the native `maxlength` attribute | Native HTML max character length. |
| `minlength` | `minlength` | `number` (optional) | `undefined` | Re-renders; sets the native `minlength` attribute | Native HTML min character length. |
| `step` | `step` | `number` (optional) | `undefined` | Re-renders; sets the native `step` attribute | Native HTML `step` increment. |
| `multiple` | `multiple` | `boolean` | `false` | Re-renders; sets the native `multiple` attribute | Forwarded to the native input's `multiple` attribute. Only meaningful for input types that support it natively (e.g. `type="email"` with comma-separated addresses, `type="file"`); has no effect for plain text. |
| `selection` | `selection` | `{start: number; end: number}` (optional) | `undefined` | Not currently used. | Declared for consumers to pass a selection range, but nothing in this control reads it. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | `boolean` | `false` | Re-renders | Enables a translate icon in the field's end slot (replacing the default empty end slot) and a below-field translation panel. Requires `referringTable`, `referringRecordId`, and `name` to resolve which record/field to translate. |
| `placeholder` | `placeholder` | `string` | `''` | Re-renders | Native placeholder text shown when `value` is empty. |
| `autofocus` | `autofocus` | `boolean` | `false` | Re-renders; sets the native `autofocus` attribute | Focuses the native input when it's first inserted into the DOM (native browser behavior). |
| `readonly` | `readonly` | `boolean` | `false` (reflects) | Re-renders; sets the native `readonly` attribute and an internal `readonly` CSS class | Blocks editing (native browser behavior) and suppresses `AIUX_CONTROL_INPUT#VALUE_CHANGED` dispatch on blur. |
| `disabled` | `disabled` | `boolean` | `false` (reflects) | Re-renders; reflects onto the host element only | Suppresses `AIUX_CONTROL_INPUT#VALUE_CHANGED` dispatch on blur. Does not itself add a `disabled` attribute to the native input or any disabled styling — hosts that need the field visually and interactively disabled should pair this with their own styling/attribute handling, or rely on the shared design system's `:host([disabled])` rules if present at the app level. |
| `required` | `required` | `boolean` | `false` (reflects) | Re-renders; sets the native `required`/`aria-required` attributes | Marks the field required; drives the shared required-indicator next to the label (unless `hideRequiredIndicator` is set). |
| `invalid` | `invalid` | `boolean` | `false` (reflects) | Re-renders; sets `aria-invalid` and an `aiux-input-error` CSS class | Marks the field as invalid. This control does no validation of its own — the host is responsible for setting `invalid` (and typically a matching entry in `messages`). |
| `name` | `name` | `string` | `''` | Re-renders | Form field name. Echoed back in dispatched event details, used to build the native input's `id`/`aria-labelledby`/`aria-describedby`, and used as the fallback `aria-label` source when no `label` is set with a name. |
| `label` | `label` | `string` | `''` | Re-renders | Field label, rendered by the shared form-field layout above the input; also used as the input's `aria-label` when `name` is empty. |
| `labelUrl` | `label-url` | `string` (optional) | — | Re-renders | URL rendered as a link on the label, via the shared form-field layout. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Re-renders | `target` attribute for the `labelUrl` link. |
| `nowId` | `now-id` | `string` | `''` | Re-renders | Identifier used by the platform. Not read by this control's own `aria-label` computation — a source comment references it, but the code only branches on `name`/`label`/`value`/`readonly`. |
| `controlStyles` | `control-styles` | `string` | `''` | Re-renders | Raw CSS declarations applied to the native input (typography-affecting ones) and to the surrounding field container (box-affecting ones). |
| `helperText` | `helpertext` | `string` | `''` | Re-renders | Helper text rendered below the field by the base control class. |
| `helperContent` | `helper-content` | `string` | `''` | Re-renders | Additional helper content rendered by the shared form-field layout, alongside `helperText`. |
| `referringTable` | `referring-table` | `string` | `''` | Re-renders | Table of the record this field belongs to; required for dynamic translation. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Re-renders | Sys ID of the record this field belongs to; required for dynamic translation. |
| `fieldLayout`, `optional`, `hideRequiredIndicator`, `wrapLabel`, `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `variant`, `nowAssistConfig`, `formData`, `fieldContextMenu` | various | various | see base identity/layout properties | Standard form-field layout, decoration, and Now Assist context-menu properties rendered by the shared base classes this control extends; not overridden or given custom behavior by `aiux-control-input` itself. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_INPUT#STAGED_VALUE_CHANGED` | `{name, data, fieldValue, fieldElement}` | bubbles, composed, cancelable | On every native `input` event, debounced ~250ms | `data` is the `InputEvent.data` (the just-typed character, if any); `fieldValue`/`fieldElement` are the native input's current value/element. Fires regardless of `readonly`/`disabled`. |
| `AIUX_CONTROL_INPUT#VALUE_CHANGED` | `{name, value}` | bubbles, composed, cancelable | On native `blur`, only if the value actually changed since the field gained focus | Does not fire when `disabled` or `readonly` is set, when the value is unchanged, **or for `type="ip"` when only octet-zero-stripping changed the value** — see the gotcha above. |

### Slots

| Slot | Description |
| --- | --- |
| `start` | Content placed before the native input, inside the field container. |
| `end` | Content placed after the native input, inside the field container (in addition to the built-in translate icon when `dynamicTranslationEnabled` is set). |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the native `<input>`. |
| `reset()` | Resets `value` to `''` and clears internal touched/error/focus state. |

## Integration details

### Platform requirements

Dynamic translation (`dynamicTranslationEnabled`) checks enablement and requests translations over the platform's dynamic-translation API, scoped by `referringTable`, `referringRecordId`, and `name`. No platform calls are made when it is left unset.

### SSR

No unguarded `window`/`document` access in this component's own rendering path; safe to render on the server.

### Lifecycle

On `updated()`, whenever `value` changes, the internal staged value is re-synced to the new `value` — this runs unconditionally, regardless of whether the field currently has focus. If `dynamicTranslationEnabled` is set, translation-enablement is checked once, the first time it becomes true.

### Sizing and layout

Renders as a `w-full` flex row (`aiux-input aiux-input-md`) containing the `start` slot, the native input, and the `end` slot; standard form-field label/messages layout wraps this via the shared layout mixin.

## Accessibility, localization, and customization

- **Accessibility:** the native input carries `aria-label` (derived from `label` when `name` is absent, or explicitly cleared to `''` for a read-only empty field so it doesn't fall back to `aria-labelledby`), `aria-labelledby` (pointing at the rendered label when both `name` and `label` are set), `aria-describedby` (pointing at visible messages), `aria-invalid`, and `aria-required`. Keyboard interaction is entirely native `<input>` behavior.
- **Localization:** this control renders no hard-coded user-facing strings of its own; label, placeholder, helper text, and messages are all host-supplied.
- **Customization:** no CSS custom properties or `::part()` selectors are exposed. Typography-affecting CSS in `controlStyles` is applied to the native input; box-affecting CSS (background, border, radius, shadow, sizing) is applied to the surrounding field container.
