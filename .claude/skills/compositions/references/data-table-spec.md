# Data Table — Design Spec

## 1. Overview

A data table is a columnar data grid displaying records as rows with typed cells, sortable and filterable column headers, row selection, and row-level actions. It answers: **"What records exist and what are their attributes?"**

**Authorities and scope.** This spec is the _design authority_ for any data-table-like UI in karuna, regardless of implementation — `aiux-list`, `now-list-lit`, or manual. The **list component itself** (props, events, internal mechanics, token compliance) is owned by the list team; the token rules that matter at design review are restated in the Token Compliance checks (T-01–T-10). **View controls** (chip / pill / dropdown / segmented control / tabs above the table) are governed by `@patterns/SKILL.md`. This spec focuses on design intent; the list team focuses on implementation.

This spec governs anatomy, header composition, column types and rendering, column header rules, selection model, view context adaptations, search placement, and accessibility. View controls (chip / pill / dropdown / segmented control / tabs above the table) are governed by `@patterns/SKILL.md` — this spec hosts them in the table's chrome and gates them per intent tier (§ 4.2). It does NOT govern component API internals (cell renderer implementation, controller logic, GQL services), individual cell styling (DaisyUI `aiux-badge` is component-level), or action rendering handled by `now-list-lit` (row actions, column header menu, cell hover/right-click — platform-owned). For manual tables, action rendering delegates to the contextual-actions spec.

## 2. Framework Selection

Use `aiux-list` for all new data tables when the data source is GraphQL-backed. It handles columns, rows, pagination, sorting, and filtering through the backend — the consuming team only owns the page shell (header, filter tabs, action buttons). Because the platform owns the internals, there is less to build, less to govern, and fewer composition violations.

Use `now-list-lit` only when you need local control over column definitions or row construction — for example, when the data source is not GraphQL-backed, or when the column set is dynamically assembled in the client.

Do not build a manual table unless neither platform component is appropriate. Manual tables require validating everything: cell rendering, column alignment, selection, sorting, ARIA grid pattern, and token compliance throughout. They produce the most violations.

| Path                        | When to use                                                   | What the team owns                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`aiux-list` (connected)** | Data source is GraphQL. **Prefer this.**                      | Page shell (header, filter tabs, action buttons), ARIA on filter controls, token compliance in chrome. Column/cell/sort/pagination are backend-owned. |
| **`now-list-lit`**          | Local column definitions required, or non-GraphQL data source | Column definition correctness, toolbar composition, token compliance in shell, ARIA on wrapper and controls                                           |
| **Manual / hybrid**         | No platform component is appropriate                          | Everything: cell rendering, column alignment, selection, sorting, ARIA grid pattern, token compliance throughout                                      |

## 3. Anatomy

A data table is composed of three structural zones: **Header**, **Body**, and **Footer**.

```
+--------------------------------------------------------------+
| Header                                                       |
|  Title . Count . [Icon buttons] . [Labeled buttons]          |
|  +----------------------------------------------------------+ |
|  | Action Bar                                               | |
|  |  [filter] [search] [refresh] [edit cols] ... [New item]  | |
|  +----------------------------------------------------------+ |
+--------------------------------------------------------------+
| Body                                                         |
|  Column headers                                              |
|  [Checkbox] . Cell . Cell . Cell . [Row actions]             |
|  [Checkbox] . Cell . Cell . Cell . [Row actions]             |
+--------------------------------------------------------------+
| Footer                                                       |
|  [Counter label] . [Page controls] . [Page size dropdown]    |
+--------------------------------------------------------------+
```

### 3.1 Header

The header renders as a single row. The left region contains the **title** and **record count**. The right region contains the **action bar**.

The action bar is a single component (`<aiux-record-list-actionbar>`) rendering two categories of items in sequence: **icon buttons** (filter, search, refresh, edit columns, copy URL) followed by **labeled buttons** (domain-specific actions passed via `actionNodes[]`). Icon buttons always appear before labeled buttons. Manual implementations must follow the same sequence.

For action composition rules, see the `contextual-actions` spec.

### 3.2 Body

