# aiux-list-activity

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-list-activity.md`

`<aiux-list-activity>` fetches recent activity for the records of a table (optionally filtered by an encoded query) and shows it grouped by record. Selecting a record drills down into that record's full activity stream and provides a mechanism to go back to the list view.

Unlike the record components, `<aiux-list-activity>` does not need an outer `<aiux-record-provider>`.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-list-activity
    table="incident"
    query="active=true^priority=1"
    headerlabel="Priority 1 activity"
    @LIST_ACTIVITY#CLOSE_BUTTON_CLICKED=${onClose}
    @LIST_ACTIVITY#OPEN_RECORD_CLICKED=${onOpenRecord}
  ></aiux-list-activity>
`;
```

**What happens:** The panel loads recent activity for the matching incidents, shows it grouped by record, and refreshes when a watched record changes. Clicking a record number opens that record's activity inside the panel. The "open record" button in that view dispatches `LIST_ACTIVITY#OPEN_RECORD_CLICKED` for the host to navigate.

### Additional patterns

Move focus into the panel when the host opens it:

```js
const panel = this.renderRoot.querySelector('aiux-list-activity');
panel.focusCloseButton();
```

## API

### aiux-list-activity

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Config framework | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `table` | `table` | `string` | `''` | Re-fetches when changed | No | Table to show activity for, for example `incident`. Nothing is fetched while empty. |
| `query` | `query` | `string` | `''` | Re-fetches when changed | No | Encoded query that selects the records, for example `active=true^priority=1`. Empty means no filter. |
| `headerLabel` | `headerlabel` | `string` | Localized "Activity stream" | Updates immediately | No | Heading text of the panel. |

#### Properties controlled by the config framework

None. No property on this component is declared with `@configProperty`.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `LIST_ACTIVITY#OPEN_RECORD_CLICKED` | `{table: string, sysId: string}` | Bubbles, composed | The user presses "open record" while drilled into a record. | The component does not navigate. The host decides where to go. |
| `LIST_ACTIVITY#CLOSE_BUTTON_CLICKED` | `{keyboardActivated: boolean}` | Bubbles, composed | The user presses the close button, or presses Escape while not drilled into a record. | `keyboardActivated` is `true` for keyboard use. Escape while drilled in goes back to the list instead and does not fire this event. |

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focusCloseButton(): void` | Moves focus to the close button. No-op when the button is not rendered. |

### System properties

Read from `sys_properties` on the instance.

| Property | Default | Effect |
| --- | --- | --- |
| `aiux.list_activity.api_version` | `1` behavior | `0` uses the legacy activity source. Any other value, or no value, uses the current one. Read once per component instance. |

Once drilled into a record, the embedded record activity stream also follows the system properties and user preferences listed in `aiux-record-activity-stream`.

### User preferences

None read directly by the list panel. The embedded record activity stream reads the preferences listed in `aiux-record-activity-stream`.

## Integration details

### Platform requirements

- The current user needs access to the table and to the records' activity.
- Records are grouped by consecutive activity: adjacent entries for the same record share one group, so a record can appear more than once when other records' activity falls between its entries.

### Lifecycle

The component subscribes to record changes for the displayed records and refreshes quietly (debounced, without a loading state) when they change. It unsubscribes when disconnected. Changing `table` or `query` drops the subscription and fetches again.

### Sizing and layout

The component renders as `display: contents`, so the host supplies the panel container and its size. It is designed for a side panel.

## Accessibility, localization, and customization

- The close and back buttons are labelled and have tooltips. Escape closes the panel, or returns from the record view to the list and restores focus to the record button that was used.
- All built-in strings are localized. `headerLabel` is host-supplied and must be localized by the host.
- The component exposes no CSS parts.
