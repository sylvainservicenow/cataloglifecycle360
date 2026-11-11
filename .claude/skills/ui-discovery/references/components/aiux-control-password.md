# AIUXControlPassword

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-password.md`

A form-field control that renders a single native `<input>`, masked by default, with an optional show/hide toggle. When `type="password2"`, it also implements the platform's password2 pattern: the field never receives the real secret on load, only an 8-character masked placeholder; revealing it fetches the real value on demand over GraphQL, scoped by `referringTable`, `referringRecordId`, and `name`.

Built in: mask/reveal toggling with a localized aria-label, commit-on-blur value reporting, debounced staged-value reporting while typing, and — for `type="password2"` — automatic re-masking of an already-masked incoming value, replacement of any real value with the masked placeholder before it is echoed back out, first-keystroke-clears-placeholder editing, and an on-demand GraphQL fetch of the real value when revealed. Do not build these yourself.

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

class MyPasswordField extends AIUXElement {
  static properties = {
    passwordValue: {type: String}
  };

  render() {
    return html`
      <aiux-control-password
        name="my_password"
        label="Password"
        type="password"
        showpasswordtoggle
        .value=${this.passwordValue ?? ''}
        @AIUX_CONTROL_PASSWORD#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-password>
    `;
  }

  _onValueChange(e) {
    const {name, value} = e.detail;
    this.passwordValue = value;
    // persist value, e.g. update this.passwordValue and request an update
  }
}
```

**What happens:** the field renders masked (native `type="password"`). With `showpasswordtoggle` set, an eye icon toggles the native input between masked and plain text — no network call for a plain `type="password"` field. Typing dispatches `AIUX_CONTROL_PASSWORD#STAGED_VALUE_CHANGED` on a debounce; blurring after an edit dispatches `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` once.

### Additional patterns

`type="password2"` fields never carry the real secret in `value` unless the user reveals it or edits it:

```js
html`
  <aiux-control-password
    name="admin_password"
    label="Admin password"
    type="password2"
    showpasswordtoggle
    referring-table="incident"
    referring-record-id=${this.recordSysId}
    .value=${this.password2Value ?? ''}
    @AIUX_CONTROL_PASSWORD#VALUE_CHANGED=${this._onValueChange}
  ></aiux-control-password>
`;
```

With `type="password2"`: if the incoming `value` is already the masked placeholder (all bullet characters), the control re-masks the field and clears its internal "edited" flag — so pushing the placeholder value again (e.g. after a parent re-render) forces a previously revealed field back to masked, even mid-session. If the incoming `value` is a real, unmasked string, the user hasn't started editing yet, **and the field is currently masked**, `onValuePropertyChanged` sets the *internal* `_value` to the masked placeholder and dispatches `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` with it — but it never reassigns `this.value` itself. `value` is `reflect: true`, so **the real secret stays on the host's `value` property and its reflected attribute** until the host's own `VALUE_CHANGED` handler writes the masked `detail.value` back onto `value`. Skip that, and the secret sits in the DOM (readable via the attribute/property) even though the on-screen input shows the mask. It is also rendered unmasked into the initial SSR output specifically: `inputDisplayValue` (the native `<input>`'s bound value) returns `this.value` when `isServer` is true, and only switches to the masked `_value` once hydrated on the client — so a server-rendered page embeds the real secret in its HTML for this one paint. That auto-replacement of `_value` is skipped while the field is revealed (`showPasswordToggle` clicked and not yet re-masked): if the host pushes a real value in that window, it is shown as-is in the UI. Clicking the reveal toggle (before any edit) fetches the real value over GraphQL using `referringTable`, `referringRecordId`, and `name`, and dispatches it via `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` once retrieved; a fetch error is shown below the field instead. Typing the first character clears the field to just that character (instead of appending to the masked placeholder) and marks the field as edited, after which the fetch-on-reveal behavior no longer applies. That "first character" is the native `InputEvent.data` for the keystroke — for an edit that has no character data (backspace, delete, or a paste/IME composition where `data` is `null`), the field is instead cleared to an empty string rather than removing one character from the placeholder.