Column headers and data rows. See [Column Header Anatomy](#5-column-header-anatomy) for column-level rules. See [Column Types](#6-column-types) for cell rendering per type. Empty / loading / error renders follow `@patterns/SKILL.md`.

### 3.3 Footer

Pagination controls rendered by `<aiux-pagination>`. The footer contains three elements:

1. **Counter label** — "Showing 1-10 of 80"
2. **Page controls** — first, previous, page number range, next, last
3. **Page size dropdown** — user selects how many records appear per page

## 4. View Contexts

View context is determined by **design intent**, not pixel width. A widget designed to show a preview follows Preview rules even if it renders in a wide container. A full-page table on a narrow screen follows Primary rules and scrolls horizontally — it doesn't lose features because the viewport is small.

### 4.1 Intent Tiers

| Tier              | Design intent                                                | Examples                                                               |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Preview**       | Summary or preview of data — not the primary working surface | Cards, widgets, narrow side panels, embedded previews, dashboard lists |
| **Supplementary** | Supporting content alongside other primary content           | Wide side panels, half-page layouts, detail pane lists                 |
| **Primary**       | The main working surface — user's primary task is this table | Full-page lists, primary content area                                  |

**How to identify intent:** If the table has an expand affordance ("View all", "See more", a link to a dedicated page), shares the page with other primary content, or row click / navigation is the primary interaction — it is **Preview**. If the table is the only content on the page and the user's task is to work with the records — it is **Primary**. Everything in between is **Supplementary**.

### 4.2 What Each Tier Allows

|                     | Preview                                                                           | Supplementary                                                                     | Primary                                                                                   |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Max columns**     | 3-4 (guideline)                                                                   | 5-7 (guideline)                                                                   | No limit (all configured columns)                                                         |
| **Header actions**  | Minimal — filter chips only                                                       | Search + filter + sort                                                            | Full — search, filter, column picker, display options, refresh                            |
| **Filter**          | Chips/pills above the table                                                       | Chips/pills or dropdown                                                           | Panel, inline controls, or chips/pills                                                    |
| **Sort**            | Column header sort                                                                | Column header sort                                                                | Column header sort                                                                        |
| **Search**          | None or toolbar-level only                                                        | Toolbar-level                                                                     | Toolbar-level + per-column (column controls row)                                          |
| **Pagination**      | Page counter + first/prev/next/last + page numbers. No records-per-page dropdown. | Page counter + first/prev/next/last + page numbers. No records-per-page dropdown. | All controls: page counter, first/prev/page numbers/next/last, records-per-page dropdown. |
| **Selection**       | None                                                                              | Optional — single or multi                                                        | Full — checkbox column, multi-select, select-all, selection-aware action bar              |
| **Row actions**     | None                                                                              | Max 1 action. Rest collapse into overflow menu.                                   | Max 3 actions.                                                                            |
| **Column picker**   | No                                                                                | No                                                                                | Yes                                                                                       |
| **Display options** | No                                                                                | No                                                                                | Yes (density, visible columns)                                                            |
| **Outer container** | Card recipe governs shell                                                         | Depends on context                                                                | Table is the primary content — no card shell                                              |

**Column count and available width:** The column numbers above are guidelines for typical container sizes, not hard caps. A Preview table in a wide dashboard container may show more than 4 columns if the width supports it. The rule is: Preview and Supplementary tables should not require horizontal scrolling — show as many columns as fit comfortably. Primary tables may scroll horizontally.

**"Card recipe governs shell" means the `aiux-card` / `aiux-card-body` shell — both classes together, never one substituted for a hand-authored `<div>`.** A Preview-tier table's outer container must use `aiux-card` on the outer element and `aiux-card-body` on the content wrapper (per the `aiux-card` spec's shell rule). A `<div class="aiux-card">` wrapping a plain padded `<div>` — or a hand-rolled `<div class="bg-surface-primary rounded-xl border shadow-sm">` with no `aiux-card`/`aiux-card-body` classes at all — is not a valid shell in either case.

### 4.3 Narrow Viewport Behavior

Intent determines the feature set. Viewport width determines the **layout strategy**.

A **Primary** table on a narrow screen does not become Preview. It retains all Primary features and adapts layout:

- Horizontal scroll for columns that don't fit
- All controls remain available (search, filter, selection, column picker)
- Column count is not reduced — the user scrolls to see additional columns

A **Preview** table on a wide screen does not become Primary. It stays Preview:

