# aiux-record-activity-compose

> Source: `@servicenow/aiux-components-record@16.1.11` · `components/record/docs/usage/aiux-record-activity-compose.md`

`<aiux-record-activity-compose>` is the box for writing to the record's journal fields (for example comments and work notes) of the record supplied by the nearest `<aiux-record-provider>`. It already includes tabs (or a dropdown) to pick the field, per-field help text, post buttons, a rich text toggle, a compact versus stacked view toggle, a side-by-side toggle, pop-out windows, unsaved-content indicators, and typing presence for other viewers. The host does not rebuild any of these. Hosts can add their own tabs through the `compose-start` and `compose-end` slots.

The component must be used inside `<aiux-record-provider>`, and the provider must supply the Form and Activity APIs. Platform-owned record pages already include a provider, so you do not need to add one there. Add a provider only on custom pages, home pages, list pages, dashboards, or when compose must target a different record than the record page's default provider. To show the feed, use `aiux-record-activity-stream`. To place compose beside the feed on wide screens, wrap both in `aiux-record-activity-layout`.

## Import

```js
import '@servicenow/aiux/aiux-components-record';
```

## Usage

### Minimal complete example

```js
html`
  <aiux-record-provider .data=${recordData}>
    <aiux-record-activity-layout>
      <aiux-record-activity-compose main></aiux-record-activity-compose>
      <aiux-record-activity-stream></aiux-record-activity-stream>
    </aiux-record-activity-layout>
  </aiux-record-provider>
`;
```

**What happens:** Compose shows a tab for each journal field the user can write to (for example Comments and Work notes), and selects the first tab because `main` is set. The user types, posts, and the new entry appears in the stream.

### Additional patterns

Use a dropdown instead of tabs, and drop the surrounding card styling:

```js
html`<aiux-record-activity-compose useDropdown bare></aiux-record-activity-compose>`;
```

Restrict compose to the record's journal fields. Slotted tabs are not shown. This is also available to admins through the config framework:

```js
html`<aiux-record-activity-compose .onlyJournals=${true}></aiux-record-activity-compose>`;
```

Add the email composer as a tab. `<aiux-email-client-compose-tab>` is registered by the package import and reads the record's Email API, so the provider must supply it (it does unless `requiredAPIs` limits the APIs it loads):

```js
html`
  <aiux-record-activity-compose main>
    <aiux-email-client-compose-tab
      class="w-full"
      slot="compose-end"
    ></aiux-email-client-compose-tab>
  </aiux-record-activity-compose>
`;
```

The email tab sets its own `data-compose-tab-key` and `data-compose-tab-text`, so the host does not. Its key is `email`, and its text is "Email", or "Email (draft)" once the user has typed content. Do not reuse the key `email` for your own tabs.

Add your own tab. Each slotted element needs a unique `data-compose-tab-key` and `data-compose-tab-text`. The slotted element must add `data-compose-tab-is-dirty` to itself while it holds unsaved content, and remove it when the content is posted or discarded. Compose does not detect unsaved content on its own. It only reads the attribute and shows the unsaved indicator on the tab. Any value, even `"false"`, counts as dirty, so use `toggleAttribute`. Slot the elements like this:

```js
html`
  <aiux-record-activity-compose main>
    <my-quick-reply
      slot="compose-start"
      data-compose-tab-key="quick-reply"
      data-compose-tab-text="Quick reply"
    ></my-quick-reply>
    <my-call-log
      slot="compose-end"
      data-compose-tab-key="call-log"
      data-compose-tab-text="Call log"
    ></my-call-log>
  </aiux-record-activity-compose>
`;
```

Inside the slotted element, mark the tab dirty whenever its content changes:

```js
import {LitElement, html} from 'lit';

export class MyQuickReply extends LitElement {
  _onInput(e) {
    // Present while there is unsaved text, removed when it is empty.
    this.toggleAttribute('data-compose-tab-is-dirty', e.target.value !== '');
  }

  _onPosted() {
    this.renderRoot.querySelector('textarea').value = '';
    this.removeAttribute('data-compose-tab-is-dirty');
  }

  render() {
    return html`
      <textarea @input=${this._onInput}></textarea>
      <button @click=${this._onPosted}>Post</button>
    `;
  }
}
customElements.define('my-quick-reply', MyQuickReply);
```

Let a slotted element pop out into its own window. Build it with `withComposePopOutSupport` and call `renderSlotActions()` in `render()`, next to its title (that is where the pop-out button appears in the stacked view):

```js
import {LitElement, html} from 'lit';
import {withComposePopOutSupport} from '@servicenow/aiux/aiux-components-record';

export class MyQuickReply extends withComposePopOutSupport(LitElement) {
  getPopOutTitle() {
    return 'Quick reply';
  }

  render() {
    return html`
      <div class="header">Quick reply ${this.renderSlotActions()}</div>
      <textarea></textarea>
    `;
  }
}
customElements.define('my-quick-reply', MyQuickReply);
```

## API

### aiux-record-activity-compose

#### Properties and attributes

Attribute names are the property name lowercased (`useDropdown` is `usedropdown`) except where noted. Boolean attributes are on when present.

