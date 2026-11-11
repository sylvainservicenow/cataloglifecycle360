# aiux-control-html-editor

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-html-editor.md`

A form-field control for editing an HTML field's value with a full rich-text toolbar. It lazily loads and wraps TinyMCE, forwarding the host's field metadata (label, required, messages, layout) into the shared form-field chrome.

Built in: deferred (idle-time) TinyMCE loading so the ~4MB editor never blocks initial render, a lightweight non-editable preview for readonly/inline modes, image/media attachment upload wiring, @mention and hotkey/text-command plugin hooks, Now Assist context-menu integration, and RTL/theme-aware styling. Do not build a rich-text editor, attachment upload flow, or mentions/hotkeys plugin wiring yourself — configure this control instead.

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
    description: {type: String}
  };

  render() {
    return html`
      <aiux-control-html-editor
        name="description"
        label="Description"
        .value=${this.description ?? ''}
        @AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-html-editor>
    `;
  }

  _onCommit(e) {
    this.description = e.detail.value;
  }
}
```

**What happens:** the control renders a plain `<textarea>` immediately (SSR-safe), then activates TinyMCE at browser idle. Editing dispatches `AIUX_CONTROL_HTML_EDITOR#STAGED_VALUE_CHANGED` on every content change and `AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED` on blur if the content is dirty.

### Additional patterns

Because the event name contains a literal `#`, `@`-binding it in a Lit template (as above) works, but with `addEventListener` you must pass the string exactly:

```js
el.addEventListener('AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED', e => {
  console.log(e.detail.value);
});
```

Readonly/inline display, with no TinyMCE ever loaded:

```js
html`<aiux-control-html-editor
  name="description"
  label="Description"
  value=${this.description}
  edit-mode="display-only"
></aiux-control-html-editor>`;
```