- ❌ Condition builder, column picker, full-text search, row selection, copy URL, display options, AI filter assist
- ✅ Column header sort, preset filter chips, basic pagination, refresh (optional), max 1 inline row action (navigate/open)

## 5. Column Header Anatomy

### 5.1 Sort Indicators

If a column is sorted, the column header must show the current sort state — regardless of how the sort was triggered.

| Concern       | What it is                             | Examples                                           |
| ------------- | -------------------------------------- | -------------------------------------------------- |
| **Trigger**   | How the user initiates a sort          | Column header click, dropdown, toggle control      |
| **Indicator** | How the table shows current sort state | Arrow/chevron icon next to the column header label |

The trigger may vary. The indicator does not. A user must be able to determine which column is sorted and in which direction by looking at the column headers alone.

This applies the cross-cutting indicator-persistence principle from `@patterns/SKILL.md` § Per-behavior rules → Sort to data-table column headers specifically. The principle holds for any view control that triggers a sort.

**ARIA:**

- Sorted ascending: `aria-sort="ascending"`
- Sorted descending: `aria-sort="descending"`
- Sortable, unsorted: `aria-sort="none"`
- Non-sortable: omit `aria-sort`

### 5.2 Alignment Rules

Column alignment is type-driven:

| Column type                     | Alignment      | Why                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------- |
| Text (string, description)      | Left           | Reading direction                                             |
| Number (count, score, currency) | Right          | Decimal alignment for comparison                              |
| Date / Timestamp                | Left           | Reading direction (dates are textual)                         |
| Status / Choice                 | Left or Center | Badge alignment — left for label+badge, center for badge-only |

### 5.3 Column Width

Column widths use intentional patterns, not arbitrary pixel values.

| Approach                         | When to use                                            | Example                                     |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Flexible (`1fr`, `2fr`)          | Default — columns share available space proportionally | Description, name columns                   |
| Fixed (`80px`, `120px`)          | Fixed-width content                                    | Selection column, date column, status badge |
| Min-width (`minmax(120px, 1fr)`) | Columns that need a floor but can grow                 | Any text column that might truncate         |

## 6. Column Types

Column type is set on the column definition (`column.type`) and resolved through `CellRendererRegistry`. Every cell in a column uses the same renderer.

### 6.1 Registered Types

| Type                       | Renderer                       | Default behavior                                                                                     |
| -------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `string`                   | `StringCellRenderer`           | Plain text, truncated to `maxCharacters` (default 4000)                                              |
| `number`                   | `NumberCellRenderer`           | Numeric value, right-aligned                                                                         |
| `currency`                 | `CurrencyCellRenderer`         | Locale-aware currency; cells right-aligned, headers left-aligned; optional globe toggle              |
| `date` + all date subtypes | `DateCellRenderer`             | Formatted date; supports `date`, `datetime`, `time`, `relative` formats                              |
| `choice`                   | `ChoiceCellRenderer`           | Mapped label with optional icon; auto-promotes to badge when `highlightedValueMap` matches           |
| `aiux-link`                | `LinkCellRenderer`             | `aiux-link aiux-link-hover aiux-link-primary` — dispatches `CELL_LINK_CLICKED`, no native navigation |
| `person`                   | `PersonCellRenderer`           | Name, avatar, or both; falls back to name when no `imageSrc`                                         |
| `url`                      | `URLCellRenderer`              | External URL link                                                                                    |
| `highlighted-value`        | `HighlightedValueCellRenderer` | Colored badge (pill) with semantic color and intensity variant                                       |
| `custom-cell`              | `CustomCellRenderer`           | Consumer-provided rendering                                                                          |

Unknown types fall back to `StringCellRenderer`.

### 6.2 Highlighted Values (Badge Treatment)

Use a maximum of 2 highlighted value columns per table. More than 2 reduces scannability.

Badges use a semantic color palette with three intensity variants:

| Variant              | DaisyUI / Tailwind             | Use when                                                               |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `primary` (filled)   | e.g. `bg-red-600 text-white`   | Value demands immediate attention — critical severity, blocking status |
| `secondary` (medium) | e.g. `bg-red-300 text-red-900` | Operationally relevant but not urgent                                  |
| `tertiary` (subtle)  | e.g. `bg-red-100 text-red-800` | Informational — default variant when in doubt                          |

