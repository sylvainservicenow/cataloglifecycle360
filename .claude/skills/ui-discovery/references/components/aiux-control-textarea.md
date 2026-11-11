# aiux-control-textarea

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-textarea.md`

A form-field control for a multi-line text value. It wraps a native `<textarea>` with autoresize, a character counter, a caret-anchored slot for inline AI insertion UI, and (optionally) a modal that pretty-prints the value as XML for viewing/editing.

Built in: content-driven autoresize (native CSS `field-sizing`, no imperative JS sizing), a live character counter tied to `maxlength`, XML parse/format/edit via a modal code editor, and dynamic-translation icon/panel wiring. Do not reimplement autoresize, character counting, or XML pretty-printing yourself — configure this control instead.

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
      <aiux-control-textarea
        name="description"
        label="Description"
        .value=${this.description ?? ''}
        rows="4"
        @AIUX_CONTROL_TEXTAREA#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-textarea>
    `;
  }

  _onCommit(e) {
    const {value} = e.detail;
    this.description = value;
  }
}
```

**What happens:** typing updates the element's own `value` on every keystroke and, after `debounceLength` (default 250ms) of no further typing, dispatches `AIUX_CONTROL_TEXTAREA#STAGED_VALUE_CHANGED`. On blur (when not `disabled`/`readonly`), it dispatches `AIUX_CONTROL_TEXTAREA#VALUE_CHANGED` with the committed value. Neither event name matches the generic `value-changed`/`staged-value-changed` strings used elsewhere in the codebase — always listen for the `AIUX_CONTROL_TEXTAREA#…` names shown above.

### Additional patterns

Content-driven autoresize capped at 8 rows, with the drag handle disabled — set as properties rather than attributes, since Lit's default attribute for a camelCase property is the plain lowercased name (`autoresizerowslimit`, `sizerenabled`), not a hyphenated one:

```js
html`<aiux-control-textarea
  name="notes"
  label="Notes"
  value=${this.notes}
  autoresize
  rows="3"
  .autoresizeRowsLimit=${8}
  .sizerEnabled=${false}
></aiux-control-textarea>`;
```

A character counter with a hard limit:

```js
html`<aiux-control-textarea
  name="summary"
  label="Summary"
  value=${this.summary}
  maxlength="500"
  showcounter
></aiux-control-textarea>`;
```

An XML value with a "View as XML" affordance next to the label:

```js
html`<aiux-control-textarea
  name="payload"
  label="Payload"
  value=${this.payload}
  show-xml-view
></aiux-control-textarea>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `autoresize` | `autoresize` | `boolean` | `false` | Read in `render()`/`getTextareaStyle()`. | Grows the textarea to fit its content via CSS `field-sizing: content`, floored at `rows` lines. |
| `disableMinHeight` | `disableminheight` | `boolean` | `false` | Read in `getAdditionalClasses()`. | Removes the `rows`-based minimum height floor. |
| `showCounter` | `showcounter` | `boolean` | `false` | Read in `render()`. | Shows a live "Characters left" counter below the field. While `true`, the native `maxlength` attribute is **not** applied to the `<textarea>` (the browser no longer truncates input), so the counter can go negative. |
| `rows` | `rows` | `number` | `2` | Bound to the native `.rows` property. | Visible row count / autoresize floor. |
| `maxlength` | `maxlength` | `number` | `0` | Read on input/blur to compute the counter; forwarded as the native `maxlength` attribute only when `showCounter` is `false`. | Maximum character length. `0` means no limit. |
| `minlength` | `minlength` | `number` | `0` | Forwarded to the native `minlength` attribute (`0` omits it). | Minimum character length. |
| `cols` | `cols` | `number \| undefined` | `undefined` | Forwarded to the native `cols` attribute. | Visible column width. |
| `height` | `height` | `number` | `0` | Applied as an inline `height` (px) style; `controlStyles` values override it if they also set `height`. | Fixed pixel height. |
| `resize` | `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Read in `getAdditionalClasses()`. | Which directions the user can drag-resize the textarea. Ignored (`'none'`) when `sizerEnabled` is `false`. |
| `sizerEnabled` | `sizerenabled` | `boolean` | `true` | Read in `getAdditionalClasses()`. | Master switch for the drag-resize handle; `false` forces no resize handle regardless of `resize`. |
| `dynamicTranslationEnabled` | `dynamic-translation-enabled` | `boolean` | `false` | Checked once, the first time it becomes `true`, in `updated()` — not re-checked on later reconnects. | Enables a translate icon and translated-text panel for the field, driven by `referringTable`/`referringRecordId`/`name`. |
| `enableCaretSlot` | `enablecaretslot` | `boolean` | `false` | Read in `render()`/`handleInput()`. | Exposes a `caret` slot for inline UI (e.g. an AI suggestion chip) anchored near the caret. Disabled whenever the field is `disabled` or `readonly`. |
| `disableMaxHeight` | `disablemaxheight` | `boolean` | `false` | Read in `getTextareaStyle()`. | Removes the autoresize height cap entirely (textarea grows unbounded with content). |
| `debounceLength` | `debouncelength` | `number` | `250` | Read once, at construction, to build the input debounce wrapper. | Milliseconds to wait after typing stops before dispatching `STAGED_VALUE_CHANGED`. Changing this property after the element is constructed does not change the already-created debounce delay. |
| `debounceCaretLength` | `debouncecaretlength` | `number` | `800` | Read once, at construction, to build the caret-slot debounce wrapper. | Milliseconds used by the caret-slot repositioning debounce. Same construction-time caveat as `debounceLength` applies. |
| `autoresizeRowsLimit` | `autoresizerowslimit` | `number` | `0` | Read in `getTextareaStyle()`. | Row cap for autoresize growth. Only takes effect when greater than `rows`; otherwise a built-in 16-row cap applies (unless `disableMaxHeight` is set). |
| `showXmlView` | `show-xml-view` | `boolean` | `false` | Read in `renderLabelInlineContent()`/`renderContent()`. | Adds a "View as XML" icon button next to the label that opens a read/edit modal pretty-printing `value` as XML. |

Also inherited from the shared control base (`AIUXControlElement`/`ControlIdentityBase`): `value` (reflects), `placeholder`, `autofocus`, `readonly` (reflects), `disabled` (reflects), `label`, `labelUrl`/`labelUrlTarget`, `name`, `required` (reflects), `invalid` (reflects), `nowId` (attribute `now-id`), `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator` (attribute `show-ai-indicator`), `showUnsavedIndicator` (attribute `show-unsaved-indicator`), `editMode` (attribute `edit-mode`, reflects), `variant` (reflects), `nowAssistConfig`, `referringRecordId` (attribute `referring-record-id`), `referringTable` (attribute `referring-table`), `formData`, `fieldContextMenu`, `helperText`.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TEXTAREA#STAGED_VALUE_CHANGED` | `{data: string \| null, fieldValue: string}` | `bubbles: true, composed: true, cancelable: true` | The user types, debounced by `debounceLength` (default 250ms). | `data` is the native `InputEvent.data` for the keystroke (may be `null`, e.g. on deletion). Neither `name` nor `value` is part of this detail — only `data` and `fieldValue`. |
| `AIUX_CONTROL_TEXTAREA#VALUE_CHANGED` | `{name: string, value: string, fieldValue: string}` | `bubbles: true, composed: true, cancelable: true` | The field is blurred (and not `disabled`/`readonly`); the host "Update field" action in the XML view modal is used; or a Now Assist (NACM) insertion completes. | `value` and `fieldValue` are always equal — there is no separate display formatting for textarea. Does not fire on blur if `disabled` or `readonly`. |

