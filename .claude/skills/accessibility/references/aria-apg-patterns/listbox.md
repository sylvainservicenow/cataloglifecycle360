# Listbox

## Pattern Usage

A listbox widget presents a list of options and allows a user to select one or more of them. A listbox that allows only a single option to be selected is a single-select listbox; one that allows multiple options is a multi-select listbox.

## Keyboard Interaction

**Single-Select Listbox:**

| Key          | Function                                                |
| ------------ | ------------------------------------------------------- |
| `Down Arrow` | Moves focus to and selects the next option.             |
| `Up Arrow`   | Moves focus to and selects the previous option.         |
| `Home`       | Moves focus to and selects the first option.            |
| `End`        | Moves focus to and selects the last option.             |
| Type-ahead   | Moves focus to option starting with typed character(s). |

**Multi-Select Listbox:**

| Key                   | Function                                                   |
| --------------------- | ---------------------------------------------------------- |
| `Down Arrow`          | Moves focus to next option (doesn't change selection).     |
| `Up Arrow`            | Moves focus to previous option (doesn't change selection). |
| `Space`               | Changes the selection state of the focused option.         |
| `Shift + Down Arrow`  | Moves focus and extends selection to next option.          |
| `Shift + Up Arrow`    | Moves focus and extends selection to previous option.      |
| `Ctrl + Shift + Home` | Selects from focused option to first option.               |
| `Ctrl + Shift + End`  | Selects from focused option to last option.                |
| `Ctrl + A`            | Selects all options. Optionally toggles all.               |

## WAI-ARIA Roles, States, and Properties

| Requirement                    | Implementation                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Listbox role                   | Container has role `listbox`.                                                                                                            |
| Option role                    | Each option has role `option`.                                                                                                           |
| Multi-select                   | If multi-select, listbox has `aria-multiselectable="true"`.                                                                              |
| Selected state                 | Selected options have `aria-selected="true"`. Unselected have `aria-selected="false"`.                                                   |
| Accessible name                | Listbox has accessible name via `aria-labelledby` or `aria-label`.                                                                       |
| Active descendant _(Optional)_ | If using `aria-activedescendant` for focus management, DOM focus stays on listbox and `aria-activedescendant` references focused option. |
| Grouped options                | Groups have role `group` with accessible name via `aria-label` or `aria-labelledby`.                                                     |
| Orientation                    | If horizontal, set `aria-orientation="horizontal"`. Default is `vertical`.                                                               |

---

## Forced Colors Requirements

### List

```css
@media (forced-colors: active) {
  /* Non-interactive container: Canvas background, no forced-color-adjust.
     Individual interactive items set forced-color-adjust: none themselves. */
  .list {
    background-color: Canvas;
    color: CanvasText;
  }

  .list-item {
    border-bottom: 1px solid ButtonBorder;
  }

  /* ========================================
     INTERACTIVE ITEM - BASE STATE
     forced-color-adjust: none required on each item so explicit color
     pairs (Highlight/HighlightText, SelectedItem/SelectedItemText) apply
     reliably — do not rely on inheritance from the container.

     Without forced-color-adjust: none on the item, the browser applies a
     text backplate (a contrasting box behind text characters) in forced-colors
     mode. This backplate renders on top of Highlight/SelectedItem backgrounds
     and creates a "weird highlight" visual artifact on the text.

     Apply to both class-based selectors AND role-attribute selectors, since
     components may target items either way.
     ======================================== */
  [role='option'],
  [role='button'],
  .list-item[role='button'],
  .list-item[role='option'],
  .list-item.is-clickable {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
  }

  .list-item[role='button'] svg,
  .list-item[role='option'] svg,
  .list-item.is-clickable svg,
  .list-item[role='button'] [class*='icon'],
  .list-item[role='option'] [class*='icon'],
  .list-item.is-clickable [class*='icon'] {
    fill: CanvasText;
    stroke: CanvasText;
  }

  /* ========================================
     INTERACTIVE ITEM - HOVER STATE
     ======================================== */
  .list-item[role='button']:hover,
  .list-item[role='option']:hover,
  .list-item.is-clickable:hover {
    background-color: Highlight;
    color: HighlightText;
  }

  .list-item[role='button']:hover svg,
  .list-item[role='option']:hover svg,
  .list-item.is-clickable:hover svg,
  .list-item[role='button']:hover [class*='icon'],
  .list-item[role='option']:hover [class*='icon'],
  .list-item.is-clickable:hover [class*='icon'] {
    forced-color-adjust: none;
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     INTERACTIVE ITEM - FOCUS STATE
     ======================================== */
  .list-item[role='button']:focus,
  .list-item[role='button']:focus-visible,
  .list-item[role='option']:focus,
  .list-item[role='option']:focus-visible,
  .list-item.is-clickable:focus,
  .list-item.is-clickable:focus-visible {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     INTERACTIVE ITEM - FOCUS + HOVER STATE
     ======================================== */
  .list-item[role='button']:focus:hover,
  .list-item[role='option']:focus:hover,
  .list-item.is-clickable:focus:hover {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     INTERACTIVE ITEM - ACTIVE STATE
     ======================================== */
  .list-item[role='button']:active,
  .list-item[role='option']:active,
  .list-item.is-clickable:active {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .list-item[role='button']:active svg,
  .list-item[role='option']:active svg,
  .list-item.is-clickable:active svg,
  .list-item[role='button']:active [class*='icon'],
  .list-item[role='option']:active [class*='icon'],
  .list-item.is-clickable:active [class*='icon'] {
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     INTERACTIVE ITEM - SELECTED STATE
     ======================================== */
  .list-item[aria-selected='true'],
  .list-item.is-selected {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .list-item[aria-selected='true'] svg,
  .list-item.is-selected svg,
  .list-item[aria-selected='true'] [class*='icon'],
  .list-item.is-selected [class*='icon'] {
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     INTERACTIVE ITEM - SELECTED + FOCUS STATE
     ======================================== */
  .list-item[aria-selected='true']:focus,
  .list-item[aria-selected='true']:focus-visible,
  .list-item.is-selected:focus,
  .list-item.is-selected:focus-visible {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SEARCH HIGHLIGHTING
     ======================================== */
  .list-item mark,
  .list-item .highlight {
    forced-color-adjust: none;
    background-color: Mark;
    color: MarkText;
  }

  /* ========================================
     DIVIDERS AND SECTION HEADINGS
     ======================================== */
  .list-divider {
    border-color: CanvasText;
  }

  .list-heading,
  .list-group-label {
    color: CanvasText;
  }
}
```
