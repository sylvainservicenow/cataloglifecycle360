# Menu Button

> **See also:** The Dropdown component uses this pattern for **action** menus (`role="menu"` / `role="menuitem"`). For **selection** dropdowns (filterable comboboxes with `role="listbox"` and `role="option"`), see [`combobox.md`](combobox.md).

## Pattern Usage

A menu button is a button that opens a menu. It's often styled with a downward pointing arrow or triangle to indicate that activating it will display a menu.

## Keyboard Interaction

| Key                       | Function                                                |
| ------------------------- | ------------------------------------------------------- |
| `Enter`                   | Opens the menu and places focus on the first menu item. |
| `Space`                   | Opens the menu and places focus on the first menu item. |
| `Down Arrow` _(Optional)_ | Opens the menu and moves focus to the first menu item.  |
| `Up Arrow` _(Optional)_   | Opens the menu and moves focus to the last menu item.   |

After the menu opens, keyboard interaction follows the Menu pattern.

## WAI-ARIA Roles, States, and Properties

| Requirement        | Implementation                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| Button role        | The button has role `button`.                                                  |
| Popup indicator    | `aria-haspopup="menu"` or `aria-haspopup="true"`.                              |
| Expanded state     | `aria-expanded="false"` when menu is closed; `aria-expanded="true"` when open. |
| Controls reference | `aria-controls` references the menu element.                                   |
| Accessible name    | Button has accessible name describing the menu it opens.                       |

---

## Forced Colors Requirements

### Dropdown

```css
@media (forced-colors: active) {
  /* ========================================
     TRIGGER - BASE STATE
     ======================================== */
  .dropdown-trigger {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .dropdown-trigger svg,
  .dropdown-trigger [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     TRIGGER - HOVER STATE
     ======================================== */
  .dropdown-trigger:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .dropdown-trigger:hover svg,
  .dropdown-trigger:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     TRIGGER - FOCUS STATE
     ======================================== */
  .dropdown-trigger:focus,
  .dropdown-trigger:focus-visible {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     TRIGGER - FOCUS + HOVER STATE
     ======================================== */
  .dropdown-trigger:focus:hover,
  .dropdown-trigger:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     TRIGGER - EXPANDED STATE
     ======================================== */
  .dropdown-trigger[aria-expanded='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: ButtonBorder;
  }

  .dropdown-trigger[aria-expanded='true'] svg,
  .dropdown-trigger[aria-expanded='true'] [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     TRIGGER - EXPANDED + FOCUS STATE
     ======================================== */
  .dropdown-trigger[aria-expanded='true']:focus,
  .dropdown-trigger[aria-expanded='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     MENU CONTAINER
     Non-interactive container: Canvas background, no forced-color-adjust.
     Individual items set forced-color-adjust: none on themselves.
     ======================================== */
  .dropdown-menu {
    background-color: Canvas;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     ITEM - BASE STATE
     forced-color-adjust: none required on each item so explicit color
     pairs (Highlight/HighlightText, SelectedItem/SelectedItemText) apply
     reliably — the container's forced-color-adjust does not cascade here.
     ======================================== */
  .dropdown-item {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
  }

  .dropdown-item svg,
  .dropdown-item [class*='icon'] {
    fill: CanvasText;
    stroke: CanvasText;
  }

  /* ========================================
     ITEM - HOVER STATE
     ======================================== */
  .dropdown-item:hover {
    background-color: Highlight;
    color: HighlightText;
  }

  .dropdown-item:hover svg,
  .dropdown-item:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     ITEM - FOCUS STATE
     ======================================== */
  .dropdown-item:focus,
  .dropdown-item:focus-visible {
    background-color: Canvas;
    color: CanvasText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     ITEM - FOCUS + HOVER STATE
     ======================================== */
  .dropdown-item:focus:hover,
  .dropdown-item:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     ITEM - DISABLED STATE
     ======================================== */
  .dropdown-item:disabled,
  .dropdown-item[aria-disabled='true'] {
    background-color: Canvas;
    color: GrayText;
  }

  .dropdown-item:disabled svg,
  .dropdown-item[aria-disabled='true'] svg,
  .dropdown-item:disabled [class*='icon'],
  .dropdown-item[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     ITEM - SELECTED STATE
     ======================================== */
  .dropdown-item[aria-selected='true'],
  .dropdown-item.is-selected {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .dropdown-item[aria-selected='true'] svg,
  .dropdown-item.is-selected svg,
  .dropdown-item[aria-selected='true'] [class*='icon'],
  .dropdown-item.is-selected [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     ITEM - SELECTED + FOCUS STATE
     ======================================== */
  .dropdown-item[aria-selected='true']:focus,
  .dropdown-item[aria-selected='true']:focus-visible,
  .dropdown-item.is-selected:focus,
  .dropdown-item.is-selected:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     MENUITEMCHECKBOX - CHECKED STATE
     aria-checked="true" communicates selection for menuitemcheckbox.
     Use SelectedItem/SelectedItemText, not Highlight (which is for hover/focus).
     ======================================== */
  [role='menuitemcheckbox'][aria-checked='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  [role='menuitemcheckbox'][aria-checked='true'] svg,
  [role='menuitemcheckbox'][aria-checked='true'] [class*='icon'],
  [role='menuitemcheckbox'][aria-checked='true'] [class*='check'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* Checked + focused */
  [role='menuitemcheckbox'][aria-checked='true']:focus,
  [role='menuitemcheckbox'][aria-checked='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     MENUITEMRADIO - CHECKED STATE
     aria-checked="true" communicates the selected option in a radio group.
     Use SelectedItem/SelectedItemText, not Highlight (which is for hover/focus).
     ======================================== */
  [role='menuitemradio'][aria-checked='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  [role='menuitemradio'][aria-checked='true'] svg,
  [role='menuitemradio'][aria-checked='true'] [class*='icon'],
  [role='menuitemradio'][aria-checked='true'] [class*='dot'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* Checked + focused */
  [role='menuitemradio'][aria-checked='true']:focus,
  [role='menuitemradio'][aria-checked='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SEARCH HIGHLIGHTING
     ======================================== */
  .dropdown-item mark,
  .dropdown-item .highlight {
    background-color: Mark;
    color: MarkText;
  }

  /* ========================================
     DIVIDERS AND SECTION HEADINGS
     ======================================== */
  .dropdown-divider {
    border-color: CanvasText;
  }

  .dropdown-heading,
  .dropdown-group-label {
    color: CanvasText;
  }
}
```
