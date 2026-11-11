# Menu and Menubar

## Pattern Usage

A menu is a widget that offers a list of choices to the user, such as a set of actions or functions. A menubar is typically a horizontal bar containing menu items, some of which may open submenus. Menus are commonly opened by menu buttons or by right-clicking (context menu).

**Menu Item Types:**

| Role               | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `menuitem`         | Command that executes an action.                         |
| `menuitemcheckbox` | Checkable option. Toggles between checked and unchecked. |
| `menuitemradio`    | One of a group of mutually exclusive options.            |

## Keyboard Interaction

**Menubar:**

| Key           | Function                                                                     |
| ------------- | ---------------------------------------------------------------------------- |
| `Right Arrow` | Moves focus to next item. Wraps from last to first.                          |
| `Left Arrow`  | Moves focus to previous item. Wraps from first to last.                      |
| `Down Arrow`  | Opens submenu and moves focus to first item.                                 |
| `Up Arrow`    | Opens submenu and moves focus to last item.                                  |
| `Enter`       | Activates item. If it has a submenu, opens it and moves focus to first item. |
| `Space`       | Activates item (same as Enter for most items).                               |
| `Home`        | Moves focus to first item.                                                   |
| `End`         | Moves focus to last item.                                                    |
| `Escape`      | Closes menu.                                                                 |
| Character     | Moves focus to item starting with that character.                            |

**Submenu/Dropdown Menu:**

| Key           | Function                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `Down Arrow`  | Moves focus to next item.                                                                               |
| `Up Arrow`    | Moves focus to previous item.                                                                           |
| `Right Arrow` | If item has submenu, opens it. Otherwise, closes current menu and opens next menubar item's submenu.    |
| `Left Arrow`  | Closes current submenu and moves focus to parent. If in top-level menu, moves to previous menubar item. |
| `Enter`       | Activates item and closes menu.                                                                         |
| `Escape`      | Closes the menu and returns focus to menu button or menubar item.                                       |

## WAI-ARIA Roles, States, and Properties

| Requirement       | Implementation                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Menu/menubar role | Container has role `menu` or `menubar`.                                                               |
| Item roles        | Items have role `menuitem`, `menuitemcheckbox`, or `menuitemradio`.                                   |
| Submenu indicator | Items with submenus have `aria-haspopup="menu"` and `aria-expanded`.                                  |
| Checked state     | `menuitemcheckbox` and `menuitemradio` have `aria-checked` (`true`/`false`).                          |
| Disabled state    | Disabled items have `aria-disabled="true"`.                                                           |
| Accessible name   | Menu has accessible name via `aria-labelledby` or `aria-label`.                                       |
| Orientation       | Menubar is implicitly horizontal. Menus are implicitly vertical. Use `aria-orientation` if different. |

---

## Forced Colors Requirements

### Menu

```css
@media (forced-colors: active) {
  /* ========================================
     CONTAINER
     Non-interactive container: Canvas background, no forced-color-adjust.
     Individual items set forced-color-adjust: none on themselves.
     ======================================== */
  .menu {
    background-color: Canvas;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     MENU ITEM - BASE STATE
     forced-color-adjust: none required on each item so explicit color
     pairs (Highlight/HighlightText, SelectedItem/SelectedItemText) apply
     reliably — do not rely on inheritance from the container.
     ======================================== */
  .menu-item {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
  }

  .menu-item svg,
  .menu-item [class*='icon'] {
    fill: CanvasText;
    stroke: CanvasText;
  }

  /* ========================================
     MENU ITEM - HOVER STATE
     ======================================== */
  .menu-item:hover {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }

  .menu-item:hover svg,
  .menu-item:hover [class*='icon'] {
    forced-color-adjust: none;
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     MENU ITEM - FOCUS STATE
     ======================================== */
  .menu-item:focus,
  .menu-item:focus-visible {
    background-color: Canvas;
    color: CanvasText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     MENU ITEM - FOCUS + HOVER STATE
     ======================================== */
  .menu-item:focus:hover,
  .menu-item:focus-visible:hover {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  .menu-item:focus:hover svg,
  .menu-item:focus-visible:hover svg,
  .menu-item:focus:hover [class*='icon'],
  .menu-item:focus-visible:hover [class*='icon'] {
    forced-color-adjust: none;
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     MENU ITEM - DISABLED STATE
     ======================================== */
  .menu-item:disabled,
  .menu-item[aria-disabled='true'] {
    background-color: Canvas;
    color: GrayText;
  }

  .menu-item:disabled svg,
  .menu-item[aria-disabled='true'] svg,
  .menu-item:disabled [class*='icon'],
  .menu-item[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     MENU ITEM - SELECTED/CURRENT STATE
     ======================================== */
  .menu-item[aria-current='true'],
  .menu-item[aria-selected='true'],
  .menu-item.is-active {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .menu-item[aria-current='true'] svg,
  .menu-item[aria-selected='true'] svg,
  .menu-item.is-active svg,
  .menu-item[aria-current='true'] [class*='icon'],
  .menu-item[aria-selected='true'] [class*='icon'],
  .menu-item.is-active [class*='icon'] {
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     MENU ITEM - SELECTED + FOCUS STATE
     ======================================== */
  .menu-item[aria-current='true']:focus,
  .menu-item[aria-current='true']:focus-visible,
  .menu-item[aria-selected='true']:focus,
  .menu-item[aria-selected='true']:focus-visible,
  .menu-item.is-active:focus,
  .menu-item.is-active:focus-visible {
    forced-color-adjust: none;
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
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* Checked + focused */
  [role='menuitemcheckbox'][aria-checked='true']:focus,
  [role='menuitemcheckbox'][aria-checked='true']:focus-visible {
    forced-color-adjust: none;
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
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* Checked + focused */
  [role='menuitemradio'][aria-checked='true']:focus,
  [role='menuitemradio'][aria-checked='true']:focus-visible {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SEARCH HIGHLIGHTING
     ======================================== */
  .menu-item mark,
  .menu-item .highlight {
    forced-color-adjust: none;
    background-color: Mark;
    color: MarkText;
  }

  /* ========================================
     DIVIDERS AND SECTION HEADINGS
     ======================================== */
  .menu-separator,
  .menu-divider {
    border-color: CanvasText;
  }

  .menu-heading,
  .menu-group-label {
    color: CanvasText;
  }
}
```