Wiring inline image/media attachment uploads to a record (requires `referring-table`/`referring-record-id`; without both, the upload handler and the link plugin's attachment-list picker are simply never installed, and pasted/dropped images fall back to inline data URIs instead of uploading):

```js
import {isServer} from 'lit';

html`<aiux-control-html-editor
  name="description"
  label="Description"
  value=${this.description}
  referring-table="incident"
  referring-record-id=${this.recordSysId}
  base-url=${isServer ? '' : window.location.origin}
></aiux-control-html-editor>`;
```

## API

### `aiux-control-html-editor`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Pushed into TinyMCE via `setContent` when it differs from the editor's own tracked value. | The field's committed HTML content. |
| `name` | `name` | `string` | `''` | Read at editor init and included in dispatched event `detail`. | Field name identifier. |
| `label` | `label` | `string` | `''` | Applied as the TinyMCE iframe's `aria-label` and folded into the ARIA label built from messages. | Field label text. |
| `placeholder` | `placeholder` | `string` | `''` | Bound to the fallback `<textarea>` only (not forwarded into TinyMCE config). | Placeholder shown before TinyMCE activates. |
| `description` | `description` | `string \| undefined` | `undefined` | Not currently used. | Declared but not read anywhere in the component. |
| `readonly` | `readonly` | `boolean` | `false` | Checked in `render()` alongside `editMode`; when true, renders the `<aiux-control-rich-text>` preview instead of mounting TinyMCE at all — same as the `edit-mode="inline"`/`"display-only"` preview path, not a separate "live editor in readonly mode" state. | Marks the field read-only. Swaps to the plain preview, same as `edit-mode`. |
| `disabled` | `disabled` | `boolean` | `false` | Read in `render()` to decide whether the translate icon shows. | Disables the translate affordance; does not itself disable TinyMCE editing. |
| `autofocus` | `autofocus` | `boolean` | `false` | Checked once TinyMCE is ready via `checkAutofocus`. | Focuses the editor on activation. |
| `reversed` | `reversed` | `boolean` | `false` | Read at editor init only. | Forces RTL (`directionality: 'rtl'`) regardless of document direction. |
| `minHeight` | `min-height` | `number` | `100` | Applied to TinyMCE's height options on next render after change. | Minimum drag-resize height in pixels. |
| `maxHeight` | `max-height` | `number` | `2000` | Same as `minHeight`. | Maximum drag-resize height in pixels. |
| `height` | `height` | `number` | `200` | Same as `minHeight`; ignored once `autoresize` or `fitToParent` is on. | Initial height in pixels. Only pixel values are honored — `%`/`vh`/`calc()` are discarded. |
| `minLineCount` | `min-line-count` | `number \| undefined` | `undefined` | Combined with editor chrome constants to derive a pixel height. | Alternative to `height`, expressed in visible lines. |
| `autoresize` | `autoresize` | `boolean` | `false` | Toggles the TinyMCE `autoresize` plugin via `sn_toggle_autoresize`. | Grows the editor to fit its content instead of scrolling. |
| `autoresizeLineLimit` | `autoresize-line-limit` | `number \| undefined` | `undefined` | Applied on `SetContent`/`change` via `applyAutoresizeLineLimit`. | Caps `autoresize` growth to this many lines. |
| `resizable` | `resizable` | `boolean` | `true` | Read at editor init only. | Shows the manual drag-resize handle (TinyMCE `resize`/`statusbar`). |
| `browserSpellcheck` | `browser-spellcheck` | `boolean` | `true` | Read at editor init only. | Enables the browser's native spellcheck inside the editor body. |
| `toolbar` | `toolbar` | `string \| false` | `'bold italic underline undo redo | fontfamily fontsize table | forecolor backcolor link unlink | code | alignleft aligncenter alignright | bullist numlist fullscreen'` | Read at editor init only. | Space-separated TinyMCE toolbar button list, or `false` to hide the toolbar. |
| `plugins` | `plugins` | `string` | `'accordion link lists advlist table powerpaste searchreplace preview fullscreen placeholder readonlynoborder'` | Read at editor init only. | Space-separated TinyMCE plugin list (merged with required/blocklisted plugins). |
| `validPlugins` | `valid-plugins` | `string \| undefined` | `undefined` | Read at editor init only. | Allowlist filter applied to `plugins`. |
| `validButtons` | `valid-buttons` | `string \| undefined` | `undefined` | Read at editor init only. | Allowlist filter applied to `toolbar`. |
| `contextmenu` | `contextmenu` | `string \| false` | `'link image table'` | Read at editor init only. | TinyMCE native context-menu item list. |
| `relativeUrls` | `relative-urls` | `boolean` | `true` | Read at editor init only. | TinyMCE `relative_urls`. |
| `removeHost` | `remove-host` | `boolean` | `true` | Read at editor init only. | TinyMCE `remove_script_host`. |
| `convertUrls` | `convert-urls` | `boolean` | `false` | Read at editor init only. | TinyMCE `convert_urls`. |
| `extendedValidElements` | `extended-valid-elements` | `string` | `''` | Read at editor init only. | TinyMCE `extended_valid_elements`. |
| `sandboxIframes` | `sandbox-iframes` | `boolean` | `true` | Read at editor init only. | Adds a `sandbox` attribute to iframes rendered inside editor content. |
| `enableMediaSites` | `enable-media-sites` | `string` | `'youtube.com,player.vimeo.com,vimeo.com,players.brightcove.net,brightcove.net'` | Read at editor init only. | Comma-separated domains exempted from iframe sandboxing. |
| `contentStyle` | `content-style` | `string` | `''` | Applied via `setEditorStyle` on change. | Extra CSS injected into the editor's content document. |
| `fonts` | `fonts` | `string` | Long TinyMCE `fontfamily_formats`-style default string. | Read at editor init only. | Font family list offered in the toolbar. |
| `language` | `language` | `string` | `'en'` | Read at editor init only. | TinyMCE UI language (mapped through `getMappedLanguage`). |
| `baseURL` | `base-url` | `string` | `''` | Read at editor init only. | Base URL used when building attachment/link list handlers. |
| `contentVariant` | `content-variant` | `'neutral' \| 'yellow' \| 'magenta' \| 'pink' \| 'orange' \| 'brown' \| 'green' \| 'green-yellow' \| 'blue'` | `'neutral'` | Re-applies the theme's CSS variables to the live editor when changed. | Background/accent color treatment for the editor content area. |
| `color` | `color` | `string` | `'initial'` | Applied as a background color class (`html_editor_bg_color_<value>`) on every update. | Legacy field background color name. |
| `bare` | `bare` | `boolean` | `false` | Read at editor init only. | Removes the editor's border chrome (`sn-mce-noborder`). |
| `size` | `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| ''` | `''` | Read in `render()`. | Sizing class applied to the fallback textarea before TinyMCE activates. |
| `enableCodeBlocks` | `enable-code-blocks` | `boolean` | `false` | Not currently used for editor behavior — declared and typed but not read by any effect/controller code path found. | Reserved. |
| `useCodeBlocks` | `use-code-blocks` | `boolean` | `false` | Passed to `getEditorContent` when reading content out of the editor. | Preserves `[code]...[/code]` fenced blocks when extracting HTML. |
| `allowBlockBasedAnchors` | `allow-block-based-anchors` | `boolean` | `false` | Read on `value` changes and in `setContent` effect. | Swaps `<div>` anchor targets for `<span>` when pushing content into the editor. |
| `ignoreInlineAttachmentPrefix` | `ignore-inline-attachment-prefix` | `boolean` | `false` | Not currently used — declared but not read anywhere in the component. | Reserved. |
| `defaultLinkTarget` | `default-link-target` | `string` | `''` | Read at editor init only; invalid values fall back to `''`. | Default `target` for inserted links. Must be one of `''`, `_self`, `_blank`, `_top`. |
| `powerPasteHtmlImport` | `power-paste-html-import` | `string` | `'clean'` | Read at editor init only. | TinyMCE PowerPaste HTML import mode. |
| `powerPasteWordImport` | `power-paste-word-import` | `string` | `'prompt'` | Read at editor init only. | TinyMCE PowerPaste Word import mode. |
| `powerPasteFilterInlineElements` | `power-paste-filter-inline-elements` | `string` | `'strong, b'` | Read at editor init only. | Inline elements stripped by PowerPaste. |
| `autoresizeBottomMargin` | `autoresize-bottom-margin` | `number \| undefined` | `undefined` | Read at editor init only. | Extra bottom margin used by the `autoresize` plugin. |
| `forcedRootBlock` | `forced-root-block` | `string` | `'p'` | Read at editor init only. | TinyMCE `forced_root_block`. |
| `newlineBehavior` | `newline-behavior` | `string` | `'default'` | Read at editor init only. | TinyMCE `newline_behavior`. |
| `fitToParent` | `fit-to-parent` (reflected) | `boolean` | `false` | Toggles a `sn_set_fit_to_parent` command (or direct container height) on change. | Stretches the editor to fill its parent's height instead of a fixed pixel height. |
| `showToolbar` | `show-toolbar` | `boolean \| undefined` | `undefined` | Toggles a `sn_hide_toolbar` class on the toolbar chrome on change. | Shows/hides the toolbar without removing it from the DOM. |
| `convertBlobsToBase64` | `convert-blobs-to-base64` | `boolean` | `true` | Read at editor init only. | TinyMCE `sn_convert_blobs_to_base64`. |
| `configMentions` | `config-mentions` | `MentionsConfig \| undefined` | `undefined` | Read at editor init (merged with `mentions`); `enableMentions` sub-key checked reactively via a getter. | Mentions/@-autocomplete configuration; `configMentions.enableMentions` takes precedence over the `enableMentions` property. |
| `enableMentions` | `enable-mentions` | `boolean` | `false` | Read at editor init to decide whether to load the `sn_mentions` plugin. | Enables @mention autocomplete when `configMentions.enableMentions` is unset. |
| `mentions` | `mentions` | `any` | `undefined` | Merged with `configMentions` at editor init. | Additional mentions plugin settings (messages, fetch config, etc.). |
| `preloadMentions` | `preload-mentions` | `any[]` | `[]` | Pushed into the live editor's `sn_settings.mentions.preloadMentions` on change. | Mention entries to preload without a fetch. |
| `textCommandsConfig` | `text-commands-config` | `TextCommandsConfig \| undefined` | `undefined` | Read at editor init to decide whether to load the `sn_hotkeys` plugin. | Slash/hotkey text-command configuration. |
| `messages` | `messages` | `any[]` | `[]` | Folded into the editor iframe's `aria-label` on change. | Field validation/status messages (overrides the base `ControlMessage[]` type to accept platform's `{type, message}` shape). |
| `menuConfigs` | `menu-configs` | `string` | `''` | Read at editor init only (deprecated, falls back to `htmlEditorConfigs`). | Deprecated JSON menu/style-format overrides; use `htmlEditorConfigs`. |
| `htmlEditorConfigs` | `html-editor-configs` | `string` | `''` | Read at editor init only. | JSON string overriding `menubar`, `menu`, and `style_formats`. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | `boolean` | `false` | Checked once after first render; enables a translate-icon affordance. | Turns on the built-in "translate this field" UI. |
| `configAria` | `config-aria` | `object` | `{}` | Not currently used — declared but not read anywhere in the component. | Reserved. |
| `highlightedValue` | `highlighted-value` | `HighlightedValue[]` | `[]` | Rendered as status badges by the shared form-field layout. | Highlighted-value badge entries (see base class). |
| `formData` | `form-data` | `ControlFormData` | `{showUnsavedIndicator: false}` | Read for the unsaved-change indicator. | Form-level state forwarded from the host form. |
| `allowFieldChangesAfterEveryStageChange` | `allow-field-changes-after-every-stage-change` | `string` (typed `boolean` at the decorator, declared as `string`) | `false` | Not currently used — declared but not read anywhere in the component. | Reserved. |
| `isJournal` | `is-journal` | `String \| undefined` | `undefined` | Read at editor init: when truthy, disables image upload (returns a promise that never resolves) instead of wiring the attachment handler. | Marks the editor as embedded in a journal/activity entry. |
| `onValueChange` | `on-value-change` | `(event: CustomEvent) => void \| undefined` | `undefined` | Not currently used — the call site is commented out in source. | Reserved callback; use the `AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED` event instead. |
| `onStagedValueChange` | `on-staged-value-change` | `(event: CustomEvent) => void \| undefined` | `undefined` | Not currently used — never invoked. | Reserved callback; use the `AIUX_CONTROL_HTML_EDITOR#STAGED_VALUE_CHANGED` event instead. |
| `onFocus` | `on-focus` | `(event: CustomEvent) => void \| undefined` | `undefined` | Invoked directly (not via a DOM event) whenever the editor gains focus. | Focus callback. |
| `onBlur` | `on-blur` | `(event: CustomEvent) => void \| undefined` | `undefined` | Invoked directly whenever the editor loses focus. | Blur callback. |
| `onResize` | `on-resize` | `(event: CustomEvent) => void \| undefined` | `undefined` | Invoked directly whenever the user drag-resizes the editor. | Resize callback. |

