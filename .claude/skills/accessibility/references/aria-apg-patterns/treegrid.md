# Treegrid

## Pattern Usage

A treegrid widget presents a hierarchical data grid consisting of tabular information that is editable or interactive. It combines tree view features (hierarchical, expandable rows) with grid features (cells, columns, two-dimensional navigation).

## Keyboard Interaction

Combines patterns from both Tree View and Grid:

| Key           | Function                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Right Arrow` | On cell: moves to next cell. On row header with closed node: opens node. On row header with open node: moves to first cell.      |
| `Left Arrow`  | On cell: moves to previous cell. On row header with open node: closes node. On row header with closed node: moves to parent row. |
| `Down Arrow`  | Moves focus to same cell in next visible row.                                                                                    |
| `Up Arrow`    | Moves focus to same cell in previous visible row.                                                                                |
| `Page Down`   | Moves focus down by author-determined number of rows.                                                                            |
| `Page Up`     | Moves focus up by author-determined number of rows.                                                                              |
| `Home`        | Moves focus to first cell in row.                                                                                                |
| `End`         | Moves focus to last cell in row.                                                                                                 |
| `Ctrl + Home` | Moves focus to first cell in first row.                                                                                          |
| `Ctrl + End`  | Moves focus to last cell in last row.                                                                                            |
| `Enter`       | If cell is editable, enters edit mode. Otherwise, activates or opens/closes row.                                                 |

## WAI-ARIA Roles, States, and Properties

| Requirement     | Implementation                                                       |
| --------------- | -------------------------------------------------------------------- |
| Treegrid role   | Container has role `treegrid`.                                       |
| Row role        | Each row has role `row`.                                             |
| Cell roles      | Cells have role `gridcell`, `rowheader`, or `columnheader`.          |
| Expanded state  | Parent rows have `aria-expanded` to indicate open/closed state.      |
| Level           | `aria-level` indicates depth in hierarchy.                           |
| Position        | `aria-posinset` and `aria-setsize` indicate position among siblings. |
| Accessible name | Treegrid has accessible name via `aria-labelledby` or `aria-label`.  |
