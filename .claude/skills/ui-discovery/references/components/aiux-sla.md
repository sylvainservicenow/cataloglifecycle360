# SLA

> Source: `@servicenow/aiux-sla@2.3.2` · `components/external/sla/docs/usage/aiux-sla.md`

`<aiux-sla>` shows the active SLAs (`task_sla`) of one task, identified by
`sysId`. It loads the records itself via a GraphQL fetch and never changes
them. Pass `items` instead to render SLAs you already have.

Built in: severity sorting, breached / at-risk / ongoing badges with a paused
indicator, progress bars, a per-status count summary, a Show all / Show less
toggle for several SLAs, and loading, empty, and error states. Time text does
not count down; it reflects the moment the data was loaded.

## Import

```js
import '@servicenow/aiux-sla';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-sla';

@customElement('my-case-slas')
export class MyCaseSlas extends AIUXElement {
  @property({type: String}) caseSysId = '';

  render() {
    return html`<aiux-sla .sysId=${this.caseSysId}></aiux-sla>`;
  }
}
```

**What happens:** each `sysId` change clears the list and loads that task's
SLAs; an empty `sysId` shows the empty state without a request. With several
SLAs, only the most severe is shown until the user selects Show all.

### Additional patterns

Header chip showing only the most severe SLA. Set `mode` as an attribute; the
inline host layout keys off the attribute.

```js
html`<aiux-sla mode="time" .sysId=${caseSysId}></aiux-sla>`;
```

Rendering supplied data without a fetch:

```js
html`
  <aiux-sla
    .items=${[
      {
        id: '1',
        label: 'Resolution (5 days)',
        status: 'at-risk',
        timeMs: 7_200_000,
        timeKind: 'left',
        progress: 82
      },
      {
        id: '2',
        label: 'Response (4 hours)',
        status: 'paused',
        barStatus: 'breached',
        timeMs: 900_000,
        timeKind: 'elapsed',
        progress: 104
      }
    ]}
  ></aiux-sla>
`;
```

## API

### Properties and attributes

Boolean properties that default to `true` can be turned off only with a
property binding (`.showLabel=${false}`). Properties marked "Config Editor"
are also admin-overridable per instance; an admin value wins over the one set
in code. No attribute reflects.

| Property           | Attribute            | Type               | Default  | Update behavior     | Description                                                                                                                                                                                                                                      |
| ------------------ | -------------------- | ------------------ | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sysId`            | `sys-id`             | `string`           | `''`     | Reloads             | Task `sys_id`. Loads that task's active `task_sla` records except those in stage `complete`, with the user's ACLs applied. Requires the page to be served by an instance; elsewhere an error card shows. Not fetched while `items` is non-empty. |
| `items`            | `items` (JSON)       | `SlaItem[]`        | `[]`     | Updates immediately | When non-empty, rendered instead of fetched data, and loading and error states are suppressed. Emptying it does not start a fetch; the next `sysId` change does.                                                                                 |
| `mode`             | `mode`               | `'card' \| 'time'` | `'card'` | Updates immediately | `card`: full card. `time`: inline chip for the most severe SLA; renders nothing while loading or on error.                                                                                                                                       |
| `showProgressBar`  | `show-progress-bar`  | `boolean`          | `true`   | Updates immediately | Config Editor. Card mode: progress bar under each SLA (capped at 100%).                                                                                                                                                                          |
| `showAll`          | `show-all`           | `boolean`          | `false`  | Resets expansion    | Config Editor. Card mode, several SLAs: start expanded. Expansion resets to this value whenever `showAll`, `items`, or `sysId` changes.                                                                                                          |
| `showBadgeTooltip` | `show-badge-tooltip` | `boolean`          | `true`   | Updates immediately | Config Editor. Native `title` tooltip on the status badge, e.g. "SLA is breached and currently paused".                                                                                                                                          |
| `showDividers`     | `show-dividers`      | `boolean`          | `false`  | Updates immediately | Config Editor. Card mode: divider between rows of the expanded list.                                                                                                                                                                             |
| `showLabel`        | `show-label`         | `boolean`          | `true`   | Updates immediately | Config Editor. Time mode: "SLA" label before the chip. With no SLAs, `true` shows "No SLAs available" and `false` renders nothing.                                                                                                               |
| `showSummary`      | `show-summary`       | `boolean`          | `true`   | Updates immediately | Config Editor. Card mode, several SLAs: counts such as "2 breached \| 1 at risk" next to the title.                                                                                                                                              |

Display rules:

- Sort order: breached, at risk, ongoing, paused; ties by higher `progress`.
- A paused SLA shows the badge of its `barStatus` (or "Ongoing" when absent)
  plus a pause icon, and is counted under that severity in the summary.
- Fetched SLAs are breached when `has_breached` is true, at risk at 75% or
  more of business time, otherwise ongoing.
- Time text is "`<duration>` left" or "`<duration>` elapsed" (e.g. `2d 4h left`),
  or `--` when `timeMs` is missing or 0.

### Events

None.

### Slots

None.

### Methods

None.

### Data shapes

```ts
type SlaStatus = 'breached' | 'at-risk' | 'ongoing' | 'paused';

interface SlaItem {
  id: string;
  label: string;
  status: SlaStatus;
  barStatus?: SlaStatus; // underlying severity of a paused SLA
  timeMs?: number; // duration to display, in ms; read per timeKind
  timeKind?: 'left' | 'elapsed';
  progress: number; // display percentage; may exceed 100 (bar caps at 100)
}
```

These types are not importable from the package's declared type entry.

## Integration details

### SSR

With a non-empty `items`, the server renders those items. Otherwise it renders
the loading card (nothing in time mode) when `sysId` is set, or the empty state
when it is not; fetched SLAs load in the browser.

### Sizing and layout

- Card mode: `display: block`; the card fills the host width. Row padding
  shrinks on narrow hosts.
- Time mode with the `mode` attribute: `display: inline-flex`, sized to the
  chip.

## Accessibility, localization, and customization

- **Accessibility:** the list, progress bars, toggle (`aria-expanded`), and
  summary (`aria-live="polite"`) are labelled. Error text uses `role="alert"`.
  No caller action needed.
- **Localization:** labels, status text, and durations are localized; SLA
  names come from the instance. Fetch error messages are a generic localized
  string, not the raw error returned by the API.
- **Customization:** `--sla-row-padding-x` (default `1.25rem`) and
  `--sla-footer-padding-x` (default `1.75rem`) on the host. Colors follow the
  DaisyUI theme.
