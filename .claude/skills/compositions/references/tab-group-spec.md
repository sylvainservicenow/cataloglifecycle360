# Tab Group — Design Spec

## 1. Overview

A tab group organizes content into switchable panels, answering: "Where am I within this view?" Individual tab styling (variants, sizes, labels, icons, overflow, disabled states) follows `@components/SKILL.md`. This spec governs how tabs assemble into groups — variant selection by context, tablist-vs-navigation classification, ARIA tablist/tab/tabpanel structure, keyboard navigation, content states, and container context rules.

**Build with `<aiux-tab-group>` by default.** Pass it a `tabs` array with the `variant`/`size` props from `@components/SKILL.md` and it renders the tablist, manages active state, and provides ARIA roles, arrow-key navigation, and panel transitions automatically — none of the manual ARIA/keyboard wiring in §5 is needed. **Hand-roll** the raw `tabs`/`tab` classes below **only** when the component's fixed tab model can't express the case (e.g., a count badge inside a tab, or tabs driving external/routed content) — and in that case you own every ARIA attribute and keyboard behavior in §5 yourself. The rest of this spec documents that hand-rolled fallback path in full, since it's the harder case to get right; the component path is straightforward by comparison.

## 2. Tab Variants

Three visual variants map to two functional classifications. An agent selects the variant based on navigation hierarchy and context.

**When building with `<aiux-tab-group>`,** pass the literal string in the "Component `variant` prop" column below — the component's `variant` property (`@servicenow/karuna` `components/tabs/src/index.js`) only recognizes the literal strings `'boxed'`, `'bordered'`, and `'lifted'`. It is an untyped string prop with no validation: any other value — including the display names in this table's first column, taken literally (`variant="underline"`, `variant="toggle"`, `variant="box-inverted"`) — is accepted silently and rendered with **no variant class at all**, with no console warning or error. Always translate the display name to its literal prop value before emitting `variant="..."`.

The component also accepts `variant="lifted"` (→ `aiux-tabs-lift`), a working DaisyUI tab style not currently covered by this spec's variant guidance below — do not select it until this table documents when to use it.

| Variant          | When to Use                                                                                                                                                               | Component `variant` prop                                                                                           | DaisyUI Classes                               | Functional Classification       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------- |
| **Underline**    | Sub-navigation — switching content sections within a page, panel, or card. Visually lightweight.                                                                          | `variant="bordered"`                                                                                               | `tabs tabs-border`                            | Tablist (content switching)     |
| **Boxed**        | Page/app-level navigation — primary navigation between top-level views. White elevated pill on neutral-50 container with neutral-300 border creates a prominent landmark. | `variant="boxed"`                                                                                                  | `tabs tabs-box`                               | Navigation (page-level routing) |
| **Box-inverted** | Boxed tabs on a white (primary) background — container inverts to neutral-50 fill with neutral-300 border; active tab uses dark pill (neutral-700) with inverted text.    | not available — no `variant="box-inverted"` exists on the component; use `variant="boxed"` as fallback ⏳          | `tabs tabs-box-inverted` ⏳                   | Navigation or Tablist           |
| **Toggle**       | Two-option segmented control — binary mode switcher. Sub-variant of boxed with `rounded-full` pill shape.                                                                 | not expressible via `variant` alone — the prop has no way to add `rounded-full` to the container; hand-roll per §1 | `tabs tabs-box` + `rounded-full` on container | Tablist (content switching)     |

Visual class mapping:

| Class                       | Variants served                      | Distinguished by                                                                           |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `tabs tabs-border`          | Underline                            | Single class — no further disambiguation needed                                            |
| `tabs tabs-box`             | Boxed, Toggle, Box-inverted fallback | Option count (2 = toggle), container shape (`rounded-full` = toggle), active-tab treatment |
| `tabs tabs-box-inverted` ⏳ | Box-inverted (pending)               | Dark neutral-700 active pill on shared neutral-50 container                                |

> ⏳ **Box-inverted:** Figma variant exists (`variant: box-inverted`). The `tabs-box-inverted` utility class is **not yet defined** in `@layer utilities`. Do not generate this variant until the class lands — use standard boxed (`tabs-box`) as the fallback.

