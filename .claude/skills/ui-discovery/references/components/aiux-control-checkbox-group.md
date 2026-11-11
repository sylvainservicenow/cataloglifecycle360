# aiux-control-checkbox-group

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-checkbox-group.md`

`<aiux-control-checkbox-group>` is a multi-select form control: the host sets `options` (the choices) and `value` (a comma-separated string of currently checked option values), and the control reports back the updated comma-separated string whenever an option is checked or unchecked.

Built in: per-option checkbox rendering with ARIA `role="group"` wiring, sorted/deduplicated value-string construction, per-option `readonly` and `hidden` support, and vertical/horizontal form-field layout via the shared layout mixin. Do not hand-roll a list of native `<input type="checkbox">` elements with your own value-joining logic.

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
  static properties = {
    statuses: {type: String}
  };

  render() {
    return html`
      <aiux-control-checkbox-group
        name="statuses"
        label="Statuses"
        .options=${[
          {value: 'open', label: 'Open'},
          {value: 'pending', label: 'Pending'},
          {value: 'closed', label: 'Closed'}
        ]}
        .value=${this.statuses}
        @AIUX_CONTROL_CHECKBOX_GROUP#VALUE_CHANGED=${this._onChange}
      ></aiux-control-checkbox-group>
    `;
  }

  _onChange(e) {
    this.statuses = e.detail.value;
  }
}
```

**What happens:** checking or unchecking an option computes the full set of currently-checked option values, sorts them, joins them with `,`, and fires `AIUX_CONTROL_CHECKBOX_GROUP#VALUE_CHANGED` with that string as `detail.value`. The host feeds the new string back in through `value`.

### Additional patterns

Lock an individual option while leaving the rest editable:

```js
html`<aiux-control-checkbox-group
  name="statuses"
  label="Statuses"
  .options=${[
    {value: 'open', label: 'Open'},
    {value: 'archived', label: 'Archived', readonly: true}
  ]}
  .value=${this.statuses}
></aiux-control-checkbox-group>`;
```

Hide one option without removing it from `options` (for example when a UI policy hides it):

```js
html`<aiux-control-checkbox-group
  name="contact"
  label="Contact me by"
  .options=${[
    {value: 'email', label: 'Email'},
    {value: 'phone', label: 'Phone', hidden: true},
    {value: 'sms', label: 'SMS', hidden: true}
  ]}
  .value=${this.contact}
></aiux-control-checkbox-group>`;
```

A hidden option behaves like this:

- It stays in the markup with the `hidden` attribute and is not displayed. Server and browser render the same structure, so toggling `hidden` later does not cause a hydration mismatch. If the browser's value differs from the server's when the page hydrates (for example after an onLoad UI policy), the row is corrected to the browser's value.
- The group keeps its label and `role="group"` even when only one option is left.
- Its value stays in `value`. Checking or unchecking a visible option keeps it. The inline (read-only) view leaves hidden values out.
- If every option is hidden, the group wrapper and label still render with no visible options. The host decides whether to render the group at all.

Lay the options out horizontally instead of stacked:

```js
html`<aiux-control-checkbox-group
  name="statuses"
  label="Statuses"
  .fieldLayout=${{layout: 'horizontal'}}
  .options=${this.options}
  .value=${this.statuses}
