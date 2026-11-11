# AIUX Control Date Picker

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-date-picker.md`

`aiux-control-date-picker` is a form-field control for a single date, time, or date-time value: a text input that accepts typed values plus a calendar popup for picking one. It reports the committed value and, separately, in-progress typing/selection before commit. Built in: a popup calendar with day/month/year grids, a month/year dropdown selector, full keyboard navigation, outside-click and Escape close, viewport-aware popup placement (flips above when there's no room below), an optional bottom bar with a confirm (labeled "Ok", not "Apply")/Cancel pair instead of auto-confirm-on-select, an inline (non-popup) display mode, a time-of-day field for date-time/time views, moment-style format token conversion (`YYYY`, `DD`, etc.) to date-fns tokens, disabled-date/date-range rules, and an optional "time ago" read-only rendering. Do not rebuild any of this yourself.

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

class MyDateField extends AIUXElement {
  static properties = {
    value: {type: String}
  };

  constructor() {
    super();
    this.value = '';
  }

  render() {
    if (isServer) return html``;
    return html`
      <div style="max-width: 320px;">
        <aiux-control-date-picker
          name="start_date"
          label="Start date"
          format="YYYY-MM-DD"
          .value=${this.value}
          required
          @AIUX_CONTROL_DATE_PICKER#VALUE_CHANGED=${e => {
            this.value = e.detail.value;
          }}
        ></aiux-control-date-picker>
      </div>
    `;
  }
}
customElements.define('my-date-field', MyDateField);
```

**What happens:** typing in the input or picking a day in the calendar updates the field. Because no `bottom-bar` attribute is set, picking a calendar day commits immediately (fires `AIUX_CONTROL_DATE_PICKER#VALUE_CHANGED`) and closes the popup; typed input commits on blur instead.

### Additional patterns

Date-time with a confirm/cancel bottom bar, so a calendar pick doesn't commit until the user clicks the footer's confirm button (labeled "Ok"):

```js
html`
  <aiux-control-date-picker
    name="due_date"
    label="Due date"
    type="standard"
    format="YYYY-MM-DD hh:mm:ss a"
    time-picker
    bottom-bar
    .value=${this.value}
    @aiux-control-date-picker-change=${e => {
      this.value = e.detail.value;
    }}
  ></aiux-control-date-picker>
`;
```

A period-type field (e.g. a `glide_date_time`-family weekly/monthly/quarterly/yearly field) with disabled dates. **For non-standard `type`s, entries are parsed with that type's own fixed period format, not the control's `format` property** — quarterly entries must match `'[Q]Q YYYY'`-style text (e.g. `'Q1 2024'`), not an ISO date string. Writing an ISO date here (e.g. `'2024-01-01'`) silently fails to parse, so the rule never matches anything:

```js
html`
  <aiux-control-date-picker
    name="fiscal_period"
    label="Fiscal quarter"
    type="quarterly"
    .disabledDates=${[{before: 'Q1 2024'}]}
    .value=${this.value}
    @AIUX_CONTROL_DATE_PICKER#VALUE_CHANGED=${e => {
      this.value = e.detail.value;
    }}
  ></aiux-control-date-picker>
`;
```

Read-only relative-time display (renders "2 hours ago" instead of the raw value):

```js
html`
  <aiux-control-date-picker
    name="updated_on"
    label="Last updated"
    readonly
    time-ago-format
    .value=${this.value}
  ></aiux-control-date-picker>
`;
```

## API

