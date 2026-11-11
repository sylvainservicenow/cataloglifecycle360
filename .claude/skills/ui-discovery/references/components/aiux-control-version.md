# aiux-control-version

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-version.md`

A text-input form-field control for version-number values in dot-decimal notation (`1`, `1.2`, `1.2.3.4`, `.5`, and so on). The host sets `value` and standard form-field metadata (`label`, `name`, `required`, etc.); the control reports edits back via its own value-changed events and flags the value invalid on blur when it doesn't match the dot-decimal pattern.

Built in: dot-decimal format validation on blur, staged (not-yet-committed) value tracking while typing, and the shared form-field chrome (label, helper text, messages, decorations) from the control base. Do not build a version-format text input yourself — use this element.

**Value ownership.** The control never corrects or reformats what the user typed — it only flags it invalid. The host owns persistence: write `detail.value` back into the property bound to `.value` on every `VALUE_CHANGED`, the same way you would for any controlled input. Skip that and the next external re-render still shows the control's own internal `stagedValue` (because nothing changed `value`, there's nothing to resync from), so the control *looks* unaffected — but if the host later re-renders with a stale `value` for an unrelated reason, the user's edit is silently discarded in favor of the old value. The reverse mistake is more common and sharper-edged: pushing a corrected or server-normalized `value` into the control **while the user still has it focused** is a no-op for the display. The base class only resyncs `stagedValue` from `value` when the control does not currently have focus, so a mid-edit external update is dropped from what's on screen and is never re-applied later, even after blur — there's no event, no retry, nothing. Only push `value` updates when you know the field is blurred (e.g., right after the user's own `VALUE_CHANGED` commit, or before the field is first focused).

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

class PluginVersionField extends AIUXElement {
  static properties = {
    pluginVersion: {type: String},
    _canSave: {type: Boolean, state: true}
  };

  constructor() {
    super();
    this.pluginVersion = '1.4.0';
    this._canSave = true;
  }

  render() {
    return html`
      <aiux-control-version
        name="plugin_version"
        label="Plugin version"
        required
        helper-content="Dot-decimal, e.g. 1.4.0"
        .value=${this.pluginVersion}
        @AIUX_CONTROL_VERSION#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-version>
      <button ?disabled=${!this._canSave}>Save</button>
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    this.pluginVersion = value;
    this._canSave = !error;
  }
}
```

**What happens:** every keystroke updates the control's own `stagedValue` and, after it has settled for about 250ms, dispatches `AIUX_CONTROL_VERSION#STAGED_VALUE_CHANGED` with the in-progress text — useful for a live preview, but nothing the host must act on. Nothing is validated and nothing is committed until the field blurs. On blur, the control checks the text against the dot-decimal pattern and dispatches `AIUX_CONTROL_VERSION#VALUE_CHANGED` exactly once: if the text is empty or valid, `detail.error` is `undefined`; if it's malformed (e.g. `1..2` or `v1.4`), `detail.error` is populated *and* the control marks itself invalid on its own (via `computedInvalid`), independent of whatever the host does with `detail.error`. The handler above uses that to gate the Save button — but the control was already showing the red/invalid state before the handler ran, since `computedInvalid` is recomputed from the control's own `_hasValidationError` state, not from anything the host passes back in.

### Additional patterns

