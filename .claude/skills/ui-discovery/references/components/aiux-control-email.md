# aiux-control-email

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-email.md`

A form-field control for a single email address value. It wraps `aiux-control-input`, checks the entered value against an email format pattern, and renders a mailto envelope icon inside the field.

Built in: email format validation (standard or RFC 6530 internationalized), and a mailto envelope affordance that links to the current value. Do not build your own email-format regex or mailto icon — configure this control instead.

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
    email: {type: String},
    isInvalid: {type: Boolean}
  };

  render() {
    return html`
      <aiux-control-email
        name="email"
        label="Email"
        .value=${this.email ?? ''}
        ?invalid=${this.isInvalid}
        @AIUX_CONTROL_EMAIL#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-email>
    `;
  }

  _onCommit(e) {
    const {value, error} = e.detail;
    this.email = value;
    this.isInvalid = Boolean(error);
  }
}
```

**What happens:** typing dispatches `AIUX_CONTROL_EMAIL#STAGED_VALUE_CHANGED` on every keystroke; committing (blur/Enter, per `aiux-control-input`) dispatches `AIUX_CONTROL_EMAIL#VALUE_CHANGED` and updates the component's own `value`. Validation is non-blocking — a malformed address still commits and still fires the event, with an `error` object in `detail` describing the problem. The host is responsible for reading `error` and setting `invalid`/`messages` back onto the element; the component does not set its own `invalid` state.

### Additional patterns

Internationalized (RFC 6530) email addresses:

```js
html`<aiux-control-email
  name="email"
  label="Email"
  value=${this.email}
  internationalizedemail
></aiux-control-email>`;
```

Gotcha: the two modes validate differently, not just "stricter vs. looser." Standard mode rejects consecutive dots anywhere in the address (`a..b@x.com` fails) and requires the domain's final label to be purely alphabetic and at least 2 characters (so a TLD like `.app1` or `.io2` fails validation even though it resolves fine in practice). Internationalized mode drops those two restrictions — it only requires a single `@`, a non-empty local part, and a domain with no empty dot-separated label — so turning on `internationalizedemail` can make a previously-invalid-looking address pass. Pick the mode based on whether the field actually needs to accept non-ASCII addresses, not just to "relax" validation.

Hiding the mailto envelope icon:

```js
html`<aiux-control-email
  name="email"
  label="Email"
  value=${this.email}
  hideemailicon
></aiux-control-email>`;
```

## API

### `aiux-control-email`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Read on every render; updated internally when a commit event fires. | The email address value. |
| `maxlength` | `maxlength` | `number \| undefined` | `undefined` | Forwarded to the inner `aiux-control-input`. | Maximum character length. |
| `internationalizedEmail` | `internationalizedemail` | `boolean` | `false` | Read at validation time. | Validates against RFC 6530 internationalized rules instead of the standard ASCII pattern. |
| `hideEmailIcon` | `hideemailicon` | `boolean` | `false` | Read in `render()`. | Hides the mailto envelope icon. |
| `placeholder` | `placeholder` | `string` | `''` | Forwarded to the inner input; falls back to `'emailaddress@domain.com'` when empty. | Placeholder text. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Read in `render()` to hide the envelope icon. | Disables the field. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Read in `render()`; determines whether the mailto `href` is present (omitted when `invalid`). | Marks the field invalid. Must be set by the host — not derived automatically from validation. |

Also inherited from the shared control base (`AIUXControlElement`/`ControlIdentityBase`): `name`, `label`, `labelUrl`/`labelUrlTarget`, `required`, `readonly`, `autofocus`, `nowId` (attribute `now-id`), `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator` (attribute `show-ai-indicator`), `showUnsavedIndicator` (attribute `show-unsaved-indicator`), `editMode` (attribute `edit-mode`, reflected), `variant` (reflected), `nowAssistConfig`, `referringRecordId` (attribute `referring-record-id`), `referringTable` (attribute `referring-table`), `fieldContextMenu`, `helperText`.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_EMAIL#STAGED_VALUE_CHANGED` | `{name: string, value: string, displayValue: string}` | `bubbles: true, composed: true, cancelable: true` | The inner input's value changes before commit (mirrors `aiux-control-input`'s `AIUX_CONTROL_INPUT#STAGED_VALUE_CHANGED`). | `value` and `displayValue` are always equal (no separate display formatting). |
| `AIUX_CONTROL_EMAIL#VALUE_CHANGED` | `{name: string, value: string, displayValue: string, error?: {type: 'error', message: string}}` | `bubbles: true, composed: true, cancelable: true` | The inner input commits a changed value (blur/Enter). | Does not fire if the committed value equals the current `value`. `error` is present only when the value is non-empty and fails the format check; a malformed value still commits. |

#### Slots

None. (The mailto envelope is rendered into the inner `aiux-control-input`'s `end` slot internally — it is not a slot on this component itself.)

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Forwards focus to the inner `aiux-control-input`. |

### Data shapes

`EmailStagedValueChangedDetail`:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Field name. |
| `value` | `string` | Current staged value. |
| `displayValue` | `string` | Same as `value`. |

`EmailValueChangedDetail` (`EmailStagedValueChangedDetail` plus):

| Property | Type | Description |
| --- | --- | --- |
| `error` | `{type: 'error', message: string}`, optional | Present when the committed value fails format validation. `message` is localized via `@lit/localize`. |

## Integration details

No additional requirements.

### Platform requirements

None beyond `aiux-control-input`, which this component loads as a static import.

### SSR

Server-safe: no `window`/`document` access in render or validation logic.

### Lifecycle

None beyond standard Lit property updates.

### Sizing and layout

Renders as a single-line input; sizing follows `aiux-control-input`'s own layout.

## Accessibility, localization, and customization

The mailto link's `aria-label` includes the current email address (e.g. "Send email to user@example.com") or a generic "Send email" when empty — both localized via `@lit/localize` `msg()`, not host-settable strings, though they embed host data (the email value). The embedded address is wrapped in Unicode bidi-isolate characters (U+2068/U+2069) so the label reads correctly when the address itself contains RTL characters inside an otherwise LTR sentence. The validation error message is likewise localized but not customizable by the host (it always describes either the standard or RFC 6530 format). No dedicated `::part()`/CSS custom property styling surface beyond `control-styles` and whatever `aiux-control-input` exposes.
