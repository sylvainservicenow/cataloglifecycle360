# aiux-control-wiki-text-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-wiki-text-connected.md`

A form-field control for wiki-markup text. The host sets `value` (the raw wiki markup) and standard form-field metadata; the control POSTs the markup to the platform's `WikiHelperAjax` `wikiToHTML` endpoint to render a sanitized HTML preview, and reports edits back via its own value-changed events. It supports three rendering modes: a default preview-plus-edit-modal, an inline textarea (no modal), and a dual-pane modal with a side-by-side live preview.

Built in: server-side wiki-to-HTML sanitization with request cancellation (aborts a stale request when a newer one starts), a preview area with loading/empty states, and an accessible edit modal (or inline textarea) with ARIA wiring. Do not hand-roll a wiki-text preview or fetch the sanitize endpoint yourself — use this element.

**Value ownership.** The control commits an edit by dispatching `VALUE_CHANGED` with the new text; it does not wait for you to write it back before showing the result — it already re-sanitizes and repaints its own preview from the committed text immediately after dispatch. Write the same string back into the property bound to `.value` anyway, because the control tracks the exact string it last self-committed (`_lastDispatchedValue`) and skips a redundant re-sanitize the next time your render passes that same string back in. If you instead push back a *different* string — a server-normalized version, a value from an unrelated refresh, anything that doesn't match verbatim — the control treats it as a fresh external edit: it immediately re-fetches and re-sanitizes, visibly replacing the preview the user just produced. Pushing back a stale or substituted `value` after commit is the single easiest way to make the preview appear to "flicker back."

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

class KbArticleBody extends AIUXElement {
  static properties = {
    articleText: {type: String},
    _saveError: {type: String, state: true}
  };

  render() {
    return html`
      <aiux-control-wiki-text-connected
        name="text"
        label="Article body"
        helper-content="Wiki markup — [[links]], *bold*, lists"
        .value=${this.articleText ?? ''}
        @AIUX_CONTROL_WIKI_TEXT#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-wiki-text-connected>
      ${this._saveError ? html`<p class="text-error">${this._saveError}</p>` : ''}
    `;
  }

  _onValueChanged(e) {
    const {value, error} = e.detail;
    // error is only set when the sanitize fetch itself threw (e.g. aborted
    // mid-flight or network failure) — an HTTP error status from the
    // endpoint is swallowed internally (console.warn only) and never
    // reaches this handler.
    if (error) {
      this._saveError = error.message;
      return;
    }
    this._saveError = undefined;
    this.articleText = value; // echo back verbatim so the control doesn't re-fetch
  }
}
```

**What happens:** in default mode, the control shows a sanitized HTML preview plus an "Edit text" button. Clicking it snapshots the current `value` into modal-local staged state and opens the modal; typing in the modal textarea only updates that staged state — no event is dispatched while the modal is open. Clicking Submit closes the modal, dispatches `AIUX_CONTROL_WIKI_TEXT#VALUE_CHANGED` with the staged text, records that string as "self-committed," and immediately kicks off its own sanitize request to repaint the preview — it does not wait for the host to re-render with the new `value` first. When the host's next render then passes that same string back in, the control recognizes it as the value it just committed and skips re-sanitizing a second time; passing back anything else (a different string, or the pre-edit value because the host ignored the event) is treated as an external change and triggers another fetch, visibly replacing whatever the control was already showing.

### Additional patterns

Inline editing (a plain textarea in place of the preview/modal, with staged-change events on every keystroke):

```js
html`
  <aiux-control-wiki-text-connected
    inline-mode
    name="notes"
    label="Notes"
    .value=${this.notes}
    @AIUX_CONTROL_WIKI_TEXT#STAGED_VALUE_CHANGED=${e => console.log('typing', e.detail.value)}
    @AIUX_CONTROL_WIKI_TEXT#VALUE_CHANGED=${e => (this.notes = e.detail.value)}
  ></aiux-control-wiki-text-connected>
`;
```

Dual-pane editing (textarea and live sanitized preview side by side inside the modal, with a manual "Refresh preview" button):

```js
html`<aiux-control-wiki-text-connected dual-mode name="notes" label="Notes" .value=${this.notes}></aiux-control-wiki-text-connected>`;
```

Custom ARIA labeling that overrides the label/name-derived defaults:

```js
html`<aiux-control-wiki-text-connected
  name="notes"
  .value=${this.notes}
  .configAria=${{'aria-label': 'Release notes'}}
