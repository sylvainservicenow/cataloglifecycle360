# Schedule recurrence

> Source: `@servicenow/aiux-schedule-recurrence@6.0.2` · `components/external/schedule-recurrence/docs/usage/aiux-schedule-recurrence.md`

`<aiux-schedule-recurrence>` is a self-contained card. The host sets the
initial values through properties. The element keeps the working state itself,
validates it, and emits a save payload when the user clicks Save. It never
persists anything; saving, closing, or resetting after Save or Cancel is the
host's job.

Built in: title, start date with a calendar popover, All day toggle, from/to
times, end date, optional "Due in" field, searchable timezone picker (with a
"Floating time" option), Repeats (never/daily/weekly/monthly/yearly) with
interval and day/date options, series end (never / after N occurrences / on a
date), an Advanced settings disclosure with skip dates and exceptions, inline
validation messages, a live plain-language summary, and Cancel/Save buttons.
Save is disabled while the form is invalid. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-schedule-recurrence';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-schedule-recurrence';

@customElement('my-patch-window')
export class MyPatchWindow extends AIUXElement {
  @state() private _editing = true;
  @state() private _summary = '';

  private _onSave(e: CustomEvent) {
    // e.detail.eventRecurrence.event / skipDates / exceptions: yours to persist.
    this._summary = e.detail.eventRecurrence.summary;
    this._editing = false;
  }

