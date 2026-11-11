# Dropdown

**DaisyUI base:** `dropdown`
**Production component:** None — native elements + `aiux-dropdown`/`aiux-menu` classes
**Last updated:** 2026-07-04 · v8

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use dropdown for **action menus** — flat lists of actions the user can invoke. The trigger is a button; selecting an item executes an action rather than setting a form value.

**Dropdown vs. select:** Use dropdown when items are **actions** (navigate, delete, assign, export). Use select when items are **values** (a field being set to a chosen option). Do not use dropdown as a substitute for select in forms.

**Dropdown vs. menu:** Use dropdown for a single-level flat action list. Use menu (`references/menu.md`) when actions require nested sub-menus.

**Do not use when:**

- Fewer than 3 actions are available — show the actions directly as buttons.
- The purpose is page navigation — use tabs, breadcrumbs, or links.
- The user is selecting a value for a form field — use select (`references/select.md`).

### 2. Anatomy

| Element       | DaisyUI class           | Purpose                                                                              |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **Wrapper**   | `aiux-dropdown`         | Positioning context. Contains both trigger and panel.                                |
| **Trigger**   | _(child element)_       | The interactive element that opens the dropdown. Typically a button.                 |
| **Panel**     | `aiux-dropdown-content` | Floating action list container. Receives shadow, radius, and surface treatment.      |
| **Menu list** | `aiux-menu`             | Semantic list inside the panel — a `<ul>`, not a `<div>`. Items are `<li>` children. |
| **Item**      | _(list child)_          | A `<li>` wrapping a `<button>`. May include an icon at inline-start and text label.  |
| **Divider**   | `aiux-divider`          | Separates groups of related actions within the panel.                                |

`aiux-dropdown-content` and `aiux-menu` together already own the panel's surface, border, radius, shadow, and padding — do not add `bg-*`, `border`, `rounded-*`, or `shadow-*` utilities on top, and do not set a manual `z-*` (DaisyUI's `.dropdown-content` already stacks above surrounding content). Add only what the classes don't cover, typically a width (e.g. `w-52`).

### 3. Trigger configurations

| Configuration | Treatment                                      | Use when                                                                         |
| ------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| **Contained** | Button with visible label, optional caret icon | The dropdown's purpose needs labeling. Primary trigger for standalone dropdowns. |
| **Bare**      | Icon-only button (typically overflow ⋮ or ⋯)   | Overflow or contextual action menus embedded within a row, card, or header.      |

Bare triggers require `aria-label` and a visible tooltip (reference `references/tooltip.md` for the tooltip pattern).

### 4. Placement

DaisyUI controls placement via modifier classes on the `aiux-dropdown` wrapper, combining two axes — matching Figma's full set of twelve placements:

| Axis      | Values                             | Class                                   |
| --------- | ---------------------------------- | --------------------------------------- |
| **Side**  | top, bottom (default), left, right | `aiux-dropdown-{top,bottom,left,right}` |
| **Align** | start, center, end                 | `aiux-dropdown-{start,center,end}`      |

Combine one side class with one align class, e.g. `aiux-dropdown aiux-dropdown-top aiux-dropdown-end` positions the panel above the trigger, aligned to its end edge. Bottom is the default side and needs no class (`aiux-dropdown-bottom` is also available explicitly). Choose placement based on available viewport space — prefer the default (bottom) unless the trigger is near the block-end edge of the viewport.

The side/align classes above position the panel relative to the wrapper and need nothing else when the panel is a normal DOM child of `aiux-dropdown` (the CSS-only or manual-JS-toggle patterns). When the panel instead uses the native Popover API (§9) — which renders it into the top layer, detached from the wrapper — the wrapper no longer establishes its position, so pair the same side/align class with true CSS anchor positioning: an `anchor-name` on the trigger and a matching `position-anchor` on the panel.

### 5. Selected variant rule

The "selected" visual state on a dropdown item is only valid for **selection menus** — dropdowns that act as a persistent state chooser (e.g., a view switcher). Do not apply the selected state to items in **action menus** where actions are one-time and do not persist.

### 6. Search within dropdown

When a dropdown has many items, a search input can appear within the dropdown panel to filter items. The search filters the visible list as the user types; it does not submit or execute the search as an action. Do not use more than 10–12 items in a dropdown without adding search — long lists without search are difficult to scan.

The search input is a sibling of the item list, not nested inside it — both sit directly inside the same `aiux-dropdown-content` panel. Give the search row its own padding and a bottom border (`p-2 border-b border-base-200`) so it reads as a distinct header row above the list; zero the list's own padding (`aiux-menu p-0`) so the two rows sit flush against the shared panel edges instead of nesting as two separate boxes.

### 7. Content rules

- Verb-first labels: "Delete item", "Export data", "Assign to me". Not "Item delete" or noun-only.
- Sentence case: "Export data" not "Export Data".
- Parallel structure within a single dropdown — all verbs or all nouns.
- A dropdown list should contain actions of the same type. Do not mix destructive and constructive actions without a visual separator — `aiux-divider` with no slotted content, e.g. `aiux-divider my-0 mx-2 opacity-60` (the empty divider renders as two short segments with a gap, not a full-width line — this is the class's own default appearance, not a defect).
- Destructive actions (delete, remove) appear last in the list and may use `text-error` color treatment.

### 8. States

Default (closed), open, hover (item), focus-visible (item), active/pressed (item), disabled (item), disabled (trigger). All must be accounted for. The dropdown closes on item selection.

### 9. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Menu Button (this sheet covers action menus only; Combobox is select.md's pattern) — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Dropdown
- **Forced colors:** Panel follows the **container** pattern; trigger and items follow the **interactive** pattern — see `@accessibility`

**Horizon-specific design notes:**

- DaisyUI's `aiux-dropdown` uses CSS-only `:focus-within` toggling, acceptable only in Storybook stories. Production dropdowns open and close via the native HTML Popover API instead of manual JS state: the panel carries `popover`, the trigger carries `popovertarget` (plus `aria-haspopup="menu"`, `aria-controls`, `aria-expanded`), and the list follows APG Menu Button roles (`role="menu"` on the list, `role="none"` on each `<li>`, `role="menuitem"` on each item).

### 10. RTL

Caret icon position and text alignment mirror in RTL layouts. For placement, only the **align** classes (`aiux-dropdown-{start,center,end}`) are direction-aware and flip automatically — `aiux-dropdown-end` aligns to the left edge in RTL. The **side** classes (`aiux-dropdown-{left,right}`) are physical, not logical, and do not flip — swap `left`/`right` explicitly if the design must mirror. Content within the panel follows standard RTL text direction.

### 11. Scope boundary

This sheet covers single-dropdown decisions: when to use dropdown, trigger configuration, placement, item states, content rules, and accessibility. It does not govern:

- **How dropdowns compose into toolbars or action groups** — defined by composition specs (contextual-actions, overflow).
- **How dropdowns position relative to other layered content** — composition specs.
- **Select behavior** (value selection for forms) — `references/select.md`.
- **Nested action menus** — `references/menu.md`.

The referencing direction is one-way: composition specs reference this sheet for individual dropdown rules; this sheet does not reference composition specs.
