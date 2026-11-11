# View Controls

A view control is a UI affordance for **quick, predefined views** of data — it manipulates what's shown (scope, order, organization, source) without navigating away or invoking a richer query-building UI. View controls answer: "Which of these few predefined views of the data do I want to see right now?"

This pattern governs four behaviors and four controls. The decision matrix maps which control to use for which behavior. Cross-cutting consumers: data-table, card, item-group, dashboard. ARIA patterns referenced: `button.md`, `radio-group.md`, `tabs.md`, `listbox.md`, `combobox.md` (all under `@accessibility/references/aria-apg-patterns/` — `@accessibility` is a skill in the separate `@servicenow/agent-pack-aiux` pack). See [§ Accessibility routing](#accessibility-routing--apg-patterns-per-control) for per-control routing.

---

## Mental model — where view controls fit

"View control" was the original framing for everything the user can do to a data view. Refining it surfaced **five distinct categories**, each with different rules, ARIA, and component primitives. This pattern covers **view controls** only.

| Category          | Manipulates                                | Members                                                          | Rules live in                                    |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------ |
| **View controls** | Data scope / order / organization / source | Filter, Sort, Group-by, Dataset-switch                           | This file                                        |
| **View display**  | Rendering choices, not data                | Pagination, density, column visibility, layout switcher, refresh | `@patterns/references/view-display.md` (Planned) |
| **View states**   | Async / empty render responses             | Empty state, loading / skeleton, error                           | `@patterns/references/view-states.md`            |
| **Search**        | Filter via free-text predicate             | Search input, scope labeling, debounce, history, suggestions     | `@patterns/references/search.md` (Planned)       |
| **Navigation**    | Context / route                            | URL tabs, breadcrumb, link nav                                   | `@patterns/references/navigation.md` (Planned)   |

### Placement test

| If the affordance does this…                                                | → Category        |
| --------------------------------------------------------------------------- | ----------------- |
| Same rows, narrowed / reordered / regrouped / replaced (same page)          | **View controls** |
| Same data, different rendering (chunk size, density, layout, columns shown) | View display      |
| Async response or no-data response                                          | View states       |
| Free-text predicate input                                                   | Search            |
| Routes to a different URL                                                   | Navigation        |

Keeping the categories distinct prevents miscategorized controls. The most common defect: a "Departments dropdown" cataloged as filter but actually changing column visibility (view display).

---

## Scope

This pattern covers **quick predefined views**: controls directly visible in chrome that let the user pick from a finite, predefined set of options. Richer query-building UIs, composition-internal behaviors, and multi-functionality controls are out of scope.

### Use this pattern when ALL of the following hold

- **One dimension** exposed at a time — a single Status filter, a single Date range, a single "Sort by"
- **Predefined option set** — finite, known options (not free-text input or generated values)
- **Single-value or simple multi-value** — e.g., 2–4 filter chips OR'd within a dimension
- **Low complexity** — direct comparison, no nested rules, no per-field operators
- **One functionality per control** — filter alone, OR sort alone, OR group-by alone, OR dataset-switch alone

When the criteria above don't hold, this pattern doesn't apply. See [§ Boundaries](#boundaries) for the comprehensive list of what's out of scope (richer filter UIs, composition-internal behaviors, search, view display, view states, navigation, multi-functionality widgets, saved views, reset affordances) and where each concern lives.

---

## The four behaviors

| Behavior           | What it does                                                               | Selection model      |
| ------------------ | -------------------------------------------------------------------------- | -------------------- |
| **Filter**         | Narrows the dataset (rows still exist, some hidden by predicate)           | Multi-select default |
| **Sort**           | Reorders the same dataset                                                  | Single-select        |
| **Group-by**       | Reorganizes rows into sections under a chosen attribute                    | Single-select        |
| **Dataset-switch** | Replaces the dataset with a different feed/source/scope, stays on same URL | Single-select        |

---

## The four controls

| Control               | Description                                                                                                                                                                                                                          | Visible label (required) | Spec Reference                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------ |
| **Pills / chips**     | Independent items, each toggleable on/off. Default reads as multi-select (own active state per pill); can be single-select with an explicit label like "Sort by:" or "Group by:". **Class family:** `aiux-pill` — a custom utility-class family, not a DaisyUI component. | **Yes**                  | `@components/references/pill.md`                          |
| **Segmented control** | Mutually exclusive items in a shared container, refines the current view (chrome stays). **DaisyUI:** `aiux-tabs` + `aiux-tabs-box` variant.                                                                                                                            | No                       | `@components/references/tabs.md` _(with `aiux-tabs-box`)_ |
| **Tabs**              | Mutually exclusive items that switch view/context (chrome swaps). **DaisyUI:** `aiux-tabs` + `aiux-tabs-border` (avoid `aiux-tabs-box` here — that's segmented control territory).                                                                                       | No                       | `@components/references/tabs.md`                          |
| **Dropdown**          | Collapsed menu, single- or multi-select. **DaisyUI:** `aiux-dropdown` component.                                                                                                                                                                                        | **Yes**                  | `@components/references/dropdown.md`                      |

A segmented control and tabs can share the same CSS class (DaisyUI's `aiux-tabs-box` is the common case). The distinction is **semantic, not visual** — segmented control refines the current view (chrome stays); tabs switch to a different view (chrome swaps).

---

## Accessibility routing — APG patterns per control

Each control maps to an APG pattern. Pills carry two patterns depending on selection model — load whichever matches your case. Segmented control and tabs share the same APG pattern (they're both `aiux-tabs` primitives, distinguished semantically — see § The four controls).

| Control                      | Selection mode                | APG pattern                                                                                                         |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Pills / chips**            | Multi-select (filter default) | `@accessibility/references/aria-apg-patterns/button.md`                                                             |
| **Pills / chips**            | Single-select (with label)    | `@accessibility/references/aria-apg-patterns/radio-group.md`                                                        |
| **Segmented control + Tabs** | Single-select                 | `@accessibility/references/aria-apg-patterns/tabs.md`                                                               |
| **Dropdown**                 | Single- or multi-select       | `@accessibility/references/aria-apg-patterns/listbox.md`, `@accessibility/references/aria-apg-patterns/combobox.md` |

Load the APG pattern when:

- Implementing keyboard navigation (each pattern specifies its own keyboard model — arrow keys, Home/End, type-ahead)
- Validating focus management (each pattern dictates focus on open / close / activation)
- Auditing ARIA correctness against the WAI-ARIA Authoring Practices Guide

---

## Decision matrix

Which control for which behavior:

| Control               | Filter                                                                                    | Sort                                                                                            | Group-by                                                                                         | Dataset-switch                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Pills / chips**     | ✓ Multi-select default — each pill toggles on/off; pills are independently active.        | ✓ Single-select **if labeled** — needs visible "Sort by [option]" prefix; one active at a time. | ✓ Single-select **if labeled** — needs visible "Group by [option]" prefix; one active at a time. | ✓ Single-select **if labeled** — needs visible dimension prefix ("View: …"); one active at a time.                 |
| **Segmented control** | ✗ Mutually exclusive (one active). Filter is multi-select within dimension.               | ✓ Ideal for exclusive sort options ("Lowest / Highest").                                        | ✓ Ideal for exclusive grouping options.                                                          | ✓ Same-shape data swap (data changes, chrome stays).                                                               |
| **Tabs**              | ✗ Tabs signal context-shift + mutual exclusion. Filter is neither.                        | ✗ Tabs signal context-shift, but sort refines in place. Use segmented control.                  | ✗ Same as sort.                                                                                  | ✓ When chrome swaps with data (different columns / panel structure). ✗ if only data swaps — use segmented control. |
| **Dropdown**          | ✓ Single- or multi-select (with checkboxes for multi). Best for large or collapsed lists. | ✓ Sort dropdown ("Sort by Newest").                                                             | ✓ Group-by dropdown ("Group by Status").                                                         | ✓ Switch dropdown ("Score type: Quality").                                                                         |

**Dropdown and pills are the most flexible controls** — both work for every behavior, with pills requiring an explicit label for single-select use. Segmented control is committed single-select (refines in place); tabs are committed single-select with chrome swap.

When the matrix says ✗, picking that control creates user confusion this pattern exists to prevent.

### Pills vs dropdown — when to pick which

Both work for every behavior. The choice depends on **container type, option count, and layout pressure**.

| Use **pills** when…                                                                                   | Use **dropdown** when…                                           |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| The control lives in a **card, widget, or other contained view** where users scan options at a glance | Option count exceeds **~5**                                      |
| Quick toggling matters (frequent click-to-toggle on/off interaction)                                  | Pills would **wrap to a second line** at the available width     |
| Options fit on one line at the available width                                                        | Layout space is constrained (narrow toolbar, page-header chrome) |

When in doubt, dropdown is the safer fallback — it scales with option count and never wraps. Pills are the better fit for "quick action" surfaces where seeing options upfront is the point.

### Why these matchings — two signals must align

Each control carries two signals; both must match the behavior's nature.

**Signal 1 — Independence vs. mutual exclusion**

| Signal                                                                        | What it tells the user                                                                                             | Behaviors that match                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Pills (independent items, no shared container)                                | Default: "pick any combination." With a single-select label ("Sort by", "Group by", "View:"), reads as "pick one." | **Filter** by default; **Sort, Group-by, Dataset-switch** when explicitly labeled |
| Segmented control + tabs (mutually exclusive items, shared/grouped container) | "Pick exactly one"                                                                                                 | **Sort, Group-by, Dataset-switch** (single-select)                                |
| Dropdown                                                                      | Neutral — works for either single- or multi-select depending on configuration                                      | Any                                                                               |

**Signal 2 — Same-context vs. context-shift**

| Signal                                                        | What it tells the user                        | Behaviors that match                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Segmented control + dropdowns + pills (within current chrome) | "I'm refining what's here"                    | **Filter, Sort, Group-by, same-shape Dataset-switch**                                                          |
| Tabs (signaling context-shift / view-switch)                  | "I'm switching to a different view / context" | **Dataset-switch only when chrome swaps** — the only behavior+control where the context-shift signal is honest |

A control whose signals don't match the behavior creates ambiguity. That's the core defect this pattern catches.

### Two-question checklist

For any view control, two checks should land on a single matrix cell:

1. **Single- or multi-select within the chosen dimension?** → narrows control choice (segmented control or dropdown for single; pills for either, single-select pills require an explicit label).
2. **Does activating it change the surrounding chrome?** → if yes _and_ behavior is dataset-switch, tabs are valid; otherwise stick with same-context controls.

If both checks land on the same cell, you have your control. If they conflict, the behavior or selection model needs revisiting.

---

## Per-behavior rules

### Filter

**Allowed altitudes.**

| Altitude | Label rule                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Page     | "Filter [page name]" or "Filter by [dimension]" with a visible group label |
| Section  | "Filter [section]" — must disclose section name in placeholder/group label |
| Card     | "Filter [card name]" or use the card title as the implicit scope           |

**Active filter count.** When filters are active, the container's accessible name includes the count: `aria-label="Status, 3 applied"`.

**Toggle interaction.** Each pill toggles on/off when clicked — no separate "×" dismiss affordance. Active and inactive states must be visually distinct.

**Clear all.** Filter groups with >2 selectable options must expose a "Clear all" button (placement: end of group; ARIA: "Clear all filters" or "Clear [dimension] filter").

### Sort

**Selection model — single-select.** One sort key + direction at a time. (Multi-key sort is a different pattern, outside this pattern's scope.)

**Allowed altitudes.**

| Altitude | Label rule                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Card     | "Sort by [option]" — visible label or trigger-text prefix (e.g., dropdown showing "Sort by Newest ▾") |

**Indicator persistence (canonical rule).** If the data is sorted, the view must show the current sort state regardless of how the sort was triggered. Triggers vary; indicators do not. A user must determine current sort from visible chrome without opening a menu.

**Direction cycling.** Pick one per control:

- **Binary** — `asc ↔ desc` (default for new controls).
- **Tri-state** — `asc → desc → none → asc` (when an explicit "remove sort" state is needed without a separate Clear control).

### Group-by

**Selection model — single-select.** One grouping at a time. Use an explicit "None" option (or "Clear grouping") to remove grouping rather than relying on toggle-off.

**Allowed altitudes.**

| Altitude | Label rule                                   |
| -------- | -------------------------------------------- |
| Card     | "Group by [option]" — required visible label |

**Active indicator.** The trigger or control must reflect active grouping without requiring the user to open a menu:

- Dropdown trigger label: "Group by [Active dimension]"
- Segmented control: active option visually indicated

Section headers in the data area are secondary signals; the trigger is primary.

**Group-by vs sort-by.** Both reorder. Group-by adds structure (sections) — use it when the user benefits from clustering. Sort alone — use it when ordering is sufficient and section headers add noise. Both can be active simultaneously.

### Dataset-switch

**Boundary rule: same-page vs route.**

| Behavior                                                                                        | Category                          |
| ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Same-page replacement — clicking changes loaded data without changing URL or surrounding chrome | **Dataset-switch** (this pattern) |
| Route-based category navigation — clicking changes URL; each category is a distinct page        | **Navigation** (out of scope)     |

Same visual can serve either behavior. Behavior is determined by what happens on click, not by visual treatment.

**Selection model — single-select.** Use an explicit "All" or default option to return to the unfiltered/default state.

**Allowed altitudes.**

| Altitude | Label rule                                              |
| -------- | ------------------------------------------------------- |
| Card     | "[Dimension]: [Active option]" — disclose the dimension |
| Page     | (rare) — must clearly differ from page nav              |

**Segmented control vs tabs.** Both share `role="tablist"` ARIA. Pick **segmented control** when only the data swaps (chrome stays); pick **tabs** when surrounding chrome (column set, header text, panel structure) also swaps. The chrome-swap behavior is the semantic difference, not the ARIA.

**Label content.** When a visible label is shown (required for pills and dropdown per § The four controls; optional for segmented control and tabs), the form is "[Dimension]: [Active option]". Examples:

- "Score type" for Quality vs Safety
- "View" for By team vs By inventory
- "Source" for one feed vs another

For segmented control and tabs, even though a visible label isn't required, include one when the option names alone are ambiguous — "Quality / Safety" alone is ambiguous without a "Score type:" prefix.

**Dataset-switch vs filter.** Both narrow what's visible. The rule:

- **Filter** narrows: rows in the unfiltered dataset are hidden by predicate.
- **Dataset-switch** replaces: rows in the new dataset were never in the previous view.

---

## Altitude vocabulary

A view control's **altitude** is the smallest scope of the page that contains the data it affects — where it sits in the page hierarchy and what it governs. The per-altitude label rules above are altitude-tagged, so this section establishes the vocabulary.

| #   | Altitude             | Boundary                                                                            | What controls there scope                              |
| --- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | **Page**             | The entire route                                                                    | All data-bearing content on the page                   |
| 2   | **Section / region** | A grouping of related views inside a page (e.g., a labeled dashboard section)       | All views within that region                           |
| 3   | **Contained view**   | A card / widget / panel — a self-contained block with its own chrome                | Just that block's data                                 |
| 4   | **Composition**      | A structured composition with documented anatomy (data-table, item-group, calendar) | The data the composition renders, via toolbar controls |

Composition-_internal_ altitudes (per-column, per-row) are out of scope — see § Boundaries.

> The full altitude framework — identification test, per-altitude rules, the honesty check (the diagnostic that catches scope-mismatch defects), and worked examples — will live in `@patterns/references/altitude.md` (Planned). This section is vocabulary only.

---

## Boundaries

Not every UI affordance for "manipulating data" is a view control. The following are explicitly out of scope:

| Affordance                                                                                                                                                           | Where it lives                                                          | Test                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Composition-internal behaviors** (column header sort, column header filter, column header menu, cell rendering, column header anatomy)                             | Individual composition specs (e.g., `@compositions/data-table-spec.md`) | Behavior that only makes sense inside a specific complex component (data-table, item-group, calendar).                                    |
| **Richer filter UIs** (filter panel, condition builder, AI filter assist)                                                                                            | Separate frameworks for complex compositions                            | Anything past quick predefined views — see § Scope.                                                                                       |
| **Multi-functionality controls** (filter + sort combined; saved views; repeatable workflows)                                                                         | Higher-level recipe spec (Planned)                                      | A single widget that combines 2+ behaviors, or persists across sessions.                                                                  |
| **Search input**                                                                                                                                                     | `@patterns/references/search.md` (Planned)                              | Free-text predicate input. Rich enough rules (debounce, scope labeling, history, suggestions) to deserve its own pattern.                 |
| **View display** (pagination, density, column visibility — e.g., a Departments dropdown that picks which columns to render, NOT a filter — layout switcher, refresh) | `@patterns/references/view-display.md` (Planned)                        | Manipulates _rendering_, not data.                                                                                                        |
| **View states** (empty, loading, error)                                                                                                                              | `@patterns/references/view-states.md`                                   | Render responses to async/empty conditions, not user-initiated control.                                                                   |
| **Navigation**                                                                                                                                                       | `@patterns/references/navigation.md` (Planned)                          | Routes to a different URL.                                                                                                                |
| **Full-view reset and saved-view mechanics** ("Reset view", persistent view configs across sessions)                                                                 | Higher-level recipe spec (Planned)                                      | Multi-session state management. _Per-dimension "Clear all" within a single filter group is in scope — see § Per-behavior rules → Filter._ |
| **Altitude framework** (identification test, per-altitude rules, honesty check, worked examples)                                                                     | `@patterns/references/altitude.md` (Planned)                            | View controls keeps brief altitude vocabulary above; the rest lives there.                                                                |

If you see one of the above and it's not behaving like one of the four view controls within the § Scope, you're in the wrong pattern.

---

## Anti-patterns

### Mixing functionalities in one control

A single instance of any control — one pill set, one dropdown, one segmented control, one tab group — should serve **exactly one** functionality. Don't build a pill set where some pills filter and others sort, or a dropdown whose options toggle between group-by and sort-by depending on which one you pick.

If a widget needs to expose multiple functionalities, render them as **separate adjacent controls**:

```
✓  [filter chips]  +  [Sort by ▾]  +  [Group by ▾]
   three controls, three jobs

✗  [Status | Date | Newest | Group by Status]
   one pill set, two jobs (filter + sort + group-by jumbled)
```

Combining functionalities in a single control is multi-functionality territory — see § Boundaries. Out of scope here.

### Inconsistent controls for the same behavior across similar surfaces

A given behavior should use the same control type across surfaces of the same altitude in the same product. Don't ship filter as pills on one card, tabs on the next card, and a dropdown on a third — without a justified reason documented per surface. Inconsistency is the most-flagged failure mode and the reason this pattern exists.

```
✓  Three sibling cards on the dashboard, each with filter as pill chips.
   Same behavior, same altitude, same control. Predictable.

✗  Card A: filter as pill chips.
   Card B: filter as underline tabs.
   Card C: filter as a dropdown.
   Same behavior, same altitude, three different controls. Users
   re-learn the affordance per card.
```

The matrix selects one canonical control per behavior. Deviations should be the exception, not the norm — and should be noted (e.g., "card C uses a dropdown because the option count exceeds the chip-bar threshold").

### Same control type used for different functions on the same page

The reverse of the previous rule: a control type — tabs, pills, dropdown, segmented control — should mean the same thing across the page. Users transfer mental models from one occurrence to the next. If page-header tabs do navigation, tabs inside a card on the same page shouldn't do filtering — even if both have technically correct ARIA. The visual collision breaks the user's prediction.

```
✗  Page header: [Overview │ Activity │ Settings]    — navigation (tabs route)
   Card inside: [Open │ Closed │ All]                — filter (tabs as filter)
   Same visual on the same page, two different jobs. A user clicking
   the inner tabs expecting navigation gets filtering — or vice versa.

✓  Page header: [Overview │ Activity │ Settings]    — navigation (tabs)
   Card inside: [**Open**] [Closed]                  — filter (pill chips, Open is active)
   Different visual signal → different job. No collision.
```

When the [§ Decision matrix](#decision-matrix) suggests tabs for one purpose and the page already uses tabs for another, redirect to a different control. The matrix typically offers segmented control or dropdown as alternatives that carry the same behavior with a distinct visual signal.

This pairs with the previous rule:

- _Same behavior, different controls across surfaces_ — fragmentation defect
- _Same control, different behaviors across surfaces_ — collision defect

Together they enforce a 1:1 mapping between control type and behavior within a page: each control type means one thing, each behavior uses one control.

---
