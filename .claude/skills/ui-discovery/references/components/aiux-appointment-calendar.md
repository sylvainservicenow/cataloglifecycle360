# Appointment calendar

> Source: `@servicenow/aiux-appointment-calendar@4.0.2` · `components/external/appointment-calendar/docs/usage/aiux-appointment-calendar.md`

`<aiux-appointment-calendar>` shows the slots in `events` on a week or day grid
and reports the user's choice through Schedule, Reschedule, Propose, and Cancel
events. It never loads slots or books anything: the host supplies `events`,
performs the booking, and updates `events` afterwards.

Built in: Today/previous/next navigation, a date-range picker (week view), a
mini calendar (day view), an optional Day/Week selector, single or multi-slot
selection with a selected-slots popover, a "Next available time slot" link,
category grouping with "+N more", slot badges and tooltips, a timezone and
duration summary, and a footer with Cancel/Propose/Schedule buttons.

## Import

```js
import '@servicenow/aiux-appointment-calendar';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-appointment-calendar';

type Slot = {
  start: string;
  end: string;
  type: 'available' | 'unavailable' | 'selected';
};

@customElement('my-appointment-picker')
export class MyAppointmentPicker extends AIUXElement {
  @state() private _slots: Slot[] = [
    {
      start: '2026-09-28 09:00:00',
      end: '2026-09-28 09:30:00',
      type: 'available'
    },
    {
      start: '2026-09-28 10:00:00',
      end: '2026-09-28 10:30:00',
      type: 'unavailable'
    },
    {
      start: '2026-09-29 14:00:00',
      end: '2026-09-29 14:30:00',
      type: 'available'
    }
  ];

  // Assumes start/end are unique per slot; otherwise match on your own id field.
  private _same(a: Slot, b: Slot) {
    return a.start === b.start && a.end === b.end;
  }

  private _onSchedule(e: CustomEvent<{event: Slot}>) {
    // Local-state demo: book on your backend first; update only on success.
    this._slots = this._slots.map(s =>
      this._same(s, e.detail.event) ? {...s, type: 'selected'} : s
    );
  }

  private _onReschedule(e: CustomEvent<{event: Slot; previousEvent: Slot}>) {
    // Local-state demo: reschedule on your backend first; update only on success.
    this._slots = this._slots.map(s => {
      if (this._same(s, e.detail.previousEvent))
        return {...s, type: 'available'};
      if (this._same(s, e.detail.event)) return {...s, type: 'selected'};
      return s;
    });
  }

  render() {
    return html`
      <div style="height: 640px">
        <aiux-appointment-calendar
          .events=${this._slots}
          context-date="2026-09-28 00:00:00"
          timezone="America/New_York"
          app-title="Book a visit"
          show-view-selector
          @aiux-appointment-calendar:schedule-appointment=${this._onSchedule}
          @aiux-appointment-calendar:reschedule-appointment=${this._onReschedule}
        ></aiux-appointment-calendar>
      </div>
    `;
  }
}
```

**What happens:** once a slot has `type: 'selected'`, the footer shows it as
the booked slot and the Schedule button becomes Reschedule. Only slots with
`type: 'available'` can be selected.

### Additional patterns

Multi-slot proposal:

```js
html`
  <aiux-appointment-calendar
    .events=${slots}
    context-date=${date}
    enable-multi-select-slot
    @aiux-appointment-calendar:propose-appointment=${e => propose(e.detail.events)}
  ></aiux-appointment-calendar>
`;
```

Categories, badges, and a next-available link:

```js
const categories = [
  {id: 'am', label: 'Morning', order: 1},
  {id: 'pm', label: 'Afternoon', order: 2}
];
const events = [
  {
    start: '2026-09-28 09:00:00',
    end: '2026-09-28 09:30:00',
    type: 'available',
    category: 'am',
    primaryInfoData: [{label: 'Recommended', color: 'success'}],
    secondaryInfoData: [{label: 'Dr. Lee'}],
    tooltip: 'Bring your ID'
  }
];

html`
  <aiux-appointment-calendar
    .events=${events}
    .categories=${categories}
    .nextAvailableEvent=${events[0]}
    enable-categories
    view="DAY"
  ></aiux-appointment-calendar>
`;
```

## API

### Properties and attributes

