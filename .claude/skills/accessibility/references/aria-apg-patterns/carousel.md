# Carousel

## Pattern Usage

A carousel presents a set of items, referred to as slides, by sequentially displaying a subset of one or more slides. The carousel may optionally include rotation controls, slide picker controls, and navigation controls. Carousels can automatically rotate or be controlled only manually by the user.

**Important Accessibility Considerations:**

- **Rotation control:** Carousels that auto-rotate must have a pause/stop button. Auto-rotation must stop when:
  - A keyboard user moves focus to any element in the carousel
  - The mouse hovers over carousel content
- **Reduced motion:** Honor user's reduced motion preferences (`prefers-reduced-motion` media query)

**Carousel Variants:**

| Variant | Description                                             |
| ------- | ------------------------------------------------------- |
| Basic   | Has rotation control plus previous/next slide buttons   |
| Tabbed  | Uses tabs pattern for slide picker controls             |
| Grouped | Has basic controls plus a group of slide picker buttons |

## Keyboard Interaction

**Rotation Control, Previous/Next Buttons:**

| Key                | Function                                                            |
| ------------------ | ------------------------------------------------------------------- |
| `Tab`              | Moves focus through interactive elements.                           |
| `Enter` or `Space` | Activates rotation control (pause/play), previous, or next buttons. |

**Tabbed Carousel (Slide Picker Tabs):**

| Key                 | Function                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `Tab`               | Moves focus into and out of the tab list. When focus moves into the tab list, it lands on the active tab. |
| `Right Arrow`       | Moves focus to the next tab and activates that slide. Wraps from last to first.                           |
| `Left Arrow`        | Moves focus to the previous tab and activates that slide. Wraps from first to last.                       |
| `Home` _(Optional)_ | Moves focus to first tab and activates that slide.                                                        |
| `End` _(Optional)_  | Moves focus to last tab and activates that slide.                                                         |

## WAI-ARIA Roles, States, and Properties

| Requirement              | Implementation                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Carousel container       | Has role `region` or `group` with `aria-roledescription="carousel"`.                                                                      |
| Container name           | Has accessible name via `aria-labelledby` or `aria-label`. Name should not include "carousel" since `aria-roledescription` provides that. |
| Slide container          | Each slide has role `group` with `aria-roledescription="slide"` and an accessible name (e.g., "1 of 4").                                  |
| Rotation control         | Button that toggles auto-rotation. Label changes to match action (e.g., "Stop automatic slide show" or "Start automatic slide show").     |
| Live region _(Optional)_ | Element wrapping slides may have `aria-atomic="false"` and `aria-live` set to `polite` (when rotating) or `off` (when not).               |
| Tabbed variant           | Uses tabs pattern: slide pickers have role `tab` in a `tablist`, slides have role `tabpanel`.                                             |