Marking the field invalid from outside (e.g. a server-side validation failure) by setting the `invalid` attribute directly — this is combined (OR'd) with the control's own format check, so the field stays invalid until both the host clears `invalid` and the text is a valid version:

```js
html`<aiux-control-version invalid name="version" label="Version" .value=${this.version}></aiux-control-version>`;
```

Normalizing the committed value server-side (e.g. collapsing `1.4.00` to `1.4.0`) and pushing the corrected string back into the control. This only takes effect if the field is not focused when you set it — do it right after the commit handler runs, before the user has a chance to refocus and keep typing:

```js
async _onValueChanged(e) {
  const normalized = await normalizeVersionOnServer(e.detail.value);
  this.version = normalized; // safe: field just blurred, so it isn't focused
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | String | `''` | Reactive; re-syncs the staged/displayed text when set externally. | The version string. |
| `placeholder` | `placeholder` | String | `''` | Reactive. | Native input placeholder. |
| `autofocus` | `autofocus` | Boolean | `false` | Reactive. | Focuses the input on first render. |
| `readonly` | `readonly` (reflect) | Boolean | `false` | Reactive; also suppresses blur-time validation dispatch. | Read-only state. |
| `disabled` | `disabled` (reflect) | Boolean | `false` | Reactive. | Disabled state. |
| `label` | `label` | String | `''` | Reactive. | Field label text. |
| `labelUrl` | `label-url` | String | `undefined` | Reactive. | Makes the label a link to this URL. |
| `labelUrlTarget` | `label-url-target` | String | `'_blank'` | Reactive. | `target` for the label link. |
| `name` | `name` | String | `''` | Reactive. | Field name; included in every dispatched event's `detail`. |
| `required` | `required` (reflect) | Boolean | `false` | Reactive. | Shows the required indicator and native `required` attribute. |
| `invalid` | `invalid` (reflect) | Boolean | `false` | Reactive; OR'd with the control's own format-validation result. | Host-set invalid flag. |
| `nowId` | `now-id` | String | `''` | Reactive. | Identifier used for ARIA wiring instead of `name`. |
| `controlStyles` | `control-styles` | String | `''` | Reactive. | Raw CSS declarations applied to the input (admin field-style parity). |
| `type` | `type` | String | `'text'` | Reactive, but has no rendering effect on this control — see below. | Inherited from the base text-input control; overridden internally. |
| `pattern` | `pattern` | String | `''` | Reactive. | Native `pattern` attribute on the input. |
| `max` | `max` | Number | `undefined` | Reactive. | Native `max` attribute on the input. |
| `min` | `min` | Number | `undefined` | Reactive. | Native `min` attribute on the input. |
| `maxlength` | `maxlength` | Number | `undefined` | Reactive. | Native `maxlength` attribute on the input. |
| `minlength` | `minlength` | Number | `undefined` | Reactive. | Native `minlength` attribute on the input. |
| `step` | `step` | Number | `undefined` | Reactive. | Native `step` attribute on the input. |
| `multiple` | `multiple` | Boolean | `false` | Reactive. | Native `multiple` attribute on the input. |
| `selection` | `selection` | Object | `undefined` | Not currently used. | Declared for parity with the shared text-input base; not read anywhere in this control's render or logic. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | Boolean | `false` | Reactive. | Enables the built-in translate-icon/dynamic-translation panel. |
| `fieldLayout` | `fieldLayout` | Object | `{layout: 'auto'}` | Reactive. | `{layout: 'vertical' \| 'horizontal' \| 'auto', columns?}`; `'auto'` resolves from container width. |
| `optional` | `optional` | Boolean | `false` | Reactive. | Shows an "optional" label suffix instead of a required indicator. |
| `helperContent` | `helper-content` | String | `''` | Reactive. | Helper text rendered below the field. |
| `helperText` | `helpertext` | String | `''` | Reactive. | Additional helper text (inherited from the control base). |
| `hideRequiredIndicator` | `hide-required-indicator` | Boolean | `false` | Reactive. | Suppresses the required indicator even when `required` is set. |
| `wrapLabel` | `wrap-label` | Boolean | `false` | Reactive. | Allows the label to wrap instead of truncating. |
| `messages` | `messages` (property) | Array | `[]` | Reactive. | Field messages (errors/warnings/etc.) rendered below the input. |
| `decorations` | `decorations` (property) | Array | `[]` | Reactive. | Label decorations (icons/badges). |
| `decorationWidgets` | `decorationWidgets` (property) | Array | `[]` | Reactive. | Widget tags rendered in the addon area. |
| `highlightedValue` | `highlightedValue` (property) | Array | `[]` | Reactive. | Status badges rendered at the label end when the value matches an entry. |
| `showAIIndicator` | `show-ai-indicator` | Boolean | `false` | Reactive. | Shows the AI-generated-content indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | Boolean | `false` | Reactive. | Shows the unsaved-change indicator. |
| `editMode` | `edit-mode` (reflect) | String | `'default'` | Reactive. | `'default' \| 'inline' \| 'display-only'`. |
| `variant` | `variant` (reflect) | String | `'default'` | Reactive. | `'default' \| 'compact'` visual density. |
| `nowAssistConfig` | `nowAssistConfig` (property) | Object | `undefined` | Reactive. | Now Assist Contextual Menu (NACM) configuration; enables the AI suggestion surface. |
| `referringRecordId` | `referring-record-id` | String | `''` | Reactive. | Record sys_id used by NACM/dynamic-translation lookups. |
| `referringTable` | `referring-table` | String | `''` | Reactive. | Table name used by NACM/dynamic-translation lookups. |

The `type` property is inherited but this control always renders its native input with `type="text"` (its `nativeInputType` accessor is hard-coded), so setting `type` has no visible rendering effect. It is still consulted internally as the field-type key for the dynamic-translation lookup when `dynamicTranslationEnabled` is set.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_VERSION#STAGED_VALUE_CHANGED` | `{name, value, displayValue}` | bubbles, composed, cancelable | Debounced ~250ms after each keystroke in the native `<input>`, as long as typing keeps happening (resets on every keystroke; fires once typing pauses). | Fires regardless of validity — staged text is never checked against the dot-decimal pattern. Not the generic `staged-value-changed` name — listen for this exact string. |
| `AIUX_CONTROL_VERSION#VALUE_CHANGED` | `{name, value, displayValue, error?}` | bubbles, composed, cancelable | On blur, once, regardless of whether the text changed — unlike plain `aiux-control-input`, this control does not compare against the previous `value` first. Never fires when `readonly` is true (`handleBlur` returns before building or dispatching anything). | `error` is `{type: 'error', message}` only when the text is non-empty and fails the dot-decimal regex; an empty string is always treated as valid, so clearing the field never reports an error. |

No `control-focus`, `control-blur`, or `invalid-set` events are dispatched by this control.

### Slots

| Slot | Description |
| --- | --- |
| `start` | Content placed before the input, inside the input's bordered container. |
| `end` | Content placed after the input, inside the input's bordered container (alongside the built-in translate icon when dynamic translation is enabled). |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the native `<input>`. No-op if the input isn't in the DOM yet. |
| `reset()` | Clears `value` and internal staged/touched/error state back to defaults. |

## Integration details

No additional requirements.

### Platform requirements

None beyond a standard custom-element host; the control renders a plain `<input>` internally.

### SSR

The control's render path is plain Lit template output (no `window`/`document` access in `render()`), so it is SSR-safe.

### Lifecycle

On `connectedCallback()`, the staged (displayed) value is initialized from `value`. Blur-time validation only runs when the control is not `readonly`.

### Sizing and layout

Renders at `w-full` inside its layout container; `fieldLayout.layout` (`'auto'` by default) controls whether the label sits above or beside the input.

## Accessibility, localization, and customization

The native `<input>` gets `aria-label`/`aria-labelledby` derived from `label`/`name`, `aria-describedby` pointing at any visible messages, and `aria-invalid`/`aria-required` reflecting `invalid`/`required`. Keyboard interaction is the browser's native text-input behavior (no custom keyboard handling is added).

The validation error message ("... is not a valid version, must use dot-decimal notation.") and the default placeholder are produced through `@lit/localize`'s `msg()`, so they are localized automatically; host-supplied strings (`label`, `placeholder`, `helperContent`, `messages`) are rendered as given and are not translated by the control.

Styling hooks: `controlStyles` (raw CSS forwarded to the input), plus the `start`/`end` slots for inserting custom markup into the input's bordered container. There are no exposed `::part()` selectors.
