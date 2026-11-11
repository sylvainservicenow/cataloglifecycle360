# aiux-control-color

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-color.md`

A single-line color-value editor. The host sets `value` to a CSS color string (hex, a named CSS color, or `rgb()`); the control auto-prefixes a bare hex string with `#`, validates the result via `CSS.supports('color', ...)`, and reports the committed value back through its `value-changed`-style action event. It shows a swatch preview next to the input that tracks the current (valid) color and clears when the value is invalid.

Built in: hex auto-prefixing (`FF0000` → `#FF0000`), color validation (`CSS.supports`, with a `getComputedStyle` fallback when `CSS.supports` is unavailable), the swatch preview, and the invalid-color error message. Do not build these yourself.

Gotcha: the `getComputedStyle` fallback (used only when `CSS.supports` itself isn't available) detects validity by comparing the computed color against a `white` baseline, so it has to special-case `white`/`#FFF`/`#FFFFFF` explicitly — any other color that happens to *compute* to white (e.g. some `rgb()`/`hsl()` spellings of white) would otherwise be misreported as invalid. This path only matters in environments without `CSS.supports`, which modern browsers all have, but it means validation behavior for white-equivalent values isn't identical across the two code paths.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
// complete host component
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyColorField extends AIUXElement {
  static properties = {
    color: {type: String}
  };

  render() {
    return html`
      <aiux-control-color
        name="highlight_color"
        label="Highlight color"
        .value=${this.color ?? ''}
        @AIUX_CONTROL_COLOR#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-color>
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    if (!error) this.color = value;
  }
}
```

**What happens:** as the user types, the control debounces (250ms) and dispatches `AIUX_CONTROL_COLOR#STAGED_VALUE_CHANGED`. On blur, it fixes up a bare hex value, validates it, and dispatches `AIUX_CONTROL_COLOR#VALUE_CHANGED` with the (possibly corrected) value and an `error` when the color is invalid. The swatch and any error message update to match. Typing `ff5733` and blurring, for example, commits `#ff5733` (not the raw `ff5733`) because the hex fix-up runs before both the validity check and the dispatched `value` — a host that only compares against the text it rendered will see a changed value even though the user didn't touch the prefix.

### Additional patterns

When `nowAssistConfig` is set, a value committed by inserting a Now Assist suggestion does not go through this control's own commit path — it dispatches the shared text-input base's event instead, under a different event name and shape. Listen for both if the field can receive NACM suggestions:

```js
html`
  <aiux-control-color
    name="highlight_color"
    .value=${this.color}
    .nowAssistConfig=${this.nacmConfig}
    @AIUX_CONTROL_COLOR#VALUE_CHANGED=${this._onCommit}
    @AIUX_CONTROL_INPUT#VALUE_CHANGED=${this._onCommit}
  ></aiux-control-color>
`;

_onCommit(e) {
  // AIUX_CONTROL_COLOR#VALUE_CHANGED: {name, value, error?}
  // AIUX_CONTROL_INPUT#VALUE_CHANGED (NACM insert): {name, value, fieldValue}
  const {value, error} = e.detail;
  if (!error) this.color = value;
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Reactive; drives the swatch and, on the next render after a value change, resets the internal staged value | The current color string. |
| `label` | `label` | `string` | `''` | Reactive | Field label text (plain English/host-provided string, not localized by the control). |
| `name` | `name` | `string` | `''` | Reactive | Field name, echoed in every dispatched event's `detail.name`. |
| `placeholder` | `placeholder` | `string` | `''` | Reactive | Native input placeholder. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Reactive | Renders the input non-editable and suppresses the swatch and blur validation. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Reactive | Disables the control. |
| `required` | `required` (reflected) | `boolean` | `false` | Reactive | Marks the field required (label asterisk, native `required` on the input). |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Reactive; the control also sets this internally after a failed blur validation, combined with the host value via `this.invalid \|\| this._hasValidationError` | Forces/reflects the error visual state. |
| `nowId` | `now-id` | `string` | `''` | Reactive | Opaque identifier forwarded from the host record. |
| `controlStyles` | `control-styles` | `string` | `''` | Reactive | Raw CSS declarations (e.g. `color: red`) applied to the input's box and text via `styleMap()`. |
| `autofocus` | `autofocus` | `boolean` | `false` | Reactive | Forwarded to the native input's `autofocus`. |
| `helperText` | — (`attribute: false` not set; default Lit attribute `helpertext`) | `string` | `''` | Reactive | Helper text; not currently rendered by this control's own template (inherited from the base class for parity, but `aiux-control-color` does not read it). |
| `helperContent` | `helper-content` | `string` | `''` | Reactive | Rendered under the label by the shared form-field layout. |
| `fieldLayout` | `fieldlayout` (object property; set it via the `.fieldLayout` JS property, not the attribute) | `{layout?: 'vertical' \| 'horizontal' \| 'auto'; columns?: string[]}` | `{layout: 'auto'}` | Reactive | Label/control layout. `'auto'` measures the container and resolves to `'horizontal'` at or above 480px. |
| `variant` | `variant` (reflected) | `'default' \| 'compact'` | `'default'` | Reactive | Visual density. |
| `optional` | `optional` | `boolean` | `false` | Reactive | Shows an "optional" hint instead of a required asterisk. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Reactive | Suppresses the required asterisk even when `required` is set. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Reactive | Allows the label text to wrap instead of truncating. |
| `messages` | `messages` (array property; set via `.messages`) | `ControlMessage[]` (`{status, content, icon?, debug?}`) | `[]` | Reactive | Messages rendered below the input; the control appends its own invalid-color message here via its footer, not by mutating this array. |
| `decorations` | `decorations` (array property; set via `.decorations`) | `Decoration[]` (`{icon, text}`) | `[]` | Reactive | Small icon+text decorations rendered inline with the label. |
| `decorationWidgets` | `decorationwidgets` (array property; set via `.decorationWidgets`) | `DecorationWidget[]` (`{tagName, scopeName}`) | `[]` | Reactive | Widgets loaded into the addon column via `<aiux-widget-loader>`. |
| `highlightedValue` | `highlightedvalue` (array property; set via `.highlightedValue`) | `HighlightedValue[]` | `[]` | Reactive | Status badges shown when the current value matches an entry. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Reactive | Shows the "AI-suggested" indicator next to the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Reactive | Shows an unsaved-change indicator next to the label. |
| `editMode` | `edit-mode` (reflected) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Reactive | Rendering mode; `'inline'`/`'display-only'` render a compact read view until the user activates editing. |
| `fieldContextMenu` | — (`attribute: false`, property-only) | `FieldContextMenuConfig \| undefined` | `undefined` | Reactive | Replaces the field's default right-click context menu when provided. |
| `nowAssistConfig` | `nowassistconfig` (object property; set via `.nowAssistConfig`) | `NacmConfig \| undefined` | `undefined` | Reactive | Enables the Now Assist Contextual Menu (NACM) surface (insert-suggestion popover) inherited from the base control tower. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Reactive | Only meaningful when `nowAssistConfig` is set. |
| `referringTable` | `referring-table` | `string` | `''` | Reactive | Only meaningful when `nowAssistConfig` is set. |
| `formData` | — (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | Reactive | Form-level context bag (e.g. `isNewRecord`, `userSession`). Not read by this control's own logic. |
| `type` | `type` | `string` | `'text'` | Reactive | Native input `type`; inherited from the shared text-input base — left at `'text'` in practice. |
| `pattern` | `pattern` | `string` | `''` | Reactive | Native input `pattern`. Not currently used by color-specific validation (color validation is done separately via `CSS.supports`). |
| `max` / `min` | `max` / `min` | `number \| undefined` | `undefined` | Reactive | Native numeric bounds. Not currently used — this is a text-shaped value. |
| `maxlength` / `minlength` | `maxlength` / `minlength` | `number \| undefined` | `undefined` | Reactive | Native input length bounds. |
| `step` | `step` | `number \| undefined` | `undefined` | Reactive | Native input `step`. Not currently used. |
| `multiple` | `multiple` | `boolean` | `false` | Reactive | Native input `multiple`. Not currently used. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | `boolean` | `false` | Reactive | Enables the inherited dynamic-translation flow (translate icon + panel) on the input. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_COLOR#STAGED_VALUE_CHANGED` | `{name, value, meta}` (`meta` is `undefined` unless the dispatcher is called with one) | Bubbles, composed, cancelable | 250ms after each keystroke in the input (debounced), before blur/commit | `value` here is the raw, un-fixed-up text as typed. |
| `AIUX_CONTROL_COLOR#VALUE_CHANGED` | `{name, value, error?}` — `error` is `{type: 'error', message: string}` when the blurred value fails `CSS.supports('color', ...)` | Bubbles, composed, cancelable | On blur, only if the (hex-fixed) value differs from the current `value` or an error occurred | `value` is hex-fixed (e.g. `FF0000` → `#FF0000`) before this event fires. When `readonly` is true, blur does nothing and no event fires. |

Both event names are control-specific action-type strings, not the generic `value-changed`/`staged-value-changed` names used by some other controls in this package — listen for the exact strings above.

When `nowAssistConfig` is set and the user inserts a NACM suggestion, the control does not override the inherited NACM-insert handler, so that particular commit path dispatches the shared input base's event, `AIUX_CONTROL_INPUT#VALUE_CHANGED` (with `{name, value, fieldValue}`), instead of `AIUX_CONTROL_COLOR#VALUE_CHANGED`. A host that only listens for the color-specific event name will miss a value committed this way.

### Slots

| Slot | Description |
| --- | --- |
| `start` | Inherited from `InputBase`'s render — content before the input. Empty by default; this control doesn't add its own content here. |
| `end` | Inherited from `InputBase`'s render, alongside this control's own color-swatch preview (via an overridden `renderEndSlot()`). |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the native `<input>`. Inherited unmodified from the base control tower. |
| `reset()` | Resets `value`, staged value, focus/touched/error state, and `invalid` to their defaults. Inherited from the base control tower; does not reset the color-specific state directly. The swatch is recomputed as a side effect of `value` becoming `''` (which re-triggers `onValuePropertyChanged`), but the validation error message text is not cleared by `onValuePropertyChanged` — a previously-shown "Invalid color: …" message can remain rendered after `reset()` until the next blur revalidates it. |

## Integration details

No additional requirements.

### Platform requirements

Color validation calls `CSS.supports('color', ...)` when available, and otherwise falls back to creating a throwaway `<div>` and reading `getComputedStyle` — both require a DOM/browser environment to run to completion. This fallback runs from several call sites, not just blur: `firstUpdated` (when an initial `value` is present), `onValuePropertyChanged` (whenever `value` changes from outside the control), and `handleBlur`.

### SSR

The component's `render()` does not touch `window`/`document` directly, so the initial render is SSR-safe. `firstUpdated`/`updated` (and therefore the `document.createElement` fallback reachable through them) are Lit client-lifecycle hooks that are never invoked during server-side rendering, so this code path is never reached on the server regardless of which call site would otherwise trigger it.

### Lifecycle

On `firstUpdated`, if an initial `value` is present, the swatch is computed once. On every `value` property change afterward, `onValuePropertyChanged` clears any prior validation error and recomputes the swatch.

### Sizing and layout

Renders through the shared form-field grid (`renderWithLayout`) at `aiux-input-md` size; sizing follows that shared layout, not a control-specific one.

## Accessibility, localization, and customization

The swatch preview is `aria-hidden="true"` (decorative); the accessible name/description for the field comes from the shared label/messages plumbing (`aria-labelledby`/`aria-describedby`, wired by the base input renderer). The invalid-color error message text ("Invalid color: …") is produced via `@lit/localize`'s `msg()`, so it is host-localizable, not hard-coded English. The label, placeholder, and helper text are host-supplied strings and are not translated by the control itself. Styling hooks are the same shared ones as every other text-shaped control: `controlStyles` (raw CSS onto the input) and the `.color-swatch` custom element part is not exposed as a `::part()` — the swatch is a plain `<span>` inside the shadow root, styled only via the internal `--swatch-bg-color` custom property the control sets itself.