**Host responsibility:** always write `detail.value` from `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` back onto the element's `value`. Skipping this leaves the real secret sitting in `value` (and its reflected attribute) indefinitely.

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects to attribute. For `type="password2"`, an incoming real value is **not** itself replaced — only the internal display state is masked (see **Host responsibility** below) and the real value stays on `value`/its attribute until the host writes the masked `detail.value` back. | The field's value. |
| `type` | `type` | `string` | `'text'` | Re-renders | Set to `'password'` for a plain masked field, or `'password2'` to enable the dual-value mask/fetch-on-reveal behavior described above. Any other value still renders as a native password/text input (masked by `masked` state) but without the password2-specific logic. |
| `showPasswordToggle` | `showpasswordtoggle` | `boolean` | `false` | Re-renders | Shows the eye/eye-slash reveal toggle in the field's end slot. When `false`, there is no way to unmask the field from the UI. |
| `readonly` | `readonly` | `boolean` | `false` (reflects) | Re-renders; sets the native `readonly` attribute and an internal `readonly` CSS class | Blocks editing and suppresses `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` dispatch on blur. For `type="password"` (or any non-`password2` type), `readonly` also hides the reveal toggle even if `showPasswordToggle` is set. For `type="password2"`, the reveal toggle stays available while `readonly`, so a read-only password2 field can still be revealed (and fetched). |
| `disabled` | `disabled` | `boolean` | `false` (reflects) | Re-renders; reflects onto the host element only | Suppresses `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` dispatch on blur. Does not hide the reveal toggle, and does not itself add a `disabled` attribute to the native input or any disabled styling. |
| `required` | `required` | `boolean` | `false` (reflects) | Re-renders; sets the native `required`/`aria-required` attributes | Marks the field required; drives the shared required-indicator next to the label (unless `hideRequiredIndicator` is set). |
| `invalid` | `invalid` | `boolean` | `false` (reflects) | Re-renders; sets `aria-invalid` and an `aiux-input-error` CSS class | Marks the field as invalid. This control does no validation of its own — the host is responsible for setting `invalid` (and typically a matching entry in `messages`). |
| `name` | `name` | `string` | `''` | Re-renders | Form field name. Echoed back in dispatched event details and used, with `referringTable`/`referringRecordId`, to fetch the real value for `type="password2"`. |
| `label` | `label` | `string` | `''` | Re-renders | Field label, rendered by the shared form-field layout above the input. |
| `referringTable` | `referring-table` | `string` | `''` | Re-renders | Table of the record this field belongs to. Required (with `referringRecordId` and `name`) to reveal a `type="password2"` field's real value. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Re-renders | Sys ID of the record this field belongs to. Required (with `referringTable` and `name`) to reveal a `type="password2"` field's real value. |
| `placeholder` | `placeholder` | `string` | `''` | Re-renders | Native placeholder text shown when `value` is empty. |
| `autofocus` | `autofocus` | `boolean` | `false` | Re-renders; sets the native `autofocus` attribute | Focuses the native input when it's first inserted into the DOM (native browser behavior). |
| `pattern`, `max`, `min`, `maxlength`, `minlength`, `step`, `multiple` | various | various | see native HTML attribute defaults | Forwarded directly to the native input, same as `aiux-control-input`. Not typically meaningful for a password field, but not blocked. |
| `selection` | `selection` | `{start: number; end: number}` (optional) | `undefined` | Not currently used. | Declared for consumers to pass a selection range, but nothing in this control reads it. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | `boolean` | `false` | Not currently used for this control's UI. | Inherited from the base input, but `aiux-control-password` fully replaces the end slot with the reveal toggle, so the translate icon never renders here even when this is set. |
| `nowId` | `now-id` | `string` | `''` | Re-renders | Identifier used by the platform. Not read by the inherited `aria-label` computation — same as `aiux-control-input`. |
| `controlStyles` | `control-styles` | `string` | `''` | Re-renders | Raw CSS declarations applied to the native input (typography-affecting ones) and to the surrounding field container (box-affecting ones). |
| `helperText` | `helpertext` | `string` | `''` | Declared, never read anywhere in `src/` | Dead property — despite the name, it has no rendering effect. Use `helperContent` instead. |
| `helperContent` | `helper-content` | `string` | `''` | Re-renders | Additional helper content rendered by the shared form-field layout, alongside `helperText`. |
| `labelUrl`, `labelUrlTarget` | `label-url`, `label-url-target` | `string`, `string` | `undefined`, `'_blank'` | Re-renders | Link rendered on the label by the shared form-field layout. |
| `fieldLayout`, `optional`, `hideRequiredIndicator`, `wrapLabel`, `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `variant`, `nowAssistConfig`, `formData`, `fieldContextMenu` | various | various | see base identity/layout properties | Standard form-field layout, decoration, and Now Assist context-menu properties rendered by the shared base classes this control extends; not overridden or given custom behavior by `aiux-control-password` itself. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_PASSWORD#STAGED_VALUE_CHANGED` | `{name, data, fieldValue, fieldElement}` | bubbles, composed, cancelable | On every native `input` event, debounced ~250ms | `data` is the `InputEvent.data` (the just-typed character, if any). Fires regardless of `readonly`/`disabled`. |
| `AIUX_CONTROL_PASSWORD#VALUE_CHANGED` | `{name, value}` | bubbles, composed, cancelable | On native `blur`, if the value changed while focused; also fired directly (not from a blur) when a `type="password2"` field auto-replaces an incoming real value with the masked placeholder, and when `fetchPassword2Value` resolves after a reveal | Does not fire on blur when `disabled` or `readonly` is set, or when the value is unchanged. The two non-blur firings above are not gated by `disabled`/`readonly`. |

