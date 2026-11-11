# aiux-control-journal-input

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-journal-input.md`

A textarea-based form-field control for journal/activity-style entries (comments, work notes). It extends the shared textarea base and adds a floating autocomplete popover for @mention-style and slash-command prefixes, plus optional raw-value viewer modals for JSON, XML, and HTML content.

Built in: prefix-triggered autocomplete search and keyboard navigation (arrow keys, Enter/Tab to select, Escape to dismiss), mention encoding/decoding between a display value and a stored value, slash text-commands (insert/replace/custom-event outcomes), and read-only JSON/XML/HTML viewer-editor modals. Do not build @mention autocomplete, a slash-command menu, or a raw-value viewer yourself — configure this control instead.

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

class MyHost extends AIUXElement {
  static properties = {
    note: {type: String}
  };

  render() {
    return html`
      <aiux-control-journal-input
        name="comments"
        label="Additional comments"
        .value=${this.note ?? ''}
        @AIUX_CONTROL_JOURNAL_INPUT#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-journal-input>
    `;
  }

  _onCommit(e) {
    this.note = e.detail.value;
  }
}
```

**What happens:** the control renders a `<textarea>` (4 rows by default) inside an internal `aiux-control-journal-autocomplete-popover`; the popover and its `aiux-control-journal-autocomplete-match-list` are rendered by `aiux-control-journal-input` itself and never need to be placed in host markup. Typing dispatches `AIUX_CONTROL_JOURNAL_INPUT#STAGED_VALUE_CHANGED` on every keystroke; blur dispatches `AIUX_CONTROL_JOURNAL_INPUT#VALUE_CHANGED`.

### Additional patterns

Enabling @mention autocomplete for a `@` prefix:

```js
html`<aiux-control-journal-input
  name="comments"
  label="Additional comments"
  value=${this.note}
  .mentions=${{
    '@': {
      kind: 'mention',
      prefix: '@',
      mapResults: users => users.map(u => ({id: u.sys_id, label: u.name})),
      displayItem: ({item}) => `@${item.label}`,
      getItemsFromInitialValue: () => [],
      format: ({value}) => value,
      parse: ({value}) => value
    }
  }}
></aiux-control-journal-input>`;
```

Enabling slash text-commands:

```js
html`<aiux-control-journal-input
  name="comments"
  label="Additional comments"
  value=${this.note}
  .textCommandsConfig=${{
    enableTextCommands: true,
    recordTable: 'incident',
    recordSysId: this.recordId
  }}
></aiux-control-journal-input>`;
```

**Gotcha:** selecting a mention or slash-command item inserts text into the `<textarea>` with `document.execCommand('insertText', ...)` rather than by writing to the `value` property directly, then relies on the resulting native `input` event to flow back through the normal staged/committed value pipeline. A host that only listens for `VALUE_CHANGED` and ignores the control's own DOM (e.g. by never letting the real `input` event reach it, or by re-rendering with a stale `value` in between) can end up with text visibly inserted in the textarea that never makes it into the host's own state. Also, if the slash-command fetch (`enableTextCommands: true`) fails, the `/` trigger hotkey is removed entirely for the remaining lifetime of that element instance — typing `/` again silently stops opening the command dropdown until the control is reconnected.

Showing a raw-JSON viewer/editor affordance next to the label:

```js
html`<aiux-control-journal-input
  name="payload"
  label="Payload"
  value=${this.note}
  show-json-view
></aiux-control-journal-input>`;
```

## API

