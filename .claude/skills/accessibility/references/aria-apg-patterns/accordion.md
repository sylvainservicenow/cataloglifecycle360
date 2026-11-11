# Accordion

## Pattern Usage

An accordion is a vertically stacked set of interactive headings that each contain a title, content snippet, or thumbnail representing a section of content. The headings function as controls that enable users to reveal or hide their associated sections of content. Accordions are commonly used to reduce the need to scroll when presenting multiple sections of content on a single page.

**Terminology:**

| Term             | Definition                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion Header | Label for or thumbnail representing a section of content that also serves as a control for showing, and in some implementations, hiding the section of content |
| Accordion Panel  | Section of content associated with an accordion header                                                                                                         |

## Keyboard Interaction

| Key                       | Function                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Enter` or `Space`        | When focus is on the accordion header for a collapsed panel, expands the associated panel. If the implementation allows only one panel to be expanded, and if another panel is expanded, collapses that panel. When focus is on the accordion header for an expanded panel, collapses the panel if the implementation supports collapsing. Some implementations require one panel to be expanded at all times and allow only one panel to be expanded; so, they do not support a collapse function. |
| `Tab`                     | Moves focus to the next focusable element; all focusable elements in the accordion are included in the page Tab sequence.                                                                                                                                                                                                                                                                                                                                                                           |
| `Shift + Tab`             | Moves focus to the previous focusable element; all focusable elements in the accordion are included in the page Tab sequence.                                                                                                                                                                                                                                                                                                                                                                       |
| `Down Arrow` _(Optional)_ | If focus is on an accordion header, moves focus to the next accordion header. If focus is on the last accordion header, either does nothing or moves focus to the first accordion header.                                                                                                                                                                                                                                                                                                           |
| `Up Arrow` _(Optional)_   | If focus is on an accordion header, moves focus to the previous accordion header. If focus is on the first accordion header, either does nothing or moves focus to the last accordion header.                                                                                                                                                                                                                                                                                                       |
| `Home` _(Optional)_       | When focus is on an accordion header, moves focus to the first accordion header.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `End` _(Optional)_        | When focus is on an accordion header, moves focus to the last accordion header.                                                                                                                                                                                                                                                                                                                                                                                                                     |

## WAI-ARIA Roles, States, and Properties

| Requirement              | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header button role       | The title of each accordion header is contained in an element with role `button`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Heading wrapper          | Each accordion header `button` is wrapped in an element with role `heading` that has a value set for `aria-level` that is appropriate for the information architecture of the page. If the native host language has an element with an implicit heading and aria-level, such as an HTML heading tag, a native host language element may be used.                                                                                                                                                                                                     |
| Button placement         | The `button` element is the only element inside the `heading` element. That is, if there are other visually persistent elements, they are not included inside the `heading` element.                                                                                                                                                                                                                                                                                                                                                                 |
| Expanded state           | If the accordion panel associated with an accordion header is visible, the header `button` element has `aria-expanded` set to `true`. If the panel is not visible, `aria-expanded` is set to `false`.                                                                                                                                                                                                                                                                                                                                                |
| Controls reference       | The accordion header `button` element has `aria-controls` set to the ID of the element containing the accordion panel content.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Disabled state           | If the accordion panel associated with an accordion header is visible, and if the accordion does not permit the panel to be collapsed, the header `button` element has `aria-disabled` set to `true`.                                                                                                                                                                                                                                                                                                                                                |
| Region role _(Optional)_ | Optionally, each element that serves as a container for panel content has role `region` and `aria-labelledby` with a value that refers to the button that controls display of the panel. Avoid using the `region` role in circumstances that create landmark region proliferation, e.g., in an accordion that contains more than approximately 6 panels that can be expanded at the same time. Role `region` is especially helpful to the perception of structure by screen reader users when panels contain heading elements or a nested accordion. |

---

## Forced Colors Requirements

### Accordion

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE - HEADER/TRIGGER
     ======================================== */
  .accordion-header,
  .accordion-trigger {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .accordion-header svg,
  .accordion-trigger svg,
  .accordion-header [class*='icon'],
  .accordion-trigger [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .accordion-header:hover,
  .accordion-trigger:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .accordion-header:hover svg,
  .accordion-trigger:hover svg,
  .accordion-header:hover [class*='icon'],
  .accordion-trigger:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .accordion-header:focus,
  .accordion-header:focus-visible,
  .accordion-trigger:focus,
  .accordion-trigger:focus-visible {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .accordion-header:focus svg,
  .accordion-header:focus-visible svg,
  .accordion-trigger:focus svg,
  .accordion-trigger:focus-visible svg,
  .accordion-header:focus [class*='icon'],
  .accordion-header:focus-visible [class*='icon'],
  .accordion-trigger:focus [class*='icon'],
  .accordion-trigger:focus-visible [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     FOCUS + HOVER STATE
     ======================================== */
  .accordion-header:focus:hover,
  .accordion-header:focus-visible:hover,
  .accordion-trigger:focus:hover,
  .accordion-trigger:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .accordion-header:focus:hover svg,
  .accordion-header:focus-visible:hover svg,
  .accordion-trigger:focus:hover svg,
  .accordion-trigger:focus-visible:hover svg,
  .accordion-header:focus:hover [class*='icon'],
  .accordion-header:focus-visible:hover [class*='icon'],
  .accordion-trigger:focus:hover [class*='icon'],
  .accordion-trigger:focus-visible:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     ACTIVE STATE
     ======================================== */
  .accordion-header:active,
  .accordion-trigger:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }

  .accordion-header:active svg,
  .accordion-trigger:active svg,
  .accordion-header:active [class*='icon'],
  .accordion-trigger:active [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .accordion-header:disabled,
  .accordion-header[aria-disabled='true'],
  .accordion-trigger:disabled,
  .accordion-trigger[aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }

  .accordion-header:disabled svg,
  .accordion-header[aria-disabled='true'] svg,
  .accordion-trigger:disabled svg,
  .accordion-trigger[aria-disabled='true'] svg,
  .accordion-header:disabled [class*='icon'],
  .accordion-header[aria-disabled='true'] [class*='icon'],
  .accordion-trigger:disabled [class*='icon'],
  .accordion-trigger[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     EXPANDED STATE
     ======================================== */
  .accordion-header[aria-expanded='true'],
  .accordion-trigger[aria-expanded='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: ButtonBorder;
  }

  .accordion-header[aria-expanded='true'] svg,
  .accordion-trigger[aria-expanded='true'] svg,
  .accordion-header[aria-expanded='true'] [class*='icon'],
  .accordion-trigger[aria-expanded='true'] [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     EXPANDED + HOVER STATE
     ======================================== */
  .accordion-header[aria-expanded='true']:hover,
  .accordion-trigger[aria-expanded='true']:hover {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
  }

  /* ========================================
     EXPANDED + FOCUS STATE
     ======================================== */
  .accordion-header[aria-expanded='true']:focus,
  .accordion-header[aria-expanded='true']:focus-visible,
  .accordion-trigger[aria-expanded='true']:focus,
  .accordion-trigger[aria-expanded='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     EXPANDED + DISABLED STATE
     ======================================== */
  .accordion-header[aria-expanded='true']:disabled,
  .accordion-header[aria-expanded='true'][aria-disabled='true'],
  .accordion-trigger[aria-expanded='true']:disabled,
  .accordion-trigger[aria-expanded='true'][aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }

  .accordion-header[aria-expanded='true']:disabled svg,
  .accordion-header[aria-expanded='true'][aria-disabled='true'] svg,
  .accordion-trigger[aria-expanded='true']:disabled svg,
  .accordion-trigger[aria-expanded='true'][aria-disabled='true'] svg,
  .accordion-header[aria-expanded='true']:disabled [class*='icon'],
  .accordion-header[aria-expanded='true'][aria-disabled='true'] [class*='icon'],
  .accordion-trigger[aria-expanded='true']:disabled [class*='icon'],
  .accordion-trigger[aria-expanded='true'][aria-disabled='true']
    [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     PANEL
     ======================================== */
  .accordion-panel {
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid ButtonBorder;
  }
}
```