Semantic colors: `critical`, `high`, `warning`, `moderate`, `positive`, `info`, `low`. Extended palette: `teal`, `purple`, `magenta`, `pink`, `orange`, `blue`, `gray`, and others. Custom hex codes supported.

Choice columns auto-promote to badge rendering via `column.highlightedValueMap` — no type change needed.

**Hex codes above describe `HighlightedValueCellRenderer`'s own internal implementation — not what to write when hand-authoring a table.** When building a manual/hybrid table (§ 2), render highlighted values as plain DaisyUI badges: `aiux-badge aiux-badge-soft aiux-badge-{semantic}` (e.g. `aiux-badge-error` for critical, `aiux-badge-warning` for high). Do not define custom CSS or inline styles with hex values to match the intensity variant — that duplicates and overrides the token system rather than using it.

### 6.3 Link Cells

Links render as `aiux-link aiux-link-hover aiux-link-primary`. Clicking dispatches `NOW_LIST_LIT#CELL_LINK_CLICKED` and calls `preventDefault()` — the consumer handles navigation. Links can be disabled at column or cell level (`config.disabled`), rendering as plain text. The record identifier column (e.g., `number`) is always a link cell.

### 6.4 Person Cells

| Display mode     | Renders                                 | Fallback                   |
| ---------------- | --------------------------------------- | -------------------------- |
| `name` (default) | Clickable name link                     | -                          |
| `avatar`         | Round avatar image (`w-6 rounded-full`) | Name link if no `imageSrc` |
| `both`           | Avatar + name side by side              | Name link if no `imageSrc` |

Dispatches `CELL_LINK_CLICKED` like link cells. Can be disabled at column or cell level.

**Do not tint an avatar's background with a raw semantic color class (`bg-error`, `bg-warning`, `bg-info`) to convey status.** That is a hardcoded color assignment on a non-component surface. If a row's severity/status must be visible alongside the person cell, render it as its own badge (`aiux-badge-soft aiux-badge-{semantic}`, see § 6.2) next to the avatar — never by coloring the avatar container itself.

### 6.5 Date Cells

| Format           | Use when                                      |
| ---------------- | --------------------------------------------- |
| `date` (default) | Date only — created, due, last updated        |
| `datetime`       | Timestamp matters — audit logs, event history |
| `time`           | Time only                                     |
| `relative`       | Recency matters — "2 days ago", "just now"    |

Timezone-aware via browser timezone by default, overridable per column. Short date format strips seconds and current year.

### 6.6 Choice Cells

Maps raw values to display labels via `config.options[]`. Supports optional icon per option. Renders as plain text by default; auto-promotes to badge via `column.highlightedValueMap`. Empty values render as `-`.

### 6.7 Currency Cells

Pure pass-through renderer — displays the pre-formatted `displayValue` or `value` as-is, consistent with other cell renderers. No client-side formatting or config props. Cells are right-aligned by default; headers remain left-aligned.

In connected mode, the GQL adapter normalizes all ServiceNow monetary types (`currency`, `currency2`, `price`) to `type: 'currency'`. The original type is preserved on `meta.internalType`. The server provides the formatted display string.

### 6.8 Text Wrapping

Default: single-line, `whitespace-nowrap truncate`. Wrap mode: `line-clamp-5 break-words h-auto`. Character truncation appends `....` when `maxCharacters` is exceeded. Tooltip shows full value when content is truncated or wrapped.

## 7. Selection Model

### 7.1 When to Include Selection

Include selection when the table supports actions on multiple records (e.g., move, assign, export). If there are no multi-record actions, omit selection. Do not include selection in Preview view context.

### 7.2 Checkbox Column

The checkbox column is always the **first column** (before the identifier). Header checkbox enables select-all (`selectAllEnabled`). Disabled rows (`disabledRows`) render a disabled checkbox — not an absent one.

### 7.3 Selection-Aware Actions (Current Implementation)

There is no standalone bulk action bar component. The header action bar (`<aiux-record-list-actionbar>`) is always present. When rows are selected:

1. **Action buttons enable/disable** based on selection state (`disabled: !this._hasSelection`)
2. **Dropdown headerText** shows the selected count (e.g., `"2 Selected"`)
3. **Menu items** become actionable only when rows are checked

