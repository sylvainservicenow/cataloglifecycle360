# aiux-control-radio-group

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-radio-group.md`

`<aiux-control-radio-group>` is a radio button group form control for selecting a single value from a caller-supplied list of options. The host sets `options` (each with `value`/`displayValue`) and `value`; the component reports the user's selection back via a custom event carrying the newly selected value. It does not update its own `value` property — the host must apply the new value for the checked state to move.

Built in: `role="radiogroup"` semantics with the correct `aria-label`/`aria-labelledby`/`aria-describedby` wiring based on whether `name`/`label`/`messages` are set, SSR-safe checked-state binding (`?checked` plus a browser-side sync directive so a user click can still change the DOM after the initial render), per-option `disabled` support layered on top of group-level `disabled`/`readonly`, autofocus placed on the checked (or first) option, and the shared edit-on-demand/display-only inline view. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html, isServer} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class PriorityFieldHost extends AIUXElement {
  static properties = {
    _value: {state: true}
  };

  constructor() {
    super();
    if (!isServer) {
      this._value = '2';
    }
  }

  _onValueChanged = e => {
    this._value = e.detail.value;
  };

  render() {
    return html`
      <aiux-control-radio-group
        name="priority"
        label="Priority"
        .value=${this._value}
        .options=${[
          {value: '1', displayValue: 'Critical'},
          {value: '2', displayValue: 'High'},
          {value: '3', displayValue: 'Medium'}
        ]}
        @AIUX_CONTROL_RADIO_GROUP#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-radio-group>
    `;
  }
}

customElements.define('priority-field-host', PriorityFieldHost);
```

**What happens:** three radio inputs render, with "High" checked (from `value="2"`). Clicking "Critical" fires `AIUX_CONTROL_RADIO_GROUP#VALUE_CHANGED` with `detail: {value: '1', name: 'priority', meta: undefined}`; the host's listener assigns `this._value = '1'`, which flows back into `value` and moves the checked state on the next render. Nothing about the checked radio changes on click until the host does this — the control never mutates `value` itself.

### Additional patterns

Vertical layout with an individually disabled option:

```js
html`
  <aiux-control-radio-group
    name="severity"
    label="Severity"
    orientation="vertical"
    .value=${'2'}
    .options=${[
      {value: '1', displayValue: 'Low'},
      {value: '2', displayValue: 'Medium'},
      {value: '3', displayValue: 'High', disabled: true}
    ]}
  ></aiux-control-radio-group>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `options` | `options` | `RadioOption[]` | `[]` | Re-renders one `<label><input></label>` pair per entry; also used to resolve the checked state, the autofocus target, and the display-only view's text | The list of selectable options. |
| `orientation` | `orientation` | `RadioOrientation` (`'horizontal' \| 'vertical'`) | `'horizontal'` (`RadioOrientation.Horizontal`) | Switches the wrapping `<div>` between `flex-row flex-wrap gap-4` and `flex-col gap-2` | Lays the options out in a row or a column. |