Bind arrays and objects as properties. An admin's Config Editor value overrides
the host's for every property except `events`, `contextDate`, `categories`,
`nextAvailableEvent`, `configAria`, and `enableMultiSelectSlot`.

| Property                       | Attribute                                     | Type                 | Default        | Update behavior                                                          | Description                                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------------------- | -------------------- | -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`                       | property only                                 | `CalendarEvent[]`    | `[]`           | Updates immediately; keeps current selections that are still `available` | All slots, for any dates; only the visible days are drawn. Each `start` must be `YYYY-MM-DD HH:mm:ss` in `timezone`; other formats parse but the slot appears in no day.                                                                                                        |
| `contextDate`                  | `context-date` (reflects)                     | `string`             | `''`           | Navigates immediately; fires `context-date-changed`                      | Date whose week/day is shown. `YYYY-MM-DD HH:mm:ss` or ISO 8601, in `timezone`; empty or invalid means today. The element writes it back (as `YYYY-MM-DD HH:mm:ss`) when the user navigates. While it is empty, view and `timezone` changes do not recompute the visible dates. |
| `view`                         | `view` (reflects)                             | `'WEEK' \| 'DAY'`    | `'WEEK'`       | Updates immediately; fires `view-updated`, clears selection              | Shown view. Invalid values fall back to `WEEK` initially and are ignored later. The Day/Week selector does not write back to `view`, so re-setting the value it already has does nothing.                                                                                       |
| `timezone`                     | `timezone` (reflects)                         | `string` (IANA)      | `'GMT'`        | Updates immediately                                                      | Timezone that slot times are read and shown in. Displayed as-is in the header.                                                                                                                                                                                                  |
| `appTitle`                     | `app-title`                                   | `string`             | `''`           | Updates immediately                                                      | Title above the controls (`<h2>`). None when empty.                                                                                                                                                                                                                             |
| `showViewSelector`             | `show-view-selector`                          | `boolean`            | `false`        | Updates immediately                                                      | Shows the Day/Week selector in the header.                                                                                                                                                                                                                                      |
| `enableMultiSelectSlot`        | `enable-multi-select-slot`                    | `boolean`            | `false`        | Updates immediately; turning it off keeps only the first selection       | Lets users select several slots; adds the selected-slots popover and a Propose button. Schedule is enabled only with exactly one selection.                                                                                                                                     |
| `enableCategories`             | `enable-categories`                           | `boolean`            | `false`        | Updates immediately                                                      | Groups slots under `categories`. No effect when `categories` is empty. Week view then shows up to 5 slots per category and day before "+N more"; without categories every slot shows and the column scrolls.                                                                    |
| `categories`                   | property only                                 | `Category[]`         | `[]`           | Updates immediately                                                      | Category headings, sorted by `order`. Slots whose `category` matches no `id` go to an added "Other" category. The English labels Morning/Afternoon/Evening/Night get a default icon.                                                                                            |
| `nextAvailableEvent`           | property only                                 | `CalendarEvent`      | `{}`           | Updates immediately                                                      | Shows "Next available time slot: <date>" when it has `start`. Clicking it selects the slot in `events` with the same `start` and `end` (or this object if none match) and navigates to its date.                                                                                |
| `numberOfEventsInEachRow`      | `number-of-events-in-each-row`                | `number`             | `5`            | Updates immediately                                                      | Day view only: slot columns (2–5; other values give one column). With categories, slots beyond two rows collapse behind "+N more".                                                                                                                                              |
| `firstDayOfWeek`               | `first-day-of-week`                           | `number`             | `0`            | Updates immediately                                                      | Week start, `0` = Sunday … `6` = Saturday; clamped to 0–6. Also applies to the picker and mini calendar.                                                                                                                                                                        |
| `locale`                       | `locale`                                      | `string`             | `'en'`         | After locale data loads                                                  | Weekday/month names and AM/PM. Must be a moment.js locale code (`fr`, `de`, `zh-cn`, `pt-br`); ServiceNow codes `pb`, `fq`, `zt` are mapped. Unknown codes render English.                                                                                                      |
| `dateFormat`                   | `date-format`                                 | `string` (moment.js) | `'YYYY-MM-DD'` | Updates immediately                                                      | Only its month/day order is used (month-first vs day-first), unless `applyDateFormatGlobally` is `true`.                                                                                                                                                                        |
| `applyDateFormatGlobally`      | `apply-date-format-globally`                  | `boolean`            | `false`        | Updates immediately                                                      | Uses `dateFormat` verbatim for the day heading, footer dates, and slot labels for screen readers (`dddd, <dateFormat>`, `ddd, <dateFormat>, <timeFormat>`). The week range label still uses only the order.                                                                     |
| `timeFormat`                   | `time-format`                                 | `string` (moment.js) | `'h:mm A'`     | Updates immediately                                                      | Slot and footer times.                                                                                                                                                                                                                                                          |
| `showEndTimeInEvents`          | `show-end-time-in-events`                     | `boolean`            | `false`        | Updates immediately                                                      | Slot label shows `start - end` instead of `start`. Ignored for slots with a `title`.                                                                                                                                                                                            |
| `showDurationInEvents`         | `show-duration-in-events`                     | `boolean`            | `false`        | Updates immediately                                                      | Shows each slot's duration (e.g. `30 min`) inside the slot and hides the header duration.                                                                                                                                                                                       |
| `disableTimeDuration`          | `disable-time-duration`                       | `boolean`            | `false`        | Updates immediately                                                      | Hides all duration text. Without it or `showDurationInEvents`, the header shows one duration when every slot has the same length.                                                                                                                                               |
| `disablePreviousSlotDates`     | `disable-previous-slot-dates` (reflects)      | `boolean`            | `false`        | Updates immediately                                                      | Slots that have ended show as unavailable; the previous button is disabled while the visible range starts on or before today; past dates are disabled in the picker and mini calendar.                                                                                          |
| `disableNonAvailableSlotDates` | `disable-non-available-slot-dates` (reflects) | `boolean`            | `false`        | Updates immediately                                                      | In the picker and mini calendar, disables dates with no available slot and dates outside the first-to-last available date. Previous/next buttons are not limited.                                                                                                               |
| `configAria`                   | property only                                 | `AriaConfig`         | `{}`           | Updates immediately                                                      | Accessible names for the calendar region and its body.                                                                                                                                                                                                                          |

### Events

Use the literal event names; they are not exported as constants.

| Event                                              | `detail`                                               | Delivery                          | Fires when                                                                                                                                                                                                                         | Notes                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-appointment-calendar:schedule-appointment`   | `{event: CalendarEvent}`                               | Bubbles, composed, not cancelable | The user clicks Schedule with one slot selected and no slot has `type: 'selected'`.                                                                                                                                                | Clears the selection. Update `events` after booking.                                                                                   |
| `aiux-appointment-calendar:reschedule-appointment` | `{event: CalendarEvent, previousEvent: CalendarEvent}` | Bubbles, composed, not cancelable | The user clicks Reschedule (Schedule while a slot has `type: 'selected'`).                                                                                                                                                         | `previousEvent` is the first `selected` slot. Clears the selection.                                                                    |
| `aiux-appointment-calendar:propose-appointment`    | `{events: CalendarEvent[]}`                            | Bubbles, composed, not cancelable | The user clicks Propose (multi-select only) with at least one slot selected.                                                                                                                                                       | Clears the selection.                                                                                                                  |
| `aiux-appointment-calendar:cancel-clicked`         | `{}`                                                   | Bubbles, composed, not cancelable | The user clicks Cancel.                                                                                                                                                                                                            | Clears the selection; nothing else.                                                                                                    |
| `aiux-appointment-calendar:event-clicked`          | `{event: CalendarEvent, isActive: boolean}`            | Bubbles, composed, not cancelable | The user selects (`isActive: true`) or deselects (`false`) a slot, removes one in the selected-slots popover, clicks Deselect all (once per slot), or clicks the next-available link (only if that slot was not already selected). | Not fired when Schedule, Propose, Cancel, or a view change clears the selection.                                                       |
| `aiux-appointment-calendar:context-date-changed`   | `ContextDateChangedDetail`                             | Bubbles, composed, not cancelable | Today/previous/next, a picker or mini-calendar date, the next-available link, a host change to `contextDate`, and after every view change or `timezone` change while `contextDate` is set.                                         | Not fired on first render. Also fires when the date did not change (e.g. after a view change). Use it to load slots for the new dates. |
| `aiux-appointment-calendar:range-updated`          | `RangeUpdatedDetail`                                   | Bubbles, composed, not cancelable | Once, after the first render.                                                                                                                                                                                                      | Not fired on later navigation; use `context-date-changed`.                                                                             |
| `aiux-appointment-calendar:view-updated`           | `{from: 'WEEK' \| 'DAY' \| null, to: 'WEEK' \| 'DAY'}` | Bubbles, composed, not cancelable | The user picks a view in the selector (even the current one), or the host changes `view`.                                                                                                                                          | Echoing `to` back into `view` fires it again and clears the selection again.                                                           |

