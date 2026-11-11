# aiux-control-html-script

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-html-script.md`

A form-field control that composes an `aiux-control-html-editor` with an `aiux-control-content-tree` variable picker side by side. Selecting a field in the picker inserts a `Label: ${field_name}` token at the editor's caret.

Built in: the editor/picker split layout (wraps to stacked rows when narrow), and the caret-insertion wiring between picker selection and editor content. Do not build a script-field-plus-token-picker layout or the insertion glue yourself — configure this control instead.

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
    body: {type: String}
  };

  render() {
    return html`
      <aiux-control-html-script
        name="body"
        label="Notification Body"
        table-name="incident"
        .value=${this.body ?? ''}
        @AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-html-script>
    `;
  }

  _onCommit(e) {
    this.body = e.detail.value;
  }
}
```

**What happens:** the control renders the HTML editor on the left and a "Select Variables" tree picker (scoped to `table-name`) on the right. Clicking a field in the picker inserts `FieldLabel: ${field_name}` at the editor's current caret position. Editing the HTML content dispatches the same `AIUX_CONTROL_HTML_EDITOR#STAGED_VALUE_CHANGED`/`AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED` events as `aiux-control-html-editor` itself (they bubble up through this component unchanged).

### Additional patterns

Readonly rendering omits the picker and messages row entirely, delegating straight to the inner editor's own readonly preview:

```js
html`<aiux-control-html-script
  name="body"
  label="Notification Body"
  value=${this.body}
  readonly
></aiux-control-html-script>`;
```

## API

### `aiux-control-html-script`

#### Properties and attributes

Editor pass-through properties — forwarded verbatim to the inner `aiux-control-html-editor` (same meaning as on that control; see its own usage doc for full detail):

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `placeholder` | `placeholder` | `string` | `''` | Forwarded to the inner editor. | Placeholder text. |
| `description` | `description` | `string \| undefined` | `''` | Forwarded to the inner editor (not currently used there). | Reserved. |
| `readonly` | `readonly` | `boolean` | `false` | Forwarded; also switches this component's own `render()` to skip the picker/messages layout. | Read-only mode. |
| `autofocus` | `autofocus` | `boolean` | `false` | Forwarded to the inner editor. | Autofocus on activation. |
| `reversed` | `reversed` | `boolean` | `false` | Forwarded to the inner editor. | Forces RTL. |
| `height` | `height` | `number` | `200` | Forwarded to the inner editor; also fed through the same height-resolution calculation (`getInitialHeight`, accounting for `minHeight`/`maxHeight`/`resizable`) to size the picker column to match. | Initial editor height in pixels. |
| `minHeight` | `min-height` | `number` | `100` | Forwarded to the inner editor. | Minimum drag-resize height. |
| `maxHeight` | `max-height` | `number` | `2000` | Forwarded to the inner editor. | Maximum drag-resize height. |
| `resizable` | `resizable` | `boolean` | `true` | Forwarded to the inner editor; also used to compute the picker column height. | Shows the drag-resize handle. |
| `browserSpellcheck` | `browser-spellcheck` | `boolean` | `true` | Forwarded to the inner editor. | Native spellcheck. |
| `toolbar` | `toolbar` | `string \| undefined` | `undefined` | Forwarded as `''` when unset, which the inner editor resolves to no toolbar at all (`toolbar: false`) — **not** that control's own default toolbar. | Toolbar button list. |
| `plugins` | `plugins` | `string \| undefined` | `undefined` | Forwarded as `''` when unset; the inner editor then loads only its required plugin set (`powerpaste sn_popups_fix sn_tooltip sn_a11y_fix`, plus mentions/hotkeys/autoresize/Now Assist when enabled) — **not** that control's own richer default plugin list. | Plugin list. |
| `validPlugins` | `valid-plugins` | `string \| undefined` | `undefined` | Forwarded to the inner editor. | Plugin allowlist. |
| `validButtons` | `valid-buttons` | `string \| undefined` | `undefined` | Forwarded to the inner editor. | Toolbar allowlist. |
| `contextmenu` | `contextmenu` | `string \| undefined` | `undefined` | Forwarded to the inner editor (falls back to `'link image table'` when unset). | Native context-menu items. |
| `relativeUrls` | `relative-urls` | `boolean` | `true` | Forwarded to the inner editor. | Relative URLs. |
| `removeHost` | `remove-host` | `boolean` | `true` | Forwarded to the inner editor. | Strip script host from URLs. |
| `convertUrls` | `convert-urls` | `boolean` | `false` | Forwarded to the inner editor. | Convert URLs. |
| `extendedValidElements` | `extended-valid-elements` | `string` | `''` | Forwarded to the inner editor. | Extended valid elements. |
| `contentStyle` | `content-style` | `string` | `''` | Forwarded to the inner editor. | Extra content CSS. |
| `fonts` | `fonts` | `string \| undefined` | `undefined` | Forwarded as `''` when unset, which clears the editor's font-family list — **not** that control's own default font list. | Font list. |
| `language` | `language` | `string` | `'en'` | Forwarded to the inner editor. | UI language. |
| `baseURL` | `base-url` | `string` | `''` | Forwarded to the inner editor. | Base URL for attachments/links. |
| `defaultLinkTarget` | `default-link-target` | `string` | `''` | Forwarded to the inner editor. | Default link target. |
| `enableCodeBlocks` | `enable-code-blocks` | `boolean` | `false` | Forwarded to the inner editor (where it is itself not currently used). | Reserved. |
| `useCodeBlocks` | `use-code-blocks` | `boolean` | `false` | Forwarded to the inner editor. | Preserve `[code]` fences. |
| `allowBlockBasedAnchors` | `allow-block-based-anchors` | `boolean` | `false` | Forwarded to the inner editor. | Swap div anchors for spans. |
| `ignoreInlineAttachmentPrefix` | `ignore-inline-attachment-prefix` | `boolean` | `false` | Forwarded to the inner editor (where it is itself not currently used). | Reserved. |
| `convertBlobsToBase64` | `convert-blobs-to-base64` | `boolean` | `true` | Forwarded to the inner editor. | Base64 blob conversion. |
| `menuConfigs` | `menu-configs` | `string` | `''` | Forwarded to the inner editor (deprecated there). | Deprecated menu/style overrides. |
| `htmlEditorConfigs` | `html-editor-configs` | `string` | `''` | Forwarded to the inner editor. | JSON menu/style-format overrides. |
| `newlineBehavior` | `newline-behavior` | `string` | `'default'` | Forwarded to the inner editor. | Newline handling. |

