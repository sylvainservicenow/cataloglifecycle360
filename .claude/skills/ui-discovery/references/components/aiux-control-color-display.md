# aiux-control-color-display

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-color-display.md`

A display-only color swatch. The host sets `displayValue` (or `value`) to a Glide-style CSS declaration string, e.g. `"background-color:#3ED662"`; the control extracts the value after the colon and paints it as the background of a fixed-size box. This is a real, independently-registered custom element — `@customElement('aiux-control-color-display')` — not an inline template.

Built in: parsing the `property:value` string (splitting on `:`, trimming, stripping a trailing `;`), and the accessible `role="img"`/`aria-label` fallback. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
// complete host component
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyColorSwatch extends AIUXElement {
  static properties = {
    colorStyle: {type: String}
  };

  render() {
    return html`
      <aiux-control-color-display
        name="status_color"
        label="Status color"
        .displayValue=${this.colorStyle ?? ''}
      ></aiux-control-color-display>
    `;
  }
}
```

**What happens:** the box's background is set to whatever appears after the colon in `displayValue` (falling back to `value` if `displayValue` is empty). Nothing is dispatched — this control never mutates its own state or fires events. The parsing is a plain string split on the first `:` with no CSS validation: if the declaration's value half isn't a color the browser recognizes (a typo, a stray token, an empty string after trimming), `backgroundColor` is set to that invalid string, the browser silently ignores it, and the box renders with no background at all — while the `aria-label` still announces the garbage text as if it were a real color, because the label is built from the parsed string, not from whether the browser actually accepted it.

### Additional patterns

If the field's raw value already stores the whole declaration (no separate display value from the server), pass it as `value` instead:

```js
html`<aiux-control-color-display
  value="background-color:red;"
></aiux-control-color-display>`;
```

Always pass `label` even when the swatch sits in a context where a visible label would be redundant (e.g. a table cell). The `aria-label` is built by concatenating `label` with `": <color>"`, so an empty `label` produces an aria-label that is literally `": #3ED662"` — a leading colon with no field name, which is confusing when read by assistive technology:

```js
html`<aiux-control-color-display
  label="Status color"
  .displayValue=${this.colorStyle}
></aiux-control-color-display>`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `displayValue` | `displayvalue` | `string` | `''` | Reactive; re-renders on change | The Glide-style declaration string to parse and render, e.g. `"background-color:#3ED662"`. Takes precedence over `value` when non-empty. |
| `value` | `value` (reflected) | `string` | `''` | Reactive | Fallback source for the same declaration string when `displayValue` is empty. This field is always treated as read-only by the host convention this control was built for, but the control itself does not enforce that — see Accessibility below. |
| `label` | `label` | `string` | `''` | Reactive | Field label text; also appended to the swatch's `aria-label` when a color is present. |
| `name` | `name` | `string` | `''` | Reactive | Field name. Not read by this control's own render logic beyond identity; used by the shared layout/messages plumbing. |
| `readonly`, `disabled`, `required`, `invalid`, `nowId`, `controlStyles`, `placeholder`, `autofocus`, `labelUrl`, `labelUrlTarget`, `helperText` | see `aiux-control-color` doc for exact attribute names | — | — | Reactive | Inherited identity properties from the shared control base. None of them are read by this control's `render()` — the swatch always paints regardless of `disabled`/`readonly`/`invalid`, and no validation or focus styling is applied. |
| `fieldLayout`, `variant`, `optional`, `helperContent`, `hideRequiredIndicator`, `wrapLabel`, `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `fieldContextMenu` | see `aiux-control-color` doc for exact attribute names | — | — | Reactive | Inherited form-field layout properties, all forwarded to `renderWithLayout()` — label, helper text, messages, and badges render normally around the swatch. |
| `nowAssistConfig`, `referringRecordId`, `referringTable`, `formData` | see `aiux-control-color` doc | — | — | Reactive | Inherited NACM/form-context properties. Not currently used — this control has no editable surface for NACM to attach to. |

### Events

None. This control does not call `dispatchAction`/`dispatchEvent` anywhere in its implementation — it is purely a rendered view of its properties.

### Slots

None.

### Methods

None beyond the inherited `focus()` and `reset()`. The base `focus()` implementation delegates to a queried `<input>`/`<textarea>` inside the control's shadow root; since this control's template renders neither, that query resolves to nothing and `focus()` is a no-op — it does not move focus anywhere. `reset()` resets identity/layout state; it has no visible effect since this control has no editable state of its own.

## Integration details

No additional requirements.

### Platform requirements

None — parsing is plain string splitting with no DOM/browser API calls.

### SSR

SSR-safe. `render()` only calls `styleMap()` and string operations; no `window`/`document` access.

### Lifecycle

Purely reactive to property changes — there is no `firstUpdated`/`willUpdate` override in this control.

### Sizing and layout

Renders a `div.aiux-input.aiux-input-md.w-full` (the same box classes as the shared text-input styling) so it lines up with editable fields in the same form, but with no border/input chrome logic of its own — coloring comes entirely from the inline `background-color` style.

## Accessibility, localization, and customization

The swatch box has `role="img"` and an `aria-label` combining `label` with the extracted color value (e.g. `"Status color: #3ED662"`), or just `label` when no color is present — this is the only way the color is exposed to assistive technology, since the box has no visible text. `label` and `helperContent` are host-supplied strings and are not translated by the control. There is no keyboard interaction surface: the element is not focusable and has no interactive parts. Styling is entirely inline (`background-color` from the parsed value); there are no CSS custom properties, `::part()`, or slots exposed for further customization.
