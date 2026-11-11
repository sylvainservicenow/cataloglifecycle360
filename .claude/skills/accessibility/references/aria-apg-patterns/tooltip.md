# Tooltip

## Pattern Usage

A tooltip is a popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it. Tooltips are typically brief textual descriptions or labels.

**Important:** Tooltips should not contain interactive content (links, buttons, etc.). For interactive popup content, use a dialog or similar pattern.

## Keyboard Interaction

| Key      | Function               |
| -------- | ---------------------- |
| `Escape` | Dismisses the tooltip. |

**Trigger Behavior:**

| Trigger | Behavior                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Focus   | Tooltip appears when element receives focus; hides when focus moves away.                                                            |
| Hover   | Tooltip appears when mouse hovers over element; hides when mouse leaves. Should remain visible if mouse moves to the tooltip itself. |

## WAI-ARIA Roles, States, and Properties

| Requirement            | Implementation                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| Tooltip role           | The tooltip element has role `tooltip`.                                |
| Described by reference | The triggering element has `aria-describedby` referencing the tooltip. |
| Visibility             | Tooltip is hidden by default and becomes visible on focus/hover.       |

**Note:** The trigger element should have an accessible name independent of the tooltip. The tooltip provides supplementary description, not the primary name.

---

## Forced Colors Requirements

### Tooltip

```css
@media (forced-colors: active) {
  .tooltip {
    background-color: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }

  /* Arrow inherits border color */
  .tooltip-arrow {
    border-color: CanvasText;
  }
}
```
