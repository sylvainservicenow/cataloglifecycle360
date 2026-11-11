# Meter

## Pattern Usage

A meter is a graphical display of a numeric value that varies within a defined range. Examples include battery level, disk usage, or fuel gauge. **Important:** Do not use meter to indicate progress—use `progressbar` instead.

## Keyboard Interaction

Not applicable—meter is not an interactive widget.

## WAI-ARIA Roles, States, and Properties

| Requirement             | Implementation                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Meter role              | Element has role `meter`.                                                                                              |
| Current value           | `aria-valuenow` is set to the current numeric value.                                                                   |
| Minimum value           | `aria-valuemin` is set to the minimum allowed value.                                                                   |
| Maximum value           | `aria-valuemax` is set to the maximum allowed value.                                                                   |
| Text value _(Optional)_ | If numeric value isn't user-friendly, `aria-valuetext` provides human-readable text (e.g., "50% (6 hours) remaining"). |
| Accessible name         | Meter has accessible name via `aria-labelledby` or `aria-label`.                                                       |

---

## Forced Colors Requirements

### Progress Bar

```css
@media (forced-colors: active) {
  .progress {
    forced-color-adjust: none;
  }

  .progress-track {
    background-color: Field;
    border: 2px solid ButtonBorder;
  }

  .progress-fill {
    background-color: Highlight;
  }

  .progress-label {
    color: CanvasText;
  }
}
```
