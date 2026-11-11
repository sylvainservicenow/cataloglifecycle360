# Pagination

**DaisyUI base:** `join`, `btn`, `select`
**Production components:** `<aiux-pagination>` (`@servicenow/aiux-components-pagination`, data-table control) · `<aiux-pagination-nav>` (`@servicenow/aiux-components-pagination`, lightweight nav / dot indicator)
**Last updated:** 2026-07-06 · v4

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component

Pagination lets users navigate between pages of a data set when loading all records at once is impractical. Two production components cover the two intents — choose by what the surface needs:

| Use                                                                                                          | Component               | Why                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Data tables, list views, search results — needs a record range and a records-per-page control                | `<aiux-pagination>`     | Full control: range label ("Showing 1–20 of 100"), numbered buttons (or page input), and a records-per-page selector.              |
| Lightweight page navigation, or a dot position indicator for short visual sets (carousels, onboarding flows) | `<aiux-pagination-nav>` | Numbered nav (with ellipsis windowing) or `dots` mode; size is configurable (xs–xl). No range label, no records-per-page selector. |

Both render the previous/next (and optional first/last) arrows and keep the active page in context.

**Pagination vs. infinite scroll:** Use pagination when users need to navigate to a specific page or return to a known position. Infinite scroll is not a supported pattern — use pagination.

**Do not use when:**

- All items fit on a single page — hide the control entirely.
- The total record count is zero — hide it conditionally.
- Inside a modal without careful consideration — paginating within a constrained dialog creates significant usability challenges.

Carousel position dots are owned by the carousel component (`aiux-carousel-indicator`) — see `references/carousel.md`, not this sheet.

### 2. Numbered vs. dot

Choose the type by content and the precision of navigation the user needs.

| Type         | When to use                                                                                                                | Component                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Numbered** | Data tables, list views, search results — user needs to jump to a known page.                                              | `<aiux-pagination>` or `<aiux-pagination-nav>` |
| **Dot**      | Carousels, onboarding flows, media galleries — position within a short set (≤5). Position matters more than page identity. | `<aiux-pagination-nav>` with `dots`            |

### 3. Subcomponents to show

A numbered control is assembled from independently toggleable parts — decide which the surface needs. For short data sets, previous/next arrows alone may be sufficient.

| Subcomponent                  | Show when                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Previous / Next arrows**    | Almost always; navigate one page at a time.                                     |
| **Page number buttons**       | User benefits from jumping to a specific page.                                  |
| **First / Last jump buttons** | The data set is long enough that jumping to either end is useful.               |
| **Records-per-page selector** | The user should control how many records appear per page (`<aiux-pagination>`). |
| **Range label**               | The user benefits from total/position context (`<aiux-pagination>`).            |

**Page control mode:** page numbers render either as clickable buttons (default) or as a text input the user types a page number into. Use input mode when the page count is very large.

Which classes render, the windowing math, and the exact toggles (`hide*` props, `pageControlType`, `dots`, `showPrevNext` / `showFirstLast`) are owned by the components — this sheet decides only which parts the surface needs.

### 4. Sizing

`<aiux-pagination-nav>` supports five sizes — **xs, sm, md (default), lg, xl** — via its `size` property; pick the size to match the surrounding density. `<aiux-pagination>` (the data-table control) renders at the medium size only. Exact dimensions are owned by the components.

### 5. Dot pagination

Dot pagination uses filled circles to indicate position within a short visual set (typically five or fewer) — carousels, onboarding flows, media galleries. Use it only where position matters more than page identity; use numbered pagination when users need random access to a specific page.

Rendered by `<aiux-pagination-nav>` with `dots` set. The selected dot reads as filled/darker; unselected dots are lighter. Dot size follows the component's size scale (xs–xl). When the set exceeds five items, the component shows a windowed pattern with sequential arrows. Dot dimensions and the windowing math are owned by the component.

### 6. Records-per-page selector

The records-per-page control (on `<aiux-pagination>`) is a select — it follows the behavior and constraints defined in `references/select.md`. Typical options: 10, 20, 50, 100. Match options to the typical data set size and user task.

### 7. Content rules

- **Arrow icons:** chevron icons for previous/next, double-chevron icons for first/last. Reference `@patterns/references/rtl-icon-flip.md` (Planned) for directional icon flipping.
- **Page numbers:** display as plain numbers — no prefix or suffix ("3", not "Page 3").
- **Sentence case** for any visible labels (e.g., "Records per page").
- **Never truncate** page numbers or labels.
- **Range label:** display current range information (e.g., "Showing 1–20 of 100") at the inline-start of the pagination bar.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Pagination
- **Forced colors:** Follows the **interactive** pattern; active page uses `SelectedItem` / `SelectedItemText` — see `@accessibility`

**Horizon-specific design notes:**

- Wrap the control in `<nav aria-label="Pagination">`. Current page button uses `aria-current="page"`. Arrow buttons require descriptive `aria-label` ("Previous page", "Next page", "First page", "Last page"). The range label uses `aria-live="polite"` so screen readers announce page changes.

### 9. RTL

The entire control mirrors in RTL layouts -- previous/next arrows swap visual positions, and page number order reflects reading direction. Use logical properties (`inline-start` / `inline-end`) for placement within the layout; the mirroring itself is handled by the components.

### 10. Compositional constraints

- Place pagination at the block-end of the list or table it controls, aligned to the inline-end edge of the content area.
- Do not show pagination when the total record count is zero or when all records fit on one page -- hide it conditionally.
- The records-per-page selector, if shown, appears at the inline-start side of the pagination control; the range label appears at the inline-start edge.

### 11. Scope boundary

This sheet covers single pagination control decisions: which component to use, which subcomponents and type to show, content rules, and per-control accessibility. It does not govern:

- **Runtime mechanism** — exact classes, sizing dimensions, page-number windowing (centered shift vs. ellipsis), and container-query reflow are owned by `<aiux-pagination>` and `<aiux-pagination-nav>`.
- **How pagination integrates with specific list or table layouts** -- defined by composition specs.
- **Server-side data fetching or URL parameter management** -- implementation concerns outside design scope.
- **Records-per-page select behavior details** -- governed by `references/select.md`.
- **Carousel position indicators** -- governed by `references/carousel.md`.

The referencing direction is one-way: composition specs reference this sheet for pagination rules; this sheet does not reference composition specs.