### Navigation hierarchy

Tab variants map to a three-level navigation hierarchy. The sidebar handles L1 and L2; tab groups handle L3 and below.

| Level   | What it is                       | Variant                                   | Example                                         |
| ------- | -------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| **L1**  | Sidebar categories               | Sidebar nav (not tabs)                    | Home, Activity center, Plan, Insights, Settings |
| **L2**  | Sidebar sub-items                | Sidebar nav (not tabs)                    | Monitor, Engagement, Value, ServiceNow AI       |
| **L3**  | Page-level tab switching         | **Box-inverted** ⏳ (fallback: **Boxed**) | Overview, Evaluated sessions                    |
| **L4+** | Sub-navigation within L3 content | **Underline**                             | Record sections, card panels, detail tabs       |

**L3 is the primary tab bar.** A page has at most one L3 tab group. All additional tab groups within the page content are L4+ (underline). Box-inverted is never repeated — if L3 tabs exist, no other boxed tab group appears on the page.

### DaisyUI class assignments

**Underline:**

```html
<div role="tablist" aria-label="[group purpose]" class="tabs tabs-border">
  <button role="tab" class="tab tab-active" aria-selected="true">Active</button>
  <button role="tab" class="tab" aria-selected="false">Inactive</button>
</div>
```

**Boxed:**

```html
<div role="tablist" aria-label="[group purpose]" class="tabs tabs-box">
  <button role="tab" class="tab tab-active" aria-selected="true">Active</button>
  <button role="tab" class="tab" aria-selected="false">Inactive</button>
</div>
```

**Toggle (binary mode switcher):**

```html
<div
  role="tablist"
  aria-label="[group purpose]"
  class="tabs tabs-box rounded-full"
>
  <button role="tab" class="tab tab-active" aria-selected="true">
    ${icon({name: 'list', size: 'sm'})} List
  </button>
  <button role="tab" class="tab" aria-selected="false">
    ${icon({name: 'grid', size: 'sm'})} Grid
  </button>
</div>
```

Toggle is always exactly 2 options. More than 2 → use boxed.

**Toggle is still a tab group, not a segmented button group.** Do not implement toggle as a DaisyUI `aiux-join` button group with `role="group"` and `aria-pressed` (the filter-control / segmented-control pattern). A binary view-mode switcher (e.g. List/Grid) is a Tablist per §3's selection-model test — exactly one option is always active — so it takes the same `role="tablist"` + `role="tab"` + `aria-selected` structure as every other tab variant, only with the `rounded-full` container and exactly 2 tabs. `aiux-join` + `aria-pressed` is reserved for filter controls (§3 Tabs vs. Filter Controls) and is a violation here.

### Box-inverted token values (pending)

Figma defines a `box-inverted` variant with these token values:

| Property              | Value         | Token                          |
| --------------------- | ------------- | ------------------------------ |
| Container fill        | `#f9f8f6`     | `neutral-50`                   |
| Container border      | 1px `#e3e2df` | `neutral-300`                  |
| Container radius      | 16px          | `rounded-2xl` (`--radius-2xl`) |
| Container padding     | 4px           | `foundation/px/1`              |
| Active tab background | `#4d4c4a`     | `neutral-700`                  |
| Active tab text       | white         | `text/inverted`                |
| Active tab radius     | —             | `var(--radius-field)`          |

**Use context:** L3 page-level tab navigation — the primary tab bar below a page header within an L2 view. Both boxed and box-inverted share the same container styling (neutral-50 fill + neutral-300 border). The difference is the active tab: standard boxed uses a white shadow-elevated pill; box-inverted uses a dark neutral-700 pill with white text for stronger contrast.

**Seen in production:** AICT Insights → Monitor page — "Overview / Evaluated sessions" tabs at L3 within the page header.

**Do not generate** until `.tabs-box-inverted` is defined in `@layer utilities`. Use `tabs-box` as fallback.

## 3. Critical Distinctions

### Tablist vs. Navigation — "Does clicking load a new page or switch a panel?"

