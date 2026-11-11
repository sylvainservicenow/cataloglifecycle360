# Timer

> Source: `@servicenow/aiux-timer@1.5.2` · `components/external/timer/docs/usage/aiux-timer.md`

`<aiux-timer>` renders a pill-shaped time badge that updates every second. In
`stopwatch` mode (default) the host sets `start-time` (and optionally
`end-time`); in `countdown` mode the host sets `count-down` and the user runs
it with the built-in start/pause button. The element reports start, pause, and
end through events; it does not persist anything.

Built in: the start/pause toggle button (countdown only), adaptive time
format, and periodic screen-reader announcements.

`size`, `icon`, and `minResolution` are admin-configurable; an instance config
value for them overrides what the host sets.

## Import

```js
import '@servicenow/aiux-timer';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-timer';

@customElement('my-call-timer')
export class MyCallTimer extends AIUXElement {
  @property({type: String}) callStartedAt = ''; // ISO-8601, e.g. '2026-09-23T14:05:00Z'
  @property({type: String}) callEndedAt = '';
  @state() private _ended = false;

  render() {
    return html`
      <aiux-timer
        start-time=${this.callStartedAt}
        end-time=${this.callEndedAt}
        icon="clock"
        size="md"
        .configAria=${{'aria-label': 'Call duration'}}
        @aiux-timer:timer-ended=${(e: CustomEvent) =>
          (this._ended = e.detail.reason === 'End Time Reached')}
      ></aiux-timer>
      ${this._ended ? html`<span>Call ended</span>` : ''}
    `;
  }
}
```

**What happens:** the badge counts up from `start-time` using the browser
clock. When `end-time` is set and reached, it freezes at `end-time − start-time`
and fires `aiux-timer:timer-ended`.

### Additional patterns

Five-minute countdown the user starts and pauses:

```js
html` <aiux-timer mode="countdown" count-down="300"></aiux-timer> `;
```

## API

### Properties and attributes

| Property        | Attribute            | Type                      | Default       | Update behavior                                                                             | Description                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------- | ------------------------- | ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`          | `mode`               | `TimerMode`               | `'stopwatch'` | Stops and resets immediately; no events                                                     | `stopwatch` counts up from `startTime`; `countdown` counts down from `countDown`.                                                                                                                                                                                                                           |
| `startTime`     | `start-time`         | `string`                  | `''`          | Stopwatch restarts immediately                                                              | Parseable date string (ISO-8601). Stopwatch only. Empty: does not tick; shows `00:00` initially, but clearing it later leaves the last displayed time. Unparseable: shows "Invalid Time" and fires `timer-ended` (`'Invalid Start Time'`). A future time shows `00:00` until it is reached, then counts up. |
| `endTime`       | `end-time`           | `string`                  | `''`          | Stopwatch restarts immediately                                                              | Parseable date string. Stopwatch only. When elapsed time passes `endTime − startTime`, the display freezes and `timer-ended` fires. An `endTime` not after `startTime`, or unparseable, means no cap.                                                                                                       |
| `countDown`     | `count-down`         | `number` (seconds)        | `0`           | Resets the countdown to the new value immediately (stops it if running; no `timer-stopped`) | Countdown only. Valid range `0`–`86399`. Out of range shows "Invalid Time"; `0` shows `00:00`. The start button is disabled when the value is `0` or invalid. Subtracts one second per interval callback (not the clock), so it runs slow when the browser throttles timers; not an authoritative deadline. |
| `minResolution` | `min-resolution`     | `MinResolution`           | `'seconds'`   | Stopwatch restarts; countdown resets to `countDown`                                         | Stopwatch only: `'minutes'` drops seconds from the display and announcements. The countdown display always shows seconds.                                                                                                                                                                                   |
| `size`          | `size`               | `TimerSize`               | `'sm'`        | Updates immediately                                                                         | Badge text, padding, and icon size.                                                                                                                                                                                                                                                                         |
| `icon`          | `icon`               | `string` (icon name)      | `''`          | Updates immediately                                                                         | Icon shown before the time, e.g. `clock`.                                                                                                                                                                                                                                                                   |
| `configAria`    | `config-aria` (JSON) | `TimerAriaConfig \| null` | `null`        | Updates immediately                                                                         | `aria-label` is prefixed to the current time in the badge's accessible name.                                                                                                                                                                                                                                |

Display formats:

- Stopwatch, `seconds`: `MM:SS` under 1 h, `HH:MM:SS` under 24 h, then `D.HH:MM:SS`.
- Stopwatch, `minutes`: `HH:MM`, then `D.HH:MM`.
- Countdown: `MM:SS` under 1 h remaining, else `HH:MM:SS`.

### Events

Event names are literal strings.

| Event                      | `detail`             | Delivery                          | Fires when                                                                                                                  | Notes                                                                                                                                                                                                                                                                |
| -------------------------- | -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-timer:timer-ended`   | `TimerEndedDetail`   | Bubbles, composed, not cancelable | Stopwatch reaches `endTime`; countdown reaches zero; `startTime` is unparseable; the element is disconnected while ticking. | `reason` tells which. Can fire more than once for the same end (e.g. `startTime` unparseable or `endTime` already passed on connect); make handlers idempotent. Not fired when `mode`, `startTime`, `endTime`, `countDown`, or `minResolution` changes stop a timer. |
| `aiux-timer:timer-started` | `TimerStartedDetail` | Bubbles, composed, not cancelable | The user presses start (countdown).                                                                                         |                                                                                                                                                                                                                                                                      |
| `aiux-timer:timer-stopped` | `TimerStoppedDetail` | Bubbles, composed, not cancelable | The user presses pause (countdown).                                                                                         | Not fired when a property change or disconnect stops the countdown.                                                                                                                                                                                                  |