  render() {
    if (!this._editing) {
      return html`<p class="whitespace-pre-line">${this._summary}</p>`;
    }
    return html`
      <aiux-schedule-recurrence
        event-title="Patch window"
        start-date="2026-10-05"
        date-format="yyyy-MM-dd"
        time-format="HH:mm"
        from-time="22:00"
        to-time="23:30"
        selected-timezone="Europe/London"
        repeat-type="weekly"
        default-series-end-type="after"
        @aiux-schedule-recurrence:save=${this._onSave}
        @aiux-schedule-recurrence:cancel=${() => (this._editing = false)}
      ></aiux-schedule-recurrence>
    `;
  }
}
```

**What happens:** the form initializes once, on first render. Later property
changes update only the fields listed as "Applied on change". The element
never closes or resets itself on Save or Cancel; this wrapper removes it and
shows the summary on Save.

### Additional patterns

Preset a monthly pattern with skip dates. Every filled skip date needs
`isValid: true`, or Save stays disabled:

```js
html`
  <aiux-schedule-recurrence
    event-title="Board review"
    start-date="10/13/2026"
    date-format="MM/dd/yyyy"
    repeat-type="monthly"
    month-type="day"
    week-index="second"
    day-of-week="2"
    occurrences="12"
    expand-advanced-settings
    .recurrenceSkipDates=${[
      {index: 0, key: 'skip-0', startDate: '12/08/2026', isValid: true}
    ]}
    @aiux-schedule-recurrence:save=${onSave}
    @aiux-schedule-recurrence:cancel=${onCancel}
  ></aiux-schedule-recurrence>
`;
```

## API

### Properties and attributes

Dates are strings in `dateFormat`. Times accept `HH:mm` or `hh:mm AM/PM`.
Boolean properties that default to `true` cannot be turned off with an
attribute. Use a property binding such as `.showNever=${false}`.

"Applied on change" means the new value replaces the user's current value for
that field. It does not fire `change`.

| Property                             | Attribute                               | Type                                                           | Default                                           | Update behavior                                                           | Description                                                                                                                                                                                                   |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventTitle`                         | `event-title`                           | `string`                                                       | `''`                                              | Applied on change                                                         | Title. Required.                                                                                                                                                                                              |
| `startDate`                          | `start-date`                            | `string`                                                       | today, in the timezone                            | Applied on change                                                         | Start date. Changing it re-derives the weekly day and the monthly/yearly date/day options. When `allDay` is false, it also sets the end date to the same date.                                                |
| `toDate`                             | `to-date`                               | `string`                                                       | `startDate`                                       | Initialization: used only when `allDay` is true. Later: applied on change | End date. The field is shown only when all day.                                                                                                                                                               |
| `allDay`                             | `all-day`                               | `boolean`                                                      | `false`                                           | Applied on change                                                         | Hides the times and shows End date.                                                                                                                                                                           |
| `fromTime`                           | `from-time`                             | `string`                                                       | current time                                      | Applied on change                                                         | Start time.                                                                                                                                                                                                   |
| `toTime`                             | `to-time`                               | `string`                                                       | one hour after the current time (capped at 23:59) | Applied on change                                                         | End time. Must be after `fromTime` when the start and end dates are the same.                                                                                                                                 |
| `selectedTimezone`                   | `selected-timezone`                     | `string`                                                       | browser timezone                                  | Applied on change                                                         | IANA id, or `'floating'`. Exceptions always use this timezone.                                                                                                                                                |
| `repeatType`                         | `repeat-type`                           | `RepeatType`                                                   | `'never'`                                         | Applied on change                                                         | Changing it resets that repeat type's options to defaults. `'never'` clears skip dates and exceptions. Changing from `'never'` restores `recurrenceSkipDates` and `recurrenceExceptions`.                     |
| `dateFormat`                         | `date-format`                           | `'dd-MM-yyyy' \| 'yyyy-MM-dd' \| 'MM/dd/yyyy' \| 'dd/MM/yyyy'` | `'dd-MM-yyyy'`                                    | Updates immediately; existing date strings are not converted              | Format for every date in, shown, and out. Other values log a warning and fall back to the default.                                                                                                            |
| `timeFormat`                         | `time-format`                           | `'hh:mm a' \| 'HH:mm'`                                         | `'hh:mm a'`                                       | Updates immediately                                                       | Format for the time fields and the payload (`'hh:mm AM'` or `'HH:mm'`). Other values log a warning and fall back to the default.                                                                              |
| `availableTimezones`                 | property only                           | `TimezoneOption[]`                                             | built-in list                                     | Updates immediately                                                       | Timezone choices. "Floating time" is always listed first. `[]` hides the timezone field.                                                                                                                      |
| `firstDayOfWeek`                     | `first-day-of-week`                     | `number` (0 = Sunday)                                          | `1`                                               | Updates immediately                                                       | Order of the weekly day checkboxes. It does not change the calendar popovers.                                                                                                                                 |
| `recurrenceSkipDates`                | property only                           | `SkipDate[]`                                                   | `[]`                                              | Replaces the list on change                                               | Initial skip dates. Ignored while repeats is `'never'`.                                                                                                                                                       |
| `recurrenceExceptions`               | property only                           | `RecurrenceException[]`                                        | `[]`                                              | Replaces the list on change                                               | Initial exceptions. Pass the full shape, including all four detail objects. Ignored while repeats is `'never'`.                                                                                               |
| `seriesEndFields`                    | property only                           | `SeriesEndType[]`                                              | `['never', 'on', 'after']`                        | Updates immediately                                                       | Series-end options to offer. Array order is ignored; the display order is never, after, on.                                                                                                                   |
| `showNever` / `showAfter` / `showOn` | `show-never` / `show-after` / `show-on` | `boolean`                                                      | `true`                                            | Updates immediately                                                       | Hide one series-end option each, together with `seriesEndFields`. If all three are false, none of them filters. Hiding an option does not change the selected series-end type.                                |
| `defaultSeriesEndType`               | `default-series-end-type`               | `SeriesEndType`                                                | `'never'`                                         | Initialization, and each time repeats changes                             | Series end selected for a new repeat type. `'after'` sets 10 occurrences. `'on'` sets the date to `defaultSeriesEndDays` after the start.                                                                     |
| `defaultSeriesEndDays`               | `default-series-end-days`               | `number`                                                       | `180`                                             | Initialization, and each time repeats changes                             | Days from the start date to the prefilled series-end date.                                                                                                                                                    |
| `occurrences`                        | `occurrences`                           | `number`                                                       | —                                                 | Initialization only                                                       | Sets the series end to after N occurrences. Ignored when repeats is `'never'`.                                                                                                                                |
| `repeatUntil`                        | `repeat-until`                          | `string`                                                       | `''`                                              | Initialization only                                                       | Sets the series end to that date. Takes precedence over `occurrences`.                                                                                                                                        |
| `repeatCount`                        | `repeat-count`                          | `number`                                                       | —                                                 | Initialization only                                                       | Interval ("every N").                                                                                                                                                                                         |
| `daysInWeek`                         | property only                           | `number[]` (0 = Sunday)                                        | start date's weekday                              | Initialization only                                                       | Weekly days. `repeatType` must be `'weekly'`.                                                                                                                                                                 |
| `monthType` / `yearType`             | `month-type` / `year-type`              | `'date' \| 'day'`                                              | `'date'`                                          | Initialization only                                                       | Monthly or yearly "On": a date number, or a weekday in a week of the month. Requires the matching `repeatType`.                                                                                               |
| `weekIndex`                          | `week-index`                            | `'first' \| 'second' \| 'third' \| 'fourth' \| 'last'`         | from start date                                   | Initialization only                                                       | Week of the month for `'day'`. Monthly or yearly only.                                                                                                                                                        |
| `dayOfWeek`                          | `day-of-week`                           | `number` (0 = Sunday)                                          | from start date                                   | Initialization only                                                       | Weekday for `'day'`. Monthly or yearly only.                                                                                                                                                                  |
| `expandAdvancedSettings`             | `expand-advanced-settings`              | `boolean`                                                      | `false`                                           | Opens or closes on change                                                 | Advanced settings open state. While it is open and recurring, an empty skip-date row is added whenever there are none.                                                                                        |
| `disableSkipDate`                    | `disable-skip-date`                     | `boolean`                                                      | `false`                                           | Updates immediately                                                       | Hides the skip dates section.                                                                                                                                                                                 |
| `hideEndDateOnAllDay`                | `hide-end-date-on-all-day` (reflected)  | `boolean`                                                      | `false`                                           | Updates immediately                                                       | With all day, hides End date, keeps it equal to the start date, and omits `toDate` from the payload.                                                                                                          |
| `showDueInField`                     | `show-due-in-field`                     | `boolean`                                                      | `false`                                           | Field: immediately. Initial value: initialization only                    | Shows the "Due in" dropdown (main event only) and adds `dueIn` to the payload.                                                                                                                                |
| `dueInMaxDays`                       | `due-in-max-days`                       | `number`                                                       | `90`                                              | Updates immediately                                                       | "Due in" options run from 0 to this value, clamped to 0–365.                                                                                                                                                  |
| `dueInDefaultValue`                  | `due-in-default-value`                  | `number`                                                       | `10`                                              | Initialization only                                                       | Initial "Due in" when `dueIn` is unset.                                                                                                                                                                       |
| `dueIn`                              | `due-in`                                | `number`                                                       | —                                                 | Initialization only                                                       | Initial "Due in" value.                                                                                                                                                                                       |
| `validationMessages`                 | property only                           | `ValidationMessage[]`                                          | `[]`                                              | Updates immediately                                                       | Host-supplied alerts (`role="alert"`) shown above the summary. They do not affect Save.                                                                                                                       |
| `showAlert`                          | `show-alert`                            | `boolean`                                                      | `false`                                           | Updates immediately                                                       | Shows an `<aiux-alert-message>` banner at the top.                                                                                                                                                            |
| `alertType`                          | `alert-type`                            | `string`                                                       | `'error'`                                         | Updates immediately                                                       | Alert type: `info`, `success`, `warning`, `error`, and so on.                                                                                                                                                 |
| `alertTitle`                         | `alert-title`                           | `string`                                                       | `''`                                              | Updates immediately                                                       | Banner title.                                                                                                                                                                                                 |
| `alertMessage`                       | `alert-message`                         | `string`                                                       | `''`                                              | Updates immediately                                                       | Banner text.                                                                                                                                                                                                  |
| `alertDismissible`                   | `alert-dismissible`                     | `boolean`                                                      | `false`                                           | Updates immediately                                                       | Adds a close button. Closing hides the banner and emits `alert-dismiss` (bubbles, composed) from the banner; `showAlert` stays `true`. To show it again later, set `showAlert` to `false` on `alert-dismiss`. |

