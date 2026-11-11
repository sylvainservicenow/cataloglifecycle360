# aiux-control-checkbox

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-checkbox.md`

`<aiux-control-checkbox>` is a single boolean form control: the host sets `checked` (and `name`/`label`), and the control reports back a committed `true`/`false` string on user interaction. It can render as a checkbox or, via `is-toggle`, as a toggle switch, and it renders its label inline beside the box rather than in a separate label column.

Built in: server-safe checked-state rendering (no flash-of-wrong-state on hydration), ARIA wiring for label/description/validation messages, required/invalid/disabled/readonly visual states, and vertical/horizontal form-field layout via the shared layout mixin. Do not hand-roll a native `<input type="checkbox">` with your own label/ARIA/layout wiring.

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
    active: {type: Boolean}
  };

  render() {
    return html`
      <aiux-control-checkbox
        name="active"
        label="Active"
        ?checked=${this.active}
        @AIUX_CONTROL_CHECKBOX#VALUE_CHANGED=${this._onChange}
      ></aiux-control-checkbox>
    `;
  }

  _onChange(e) {
    this.active = e.detail.value === 'true';
  }
}
```

**What happens:** clicking the box (or its inline label) toggles the native checkbox, which fires `AIUX_CONTROL_CHECKBOX#VALUE_CHANGED` with `detail.value` set to the string `'true'` or `'false'`. The host is responsible for feeding the new state back in through `checked`.

### Additional patterns

Render as a toggle switch instead of a checkbox:

```js
html`<aiux-control-checkbox
  name="notifications"
  label="Email notifications"
  is-toggle
  ?checked=${this.notificationsEnabled}
></aiux-control-checkbox>`;
```

Put the label before the box (e.g. for a settings row where the label sits at the start):

```js
html`<aiux-control-checkbox
  name="notifications"
  label="Email notifications"
  label-position="start"
  full-width