### Slots

None.

### Methods

None. Countdown start and pause are user actions only.

### Data shapes

```ts
type TimerMode = 'stopwatch' | 'countdown';
type TimerSize = 'sm' | 'md';
type MinResolution = 'seconds' | 'minutes';

interface TimerAriaConfig {
  'aria-label'?: string;
}

interface TimerEndedDetail {
  reason: 'End Time Reached' | 'Invalid Start Time' | 'Component Disconnected';
  elapsed: number; // seconds; capped at endTime − startTime; countdown: countDown − remaining; 0 for Invalid Start Time
}

interface TimerStartedDetail {
  duration: number; // countDown, seconds
  elapsed: number; // seconds already counted before this start
}

interface TimerStoppedDetail {
  remaining: number; // seconds
  elapsed: number; // seconds
}
```

These types are not exported from the package.

## Integration details

### SSR

The server renders the badge with `00:00` (stopwatch) or the configured
countdown value, and the countdown button in its initial enabled/disabled
state. Ticking starts in the browser.

### Lifecycle

- Re-connecting a stopwatch resumes from `startTime` (wall clock); if already
  past `endTime`, `timer-ended` fires again.
- Re-connecting a countdown resets it to the full `countDown`, paused.
- A countdown that reached zero stays at `00:00` with the button disabled
  until `countDown`, `minResolution`, or `mode` changes, or the element
  re-connects.

### Sizing and layout

`display: inline-flex`; the countdown button sits to the right of the badge.

## Accessibility, localization, and customization

- **Accessibility:** set `configAria` `aria-label` to give the time context
  (e.g. "Call duration"). The badge has `role="timer"`; a polite live region
  announces the time every 30 s of ticking and "Timer ended at …" at the end.
  The countdown button is a native button labelled "Start"/"Stop".
- **Localization:** "Start", "Stop", "Invalid Time", and screen-reader
  duration text are localized. The digit format is fixed.
- **Customization:** no styling hooks. The badge uses the DaisyUI theme's
  `base-200` background and `base-300` border.