### Slots

| Slot | Description |
| --- | --- |
| `start` | Content placed before the native input, inside the field container. |
| `end` | Content placed after the native input, inside the field container (in addition to the built-in reveal toggle when `showPasswordToggle` is set). |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the native `<input>`. |
| `reset()` | Resets `value` to `''` and clears internal touched/error/focus state. Does not reset the mask/reveal (`masked`) state. |

### Internal helpers (not importable)

`src/password/utils/password-utils.ts` defines `DEFAULT_MASKED_VALUE` (the 8-character bullet-point placeholder, `'••••••••'`, used as the masked value for `type="password2"` fields) and `isPasswordMasked(value: string) => boolean` (returns `true` if `value` consists entirely of bullet characters). Both are exported from that submodule, but `src/index.ts` only side-effect-imports `./password` and the package's `exports` map exposes just `"."` — so neither helper can actually be imported from `@servicenow/aiux-components-control`. Re-implement the bullet-placeholder check yourself if you need it.

## Integration details

### Platform requirements

Revealing a `type="password2"` field before it has been edited sends a GraphQL query (via the shared `graphQLClient`, hosted on this element) for `password2Query`, scoped by `tableName` (`referringTable`), `fieldName` (`name`), and `sysId` (`referringRecordId`). If any of those three are missing, the fetch is skipped and a localized error is shown below the field instead of making a request. Plain `type="password"` fields make no network calls.

### SSR

No unguarded `window`/`document` access in this component's own rendering path; safe to render on the server.

### Lifecycle

On `updated()`, when `value` changes, the password2-specific masking/placeholder logic runs (see **Additional patterns**) regardless of focus state — including whether the field currently has focus, so a value pushed by the host while the user is mid-edit is still subject to the masking/re-masking rules above. Toggling reveal (`toggleMask()`) is asynchronous when it triggers the password2 fetch; the field visually unmasks immediately, and the real value replaces the placeholder once the fetch resolves.

### Sizing and layout

Renders as a `w-full` flex row (`aiux-input aiux-input-md`) containing the `start` slot, the native input, and the `end` slot (reveal toggle); an error line renders below the field when a password2 fetch fails. Standard form-field label/messages layout wraps this via the shared layout mixin.

## Accessibility, localization, and customization

- **Accessibility:** the reveal toggle is a `<button type="button">` with a localized `aria-label` ("Show password" / "Hide password") that reflects its current action. The native input carries the same `aria-label`/`aria-labelledby`/`aria-describedby`/`aria-invalid`/`aria-required` wiring as `aiux-control-input`. Keyboard interaction with the native input is entirely native `<input>` behavior; the toggle button is natively focusable and activatable via keyboard.
- **Localization:** the reveal toggle's "Show password"/"Hide password" aria-labels and the "Missing referringTable, referringRecordId, or name" fetch-guard error are produced via `@lit/localize`'s `msg()` and are localizable. A GraphQL fetch failure's error message is the raw error text from the request and is not localized by this control. Label, placeholder, helper text, and messages are all host-supplied.
- **Customization:** no CSS custom properties or `::part()` selectors are exposed. Typography-affecting CSS in `controlStyles` is applied to the native input; box-affecting CSS (background, border, radius, shadow, sizing) is applied to the surrounding field container.
