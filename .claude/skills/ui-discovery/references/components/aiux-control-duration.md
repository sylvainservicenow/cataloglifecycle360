# AIUXControlDuration

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-duration.md`

`aiux-control-duration` (class `AIUXControlDuration`) edits a duration value as a row of segmented numeric inputs — days, hours, minutes, seconds — instead of one text field. The host sets the committed `value` as a `"DD HH:MM:SS"` string (and layout/validation options); the control reports a normalized, carried/rolled-over value back once every unit input has been blurred.

Built in: per-unit `<input type="number">` segments with `:`-separated (configurable) rendering, parsing of both the internal `"DD HH:MM:SS"` format and ServiceNow's `"YYYY-MM-DD HH:MM:SS"` datetime-style duration format, unit roll-over/carry normalization (e.g. 90 minutes becomes 1 hour 30 minutes), a `max-unit` cutoff that hides larger units and folds their value into the largest visible one, negative-duration handling gated by `allow-negative`, and validation that rejects negative durations (unless allowed) and any non-max unit at or above its natural limit. Do not build these yourself.

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

class MyDurationField extends AIUXElement {
  static properties = {
    value: {type: String}
  };

  constructor() {
    super();
    this.value = '00 02:30:00';
  }

  render() {
    return html`
      <div style="max-width: 480px;">
        <aiux-control-duration
          label="Time Spent"
          name="time_spent"
          .value=${this.value}
          @AIUX_CONTROL_DURATION#VALUE_CHANGED=${this._onValueChanged}
        ></aiux-control-duration>
      </div>
    `;
  }

  _onValueChanged(e) {
    this.value = e.detail.value;
  }
}

customElements.define('my-duration-field', MyDurationField);
```

**What happens:** four number inputs render (days/hours/minutes/seconds, or fewer when `max-unit` hides some). Editing a unit and tabbing/clicking away blurs it; a 10ms debounce waits to see whether focus landed on another unit segment (e.g. tabbing from hours to minutes) before deciding all units have blurred. Once every focused unit has blurred, the control normalizes the combined value and updates `value` to it **unconditionally, before validation runs** — only *then* does it validate; if invalid, `AIUX_CONTROL_DURATION#VALUE_CHANGED` is suppressed (only `invalid`/`messages` are set), but the normalized value is already sitting in `value` regardless and is not reverted. If valid, `AIUX_CONTROL_DURATION#VALUE_CHANGED` fires with the new committed string.

**Gotcha:** `value` is re-parsed into the four unit inputs unconditionally on every change — the control has no focus guard the way text-like controls do. If the host writes a new `value` (e.g. from a websocket update or a sibling-field recalculation) while the user is mid-edit in one of the unit inputs, the segment the user is typing into is silently overwritten with the host's value on the next render.

### Additional patterns

Hiding days and locking seconds to read-only, matching a field that only tracks hours/minutes worked:

```js
html`
  <aiux-control-duration
    label="Hours Logged"
    name="hours_logged"
    max-unit="hours"
    seconds-readonly
    .value=${'03:15:00'}
  ></aiux-control-duration>
`;
```

Allowing negative durations (e.g. a variance field):

```js
html`
  <aiux-control-duration
    label="Schedule Variance"
    name="variance"
    allow-negative
    .value=${'-1 15:00:00'}
  ></aiux-control-duration>
`;
```

## API