Event objects in details are shallow copies of your `events` entries (same
fields, not the same object reference).

### Slots

- `left-footer`: content at the start of the footer button row.
- `right-footer-btns`: replaces the Cancel, Propose, and Schedule buttons.
  There are no methods to trigger those actions, so the replaced actions and
  their events are unavailable.

### Methods

None.

### Data shapes

```ts
interface CalendarEvent {
  start: string; // 'YYYY-MM-DD HH:mm:ss' in `timezone` (see `events`)
  end: string | number; // 'YYYY-MM-DD HH:mm:ss', ISO 8601, or epoch ms; must be after start or the slot is dropped
  type?: 'available' | 'unavailable' | 'selected'; // only 'available' is selectable; 'selected' = currently booked
  title?: string; // replaces the time label
  hasConflict?: boolean; // warning icon
  tooltip?: string; // info icon with this tooltip
  category?: string | number; // matches Category.id
  primaryInfoData?: PrimaryInfoTag[]; // first 2 shown as badges on the slot's top edge
  secondaryInfoData?: SecondaryInfoTag[]; // first 1 shown as a line under the label
}

interface PrimaryInfoTag {
  label: string; // shown verbatim; empty labels are skipped
  icon?: string; // icon name from @servicenow/aiux-directive-icon
  color?:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'; // default 'neutral'
}

interface SecondaryInfoTag {
  label: string;
}

interface Category {
  id: string | number;
  label: string;
  order?: number;
  icon?: string; // icon name; overrides the default time-of-day icon
}

interface AriaConfig {
  ariaTitle?: string; // region name; default "Appointment Calendar"
  ariaBodyTitle?: string; // name of the slot area
}

interface ContextDateChangedDetail {
  fromMoment: Moment | null; // moment-timezone Moment, in `timezone`
  toMoment: Moment;
  fromMS: number | null; // epoch ms
  toMS: number;
}

interface RangeUpdatedDetail {
  startMoment: Moment; // start of first visible day
  endMoment: Moment; // end of last visible day
  startMS: number;
  endMS: number;
}
```