### `aiux-control-journal-input`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Recomputes the displayed/staged value (decoding mentions) whenever it changes. | The field's committed value (mention-encoded if mentions are configured). |
| `initialValue` | `initialvalue` | `string` | `''` | Read once in `connectedCallback`; seeds `stagedValue` when `value` is empty. | Initial display text used before any real value is set. |
| `accentColor` | `accent-color` | `''` \| `'neutral'` \| `'yellow'` \| `'green-yellow'` \| `'blue'` \| `'magenta'` \| `'pink'` \| `'green'` \| `'orange'` \| `'brown'` | `''` | Read in `render()`; invalid values are dropped. | Renders a colored accent bar alongside the textarea. |
| `size` | `size` | `Size` (`'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| ''`) | `''` | Adds a sizing class to the textarea. | Textarea size variant. |
| `configAria` | `configaria` | `{'aria-label'?, 'aria-describedby'?, 'aria-description'?}` | `{}` | Read via `getAriaLabel`/`getAriaDescription`/`getAriaDescribedBy` overrides. | Explicit ARIA string overrides; `aria-label` falls back to `label` when unset. |
| `mentions` | `mentions` | `{[prefix: string]: string \| Partial<MentionConfig>}` | `{}` | Re-initializes the autocomplete controller's mention state whenever it changes. | Maps a trigger prefix (e.g. `'@'`) to a mention configuration. Presence of any key enables mention encoding/decoding of `value`. |
| `searchDebounce` | `searchdebounce` | `number` | `300` | Forwarded to the autocomplete controller. | Debounce (ms) for autocomplete search. |
| `autoresizeRowsLimit` | `autoresizerowslimit` | `number` | `0` | Adds a `--textarea-rows-limit` CSS variable when greater than `rows` and `autoresize` is on. | Caps CSS-driven autoresize growth to this many rows. |
| `fitToParent` | `fit-to-parent` (reflected) | `boolean` | `false` | Toggles inline `height`/`max-height` styles on the textarea on change. | Stretches the textarea to fill its parent instead of a row-based height. |
| `preloadMentions` | `preloadmentions` | `MentionUser[]` | `[]` | Forwarded to the autocomplete controller. | Mention candidates available without a fetch. |
| `textCommandsConfig` | `text-commands-config` | `TextCommandsConfig` | `{}` | Forwarded to the autocomplete controller. | Enables and scopes slash text-commands. |
| `showJsonView` | `show-json-view` | `boolean` | `false` | Read in `render()`. | Adds a button that opens a read/edit JSON viewer modal for the current value. |
| `showXmlView` | `show-xml-view` | `boolean` | `false` | Read in `render()`. | Adds a button that opens a read/edit XML viewer modal for the current value. |
| `showHtmlView` | `show-html-view` | `boolean` | `false` | Read in `render()`. | Adds a button that opens a read/edit HTML viewer modal for the current value. |

Also inherited from `TextareaBase` (`aiux-control-textarea`'s own base — see that control's usage doc for the full set): `autoresize`, `disableMinHeight` (defaulted to `true` here), `showCounter`, `rows` (defaulted to `4` here), `maxlength`, `minlength`, `cols`, `height`, `resize` (`'none' | 'vertical' | 'horizontal' | 'both'`), `sizerEnabled`, `dynamicTranslationEnabled` (attribute `dynamic-translation-enabled`).

Also inherited from the shared control base (`AIUXControlElement`/`ControlIdentityBase`): `name`, `label`, `placeholder`, `disabled`, `readonly`, `required`, `invalid`, `autofocus`, `nowId` (attribute `now-id`), `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator` (attribute `show-ai-indicator`), `showUnsavedIndicator` (attribute `show-unsaved-indicator`), `editMode` (attribute `edit-mode`, reflected), `variant` (reflected), `nowAssistConfig`, `referringRecordId` (attribute `referring-record-id`), `referringTable` (attribute `referring-table`), `fieldContextMenu`, `helperText`.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_JOURNAL_INPUT#STAGED_VALUE_CHANGED` | `{value: string, displayValue: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | Every input event on the textarea. | `value` is mention-encoded (if mentions are configured); `displayValue` is the raw textarea text. |
| `AIUX_CONTROL_JOURNAL_INPUT#VALUE_CHANGED` | `{value: string, displayValue: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | The textarea blurs, a Now Assist Contextual Menu insertion completes, or a JSON/XML/HTML viewer edit is applied. | On blur, `displayValue` is the staged (raw) text; on a viewer-modal apply, both staged and committed events fire together since there is no blur to trigger them. |
| `AIUX_CONTROL_JOURNAL_INPUT#BLUR` | `{value: string, event: FocusEvent, name: string}` | `bubbles: true, composed: true, cancelable: true` | The textarea blurs. | Fired immediately before `VALUE_CHANGED` on blur. |
| `AIUX_CONTROL_JOURNAL_INPUT#KEYDOWN` | `{event: KeyboardEvent, name: string}` | `bubbles: true, composed: true, cancelable: true` | Any keydown on the textarea. | Fired even when the autocomplete popover intercepts the key for navigation. |
| `AIUX_CONTROL_JOURNAL_INPUT#TEXT_COMMAND_SELECTED` | `{actionType: string, name: string, actionPayload?: unknown}` | `bubbles: true, composed: true, cancelable: true` | A text-command item with `insert_content` or `replace_content` `actionType` is selected from the slash-command menu. | A `custom_event`-outcome text command instead dispatches dynamically under the server-provided event name (from `item.customEvent`), not this literal string. |