### Events

Use the literal event names; the package does not export constants for them.

| Event                              | `detail`             | Delivery                          | Fires when                                                                                                                           | Notes                                                                                                                                                                                                         |
| ---------------------------------- | -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-schedule-recurrence:save`    | `SaveEventDetail`    | Bubbles, composed, not cancelable | The user clicks an enabled Save.                                                                                                     | Save is enabled only when validation passes, no time field holds unparseable text, and every filled skip date has `isValid: true`.                                                                            |
| `aiux-schedule-recurrence:cancel`  | `null`               | Bubbles, composed, not cancelable | The user clicks Cancel.                                                                                                              | Nothing is reset.                                                                                                                                                                                             |
| `aiux-schedule-recurrence:change`  | `ChangeEventDetail`  | Bubbles, composed, not cancelable | Each user edit: title on blur, other controls on selection. It also fires for adding, removing, or editing a skip date or exception. | Not fired for property changes, the Advanced settings toggle, collapsing an exception, or time text that cannot be parsed.                                                                                    |
| `aiux-schedule-recurrence:invalid` | `InvalidEventDetail` | Bubbles, composed, not cancelable | Validity flips in either direction, from user edits or property changes.                                                             | Initial validity is treated as invalid. A form that starts valid fires `{isValid: true}` during the first update; one that starts invalid (for example, an empty title) fires nothing until it becomes valid. |

### Slots

- `footer-start`: content placed at the start of the footer row, before
  Cancel and Save.

### Methods

None.

### Data shapes

```ts
type RepeatType = 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type SeriesEndType = 'never' | 'on' | 'after';
type WeekLabel = 'first' | 'second' | 'third' | 'fourth' | 'last';

