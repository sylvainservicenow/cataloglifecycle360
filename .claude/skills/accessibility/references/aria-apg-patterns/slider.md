# Slider

## Pattern Usage

A slider is an input where the user selects a value from within a given range. Sliders typically have a thumb that can be moved along a track to change the value.

## Keyboard Interaction

| Key           | Function                                          |
| ------------- | ------------------------------------------------- |
| `Right Arrow` | Increases the slider value by one step.           |
| `Up Arrow`    | Increases the slider value by one step.           |
| `Left Arrow`  | Decreases the slider value by one step.           |
| `Down Arrow`  | Decreases the slider value by one step.           |
| `Page Up`     | Increases the value by a larger step (e.g., 10%). |
| `Page Down`   | Decreases the value by a larger step.             |
| `Home`        | Sets the slider to its minimum value.             |
| `End`         | Sets the slider to its maximum value.             |

## WAI-ARIA Roles, States, and Properties

| Requirement             | Implementation                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Slider role             | The thumb element has role `slider`.                                                                |
| Current value           | `aria-valuenow` is set to the current value.                                                        |
| Minimum value           | `aria-valuemin` is set to the minimum allowed value.                                                |
| Maximum value           | `aria-valuemax` is set to the maximum allowed value.                                                |
| Text value _(Optional)_ | If numeric value isn't user-friendly, `aria-valuetext` provides text (e.g., "Medium", "Wednesday"). |
| Accessible name         | Slider has accessible name via `aria-labelledby` or `aria-label`.                                   |
| Orientation             | If vertical, set `aria-orientation="vertical"`. Default is `horizontal`.                            |
| Disabled state          | When disabled, `aria-disabled="true"`.                                                              |
