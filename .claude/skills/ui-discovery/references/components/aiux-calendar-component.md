# Calendar

> Source: `@servicenow/aiux-components-calendar@2.4.2` · `components/external/calendar/docs/usage/aiux-calendar-component.md`

`<aiux-calendar-component>` shows one month as a day grid with previous/next
month buttons. The host sets the displayed month (`currentDate`) and the
selected day (`selectedDate`); the element updates both itself as the user
navigates and selects, and reports each change through events. It has no text
input, popup, time selection, or range selection.

Built in: month navigation, disabled days from `minDate`/`maxDate`/
`isDateDisallowed`, today marker, locale-aware month and weekday names, and
keyboard navigation. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-calendar';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-calendar';

@customElement('my-due-date-picker')
export class MyDueDatePicker extends AIUXElement {
  @state() private _dueDate: Date | null = null;
  // Under SSR, the host passes the same date to the server and browser renders.
  @property({attribute: false}) today = new Date();

  private _onSelect(e: CustomEvent<string>) {
    const [y, m, d] = e.detail.split('-').map(Number);
    this._dueDate = new Date(y, m - 1, d); // local date; new Date('YYYY-MM-DD') would be UTC
  }

  render() {
    return html`
      <aiux-calendar-component
        .currentDate=${this._dueDate ?? this.today}
        .selectedDate=${this._dueDate}
        .minDate=${this.today}
        .isDateDisallowed=${(d: Date) => d.getDay() === 0 || d.getDay() === 6}
        @calendar-date-select-date=${this._onSelect}
      ></aiux-calendar-component>
    `;
  }
}
```

**What happens:** past days and weekends are disabled; previous-month is
disabled until the user moves to a later month.

## API

### Properties and attributes

| Property           | Attribute           | Type                      | Default      | Update behavior     | Description                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------- | ------------------------- | ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `currentDate`      | property only       | `Date \| null`            | `null`       | Updates immediately | Any date in the month to display. If `null` when the element connects in the browser, it and `selectedDate` are both set to today (overwriting a `selectedDate` already set). While `null`, an empty card renders. The element replaces it (with the 1st of the month) when the user changes month. Not clamped to `minDate`/`maxDate`. |
| `selectedDate`     | property only       | `Date \| null`            | `null`       | Updates immediately | Highlighted day. The element replaces it when the user selects a day. Setting it does not change the displayed month.                                                                                                                                                                                                                   |
| `minDate`          | property only       | `Date \| null`            | `null`       | Updates immediately | Earliest selectable day (compared by calendar day). Disables the previous-month button when that whole month is earlier.                                                                                                                                                                                                                |
| `maxDate`          | property only       | `Date \| null`            | `null`       | Updates immediately | Latest selectable day. Disables the next-month button when that whole month is later.                                                                                                                                                                                                                                                   |
| `isDateDisallowed` | property only       | `(date: Date) => boolean` | `undefined`  | Updates immediately | Return `true` to disable a day. Receives a `Date` at local midnight.                                                                                                                                                                                                                                                                    |
| `firstDayOfWeek`   | `first-day-of-week` | `number`                  | `1` (Monday) | Updates immediately | First column, `0` (Sunday) to `6` (Saturday); out-of-range values are clamped.                                                                                                                                                                                                                                                          |
| `locale`           | `locale`            | `string`                  | `''`         | Updates immediately | BCP 47 locale for month, weekday, and day labels. Empty uses the session locale (`window.NOW.locale`), else `en-US`.                                                                                                                                                                                                                    |
| `borderless`       | `borderless`        | `boolean`                 | `false`      | Updates immediately | Removes the card border and shadow.                                                                                                                                                                                                                                                                                                     |

### Events

Use the literal event names; they are not exported as constants.

| Event                        | `detail`                              | Delivery                          | Fires when                                                                                                                          | Notes                                                                                                                    |
| ---------------------------- | ------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `calendar-date-select-date`  | `string` (`'YYYY-MM-DD'`, local date) | Bubbles, composed, not cancelable | The user clicks a day or presses `Enter`/`Space` on one, or `selectDay()` runs.                                                     | Fires again when the already selected day is chosen. Not fired for disabled days or programmatic `selectedDate` changes. |
| `calendar-date-month-change` | `CalendarMonthChangeDetail`           | Bubbles, composed, not cancelable | The displayed month changes through the prev/next buttons, keyboard navigation past the month edge, or `prevMonth()`/`nextMonth()`. | `month` is 0-based. Not fired for programmatic `currentDate` changes.                                                    |

### Slots

None.

### Methods

| Method                             | Effect                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `prevMonth()` / `nextMonth()`      | Shows the previous/next month and fires `calendar-date-month-change`. No-op when that month is entirely outside `minDate`/`maxDate`.      |
| `selectDay(day: number)`           | Selects that day (1-based) of the displayed month and fires `calendar-date-select-date`. No-op for disabled days. Requires `currentDate`. |
| `isSelected(day: number): boolean` | Whether that day of the displayed month is `selectedDate`.                                                                                |
| `isToday(day: number): boolean`    | Whether that day of the displayed month is today. Always `false` on the server.                                                           |

Read-only getters (require `currentDate`): `effectiveLocale`, `monthName`,
`daysInMonth`, `firstDayOfMonth` (number of blank cells before day 1).

### Data shapes

```ts
interface CalendarMonthChangeDetail {
  month: number; // 0-11
  year: number;
}
```

Not exported by the package.

## Integration details

### SSR

Renders on the server only when `currentDate` is set; otherwise an empty card
renders until the browser sets it to today. No day is marked as today on the
server.

### Sizing and layout

`display: block`. The card is `20rem` wide by default; set
`--aiux-calendar-width` to change it. Height follows the number of week rows.

## Accessibility, localization, and customization

- **Accessibility:** the grid follows the ARIA date-picker grid pattern with a
  single tab stop. Keys: arrows move by day/week, `Home`/`End` to the start/end
  of the week, `PageUp`/`PageDown` by month, `Shift+PageUp`/`Shift+PageDown` by
  year, `Enter`/`Space` select. Movement skips disabled days. Each day has a
  full-date label; month changes are announced. The month slide animation
  follows the AIUX reduced-motion user preference. Provide your own visible
  label for the field.
- **Localization:** month, weekday, and day labels come from `Intl` for the
  effective locale. The "Date picker", "Previous month", and "Next month"
  labels are localized. The year is shown as a plain number.
- **Customization:** `--aiux-calendar-width`. Colors come from the page's
  DaisyUI theme (today uses the primary color, the selected day the neutral
  color); there are no parts or slots.