// ---- Inputs ----
interface TimezoneOption {
  id: string; // value stored in selectedTimezone
  label: string;
}

interface SkipDate {
  index: number;
  key: string; // unique; used to track rows
  startDate: string; // dateFormat; '' for an empty row
  isValid: boolean; // must be true for a filled date, or Save stays disabled
  validationMessage?: string; // not read
}

interface SeriesEndDetails {
  type: SeriesEndType;
  date?: string;
  occurrences?: number;
}
interface OnDetails {
  type: 'date' | 'day';
  dateNumber?: number; // 1-31, for 'date'
  weekType?: WeekLabel; // for 'day'
  day?: number; // 0 = Sunday, for 'day'
}

interface RecurrenceEvent {
  eventTitle: string;
  startDate: string;
  toDate: string;
  allDay: boolean;
  fromTime: string; // user edits are stored as 'HH:mm'
  toTime: string;
  selectedTimezone: string;
  repeats: RepeatType;
  dayDetails: {every: number; seriesEndDetails: SeriesEndDetails};
  weekDetails: {
    every: number;
    daysInWeek: number[];
    seriesEndDetails: SeriesEndDetails;
  };
  monthDetails: {
    every: number;
    onDetails: OnDetails;
    seriesEndDetails: SeriesEndDetails;
  };
  yearDetails: {
    every: number;
    onDetails: OnDetails;
    seriesEndDetails: SeriesEndDetails;
  }; // the month comes from startDate
  dueIn?: number;
}

interface RecurrenceException extends RecurrenceEvent {
  index: number;
  key: string; // unique
  collapsed?: boolean; // form collapsed in Advanced settings
}

interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  header?: string;
}

// ---- Event details ----
interface ChangeEventDetail {
  field: string; // e.g. 'eventTitle', 'repeats', 'weekDetails.daysInWeek',
  // 'monthDetails.onDetails.day', 'dayDetails.seriesEndDetails.type', 'skipDates', 'exceptions'
  value: unknown; // for 'skipDates' / 'exceptions': the whole current list
  event: RecurrenceEvent; // copy of the full current main event
}