This determines the ARIA pattern, element choice, and keyboard model. Both use `role="tablist"` at the container.

| Signal             | Tablist (content switching)                  | Navigation (page routing)                      |
| ------------------ | -------------------------------------------- | ---------------------------------------------- |
| What clicking does | Shows/hides a panel within current view      | Loads a new route/page                         |
| Element            | `<button role="tab">`                        | `<a role="tab" href="...">` or router link     |
| Panel association  | `aria-controls` → `role="tabpanel"`          | No panel — destination is a new page           |
| Active indicator   | `aria-selected="true"`                       | `aria-selected="true"` + `aria-current="page"` |
| Keyboard           | Arrow keys move focus, Enter/Space activates | Arrow keys move focus, Enter follows link      |
| URL change         | No — same page, different panel              | Yes — URL changes                              |

**Decision test:**

1. Does clicking a tab change the URL or load a new view? → **Navigation**
2. Does clicking a tab show/hide content within the same page? → **Tablist**
3. Is the tab implemented as `<a href>` with a route? → **Navigation**
4. Is the tab implemented as `<button>` controlling a panel? → **Tablist**

### Tabs vs. Filter Controls — "Does clicking switch content or narrow a dataset?"

Filter pills and tab strips look similar. The distinction determines the ARIA pattern and state model.

| Signal           | Tabs                                              | Filter Controls                                   |
| ---------------- | ------------------------------------------------- | ------------------------------------------------- |
| Selection model  | Exactly one selected (radio)                      | Zero or more selected (checkbox)                  |
| Content behavior | Switches to a different panel                     | Narrows visible items in one list                 |
| ARIA pattern     | `role="tablist"` + `role="tab"` + `aria-selected` | `aria-pressed` toggle buttons in `role="toolbar"` |
| Active state     | `tab-active` class or `aria-selected="true"`      | Filled via `[aria-pressed="true"]`                |

If clicking narrows a single dataset with zero-or-more selection, this is a filter control — see `references/contextual-actions-spec.md` § Critical Distinctions.

## 4. Container Categories

Where a tab group sits determines which variant to use. The L3/L4+ hierarchy (§2 Navigation hierarchy) drives the selection.

| Container                                    | Variant                                            | Why                                                           |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| Page header (L3 — page-level view switching) | **Box-inverted** ⏳ (fallback: **Boxed**)          | L3 primary tab bar — dark active pill on neutral-50 container |
| Within a card body slot                      | **Underline**                                      | Lightweight, doesn't compete with card chrome                 |
| Within a modal/dialog                        | **Underline**                                      | Modals are already contained; boxed adds clutter              |
| Within a panel/sidebar                       | **Underline** (horizontal) or **Boxed** (vertical) | Depends on available space                                    |
| Record detail page (section tabs)            | **Underline**                                      | L4+ sub-navigation within an already-loaded record            |

### Constraints

- **No duplicate boxed groups:** A page has at most one L3 tab group (box-inverted or boxed fallback). All sub-navigation uses underline. Never two boxed-style groups on one page.
- **Box-inverted is not repeated:** If an L3 box-inverted tab group exists, no other box-inverted or standard boxed tab group appears anywhere else on the page.
- **Modals use underline:** Exception: full-screen modals functioning as standalone views.
- **Vertical layout for narrow spaces:** Sidebars and narrow panels use vertical orientation with `overflow-y-auto`, never horizontal scroll.
- **Card shell compliance when tabs sit in a card:** A card wrapping a tab group is still a card — its content region uses `aiux-card-body`, not a plain `<div class="p-...">`, per `references/card-spec.md`. This applies regardless of how much of the card's layout the tab group itself occupies.
- **Footer action sets follow action-set-spec, not tab styling:** When a tab group's container also has a footer action set (e.g. a tabbed card with Resolve/Assign/Close buttons below), those buttons are governed entirely by `references/action-set-spec.md` — role mapping (dismissive/rejection/secondary → `aiux-btn-secondary`, never `aiux-btn-ghost`) and the `aiux-card-actions` footer region. The tab group's own variant rules (§2) never apply to footer buttons.

## 5. Accessibility