The package does not export these types.

## Integration details

### SSR

The server renders an empty region shell; the calendar renders after the
first client update. Locale data loads in the browser.

### Lifecycle

Selection and "+N more" expansion are internal and not exposed as properties.
"Today" advances at midnight in `timezone` while connected.

### Sizing and layout

- `display: block; width: 100%; height: 100%`, with a minimum height of 510px
  (body at least 326px).
- With a bounded parent height the slot area scrolls and the footer stays
  visible; with an auto-height parent the element grows to fit its slots.
- Layout follows the element's own width: below 640px the week view becomes a
  list of collapsible days (today expanded).

## Accessibility, localization, and customization

- **Accessibility:** the element is a labelled region (see `configAria`) and
  announces the visible view and dates on navigation. Slots are toggle
  buttons with full spoken labels; unavailable and booked slots are skipped by
  Tab. The date picker traps focus and closes on Escape; the view menu uses
  Arrow Up/Down and Escape; the selected-slots popover closes on Escape. Focus
  returns to the trigger on close. Mirrors for `dir="rtl"` inherited from an
  ancestor.
- **Localization:** built-in labels are localized; weekday and month names
  follow `locale`. Slot `title`, `tooltip`, tag labels, and category labels
  are shown verbatim, so pass translated text.
- **Customization:** `--aiux-appointment-calendar-min-height` (default
  `510px`) and `--aiux-appointment-calendar-body-min-height` (default
  `326px`) on the element. Colors come from the DaisyUI theme; no parts are
  exposed.
