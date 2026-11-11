# aiux-control-annotation

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-annotation.md`

`<aiux-control-annotation>` is a read-only, display-only block for a ServiceNow annotation field. The host sets `value` (plain text or HTML) and `annotationType`; the component renders it as a styled callout, a horizontal separator, or a section header, and auto-collapses long content behind a "Show More"/"Show Less" toggle. It has no editable surface: it never dispatches `value-changed` or any other event, and it does not extend the shared `AIUXControlElement` form-control base — it renders straight from `@servicenow/aiux-components-core`'s `AIUXElement`.

Built in: HTML sanitization of `value` before render (consistently on both server and client — see Integration details below), automatic overflow detection via `ResizeObserver` with a 60px height threshold that triggers a "Show More"/"Show Less" toggle, and `fieldLayout: 'auto'` width-based horizontal/vertical resolution at a 480px breakpoint. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class IncidentNotice extends AIUXElement {
  render() {
    return html`
      <aiux-control-annotation
        .annotationType=${'important'}
        value="This incident is linked to a major outage. Do not close without approval."
      ></aiux-control-annotation>
    `;
  }
}

customElements.define('incident-notice', IncidentNotice);
```

**What happens:** the text renders inside a red-bordered, red-tinted callout with a leading info icon. Nothing is dispatched back to the host — there is no user-editable state, and the control never mutates `value`.

### Additional patterns

A plain visual separator, with no text and no icon:

```js
html`<aiux-control-annotation .annotationType=${'lineSeparator'}></aiux-control-annotation>`;
```

A section header block, rendered bold on a muted background:

```js
html`
  <aiux-control-annotation
    .annotationType=${'sectionDetails'}
    value="Approval details"
    .isPlainText=${true}
  ></aiux-control-annotation>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Sanitized and rendered via `unsafeHTML()` on every render, identically on server and client; an empty value suppresses the leading icon | The annotation's content. Plain text or HTML, depending on `isPlainText`. |
| `annotationType` | `annotationtype` | `AnnotationType` (`'info' \| 'important' \| 'lineSeparator' \| 'sectionSeparator' \| 'sectionDetails'`) | `undefined` | Selects the callout's border/background color (`info`/`important`), whether a `<hr>` separator renders instead of/alongside content (`lineSeparator`/`sectionSeparator`), and whether the block uses the bold/compact "section" styling (`sectionSeparator`/`sectionDetails`) | The annotation's visual/semantic kind. With no value set, the block renders as a plain, unstyled container. |
| `isPlainText` | `isplaintext` | `boolean` | `false` | When `true`, `value` is inserted as literal text (Lit auto-escapes it) instead of going through the sanitizer and `unsafeHTML` | Treats `value` as plain text rather than HTML. |
| `fieldLayout` | `fieldlayout` | `FieldLayout` (`{layout?: 'vertical' \| 'horizontal' \| 'auto'; columns?: string[]}`) | `{layout: 'auto'}` | `'auto'` (or omitting `layout`) measures the host element's own width via `ResizeObserver` and resolves to `'horizontal'` at or above 480px, `'vertical'` below it; an explicit `'horizontal'`/`'vertical'` skips measurement entirely. Horizontal layout only applies when `annotationType` is not one of the separator types — separators are always full-width. Horizontal `columns` default to `['120px', '1fr', 'auto']` when not supplied | Controls whether the content renders in a single column or a `grid-template-columns` row. |

This control does **not** extend `AIUXControlElement`/`ControlIdentityBase`, so it has none of the usual form-control properties — no `label`, `name`, `readonly`, `disabled`, `required`, `invalid`, `messages`, `helperContent`, `editMode`, `variant`, `decorations`, `nowAssistConfig`, etc. Setting any of those as plain HTML attributes has no effect; they are simply not read by this element.

### Events

None. This control never calls `dispatchEvent`/`dispatchAction` anywhere in its implementation — it is purely a rendered view of its properties. It does not fire `value-changed`, `staged-value-changed`, `control-focus`, `control-blur`, or `invalid-set`.

### Slots

None.

### Methods

None. This control does not override `focus()` or `reset()` and does not inherit them from `AIUXControlElement` (it extends `AIUXElement` directly), so only the native, unoverridden `HTMLElement.focus()` is available — a no-op in practice, since nothing in this control's markup is focusable.

### Data shapes

```typescript
enum AnnotationType {
  Info = 'info',
  Important = 'important',
  LineSeparator = 'lineSeparator',
  SectionSeparator = 'sectionSeparator',
  SectionDetails = 'sectionDetails'
}
```

## Integration details

### Platform requirements

None — no network calls or platform services. Sanitization is via the package's own shared sanitizer utility (built on `sanitize-html`), not a browser-only library.

### SSR

`value` is always sanitized before `unsafeHTML()` renders it — the same sanitizer runs identically on the server and the client, so there is no unsanitized-markup window during SSR. The `ResizeObserver`-driven overflow/collapse logic is entirely client-side (`firstUpdated()`/`disconnectedCallback()`); on the server the block always renders in its initial, non-collapsed state.

### Lifecycle

On `firstUpdated()`, if the content element is found, performs an initial height check (setting `_expanded` based on whether the 60px threshold is already exceeded) and attaches a `ResizeObserver` that re-checks on every subsequent resize. `disconnectedCallback()` disconnects that observer.

### Sizing and layout

The host is `display: block; width: 100%`. Non-separator content renders inside a padded, rounded inner `<div>` (border/background applied only for `info`/`important`/section types); collapsed content is clipped to a fixed height (`h-8 overflow-y-hidden`) until expanded via the toggle button.

## Accessibility, localization, and customization

- **Accessibility:** the leading info icon is `aria-hidden="true"` (the callout's semantics are carried by its text content and color alone, not by an accessible icon label or a `role`/live region). The "Show More"/"Show Less" `<button>` sets `aria-expanded` to reflect its state and is natively focusable/operable via click or keyboard (native `<button>` semantics — Enter/Space). There is no `aria-live` announcement when content expands or collapses.
- **Localization:** the "Show More" and "Show Less" button labels are hard-coded English strings, localized through `@lit/localize`'s `msg()` (translatable via the project's standard localization catalog, not host-overridable props). `value` itself is entirely host-supplied and not translated by this control.
- **Customization:** styling is Tailwind/DaisyUI utility classes (`aiux-btn aiux-btn-sm aiux-btn-ghost`, `border-info`/`bg-info/10`, `border-error`/`bg-error/10`, `bg-base-200`, etc.) with no exposed `::part()` targets, slots, or CSS custom-property hooks.