For the full ARIA structure and keyboard model, see `@accessibility` (canonical APG Tabs pattern). For per-tab accessibility (icon-only labels, disabled, hit targets), see `@components/SKILL.md` § Accessibility. This section covers only tab-group composition decisions.

- **Activation model — manual.** Arrow keys move focus only; Enter/Space activates the focused tab. Users can review tab labels before switching content. _This is a deliberate choice — Horizon does not use automatic activation._
- **Tab implementation — roving tabindex.** Only the active tab has `tabindex="0"`; all others have `tabindex="-1"`. Native radio-group keyboard behavior is not sufficient (it lacks Home/End support).
- **Panel association** (`aria-controls` → `role="tabpanel"` → `aria-labelledby`) is **required** for tablist classification. CSS-only content switching (`:checked + .tab-content`) is **not** sufficient — screen readers cannot associate tabs with their panels without ARIA. Ensure ShadowDOM is structured to permit the association.
- **Navigation tabs** that route between pages add `aria-current="page"` to the active tab in addition to `aria-selected="true"`.
- **Overflow** uses a menu / dropdown (see `@components/SKILL.md` § Overflow), **never** horizontal scrolling — scrolling tab bars hide content from keyboard users and screen readers.

## 6. Content States

Tab label content rules (concise, noun-based, sentence case, truncation with `title` attribute) follow `@components/SKILL.md` § Content rules.

| State                               | Behavior                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Empty** (no tabs)                 | Show centered placeholder: "No tabs available" in `text-text-tertiary text-sm py-8 px-4`                           |
| **Loading** (panel content pending) | Tab bar remains visible and interactive. Panel shows centered spinner. Do NOT hide or disable tabs during loading. |

For the empty / loading / error render conventions these states apply, see `@patterns/SKILL.md`.

## 7. Scope Boundary

This spec covers tab bar structure, variant selection by context, navigation hierarchy (L3/L4+), tablist-vs-navigation classification, tabs-vs-filter-controls boundary, ARIA tablist/tab/tabpanel pattern, keyboard navigation, content states, and container context rules.

It does **not** cover:

- **Individual tab primitive styling** — variants, sizes, labels, icons, overflow modes, disabled, per-tab accessibility — see `@components/SKILL.md`
- **Panel content** within tab panels — owned by the composition occupying the panel
- **Header composition** that tabs may appear below — see `references/header-spec.md` (Planned)
- **Form section tabs** implementation details — see `references/form-spec.md` (form references tab-group, not the reverse)

The referencing direction is one-way: `references/form-spec.md` references this spec (uses `tabs-layout.ts` as the canonical tab implementation). This spec references `@components/SKILL.md` for primitive tab behavior. `references/header-spec.md` (Planned) is a peer — tabs appear below a header, but neither spec owns the other.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above. Used by `references/SKILL.md` during validation.

### Structural checks

