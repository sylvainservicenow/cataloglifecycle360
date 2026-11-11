# aiux-control-url

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-url.md`

Single-line URL input. Edits as a plain text field; in its inline (edit-on-demand) view, a non-empty value renders as a clickable link that opens in a new tab. On blur it validates the value as any well-formed absolute URL (via `new URL(value)` — no scheme restriction) unless `allowRelativeUrl` is set.

Built in: on-blur URL validation, edit-on-demand inline link rendering, and a clear button (when a value is present and the field isn't readonly). Do not build these yourself.

Gotcha: this package separately exports a `validateUrl()` helper (from the commons validation utilities) that *does* restrict to `http:`/`https:`/`ftp:` — but `aiux-control-url` does not call it. The control's own on-blur check (`isAbsoluteUrl`, via `new URL(value)`) is scheme-agnostic, so `mailto:`, `tel:`, and any other scheme that produces a well-formed absolute URL pass here even though they would fail `validateUrl()` elsewhere in the codebase. Don't assume the two checks agree.

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
      <aiux-control-url
        name="website"
        label="Website"
        .value=${'https://www.example.com'}
        @AIUX_CONTROL_URL#VALUE_CHANGED=${this._onChange}
      ></aiux-control-url>
    `;
  }

  _onChange(e) {
    const {name, value, error} = e.detail;
    // error is undefined when valid, or {type: 'error', message} otherwise
  }
}
```

**What happens:** typing dispatches `AIUX_CONTROL_URL#STAGED_VALUE_CHANGED` (debounced). On blur, if the value is non-empty and fails `new URL(value)` parsing (i.e. isn't a well-formed absolute URL), `AIUX_CONTROL_URL#VALUE_CHANGED` fires with an `error`; otherwise it fires with `error: undefined`. An empty value is always considered valid. In edit-on-demand mode, a saved value renders as a link, with the value sanitized (dangerous schemes like `javascript:`/`data:`/`vbscript:` are replaced with `'#'`) but not otherwise altered — a protocol-less or relative value is used as-is in the link's `href`, not prefixed with `http://`. Gotcha: `sanitizeUrl` only pattern-matches those three scheme prefixes; it does not reject a protocol-relative value like `//evil.example.com`. With `allowRelativeUrl` set, that value passes validation untouched and renders a link whose `href` the browser resolves to `https://evil.example.com` (same scheme as the current page) — scheme-based sanitization alone does not make an `allowRelativeUrl` field safe for untrusted input.

### Additional patterns

Accepting relative or non-standard values (e.g. `/api/v1/users`) by skipping validation entirely:

```js
html`
  <aiux-control-url
    name="path"
    label="Path"
    allow-relative-url
    .value=${'/api/v1/users'}
  ></aiux-control-url>
`;
```

Reacting to the clear button distinctly from a normal edit: clicking it commits immediately (no blur needed) with `value: ''` and `error: undefined`, so a handler that only cares about "did the user empty the field" doesn't need to special-case it separately from a blur-driven commit:

```js
_onChange(e) {
  const {value, error} = e.detail;
  if (error) return; // leave the invalid text in place; don't write it back
  this.website = value; // '' when cleared, the validated URL otherwise
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `allowRelativeUrl` | `allow-relative-url` | `boolean` | `false` | Read on blur. | When `true`, skips the absolute-URL check entirely — any non-empty value is accepted without an error. |

Also inherited from `InputBase`/`AIUXControlElement` and functional: `name`, `value`, `label`, `placeholder`, `readonly`, `required`, `invalid`, `maxlength`, `minlength`, `pattern`, `helperContent`, `fieldLayout`, `variant`, `editMode`, `wrapLabel`, `hideRequiredIndicator`, `messages`, `nowId`, `controlStyles`, `dynamicTranslationEnabled` (see note below).

Inherited but not currently used / not visibly effective on this control:
- `disabled` — `InputBase`'s native `<input>` never binds a `?disabled` attribute or a disabled CSS class, so setting `disabled` does not visually or functionally disable typing in this control (it only affects unrelated label rendering via the shared layout mixin).
- `type` — this control forces its native input's `type` to `'text'` regardless of what `type` is set to (avoids the browser's native `type="url"` constraint validation, which would conflict with this control's own on-blur validation).
- `max`, `min`, `step`, `multiple`, `selection` — inherited from `InputBase` but not meaningful for a text-based URL field; the control never reads them itself.
- `dynamicTranslationEnabled` — inherited from `InputBase`, but `aiux-control-url` fully overrides the end slot with its clear button, so the translate-icon trigger `InputBase` would otherwise render is never shown; the property has no visible effect here.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_URL#STAGED_VALUE_CHANGED` | `{name, value}` | bubbles, composed, cancelable | On every keystroke (debounced ~250ms). | Intermediate, unvalidated value as typed. |
| `AIUX_CONTROL_URL#VALUE_CHANGED` | `{name, value, error}` | bubbles, composed, cancelable | On blur when the value differs from the previous committed `value` or an error is present; also fires (with `value: ''`, `error: undefined`) when the clear button is clicked. | `error` is `undefined` when valid, or `{type: 'error', message}` when the value is non-empty, `allowRelativeUrl` is `false`, and `new URL(value)` throws (not a well-formed absolute URL of any scheme). |

### Slots

| Slot | Description |
| --- | --- |
| `start` | Inherited from `InputBase` — content before the input. |
| `end` | Inherited from `InputBase` — content after the input; the control's own clear button is rendered in this position when a value is present and the field is not readonly. |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?)` | Inherited — moves focus to the native `<input>`. |
| `reset()` | Inherited from the base control. |

## Integration details

No additional requirements.

### SSR

SSR-safe — no unguarded `window`/`document` access; all interaction handlers run in response to DOM events only.

### Lifecycle

None beyond the base control's standard connect/disconnect behavior.

### Sizing and layout

Uses the shared form-field grid layout (`fieldLayout`) and the standard `aiux-input` box styling from `InputBase`.

## Accessibility, localization, and customization

Built-in: the inline (edit-on-demand) link is a real `<a target="_blank" rel="noopener noreferrer">`, and the "Edit" and "Clear URL" buttons carry their own `aria-label`s; the underlying `<input>` gets the standard `aria-invalid`/`aria-required`/`aria-labelledby`/`aria-describedby` wiring from `InputBase`. The validation error message and button aria-labels are produced through `@lit/localize` `msg()` — hard-coded English source, not host-settable via a property, but translatable. Styling is Tailwind/DaisyUI-based (`aiux-input`, `aiux-link`) with no exposed `::part()` targets or CSS custom properties beyond the inherited `controlStyles` raw-CSS binding.
