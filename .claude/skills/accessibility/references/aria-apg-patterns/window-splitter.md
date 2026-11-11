# Window Splitter

## Pattern Usage

A window splitter is a moveable separator between two sections, or panes, of a window that enables users to change the relative size of the panes.

## Keyboard Interaction

| Key                  | Function                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `Left Arrow`         | Moves splitter left, decreasing size of left/top pane.                                       |
| `Right Arrow`        | Moves splitter right, increasing size of left/top pane.                                      |
| `Up Arrow`           | Moves splitter up, decreasing size of top/left pane.                                         |
| `Down Arrow`         | Moves splitter down, increasing size of top/left pane.                                       |
| `Home`               | Moves splitter to position giving minimum size to pane that precedes splitter.               |
| `End`                | Moves splitter to position giving maximum size to pane that precedes splitter.               |
| `Enter` _(Optional)_ | Toggles between current position and a collapsed position (e.g., minimum size for one pane). |

## WAI-ARIA Roles, States, and Properties

| Requirement        | Implementation                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| Separator role     | Splitter has role `separator` with `tabindex="0"` (focusable).          |
| Current value      | `aria-valuenow` indicates current position (percentage or pixel value). |
| Value range        | `aria-valuemin` and `aria-valuemax` indicate the allowable range.       |
| Orientation        | `aria-orientation` is `horizontal` or `vertical`.                       |
| Controls reference | `aria-controls` references the ID(s) of the pane(s) being resized.      |
| Accessible name    | Splitter has accessible name via `aria-labelledby` or `aria-label`.     |