| #    | Check                                            | Spec section                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Correct variant identified                       | § 2 Tab Variants                        | Component uses `tabs tabs-border` (underline), `tabs tabs-box` (boxed), or `tabs tabs-box rounded-full` (toggle). No mixing of variant classes.                                                                                                                                                                                                                                                                            |
| S-02 | Classification matches implementation            | § 3 Tablist vs. Navigation              | Tablist uses `<button>` with `aria-controls`. Navigation uses `<a>` or router links. `<input type="radio">` for tabs is a violation — the spec prescribes `<button>` / `<a>`.                                                                                                                                                                                                                                              |
| S-03 | Toggle is binary                                 | § 2 Tab Variants (Toggle)               | If toggle variant, exactly 2 tab options. More than 2 options in a toggle → use boxed.                                                                                                                                                                                                                                                                                                                                     |
| S-04 | Icon component correct                           | `@components/SKILL.md` § Label types    | Icons use the `icon()` directive (`@servicenow/aiux-directive-icon`), not the deprecated `<aiux-icon>` component and not inline `<svg>`. Icon size follows the tab-to-icon mapping in the primitive spec.                                                                                                                                                                                                                  |
| S-05 | Navigation hierarchy                             | § 2 Navigation hierarchy                | Page has at most one L3 tab group (box-inverted or boxed fallback). All additional tab groups within the page content are L4+ (underline). Box-inverted is not repeated.                                                                                                                                                                                                                                                   |
| S-06 | Not filter controls                              | § 3 Tabs vs. Filter Controls            | If pill-shaped toggles, verify it switches content panels (exactly-one selection) — not filtering one dataset (zero-or-more). Zero-or-more with dataset narrowing → reclassify as filter controls per `references/contextual-actions-spec.md`.                                                                                                                                                                             |
| S-07 | Box-inverted not generated prematurely           | § 2 Box-inverted token values (pending) | If output contains `tabs-box-inverted`, or the active tab uses a dark background (neutral-700 or equivalent) with inverted text → flag: "tabs-box-inverted is not yet available. Use standard boxed until the class lands." Note: neutral-50 fill + neutral-300 border on the container is correct for standard boxed (V-05) — do not flag it. Remove this check when `.tabs-box-inverted` is added to `@layer utilities`. |
| S-08 | Toggle not implemented as segmented join control | § 2 Tab Variants (Toggle)               | Toggle variant uses `role="tablist"` + `role="tab"` + `aria-selected`, same as every other variant. `aiux-join`/`role="group"`/`aria-pressed` on a 2-option view-mode switcher is a violation — that is the filter-control pattern, not tabs.                                                                                                                                                                              |

### Container context checks

| #    | Check                                             | Spec section             | Description                                                                                                                                                                                                                                                                                                             |
| ---- | ------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | Variant matches container                         | § 4 Container Categories | Boxed for page-level nav, underline for within-card / within-modal / sub-navigation. Mismatched context-variant pairing is a violation.                                                                                                                                                                                 |
| C-02 | No duplicate boxed groups                         | § 4 Constraints          | Page does not contain two boxed or box-inverted tab groups. If an L3 tab group exists, all other tab groups on the page use underline.                                                                                                                                                                                  |
| C-03 | Modal uses underline                              | § 4 Constraints          | Tabs inside a modal use underline variant. Exception: full-screen modals functioning as standalone views.                                                                                                                                                                                                               |
| C-04 | Vertical for narrow spaces                        | § 4 Constraints          | Sidebars and narrow panels use vertical orientation, not horizontal with overflow.                                                                                                                                                                                                                                      |
| C-05 | Cross-composition compliance in shared containers | § 4 Constraints          | A card containing a tab group still uses `aiux-card-body` (not a bare padded `<div>`) per `references/card-spec.md`. A footer action set in the same container follows `references/action-set-spec.md` role mapping — a dismissive/rejection/secondary button is `aiux-btn-secondary`; `aiux-btn-ghost` is a violation. |

### Layout checks

| #    | Check                          | Spec section                                  | Description                                                                                                                                                                                                               |
| ---- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | Tab size valid                 | `@components/SKILL.md` § Sizing               | Tab uses a sanctioned size — `tabs-xs`, `tabs-sm`, `tabs-md`, `tabs-lg`, or `tabs-xl`.                                                                                                                                    |
| L-02 | Icon size matches tab size     | `@components/SKILL.md` § Icon size mapping    | Icon size follows xs→xs, sm/md→sm, lg→md, xl→lg mapping.                                                                                                                                                                  |
| L-03 | Overflow uses menu, not scroll | § 5 Overflow                                  | Tabs must use menu/dropdown for overflow, not horizontal scrolling. `overflow-x-auto` or `flex-nowrap` on a tab container is a violation. Use the "More" trigger pattern from `@components/SKILL.md` § Overflow behavior. |
| L-04 | Vertical scroll correct        | `@components/SKILL.md` § Vertical orientation | Vertical tab bars use `overflow-y-auto` for overflow — never horizontal scroll on a vertical sidebar.                                                                                                                     |

### Semantic / token checks

