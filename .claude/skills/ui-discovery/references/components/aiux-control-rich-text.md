# aiux-control-rich-text

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-rich-text.md`

A read-only content display for HTML strings. The host sets `value` (a raw HTML string, e.g. from an `html-editor` field) and the control sanitizes it and renders it as markup; it reports nothing back — there is no edit surface and no events. It is not a form-field control: it does not extend the shared control base and has none of the label/messages/validation machinery that editable controls have. It is also `aiux-control-html-editor`'s own readonly-mode delegate — when an `html`/`translated_html` field renders in `DISPLAY_ONLY` or `INLINE` display mode, the HTML editor hands its value and `controlStyles` straight to this element, so anything you learn here (the sanitizer, the height cap, the empty-state text) applies to a readonly rich-text field rendered through `createFormControl` as well as to one you mount directly.

Built in: an allowlist-based HTML sanitizer (strips scripts, iframes, event handlers, and any tag/attribute not on its allowlist; forces `target="_blank" rel="noopener noreferrer"` on links) and an empty-state placeholder. Do not render untrusted HTML yourself with `unsafeHTML` — use this element so the sanitization pass is applied. The sanitizer re-runs on every render (it is not cached or memoized against the previous `value`), so re-rendering this element with a large, unchanged HTML string still re-sanitizes it from scratch each time — keep `value` stable (same reference/content) rather than rebuilding the string on unrelated parent re-renders if the content is large.

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

class IncidentActivityPanel extends AIUXElement {
  static properties = {
    closeNotesHtml: {type: String}
  };

  render() {
    return html`
      <label for="close-notes">Close notes</label>
      <aiux-control-rich-text
        name="close-notes"
        .value=${this.closeNotesHtml ?? ''}
      ></aiux-control-rich-text>
    `;
  }
}
```

**What happens:** on first render, if `this.closeNotesHtml` is empty (the record has no close notes yet), the control short-circuits and renders only the `emptyText` placeholder — none of the sanitizer or container markup is produced. Once a value is present, every render re-sanitizes it (stripping `<script>`, `<iframe>`, inline event handlers, and any tag or attribute outside the allowlist, and rewriting link targets to open safely) and injects the result with `unsafeHTML` inside a container capped at 200px tall; content past that height scrolls on both axes and the container becomes keyboard-focusable so the scroll is reachable without a mouse. Because `name` here matches the external `<label>`'s `for`-equivalent `id`, clicking the label moves focus to the scroll container rather than doing nothing.

### Additional patterns

Removing the height cap so the container grows with its content instead of scrolling — useful when this element sits inside a page that already scrolls, so content doesn't end up double-scrolling:

```js
html`<aiux-control-rich-text .value=${this.closeNotesHtml} height="0"></aiux-control-rich-text>`;
```

Custom empty-state text:

```js
html`<aiux-control-rich-text .value=${this.closeNotesHtml} empty-text="No close notes provided"></aiux-control-rich-text>`;
```

Letting a readonly `html-editor` field's styling carry through automatically — this is exactly what `createFormControl` does internally, so if you drive the same field through both an editable `aiux-control-html-editor` and this element (e.g. switching into a `DISPLAY_ONLY` view), pass the same `controlStyles` string to both so the readonly rendering matches the editable one pixel-for-pixel:

```js
html`<aiux-control-rich-text .value=${this.closeNotesHtml} control-styles=${this.fieldControlStyles}></aiux-control-rich-text>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | String | `''` | Reactive; re-sanitizes and re-renders on every change. | Raw HTML string to display. |
| `emptyText` | `empty-text` | String | `'—'` (em dash) | Reactive. | Text shown in place of content when `value` is empty. |
| `height` | `height` | Number | `200` | Reactive. | Max height (px) of the content container; `0` removes the cap and lets the container grow unconstrained. When set, also makes the container keyboard-focusable (`tabindex="0"`) so its internal scrolling is reachable by keyboard. |
| `name` | `name` | String | `''` | Reactive. | Sets the content container's `id`, for a parent `<label for="...">` to reference. |
| `controlStyles` | `control-styles` | String | `''` | Reactive. | Raw CSS declarations (parsed and merged with the height-derived `max-height`) applied to the content container. |

This control does **not** inherit `label`, `placeholder`, `readonly`, `disabled`, `required`, `invalid`, `messages`, `helperContent`, or any other `ControlIdentityBase`/`AIUXControlElement` property — it extends `AIUXElement` directly, not the control base classes used by editable form fields.

### Events

None. This control dispatches no custom events.

### Slots

None.

### Methods

None beyond the inherited native `HTMLElement.focus()`; the control does not override `focus()`, since it has no interactive/editable surface to move focus into.

## Integration details

No additional requirements.

### Platform requirements

None. The sanitizer runs entirely client-side (`sanitize-html`) with no network or ServiceNow-instance dependency.

### SSR

SSR-safe: `render()` does not touch `window`/`document`, and the sanitizer explicitly disables `sanitize-html`'s style-attribute reformatting (`parseStyleAttributes: false`) specifically so its output is byte-identical between server and browser bundles, avoiding an SSR hydration mismatch for this control.

### Lifecycle

No lifecycle hooks beyond the inherited defaults; sanitization happens synchronously inside `render()` on every render, not cached.

### Sizing and layout

Renders a single content container; `height` (px) sets its `max-height` (scrolling both axes past that point) unless `height` is `0`, in which case no `max-height` is set and the container grows with its content.

## Accessibility, localization, and customization

When `height` is set, the content container gets `tabindex="0"` so a sighted keyboard user can scroll it; there is no other built-in keyboard handling, since the content is plain rendered markup, not an interactive widget. `name` sets the container's `id` for external `<label for>` association, but the control renders no `<label>` itself.

`emptyText` defaults to a hard-coded em dash (`'—'`) — it is not localized by the control and must be supplied pre-translated by the host if a different empty-state string is needed. The `value` HTML is rendered as-is (after sanitization); any localization of its content is the host's responsibility.

Styling hooks: `controlStyles` (raw CSS merged onto the content container's `style`, alongside the `height`-derived `max-height`). There are no exposed slots or `::part()` selectors.