interface InvalidEventDetail {
  isValid: boolean;
  errors: {field: string; message: string}[];
  // field: 'eventTitle', 'startDate', 'toDate', 'fromTime', 'toTime', 'daysInWeek',
  // 'seriesEndDate', 'occurrences', 'skipDates[i].startDate', 'exceptions[i].<field>'
}

interface SaveEventDetail {
  eventRecurrence: {
    event: SavedEvent;
    skipDates: SavedSkipDate[]; // empty rows removed
    exceptions: SavedException[];
    summary: string; // same text as the Summary panel; '\n\n' between sections
  };
}

interface SavedEvent {
  eventOrRuleName: string; // the title
  startDate: string;
  toDate?: string; // only when allDay and not hideEndDateOnAllDay
  fromTime?: string; // only when not allDay; formatted per timeFormat
  toTime?: string;
  repeats: RepeatType;
  selectedTimezone: string;
  allDay: boolean;
  dueIn?: number; // only when showDueInField
  // Only the one key that matches `repeats`:
  dayDetails?: {every: number; seriesEndDetails: SavedSeriesEnd};
  weekDetails?: {
    every: number;
    daysInWeek: number[];
    seriesEndDetails: SavedSeriesEnd;
  };
  monthDetails?: {
    every: number;
    onDetails: SavedOnDetails;
    seriesEndDetails: SavedSeriesEnd;
  };
  yearDetails?: {
    every: number;
    onDetails: SavedOnDetails;
    seriesEndDetails: SavedSeriesEnd;
  };
}

type SavedSeriesEnd =
  | {type: 'never'}
  | {type: 'on'; date: string}
  | {type: 'after'; occurrences: number};

type SavedOnDetails =
  | {type: 'date'; dateNumber: number}
  | {type: 'day'; day: number; weekType: WeekLabel};

interface SavedSkipDate {
  startDate: string;
  toDate: string; // same as startDate
  index: number;
  eventOrRuleName: string; // 'Skip Date <index>'
  repeats: 'never';
  allDay: true;
  key: string; // 'key<index>'
}

// Same rules as SavedEvent, without dueIn; selectedTimezone is the main event's.
type SavedException = Omit<SavedEvent, 'dueIn'> & {index: number; key: string};
```

The package does not export these types. The saved shapes differ from the
input shapes: `eventOrRuleName` instead of `eventTitle`, and only the active
detail object, whose `every`, `daysInWeek`, `onDetails`, and
`seriesEndDetails` map to `repeatCount`, `daysInWeek`, `monthType`/`yearType`,
`weekIndex`, `dayOfWeek`, `occurrences`, and `repeatUntil`. Map them back
before reloading saved data; exceptions need all four detail objects again.

## Integration details

### SSR

The card renders on the server. The default date, times, and timezone are
computed only in the browser. Server output leaves them empty unless you set
them.

### Lifecycle

- State initializes on the first update and survives disconnect and
  reconnect.
- Re-setting properties never resets the whole form. To start over, render a
  new element.

### Sizing and layout

- `display: block; width: 100%`. The host is a size container, so its width
  must come from its parent. It collapses inside a shrink-to-fit parent.
- The layout is based on the element's own width: labels stack below 640px,
  and the footer stacks below 320px. Height grows with content; the element
  does not scroll internally.
- The card has its own border, rounded corners, padding, and large shadow.

## Accessibility, localization, and customization

- **Accessibility:** every control has a label, and required fields announce
  "required". Dropdowns support arrow keys, Enter/Space, and Escape. The card
  has no heading; provide one if the page needs it.
- **Localization:** labels, validation messages, and the summary are localized.
  The following are hard-coded English: the "Floating time" option and its
  description, ordinal suffixes in the summary ("1st", "2nd"), and the
  payload's `Skip Date N` names. Host strings (`alertTitle`, `alertMessage`,
  `validationMessages`, timezone labels) are shown as given.
- **Customization:** no parts or custom properties. Colors come from the page's
  DaisyUI theme (`base-100`, `base-200`, `base-300`, and text tokens).