### `aiux-control-duration`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
|---|---|---|---|---|---|
| `value` | `value` (reflects) | `string` | `''` | Re-parses into the four unit inputs via `updated()` whenever it changes, unconditionally — duration's own `updated()` override has no focus guard (its unit-focus tracking via `handleFocus`/`handleBlur` never touches the inherited `hasFocus` state). | Committed duration as `"DD HH:MM:SS"`, or a ServiceNow `"YYYY-MM-DD HH:MM:SS"` datetime string (normalized internally against a 1970-01-01 epoch). |
| `maxUnit` | `max-unit` | `'days' \| 'hours' \| 'minutes' \| 'seconds'` | `'days'` | Re-renders visible unit inputs; units above `maxUnit` are hidden and their value folds into `maxUnit`. | Largest unit segment shown. |
| `hideUnitLabels` | `hide-unit-labels` | `boolean` | `false` | Toggles the small unit-name label above each input. | Hides the "Days"/"Hours"/"Minutes"/"Seconds" captions; the `aria-label` on each input still includes the unit name. |
| `separator` | `separator` | `string` | `':'` | Used both as the on-screen divider between the hours/minutes/seconds inputs and as the separator written into the formatted `value` string on commit. | Character(s) shown between the time-portion unit inputs. |
| `secondsReadOnly` | `seconds-readonly` | `boolean` | `false` | Makes the seconds input read-only (in addition to the control's own `readonly`). | Locks only the seconds segment while other units stay editable. |
| `allowNegative` | `allow-negative` | `boolean` | `false` | Changes both the `min` attribute on the days input and the validation rule run on blur. | When `true`, a negative `days` value is accepted instead of rejected on blur. This does not extend to a hidden-days scenario (`max-unit` other than `days`): `validateDuration` unconditionally rejects a negative value on any non-`days` unit — including the unit acting as `maxUnit` — regardless of `allowNegative`. A negative total duration carried onto a hidden `maxUnit` (e.g. `max-unit="hours"`) is normalized for on-screen display only and is still rejected on commit. |
| `placeholder` | `placeholder` | `string` | `''` | Not rendered by this control. | Inherited from `ControlIdentityBase`; declared but not used in duration's own markup. |
| `autofocus` | `autofocus` | `boolean` | `false` | Applied only to the `maxUnit` input's native `autofocus` attribute. | Autofocuses the first visible unit input on connect. |
| `readonly` | `readonly` (reflects) | `boolean` | `false` | Marks every unit input read-only. | Read-only state for the whole control. |
| `disabled` | `disabled` (reflects) | `boolean` | `false` | Marks every unit input disabled and dims the control (`opacity-60`). | Disabled state for the whole control. |
| `label` | `label` | `string` | `''` | Re-renders the field label and each input's `aria-label` (`"<label> <unit>"`). | Field label text. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Makes the label a link. | Inherited from `ControlIdentityBase`. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Sets the label link's `target`. | Inherited from `ControlIdentityBase`. |
| `name` | `name` | `string` | `''` | Used to build each unit input's `id` (`"<name>-<unit>"`) and the group container's `id` (`"form-field-<name>"`). The native `name` attribute on each unit `<input>` is just the bare unit name (`"days"`, `"hours"`, `"minutes"`, `"seconds"`), not prefixed with the field name. | Field name; also echoed into every dispatched event's `detail.name`. |
| `required` | `required` (reflects) | `boolean` | `false` | Marks every unit input `required` and shows the required indicator in the label. | Required state. |
| `invalid` | `invalid` (reflects) | `boolean` | `false` | Adds `input-error` styling to each unit input. | Set to `true` by duration's own validation effect when a blur produces an invalid combined value; not cleared automatically by duration itself. |
| `nowId` | `now-id` | `string` | `''` | Not rendered by this control. | Inherited from `ControlIdentityBase`. |
| `controlStyles` | `control-styles` | `string` | `''` | Inherited machinery only; duration does not call `controlStylesMap()`/`containerControlStylesMap()` in its own render. | Declared but has no visible effect on this control. |
| `helperText` | `helpertext` (Lit default lower-cased attribute) | `string` | `''` | Inherited from `AIUXControlElement`; not read by duration's own render. | Declared but not currently used by this control (use `helperContent` instead for the rendered helper text). |
| `fieldLayout` | `fieldLayout` (property, `type: Object`) | `{layout: 'auto' \| 'vertical' \| 'horizontal', columns?: string[]}` | `{layout: 'auto'}` | Controls vertical vs. horizontal label/control/message layout via `renderWithLayout()`. | Inherited from `ControlIdentityBase`/`FormFieldLayoutMixin`. |
| `optional` | `optional` | `boolean` | `false` | Shows an "optional" indicator in the label instead of/alongside required. | Inherited. |
| `helperContent` | `helper-content` | `string` | `''` | Renders helper text under the label. | Inherited; this is the helper text actually shown (not `helperText`). |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Suppresses the required asterisk even when `required` is set. | Inherited. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Allows the label text to wrap instead of truncating. | Inherited. |
| `messages` | `messages` (property, `type: Array`) | `ControlMessage[]` | `[]` | Renders status messages below the control; overwritten with a single `critical` message by duration's own validation effect on invalid blur. | Inherited. |
| `decorations` | `decorations` (property, `type: Array`) | `Decoration[]` | `[]` | Rendered inline with the label. | Inherited; not duration-specific. |
| `decorationWidgets` | `decorationWidgets` (property, `type: Array`) | `DecorationWidget[]` | `[]` | Rendered via `<aiux-widget-loader>` in the addon column. | Inherited from `AIUXControlElement`. |
| `highlightedValue` | `highlightedValue` (property, `type: Array`) | `HighlightedValue[]` | `[]` | Renders status badges next to the label when the current value matches an entry. | Inherited; matching is against the raw `value` string. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Shows an AI badge inline with the label. | Inherited. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Shows an unsaved-change dot next to the label. | Inherited. |
| `editMode` | `edit-mode` (reflects) | `FormFieldEditMode` | `DEFAULT` | Switches between editable, inline (edit-on-demand), and display-only rendering via `renderWithLayout()`. | Inherited. In `INLINE`/`DISPLAY_ONLY` mode, the read-only view is duration's raw `value` string (no unit-aware formatting is applied to the inline view). |
| `variant` | `variant` (reflects) | `FormFieldVariant` | `'default'` | `'compact'` shrinks input height (`h-8` vs `h-10` on the separator) and applies compact form-field CSS. | Inherited. |
| `nowAssistConfig` | `nowAssistConfig` (property, `type: Object`) | `NacmConfig \| undefined` | `undefined` | Enables the Now Assist contextual menu surface. | Inherited from `ControlIdentityBase`/`withNacm`; not otherwise wired into duration's own unit inputs. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Used by NACM only when `nowAssistConfig` is set. | Inherited. |
| `referringTable` | `referring-table` | `string` | `''` | Used by NACM only when `nowAssistConfig` is set. | Inherited. |
| `formData` | `formData` (property, `attribute: false`) | `ControlFormData \| undefined` | `undefined` | Available to NACM/context-menu machinery. | Inherited; not read by duration's own render. |
| `fieldContextMenu` | `fieldContextMenu` (property, `attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Enables right-click personalize/configure menu on the label. | Inherited. |

Internal reactive state (`stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage` from `AIUXControlElement`, and `_days`/`_hours`/`_minutes`/`_seconds` from `AIUXControlDuration` itself) is not part of the public API — it is not host-settable and is listed here only for completeness. Note that duration keeps its own `_days`/`_hours`/`_minutes`/`_seconds` state as the source of truth for the rendered inputs; `stagedValue` from the base class is not used by duration's own logic.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
|---|---|---|---|---|
| `AIUX_CONTROL_DURATION#VALUE_CHANGED` | `{name: string, value: string, durationSeconds: number, units: {days, hours, minutes, seconds}, valid: true}` | Bubbles, composed, cancelable (`CustomEvent` via `dispatchAction`) | Every currently-focused unit input has blurred (with a 10ms internal debounce) and the resulting combined duration passes validation. | Also updates `value` (already applied by the time the event fires) and clears/updates `_days.._seconds`. Not the generic `EVENTS.VALUE_CHANGED` (`'value-changed'`) string used by other controls — duration uses this control-specific event name. |
| `AIUX_CONTROL_DURATION#STAGED_VALUE_CHANGED` | `{name: string, value: string}` | Bubbles, composed, cancelable | On every keystroke in any unit input, before blur/commit. | `value` here is the live, un-normalized formatted string (no roll-over applied yet); useful for a live preview, but `value` itself has not changed. |

The following action events exist internally (dispatched via `dispatchAction` for the same-named `ActionTypes`) but are registered with `stopPropagation: true` on the host itself, so they never bubble past `aiux-control-duration` to a listening parent: `DURATION#UNIT_INPUT_CHANGED`, `DURATION#UNIT_FOCUSED` (not intercepted internally but also not consumer-relevant — no handler stops it, though nothing outside the control acts on it either), `DURATION#UNIT_BLURRED`, `DURATION#ALL_UNITS_BLURRED`, `DURATION#VALIDATE_DURATION`, `DURATION#VALIDATION_ERROR`. On an invalid blur, `DURATION#VALIDATION_ERROR` sets `invalid = true` and replaces `messages` with a single `{status: 'critical', content: <error>}` entry instead of firing any consumer-facing event — watch `invalid`/`messages`, not an event, to detect a rejected value.

#### Slots

None. The coreUI is a plain `<div role="group">` of native `<input>` elements with no `<slot>` declarations of its own. `label-start`/`label-inline`/`label-end`/the addon column are `FormFieldLayoutMixin` override *hooks* (`renderLabelStartContent()` etc.), not light-DOM `<slot>` elements — this control doesn't override them or declare a `slots` config, so none of them is usable as a real slot here.

#### Methods

| Method | Description |
|---|---|
| `focus(options?: FocusOptions)` | Inherited from `AIUXControlElement`. Delegates to the internal `_inputEl` query ref, which resolves to the first native `<input>` in the shadow DOM — in practice the visible `maxUnit` input, since it renders first. No-ops if no input is present. |
| `reset()` | Inherited from `AIUXControlElement`. Resets `value` to `''` and clears `hasFocus`/`isTouched`/`hasError`/`errorMessage`/`invalid`. Does not reset `_days`/`_hours`/`_minutes`/`_seconds` directly, but the subsequent `value` change re-parses them to zero via `updated()`. |

### Data shapes

```ts
// From src/commons/types/fields.ts — the FormField shape for type 'glide_duration'
interface DurationField extends FormFieldCore {
  type: FieldType.Duration; // 'glide_duration'
  maxUnit?: string;
  hideUnitLabels?: boolean;
  separator?: string;
  secondsReadOnly?: boolean;
  allowNegative?: boolean;
}

// Unit breakdown used throughout the control and its events
interface DurationUnit {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// AIUX_CONTROL_DURATION#VALUE_CHANGED detail shape
interface DurationChangeDetail {
  name: string;
  value: string;
  durationSeconds: number;
  units: DurationUnit;
  valid: boolean;
  error?: string; // not present on the success path that actually fires this event
}
```

## Integration details

### Platform requirements

None beyond the standard AIUX control setup — no external services, no record/table context required for the control itself to function.

### SSR

SSR-safe: the source has no unguarded `window`/`document`/`localStorage` access in its constructor, `render()`, or `connectedCallback()`. Covered by dedicated SSR tests rendering the control with a label, `disabled`, `readonly`, `max-unit`, and required states.

### Lifecycle

On `connectedCallback()`, the `DurationController`'s `hostConnected()` parses the current `value` into the four unit-state fields. Whenever `value` changes thereafter, the same parse runs again via duration's own `updated()` override — unconditionally, with no focus guard (duration never sets the inherited `hasFocus` state itself). On disconnect, a pending 10ms blur-debounce timeout is cleared.

### Sizing and layout

Renders as a `flex items-center gap-2` row of unit inputs (each in its own `flex flex-col` cell with an optional label above), separated by a styled `separator` glyph between the time-portion units. Height responds to `variant`: `compact` uses `h-8` separators, others `h-10`, matching the `aiux-input` sizing used per unit. No explicit width is set on the inputs; they take native `<input type="number">` sizing inside their flex cells.

## Accessibility, localization, and customization

Each unit `<input>` has its own `aria-label` of `"<label> <unit>"` (e.g. `"Time Spent Hours"`), so screen readers announce the field and segment together even when `hide-unit-labels` removes the visible caption. The row is wrapped in a `role="group"` container with `aria-labelledby` pointing at the form-field label, grouping the segmented inputs as one field for assistive tech. Standard tab order moves through days → hours → minutes → seconds (or the visible subset per `max-unit`). Inputs are native `<input type="number">`, so browser spinner/arrow-key increment and keyboard entry work without additional wiring.

Unit display names ("Days", "Hours", "Minutes", "Seconds") and validation error messages ("Negative durations are not allowed", "`<unit>` must be less than `<limit>`", "`<unit>` cannot be negative") are all wrapped in `msg()`/`str()` from `@lit/localize` and are translated, not hard-coded English in the shipped sense — but the host cannot override or localize them independently; they come from this control's own message catalog. The `separator` character and `label`/`helper-content` text are fully host-settable and not translated by the control itself. Styling uses Tailwind/DaisyUI utility classes (`aiux-input`, `input-error`, `aiux-badge`, etc.) and CSS custom properties from `styles.css`/the shared form-field mixin CSS — no `--now-*` tokens are used, and there is no documented public CSS custom-property API beyond what the shared `aiux-input`/form-field classes already expose.
