# Tabs

**DaisyUI base:** `tabs` / `tab` (prefixed `aiux-tabs` / `aiux-tab`)
**Production component:** `<aiux-tab-group>` (`@servicenow/aiux-components-tabs`) — wraps the classes and bakes in ARIA, keyboard navigation, and panel transitions
**Last updated:** 2026-06-29 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use tabs to let users switch between parallel views of related content at the same hierarchical level. Tabs answer: **"Where am I within this context?"**

**Do not use tabs when:**

- Only one tab would be visible -- show the content directly.
- The user must complete steps in order -- use a stepper instead.
- The content is page-level navigation between unrelated sections -- use breadcrumbs.
- Users need to see both views simultaneously -- use a split pane.

**Build with `<aiux-tab-group>` by default.** Pass it a `tabs` array and it renders the tablist, manages the active state, and provides ARIA roles, arrow-key navigation, and panel transitions. Hand-roll a tab bar with the raw `aiux-tabs` / `aiux-tab` classes **only** when the component's fixed tab model can't express the case (e.g., a count badge inside a tab, or tabs that drive external / routed content) — and then you own the ARIA and keyboard yourself (see §8).

### 2. Variant

Set via the `variant` prop on `<aiux-tab-group>` (or the container class when hand-rolling). The Figma scale has two:

| Variant      | `variant` value | Hand-roll class    | Visual treatment                                                     |
| ------------ | --------------- | ------------------ | -------------------------------------------------------------------- |
| **Bordered** | `bordered`      | `aiux-tabs-border` | Border indicator on the active tab. Lightweight sub-navigation.      |
| **Boxed**    | `boxed`         | `aiux-tabs-box`    | Elevated pill on a neutral container. Prominent navigation landmark. |

- **`box-inverted`** is in the Figma library but is **not implemented** in the component or the class family — do not hand-roll a fake.
- **`lifted`** (`variant="lifted"` / `aiux-tabs-lift`) exists in the component and class family but is **outside the current Figma scale — do not use it.**

**Placement:** Figma defines a bottom placement and the component exposes `placement="bottom"`, which produces the `aiux-tabs-bottom` class. This is safelisted in the karuna build (`components/core/src/styles/tailwind.css`) and styled by DaisyUI's `tabs-bottom` modifier — bottom placement is available for use.

Which variant to use in which context is a composition concern — not defined here. Toggle (binary mode switcher) is a composed arrangement, not a tab variant.

### 3. Sizing

Set via the `size` prop (`xs` / `sm` / `md` / `lg` / `xl`; default `md`). The component and the `aiux-tabs-{xs,sm,md,lg,xl}` classes own the height, font size, and padding — choose the size by intent, do not restyle it:

| Size           | When to use                                                     |
| -------------- | --------------------------------------------------------------- |
| `xs`           | Minimum WCAG hit target (24 px). Compact toolbars only.         |
| `sm`           | Dense UIs, constrained containers, secondary nav within panels. |
| `md` (default) | Standard experiences.                                           |
| `lg`           | Primary page-level navigation where prominence is needed.       |
| `xl`           | Rare. Landing pages or single-focus experiences.                |

### 4. Label types

Tabs support three label configurations. Icons go before the label via the `iconStart` prop or after it via `iconEnd` — the component sizes the icon to match the tab size automatically (do not set icon dimensions yourself).

| Type            | When to use                                   | Requirements                                                     |
| --------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| **Text only**   | Most common. Clear, concise tab names.        | 1--2 words. Noun-based ("Settings", not "Configure").            |
| **Text + icon** | Icon reinforces label meaning, aids scanning. | `iconStart` (before) or `iconEnd` (after) the label.             |
| **Icon only**   | Space is critically limited (dense toolbars). | `aria-label` and `title` required — both present, both matching. |

### 5. Content rules

- **Concise labels:** 1--2 words. "Overview" not "Overview of All Items".
- **Noun-based:** Labels describe content ("Settings", "Details"), not actions ("Configure", "View Details"). Actions belong in action-sets.
- **Consistent part of speech:** All tabs in a group use the same grammatical form. Do not mix nouns and verbs.
- **No redundancy with page title:** If the page is "AI Settings", the tab label is "Data" -- not "AI Settings Data".
- **Sentence case:** Always. Not Title Case.
- **Truncated labels:** If a label truncates, the full text must be available via `title` attribute. Reference `@patterns/references/truncation-tooltip.md`.

### 6. Tab count and width

**Maximum tab count:** keep to 7--8 tabs in a single bar — a long tab list is hard to scan. If you need more, rethink the grouping. A dynamic "More"-overflow pattern is not in the Figma scale or the component, so do not hand-roll one.

**Equal-width (justified):** set `stretch` on `<aiux-tab-group>` (or `tabs-stretch` when hand-rolling) so tabs fill the container width equally. Use only when the tab count is fixed and equal distribution aids scanning.

### 7. States

Default, hover, focus-visible, active (selected), and disabled must all be accounted for. `<aiux-tab-group>` renders all of them — the active state (`aiux-tab-active`), hover, focus ring, and disabled visuals are owned by the component and the `aiux-tab` classes. The decision that is yours:

- **Disabled** — mark a tab `disabled` in the `tabs` array (the component applies the native `disabled` attribute). If you hand-roll: on `<button>` tabs use the native `disabled` attribute (not `aiux-tab-disabled` alone); on `<a>` tabs (no native `disabled`) use `aria-disabled="true"` + `pointer-events-none`.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern (group-level):** Tabs — see `@accessibility`. `role="tablist"`/`tabpanel`, roving tabindex, and arrow-key navigation are owned by `@compositions/tab-group-spec.md`.
- **DaisyUI corrections:** See `@accessibility` › Tabs (use `<button class="tab">`; never the radio-input variant)
- **Forced colors:** Follows the **interactive** pattern; selected tab uses `SelectedItem`/`SelectedItemText` — see `@accessibility`

**Horizon-specific design notes (per-tab):**

- **Icon-only tabs** must have both `aria-label` and `title` — both present, both matching.
- **Hit targets** must meet 24×24 CSS pixel minimum (WCAG 2.5.8). `tabs-xs` at 24 px is the minimum.
- **Overflow** must use a menu / dropdown pattern, not horizontal scrolling. Scrolling tab bars hide content from keyboard users and screen readers.

### 9. Scope boundary

This sheet covers single tab-group decisions: when to use tabs, which variant/size within the Figma scale, label conventions, and tab count. It does not govern:

- **Which variant to use in which context** (page nav vs. card vs. modal) -- defined by composition specs.
- **ARIA tablist/tabpanel association and the keyboard navigation model** (roving tabindex, arrow keys) -- provided automatically by `<aiux-tab-group>`; a hand-rolled class tab bar must implement them itself (see §8 and the accessibility skill).
- **Toggle as a binary mode switcher** -- a composed arrangement, not a tab variant.

The referencing direction is one-way: composition specs reference this sheet for individual tab rules; this sheet does not reference composition specs.