Variable-picker properties — forwarded to the inner `aiux-control-content-tree` (rendered in "variable picker" connected mode):

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `tableName` | `table-name` | `string` | `''` | Forwarded to the picker. | Table the picker's fields are scoped to. |
| `fieldName` | `field-name` | `string` | `''` | Forwarded to the picker. | Field context for the picker query. |
| `referenceTable` | `reference-table` | `string` | `''` | Forwarded to the picker. | Reference table to traverse. |
| `dependentField` | `dependent-field` | `string` | `''` | Forwarded to the picker. | Dependent field name. |
| `dependentValue` | `dependent-value` | `string` | `''` | Forwarded to the picker. | Dependent field value. |
| `dependentDisplayValue` | `dependent-display-value` | `string` | `''` | Forwarded to the picker. | Dependent field display value. |
| `dependentFieldLabel` | `dependent-field-label` | `string` | `''` | Forwarded to the picker. | Dependent field label. |
| `treePickerConfig` | — (`attribute: false`) | `TreePickerConfig \| null` | `null` | Forwarded to the picker. | Advanced picker configuration object. |
| `domainId` | `domain-id` | `string` | `''` | Forwarded to the picker. | Domain scoping id. |
| `query` | `query` | `string` | `''` | Forwarded to the picker. | Picker search/filter query. |
| `select` | `select` | `SelectMode` (`'single' \| ...`) | `'single'` | Forwarded to the picker. | Picker selection mode. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_HTML_EDITOR#STAGED_VALUE_CHANGED` | `{value: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | The inner editor's content changes, before commit. | Dispatched by the nested `aiux-control-html-editor`; passes through this component's shadow boundary unchanged. |
| `AIUX_CONTROL_HTML_EDITOR#VALUE_CHANGED` | `{value: string, name: string}` | `bubbles: true, composed: true, cancelable: true` | The inner editor loses focus with dirty content. | Same as above. |

Selecting a picker item does not dispatch a public event from this component — it is handled internally (the content-tree's own `AIUX_CONTROL_CONTENT_TREE_CONNECTED#ITEM_CLICKED`, stopped from propagating) and translated directly into an `INSERT_CONTENT` call against the editor.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Forwards focus to the inner `aiux-control-html-editor`. |

### Data shapes

`TreePickerConfig` and `SelectMode` are defined by `aiux-control-content-tree` (imported from `../content-tree` internally) — see that component's own documentation for their shape.

## Integration details

No additional requirements beyond those of `aiux-control-html-editor` and `aiux-control-content-tree`, both of which this component loads as static imports.

### Platform requirements

Same TinyMCE asset requirements as `aiux-control-html-editor` (loaded lazily by the nested editor).

### SSR

Server-safe: the picker-click handler bails out under `isServer`, and layout rendering does not touch `window`/`document`.

### Lifecycle

Same deferred TinyMCE activation as `aiux-control-html-editor`, since the editor is a real nested instance of that component.

### Sizing and layout

Editor and picker render side by side (roughly 60/40) using CSS flex-wrap; the pair wraps onto stacked rows when the host is too narrow to fit both, with no `ResizeObserver` involved. This split is independent of `fieldLayout`, which only affects label positioning.

Gotcha: the picker column's pixel height is not simply the raw `height` attribute — it is the same clamped value the editor itself resolves to (floored by `minHeight`/`minLineCount`, capped by `maxHeight`, with extra room reserved when `resizable` adds a status bar). Changing `minHeight` or `maxHeight` alone, without touching `height`, can therefore still shift how tall the picker renders, since both derive from the same calculation.

## Accessibility, localization, and customization

Inherits all rich-text accessibility and localization behavior from the nested `aiux-control-html-editor` (see that control's doc: `role="textbox"`, ARIA label composition, Alt+F10/Escape toolbar navigation, hard-coded English instructional strings via `@lit/localize`). The picker's own label ("Select Variables") is localized via `@lit/localize` `msg()` and is not host-settable. No additional `::part()`/CSS custom property styling surface beyond what the nested editor and picker expose themselves.