></aiux-control-wiki-text-connected>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | String | `''` | Reactive; triggers a re-sanitize of the preview when changed externally (except in `inlineMode`, and skipped for a value the control just committed itself). | The raw wiki-markup text. |
| `dualMode` | `dual-mode` | Boolean | `false` | Reactive. | Shows a side-by-side live preview pane inside the edit modal. |
| `inlineMode` | `inline-mode` | Boolean | `false` | Reactive. | Renders a direct textarea instead of the preview+modal UI (still shows the read-only preview when combined with `readonly`). |
| `configAria` | `config-aria` | Object (`{'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?}`) | `{}` | Reactive. | Overrides the control's derived ARIA attributes on the textarea/preview. |
| `placeholder` | `placeholder` | String | `''` | Reactive. | Placeholder for the textarea; falls back to a localized "Enter wiki text..." when empty. |
| `autofocus` | `autofocus` | Boolean | `false` | Reactive; checked once in `firstUpdated()`. | Calls `focus()` on first render. |
| `readonly` | `readonly` (reflect) | Boolean | `false` | Reactive. | Hides the edit button/modal and shows only the preview. |
| `disabled` | `disabled` (reflect) | Boolean | `false` | Reactive. | Disables the edit button and inline textarea. |
| `label` | `label` | String | `''` | Reactive. | Field label; also used in the modal header and edit-button ARIA label. |
| `labelUrl` | `label-url` | String | `undefined` | Reactive. | Makes the label a link to this URL. |
| `labelUrlTarget` | `label-url-target` | String | `'_blank'` | Reactive. | `target` for the label link. |
| `name` | `name` | String | `''` | Reactive. | Field name; sent as `sysparm_value` to the sanitize endpoint and included in event `detail`. |
| `required` | `required` (reflect) | Boolean | `false` | Reactive. | Adds a "required" ARIA/label suffix and native `required` on the textarea. |
| `invalid` | `invalid` (reflect) | Boolean | `false` | Reactive. | Reflected to `aria-invalid` on the textarea(s). |
| `nowId` | `now-id` | String | `''` | Reactive. | Identifier used for ARIA wiring instead of `name`. |
| `controlStyles` | `control-styles` | String | `''` | Reactive. | Raw CSS declarations forwarded to the control's inner content (inherited; not targeted by a specific element in this control's own render methods). |
| `fieldLayout` | `fieldLayout` | Object | `{layout: 'auto'}` | Reactive. | `{layout: 'vertical' \| 'horizontal' \| 'auto', columns?}`. |
| `optional` | `optional` | Boolean | `false` | Reactive. | Shows an "optional" label suffix instead of a required indicator. |
| `helperContent` | `helper-content` | String | `''` | Reactive. | Helper text rendered below the field. |
| `helperText` | `helpertext` | String | `''` | Reactive. | Additional helper text (inherited from the control base). |
| `hideRequiredIndicator` | `hide-required-indicator` | Boolean | `false` | Reactive. | Suppresses the required indicator even when `required` is set. |
| `wrapLabel` | `wrap-label` | Boolean | `false` | Reactive. | Allows the label to wrap instead of truncating. |
| `messages` | `messages` (property) | Array | `[]` | Reactive. | Field messages, surfaced via `aria-describedby` on the textarea(s). |
| `decorations` | `decorations` (property) | Array | `[]` | Reactive. | Label decorations (icons/badges). |
| `decorationWidgets` | `decorationWidgets` (property) | Array | `[]` | Reactive. | Widget tags rendered in the addon area. |
| `highlightedValue` | `highlightedValue` (property) | Array | `[]` | Reactive. | Status badges rendered at the label end when the value matches an entry. |
| `showAIIndicator` | `show-ai-indicator` | Boolean | `false` | Reactive. | Shows the AI-generated-content indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | Boolean | `false` | Reactive. | Shows the unsaved-change indicator. |
| `editMode` | `edit-mode` (reflect) | String | `'default'` | Reactive. | `'default' \| 'inline' \| 'display-only'`. |
| `variant` | `variant` (reflect) | String | `'default'` | Reactive. | `'default' \| 'compact'` visual density. |
| `nowAssistConfig` | `nowAssistConfig` (property) | Object | `undefined` | Not currently used. | Inherited NACM configuration property; this control does not render a NACM surface or read it anywhere in its own source. |
| `referringRecordId` | `referring-record-id` | String | `''` | Not currently used. | Inherited; not read anywhere in this control's source. |
| `referringTable` | `referring-table` | String | `''` | Not currently used. | Inherited; not read anywhere in this control's source. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_WIKI_TEXT#STAGED_VALUE_CHANGED` | `{name, value}` | bubbles, composed, cancelable | On every `input` event in the **inline-mode** textarea only — not debounced, one dispatch per keystroke. | Never dispatched in default or dual (modal) mode: the modal textarea's `@input` handler only writes to internal `_stagedValue`, with no event at all until Submit is clicked. |
| `AIUX_CONTROL_WIKI_TEXT#VALUE_CHANGED` | `{name, value, error?}` | bubbles, composed, cancelable | Dispatched in exactly three situations: (1) the modal's Submit button is clicked — `value` is the staged modal text; (2) the inline textarea fires its native `change` (on blur, after an actual edit); (3) a sanitize fetch throws (network failure, or any `DOMException` other than `AbortError`) — `value` falls back to whatever staged text exists, or the current `value`. | `error` (`{type: 'error', message: 'Unable to load. Try refreshing the page.'}`) is set **only** in case 3, and only for a thrown exception. An HTTP response that comes back non-OK is handled separately — it only `console.warn`s and resets the loading flags, it never populates `error` or dispatches this event at all. A request superseded by a newer one (`AbortError`) also dispatches nothing. Closing the modal with Cancel never dispatches this event, since `_handleCloseModal` just discards the staged text. |

