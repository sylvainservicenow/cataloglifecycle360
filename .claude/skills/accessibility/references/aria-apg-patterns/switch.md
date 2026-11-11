# Switch

## Pattern Usage

A switch is an input widget that allows users to choose one of two values: on or off. Switches are similar to checkboxes but represent a distinct UI pattern with an on/off metaphor rather than checked/unchecked.

## Keyboard Interaction

| Key     | Function                               |
| ------- | -------------------------------------- |
| `Space` | Toggles the switch between on and off. |
| `Enter` | Toggles the switch between on and off. |

## WAI-ARIA Roles, States, and Properties

| Requirement              | Implementation                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| Switch role              | Element has role `switch`.                                                  |
| Checked state            | When on, `aria-checked="true"`. When off, `aria-checked="false"`.           |
| Accessible name          | Switch has accessible name via content, `aria-labelledby`, or `aria-label`. |
| Description _(Optional)_ | `aria-describedby` may reference additional descriptive text.               |

---

## Forced Colors Requirements

### Toggle / Switch

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE
     ======================================== */
  .toggle {
    forced-color-adjust: none;
  }

  .toggle-track {
    background-color: Field;
    border: 2px solid ButtonBorder;
  }

  /* Thumb/knob */
  .toggle-thumb {
    background-color: ButtonText;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .toggle:hover:not(:disabled) .toggle-track {
    border-color: Highlight;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .toggle:focus .toggle-track,
  .toggle:focus-visible .toggle-track {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .toggle:disabled .toggle-track {
    border-color: GrayText;
  }

  .toggle:disabled .toggle-thumb {
    background-color: GrayText;
  }

  /* ========================================
     CHECKED STATE
     ======================================== */
  .toggle[aria-checked='true'] .toggle-track,
  .toggle:checked .toggle-track {
    background-color: SelectedItem;
    border-color: SelectedItem;
  }

  .toggle[aria-checked='true'] .toggle-thumb,
  .toggle:checked .toggle-thumb {
    background-color: SelectedItemText;
  }

  /* ========================================
     CHECKED + HOVER STATE
     ======================================== */
  .toggle[aria-checked='true']:hover:not(:disabled) .toggle-track,
  .toggle:checked:hover:not(:disabled) .toggle-track {
    border-color: Highlight;
  }

  /* ========================================
     CHECKED + FOCUS STATE
     ======================================== */
  .toggle[aria-checked='true']:focus .toggle-track,
  .toggle[aria-checked='true']:focus-visible .toggle-track,
  .toggle:checked:focus .toggle-track,
  .toggle:checked:focus-visible .toggle-track {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     CHECKED + DISABLED STATE
     ======================================== */
  .toggle[aria-checked='true']:disabled .toggle-track,
  .toggle:checked:disabled .toggle-track {
    background-color: Field;
    border-color: GrayText;
  }

  .toggle[aria-checked='true']:disabled .toggle-thumb,
  .toggle:checked:disabled .toggle-thumb {
    background-color: GrayText;
  }

  /* ========================================
     LABEL
     ======================================== */
  .toggle-label {
    color: CanvasText;
  }

  .toggle:disabled + .toggle-label,
  .toggle:disabled ~ .toggle-label {
    color: GrayText;
  }
}
```