### Slots

| Slot | Description |
| --- | --- |
| `caret` | Rendered whenever `enableCaretSlot` is `true` (not additionally gated by `disabled`/`readonly`). Intended to anchor inline UI near the caret. Note: while typing, if the field is not `disabled`/`readonly`, the implementation hides this slot's container (`inset-inline-start: -9999px`) on every keystroke and never repositions it back on-screen after the debounce — verify placement before relying on it for visible anchored UI. |

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Inherited from `AIUXControlElement`; focuses the underlying `<textarea>`. |
| `reset(): void` | Inherited from `AIUXControlElement`; clears `value`/`stagedValue`/`invalid`/touched/error state back to defaults. |

### Data shapes

`TextareaStagedValueChangedDetail`:

| Property | Type | Description |
| --- | --- | --- |
| `data` | `string \| null` | The native `InputEvent.data` for the triggering keystroke. |
| `fieldValue` | `string` | The full current textarea value. |

`TextareaValueChangedDetail`:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Field name. |
| `value` | `string` | The committed value (same as `fieldValue`). |
| `fieldValue` | `string` | The committed value. |

## Integration details

### Platform requirements

None beyond `@servicenow/aiux-components-control` itself. This component eagerly imports the modal (`../modal`) and `@servicenow/aiux-components-code-editor` custom elements it uses for `showXmlView`, so no separate host import is needed to use that feature.

A separate, internal content-insertion action (used by inline AI-suggestion chips placed in the `caret` slot) splices text into the textarea at the current caret position and then dispatches a synthetic native `input` event — it does not dispatch `AIUX_CONTROL_TEXTAREA#VALUE_CHANGED` itself. That synthetic `input` event runs through the same debounced path as typing, so it produces `AIUX_CONTROL_TEXTAREA#STAGED_VALUE_CHANGED` after `debounceLength`, and the committed `VALUE_CHANGED` only follows on a later blur. It is a no-op during SSR, and when the field is `readonly` or `disabled`.

### SSR

Server-safe: `isServer` guards the caret-insertion helper and the XML-parsing helper (`DOMParser` is browser-only, so any XML parse attempted during SSR reports invalid — real parsing happens client-side after hydration, only when the "View as XML" button is actually clicked).

### Lifecycle

`connectedCallback()` initializes the character counter from `maxlength`/`value`. `firstUpdated()` focuses the textarea (next animation frame) when `autofocus` is set.

### Sizing and layout

`rows` sets the initial/minimum visible height; with `autoresize`, height then grows with content up to `autoresizeRowsLimit` (or a 16-row default cap), or unbounded if `disableMaxHeight` is set. `resize`/`sizerEnabled` control the native drag-resize handle independently of autoresize. Autoresize relies on CSS `field-sizing: content` (Chrome 123+, Safari 17.4+, Firefox 135+); on unsupported browsers the textarea simply does not autosize.

## Accessibility, localization, and customization

- **Accessibility:** the native `<textarea>` gets `aria-required`, `aria-invalid`, and, when applicable, `aria-describedby` pointing at visible messages and/or the character counter, whose live region uses `aria-live="polite"` normally and `aria-live="assertive"` once the limit is exceeded.
- **Localization:** the character counter text ("Characters left: N" / "Maximum length exceeded. Characters left: N"), the "View as XML" button tooltip/label, the modal title suffix "(XML view)", the "This value is not valid XML." error, and the "Update field" button are all localized via `@lit/localize` `msg()` — not host-settable strings.
- **Customization:** styling follows DaisyUI/Tailwind `aiux-textarea` classes plus `controlStyles` (attribute `control-styles`) for text-affecting inline overrides; autoresize sizing is driven by the CSS custom properties `--textarea-rows` and `--textarea-rows-limit`. No `::part()` styling surface is exposed.