> **Future:** A dedicated bulk action bar is planned but not yet implemented. When it ships, this section will be updated.

**The header toolbar and the selection-aware action bar follow different button-role rules — do not apply one's pattern to the other.** The header toolbar (icon buttons + labeled buttons, § 3.1) is a contextual-actions composition: equal-weight peers, uniformly `aiux-btn-ghost`. The selection-aware action bar that appears once rows are checked is an **action-set** composition (governed by the `action-set` spec): its buttons carry a role hierarchy — the completion action is `aiux-btn-primary`, and the dismissive action (e.g. "Cancel Selection") is `aiux-btn-secondary`, never `aiux-btn-ghost`. When a table has both a toolbar and a bulk-selection action bar visible at once, they are two separate compositions stacked in the header — each keeps its own button treatment; `aiux-btn-ghost` from the toolbar must not bleed into the action set below it.

## 8. View Controls

Chip / pill / dropdown / segmented control / tabs above the table are governed by `@patterns/SKILL.md`. That pattern owns:

- The decision matrix — which control for which behavior (filter / sort / group-by / dataset-switch)
- The four behaviors and their selection models
- ARIA routing per control + selection mode
- Anti-patterns: mixing functionalities in one control, inconsistent controls across surfaces, same control used for different functions

Within a data table specifically, the toolbar (above the column headers) is at **composition altitude** — controls there scope the table's data. **Per-column controls** (column-header sort, column-header filter, column-header menu) are composition-internal and governed by this spec — see [§ 5 Column Header Anatomy](#5-column-header-anatomy).

### 8.1 Search Placement

| Placement                                | Valid | Use when                                                              |
| ---------------------------------------- | ----- | --------------------------------------------------------------------- |
| Header                                   | Yes   | Global search across all columns                                      |
| Column filter row (below column headers) | Yes   | Per-column filtering, rendered in `now-list-lit` column controls slot |
| Between column headers and data rows     | No    | No valid use — move to header or column filter row                    |

## 9. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. For sub-component accessibility, see `@components/SKILL.md`. This section covers only composition-level decisions.

- **APG pattern:** Grid — see `@accessibility` for the canonical keyboard interaction model.
- **`role="grid"`, NOT `role="table"`.** ServiceNow tables are interactive (clickable rows, sortable headers, selectable checkboxes, cell actions), which requires the grid pattern. The grid pattern commits to full arrow-key cell navigation.

### 9.1 Chip Controls Above the Table

ARIA per chip behavior — including container vs chip roles for each of filter / sort / group-by / dataset-switch — is governed by `@patterns/SKILL.md` § Accessibility routing.

### 9.2 Search Inputs

Global search: `aria-label="Search [table name]"` or a visible label. Column filter search: `aria-label="Search [column name]"` or labeled by the column header via `aria-labelledby`.

### 9.3 Selection Checkboxes

- Header checkbox: `aria-label="Select all rows"`.
- Row checkbox: `aria-label="Select [record identifier]"` — not generic "Select row".

## 10. Scope Boundary

This spec covers the data table composition — anatomy, header, column types, column headers, selection model, view contexts, search placement, and accessibility.

It does **not** cover:

- **View controls** (chip / pill / dropdown / segmented control / tabs above the table — which control for which behavior, ARIA per behavior, anti-patterns) — see `@patterns/SKILL.md`
- **Action rendering** (row actions, cell menu, selection-aware action bar) — see `contextual-actions` spec and `action-set` spec
- **Pagination component internals** — see cross-cutting pagination sub-pattern (not yet defined)
- **Column picker dialog** — see `dialog` spec (not yet shipped)
- **Component API** (props, events, GQL services) — see `karuna/components/list` docs
- **Token compliance and violation checks** — see `data-table` SKILL.md

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above. Used by `@compositions/SKILL.md` during validation.

### Structural checks

