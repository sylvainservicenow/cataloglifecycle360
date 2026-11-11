# Toolbar

## Pattern Usage

A toolbar is a container for grouping a set of controls, such as buttons, menu buttons, or checkboxes. Toolbars provide a single tab stop—users navigate within using arrow keys.

## Keyboard Interaction

| Key                 | Function                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `Tab`               | Moves focus into the toolbar (one tab stop). Subsequent `Tab` moves focus out.                  |
| `Right Arrow`       | Moves focus to next control (horizontal toolbar).                                               |
| `Left Arrow`        | Moves focus to previous control (horizontal toolbar).                                           |
| `Down Arrow`        | Moves focus to next control (vertical toolbar). May also open menu if control is a menu button. |
| `Up Arrow`          | Moves focus to previous control (vertical toolbar).                                             |
| `Home` _(Optional)_ | Moves focus to first control.                                                                   |
| `End` _(Optional)_  | Moves focus to last control.                                                                    |
| `Escape`            | If a menu is open, closes it and returns focus to the menu button.                              |

## WAI-ARIA Roles, States, and Properties

| Requirement                    | Implementation                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| Toolbar role                   | Container has role `toolbar`.                                                            |
| Accessible name                | Toolbar has accessible name via `aria-labelledby` or `aria-label`.                       |
| Orientation                    | If vertical, set `aria-orientation="vertical"`. Default is `horizontal`.                 |
| Control roles                  | Controls within use their respective patterns (button, menu button, checkbox, etc.).     |
| Disabled controls _(Optional)_ | Disabled controls may be focusable to aid discoverability, using `aria-disabled="true"`. |