### `<aiux-control-date-picker>`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `type` | `type` | `'standard' \| 'weekly' \| 'monthly' \| 'quarterly' \| 'yearly'` | `'standard'` | Re-renders; changes calendar view and default format | Calendar/value shape. Non-`standard` types ignore `timePicker`. |
| `format` | `format` | `string` | `''` | Re-renders | Moment-style date format (`YYYY-MM-DD hh:mm:ss a`, etc.), converted internally to date-fns tokens. When set, it overrides the calendar's display/parse format for any `type`, not only `'standard'` — but the separate blur-validation path (and the non-`'standard'` default formats like `MMM yyyy`) still uses a fixed type-based format for `weekly`/`monthly`/`quarterly`/`yearly`, so an explicit `format` on a non-`'standard'` type can leave the calendar display and blur validation using different formats. Empty string falls back to a type-based default (`YYYY-MM-DD`, or `YYYY-MM-DD hh:mm:ss a` when a time picker is active). |
| `originalFormat` | `original-format` | `string` | `''` | Re-renders | Original format string used to detect/validate a trailing timezone (`z`) token, independent of the working `format`. |
| `actualFormat` | `actual-format` | `string` | `''` | Re-renders | Overrides `format`/`originalFormat` as the source of truth for timezone-token handling when set (used for platform "z-token" date fields). |
| `actualValue` | `actual-value` | `string` | `''` | Re-renders | Declared for z-token date field parsing metadata, but not read anywhere by this control's own logic (unlike `actualFormat`, which is). |
| `timePicker` | `time-picker` | `boolean` | `false` | Re-renders; adds a time field to the calendar and switches the default format | Enables the time-of-day field for `type='standard'`. |
| `hasTimePicker` | `has-time-picker` | `boolean` | `false` | Re-renders | Deprecated alias for `timePicker` — kept for backward compatibility; use `timePicker`. |
| `isoWeek` | `iso-week` | `boolean` | `false` | Re-renders | ISO-8601 week numbering, weekly view only. Not supported on standard/monthly/quarterly/yearly views. |
| `firstDayOfWeek` | `first-day-of-week` | `number` | `1` | Re-renders | 1 = Sunday … 7 = Saturday. Ignored (forced to Monday) when `isoWeek` is set. |
| `utcOffset` | `utc-offset` | `number \| null` | `null` | Re-renders | UTC offset in hours (e.g. `5.5`), used to compute a default date/time on popup open and to adjust the committed value on confirm. |
| `yearRange` | `year-range` | `{start: number; end: number; relative: boolean}` | `{start: -100, end: 100, relative: true}` | Re-renders | Years shown in the calendar's year picker. `relative: true` treats `start`/`end` as offsets from the current year. Years outside the range can still be typed. |
| `disabledDates` | `disabled-dates` | `Array<string \| {start,end} \| {before} \| {after}>` | `[]` | Not forwarded to the calendar, so these dates stay selectable there. They are only enforced at blur/save validation (`value.controller.ts`'s `isDateIncluded` check), which rejects a matching date with an "Invalid selection" error (see **Accessibility** below). | Dates/date ranges rejected at validation time, not in the calendar UI. String entries and `start`/`end` are inclusive; `before`/`after` are exclusive. Values are parsed with the *effective* format for `type` (e.g. `'[Q]Q YYYY'` for `type="quarterly"`) — **not** the control's own `format` property, which is ignored for every non-`'standard'` `type`. |
| `bottomBar` | `bottom-bar` | `boolean` | `false` | Re-renders | `false` (default): picking a calendar day commits and closes immediately. `true`: picking a day only stages the value — the user must click the footer's confirm button (labeled "Ok", commits) or Cancel (reverts). |
| `inputReadonly` | `input-readonly` | `boolean` | `false` | Re-renders | Blocks typing in the text field while still allowing the calendar popup to open and be used. |
| `displayInline` | `display-inline` | `boolean` | `false` | Re-renders | Hides the text input/toggle button and renders the calendar directly (no popup/teleport). Opens automatically once connected (gated by `readonly` — `disabled` has no effect here either, per the `disabled` row below) and never self-closes — intended for embedding inside a caller-owned floating container. |
| `description` | `description` | `string` | `''` | Re-renders | Plain text shown below the control. |
| `fieldName` | `field-name` | `string` | `''` | Re-renders | Field-name metadata passed through for data-context/NACM use. Not read by the control's own logic. |
| `fieldType` | `field-type` | `string` | `''` | Re-renders | Field-type metadata passed through for data-context/NACM use. Not read by the control's own logic. |
| `recordSysId` | `record-sys-id` | `string` | `''` | Re-renders | Record sys_id metadata passed through for data-context/NACM use. Not read by the control's own logic. |
| `tableName` | `table-name` | `string` | `''` | Re-renders | Table-name metadata passed through for data-context/NACM use. Not read by the control's own logic. |
| `slot` | `slot` | `string` | `''` | Re-renders | Property-only override of the native `slot` attribute; not used by the control's own rendering. |
| `declarativeActionsProps` | `declarative-actions-props` | `Record<string, any>` | `{}` | Re-renders | Passed through for declarative-actions integration. Not read by the control's own logic. |
| `language` | `language` | `string` | `'en'` | Resolves a new date-fns locale on change (weekday/month names, `AM`/`PM`, etc.) | BCP-47-ish language code (`en`, `fr`, `zh_CN`, `pt-BR`). Falls back to English if unresolvable. Does not translate the built-in UI strings (Ok/Cancel/Now/etc.) — those come from the app's own `@lit/localize` locale. |
| `size` | `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Re-renders | Input height. Forced to `'sm'` when `variant='compact'`. |
| `color` | `color` | `'initial' \| 'critical' \| 'high' \| 'warning' \| 'moderate' \| 'positive' \| 'info' \| 'low' \| 'blue' \| 'brown' \| 'gray' \| 'green' \| 'green-yellow' \| 'magenta' \| 'orange' \| 'pink' \| 'purple' \| 'teal' \| 'yellow'` | `'initial'` | Re-renders | Background tint applied to the input, e.g. to flag a validation state. |
| `timeAgoFormat` | `time-ago-format` | `boolean` | `false` | Re-renders | When `true` **and** `readonly` is also `true`, renders `value` as a localized relative-time string (e.g. "2 hours ago") instead of the raw text, with the absolute value available via `title` and a hidden `aria-describedby` span. Has no effect when the control is editable. |
| `ariaLabel` | `aria-label` | `string` | `''` | Declared, not read in `render()` | Dead property — despite the name, it has no effect on the rendered ARIA label. |
| `ariaLabelledby` | `aria-labelledby` | `string` | `''` | Declared, not read in `render()` | Dead property — no effect on rendered output. |
| `ariaDescribedby` | `aria-describedby` | `string` | `''` | Declared, not read in `render()` | Dead property — no effect on rendered output. |
| `configAria` | `config-aria` | `Record<string, string>` | `{}` | Passed through to `date-picker-core`, which also declares it but never reads it | Dead property — despite being forwarded internally, nothing ever consumes it. |
| `formData` | `form-data` | `ControlFormData` (`Record<string, any>`) | `{}` | Re-renders | Ambient form-data context, forwarded for NACM/data-context use. |
| `datePickerMessages` | none (`attribute: false`) | `Array<{type: string; message: string}>` | `[]` | Re-renders; rendered as inline alert lines directly below the input row (always visible, independent of whether the popup is open) | Extra validation/info messages shown alongside the input, separate from the field-level `messages` property (label/below-field messages come from the inherited `messages` instead). |
| `locale` | none (`attribute: false`) | date-fns `Locale` | English (`date-fns/locale/enUS`) | Re-renders | Resolved automatically from `language`; can be set directly to override. |
| `onValueChange` | `on-value-change` | `(event: {value, error, date, isoDate, name}) => void` | `undefined` | n/a | Callback invoked with the same payload as `aiux-control-date-picker-change`, on the same commit paths only (bottom-bar confirm or `displayInline` selection) — **not** called on a plain calendar pick without `bottomBar`/`displayInline`, nor on blur. |
| `onStagedValueChange` | `on-staged-value-change` | `(event: {value: string}) => void` | `undefined` | n/a | Callback invoked only when the bottom bar's Cancel action reverts the staged value — not on every keystroke or calendar pick. |
| `opened` | none (plain field, not a Lit reactive property) | `boolean` | `false` | Setting it does not trigger a re-render | Whether the popup is currently open. Reflects internal state; not intended to be set by the host. |
| `savePending` | none (plain field) | `boolean` | `false` | Setting it does not trigger a re-render | Internal flag guarding a timezone-format restore race on popup close. Not intended for host use. |
| `isInitialValueNeeded` | none (plain field) | `boolean` | `false` | Setting it does not trigger a re-render | Internal flag for seeding a default date/time on popup open. Not intended for host use. |
| `storedFormat` | none (plain field) | `string` | `''` | Setting it does not trigger a re-render | Internal snapshot of `format` used to restore a timezone-stripped format on popup close. Not intended for host use. |
| `storedValue` | none (plain field) | `string` | `''` | Setting it does not trigger a re-render | Internal snapshot of `value` used to restore on popup close. Not intended for host use. |

Inherited from the shared control base — commonly used with this control:

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Re-renders; re-syncs the staged value when not focused | The committed date/time string, in `format`. |
| `placeholder` | `placeholder` | `string` | `''` | Re-renders | Shown in the text input when empty; falls back to the resolved date format string if unset. |
| `autofocus` | `autofocus` | `boolean` | `false` | Re-renders | Focuses the internal input on first render. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Re-renders | Disables typing and calendar interaction; combine with `timeAgoFormat` for a relative-time display. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Re-renders; also factors into the inherited label section's non-editable styling | **Not forwarded** to `<aiux-control-date-picker-core>` (only `readonly`, `required`, `invalid`, etc. are — see the binding list in `index.ts`), and never read anywhere else in this file either. The core component has its own `disabled` property (defaulting to `false`) that gates auto-open and disables its inner elements, but this wrapper never sets it — so the text input, toggle button, and calendar all stay fully interactive regardless of this property. Use `readonly` if you need to block interaction. |
| `label` | `label` | `string` | `''` | Re-renders | Field label. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Re-renders | Makes the label a link. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Re-renders | `target` for `labelUrl`. |
| `name` | `name` | `string` | `''` | Re-renders | Field name; included in every dispatched event's `detail.name` and used to build ARIA IDs. |
| `required` | `required` (reflected) | `boolean` | `false` | Re-renders | Marks the field required and drives the default required-empty validation message. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Re-renders | Forces the error visual state; also set internally after blur validation. |
| `nowId` | `now-id` | `string` | `''` | Re-renders | Platform element identifier. |
| `controlStyles` | `control-styles` | `string` (raw CSS declarations) | `''` | Re-renders | Per-field style overrides (e.g. from a client script), split between the input's typography and its container's box styles. |
| `fieldLayout` | `fieldlayout` | `FieldLayout` | `{layout: 'auto'}` | Re-renders | `'vertical' \| 'horizontal' \| 'auto'` plus optional grid `columns`. |
| `optional` | `optional` | `boolean` | `false` | Re-renders | Shows an "optional" label indicator. |
| `helperContent` | `helper-content` | `string` | `''` | Re-renders | Helper text/tooltip content next to the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Re-renders | Suppresses the required-field indicator even when `required` is set. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Re-renders | Allows the label to wrap instead of truncating. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Re-renders | Field-level messages rendered below the control (distinct from `datePickerMessages`, which render as inline alert lines directly below the input itself, not inside the calendar popup). |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Re-renders | Icons/decorations rendered inline with the label. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Re-renders | Widget-loader-backed decorations rendered in the addon column. |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Re-renders | Status badges shown when `value` matches a configured entry. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Re-renders | Shows the Now Assist sparkle indicator next to the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Re-renders | Shows an unsaved-change dot next to the label. |
| `editMode` | `edit-mode` (reflected) | `FormFieldEditMode` | `DEFAULT` | Re-renders | `DEFAULT`, `INLINE`, or `DISPLAY_ONLY` — controls whether the field renders editable, edit-on-demand, or read-only inline. |
| `variant` | `variant` (reflected) | `'default' \| 'compact'` | `'default'` | Re-renders | `'compact'` forces `size='sm'` and tightens layout spacing. |
| `nowAssistConfig` | `nowassistconfig` | `NacmConfig \| undefined` | `undefined` | Re-renders | Enables the Now Assist contextual menu when set. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Re-renders | Only meaningful when `nowAssistConfig` is set. |
| `referringTable` | `referring-table` | `string` | `''` | Re-renders | Only meaningful when `nowAssistConfig` is set. |
| `fieldContextMenu` | none (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Re-renders | Right-click personalize/configure menu, populated by the controls factory. |
| `helperText` | `helpertext` | `string` | `''` | Re-renders | Declared on the base class; not read by this control's own render — use `helperContent` for the label's helper content instead. |

#### Events

All events below are `CustomEvent`s dispatched on `<aiux-control-date-picker>` itself, with `bubbles: true`, `composed: true`, `cancelable: true`, and every `detail` object includes a `meta` key (always `undefined` — this control never passes a `meta` argument to `dispatchAction()`) and a `name` key (the control's `name`, added automatically by `dispatchAction()` even when not included in the dispatched payload) alongside the fields listed.

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_DATE_PICKER#ON_FOCUS` | `{name, originalEvent}` | Sync | The internal input or calendar gains focus. | |
| `AIUX_CONTROL_DATE_PICKER#ON_BLUR` | `{name, originalEvent}` | Sync | Focus leaves the control entirely (not to an element still inside its shadow tree). | |
| `AIUX_CONTROL_DATE_PICKER#STAGED_VALUE_CHANGED` | `{value, name, originalEvent}` | Sync | The text input changes on every keystroke, or a calendar day is picked while `bottomBar` is `true` (before the footer confirm). | Not fired for every calendar interaction — only staging paths. |
| `AIUX_CONTROL_DATE_PICKER#VALUE_CHANGED` | Calendar pick (no `bottomBar`, no `displayInline`): `{value, name, originalEvent, error: null}`. Blur, only if the value changed: `{value, oldValue, error, name, originalEvent}`. Also re-dispatched (legacy, no `originalEvent`) from the same commit that fires `aiux-control-date-picker-change`: `{value, error, name}` (`name` is appended automatically by `dispatchAction()`, not part of the explicit payload). | Sync | A value is committed via calendar pick, blur, bottom-bar confirm, or `displayInline` selection. | Can fire twice for one user action: once from this event and once from `aiux-control-date-picker-change`, when the commit goes through the internal `saveValue` path (bottom-bar confirm / `displayInline`). |
| `aiux-control-date-picker-change` | `{value, error, date, isoDate, name}` | Sync (`date`/`isoDate` may be `undefined` if the value doesn't parse) | A value is committed via bottom-bar confirm, or immediately via `displayInline` selection. | Not fired for a plain calendar pick without `bottomBar`/`displayInline`, or for blur — those only fire `AIUX_CONTROL_DATE_PICKER#VALUE_CHANGED`. |
| `aiux-control-date-picker-staged-change` | `{stagedValue, name}` | Sync | The bottom bar's Cancel action reverts the staged value back to the last committed `value`. | |

#### Slots

| Slot | Description |
| --- | --- |
| `end` | Content placed at the end of the input row (forwarded into the internal calendar-core element's `end` slot). |
| `label-end` | Content at the end of the label row (horizontal layout: a separate grid column). |
| `label-inline` | Content inline with the label text. |

#### Methods

| Method | Description |
| --- | --- |
| `focus(): boolean` | Focuses the internal date input. Returns `true` if focus was moved. |
| `blur(): boolean` | Blurs the internal date input. Returns `true` if blur was moved. |
| `getPreviousFocus(): HTMLElement \| null` | Returns the element that had focus before this control was focused, if tracked. |
| `isFocusable(element: HTMLElement): boolean` | Returns whether the given element is considered focusable by the shared focus manager. |
| `reset(): void` | Inherited from the base control. Clears `value` and internal touched/error/focus state. Does not reset date-picker-specific state (`opened`, `format`, `yearRange`, etc.). |

### Data shapes

```ts
type DisabledDateItem =
  | string                          // a single date matching `format`
  | {start: string; end: string}    // inclusive range
  | {before: string}                // exclusive upper bound
  | {after: string};                // exclusive lower bound

interface DatePickerMessage {
  type: string;
  message: string;
}

interface YearRange {
  start: number;
  end: number;
  relative: boolean; // true: start/end are offsets from the current year
}
```

## Integration details

### Platform requirements

None beyond the module registering the `aiux-control-date-picker` custom element on import. `format` uses moment-style tokens (`YYYY`, `DD`, `[Q]`, etc.) and is converted internally to date-fns tokens — pass platform format strings as-is rather than pre-converting them.

### SSR

The element's own render path is SSR-safe. All `window`/`document` access (click-outside/Escape listeners, popup positioning, RTL detection, initial focus) is guarded by `isServer` and runs from `connectedCallback`/`firstUpdated`, not from `render()` or the constructor.

### Lifecycle

On `firstUpdated`, the control locates the internal input inside the companion calendar element's shadow root to wire up focus management; this lookup awaits that companion element's own `updateComplete` first. When `value` changes externally while the control does not have focus, the staged (in-progress) value is resynced to match.

### Sizing and layout

The calendar popup is rendered via a teleport into `document.body` (escaping ancestor stacking contexts such as a collapsed container) and is fixed-positioned against the input's bounding rect, flipping above the input when there isn't roughly 320px of room below. `displayInline` renders the calendar directly in place instead, with no popup and no auto-close — size its container yourself. `size` (`sm`/`md`/`lg`) sets input height; `variant='compact'` forces `sm` and tightens field spacing.

## Accessibility, localization, and customization

Keyboard support is built in for the calendar grid: arrow keys move by day/week, Home/End jump to the start/end of the week, PageUp/PageDown move by month (Shift+PageUp/PageDown moves by year), and Enter/Space select the focused day. The month/year picker grids support the same arrow/Home/End navigation. Escape closes the popup and returns focus to the input; a focus trap keeps keyboard focus inside the open popup. The internal input carries a computed `aria-label` describing the expected format, and `aria-invalid` reflects validation state. `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`, and `configAria` are declared on the element but are dead properties — none of them is actually read anywhere in render, so they do not let the host override or extend these ARIA attributes despite their names.

Built-in UI strings (Ok, Cancel, Now/This Week/This Month/This Year/This Quarter, "just now", the invalid-date and disabled-date error messages, the calendar-toggle button's label/tooltip) are authored in English via `@lit/localize` `msg()` and are translated through the app's own locale build — they are not independently host-configurable per instance. `language` (and the `locale` it resolves) instead controls date-fns-driven output: weekday/month names in the calendar and AM/PM formatting; it does not translate the button/message strings above.

Styling uses only Tailwind/DaisyUI utility classes plus the shared `controlStyles` CSS-string mechanism (split between the input's text styling and its container's box styling) — there are no `--now-*` design tokens and no exposed `::part()`/CSS custom-property API for this control.