></aiux-control-checkbox-group>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Overrides the base `value` property (same attribute name) with a fresh `@property({type: String})` declaration that omits `reflect: true` — a property re-declaration in Lit replaces the inherited options rather than merging them, so this control's `value`, unlike the inherited `readonly`/`disabled`/`required`/`invalid` properties, does **not** reflect back onto the `value` attribute. Parsed with `.split(',')` to determine which options are checked. | Comma-separated string of currently checked option `value`s. Empty entries from stray commas are ignored. So is any entry that doesn't match an `options[].value` — a stale option removed from the list (or a typo) is silently dropped from the checked set rather than erroring, so a value like `'open,retired'` renders only `open` checked if `retired` isn't one of the current `options`. |
| `options` | `options` (property only, bind with `.options=`) | `CheckboxOption[]` | `[]` | Re-renders the option list. | The choices to render. Each entry is `{value: string, label: string, readonly?: boolean, hidden?: boolean}`. `readonly` locks one option. `hidden` hides one option but keeps it in the markup and in `value`; see the hidden-option example under Usage. |
| `labelPosition` | `label-position` | `'start' \| 'end'` | `'end'` | Reverses each option row's box/label order. | Where each option's label renders relative to its box. |
| `fullWidth` | `full-width` | `boolean` | `false` | Adds `w-full` to each option row. | Stretches each option row to fill its container width. |
| `description` | `description` | `string` | `''` | Renders an extra `<p>` under the option list when set. | Supplementary text shown below the group, tied to the group via `aria-describedby`. |
| `configAria` | `configAria` (property only) | `Record<string, string>` | `{}` | Overrides the computed `aria-labelledby`/`aria-describedby` on the group's `role="group"` container. | Recognized keys: `aria-labelledby`, `aria-describedby`. There is no `aria-label` override for this control (unlike `aiux-control-checkbox`). |
| `placeholder` | `placeholder` | `string` | `''` | Not read by this control. | Inherited; not applicable to a checkbox group. |
| `autofocus` | `autofocus` | `boolean` | `false` | Focuses the first checkbox on connect via the shared focus controller. | Auto-focuses the group when the element is connected. |
| `readonly` | `readonly` | `boolean` | `false` | Reflects; disables every option's native input and blocks `_onChange` from doing anything (including `stopPropagation`). | Prevents the user from changing any option while keeping the group visually present. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects; disables every option's native input. | Standard disabled state for the whole group. |
| `label` | `label` | `string` | `''` | Re-renders the group's label, in the shared layout mixin's own label column (this control does not override `renderLabelColumn()`). | The group's label text. |
| `labelUrl` | `label-url` | `string` | `''` | Passed through to the shared label renderer. | Makes the label a link to this URL. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Passed through to the shared label renderer. | `target` for the label link. |
| `name` | `name` | `string` | `''` | Used to compute each option's input `id`/`name`, the description id, and ARIA id references. | Field name; also echoed back as `detail.name` on the change event. |
| `required` | `required` | `boolean` | `false` | Reflects; sets `aria-required` on the group container and shows the required indicator in the label. | Marks the field as required. |
| `invalid` | `invalid` | `boolean` | `false` | Reflects; adds the error color modifier class to every option's checkbox and sets `aria-invalid="true"` on the group container. | Marks the field as failing validation. |
| `nowId` | `now-id` | `string` | `''` | — | Inherited identity id; not read by this control's own render logic. |
| `controlStyles` | `control-styles` | `string` | `''` | Parsed and applied, unsplit, as an inline `style` on every option's `<input>` via `fullControlStylesMap()`. | Raw CSS declarations (e.g. `border-color: red;`) applied to each checkbox input. |
| `fieldLayout` | `fieldLayout` (property only) | `{layout?: 'auto' \| 'vertical' \| 'horizontal'; columns?: string[]}` | `{layout: 'auto'}` | Drives `effectiveFieldLayout`, which switches the options list between a wrapped horizontal row (`flex-row flex-wrap`) and a vertical stack (`flex-col`). | Requested layout; `'auto'` resolves from container width via the shared layout mixin. |
| `optional` | `optional` | `boolean` | `false` | Passed through to the shared label renderer. | Marks the field as explicitly optional. |
| `helperContent` | `helper-content` | `string` | `''` | Passed through to the shared label renderer. | Helper text shown near the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Passed through to the shared label renderer. | Hides the asterisk that would otherwise mark a required field. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Passed through to the shared label renderer. | Allows the label text to wrap instead of truncating. |
| `messages` | `messages` (property only) | `ControlMessage[]` | `[]` | Filtered by `getVisibleMessages()` (drops debug-only entries) and referenced via `aria-describedby`; rendered by the shared layout mixin. | Validation/info messages shown below the group. |
| `decorations` | `decorations` (property only) | `Decoration[]` | `[]` | — | Inherited; not read by this control's own `render()`. |
| `decorationWidgets` | `decorationWidgets` (property only) | `DecorationWidget[]` | `[]` | Rendered via the inherited `renderAddonContent()` addon area. | Widget-loader-backed decorations shown in the shared addon slot contributed by the base class. |
| `highlightedValue` | `highlightedValue` (property only) | `HighlightedValue[]` | `[]` | Rendered via the inherited highlighted-value badge helper, if invoked by the layout mixin. | Status badges tied to the current value. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Consumed by the shared layout mixin's AI-indicator rendering. | Shows an AI-generated-value indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Passed through to the shared label renderer. | Shows an unsaved-change indicator next to the label. |
| `editMode` | `edit-mode` | `'default' \| 'inline' \| 'display-only'` | `'default'` | Reflects; consumed by the shared layout mixin. | Rendering mode for the field. |
| `variant` | `variant` | `'default' \| 'compact'` | `'default'` | Reflects; consumed by the shared layout mixin's spacing/density rendering. | Visual density. |
| `nowAssistConfig` | (no attribute; `attribute: false`) | `NacmConfig \| undefined` | `undefined` | Consumed by the NACM surface contributed by `withNacm`. | Now Assist configuration for this field. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | — | Inherited; not read by this control's own `render()`. |
| `referringTable` | `referring-table` | `string` | `''` | — | Inherited; not read by this control's own `render()`. |
| `formData` | (no attribute; `attribute: false`) | `ControlFormData \| undefined` | `undefined` | — | Inherited; not read by this control's own `render()`. |
| `fieldContextMenu` | (no attribute; `attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Consumed by `FieldContextMenuMixin` in the base tower. | Context menu configuration for this field. |
| `helperText` | `helpertext` | `string` | `''` | Inherited from `AIUXControlElement`; not read by this control's own `render()`. | Not currently used by `aiux-control-checkbox-group` — use `helperContent` instead, which this control does render. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CHECKBOX_GROUP#VALUE_CHANGED` | `{name: string, value: string}` | `bubbles: true, composed: true, cancelable: true` | The native `change` event fires on any option's input (i.e. the user checks/unchecks one option) and the control is not `readonly`. | `value` is the full recomputed set of checked option values — deduplicated against `options`, sorted ascending, and joined with `,` (not just the one option that changed). This is the control's own action-event name, dispatched via `dispatchAction()` — it is **not** the generic `value-changed` event name used by some other controls in this package. `stopPropagation()` is called on the underlying native `change` event before this event is dispatched. |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the first `<input>` in the group. Inherited from `AIUXControlElement`. |
| `reset()` | Resets inherited state (`value`, touched/error flags, `invalid`) to defaults, which clears the checked-value string back to `''` — unlike `aiux-control-checkbox`'s `reset()`, this does un-check every option, because this control's checked state is derived directly from `value`. |

## Integration details

### Platform requirements

None beyond the host application already having `@servicenow/aiux-components-control` available.

### SSR

Server-safe: each option's checked state is computed synchronously in `render()` from `value`/`options`, using a plain `?checked` boolean attribute binding (no client-only sync directive is used here, unlike `aiux-control-checkbox`).

### Lifecycle

No lifecycle behavior beyond what `AIUXControlElement` provides (`stagedValue` sync on connect/update, focus controller for `autofocus`).

### Sizing and layout

In horizontal field layout, options wrap onto multiple lines (`flex flex-row flex-wrap gap-x-6 gap-y-2`); in vertical layout they stack in a single column (`flex flex-col gap-1`). Unlike `aiux-control-checkbox`, this control does not override `renderLabelColumn()`, so its group label renders in the shared layout mixin's normal label column/row, not inline beside any individual option.

## Accessibility, localization, and customization

- **Accessibility:** the option list is wrapped in a `role="group"` container with `aria-labelledby`/`aria-describedby`/`aria-invalid`/`aria-required` (computed from `name`/`label`/`description`/`messages`, or overridden via `configAria`). Each option is a native `<label for>`/`<input type="checkbox">` pair, so keyboard toggling (Space) and per-option focus outlines work without extra wiring.
- **Localization:** this control renders no hard-coded English strings of its own — `label`, `description`, each option's `label`, and message text are all supplied by the host and rendered as-is.
- **Customization:** checkbox appearance comes from the DaisyUI `aiux-checkbox`/`aiux-checkbox-primary`/`aiux-checkbox-sm`/`aiux-checkbox-error` utility classes; layout comes from Tailwind flex classes on the options container (`cbg-option-row`, `flex-row-reverse`, `justify-end`, `w-full`). `controlStyles` can inject arbitrary inline CSS onto each option's input. No CSS parts or slots are exposed for external styling.