Inherited from the shared control base (`AIUXControlElement` / `ControlIdentityBase`) and used by this control:

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Compared against each option's `value` to decide which radio is checked, which option gets autofocus, and what the display-only view shows; **not** written by this control itself | The currently selected option's value. |
| `name` | `name` | `string` | `''` | Set as the native `name` on every `<input type="radio">` in the group (so the browser enforces mutual exclusivity) and used to build the field's `id`/`aria-labelledby`/`aria-describedby` ids; also echoed back in the change event's `detail.name` | Field name. Two radio-groups on the same page sharing a `name` will conflict as native radio groups — give each group a unique `name`. |
| `label` | `label` | `string` | `''` | Rendered by the layout mixin's label section; also used as a plain `aria-label` on the `radiogroup` `<div>` when `name` is empty (no id-based `aria-labelledby` is possible without a `name`) | Field label text. |
| `required` | `required` (reflected) | `boolean` | `false` | Reflected straight onto `aria-required` on the `radiogroup` `<div>` (always rendered, even `"false"`) | Marks the field required. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Colors each option's label text `text-error` instead of `text-base-content`; does not add `aria-invalid` to the group | Error/invalid visual state. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Combined with `readonly` into an internal "locked" flag that disables every option's `<input>` | Disables the whole group. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Also folded into the same "locked" flag as `disabled` — native `<input type="radio">` has no browser-level readonly behavior, so this control disables the inputs instead | Read-only mode; has the same rendered effect as `disabled`. |
| `autofocus` | `autofocus` | `boolean` | `false` | Placed on exactly one `<input>`: the option matching `value` if one matches, otherwise the first option | Auto-focuses one radio on first render. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | When any message is visible (per `getVisibleMessages`), sets `aria-describedby` on the `radiogroup` `<div>` to the shared messages-block id; the messages themselves are rendered by the inherited layout section | Validation/info messages shown below the control. |
| `fieldLayout` | `fieldlayout` | `FieldLayout` | `{layout: 'auto'}` | Passed through to `renderWithLayout()` (inherited label/messages layout) | Field layout configuration (vertical/horizontal/columns). |
| `variant` | `variant` (reflected) | `FormFieldVariant` | `'default'` | Passed through to the inherited layout rendering | Visual density variant. |
| `editMode` | `edit-mode` (reflected) | `FormFieldEditMode` | `FormFieldEditMode.DEFAULT` | Controls whether the editable radio list or the read-only inline view (built from the matched option's `displayValue`, falling back to the raw `value`) is rendered | Edit-on-demand / display-only mode switch. |
| `helperContent` | `helper-content` | `string` | `''` | Rendered by the inherited label section | Supplemental helper text under the label. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Passed through to the inherited label rendering | Allows the label text to wrap instead of truncating. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Rendered inline with the label | Small label-adjacent decorations/icons. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Rendered in the addon column via the inherited `renderAddonContent()` | Widget-loader-backed decorations. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Passed through to the inherited label-inline AI sparkle rendering | Shows the AI indicator next to the label. |
| `nowId` | `now-id` | `string` | `''` | Not read directly by this control's own render logic (available to host tooling/selectors) | Stable identifier for the field instance. |
| `controlStyles` | `control-styles` | `string` | `''` | Not read anywhere in this control's own render | Not currently used by this control. |
| `optional` | `optional` | `boolean` | `false` | Not read by this control's own `render()`, but read by the inherited label rendering invoked through `renderWithLayout()` — shows an "optional" label indicator | Marks the field as optional. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Same as `optional`: consumed by the inherited label rendering, not this control's own `render()` | Makes the label a link. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Same as `optional`: consumed by the inherited label rendering, not this control's own `render()` | `target` for `labelUrl`. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Same as `optional`: consumed by the inherited label rendering, not this control's own `render()` | Suppresses the required-field indicator even when `required` is set. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Same as `optional`: consumed by the inherited label rendering, not this control's own `render()` | Shows an unsaved-change dot next to the label. |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Not read by this control's own `render()`, but rendered automatically via the inherited `renderHighlightedValueBadges()`, which `renderWithLayout()` calls for every control | Status badges shown when `value` matches a configured entry. |
| `fieldContextMenu` | none (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Not read by this control's own `render()`, but wired up automatically by the inherited `FieldContextMenuMixin` (active once both `fieldContextMenu` and `name` are set) | Right-click personalize/configure menu, populated by the controls factory. |
| `placeholder`, `nowAssistConfig`, `referringRecordId`, `referringTable`, `formData` | see `ControlIdentityBase` | — | — | Declared on the shared base; not read anywhere in this control's own `render()`, and not wired into any inherited rendering path either (unlike `optional`/`highlightedValue`/`fieldContextMenu` above) | Not currently used by this control. |
| `helperText` | `helpertext` | `string` | `''` | Declared on `AIUXControlElement`; not read by this control's own render (helper text display goes through `helperContent`/`messages` instead) | Not currently used by this control's own rendering. |

Internal reactive state inherited from `AIUXControlElement` (`stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage`) exists on the base class but is not read or written by this control — the checked state is derived purely from `value` and `options` on every render.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_RADIO_GROUP#VALUE_CHANGED` | `{value: string, name: string, meta: undefined}` | bubbles, composed, cancelable | The user selects a native `change` on a radio whose `value` matches an entry in `options` and differs from the current `value` | Dispatched via the shared `dispatchAction()` helper (not the package's generic `EVENTS.VALUE_CHANGED`/`'value-changed'` constant — this control uses its own namespaced action type, exported as `ActionTypes.VALUE_CHANGED`). Not fired for a `change` on a target that isn't a radio input, whose value has no matching option, or whose value equals the already-selected value. |

No other event from the shared `EVENTS` constant (`staged-value-changed`, `control-focus`, `control-blur`, `invalid-set`) is dispatched by this control.

### Slots

None. `label-start`/`label-inline`/`label-end` are `FormFieldLayoutMixin` override *hooks* (`renderLabelStartContent()` etc.), not light-DOM `<slot>` elements — this control doesn't override them or declare a `slots` config, so they render their non-slot defaults (nothing / the AI indicator and `decorations` / nothing) and are not usable as slotted content here.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Inherited from `AIUXControlElement`, unmodified: moves focus to the first `<input>` in the shadow DOM, i.e. the first radio in `options` order — not necessarily the checked one. |
| `reset()` | Inherited from `AIUXControlElement`: clears `value`, `stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage`, and `invalid`. Since checked state is derived from `value`, this does move the checked radio to whichever option (if any) matches an empty string. |

### Data shapes

```typescript
interface RadioOption {
  displayValue: string;
  value: string;
  disabled?: boolean;
}

type RadioOrientation = 'vertical' | 'horizontal';

interface RadioValueChangedDetail {
  name: string;
  value: string;
}
```

`src/radio-group/index.ts` exports `ActionTypes.VALUE_CHANGED` (`'AIUX_CONTROL_RADIO_GROUP#VALUE_CHANGED'`) and the `RadioOrientation` enum, but `src/index.ts` only re-exports the component class (`AIUXControlRadioGroup`) from this module — so neither is importable from `@servicenow/aiux-components-control`. Use the literal string/values shown above instead of importing them.

## Integration details

No additional requirements.

### Platform requirements

None — no network calls or platform services.

### SSR

SSR-safe. The checked state is rendered with `?checked` (a boolean attribute, safe for server HTML); a separate directive additionally sets the real `.checked` property on the client after hydration so a later user click can still change it (relying on `.checked` alone would flash the wrong state on load from server-rendered markup).

### Lifecycle

Purely reactive to property changes — there is no `firstUpdated`/`willUpdate` override in this control beyond the inherited base behavior (`connectedCallback` seeds `stagedValue` from `value`; not otherwise used here).

### Sizing and layout

The options wrapper is a flex container (`flex-row flex-wrap gap-4` horizontal, `flex-col gap-2` vertical); each option is a `<label class="flex items-center gap-2">` pairing the native radio with a `data-truncation` span so an overflowing display label gets a tooltip.

## Accessibility, localization, and customization

- **Accessibility:** the wrapping `<div>` has `role="radiogroup"` with `aria-required` always set and, when `name` is present, `aria-labelledby`/`aria-describedby` pointing at the shared label/messages ids (falling back to a plain `aria-label` from `label` when there is no `name`, and to no accessible name at all when neither `name` nor `label` is set). Each `<input type="radio">` carries the shared `name` so native keyboard behavior (arrow keys move the selection, Tab moves in/out of the group) works without any custom key handling. `disabled`/`readonly` disable every option's input; an individual option's own `disabled: true` disables just that one.
- **Localization:** no hard-coded UI strings of its own — every visible string (`label`, each option's `displayValue`, `helperContent`, messages) is host-supplied.
- **Customization:** styled with the shared `aiux-radio`/DaisyUI classes (`aiux-radio-xs aiux-radio-primary`) plus Tailwind utility classes; no `::part()` targets or CSS custom-property hooks are exposed by this control specifically.
