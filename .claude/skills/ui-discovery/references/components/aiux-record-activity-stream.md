# aiux-record-activity-stream

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-activity-stream.md`

`<aiux-record-activity-stream>` renders the activity feed of the record supplied by the nearest `<aiux-record-provider>`: journal entries, emails, attachments, audit (field change) entries and relationship changes. It already includes the sort toggle, filter and quick-filter panel, saved filter sets, the field-change field selector, tag filtering, the flagged filter, citation scroll-to, and pagination. The host only sets display options and does not rebuild any of these. The component dispatches no events and has no slots.

The stream must be used inside `<aiux-record-provider>`. Platform-owned record pages already include a provider, so you do not need to add one there. Add a provider only on custom pages, home pages, list pages, dashboards, or when the stream must target a different record than the record page's default provider. To let users post to the record, place `<aiux-record-activity-compose>` beside it. See `aiux-record-activity-compose` and `aiux-record-activity-layout`.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-record-provider .data=${recordData}>
    <div style="height: 600px;">
      <aiux-record-activity-stream
        stream-height="560px"
        headerlabel="History"
      ></aiux-record-activity-stream>
    </div>
  </aiux-record-provider>
`;
```

**What happens:** The stream loads the record's activity, shows newest entries first (or the user's saved order), and renders a toolbar with sort and filter controls above the feed. When `stream-height` is set, the feed scrolls inside the component.

### Additional patterns

Show a compact header, with the toolbar trimmed down:

```js
html`
  <aiux-record-activity-stream
    hideheaderlabel
    hideconfigurefields
  ></aiux-record-activity-stream>
`;
```

Force a sort order regardless of the user's saved preference. `sortDirection` is numeric (`-1` newest first, `1` newest last), so set it as a property:

```js
html`
  <aiux-record-activity-stream
    .sortDirection=${1}
  ></aiux-record-activity-stream>
`;
```

Define tags in code (the same shape the config editor produces). A tag is offered only on records whose table is listed in its `tables`:

```js
const tags = [
  {
    id: 'tag-escalation',
    label: 'Escalation',
    icon: 'flag',
    color: 'warning',
    description: 'Needs management attention',
    tables: ['incident', 'problem']
  },
  {
    id: 'tag-root-cause',
    label: 'Root cause',
    icon: 'star',
    color: 'success',
    tables: ['incident']
  }
];

html`<aiux-record-activity-stream .tags=${tags}></aiux-record-activity-stream>`;
```

Replace a built-in tile with a custom element. The key is the built-in tile tag, the value is the replacement tag. The replacement must be registered (for example in `sys_aix_widget`) or already loaded:

```js
html`
  <aiux-record-activity-stream
    .tileTagOverrides=${{
      'aiux-record-activity-journal': 'my-custom-journal-tile'
    }}
  ></aiux-record-activity-stream>
`;
```

Built-in tile tags that can be overridden:

- `aiux-record-activity-journal`
- `aiux-record-activity-email`
- `aiux-record-activity-attachment`
- `aiux-record-activity-audit`
- `aiux-record-activity-relation`

## API

### aiux-record-activity-stream

#### Properties and attributes

Attribute names are the property name lowercased (`hideSort` is `hidesort`) except where noted. Boolean attributes are on when present.

| Property | Attribute | Type | Default | Update behavior | Config framework | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hideActivityStream` | `hideactivitystream` | `boolean` | `false` | Updates immediately | Yes (Boolean) | Renders nothing at all. Lets an admin switch the stream off without changing the host's markup. |
| `tags` | `tags` | `TagValue[]` | `[]` | Updates immediately | Yes (custom tag editor, `aiux-activity-stream-tag-config`) | Tag definitions available for tagging and filtering activity. Only tags whose `tables` include the current record's table are offered. |
| `sortDirection` | `sortdirection` | `SortDirectionValue \| null` | `null` | Updates immediately | No | Fixed sort order. `-1` is newest first, `1` is newest last. When `null`, the user's saved order (or newest first) is used. Set as a property; an attribute is read as a string and does not match the numeric values. |
| `hideSort` | `hidesort` | `boolean` | `false` | Updates immediately | No | Hides the sort toggle. |
| `hideSeparators` | `hideseparators` | `boolean` | `false` | Updates immediately | No | Hides the separators between entries. |
| `headerLabel` | `headerlabel` | `string \| null` | `null` | Updates immediately | No | Heading text. When `null`, the localized "Activities" label is used. |
| `hideHeaderLabel` | `hideheaderlabel` | `boolean` | `false` | Updates immediately | No | Hides the heading visually. The label is still used as the accessible name. |
| `hideFilters` | `hidefilters` | `boolean` | `false` | Updates immediately | No | Hides the filter toggle and filter panel. |
| `hideConfigureFields` | `hideconfigurefields` | `boolean` | `false` | Updates immediately | No | Hides the button that opens the field-change field selector. |
| `streamHeight` | `stream-height` | `string \| null` | `null` | Updates immediately | No | Fixed CSS height for the feed (`400px`, `50vh`, `calc(100vh - 200px)`). When set, the feed scrolls inside the component. When unset, the page scrolls. Only `px`, `vh`, `vw`, `rem`, `em`, `%` lengths and `calc()`, `min()`, `max()`, `clamp()` expressions are accepted; anything else is ignored. |
| `tileTagOverrides` | — (property only) | `Record<string, string>` | `undefined` | Updates immediately | No | Maps a built-in tile tag to a replacement tag. See the example above. |

