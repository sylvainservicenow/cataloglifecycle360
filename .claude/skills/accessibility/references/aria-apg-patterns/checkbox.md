# Checkbox

## Pattern Usage

WAI-ARIA supports two types of checkbox widgets:

| Type       | Description                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dual-state | Toggles between two choices: checked and not checked.                                                                                                           |
| Tri-state  | Allows three states: unchecked, partially checked, and checked. Used for "select all" controls where some but not all items in the controlled set are selected. |

## Keyboard Interaction

| Key     | Function                                                                                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Space` | Toggles checkbox between checked and unchecked states. For tri-state checkboxes, may cycle through all three states or toggle between checked and unchecked (in which case the partially checked state only occurs programmatically). |

## WAI-ARIA Roles, States, and Properties

| Requirement                | Implementation                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkbox role              | The checkbox has role `checkbox`. Use native `<input type="checkbox">` when possible.                                                             |
| Accessible name            | The checkbox has an accessible label provided by content, `aria-labelledby`, or `aria-label`. The native HTML `<label>` element can also be used. |
| Checked state (dual-state) | When checked, `aria-checked="true"`. When not checked, `aria-checked="false"`.                                                                    |
| Checked state (tri-state)  | When partially checked (mixed), `aria-checked="mixed"`.                                                                                           |
| Description _(Optional)_   | If a description is present, `aria-describedby` references it.                                                                                    |
| Disabled state             | When disabled, `aria-disabled="true"`.                                                                                                            |

---

## Forced Colors Requirements

### Checkbox

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE
     ======================================== */
  .checkbox {
    forced-color-adjust: none;
    background-color: Field;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .checkbox:hover:not(:disabled) {
    border-color: Highlight;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .checkbox:focus,
  .checkbox:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .checkbox:disabled {
    background-color: Field;
    border-color: GrayText;
  }

  /* ========================================
     CHECKED STATE
     ======================================== */
  .checkbox:checked {
    background-color: SelectedItem;
    border-color: SelectedItem;
  }

  /* Checkmark */
  .checkbox:checked::after,
  .checkbox-checkmark {
    color: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     CHECKED + HOVER STATE
     ======================================== */
  .checkbox:checked:hover:not(:disabled) {
    border-color: Highlight;
  }

  /* ========================================
     CHECKED + FOCUS STATE
     ======================================== */
  .checkbox:checked:focus,
  .checkbox:checked:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     CHECKED + DISABLED STATE
     ======================================== */
  .checkbox:checked:disabled {
    background-color: Field;
    border-color: GrayText;
  }

  .checkbox:checked:disabled::after,
  .checkbox:checked:disabled .checkbox-checkmark {
    color: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     INDETERMINATE STATE
     ======================================== */
  .checkbox:indeterminate {
    background-color: SelectedItem;
    border-color: SelectedItem;
  }

  .checkbox:indeterminate::after {
    background-color: SelectedItemText;
  }

  .checkbox:indeterminate:disabled {
    background-color: Field;
    border-color: GrayText;
  }

  .checkbox:indeterminate:disabled::after {
    background-color: GrayText;
  }

  /* ========================================
     LABEL
     ======================================== */
  .checkbox-label {
    color: CanvasText;
  }

  .checkbox:disabled + .checkbox-label {
    color: GrayText;
  }
}
```