#### Slots

None.

#### Methods

None. Focus is handled by the inherited base `focus()` (delegates to the internal `<textarea>`); there is no additional public method on this element.

### `aiux-control-journal-autocomplete-popover`

An internal companion element rendered automatically inside `aiux-control-journal-input`'s own template. It wraps the textarea (via its default slot) and shows/hides a floating match-list panel using the native Popover API. A host never places this tag directly — it is documented here only because it is a genuine separate custom element with its own properties and events.

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `opened` | `opened` | `boolean` | `false` | Calls `showPopover()`/`hidePopover()` on the internal popover element when it changes. | Whether the match-list popover is visible. |
| `items` | `items` | `JournalAutocompleteItem[]` | `[]` | Forwarded to the nested match-list element. | Current autocomplete matches. |
| `highlightedIndex` | `highlightedindex` | `number` | `0` | Forwarded to the nested match-list element. | Index of the keyboard-highlighted match. |
| `loading` | `loading` | `boolean` | `false` | Forwarded to the nested match-list element. | Shows a loading state instead of the match list. |
| `message` | `message` | `string \| null` | `null` | Forwarded to the nested match-list element. | Plain status/error message shown instead of matches. |
| `templateMessage` | `templatemessage` | `TemplateMessage \| null` | `null` | Forwarded to the nested match-list element. | Empty-state illustration/heading/body shown instead of matches. |
| `offset` | `offset` | `{top: number, left: number}` | `{top: 0, left: 0}` | Positions the fixed popover panel. | Screen position of the popover panel. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_JOURNAL_AUTOCOMPLETE_POPOVER#ITEM_SELECT` | forwarded from the nested match-list's `ITEM_SELECT` detail (`{item, index}`) | `bubbles: true, composed: true, cancelable: true` | The user picks a match from the nested match-list. | Consumed internally by `aiux-control-journal-input`, which calls back into its autocomplete controller. |

#### Slots

| Slot | Description |
| --- | --- |
| (default) | The textarea markup this popover wraps (rendered by `aiux-control-journal-input`). |

#### Methods

None.

### `aiux-control-journal-autocomplete-match-list`

An internal companion element rendered by `aiux-control-journal-autocomplete-popover`. Renders the actual list of matching mentions/commands, a loading spinner, an empty state, or a plain message, depending on which properties are set.

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `items` | `items` | `JournalAutocompleteItem[]` | `[]` | Re-renders the list. If the first item has a non-empty `children` array, that item is treated as a header/group and its `children` become the selectable list (used for the text-commands trigger menu); otherwise `items` itself is the selectable list. | Match items to display. |
| `highlightedIndex` | `highlightedindex` | `number` | `0` | Highlights the corresponding row. | Keyboard-highlighted row index. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner card instead of the list. | Loading state. |
| `message` | `message` | `string \| null` | `null` | Shows a plain-text card instead of the list (checked after `loading`, before the empty state). | Status/error message. |
| `templateMessage` | `templatemessage` | `TemplateMessage \| null` | `null` | Shows an `aiux-empty-state-content` card instead of the list (checked after `loading`, before `message`). | Empty-state illustration content. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_JOURNAL_AUTOCOMPLETE_MATCH_LIST#ITEM_SELECT` | `{item: JournalAutocompleteItem, index: number}` | `bubbles: true, composed: true, cancelable: true` | The user clicks (mousedown) a row. | `index` is relative to the flattened (possibly grouped) list, not necessarily the raw `items` array. |

#### Slots

None.

#### Methods

None.

### Data shapes

`MentionUser`:

| Property | Type | Description |
| --- | --- | --- |
| `sys_id` | `string` | Record identifier. |
| `name` | `string` | Display name. |
| `email` | `string`, optional | Email address. |
| `avatar` | `string`, optional | Avatar image URL. |
| `record_is_visible` | `boolean`, optional | Whether the current user can access the mentioned record. |
| `lastname` | `string`, optional | Last name, used for initials fallback. |

`MentionConfig` (one entry per prefix in the `mentions` property):

| Property | Type | Description |
| --- | --- | --- |
| `kind` | `'mention'` | Discriminator. |
| `prefix` | `string` | Trigger character(s), e.g. `'@'`. |
| `mapResults` | `(data: MentionUser[]) => JournalAutocompleteItem[]` | Maps a fetch result to autocomplete items. |
| `displayItem` | `(params: {item, prefix}) => string` | Formats a selected item for display in the textarea. |
| `getItemsFromInitialValue` | `(params: {value, prefix}) => Array<{id, value}>` | Extracts already-mentioned items from an initial encoded value. |
| `format` | `(params: {value, prefix}) => string` | Formats the encoded value segment for a mention. |
| `parse` | `(params: {value, prefix, selectedItems}) => string` | Parses an encoded value segment back into display text. |

`TextCommandsConfig`:

| Property | Type | Description |
| --- | --- | --- |
| `enableTextCommands` | `boolean`, optional | Enables the slash-command menu. |
| `recordTable` | `string`, optional | Table of the record being edited. |
| `recordSysId` | `string`, optional | sys_id of the record being edited. |
| `type` | `string`, optional | Command source type. |
| `fieldType` | `string`, optional | Field type context passed to the command handler. |

`JournalAutocompleteItem`:

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | Item identifier. |
| `label` | `string` | Primary display text. |
| `sublabel` | `string`, optional | Secondary display text. |
| `avatarProps` | `{imageSrc: string, userName: string}`, optional | Avatar rendering data. |
| `value` | `string`, optional | Underlying value. |
| `children` | `JournalAutocompleteItem[]`, optional | Present on a header/group entry; the actual selectable items. |
| `insertContent` | `string`, optional | Text-command insert payload. |
| `replaceContent` | `string`, optional | Text-command replace payload. |
| `customEvent` | `string`, optional | Server-provided event name for a `custom_event` text command. |
| `actionPayload` | `unknown`, optional | Arbitrary payload for the selected action. |
| `recommended` | `boolean`, optional | Marks a recommended entry. |

`TemplateMessage`:

| Property | Type | Description |
| --- | --- | --- |
| `headingLabel` | `string`, optional | Empty-state heading. |
| `content` | `string`, optional | Empty-state body text. |
| `illustration` | `string`, optional | Empty-state illustration name. |

## Integration details

No additional requirements.

### Platform requirements

None beyond the package itself.

### SSR

Server-safe: rendering does not touch `window`/`document` directly (the popover's `showPopover()`/`hidePopover()` calls are wrapped in a try/catch and only run in `updated()`, which is client-only).

### Lifecycle

No deferred/idle-loaded dependency — the autocomplete controller and companion elements are constructed eagerly with the host.

### Sizing and layout

Defaults to 4 rows (`rows`) with `disableMinHeight` on. `autoresize` grows the textarea via CSS `field-sizing: content`; `autoresizeRowsLimit` caps that growth. `fitToParent` overrides both, stretching to the parent's height.

## Accessibility, localization, and customization

The textarea gets standard ARIA wiring (`aria-label`/`aria-labelledby`/`aria-describedby`/`aria-required`/`aria-invalid`) from the shared textarea base, with `configAria` letting the host override `aria-label`/`aria-describedby`/`aria-description` directly. Keyboard: the autocomplete popover supports arrow-key navigation, Enter/Tab to select, and Escape to dismiss (handled in `handleKeyDown`, not overridable). The match-list's "Loading..." and "No results found" strings, and the JSON/XML/HTML viewer UI, are localized via `@lit/localize` `msg()` and are not host-settable. Styling hooks: `control-styles` (raw CSS) applies to the textarea; `accentColor` selects one of nine built-in accent-bar colors; no `::part()` or CSS custom property surface is exposed for the popover/match-list beyond their own internal Tailwind/DaisyUI classes.
