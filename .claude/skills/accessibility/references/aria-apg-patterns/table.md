# Table

## Pattern Usage

Like an HTML table element, a WAI-ARIA table is a static tabular structure containing one or more rows that each contain one or more cells. It is not an interactive widget. For interactive tabular data, use the Grid pattern instead.

**Authors are strongly encouraged to use native HTML `<table>` elements.**

## Keyboard Interaction

Not applicable—table is not an interactive widget. Focusable elements within cells follow standard focus behavior.

## WAI-ARIA Roles, States, and Properties

| Requirement              | Implementation                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Table role               | Container has role `table`.                                                                                                |
| Row role                 | Each row has role `row`.                                                                                                   |
| Cell roles               | Cells have role `cell`, `columnheader`, or `rowheader`.                                                                    |
| Accessible name          | Table has accessible name via `aria-labelledby` or `aria-label`.                                                           |
| Description _(Optional)_ | `aria-describedby` may reference a caption or description.                                                                 |
| Sort indicator           | For sortable columns, header has `aria-sort` (`ascending`, `descending`, `other`, `none`).                                 |
| Row/column count         | If rows/columns are hidden or dynamically loaded, use `aria-rowcount`/`aria-colcount` and `aria-rowindex`/`aria-colindex`. |
| Spanning cells           | Use `aria-rowspan` and `aria-colspan` for merged cells.                                                                    |

---

## Forced Colors Requirements

### Table

```css
@media (forced-colors: active) {
  .table {
    forced-color-adjust: none;
    border: 2px solid ButtonBorder;
  }

  /* ========================================
     HEADER CELLS
     ======================================== */
  .table th {
    background-color: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonBorder;
  }

  /* ========================================
     DATA CELLS
     ======================================== */
  .table td {
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid ButtonBorder;
  }

  /* ========================================
     ROW FOCUS
     ======================================== */
  .table tr:focus-within {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SORTABLE HEADER - BASE STATE
     ======================================== */
  .table th[aria-sort] {
    cursor: pointer;
  }

  .table th[aria-sort] svg,
  .table th[aria-sort] [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     SORTABLE HEADER - HOVER STATE
     ======================================== */
  .table th[aria-sort]:hover {
    background-color: Highlight;
    color: HighlightText;
  }

  .table th[aria-sort]:hover svg,
  .table th[aria-sort]:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     SORTABLE HEADER - FOCUS STATE
     ======================================== */
  .table th[aria-sort]:focus,
  .table th[aria-sort]:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SORTABLE HEADER - ACTIVE SORT STATE
     ======================================== */
  .table th[aria-sort='ascending'],
  .table th[aria-sort='descending'] {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .table th[aria-sort='ascending'] svg,
  .table th[aria-sort='descending'] svg,
  .table th[aria-sort='ascending'] [class*='icon'],
  .table th[aria-sort='descending'] [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED ROW
     ======================================== */
  .table tr[aria-selected='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .table tr[aria-selected='true'] td {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  .table tr[aria-selected='true'] svg,
  .table tr[aria-selected='true'] [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED ROW + FOCUS
     ======================================== */
  .table tr[aria-selected='true']:focus-within {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
```
