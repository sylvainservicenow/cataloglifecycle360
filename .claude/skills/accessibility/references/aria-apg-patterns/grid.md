# Grid

## Pattern Usage

A grid widget is a container that enables users to navigate the information or interactive elements it contains using directional navigation keys, such as arrow keys, Home, and End. It differs from a table in that a grid is interactive—cells may contain focusable elements or be focusable themselves.

**Grid vs. Table:** Use a table for presenting static data. Use a grid when cells contain interactive widgets or when two-dimensional keyboard navigation is beneficial. A **selectable listview** (table with row checkboxes and action buttons per row) is a grid — always use `role="grid"`.

> **`aria-selected` ownership rule:** `aria-selected` on a row element is only semantically valid when the owning container has `role="grid"` (or `role="treegrid"`). Placing `aria-selected` on `<tr>` inside a plain `<table>` with no `role` attribute has no recognized ARIA semantics. Always add `role="grid"` to the `<table>` element when using row selection.

## Required Implementation Checklist

**Complete every item before shipping. When fixing an existing grid, check each item against the current code — if the keyboard handler is missing any case, rewrite it in full using the reference implementation below rather than patching individual keys.**

### ARIA structure

- [ ] `role="grid"` on the container element (even if it is a `<table>`)
- [ ] `role="gridcell"` on every `<td>`, `role="columnheader"` on every `<th>`
- [ ] `aria-selected="true/false"` on every body `<tr>` (never on header rows)
- [ ] Grid has an accessible name via `aria-label` or `aria-labelledby`

### Row-navigation level (default mode)

- [ ] `ArrowDown` moves focus to the same column in the next row
- [ ] `ArrowUp` moves focus to the same column in the previous row
- [ ] `Enter` enters within-cell mode — focus moves to the first focusable inside the cell
- [ ] `Tab` exits the grid entirely (no `preventDefault` — let the browser handle it)

### Within-cell level (entered via Enter)

- [ ] `Escape` exits within-cell mode — focus returns to the cell element itself, **not** an element inside it
- [ ] `Tab` moves between focusable elements inside the current cell
- [ ] Entering within-cell mode is tracked with a flag (e.g. `inCellMode`) so `Escape` knows which level it is on

### Focus management

- [ ] After row deletion, focus moves to the next row's first focusable before the row is removed — if no next row, focus the previous row
- [ ] Header row controls (e.g. select-all checkbox) remain in the natural tab order — do **not** set `tabindex="-1"` on them

## Keyboard Interaction

### Two-Level Navigation Model

Grids with interactive cell content use **two navigation levels**. This is the most commonly missed implementation detail.

**Row-navigation level (default):**

- Arrow keys move focus between rows (Up/Down) and cells (Left/Right)
- `Tab` / `Shift+Tab` exits the grid entirely to the next/previous focusable element outside the grid
- `Enter` enters within-cell mode, moving focus to the first focusable element inside the focused cell
- `Space` on the checkbox cell toggles row selection

**Within-cell level (activated by Enter):**

- `Tab` moves between focusable elements within the current cell
- `Escape` returns to row-navigation level, restoring focus to the cell itself (not an element inside it)
- Standard element activation keys (Space/Enter) activate the focused control

| Key          | Row-navigation level                                          | Within-cell level                           |
| ------------ | ------------------------------------------------------------- | ------------------------------------------- |
| `Arrow keys` | Moves focus between rows/cells                                | Default browser behavior for active control |
| `Enter`      | Enters within-cell mode (focuses first focusable inside cell) | Activates focused control                   |
| `Escape`     | No effect (or closes any open overlay)                        | Returns to row-navigation level             |
| `Tab`        | Exits grid to next focusable element outside                  | Moves to next focusable within cell         |
| `Shift+Tab`  | Exits grid to previous focusable element outside              | Moves to previous focusable within cell     |
| `Space`      | Toggles selection if focused on checkbox cell                 | Activates focused control                   |

**Additional keys (row-navigation level):**

| Key           | Function                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| `Right Arrow` | Moves focus one cell to the right. Optionally wraps to first cell of next row.   |
| `Left Arrow`  | Moves focus one cell to the left. Optionally wraps to last cell of previous row. |
| `Down Arrow`  | Moves focus one cell down. Optionally wraps to top of next column.               |
| `Up Arrow`    | Moves focus one cell up. Optionally wraps to bottom of previous column.          |
| `Home`        | Moves focus to first cell in the row.                                            |
| `End`         | Moves focus to last cell in the row.                                             |
| `Ctrl + Home` | Moves focus to first cell in first row.                                          |
| `Ctrl + End`  | Moves focus to last cell in last row.                                            |

**Selection (if supported):**

| Key             | Function                                            |
| --------------- | --------------------------------------------------- |
| `Space`         | Selects/deselects the focused cell or row.          |
| `Shift + Arrow` | Extends selection in the arrow direction.           |
| `Ctrl + Space`  | Selects the column (if column selection supported). |
| `Shift + Space` | Selects the row (if row selection supported).       |
| `Ctrl + A`      | Selects all cells.                                  |

## WAI-ARIA Roles, States, and Properties

| Requirement      | Implementation                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grid role        | Container has role `grid`. **Required even when using a `<table>` element** for selectable grids.                                                                                                 |
| Row role         | Each row has role `row`.                                                                                                                                                                          |
| Cell roles       | Cells have role `gridcell`, `rowheader`, or `columnheader`.                                                                                                                                       |
| Accessible name  | Grid has accessible name via `aria-labelledby` or `aria-label`.                                                                                                                                   |
| Selected state   | If selection is supported, selected rows have `aria-selected="true"`. **Only valid when container has `role="grid"`** — `aria-selected` on `<tr>` inside a plain `<table>` has no ARIA semantics. |
| Sort indicator   | For sortable columns, header has `aria-sort` set to `ascending`, `descending`, `other`, or `none`.                                                                                                |
| Row/column count | If virtualized, use `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`.                                                                                                           |
| Spanning cells   | Use `aria-rowspan` and `aria-colspan` for merged cells.                                                                                                                                           |
| Read-only state  | Editable grids may use `aria-readonly` on cells or the grid.                                                                                                                                      |