></aiux-control-checkbox>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `checked` | `checked` | `boolean` | `false` | Declared without `reflect: true`, so (unlike `readonly`/`disabled`/`required`/`invalid` below) it does not write a `checked` attribute back onto the element; it drives the rendered `?checked` binding and the `syncChecked()` directive on every render. Does not itself commit a value. | Whether the box/toggle is checked. The host owns this — set it from the `value` reported on `AIUX_CONTROL_CHECKBOX#VALUE_CHANGED`. |
| `isToggle` | `is-toggle` | `boolean` | `false` | Switches the rendered control between checkbox and toggle-switch styling. | Renders as a DaisyUI toggle switch instead of a checkbox when `true`. |
| `labelPosition` | `label-position` | `'start' \| 'end'` | `'end'` | Reverses the row order of box and label. | Where the label renders relative to the box. |
| `fullWidth` | `full-width` | `boolean` | `false` | Adds `w-full` to the checkbox row. | Stretches the checkbox row to fill its container width. |
| `description` | `description` | `string` | `''` | Renders an extra `<p>` under the checkbox row when set. | Supplementary text shown below the checkbox/label row, tied to the input via `aria-describedby`. |
| `configAria` | `configAria` (property only, no attribute binding used in practice) | `Record<string, string>` | `{}` | Overrides the computed `aria-label`/`aria-labelledby`/`aria-describedby`. | Explicit ARIA attribute overrides: recognized keys are `aria-label`, `aria-labelledby`, `aria-describedby`. |
| `reserveLabelSpace` | `reserve-label-space` | `boolean` | `false` | Adds an invisible label-height spacer above the row in vertical layout only. | Set by a parent form grid (not typically set directly by a host) to keep this checkbox's input band aligned with sibling fields that do show a label line above their control. Ignored in horizontal layout. |
| `value` | `value` | `string` | `''` | Reflects as an attribute; not read by this control's own rendering or change logic. | Inherited from the base control identity contract. Checkbox state is carried by `checked`, not `value` — this property exists on the element but has no effect on the rendered checkbox. |
| `placeholder` | `placeholder` | `string` | `''` | Not read by this control. | Inherited; not applicable to a checkbox. |
| `autofocus` | `autofocus` | `boolean` | `false` | Focuses the input on connect via the shared focus controller. | Auto-focuses the checkbox input when the element is connected. |
| `readonly` | `readonly` | `boolean` | `false` | Reflects; disables the native input and blocks `_onChange` from doing anything (including `stopPropagation`). | Prevents the user from changing the checked state while keeping it visually present. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects; disables the native input. | Standard disabled state. |
| `label` | `label` | `string` | `''` | Re-renders the inline label text. | The field's label text, rendered beside the box. |
| `labelUrl` | `label-url` | `string` | `''` | Passed through to the shared label renderer. | Makes the label a link to this URL. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Passed through to the shared label renderer. | `target` for the label link. |
| `name` | `name` | `string` | `''` | Used to compute the input's `id`, `name` attribute, and ARIA id references. | Field name; also echoed back as `detail.name` on the change event. |
| `required` | `required` | `boolean` | `false` | Reflects; sets `required`/`aria-required` on the input and shows the required indicator in the label. | Marks the field as required. |
| `invalid` | `invalid` | `boolean` | `false` | Reflects; adds the error color modifier class and sets `aria-invalid="true"`. | Marks the field as failing validation. |
| `nowId` | `now-id` | `string` | `''` | — | Inherited identity id; not read by this control's own render logic. |
| `controlStyles` | `control-styles` | `string` | `''` | Not consumed by this control's render (checkbox has no element bound to `controlStylesMap()`/`fullControlStylesMap()`). | Inherited property; currently has no visible effect on `aiux-control-checkbox`. |
| `fieldLayout` | `fieldLayout` (property only) | `{layout?: 'auto' \| 'vertical' \| 'horizontal'; columns?: string[]}` | `{layout: 'auto'}` | Drives `effectiveFieldLayout`, which switches between the vertical/horizontal render branches. | Requested layout; `'auto'` resolves from container width via the shared layout mixin. |
| `optional` | `optional` | `boolean` | `false` | Passed through to the shared label renderer (suppresses the required asterisk logic upstream). | Marks the field as explicitly optional. |
| `helperContent` | `helper-content` | `string` | `''` | Passed through to the shared label renderer. | Helper text shown near the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Also forced `true` internally whenever the field is display-only, readonly, or disabled. | Hides the asterisk that would otherwise mark a required field. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Passed through to the shared label renderer. | Allows the label text to wrap instead of truncating. |
| `messages` | `messages` (property only) | `ControlMessage[]` | `[]` | Filtered by `getVisibleMessages()` (drops debug-only entries) and rendered under the row. | Validation/info messages shown below the checkbox. |
| `decorations` | `decorations` (property only) | `Decoration[]` | `[]` | — | Inherited; not rendered by this control's own `render()`. |
| `decorationWidgets` | `decorationWidgets` (property only) | `DecorationWidget[]` | `[]` | Rendered via the inherited `renderAddonContent()` addon area. | Widget-loader-backed decorations shown in the shared addon slot contributed by the base class. |
| `highlightedValue` | `highlightedValue` (property only) | `HighlightedValue[]` | `[]` | Rendered via the inherited highlighted-value badge helper, if invoked by the layout mixin. | Status badges tied to the current value. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Consumed by the shared layout mixin's AI-indicator rendering. | Shows an AI-generated-value indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Passed through to the shared label renderer. | Shows an unsaved-change indicator next to the label. |
| `editMode` | `edit-mode` | `'default' \| 'inline' \| 'display-only'` | `'default'` | Reflects. In `'display-only'`, `renderLabelColumn()` falls back to the base layout mixin's own label column instead of being suppressed; also forces `hideRequiredIndicator` on. | Rendering mode for the field. |
| `variant` | `variant` | `'default' \| 'compact'` | `'default'` | Reflects; `'compact'` switches the row height class from `h-10` to `h-8` and reduces spacing in the shared label/message rendering. | Visual density. |
| `nowAssistConfig` | (no attribute; `attribute: false`) | `NacmConfig \| undefined` | `undefined` | Consumed by the NACM surface contributed by `withNacm`. | Now Assist configuration for this field. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | — | Inherited; not read by this control's own `render()`. |
| `referringTable` | `referring-table` | `string` | `''` | — | Inherited; not read by this control's own `render()`. |
| `formData` | (no attribute; `attribute: false`) | `ControlFormData \| undefined` | `undefined` | — | Inherited; not read by this control's own `render()`. |
| `fieldContextMenu` | (no attribute; `attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Consumed by `FieldContextMenuMixin` in the base tower. | Context menu configuration for this field. |
| `helperText` | `helpertext` | `string` | `''` | Inherited from `AIUXControlElement`; not read by this control's own `render()`. | Not currently used by `aiux-control-checkbox` — use `helperContent` instead, which this control does render. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CHECKBOX#VALUE_CHANGED` | `{name: string, value: 'true' \| 'false'}` | `bubbles: true, composed: true, cancelable: true` | The native `change` event fires on the input (i.e. the user toggles the box) and the control is not `readonly`. | This is the control's own action-event name, dispatched via the shared `dispatchAction()` helper — it is **not** the generic `value-changed` event name used by some other controls in this package. Also note `stopPropagation()` is called on the underlying native `change` event before this event is dispatched. |

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Moves focus to the underlying `<input>`. Inherited from `AIUXControlElement`. |
| `reset()` | Resets inherited state (`value`, touched/error flags, `invalid`) to defaults. Does **not** reset `checked` — after calling `reset()`, the box remains in whatever state it was visually in; the host must also set `checked = false` if it wants the box unchecked. |

## Integration details

### Platform requirements

None beyond the host application already having `@servicenow/aiux-components-control` available.

### SSR

Server-safe: the `?checked` boolean attribute binding decides the server-rendered checked state, and the `syncChecked()` directive (a no-op during SSR) takes over syncing the live `.checked` DOM property once the input is hydrated in the browser. This two-part approach avoids a checkbox rendering unchecked-then-flashing-checked (or vice versa) on load.

### Lifecycle

No lifecycle behavior beyond what `AIUXControlElement` provides (`stagedValue` sync on connect/update, focus controller for `autofocus`).

### Sizing and layout

Row height is `h-10` by default and `h-8` when `variant="compact"`. In horizontal field layout the checkbox still renders its label inline beside the box (via the `renderLabelColumn()` override) rather than in the layout mixin's separate label column — so, unlike most other controls in this package, `aiux-control-checkbox` looks the same, label-position-wise, in both vertical and horizontal layouts. The one exception is `editMode="display-only"`, where `renderLabelColumn()` defers back to the base mixin's own label-column rendering.

## Accessibility, localization, and customization

- **Accessibility:** the input gets `aria-invalid`, `aria-required`, and either `aria-label` or `aria-labelledby` (computed from `name`/`label`, or overridden via `configAria`), plus `aria-describedby` wired to the description text and any visible validation messages. Native checkbox keyboard behavior (Space to toggle, Tab to move focus) is unchanged.
- **Localization:** this control renders no hard-coded English strings of its own — `label`, `description`, and message text are all supplied by the host and rendered as-is.
- **Customization:** checkbox/toggle appearance comes from the DaisyUI `aiux-checkbox`/`aiux-toggle` utility classes (`aiux-checkbox-primary`, `aiux-checkbox-sm`, `aiux-checkbox-error`, and the toggle equivalents) plus Tailwind layout classes on the row (`h-10`/`h-8`, `flex`, `gap-2`). No CSS parts or slots are exposed for external styling.