No `control-focus`, `control-blur`, or `invalid-set` events are dispatched by this control.

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the inline textarea if present, otherwise the "Edit text" button. No-op if neither is in the DOM. |
| `reset()` | Inherited from the control base: clears `value` and internal staged/touched/error state back to defaults. Does not clear the sanitized preview cache. |

## Integration details

### Platform requirements

Requires a same-origin `/xmlhttp.do` endpoint that accepts `sysparm_processor=WikiHelperAjax`, `sysparm_name=wikiToHTML` POST requests and returns an `<xml answer="...">` document — i.e. a ServiceNow instance context. Outside that context, sanitization requests fail and the preview stays empty (or shows the fetch-error message on submit).

### SSR

The default and dual-mode preview/modal render paths are plain Lit templates and are SSR-safe. The wiki-to-HTML sanitize fetch itself only runs from lifecycle hooks (`firstUpdated`/`updated`), not from `render()`, so it does not run during SSR.

### Lifecycle

On `firstUpdated()`, if `autofocus` is set the control calls `focus()`; if `value` is non-empty and the control isn't in non-readonly inline mode, it immediately sanitizes `value` for the initial preview. On `disconnectedCallback()`, any in-flight sanitize fetch (main or refresh) is aborted.

Subsequent external `value` changes only ever trigger a re-sanitize through `updated()`, and that hook bails out unconditionally whenever `inlineMode` is true — including when `readonly` is also true. A readonly + `inline-mode` field (which renders the preview, not a textarea, per the table above) therefore sanitizes its initial `value` exactly once in `firstUpdated()` and then never again: if the host swaps in a new `value` later for the same field instance, the preview silently keeps showing the old content. Toggling `inlineMode` off (or recreating the element) is the only way to force a resync in that combination.

### Sizing and layout

The modal renders at `size="lg"` with a minimum content height of `16rem` (`min-h-64`); in `dualMode` the textarea and preview panes split into a two-column grid.

## Accessibility, localization, and customization

The edit button carries `aria-haspopup="dialog"` and `aria-expanded`; the modal is an `<aiux-modal>` (its own dialog semantics apply). Both the inline and modal textareas compute `aria-label`/`aria-labelledby`/`aria-describedby` from `label`, `name`, and `messages`, overridable via `configAria`. The read-only preview area has `role="document"` and `tabindex="0"` so it's keyboard-focusable and announced as a document region; a screen-reader-only label is added in readonly mode. No custom keyboard shortcuts are added beyond native textarea/button/dialog behavior.

User-facing strings ("Edit text", "Enter wiki text...", "Submit", "Cancel", "Refresh preview", the sanitize-failure message, and the "required" suffix) are all produced through `@lit/localize`'s `msg()` and are localized automatically. Host-supplied strings (`label`, `placeholder`, `helperContent`, `messages`, `configAria` values) are rendered as given.

Styling hooks: `controlStyles` (raw CSS, inherited from the control base). There are no exposed slots or `::part()` selectors; the sanitized HTML preview itself is rendered via `unsafeHTML` after the server-side sanitize pass, so its markup reflects whatever the `wikiToHTML` endpoint returns.
