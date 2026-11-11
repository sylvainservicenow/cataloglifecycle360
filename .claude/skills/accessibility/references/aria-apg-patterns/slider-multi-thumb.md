# Slider (Multi-Thumb)

## Pattern Usage

A multi-thumb slider implements the Slider pattern but includes two or more thumbs, often on a single rail. A common example is a price range slider with thumbs for minimum and maximum values.

## Keyboard Interaction

Same as single slider, but each thumb is an independently focusable element. Thumbs are typically constrained to not pass each other.

## WAI-ARIA Roles, States, and Properties

| Requirement                  | Implementation                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Slider role                  | Each thumb has role `slider`.                                                                                |
| Individual values            | Each thumb has its own `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.                                |
| Dynamic constraints          | Min/max of each thumb may be dynamically constrained by the other thumb's position.                          |
| Distinct names               | Each thumb has a distinct accessible name (e.g., "Minimum price", "Maximum price").                          |
| Group container _(Optional)_ | Thumbs may be wrapped in an element with role `group` and an accessible name describing the overall control. |
