# aiux-control-time-worked

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-time-worked.md`

Displays a running (or paused) elapsed-time counter for a `timer`-type field, with play/pause controls and a popover for manually editing the accumulated duration. It ticks once per second while running and reports the accumulated total on every tick and on manual edit.

Built in: the interval-based ticking clock, play/pause toggling, and the manual-edit popover (backed by `<aiux-control-duration>`). Do not build these yourself.

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
      <aiux-control-time-worked
        name="work_duration"
        label="Work duration"
        .initialValue=${'0 00:00:00'}
        @AIUX_CONTROL_TIME_WORKED#STAGED_VALUE_CHANGED=${this._onTick}
      ></aiux-control-time-worked>
    `;
  }

  _onTick(e) {
    const {totalTime, isTimerRunning, currentSystemTime} = e.detail;
    // totalTime is a UTC date string measured from 1970-01-01; persist as needed
  }
}
```

**What happens:** the timer starts paused at `initialValue`. Clicking the play icon starts it; it then ticks every second, dispatching `AIUX_CONTROL_TIME_WORKED#STAGED_VALUE_CHANGED` on each tick with the accumulated total. Clicking pause stops it. Setting `autoStart` starts the timer automatically once connected (unless `readonly`).

**Gotcha:** flipping `readonly` to `true` on a running timer does not just pause it — it calls the internal controller's `reset()`, which zeroes the elapsed-since-start counter back to `0 00:00:00` before re-deriving the displayed total from `initialValue`. The session's running elapsed time is discarded silently, with no `STAGED_VALUE_CHANGED` dispatched for the reset itself. Flipping `readonly` back to `false` does not resume the timer either — it only restarts if `autoStart` is also `true`. To pause/resume without losing time, use the play/pause icon (or drive the control's own start/stop), not the `readonly` attribute.

### Additional patterns

Manually correcting the accumulated time via the edit popover (opened by focusing the pencil icon): editing and clicking "OK" stops/resets/restarts the internal clock at the new value and dispatches the same `STAGED_VALUE_CHANGED` event immediately, without waiting for the next tick.

Resyncing the timer's base after an unrelated form reload, without touching `initialValue`'s string value: pass a new `formData` object reference (even with the same shape). Any change to `formData` is treated exactly like an `initialValue` change — it re-derives the base time from the current `initialValue` and resets/restarts the internal clock:

```js
html`
  <aiux-control-time-worked
    name="work_duration"
    label="Work duration"
    .initialValue=${'0 00:05:00'}
    .formData=${{isNewRecord: false, serializedChanges: this.lastSyncToken}}
  ></aiux-control-time-worked>
`;
```

Each time `this.lastSyncToken` changes (e.g. after the host refetches the record), the control resets to `initialValue` and, if `autoStart` is set and the control isn't `readonly`, starts ticking again from there — useful for re-arming the timer after a server round-trip without having to change `initialValue` itself.

## API

### Properties and attributes

None of this control's own properties declare an explicit `attribute:` name, so each attribute is the property name lowercased with no dashes (e.g. `initialValue` → attribute `initialvalue`). Prefer property bindings.

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `autoStart` | `autostart` | `boolean` | `false` | Read on first render and whenever `readonly` changes; starts the timer if not readonly. | Starts the timer automatically on connect. |
| `initialValue` | `initialvalue` | `string` (`"D HH:mm:ss"`) | `'0 00:00:00'` | On change, resets the clock to this base and restarts it if `autoStart` and not `readonly`. | Base duration the running timer adds elapsed time to. |
| `originalValue` | `originalvalue` | `string` | `''` | Not currently used. | Declared but never read by this control. |
| `formData` | `formdata` | `ControlFormData` | `undefined` | Any change re-applies `initialValue` (treated the same as an `initialValue` change). | Form-level context; only used as a re-initialization trigger, not read for its contents. |
| `liveUpdate` | `liveupdate` | `object` | `undefined` | Not currently used. | Declared but never read. |
| `configAria` | `configaria` | `{label?, describedBy?}` | `undefined` | Read on every render. | `configAria.label` overrides the auto-generated aria-label on the timer's visible, readonly text input. |
| `isModified` | `ismodified` | `boolean` | `false` | Not currently used. | Declared but never read. |
| `onValueChange` | `onvaluechange` | `(event) => void` | `undefined` | Not currently used. | Declared but never invoked — this control only ever dispatches staged changes, never a committed "value changed". No `attribute: false` is set, so the attribute is still the lowercased property name like any other property here; a function value can only be passed via a property binding. |
| `onStagedValueChange` | `onstagedvaluechange` | `(event) => void` | `undefined` | Called with the same payload as the dispatched event, immediately after dispatch. | Direct callback alternative to listening for the event. |
| `value` | `value` (reflects) | `string` | `''` | Read only for the readonly inline view; the component never writes to it. | Set this from the host if you want the readonly/inline display to show a specific value — the running timer itself does not update it. |

Also inherited and functional: `name`, `label`, `readonly` (setting it `true` resets the internal clock to zero elapsed time, discarding the running session total, as described above; setting it back to `false` only resumes ticking if `autoStart` is also `true`), `required`, `invalid`, `helperContent`, `fieldLayout`, `variant`, `editMode`, `wrapLabel`, `hideRequiredIndicator`, `showUnsavedIndicator`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `messages`, `nowId`.

Inherited but not currently used: `disabled` — never referenced anywhere in this control; play/pause and edit-popover interactions remain active regardless of its value. `controlStyles` is also inherited but never bound to anything in this control's render — unlike controls that call `controlStylesMap()`/`containerControlStylesMap()`, time-worked ignores it entirely.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TIME_WORKED#STAGED_VALUE_CHANGED` | `{name, totalTime, isTimerRunning, currentSystemTime}` | bubbles, composed, cancelable | Once per second while running, and immediately after a manual edit is saved. | `totalTime` is a UTC date string (`Date.toUTCString()`) measured from `1970-01-01T00:00:00Z` plus the accumulated hours/minutes/seconds — parse it as a date and take the offset from epoch, not as a literal timestamp. There is no corresponding `VALUE_CHANGED` event: this control never dispatches a committed value. |

### Slots

None.

### Methods

None beyond the inherited `focus()`/`reset()` from the base control.

## Integration details

No additional requirements.

### SSR

SSR-safe: the timer only starts ticking in `firstUpdated`, which does not run during server rendering.

### Lifecycle

The internal clock uses `window.setTimeout` on a 1-second cadence while running, and is stopped and its timeout cleared on disconnect.

### Sizing and layout

Uses the shared form-field grid layout (`fieldLayout`); the timer row is a single `aiux-input`-styled `<label>` wrapping a readonly text display and, when not `readonly`, the edit-popover and play/pause icon.

## Accessibility, localization, and customization

Built-in: the visible, readonly timer display carries an `aria-label` (host-overridable via `configAria.label`), and the total-time summary is in a `role="status"` live region so screen readers announce updates. All static copy ("Edit session time", "Cancel", "OK", "Total time: …", the aria-labels) is produced through `@lit/localize` `msg()` — hard-coded but fully translatable, and not host-settable via a property (only `configAria.label` is host-settable). Styling is Tailwind/DaisyUI with no exposed `::part()` targets or CSS custom properties; the inherited `controlStyles` property is never bound to anything here, so setting it has no effect.
