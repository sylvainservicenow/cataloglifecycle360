# Button

## Pattern Usage

A button is a widget that enables users to trigger an action or event, such as submitting a form, opening a dialog, canceling an action, or performing a delete operation. A common convention for informing users that a button launches a dialog is to append "..." (ellipsis) to the button label, e.g., "Save as...".

**Button Types:**

| Type           | Description                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command button | Executes a discrete action, such as submitting a form or opening a dialog.                                                                                                                                            |
| Toggle button  | A two-state button that can be either off (not pressed) or on (pressed). To indicate state, specify a value for `aria-pressed`. **Important:** The label on a toggle button should not change when its state changes. |
| Menu button    | A button that opens a menu (see Menu Button pattern). Has `aria-haspopup` set to `menu` or `true`.                                                                                                                    |

## Keyboard Interaction

| Key     | Function              |
| ------- | --------------------- |
| `Enter` | Activates the button. |
| `Space` | Activates the button. |

**Focus Behavior After Activation:**

| Scenario                         | Focus Behavior                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Opens a dialog                   | Focus moves inside the dialog (see Dialog pattern).                                                                      |
| Closes a dialog                  | Focus typically returns to the button that opened the dialog unless the function performed leads to a different context. |
| Does not dismiss current context | Focus typically remains on the button (e.g., Apply, Recalculate).                                                        |
| Indicates context change         | Focus moves to the starting point for that action (e.g., next step in wizard).                                           |

## WAI-ARIA Roles, States, and Properties

| Requirement                    | Implementation                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Button role                    | The button has role `button`. Use native `<button>` element when possible.                                  |
| Accessible name                | The button has an accessible label provided by its content, `aria-labelledby`, or `aria-label`.             |
| Description _(Optional)_       | If a description is present, `aria-describedby` is set to the ID of the element containing the description. |
| Disabled state                 | When unavailable, the button has `aria-disabled` set to `true`.                                             |
| Pressed state (toggle buttons) | Toggle buttons have `aria-pressed` set to `true` when on, `false` when off.                                 |
| Menu indicator (menu buttons)  | Menu buttons have `aria-haspopup` set to `menu` or `true`.                                                  |
| Expanded state (menu buttons)  | Menu buttons have `aria-expanded` set to `true` when menu is open, `false` when closed.                     |

---

## Forced Colors Requirements

### Button Implementation

> **Note:** Ghost/bare buttons (buttons with `transparent` background in normal mode) must always render with visible `ButtonBorder` borders when forced-colors is active.

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE
     ======================================== */
  .button {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .button svg,
  .button [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* Ghost/bare buttons must have visible borders */
  .button--ghost,
  .button--bare,
  .button[variant='ghost'] {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .button:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .button:hover svg,
  .button:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .button:focus,
  .button:focus-visible {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .button:focus svg,
  .button:focus-visible svg,
  .button:focus [class*='icon'],
  .button:focus-visible [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     FOCUS + HOVER STATE
     ======================================== */
  .button:focus:hover,
  .button:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .button:focus:hover svg,
  .button:focus-visible:hover svg,
  .button:focus:hover [class*='icon'],
  .button:focus-visible:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     ACTIVE STATE (momentary press)
     ======================================== */
  .button:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }

  .button:active svg,
  .button:active [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     ACTIVE + FOCUS STATE
     ======================================== */
  .button:active:focus,
  .button:active:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .button:active:focus svg,
  .button:active:focus-visible svg,
  .button:active:focus [class*='icon'],
  .button:active:focus-visible [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .button:disabled,
  .button[aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
    outline: none;
  }

  .button:disabled svg,
  .button[aria-disabled='true'] svg,
  .button:disabled [class*='icon'],
  .button[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     SELECTED/PRESSED STATE (toggle buttons)
     ======================================== */
  .button[aria-pressed='true'],
  .button[aria-selected='true'],
  .button.is-active,
  .button.is-selected {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: ButtonBorder;
  }

  .button[aria-pressed='true'] svg,
  .button[aria-selected='true'] svg,
  .button.is-active svg,
  .button.is-selected svg,
  .button[aria-pressed='true'] [class*='icon'],
  .button[aria-selected='true'] [class*='icon'],
  .button.is-active [class*='icon'],
  .button.is-selected [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED + HOVER STATE
     ======================================== */
  .button[aria-pressed='true']:hover,
  .button[aria-selected='true']:hover,
  .button.is-active:hover,
  .button.is-selected:hover {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
  }

  .button[aria-pressed='true']:hover svg,
  .button[aria-selected='true']:hover svg,
  .button.is-active:hover svg,
  .button.is-selected:hover svg,
  .button[aria-pressed='true']:hover [class*='icon'],
  .button[aria-selected='true']:hover [class*='icon'],
  .button.is-active:hover [class*='icon'],
  .button.is-selected:hover [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED + FOCUS STATE
     ======================================== */
  .button[aria-pressed='true']:focus,
  .button[aria-pressed='true']:focus-visible,
  .button[aria-selected='true']:focus,
  .button[aria-selected='true']:focus-visible,
  .button.is-active:focus,
  .button.is-active:focus-visible,
  .button.is-selected:focus,
  .button.is-selected:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .button[aria-pressed='true']:focus svg,
  .button[aria-pressed='true']:focus-visible svg,
  .button[aria-selected='true']:focus svg,
  .button[aria-selected='true']:focus-visible svg,
  .button.is-active:focus svg,
  .button.is-active:focus-visible svg,
  .button.is-selected:focus svg,
  .button.is-selected:focus-visible svg,
  .button[aria-pressed='true']:focus [class*='icon'],
  .button[aria-pressed='true']:focus-visible [class*='icon'],
  .button[aria-selected='true']:focus [class*='icon'],
  .button[aria-selected='true']:focus-visible [class*='icon'],
  .button.is-active:focus [class*='icon'],
  .button.is-active:focus-visible [class*='icon'],
  .button.is-selected:focus [class*='icon'],
  .button.is-selected:focus-visible [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED + ACTIVE STATE
     ======================================== */
  .button[aria-pressed='true']:active,
  .button[aria-selected='true']:active,
  .button.is-active:active,
  .button.is-selected:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }

  /* ========================================
     SELECTED + DISABLED STATE
     ======================================== */
  .button[aria-pressed='true']:disabled,
  .button[aria-pressed='true'][aria-disabled='true'],
  .button[aria-selected='true']:disabled,
  .button[aria-selected='true'][aria-disabled='true'],
  .button.is-active:disabled,
  .button.is-active[aria-disabled='true'],
  .button.is-selected:disabled,
  .button.is-selected[aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
    outline: none;
  }

  .button[aria-pressed='true']:disabled svg,
  .button[aria-pressed='true'][aria-disabled='true'] svg,
  .button[aria-selected='true']:disabled svg,
  .button[aria-selected='true'][aria-disabled='true'] svg,
  .button.is-active:disabled svg,
  .button.is-active[aria-disabled='true'] svg,
  .button.is-selected:disabled svg,
  .button.is-selected[aria-disabled='true'] svg,
  .button[aria-pressed='true']:disabled [class*='icon'],
  .button[aria-pressed='true'][aria-disabled='true'] [class*='icon'],
  .button[aria-selected='true']:disabled [class*='icon'],
  .button[aria-selected='true'][aria-disabled='true'] [class*='icon'],
  .button.is-active:disabled [class*='icon'],
  .button.is-active[aria-disabled='true'] [class*='icon'],
  .button.is-selected:disabled [class*='icon'],
  .button.is-selected[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }
}
```