| Property | Attribute | Type | Default | Update behavior | Config framework | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hideCompose` | `hidecompose` | `boolean` | `false` | Updates immediately | Yes (Boolean) | Renders nothing at all. Lets an admin switch compose off without changing the host's markup. |
| `onlyJournals` | `onlyjournals` | `boolean` | `false` | Updates immediately | Yes (Boolean) | Shows only the record's own journal fields. The `compose-start` and `compose-end` slots are not rendered, and slotted tabs disappear from the tabs, dropdown and stacked view. |
| `bare` | `bare` | `boolean` | `false` | Updates immediately | No | Removes the default background, padding, margin and border. |
| `useDropdown` | `usedropdown` | `boolean` | `false` | Updates immediately | No | In the compact view, shows a dropdown to pick the field instead of tabs. |
| `main` | `main` | `boolean` | `false` | Applied once, after first render | No | Marks this as the primary compose box. On first render it selects the first tab. |
| `enableModelessDialog` | `enablemodelessdialog` | `boolean` | `true` | Updates immediately | No | Allows fields and slotted tabs to pop out into their own windows. Because the default is `true`, turn it off with the property: `.enableModelessDialog=${false}`. |

#### Properties controlled by the config framework

`hideCompose` and `onlyJournals` are declared with `@configProperty`. In the page editor, an admin sets them without code, and the saved value replaces the value the host set in markup or script. All other properties are not configurable.

| Property | Editor label | Editor control |
| --- | --- | --- |
| `hideCompose` | Hide compose | Toggle |
| `onlyJournals` | Only journals | Toggle |

#### Events

None.

#### Slots

| Slot | Description |
| --- | --- |
| `compose-start` | Custom tabs shown before the journal field tabs. Not rendered when `onlyJournals` is on. |
| `compose-end` | Custom tabs shown after the journal field tabs. Not rendered when `onlyJournals` is on. |

Attributes read from each slotted element:

| Attribute | Required | Description |
| --- | --- | --- |
| `data-compose-tab-key` | Yes | Key unique among all compose tabs. Must not match a journal field name. |
| `data-compose-tab-text` | Yes | Text shown on the tab. |
| `data-compose-tab-is-dirty` | No | Set by the slotted element on itself while it has unsaved content, and removed when there is none. Compose does not set it. When present, compose shows the unsaved indicator on the tab. Only presence matters. |

#### Methods

| Method | Description |
| --- | --- |
| `focusComposer(fieldName?: string): Promise<void>` | Selects the tab for `fieldName` (a journal field name or a slotted tab key), scrolls compose into view, and focuses its textarea. With no argument it uses the first tab: first `compose-start` item, else first field, else first `compose-end` item. For a slotted tab it only selects the tab; focusing inside it is the slotted element's job. |

The method is also registered as the `focusComposer` capability for other widgets on the page.

### Exported helpers

| Export | Description |
| --- | --- |
| `withComposePopOutSupport(Base)` | Mixin for a slotted element that can pop out. Adds `enableModelessDialog` (default `true`), `poppedOut`, `slotActions`, `popOutTooltip`, `popOutOptions`, `getPopOutTitle()` and `renderSlotActions()`. |
| `COMPOSE_TAB_KEY_ATTRIBUTE` | `data-compose-tab-key` |
| `COMPOSE_TAB_TEXT_ATTRIBUTE` | `data-compose-tab-text` |
| `COMPOSE_TAB_IS_DIRTY_ATTRIBUTE` | `data-compose-tab-is-dirty` |

### System properties

Read from `sys_properties` on the instance.

| Property | Default | Effect |
| --- | --- | --- |
| `glide.ui.journal.use_html` | `false` | Makes the rich text editor available. When `false`, the rich text toggle is not shown and journal fields use plain text. |

### User preferences

Compose reads no `sys_user_preference` entries directly.

### Settings the component saves for the user

Saved automatically when the user changes them. The host does not read or write them.

| Setting | Scope | Stored in |
| --- | --- | --- |
| Compact versus stacked view (toggle in the compose settings menu) | Per table | Saved for the user. Stacked is the default. |
| Rich text editor on or off | Per table | Saved for the user. When nothing is saved, rich text is on if `glide.ui.journal.use_html` is `true`. |

The view is always stacked while the record has mandatory journal fields. The side-by-side choice is saved by `aiux-record-activity-layout`.

## Integration details

### Platform requirements

- Must be inside `<aiux-record-provider>`, which supplies the Form and Activity APIs.
- Shows only journal fields the current user can write to. When there are none, there is nothing to compose, and a surrounding `aiux-record-activity-layout` stacks instead of going side by side.
- Other viewers of the record see typing presence for the active field.

### SSR

Compose renders on the server. Pop-out windows, presence subscriptions and editor focus run in the browser only. A slotted element built with `withComposePopOutSupport` renders no pop-out button on the server and adds it on its second client render, so the first client render matches the server markup.

### Sizing and layout

When inside `aiux-record-activity-layout` and the layout is side by side, editors fill the available height. Otherwise editors grow to fit their content.

## Accessibility, localization, and customization

- All built-in strings are localized. Slotted tab text is supplied by the host and must be localized by the host.
- `bare` removes the card styling. `useDropdown` replaces the tabs. The component exposes no CSS parts.