| #    | Check                        | Spec section                                             | Description                                                                                                                                                                                                                      |
| ---- | ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Uses DaisyUI tab classes     | § 2 DaisyUI class assignments                            | Uses `tabs`, `tab`, `tab-active`, `tabs-border`, `tabs-box` DaisyUI classes. No hand-rolled tab styling that reimplements DaisyUI behavior.                                                                                      |
| V-02 | No hardcoded active colors   | § 2 DaisyUI class assignments                            | Active state does not use hardcoded hex values. Uses DaisyUI `tab-active` class which resolves through theme.                                                                                                                    |
| V-03 | No hardcoded inactive colors | § 2 DaisyUI class assignments                            | Inactive text does not use Tailwind Slate classes or hardcoded rgba. Uses DaisyUI's built-in inactive treatment.                                                                                                                 |
| V-04 | No legacy tokens             | § 2 DaisyUI class assignments                            | No `--now-*` legacy tokens. No `--color-base-300` (wrong semantic).                                                                                                                                                              |
| V-05 | Boxed container bg correct   | § 2 Box-inverted token values (shared container styling) | Boxed container uses `neutral-50` (#f9f8f6) fill with 1px `neutral-300` (#e3e2df) border. Not `base-200`, not `base-300`, not borderless. Figma specifies `neutral-50` + `neutral-300` border for both `box` and `box-inverted`. |
| V-06 | No hardcoded radius          | § 2 DaisyUI class assignments                            | No hardcoded radius values (`18px`, `28px`). Boxed container uses `rounded-2xl` (16px per Figma). Individual tabs use `var(--radius-field)`. Toggle container uses `rounded-full`.                                               |
| V-07 | No font overrides            | `@components/SKILL.md` § Known gaps                      | Font inherits from DaisyUI base at weight 400 (normal). No override to `Inter`, `Lato`, `var(--font-sans)`, or `font-weight: 500`. Figma specifies theme font at normal weight.                                                  |

### Content checks

| #    | Check                         | Spec section                           | Description                                                                                 |
| ---- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| T-01 | Labels concise                | `@components/SKILL.md` § Content rules | 1–2 words per label. "Overview" not "Overview of All Items".                                |
| T-02 | Labels noun-based             | `@components/SKILL.md` § Content rules | Labels describe content ("Settings", "Details"), not actions ("Configure", "View Details"). |
| T-03 | Consistent part of speech     | `@components/SKILL.md` § Content rules | All tabs in a group use same grammatical form. No mixing nouns and verbs.                   |
| T-04 | No redundancy with page title | `@components/SKILL.md` § Content rules | Tab labels don't repeat the page title.                                                     |
| T-05 | Truncated labels accessible   | `@components/SKILL.md` § Content rules | If a label truncates, `title` attribute provides the full text.                             |
| T-06 | Empty state handled           | § 6 Content States                     | When no tabs exist, a placeholder message is shown — not a blank container.                 |

### Accessibility checks

| #    | Check                         | Spec section                                     | Description                                                                                                                                                                |
| ---- | ----------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | `role="tablist"` present      | § 5 ARIA structure                               | Tab bar container has `role="tablist"`.                                                                                                                                    |
| A-02 | `aria-label` on tablist       | § 5 ARIA structure                               | Tab bar has `aria-label` describing the group purpose.                                                                                                                     |
| A-03 | `role="tab"` on each tab      | § 5 ARIA structure                               | Every tab element has `role="tab"`.                                                                                                                                        |
| A-04 | `aria-selected` explicit      | § 5 ARIA structure                               | Active tab has `aria-selected="true"`. All inactive tabs have `aria-selected="false"` (explicit, not omitted).                                                             |
| A-05 | Panel association (tablist)   | § 5 ARIA structure                               | Each tab has `aria-controls="panel-{id}"`. Each panel has `role="tabpanel"` and `aria-labelledby="tab-{id}"`. N/A for navigation classification.                           |
| A-06 | `aria-current` for navigation | § 5 ARIA structure                               | Navigation-classified tabs have `aria-current="page"` on the active tab. N/A for tablist classification.                                                                   |
| A-07 | Keyboard navigation           | § 5 Keyboard navigation                          | Arrow keys move focus between tabs. Home/End move to first/last. Enter/Space activates. Roving tabindex pattern required — native radio behavior is not sufficient.        |
| A-08 | Hit target size               | `@components/SKILL.md` § Accessibility           | Every tab has minimum 24×24 CSS pixel clickable area (WCAG 2.5.8). `xs` tabs need 4px padding minimum, `sm` tabs need 2px.                                                 |
| A-09 | Icon-only tabs accessible     | `@components/SKILL.md` § Label types > Icon only | Icon-only tabs have matching `aria-label` and `title` attributes. Both present, both identical text.                                                                       |
| A-10 | Disabled tab attributes       | `@components/SKILL.md` § Disabled tabs           | `<button>` tabs: native `disabled` attribute (not `aria-disabled`). `<a>` tabs: `aria-disabled="true"` + `pointer-events: none` (anchors don't support native `disabled`). |
| A-11 | Focus ring visible            | APG Tabs pattern                                 | `:focus-visible` ring with 3:1 contrast ratio.                                                                                                                             |

---

## Resolution Guidance

### S-02: Element model violation

The spec prescribes `<button role="tab">` for tablist and `<a role="tab">` for navigation. `<input type="radio">` is a violation.

**Tablist using radio inputs (wrong):**

```html
<!-- Before -->
<input
  type="radio"
  name="tabs"
  class="tab"
  role="tab"
  aria-label="Overview"
  checked
/>

<!-- After -->
<button
  role="tab"
  class="tab tab-active"
  aria-controls="panel-overview"
  aria-selected="true"
>
  Overview
</button>
```

**Tablist using links (wrong):**

```html
<!-- Before -->
<a href="#panel-1" role="tab" class="tab tab-active">Overview</a>

<!-- After -->
<button
  role="tab"
  class="tab tab-active"
  aria-controls="panel-overview"
  aria-selected="true"
>
  Overview
</button>
```

**Navigation using buttons (wrong):**

```html
<!-- Before -->
<button role="tab" class="tab" @click="${() => router.navigate('/settings')}">
  Settings
</button>

<!-- After -->
<a role="tab" class="tab" href="/settings" aria-selected="false">Settings</a>
```

### S-06: Tabs that are actually filter controls

Two tests distinguish tabs from filter controls:

1. **Selection model:** Is exactly one always selected? → Tabs (`aria-selected`). Zero or multiple? → Filter controls (`aria-pressed`).
2. **Content behavior:** Does clicking switch to a different panel? → Tabs. Does clicking narrow a single visible dataset? → Filter controls.

If the answer is "zero-or-more selected, narrows one dataset," reclassify as filter controls. Replace `role="tablist"` + `role="tab"` + `aria-selected` with `role="toolbar"` + `aria-pressed`. See `references/contextual-actions-spec.md` § Critical Distinctions for the full ARIA structure.

### S-07: Box-inverted generated without utility class

The `box-inverted` variant exists in Figma but has no corresponding utility class. The distinguishing signal is the **active tab treatment** — a neutral-700 dark pill with white text. The shared container styling (neutral-50 fill, neutral-300 border) is correct for standard boxed and must not be flagged. Flag only when output references `tabs-box-inverted` or replicates the dark active-tab treatment inline.

```html
<!-- Before (class does not exist) -->
<div class="tabs tabs-box-inverted">
  <!-- ❌ class not defined in @layer utilities -->
</div>

<!-- Before (dark active-tab style inlined to replicate box-inverted) -->
<div class="tabs tabs-box">
  <button class="tab" style="background:#404040;color:#fff">Active</button>
  <!-- ❌ inline dark active treatment replicates the unavailable variant -->
</div>

<!-- After (standard boxed fallback with DaisyUI active class) -->
<div class="tabs tabs-box">
  <button class="tab tab-active">Active</button>
  <!-- ✅ standard boxed; upgrade to tabs-box-inverted once the class lands -->
</div>
```

**When to remove this check:** After `.tabs-box-inverted` is added to `@layer utilities` in `tailwind.css`. At that point, update S-01 to include `tabs tabs-box-inverted` as a valid variant class and remove S-07.

### S-08: Toggle implemented as segmented join control

```html
<!-- Before (filter-control pattern on a binary tablist) -->
<div role="group" aria-label="View mode" class="aiux-join">
  <button
    id="btn-list"
    class="aiux-btn aiux-btn-sm aiux-join-item aiux-btn-neutral"
    aria-pressed="true"
  >
    List view
  </button>
  <button
    id="btn-grid"
    class="aiux-btn aiux-btn-sm aiux-join-item"
    aria-pressed="false"
  >
    Grid view
  </button>
</div>

<!-- After (toggle variant — still tabs) -->
<div role="tablist" aria-label="View mode" class="tabs tabs-box rounded-full">
  <button role="tab" class="tab tab-active" aria-selected="true">
    List view
  </button>
  <button role="tab" class="tab" aria-selected="false">Grid view</button>
</div>
```

### C-05: Card shell and footer action set inside a tab container

```html
<!-- Before (bare padded div, ghost dismissive button) -->
<div class="aiux-card">
  <div role="tablist" class="tabs tabs-border">...</div>
  <div class="p-5">Panel content</div>
  <div class="flex justify-end gap-2">
    <button class="aiux-btn aiux-btn-ghost">Close Incident</button>
    <button class="aiux-btn aiux-btn-secondary">Assign to Me</button>
    <button class="aiux-btn aiux-btn-primary">Resolve Incident</button>
  </div>
</div>

<!-- After (aiux-card-body shell, action-set-compliant footer) -->
<div class="aiux-card">
  <div role="tablist" class="tabs tabs-border">...</div>
  <div class="aiux-card-body">
    Panel content
    <div class="aiux-card-actions justify-end">
      <button class="aiux-btn aiux-btn-secondary">Close Incident</button>
      <button class="aiux-btn aiux-btn-secondary">Assign to Me</button>
      <button class="aiux-btn aiux-btn-primary">Resolve Incident</button>
    </div>
  </div>
</div>
```

### A-04: Missing or implicit `aria-selected`

```html
<!-- Before (aria-selected omitted on inactive) -->
<button role="tab" class="tab tab-active" aria-selected="true">Active</button>
<button role="tab" class="tab">Inactive</button>

<!-- After (explicit false on all inactive) -->
<button role="tab" class="tab tab-active" aria-selected="true">Active</button>
<button role="tab" class="tab" aria-selected="false">Inactive</button>
```

### A-05: Missing panel association

Tablist-classified tabs must associate with their panels bidirectionally.

```html
<!-- Before (no panel association) -->
<div role="tablist">
  <button role="tab" class="tab tab-active">Details</button>
</div>
<div>Panel content here</div>

<!-- After (bidirectional association) -->
<div role="tablist" aria-label="Record sections">
  <button
    role="tab"
    class="tab tab-active"
    id="tab-details"
    aria-controls="panel-details"
    aria-selected="true"
  >
    Details
  </button>
</div>
<div role="tabpanel" id="panel-details" aria-labelledby="tab-details">
  Panel content here
</div>
```

### L-03: Overflow uses scroll instead of menu

Horizontal scrolling for tab overflow is a violation per Daisy A11y Review § Tabs.

```html
<!-- Before (horizontal scroll) -->
<div role="tablist" class="tabs overflow-x-auto flex-nowrap">
  <!-- tabs scroll horizontally -->
</div>

<!-- After (More trigger with dropdown menu) -->
<div role="tablist" class="tabs tabs-border">
  <button role="tab" class="tab" aria-selected="true">Tab 1</button>
  <button role="tab" class="tab" aria-selected="false">Tab 2</button>
  <button role="tab" class="tab" aria-selected="false">Tab 3</button>
  <button class="tab" aria-haspopup="true" aria-expanded="false">More</button>
</div>
```

### V-02 / V-04: Hardcoded colors and legacy tokens

Replace all hardcoded values and legacy tokens with DaisyUI classes. The `tab` and `tab-active` classes handle active/inactive styling through the theme pipeline.

```html
<!-- Before (hardcoded blue pill) -->
<button class="tab" style="background: #193e8f; color: white;">Active</button>

<!-- Before (legacy token) -->
<button class="tab" style="color: var(--now-color--primary-2);">Active</button>

<!-- After (DaisyUI handles state styling) -->
<button role="tab" class="tab tab-active">Active</button>
```