| #    | Check                                 | Spec section                  | Description                                                                                                                                                                                                                                 |
| ---- | ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Data table vs. item-group             | § 3 Anatomy                   | Is this a data table and not an item-group? Confirm rows have uniform attributes displayed in aligned positions.                                                                                                                            |
| S-02 | Action bar button order               | § 3.1 Header                  | Do icon buttons appear before labeled buttons in the action bar?                                                                                                                                                                            |
| S-03 | Checkbox column first                 | § 7 Selection Model           | Is the checkbox column the first column when selection is enabled?                                                                                                                                                                          |
| S-04 | Selection-aware action bar            | § 7 Selection Model           | When rows are selected, do header action bar buttons enable and show the selected count (e.g., dropdown headerText "N Selected")?                                                                                                           |
| S-05 | Card shell classes on outer container | § 4.2 What Each Tier Allows   | If the outer container is a card (Preview tier), does it use `aiux-card` AND `aiux-card-body` together — not a hand-authored `<div>` with utility classes, and not `aiux-card` alone without `aiux-card-body`?                              |
| S-06 | Toolbar/action-set role separation    | § 7.3 Selection-Aware Actions | When a header toolbar and a selection-aware action bar both appear, does each keep its own button-role rule — toolbar uniformly `aiux-btn-ghost`, action bar role-hierarchy (`aiux-btn-primary`/`aiux-btn-secondary`, no `aiux-btn-ghost`)? |

### Container context checks

| #    | Check                               | Spec section                               | Description                                                                                                                                                                    |
| ---- | ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-01 | View context identified             | § 4 View Contexts                          | Is the view context identified (Preview / Supplementary / Primary)?                                                                                                            |
| C-02 | Column count within tier            | § 4.2 What Each Tier Allows                | Is column count appropriate for the tier and available width? (Preview: ~3-4, Supplementary: ~5-7 — guidelines, not hard caps. No horizontal scroll in Preview/Supplementary.) |
| C-03 | Selection omitted in Preview        | § 4.2 What Each Tier Allows                | Is selection omitted in Preview context?                                                                                                                                       |
| C-04 | Records-per-page dropdown tier      | § 3.3 Footer                               | Is the records-per-page dropdown omitted in Preview and Supplementary?                                                                                                         |
| C-05 | Preview authoring features stripped | § 4 View Contexts                          | If Preview tier, are authoring features stripped? No condition builder, column picker, full-text search, selection, or copy URL.                                               |
| C-06 | Highlighted value column count      | § 6.2 Highlighted Values (Badge Treatment) | Does the table have more than 2 highlighted value columns? Flag if > 2.                                                                                                        |

### Layout checks

| #    | Check                            | Spec section                                       | Description                                                                                                     |
| ---- | -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| L-01 | Column alignment type-driven     | § 5.2 Alignment Rules                              | Is column alignment type-driven? (text: left, number: right, date: left, status: left or center)                |
| L-02 | Column width intentional pattern | § 5.3 Column Width                                 | Do column widths use intentional patterns (flex, fixed, minmax) rather than arbitrary fixed values?             |
| L-03 | Search placement                 | § 8.1 Search Placement                             | Is search placed in the list header action bar or column filter row — not between column headers and data rows? |
| L-04 | Chip group has visible label     | `@patterns/SKILL.md` § Per-behavior rules → Filter | Does every chip group above the table have a visible label? Rule lives in the view-controls pattern.            |

### Visual / Semantic checks

| #    | Check                                                 | Spec section                                                   | Description                                                                                                                                                                                                                                                                        |
| ---- | ----------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Sort indicator present when sorted                    | § 5.1 Sort Indicators                                          | If a column is sorted, does the column header show a sort indicator regardless of how the sort was triggered?                                                                                                                                                                      |
| V-02 | aria-sort attribute correct                           | § 5.1 Sort Indicators                                          | Do sorted column headers have correct `aria-sort` attribute? Note: `now-list-lit` does not set this automatically — consumer must set it.                                                                                                                                          |
| V-03 | Chip ARIA pattern matches behavior                    | `@patterns/SKILL.md` § Accessibility routing                   | Do chip controls above the table use the correct ARIA pattern for their behavior (filter, group, sort, dataset switch)? Rule lives in the view-controls pattern.                                                                                                                   |
| V-04 | Header checkbox aria-label                            | § 9.3 Selection Checkboxes                                     | Does the header checkbox have `aria-label="Select all rows"`?                                                                                                                                                                                                                      |
| V-05 | Row checkbox aria-label specific                      | § 9.3 Selection Checkboxes                                     | Does each row checkbox have `aria-label="Select [record identifier]"` — not generic "Select row"?                                                                                                                                                                                  |
| V-06 | Chip group single behavior                            | `@patterns/SKILL.md` § Anti-patterns                           | Does each chip group serve a single behavior? A chip set must not mix behaviors. Rule lives in the view-controls pattern.                                                                                                                                                          |
| V-07 | One trigger per concern                               | § 5.1 Sort Indicators, § 8 View Controls                       | Does any concern (sort, filter, group by) have multiple triggers? E.g. a sort toggle AND sortable column headers, or chip filters AND a search box filtering the same scope. One trigger per concern — external sort controls are only valid when the table has no column headers. |
| V-08 | Highlighted values/avatars use badge classes, not hex | § 6.2 Highlighted Values (Badge Treatment), § 6.4 Person Cells | Do highlighted-value cells use `aiux-badge-soft aiux-badge-{semantic}` rather than custom CSS/hex matching the intensity variant? Do person-cell avatars avoid tinting their background with `bg-error`/`bg-warning`/`bg-info` to convey status?                                   |

