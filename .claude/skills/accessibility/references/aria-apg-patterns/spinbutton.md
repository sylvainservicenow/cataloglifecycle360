# Spinbutton

## Pattern Usage

A spinbutton is an input widget that restricts its value to a set or range of discrete values. Spinbuttons often have three components: a text field displaying the current value, an increase button, and a decrease button. The text field is typically the only focusable component.

## Keyboard Interaction

| Key          | Function                              |
| ------------ | ------------------------------------- |
| `Up Arrow`   | Increases the value.                  |
| `Down Arrow` | Decreases the value.                  |
| `Page Up`    | Increases the value by a larger step. |
| `Page Down`  | Decreases the value by a larger step. |
| `Home`       | Sets to minimum value (if defined).   |
| `End`        | Sets to maximum value (if defined).   |

## WAI-ARIA Roles, States, and Properties

| Requirement             | Implementation                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Spinbutton role         | The input element has role `spinbutton`.                                                          |
| Current value           | `aria-valuenow` is set to the current numeric value.                                              |
| Minimum value           | `aria-valuemin` is set to the minimum value (if known).                                           |
| Maximum value           | `aria-valuemax` is set to the maximum value (if known).                                           |
| Text value _(Optional)_ | If numeric value isn't user-friendly, `aria-valuetext` provides text (e.g., "Monday", "January"). |
| Accessible name         | Spinbutton has accessible name via `aria-labelledby` or `aria-label`.                             |
| Invalid state           | If value is outside allowed range, `aria-invalid="true"`.                                         |
