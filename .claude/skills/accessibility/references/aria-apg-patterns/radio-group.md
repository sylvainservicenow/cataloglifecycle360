# Radio Group

## Pattern Usage

A radio group is a set of checkable buttons, known as radio buttons, where no more than one button can be checked at a time. Selecting one automatically deselects any previously selected button.

## Keyboard Interaction

| Key                          | Function                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Tab`                        | Moves focus into the radio group. Focus lands on the checked button, or the first button if none is checked. |
| `Shift + Tab`                | Moves focus out of the radio group.                                                                          |
| `Right Arrow` / `Down Arrow` | Moves focus to and checks the next radio button. Wraps from last to first.                                   |
| `Left Arrow` / `Up Arrow`    | Moves focus to and checks the previous radio button. Wraps from first to last.                               |
| `Space`                      | If focused radio button is not checked, checks it.                                                           |

**Note on toolbar context:** When a radio group is inside a toolbar, arrow keys move focus but don't change which button is checked. `Space` or `Enter` is required to check a button.

## WAI-ARIA Roles, States, and Properties

| Requirement               | Implementation                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Radiogroup role           | Container has role `radiogroup`.                                                                  |
| Radio role                | Each radio button has role `radio`.                                                               |
| Checked state             | Checked button has `aria-checked="true"`. Unchecked buttons have `aria-checked="false"`.          |
| Accessible name (group)   | Radio group has accessible name via `aria-labelledby` or `aria-label`.                            |
| Accessible name (buttons) | Each radio button is labelled by content, `aria-labelledby`, or `aria-label`.                     |
| Description _(Optional)_  | `aria-describedby` may reference additional descriptive text for the group or individual buttons. |

---

## Forced Colors Requirements

### Radio

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE
     ======================================== */
  .radio {
    forced-color-adjust: none;
    background-color: Field;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .radio:hover:not(:disabled) {
    border-color: Highlight;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .radio:focus,
  .radio:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .radio:disabled {
    background-color: Field;
    border-color: GrayText;
  }

  /* ========================================
     CHECKED STATE
     ======================================== */
  .radio:checked {
    border-color: SelectedItem;
  }

  /* Inner dot */
  .radio:checked::after,
  .radio-dot {
    background-color: SelectedItem;
  }

  /* ========================================
     CHECKED + HOVER STATE
     ======================================== */
  .radio:checked:hover:not(:disabled) {
    border-color: Highlight;
  }

  /* ========================================
     CHECKED + FOCUS STATE
     ======================================== */
  .radio:checked:focus,
  .radio:checked:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     CHECKED + DISABLED STATE
     ======================================== */
  .radio:checked:disabled {
    border-color: GrayText;
  }

  .radio:checked:disabled::after,
  .radio:checked:disabled .radio-dot {
    background-color: GrayText;
  }

  /* ========================================
     LABEL
     ======================================== */
  .radio-label {
    color: CanvasText;
  }

  .radio:disabled + .radio-label {
    color: GrayText;
  }
}
```
