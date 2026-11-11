# aiux-control-time-input

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-time-input.md`

Time input with separate hours/minutes/(optional) seconds text fields, driven by a `format` string that determines 12- vs 24-hour display and whether seconds/AM-PM are shown. Supports arrow-key navigation and increment/decrement per segment, and — for `glide_time` fields — converts between UTC and local time using a numeric offset.

Built in: per-segment parsing/formatting/validation via `format`, auto-advance to the next segment on a completed 2-digit entry, arrow-key increment/decrement/navigation, and UTC↔local conversion for `glide_time`. Do not build these yourself.

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
      <aiux-control-time-input
        name="start_time"
        label="Start time"
        format="hh:mm a"
        .value=${'09:30 AM'}
        @AIUX_CONTROL_TIME_INPUT#VALUE_CHANGED=${this._onChange}
      ></aiux-control-time-input>
    `;
  }

  _onChange(e) {
    const {value, name, fieldType} = e.detail;
    // value is a formatted time string matching `format`, e.g. '09:30 AM'
  }
}
```

**What happens:** with `format="hh:mm a"` the control renders hours/minutes fields plus an AM/PM select (no seconds field, since the format has no `s`). `AIUX_CONTROL_TIME_INPUT#VALUE_CHANGED` fires when a segment loses focus (and no other segment in the component has focus) or via arrow-key increment/decrement.

### Additional patterns

24-hour with seconds: `format="HH:mm:ss"` renders hours/minutes/seconds fields, no AM/PM select.

**Gotcha:** in a 12-hour format (no `H` token in `format`), blurring the hours segment with `00` entered snaps it to `12`, not `0` — there is no 12-hour "00", so the blur handler treats a typed `0` the same as a typed `12`. In a 24-hour format the same `00` stays `00`. If a host pre-fills the control by setting `value` directly rather than letting the user type, this asymmetry doesn't apply (it only fires from the field's own blur handler), but any logic that re-derives an hour segment from user keystrokes should expect `0` to become `12` under a 12-hour format.

Timezone-aware display for a `glide_time` field stored in UTC:

```js
html`
  <aiux-control-time-input
    name="local_time"
    label="Local time"
    fieldtype="glide_time"
    .utcOffset=${-5}
    .value=${'14:00:00'}
  ></aiux-control-time-input>
`;
```

## API

### Properties and attributes

None of this control's own properties declare an explicit `attribute:` name, so each attribute is the property name lowercased (e.g. `fieldType` → attribute `fieldtype`, `utcOffset` → `utcoffset`).

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `fieldType` | `fieldtype` | `string` | `FieldType.Time` (`'glide_time'`) | Gates whether `utcOffset` conversion is applied. | Only the value `'glide_time'` triggers UTC↔local conversion; any other value (e.g. a plain `'time_of_day'` string) disables the conversion path even if `utcOffset` is set. |
| `format` | `format` | `string` | `'HH:mm:ss'` | Re-derives `separator`; toggles the seconds field and AM/PM select on the next render. Does **not** re-parse the existing `hours`/`minutes`/`seconds` segments — only a `value` change does that, so changing `format` alone can leave stale segment values displayed under the new format until `value` changes too. | Time format string, e.g. `'HH:mm:ss'` (24-hour + seconds), `'HH:mm'`, `'hh:mm a'` (12-hour AM/PM), `'hh:mm:ss a'`. Seconds show only if the format contains `s`/`ss`; AM/PM shows only if the format lacks any `H` token and contains a standalone `a`. |
| `utcOffset` | `utcoffset` | `number \| null` | `null` | Read whenever a value is parsed for display or emitted on commit. | Offset applied as **hours**, not minutes, despite the name (`applyTimezoneOffset` multiplies it directly by `3600000`ms) — only takes effect when `fieldType === 'glide_time'`. Display adds the offset (`applyTimezoneOffset(..., false)`, UTC → local); committing a value subtracts it (`applyTimezoneOffset(..., true)`, local → UTC). |
| `separator` | `separator` | `string` | `':'` | Overwritten automatically whenever `format` changes (`.` if `format` contains `.`, else `:`). | Declared and kept in sync with `format`, but not actually read anywhere in rendering or formatting — there is no visible separator character between the segment boxes (they're divided by a CSS border instead). Setting it directly has no effect once `format` changes again, and has no visible effect either way. |
| `value` | `value` (reflects) | `string` | `''` | Re-parsed into hours/minutes/seconds/AM-PM segments whenever it changes externally, **unless** a segment in the component currently has focus (`hasParentFocus`). | The time value, in a format `parseTimeValue` can read: `HH:mm:ss`-style strings, `YYYY-MM-DD HH:mm:ss` datetimes, or a 6-digit `HHMMSS` integer-time string. |

Also inherited and functional: `name`, `label`, `disabled` (forwarded to each segment input and the AM/PM select), `readonly` (forwarded to each segment input and disables the AM/PM select), `required` (forwarded to each segment input; also drives the built-in required-empty validation), `invalid`, `placeholder` (declared but not rendered — see below), `autofocus` (declared but not rendered — see below), `helperContent`, `fieldLayout`, `optional`, `hideRequiredIndicator`, `wrapLabel`, `messages` (overwritten by this control's own required-field validation result), `nowId`, `showUnsavedIndicator`, `decorations`, `showAIIndicator`, `editMode`, `variant`.

Inherited but not currently used: `placeholder` and `autofocus` — both exist on the base class but this control hard-codes per-segment placeholders (`'00'`) and never binds `?autofocus` on its inputs.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TIME_INPUT#VALUE_CHANGED` | `{value, name, fieldType}` | bubbles, composed, not cancelable | A segment loses focus and no other segment in the component now has focus, or an arrow-key increment/decrement occurs. | `value` is `''` if all segments are empty, otherwise the fully formatted time string; this also triggers the built-in required-field validation. |
| `AIUX_CONTROL_TIME_INPUT#STAGED_VALUE_CHANGED` | `{value, name, fieldType}` | bubbles, composed, not cancelable | On every keystroke in a segment field. | Intermediate value as typed, formatted the same way as the committed value. |

### Slots

None (no default slot; no named slots are rendered by this control).

### Methods

None beyond the inherited `focus()`/`reset()`/`validate()` from the base control. `validate()` is overridden here to run the required-field check described above and populate `messages` on failure.

## Integration details

No additional requirements.

### SSR

SSR-safe — all logic runs from lifecycle callbacks and event handlers, none of it during initial render.

### Lifecycle

`value` is parsed into segments on connect and on every external `value` change (guarded by focus state, so mid-edit external updates don't clobber the user's in-progress input).

### Sizing and layout

Uses the shared form-field grid layout (`fieldLayout`); segment inputs render in a fixed-width row (`role="group"`) with visual "Hours"/"Minutes"/"Seconds" labels above each box.

## Accessibility, localization, and customization

Built-in: each segment input has its own `aria-label`, `aria-required`, `aria-invalid`, and `aria-describedby`; the group container has `role="group"` with an aria-label; visual segment labels are `aria-hidden` (redundant with the per-input aria-labels). Arrow-key support: Right/Left move between segments at the field boundary, Up/Down increment/decrement the current segment (wrapping at its max). All copy (segment labels, placeholders, group aria-label, AM/PM option text, required-field message) is produced through `@lit/localize` `msg()` — hard-coded English source strings, not host-settable via a property, but fully translatable. Styling is Tailwind-based with no exposed `::part()` targets or CSS custom properties.