Also inherited from the shared control base (`AIUXControlElement`/`ControlIdentityBase`): `disabled`/`required`/`invalid`/`nowId` (attribute `now-id`), `labelUrl`/`labelUrlTarget`, `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `decorations`, `decorationWidgets`, `showAIIndicator` (attribute `show-ai-indicator`), `showUnsavedIndicator` (attribute `show-unsaved-indicator`), `editMode` (attribute `edit-mode`, reflected — `'default' | 'inline' | 'display-only'`), `variant` (reflected — `'default' | 'compact'`), `nowAssistConfig`, `referringRecordId` (attribute `referring-record-id`), `referringTable` (attribute `referring-table`), `fieldContextMenu`, `helperText`.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_HTML_EDITOR#STAGED_VALUE_CHANGED` | `{value: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | The editor's content changes (TinyMCE `Change`), before commit. | Skipped when the difference is only HTML-entity encoding. |
| `AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED` | `{value: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | The editor loses focus (blur) and TinyMCE considers the content dirty. | Also calls `editor.save()` to sync the fallback textarea. |
| `TINYMCE_EDITOR#EDITOR_READY` | `{name: string}` | `bubbles: true, composed: true, cancelable: true` | TinyMCE finishes initializing and is assigned to the component. | Not fired if the element disconnects mid-activation. |
| `AIUX_CONTROL_HTML_EDITOR#MENTION_ADDED` | mentions-plugin event payload, plus `name` | `bubbles: true, composed: true, cancelable: true` | The `sn_mentions` plugin reports a mention insertion. | Only fires when `enableMentions`/`configMentions.enableMentions` is on. |
| `AIUX_CONTROL_HTML_EDITOR#MENTION_DELETED` | mentions-plugin event payload, plus `name` | `bubbles: true, composed: true, cancelable: true` | The `sn_mentions` plugin reports a mention removal. | Same gating as above. |
| `UI_TEXT_COMMAND#OPTION_SELECTED` | `{actionType, actionPayload, name}` | `bubbles: true, composed: true, cancelable: true` | A hotkey/text-command menu item is selected and carries no custom event name. | Only fires when `textCommandsConfig.enableTextCommands` is on. |

Every dispatched event is a plain `CustomEvent` created by the shared `dispatchAction` helper — the event `type` is always one of the literal strings above (not `value-changed`/`staged-value-changed`, which are the generic base-class event names other controls use). Internal TinyMCE bridging events (`TINYMCE_EDITOR#ON_CHANGE`, `#ON_FOCUS`, `#ON_BLUR`, `#ON_CLICK`, `#ON_KEYDOWN`, `#ON_RESIZE`, `#SET_CONTENT`, `#SET_FOCUS`) and attachment-upload events (`POST_ATTACHMENT_QUERY`/`POST_DATA_*`, `GET_ATTACHMENTS_*`) also bubble as the same kind of `CustomEvent`, but each has `stopPropagation: true` configured on its own listener, so none of them escape the component — they are implementation detail, not part of the public contract.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the live TinyMCE editor if active; otherwise focuses the fallback textarea and queues a focus once TinyMCE becomes ready. |
| `reset()` | Clears `value`/`stagedValue`/focus/error state (base behavior) and additionally clears the live TinyMCE content and its undo stack. |

The rendered element also exposes two imperative helpers directly on the host DOM node once mounted (not typed `@property`s): `insertPill(pillInfo)` inserts a non-editable "pill" span (`{displayValue, tooltipValue, value}`), and `insertContentAtCursor(content)` inserts raw HTML at the current cursor position.

### Data shapes

`MentionsConfig`:

| Property | Type | Description |
| --- | --- | --- |
| `enableMentions` | `boolean`, optional | Overrides the `enableMentions` property when present. |
| `fetch` | `(query: string) => Promise<any[]>`, optional | Mention search callback. |
| `table` | `string`, optional | Table to search for mentionable records. |
| `resourceTable` | `string`, optional | Resource table for attachment-style mentions. |
| `resourceSysId` | `string`, optional | Resource record sys_id. |
| `messages` | `{loading?, noMatches?, init?}`, optional | Autocomplete status strings. |
| `preloadMentions` | `any[]`, optional | Mentions available without a fetch. |

`TextCommandsConfig`:

| Property | Type | Description |
| --- | --- | --- |
| `enableTextCommands` | `boolean`, optional | Enables the hotkeys/text-command plugin. |
| `type` | `string`, optional | Command source type. |
| `fieldType` | `string`, optional | Field type context passed to the command handler. |
| `recordTable` | `string`, optional | Table of the record being edited. |
| `recordSysId` | `string`, optional | sys_id of the record being edited. |

## Integration details

### Platform requirements

Requires `sn-tinymce` assets (bundled as a dependency of `@servicenow/aiux-components-control`) to be resolvable at runtime; these are fetched via dynamic `import()` only once an editable (non-readonly) instance actually activates.

### SSR

Server-safe: `connectedCallback` returns before any TinyMCE work when `isServer` is true, and `render()` emits a plain `<textarea>` (or, in readonly/inline/display-only modes, an `<aiux-control-rich-text>` preview) with no `window`/`document` access.

### Lifecycle

On the client, in editable modes the ~4MB TinyMCE bundle is deferred to browser idle time (not loaded during initial hydration); entering an on-demand edit mode (`editMode` transitioning from inline/display-only) instead loads it immediately. In `edit-mode="inline"` or `edit-mode="display-only"`, TinyMCE is never loaded at all — the control renders a read-only `<aiux-control-rich-text>` preview of `value` instead (or an em-dash placeholder when `value` is empty).

Gotcha: the upload handler checks a dropped/pasted file's extension against the server-provided attachment extension allowlist *before* sending it — a disallowed extension never reaches the server; it immediately dispatches a failure with an "Unsupported file type" message instead. Separately, `isJournal` doesn't just block uploads, it makes the upload handler return a promise that **never resolves or rejects** — TinyMCE's own upload progress spinner is left spinning indefinitely rather than failing visibly, so journal/activity contexts must not rely on upload completion. Also, automatic uploads of embedded data-URI images are deliberately held off until the control's *initial* content has been set once (`automatic_uploads` is only turned on afterward) — this prevents images already present in an incoming `value` from being immediately re-uploaded on mount.

### Sizing and layout

`height`/`minHeight`/`maxHeight` are pixels only. `minLineCount` is an alternative way to express the initial height in lines. Both are ignored while `autoresize` or `fitToParent` is enabled, since those derive height automatically. `fitToParent` stretches the editor and its container to the height of the host's parent instead of a fixed pixel value.

## Accessibility, localization, and customization

The TinyMCE iframe gets `role="textbox"`, an `aria-label` combining the field label with a fixed English hint ("Rich Text Area. Press ALT-0 for help.") and toolbar-navigation instructions, and `aria-required` when `required` is set; field messages are appended into that same label. Keyboard: TinyMCE's own editing shortcuts, plus Alt+F10 (Option+F10 on Mac) to reach the toolbar and Escape to return to the editor — both hard-coded English instructional strings, localized via `@lit/localize` `msg()` (not host-settable). RTL is auto-detected from document direction or forced via the `reversed` property. Styling hooks: `content-variant` selects one of nine built-in color themes (mapped to `--now-color_*` CSS variables); `color` applies a legacy `html_editor_bg_color_<value>` background class; `control-styles` (raw CSS declarations) is applied directly to the fallback textarea. There is no `::part()`/slot-based styling surface — TinyMCE's own chrome is themed via the package's `theme.css`/`styles.css`, not exposed for host overrides.