#### Properties controlled by the config framework

`hideActivityStream` and `tags` are declared with `@configProperty`. In the page editor, an admin sets them without code, and the saved value replaces the value the host set in markup or script.

| Property | Editor label | Editor control |
| --- | --- | --- |
| `hideActivityStream` | Hide activity stream | Toggle |
| `tags` | Tagging configuration | Custom editor (`aiux-activity-stream-tag-config`) |

#### Events

None.

#### Slots

None.

#### Methods

None.

### System properties

Read from `sys_properties` on the instance. A missing property uses the listed default.

| Property | Default | Effect |
| --- | --- | --- |
| `glide.ui.activity.sort_persistence_level` | `table` | `table` remembers the user's sort order per table. `record` remembers it per record. |
| `glide.ui.activity.filter_persistence_level` | `RECORD` | `TABLE` remembers filter selections per table for the user. Any other value remembers them per record. |
| `glide.activity.attachment_preview` | `true` | Shows inline previews on attachment entries. |
| `glide.activity.show_tile_icons` | `true` | Shows the type icon on each entry. |
| `glide.activity.show_tile_avatars` | `true` | Shows the author avatar on each entry. |
| `glide.ui.activity.email.use_display` | `true` | Shows recipients' display names on email entries. When `false`, shows their email addresses. |
| `sn_agent_workspace.activity_email_options_enabled` | `true` | Shows the reply and forward email actions on entries (also requires the record form's email client to be enabled). |
| `com.glide.activity.show_favoriting` | `false` | Shows the favorite action on entries. |

### User preferences

Read from the signed-in user's preferences (`sys_user_preference`).

| Preference | Effect |
| --- | --- |
| `glide.ui.short_date_format` | `true` shows entry times in the short date format. |
| `glide.ui.date_format` | JSON object that selects the time format for entries, including relative "time ago" display. Invalid JSON is ignored. |
| `glide.ui.accessibility.show_hidden_controls` | `true` keeps hover-only entry actions visible. |

### Settings the component saves for the user

The stream saves these automatically when the user changes them. The host does not read or write them.

| Setting | Scope | Stored in |
| --- | --- | --- |
| Sort order | Per table or per record (see `glide.ui.activity.sort_persistence_level`) | Saved for the user |
| Filters, quick filters (including flagged), saved filter sets and selected change fields | Per record or per table (see `glide.ui.activity.filter_persistence_level`) | Saved for the user |

### Data shapes

```ts
interface TagValue {
  id: string;
  label: string;
  icon: 'tag' | 'star' | 'flag' | 'bookmark';
  color:
    | 'neutral'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';
  description?: string;
  tables?: string[]; // record tables where the tag is offered
}

enum SortDirectionValue {
  NEW_EVENTS_FIRST = -1,
  NEW_EVENTS_LAST = 1
}
```

Unknown `icon` or `color` values fall back to the default tag icon and color.

## Integration details

### Platform requirements

- Must be inside `<aiux-record-provider>`. The provider must supply the Activity API; the component does not render without it.
- Shows the activity of the provider's record.
- A `citation` on the page (a link to a specific activity entry) scrolls to and highlights that entry. If the entry is missing or hidden by a filter, the user sees a notification instead.

### SSR

The stream renders on the server. Browser-only work (scroll observers, citation scrolling) runs after hydration.

### Sizing and layout

Give the stream a bounded height with `stream-height`, or place it in a scroll container that the page controls. Without either, the page scrolls with the feed.

## Accessibility, localization, and customization

- The heading, sort control, filter toolbar (arrow keys, Home and End move between buttons; Escape closes the panel) and each entry are labelled for screen readers. Result and filter changes are announced through live regions.
- All built-in strings are localized. The only host-supplied text is `headerLabel`, and tag `label` and `description` values, which the host must localize.
- Entry types can be replaced with `tileTagOverrides`. Styling uses the platform theme tokens; the component exposes no CSS parts.