### Token Compliance checks

| #    | Check                | Spec section                                                   | Description                                                                                                                      |
| ---- | -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | SVG icon fill/stroke | List component token rules | Correct: `currentColor` or DaisyUI class. Common violation: `fill="#25CB40"` hardcoded.                                          |
| T-02 | Secondary/muted text | List component token rules | Correct: `text-text-tertiary`. Common violation: `text-slate-600`, `text-slate-700`.                                             |
| T-03 | Standard border      | List component token rules | Correct: `border-base-300`. Common violation: `border-slate-200`, `border-gray-200`.                                             |
| T-04 | Hover border         | List component token rules | Correct: `border-base-content/20` or `hover:border-base-300`. Common violation: `hover:border-gray-300`.                         |
| T-05 | Heading text         | List component token rules | Correct: `text-text-primary`. Common violation: `color: #333`.                                                                   |
| T-06 | Accent/link text     | List component token rules | Correct: `text-primary`. Common violation: `color: #667eea`.                                                                     |
| T-07 | Primary shades       | List component token rules | Correct: `text-primary` or `text-primary/70`. Common violation: `text-primary-700`.                                              |
| T-08 | Background tokens    | List component token rules | Correct: DaisyUI class (`bg-transparent`, `bg-base-100`). Common violation: `style="--color-background-secondary: transparent"`. |
| T-09 | Column widths        | § 5.3 Column Width                                             | Correct: intentional pattern (flex/fixed/minmax). Common violation: all arbitrary fixed: `'80px'`, `'120px'`, `'150px'`.         |
| T-10 | Typography scale     | List component token rules | Correct: DaisyUI text scale (`text-sm`, `text-base`, `text-lg`). Common violation: `text-3xl leading-9` fixed.                   |

---

## Resolution Guidance

### S-01: Not a data table — reclassify as item-group

This component renders self-contained items, not uniform rows with aligned attributes — it is an item-group, not a data table. Flag this classification mismatch but continue running checks against the data-table recipe.

### S-02: Action bar order incorrect

Action bar button order is incorrect. Icon buttons (filter, search, refresh, edit columns, copy URL) must appear before labeled domain-specific buttons. Reorder `actionNodes[]` or toolbar items. See § 3.1 Header.

### S-03: Checkbox column is not first

The checkbox column must be the first column, before the record identifier. Move it to index 0 in the `COLUMNS` array or column config. See § 7 Selection Model.

### S-04: Selection-aware actions not responding to selection state

Header action bar buttons must enable/disable based on selection state. Use `customActions.headerActions` with `disabled: !this._hasSelection` on each action item. Dropdown buttons should show selected count via `headerText` (e.g., `"${count} Selected"`). See § 7 Selection Model.

### S-05: Card shell missing or incomplete

Replace the hand-authored container with `aiux-card` on the outer element and `aiux-card-body` on the content wrapper — both classes together. See § 4.2 What Each Tier Allows.

### S-06: Action-set button borrowed the toolbar's ghost treatment

The selection-aware action bar is an action-set, not a contextual toolbar. Change its dismissive button (e.g. "Cancel Selection") from `aiux-btn-ghost` to `aiux-btn-secondary`, and keep its completion button `aiux-btn-primary`. Leave the header toolbar's `aiux-btn-ghost` buttons unchanged. See § 7.3 Selection-Aware Actions.

