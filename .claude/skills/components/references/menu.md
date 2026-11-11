# Menu

**DaisyUI base:** `menu`
**Production component:** None — native `<ul>`/`<li>` + `aiux-menu` classes
**Last updated:** 2026-07-04 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use menu for multi-level hierarchical menus where actions or options organize into nested sub-menus. Nesting expands inline, accordion-style — a sub-menu appears indented directly below its parent item, not as a side popup (see §5). Menu is the right choice when a single flat list is too long or when actions naturally group into parent-child relationships.

**Menu vs. dropdown:** Use dropdown for a single-level flat list of actions. Use menu when sub-menus are needed — dropdown does not support nesting.

**Menu vs. select:** Menu is for actions and navigation, not form value selection. Do not use it as a form input — use select or typeahead.

**Do not use menu when:**

- A single-level dropdown is sufficient — nesting adds complexity the user doesn't need
- Deep nesting beyond two or three levels is required — each additional level increases cognitive load

### 2. Selection modes

| Mode       | Behavior                                                                              | Close on select |
| ---------- | ------------------------------------------------------------------------------------- | --------------- |
| **None**   | Item triggers an action; no persistent selection indicator                            | Yes             |
| **Single** | Selected state indicator appears at inline-start of label; selecting another moves it | Yes             |
| **Multi**  | Multiple items toggled simultaneously                                                 | No — stays open |
| **Nested** | Item opens a child sub-menu instead of performing a direct action                     | No              |

Use none for action menus. Use single or multi for persistent state choices (e.g., view filters). Use nested for hierarchical navigation. Nesting and selection are independent — a nested item can sit inside a single/multi-select group, or a plain none-mode list; "Nested" describes the item's own structure, not the panel's selection behavior.

### 3. Sizing

| Size class | Context                                            |
| ---------- | -------------------------------------------------- |
| `menu-xs`  | Inline toolbars, compact popovers                  |
| `menu-sm`  | Compact contexts, side panels, dense toolbars      |
| `menu-md`  | Default. Match to surrounding component scale      |
| `menu-lg`  | Touch-friendly surfaces, primary navigation panels |

Size is set once on the panel (`<ul class="aiux-menu aiux-menu-lg">`) — every item inherits the size, font, and icon scale from the panel. There is no separate per-item size class.

Font size is _intended_ to scale with the size class (DaisyUI itself defines distinct per-size values: 11px/12px/14px/18px for xs/sm/md/lg) — but a Horizon customization rule currently overrides this and pins every item's font size to 14px regardless of the panel's size class. Generating a `menu-xs` or `menu-lg` panel will not visually change item text size until this is fixed. Item padding/height do still scale somewhat (not as a clean four-tier progression). Icon size does not automatically scale either — the `icon()` directive's `size` argument is set explicitly per call, not inherited from the panel's size class.

### 4. Anatomy

- **List header (optional)** — context label for the entire panel; block-start of top level only, never in nested menus.
- **Section headers (optional)** — group related items within a panel via `aiux-menu-title`. If used, every item in the panel must belong to a header group — do not mix headered and non-headered items.
- **Divider lines (optional)** — separate groups without a header label.
- **Nested menu item** — a `<details>`/`<summary>` pair; expands inline directly below itself and pushes later siblings down (see §5). DaisyUI renders its own expand/collapse indicator on the `<summary>` automatically (a small CSS-drawn rotated square via `::after`, not an icon) — do not add a manual chevron icon inside the summary text, it renders as a second, redundant indicator alongside DaisyUI's own.
- **Item icon (optional)** — adds visual context; use only when icons meaningfully distinguish items, not for decoration. Render via the `icon()` directive (`@servicenow/aiux-directive-icon`) per `references/icon.md` — never `<aiux-icon>` or a hand-written inline `<svg>`. An icon-only item (no visible label) needs `aria-label`.
- **Selected state icon (optional)** — no confirmed production example. The one real usage of `aiux-menu-active` (`components/nav/src/preferences/user-preferences/src/views/render-categories.js`) applies only a background/text color change, with no icon — pairing selection with a checkmark icon is undemonstrated. Build the color-only treatment until a real need for the icon is confirmed.
- **Collapse/expand indicator (optional)** — no confirmed production example of a collapsible, non-actionable group (distinct from a nested menu item, which leads to child actions). Structurally buildable with the same `<details>`/`<summary>` mechanism, just without child actions — but treat as unverified until a real instance exists.
- **Action footer (optional)** — no confirmed production example. A fixed region at block-end of the menu panel containing action buttons (e.g., Cancel / Save). Use only when the menu requires explicit confirmation of multi-select or configuration choices.

### 5. Nesting and overflow

- Limit nesting to two or three levels. The Horizon design system defines sub-menu indicators for up to five nesting levels, but deeper nesting is discouraged for usability.
- Nested menus expand inline directly below their parent item (accordion-style, via `<details>`/`<summary>`), indented with `margin-inline-start` — a logical property, so it mirrors automatically in RTL (see §9). This pushes later siblings down; it does not open as a positioned popup beside or overlapping the parent panel.
- When items exceed the panel's maximum height, items scroll within the fixed-height panel. The panel does not expand.

### 6. Content rules

- Labels: one to three words. Sentence case.
- Parallel structure within a single menu level — all verbs, or all nouns.
- Section header labels describe the category, not repeat item labels.
- The list header is informational only — do not use it for navigational items.

### 7. States

Default, hover (`:hover`), focus-visible, active/pressed (`:active`), disabled (`aiux-menu-disabled`), selected (`aiux-menu-active` — background/text color change; see §4 on the unconfirmed selected-icon pairing). All must be accounted for. In multi-select mode, the menu intentionally stays open after selection to allow batch selection. In single-select and no-selection modes, the menu closes on select — this is a deliberate divergence from APG, where menus typically remain open until Escape or Tab.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG patterns:** Menu and Menu Bar, and Menu Button — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` — DaisyUI's `menu` class is structural only; ARIA roles must be added manually
- **Forced colors:** Follows the **interactive** pattern — see `@accessibility`

### 9. RTL

Nested menus indent via `margin-inline-start` — a logical property, so indentation direction mirrors automatically in RTL with no manual override needed. Text aligns to inline-start. DaisyUI's native expand/collapse indicator on `<summary>` is a CSS-drawn rotated square, not a directional icon, so it needs no RTL-specific handling either.

### 10. Scope boundary

This sheet covers single-menu decisions: when to use menu vs. dropdown, selection modes, nesting rules, anatomy, and item-level behavior. It does not govern:

- **How menus trigger or position relative to other components** — defined by composition specs (contextual-actions, overflow).
- **How menus compose into navigation structures** — contextual-actions or navigation composition specs.
- **A side-popup "flyout" submenu** — this sheet's nesting mechanism expands inline (accordion, see §5). A true flyout submenu exists in production (`aiux-flyout-menu`), but only as an internal mechanism reachable through `<aiux-action-bar>`'s overflow/dropdown/split-button affordances — it is not an independently usable component.

The referencing direction is one-way: composition specs reference this sheet for individual menu rules; this sheet does not reference composition specs.