### C-02: Too many columns for view context

This [Preview / Supplementary] table has [N] columns — above the [3-4 / 5-7] limit for this tier. Remove lower-priority columns or hide them behind the column picker. See § 4.2 What Each Tier Allows.

### C-03: Selection present in Preview context

Selection must be omitted in Preview context. Remove the checkbox column and selection-aware actions. See § 4.2 What Each Tier Allows.

### C-04: Records-per-page dropdown present in Preview or Supplementary

Hide the records-per-page dropdown in Preview and Supplementary contexts. See § 3.3 Footer.

### C-05: Preview tier with authoring features enabled

This is a Preview-tier table. Disable authoring features: `showConditionBuilderButton: false`, `showEditColumnsButton: false`, `showZingSearch: false`, `selectionEnabled: false`, `showCopyURLButton: false`. See § 4 View Contexts.

### C-06: More than 2 highlighted value columns

Table has [N] highlighted value columns — max is 2. Demote lower-priority columns to plain choice or string type. See § 6.2 Highlighted Values (Badge Treatment).

### L-01: Column alignment not type-driven

Fix column alignment per type: text → left, number → right, date → left, status/choice → left or center. See § 5.2 Alignment Rules.

### L-02: Arbitrary fixed column widths

Replace arbitrary fixed widths with intentional patterns: `1fr`/`2fr` for text/name columns, fixed (80px, 120px) only for checkbox/date/badge, `minmax(120px, 1fr)` for text that may truncate. See § 5.3 Column Width.

### L-03: Search misplaced

Move search into the list header action bar. Search between column headers and data rows is a violation at all tiers. See § 8.1 Search Placement.

### L-04: Chip group missing visible label

See `@patterns/SKILL.md` § Per-behavior rules → Filter for the visible-label requirement (and the active-count format in `aria-label` when filters are applied).

### V-01: Sorted column missing sort indicator

Add a sort indicator (ascending/descending arrow) to the sorted column header. Must reflect sort state regardless of how the sort was triggered. See § 5.1 Sort Indicators.

### V-02: Missing or incorrect aria-sort

`now-list-lit` does not set `aria-sort` automatically — set it manually. Sorted column: `aria-sort="ascending"` or `"descending"`. Sortable unsorted: `aria-sort="none"`. Non-sortable: omit `aria-sort` entirely. See § 5.1 Sort Indicators.

### V-03: Chip controls using wrong ARIA pattern

See `@patterns/SKILL.md` § Accessibility routing for ARIA per chip behavior (container vs chip roles for each: filter / sort / group-by / dataset-switch).

### V-04: Header checkbox missing aria-label

Add `aria-label="Select all rows"` to the header checkbox. See § 9.3 Selection Checkboxes.

### V-05: Row checkboxes have generic aria-label

Replace `aria-label="Select row"` with `aria-label="Select [record identifier]"` bound to the record's identifier field (e.g. ticket number, asset tag). See § 9.3 Selection Checkboxes.

### V-06: Chip group mixes behaviors

See `@patterns/SKILL.md` § Anti-patterns — _Mixing functionalities in one control_ covers this rule for chip groups and other controls.

### V-08: Hardcoded colors on highlighted values or avatars

Replace custom CSS/hex definitions on highlighted-value badges with `aiux-badge-soft aiux-badge-{semantic}`. Replace a status-tinted avatar background (`bg-error`/`bg-warning`/`bg-info` on the avatar container) with a separate badge next to the avatar. See § 6.2 and § 6.4.

### T-01 – T-10: Token violations

Replace hardcoded values with DaisyUI tokens:

- SVG fill/stroke: hex → `currentColor`
- Muted text: `text-slate-600`/`700` → `text-text-tertiary`
- Borders: `border-slate-200`/`gray-200` → `border-base-300`
- Hover borders: `hover:border-gray-300` → `hover:border-base-300`
- Heading: `color:#333` → `text-text-primary`
- Link/accent: hardcoded hex → `text-primary`
- Primary shades: `text-primary-700` → `text-primary/70`
- Background: inline CSS vars → `bg-base-100` / `bg-transparent`
