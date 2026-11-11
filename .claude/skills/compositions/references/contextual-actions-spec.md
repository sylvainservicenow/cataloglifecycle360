# Contextual Actions — Design Spec

## 1. Overview

Contextual actions are a group of equal-weight peer buttons representing available operations within a section's context. They answer: "What can I do here?" Individual button styling follows `@components/SKILL.md`. This spec governs button treatment, grouping, overflow structure, icon usage, and ARIA structure for equal-weight peer action groups. It does **not** govern workflow decision buttons with a call to action — those are action-sets (see `references/action-set-spec.md`).

## 2. Context Variants

Contextual actions adapt to their placement. The buttons are always peers — the context determines visual treatment and icon behavior.

| Variant                 | Button class                                                                                       | Icon treatment                                                            | Layout                                          | ARIA                              |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| **AI Suggestions**      | Custom pill (§4.1)                                                                                 | 32px circular container, `text-primary`, `stroke="currentColor"`          | Horizontal, `flex-wrap`, `gap-1.5`              | `role="toolbar"`                  |
| **Filter Controls**     | `aiux-pill` utility class (Horizon 2.0) — NOT DaisyUI `aiux-btn`, NOT a hand-authored custom class | Optional                                                                  | Horizontal, left-aligned above content, `gap-2` | `role="toolbar"` + `aria-pressed` |
| **Toolbar**             | `aiux-btn aiux-btn-ghost aiux-btn-sm`                                                              | Icon + label or icon-only                                                 | Horizontal bar                                  | `role="toolbar"`                  |
| **Card Header Actions** | `aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle`                                              | Icon-only — `aria-label` required                                         | Horizontal, right-aligned in header, `gap-3`    | `role="toolbar"`                  |
| **Quick Links (Grid)**  | Custom tile (icon + label)                                                                         | 48px container, `bg-background-primary` + `border-base-300`, `rounded-lg` | Grid, 3+ columns                                | `role="toolbar"`                  |
| **Quick Links (List)**  | Custom row (icon + label)                                                                          | 36px container, `bg-background-primary` + `border-base-300`, `rounded-lg` | Vertical stack with dividers                    | `role="toolbar"`                  |

## 3. Critical Distinctions

### Contextual Actions vs. Action Set — "Is there a call to action?"

This is the first thing to determine. If a button group has one button that advances, completes, or decides, it's an action-set — not contextual actions.

| Signal          | Contextual Actions                                | Action Set                                                                                            |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Call to action  | **No** — all options are peers                    | **Yes** — one button is the forward action                                                            |
| Button variants | All same (`aiux-btn-ghost` or `aiux-btn-outline`) | Mixed (`aiux-btn-primary`, `aiux-btn-success`, `aiux-btn-error`, `aiux-btn-soft`, `aiux-btn-outline`) |
| Position        | Inline — below search, above lists, in headers    | Footer — card, form, modal, panel                                                                     |
| User moment     | "What can I do here?" — exploring, filtering      | "What should I do?" — completing, deciding                                                            |
| Ordering        | No priority — frequency, logical grouping         | Priority — forward action rightmost, destructive far left                                             |
| Spacer          | None — all peers                                  | Yes — separates destructive from decision cluster                                                     |
| ARIA container  | `role="toolbar"` with `aria-label`                | None (or a `flex justify-end gap-2` footer container in modals)                                       |

**Decision test:**

1. Is there a call to action — one button the interface asks the user to click to advance, complete, or decide? → **Action Set**
2. Are all buttons equal-weight options the user can choose from? → **Contextual Actions**
3. Mixed DaisyUI variants (`aiux-btn-primary`, `aiux-btn-success`, `aiux-btn-error`, `aiux-btn-soft`, `aiux-btn-outline`)? → **Action Set**
4. All buttons same variant (`aiux-btn-ghost` or `aiux-btn-outline`)? → **Contextual Actions**

If mixed variants exist but no clear forward action, the group is ambiguous — either promote one button to a forward action (making it an action-set) or make all buttons match (making them contextual actions).

### Filter Controls vs. Tabs — "Does clicking switch datasets or filter one dataset?"

Filter pills and tab strips can look similar. The distinction determines the ARIA pattern:

| Signal           | Filter Controls                                                 | Tabs                                                     |
| ---------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Content behavior | Narrows visible items in one list                               | Switches to a completely different content panel         |
| ARIA pattern     | `aria-pressed` toggle buttons in `role="toolbar"`               | `role="tablist"` with `role="tab"` and `role="tabpanel"` |
| Active state     | Filled dark background via `[aria-pressed="true"]` CSS selector | `tab-active` class or `aria-selected="true"`             |

## 4. Variant Anatomy

### 4.1 AI Suggestions

The AI-powered suggestion variant (quick actions bar) has a specific anatomy that differs from standard DaisyUI button classes.

**Button spec:**

```
┌─────────────────────────────────────────────┐
│ ┌──────┐                                    │
│ │ icon │  Label text                        │
│ │ 32px │  text-text-tertiary, font-medium   │
│ └──────┘  text-xs                           │
│  text-primary                               │
│  rounded-full, no bg                        │
└─────────────────────────────────────────────┘
  rounded-full pill
  padding: 8px 12px 8px 4px (asymmetric)
  gap: 0 (icon container size provides spacing)
  hover: bg-base-200
  active: bg-base-300
```

**Icon container:** 32×32px, `rounded-full`, `text-primary` (DaisyUI class — theme-aware, resolves to brand teal). No background. SVG uses `stroke="currentColor"` to inherit.

**Label:** `font-sans`, `font-medium` (500), `text-xs`, `leading-sm`. Color: `text-text-tertiary` (Janus utility class → `var(--color-text-tertiary)` → `var(--neutral-600)`).

**Distinct icons:** Each action has a unique icon reflecting its content — not all the same icon. The fallback data pattern of using `sparkle` for every action is incorrect.

**Behavior:** Actions may be `now_assist` (launches agent), `navigate` (goes to filtered view), or `popup` (opens modal).

**More button spec:** The overflow trigger for AI suggestions uses the same visual treatment as the inline actions:

```
┌────────────────────────────────┐
│ ┌──────┐                      │
│ │ ···  │  More                │
│ │ dots │  text-text-tertiary  │
│ └──────┘                      │
└────────────────────────────────┘
  Same pill shape, padding, hover/active as action buttons
  Vertical ellipsis (dots) icon in text-primary container
  "More" text label (NOT icon-only)
  aria-haspopup="true"
  aria-expanded tracks open state
```

**HTML structure:**

```html
<div
  role="toolbar"
  aria-label="Quick actions"
  class="flex flex-wrap gap-1.5 items-center"
>
  <button class="quick-action-item">
    <div class="quick-action-icon text-primary">
      <svg width="16" height="16" stroke="currentColor" aria-hidden="true">
        ...
      </svg>
    </div>
    Help me manage assets
  </button>
  <!-- more action buttons, each with distinct icon -->
  <button class="quick-action-item" aria-haspopup="true" aria-expanded="false">
    <div class="quick-action-icon text-primary">
      <svg width="16" height="16" fill="currentColor" aria-hidden="true">
        [vertical dots]
      </svg>
    </div>
    More
  </button>
</div>
```

### 4.2 Filter Controls

Position: above a list or table. Actions filter the visible data.

**Use the `aiux-pill` utility class — never a hand-authored custom class.** `aiux-pill` is a real, already-shipped DaisyUI component that already implements the full pill visual contract: `rounded-full` shape, subtle border, hover/active background steps, and a built-in `&[aria-pressed='true']` selector that fills the pill on activation — there is nothing left to hand-build. **Do NOT invent a `.filter-pill`, `.chip`, or any other bespoke class** — a class not in the Tailwind safelist is dropped from the build (silently renders unstyled) and is flagged as a hallucinated class by validators that check against `aiux-class-safelist`. This aligns with `daisyui.md` → `pill_filter_component`, which independently bans DaisyUI's built-in filter component (hidden radio inputs) in favor of `aiux-pill` for the same accessibility reasons as §8 below.

Available modifiers: `aiux-pill-primary` (brand-colored variant), `aiux-pill-disabled`, `aiux-pill-{xs,sm,md,lg,xl}` (size). The bare `aiux-pill` class alone is correct for the default filter-pill case — do not add extra Tailwind utilities for radius, border, or background on top of it (see `daisyui_no_extra_overrides`).

**Active state:** Driven by `aria-pressed="true"`. `aiux-pill`'s CSS already includes an `[aria-pressed="true"]` selector that fills the pill — no separate active class or manual style toggling needed. Screen readers announce the pressed state.

**Element:** Always `<button>`, never `<input type="checkbox">` (per `@accessibility` § Swap). Checkbox-based toggles fail to communicate current state — both on/off labels are read simultaneously. The `<button>` + `aria-pressed` pattern ensures screen readers announce toggle state clearly.

**Mutually exclusive:** Only one filter active at a time. Active pill has `aria-pressed="true"`, all others `aria-pressed="false"`.

**Container role — `toolbar`, not `group`:** The filter pill container itself is `role="toolbar"` with `aria-label`. `role="group"` is reserved for subgroups nested _inside_ an outer toolbar (§5 Grouping) — it is never the outermost role for a single, flat row of filter pills. A flat filter row with no subgrouping must never use `role="group"` as its container role.

```html
<div role="toolbar" aria-label="Priority filter" class="flex gap-2">
  <button class="aiux-pill" aria-pressed="true">All</button>
  <button class="aiux-pill" aria-pressed="false">Tasks</button>
  <button class="aiux-pill" aria-pressed="false">AI recommendations</button>
</div>
```

### 4.3 Toolbar

Position: persistent bar above content.

Icons typically present without labels (space-constrained). Icon-only buttons MUST have `aria-label`. Active tools use `aiux-btn-active` class. Wrap in `role="toolbar"` with `aria-label`.

### 4.4 Card Header Actions

Position: inside a card header, alongside the title.

Typically icon-only (`aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle`). Gap between icon buttons: `gap-3` (12px). Arrow/expand button is navigation, not a contextual action — it follows the card recipe's header rules. Each icon-only button MUST have `aria-label`.

### 4.5 Quick Links (Grid)

Position: inside a card. Navigation shortcuts as icon + label tiles.

These are navigational — use `<a href>` tags, not `<button>`. For action launchers (create, add), use `<button>`.

**Tile spec:**

```
┌────────────────┐
│   ┌────────┐   │
│   │  icon  │   │  48×48px, bg-background-primary + border-base-300, rounded-lg
│   │  20px  │   │  icon uses stroke="currentColor"
│   └────────┘   │
│   Label text   │  11px, text-text-primary, 2-line truncation
└────────────────┘
  Grid: 3+ columns, gap-1
  Tile: padding 12px 8px, rounded-lg, min-width 80px
  Hover: bg-base-200
```

**Spec warning:** Figma may reference `primary-content` for the icon container background — this is a spec error. `primary-content` is a text color token (white) that doesn't change in dark mode. Use `bg-background-primary` (same surface as the card container, Janus utility class).

**Disabled items:** `opacity-40`, remain visible but non-interactive. For `<button>` elements (action launchers), use the native `disabled` attribute — do NOT use `aria-disabled` (per `@accessibility` § Button). For `<a>` elements (navigational links), use `aria-disabled="true"` with `pointer-events: none` since anchors have no native `disabled` attribute.

### 4.6 Quick Links (List)

Same tile concept as grid but stacked vertically — icon left, label right, dividers between rows.

Icon container: 36×36px (smaller than grid). Same `bg-background-primary` + `border-base-300` + `rounded-lg` treatment. Single-line labels. DaisyUI `aiux-divider` between each item. NOT a semantic `<ul>/<li>` list — each item is a standalone link.

Grid vs. list choice: grid for short labels and wider cards; list for longer labels or narrow cards.

## 5. Layout Rules

### Arrangement

- **Direction:** Horizontal. Wraps to next line if container is too narrow (`flex-wrap`).
- **Alignment:** Left-aligned or center-aligned within section. NOT right-aligned (right-alignment signals action-set footer behavior).
- **Gap:** `gap-1.5` (6px) or `gap-2` (8px) between buttons. Tighter than action-set gap. Card header actions use `gap-3` (12px).
- **No spacers:** All buttons are peers — no flex spacer separating any button from the group.

### Overflow

When actions exceed the visible limit (`max_visible` from API or design decision), overflow actions collapse into a "More" menu. Structure the overflow menu per `@patterns/SKILL.md`.

**Overflow trigger:** A button matching the same visual treatment as the inline actions, with a vertical ellipsis (dots) icon and "More" text label.

**Overflow menu:** A popover with `role="menu"` containing `role="menuitem"` buttons.

```html
<div
  popover="auto"
  role="menu"
  class="bg-base-100 border border-base-300 rounded-xl min-w-[200px] overflow-hidden"
>
  <button
    role="menuitem"
    class="flex items-center gap-2.5 w-full px-4 py-2 text-sm font-normal
                 text-text-primary text-left cursor-pointer bg-transparent border-0
                 transition-all duration-150 hover:bg-base-200 active:bg-base-300"
  >
    [icon] [label]
  </button>
</div>
```

**Overflow rules:**

- Any action can overflow — no priority hierarchy (unlike action-sets where forward and destructive always stay visible)
- Overflow trigger uses same size, variant, and shape as inline buttons
- Overflow trigger has `aria-haspopup="true"` and tracks `aria-expanded`
- Menu items use `role="menuitem"` (actions), not `role="option"` (value selection)
- Menu uses `role="menu"`, not `role="listbox"`
- Menu radius: `rounded-xl` (nested element uses nested radius 16px, not parent radius 24px)

### Grouping (subgroups)

When actions fall into logical subgroups (e.g., filter vs. sort vs. view):

- Visual divider: `border-l border-base-300 h-4 self-center` between groups, OR
- Spacing: `gap-4` between groups, `gap-1.5` within groups
- Do NOT use different button variants to distinguish groups
- Each subgroup wrapped in `role="group"` with `aria-label`, within outer `role="toolbar"`

### Button size by density

| Density            | Button size   | Notes                                                                   |
| ------------------ | ------------- | ----------------------------------------------------------------------- |
| `density-compact`  | `aiux-btn-xs` | Smallest — for dense data environments                                  |
| `density-default`  | `aiux-btn-sm` | Standard for contextual actions                                         |
| `density-spacious` | `aiux-btn-sm` | No size increase — spacious adds container spacing, not larger controls |

Contextual actions use `aiux-btn-sm` (or `aiux-btn-xs`) even at default density. Full-size `aiux-btn` is reserved for action-set forward actions.

### Card container rules

**Any contextual actions rendered inside a card MUST include a section header.**

```html
<div class="flex items-center justify-between mb-4">
  <h3 class="text-sm font-semibold text-text-primary">[Section title]</h3>
  <button
    class="aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle"
    aria-label="View all [section]"
  >
    [arrow icon]
  </button>
</div>
```

Title: short, descriptive label ("Quick links", "Quick actions", "Shortcuts"). Arrow button links to full view — optional only if the card shows all items with no overflow possible. No header = violation.

Card-contained actions must match a defined variant:

| Implementation                  | Match to variant    | Treatment                                                                                  |
| ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| Icon + label tiles in a grid    | Quick Links (Grid)  | 48px icon container, `bg-background-primary` + `border-base-300`, `rounded-lg`, 3+ columns |
| Icon + label rows with dividers | Quick Links (List)  | 36px icon container, same surface/border, vertical stack with dividers                     |
| Icon-only buttons in header row | Card Header Actions | `aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle`, `gap-3`, `aria-label` on each       |

Non-standard treatments are violations — identify the closest variant and remediate.

**Combined with a card footer action-set:** A card may pair a contextual-actions header (peer toolbar, ghost variant) with a footer action-set (see `references/action-set-spec.md`) — e.g., a header toolbar for Refresh/Filter/Export alongside a footer Deploy/Review Later/Cancel. These are two separate compositions sharing one card shell:

- The card shell itself must still use `aiux-card` > `aiux-card-body` (never a hand-authored flex `<div>` standing in for the card body).
- The footer belongs to the action-set, not to this spec — its container is `aiux-card-actions`, never a hand-authored flex `<div>`.
- **Never let the header's ghost variant bleed into the footer.** The footer buttons follow action-set role mapping only: dismissive (e.g., Cancel) is `aiux-btn-secondary`, not `aiux-btn-ghost`. `aiux-btn-ghost` is reserved for contextual-actions peers (this spec) — it is not a valid role-mapped variant for any action-set button, dismissive included.

## 6. Token Usage

### Icon colors

| Context                                    | Class                                | Mechanism                                                                                           |
| ------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| AI suggestion action icon                  | `text-primary` on 32px container div | DaisyUI class. SVG uses `stroke="currentColor"` to inherit.                                         |
| Generic action icon (toolbar, card header) | None — inherits from button          | SVG uses `currentColor`. `aiux-btn-ghost` sets `--btn-fg: var(--color-text-primary)` automatically. |

### Text colors

| Context                                  | Class                             | Resolves to                                                                                                                  |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| AI suggestion label                      | `text-text-tertiary`              | `var(--color-text-tertiary)` → `var(--neutral-600)`                                                                          |
| Other button text (toolbar, card header) | No override — inherits `--btn-fg` | `aiux-btn-ghost` sets `--btn-fg: var(--color-text-primary)`. Do not override unless the variant requires different emphasis. |
| Overflow menu item text                  | `text-text-primary`               | DaisyUI class                                                                                                                |

### Surface colors (overflow menu)

| Element          | Class                |
| ---------------- | -------------------- |
| Menu background  | `bg-base-100`        |
| Menu border      | `border-base-300`    |
| Menu item hover  | `hover:bg-base-200`  |
| Menu item active | `active:bg-base-300` |

### Radius

| Element                   | Class          | Value                |
| ------------------------- | -------------- | -------------------- |
| Pill-shaped buttons       | `rounded-full` | 9999px               |
| Overflow menu             | `rounded-xl`   | 16px (nested radius) |
| Quick link icon container | `rounded-lg`   | 8px                  |

## 7. Content Rules

- **Labels ≤ 5 words** for action labels. Quick action prompts (natural language AI suggestions) may be longer but should remain scannable.
- **Labels describe the action.** Each label clearly communicates what happens when clicked. "More info" and "Click here" are violations.
- **Icons supplement, don't replace.** Every button with an icon also has a text label — unless it's icon-only with `aria-label`. Icons alone are insufficient for comprehension.
- **Distinct icons per action.** In AI suggestion context, each action has a unique icon reflecting its content. Do not reuse the same icon across all actions.
- **Button labels** follow `@components/button.md` § Content rules for verb-first and no-truncation rules.

## 8. Accessibility Contract

For per-button accessibility (APG, DaisyUI corrections, forced colors), see `@components/SKILL.md` and `@accessibility`. This section covers only composition-level rules.

- **APG pattern (group-level):** Toolbar — see `@accessibility`. Every contextual actions group uses `role="toolbar"` with `aria-label` describing the group.
- **Keyboard (group-level):** Single tab stop. Tab moves focus INTO the toolbar (first or last-focused button), then OUT. Arrow keys (Left/Right) move between buttons. Home/End (optional) jump to first/last. _This differs from action-sets, where each button is its own tab stop._
- **Filter active state:** Use `<button>` with `aria-pressed="true"/"false"` — never checkbox inputs. CSS uses `[aria-pressed="true"]` to drive the filled visual state.
- **Overflow trigger:** `aria-haspopup="true"` and `aria-expanded` tracking open state. The overflow menu uses `role="menu"` with `role="menuitem"` children (APG Menu).
- **Disabled visual treatment:** `opacity-40` — disabled items remain visible but non-interactive. Do not remove from DOM.

## 9. Scope Boundary

This spec covers button treatment, grouping, overflow, icon usage, and ARIA structure for equal-weight peer action groups.

It does **not** cover:

- **Individual button styling** — see `@components/SKILL.md`
- **Workflow decision buttons with a call to action** — see `references/action-set-spec.md`
- **Card container structure** — see `references/card-spec.md`; this spec only governs the contextual actions within a card
- **Cross-cutting accessibility patterns** — see `@accessibility` for baseline checks

The referencing direction is one-way: this spec references `@components/SKILL.md`. The card spec references this spec for card header actions and quick links behavior. This spec does not reference the card spec.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above. Used by `@compositions/SKILL.md` during validation.

### Structural checks

| #    | Check                          | Spec section                  | Description                                                                                                                                                                                         |
| ---- | ------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Not an action-set              | §3 Critical Distinctions      | No button uses `aiux-btn-primary`, `aiux-btn-success`, `aiux-btn-error`, or `aiux-btn-soft`. No button is a clear forward action. If any button has a different variant, flag for reclassification. |
| S-02 | Uniform variant                | §2 Context Variants           | All buttons use the same DaisyUI variant within the group. Mixed variants are a violation.                                                                                                          |
| S-03 | Buttons are peers              | §5 Layout Rules > Arrangement | No button is visually heavier than others. No spacer separates any button. No button is positioned differently to signal importance.                                                                |
| S-04 | Overflow trigger matches peers | §5 Layout Rules > Overflow    | If a "More" button exists, it uses the same size, variant, and shape as the inline buttons. Uses text label "More" with dots icon.                                                                  |
| S-05 | Max visible respected          | §5 Layout Rules > Overflow    | If the API or design specifies a `max_visible` count, only that many actions are shown inline.                                                                                                      |

### Container context checks

| #    | Check                           | Spec section                           | Description                                                                                                                                                                                   |
| ---- | ------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | Card section header present     | §5 Layout Rules > Card container rules | If contextual actions are inside a card, a section header (title + optional arrow button) must be present above the actions.                                                                  |
| C-02 | Matches defined variant         | §5 Layout Rules > Card container rules | If actions are inside a card, the treatment must match a defined card-contained variant (quick links grid, quick links list, or card header actions). Non-standard treatments are violations. |
| C-03 | Quick links use correct element | §4.5 Quick Links (Grid)                | Navigational links use `<a href>`, action launchers use `<button>`.                                                                                                                           |
| C-04 | Quick links not semantic list   | §4.6 Quick Links (List)                | Quick links do not use `<ul>/<li>` or `role="list"`. Each item is a standalone link/button within `role="toolbar"`.                                                                           |
| C-05 | Card shell uses card primitives | §5 Layout Rules > Card container rules | If the card also has a footer action-set, the shell uses `aiux-card` > `aiux-card-body`, and the footer uses `aiux-card-actions` — never hand-authored flex `<div>`s standing in for either.  |
| C-06 | No ghost bleed into action-set  | §5 Layout Rules > Card container rules | If a card combines this spec's header toolbar with a footer action-set, footer buttons never use `aiux-btn-ghost`. Dismissive footer buttons (e.g., Cancel) use `aiux-btn-secondary`.         |

### Layout checks

| #    | Check                | Spec section                             | Description                                                                                                                    |
| ---- | -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| L-01 | Not right-aligned    | §5 Layout Rules > Arrangement            | Contextual actions are left-aligned or center-aligned. Right-alignment signals action-set footer behavior.                     |
| L-02 | No spacers           | §5 Layout Rules > Arrangement            | No flex spacer separating any button from the group. All buttons are peers.                                                    |
| L-03 | Correct gap          | §5 Layout Rules > Arrangement            | Gap is `gap-1.5` (6px) or `gap-2` (8px). Card header actions use `gap-3` (12px).                                               |
| L-04 | Correct button size  | §5 Layout Rules > Button size by density | Uses `aiux-btn-sm` at default/spacious density, `aiux-btn-xs` at compact density. Full `aiux-btn` is reserved for action-sets. |
| L-05 | Overflow menu radius | §6 Token Usage > Radius                  | Overflow popover uses `rounded-xl` (16px nested radius), NOT `rounded-3xl` (24px parent radius).                               |

### Semantic / token checks

| #    | Check                      | Spec section                    | Description                                                                                                                                                                 |
| ---- | -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | No hardcoded icon colors   | §6 Token Usage > Icon colors    | AI suggestion icons use `text-primary` class on 32px container div. Generic icons use `currentColor`. No hardcoded hex (e.g., `style="color:#25CB40"`).                     |
| V-02 | No hardcoded text colors   | §6 Token Usage > Text colors    | AI suggestion labels use `text-text-tertiary` (Janus utility). Other contexts inherit `--btn-fg` from `aiux-btn-ghost`. No Tailwind Slate classes (e.g., `text-slate-700`). |
| V-03 | Overflow surface tokens    | §6 Token Usage > Surface colors | Menu uses `bg-base-100`, `border-base-300`, `hover:bg-base-200`, `active:bg-base-300`.                                                                                      |
| V-04 | Quick link icon background | §4.5 Quick Links (Grid)         | Icon container uses `bg-background-primary` (Janus utility) + `border-base-300`. NOT `primary-content` (Figma spec error — `primary-content` is a text color token).        |
| V-05 | Distinct icons             | §4.1 AI Suggestions             | Each AI suggestion action has a unique icon reflecting its content. All actions using the same icon (e.g., all `sparkle`) is a violation.                                   |

### Content checks

| #    | Check                           | Spec section     | Description                                                                                                 |
| ---- | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| T-01 | Labels concise                  | §7 Content Rules | ≤ 5 words for action labels. Quick action prompts (natural language) may be longer but should be scannable. |
| T-02 | Labels describe action          | §7 Content Rules | Each label clearly communicates what happens when clicked. "More info" and "Click here" are violations.     |
| T-03 | Icons supplement, don't replace | §7 Content Rules | Every button with an icon also has a text label — unless icon-only with `aria-label`.                       |

### Accessibility checks

| #    | Check                               | Spec section                                       | Description                                                                                                                                                                                                                                |
| ---- | ----------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-01 | Group has `role="toolbar"`          | §8 Accessibility Contract                          | Button container has `role="toolbar"` with `aria-label` describing the group. A flat, non-subgrouped row is never `role="group"` — that role is reserved for subgroups nested inside an outer toolbar.                                     |
| A-02 | Decorative icons hidden             | §8 Accessibility Contract                          | Inline SVG icons supplementing a text label have `aria-hidden="true"`.                                                                                                                                                                     |
| A-03 | Icon-only buttons have `aria-label` | §8 Accessibility Contract                          | Buttons without visible text must have `aria-label`.                                                                                                                                                                                       |
| A-04 | Overflow trigger ARIA               | §8 Accessibility Contract                          | Overflow trigger has `aria-haspopup="true"` and tracks `aria-expanded`.                                                                                                                                                                    |
| A-05 | Overflow menu roles                 | §8 Accessibility Contract                          | Overflow menu has `role="menu"` with `role="menuitem"` children.                                                                                                                                                                           |
| A-06 | Filter active state                 | §4.2 Filter Controls, §8 Accessibility Contract    | Active filter pill has `aria-pressed="true"`, all others `aria-pressed="false"`. CSS uses `[aria-pressed="true"]` selector for visual state.                                                                                               |
| A-07 | Keyboard navigation                 | §8 Accessibility Contract                          | Toolbar uses single tab stop with arrow key navigation between buttons (roving tabindex). Verify `tabindex` management.                                                                                                                    |
| A-08 | Filter pills use `<button>`         | §4.2 Filter Controls, §8 Accessibility Contract    | Filter pills must be `<button>` elements with `aria-pressed`, NOT `<input type="checkbox">`. Checkbox toggles fail to communicate current state to screen readers. (`@accessibility` § Swap)                                               |
| A-09 | Disabled uses native attribute      | §4.5 Quick Links (Grid), §8 Accessibility Contract | Disabled `<button>` elements use the native `disabled` attribute, NOT `aria-disabled`. Disabled `<a>` elements use `aria-disabled="true"` with `pointer-events: none` since anchors have no native `disabled`. (`@accessibility` § Button) |

---

## Resolution Guidance

### S-01: Mixed variants → reclassify

If one button is `aiux-btn-outline` while others are `aiux-btn-ghost`, ask: "Is [button name] more important than the others?" If yes → this is an action-set, use `references/action-set-spec.md`. If no → make all buttons match.

### S-04: Overflow trigger doesn't match peers

The overflow trigger must use the same pill shape, padding, and hover/active states as the inline action buttons. It uses a vertical dots icon and "More" text label. It must NOT use a different variant (e.g., `aiux-btn-outline` when others are `aiux-btn-ghost`) or be icon-only when other buttons have labels.

### C-01: Missing card section header

Card-contained contextual actions need a header:

```html
<!-- Before (wrong — actions floating with no context) -->
<div class="aiux-card p-5">
  <div class="grid grid-cols-4 gap-4">[action tiles]</div>
</div>

<!-- After (correct — header provides context) -->
<div class="aiux-card p-5">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-text-primary">Quick actions</h3>
    <button
      class="aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle"
      aria-label="View all actions"
    >
      [arrow icon]
    </button>
  </div>
  <div role="toolbar" aria-label="Quick actions" class="grid grid-cols-3 gap-1">
    [action tiles]
  </div>
</div>
```

### C-02: Non-standard variant in card

If contextual actions inside a card don't match a defined variant:

- Large icon tiles in a grid → remediate to **Quick Links (Grid)** — 48px icon container, `bg-background-primary` + `border-base-300` + `rounded-lg`, section header, `role="toolbar"`
- Rows with icons and labels → remediate to **Quick Links (List)** — 36px icon container, dividers, section header
- Icon-only buttons in header → remediate to **Card Header Actions** — `aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-circle`, `gap-3`, `aria-label`

### L-05: Overflow menu radius too large

The overflow popover is a nested element. Nested elements use `rounded-xl` (16px), not `rounded-3xl` (24px parent radius):

```html
<!-- Before (wrong) -->
<div popover="auto" class="bg-base-100 border border-base-300 rounded-3xl">
  <!-- After (correct) -->
  <div
    popover="auto"
    class="bg-base-100 border border-base-300 rounded-xl"
  ></div>
</div>
```

### V-01: Hardcoded icon color → `text-primary`

Replace inline color on the icon wrapper with the `text-primary` DaisyUI class on a 32px circular container:

```html
<!-- Before (wrong) -->
<span style="color:#25CB40">[bare SVG icon]</span>

<!-- After (correct) -->
<div class="quick-action-icon text-primary">
  <svg stroke="currentColor" aria-hidden="true">[icon]</svg>
</div>
```

### V-02: Hardcoded text color → `text-text-tertiary`

For AI suggestion labels, replace Tailwind Slate utilities with the Janus custom utility:

```html
<!-- Before (wrong) -->
<button class="aiux-btn aiux-btn-ghost aiux-btn-sm rounded-full text-slate-700">
  <!-- After (correct — AI suggestions) -->
  <button class="quick-action-item">
    <!-- label inherits text-text-tertiary from .quick-action-item styles -->
  </button>
</button>
```

For other contextual action contexts using `aiux-btn-ghost`, do NOT add a text color override — `aiux-btn-ghost` already sets `--btn-fg: var(--color-text-primary)` which is theme-aware.

### V-04: Quick link icon using `primary-content`

```html
<!-- Before (wrong — primary-content is a text color token) -->
<div class="quick-link-icon bg-primary-content">
  <!-- After (correct — bg-background-primary is a surface token) -->
  <div class="quick-link-icon bg-background-primary"></div>
</div>
```

### A-01: Missing `role="toolbar"`

Wrap the button container:

```html
<!-- Before (wrong) -->
<div class="flex gap-1.5">
  <button class="aiux-btn aiux-btn-ghost aiux-btn-sm rounded-full">
    Action 1
  </button>
</div>

<!-- After (correct) -->
<div role="toolbar" aria-label="Quick actions" class="flex gap-1.5">
  <button class="aiux-btn aiux-btn-ghost aiux-btn-sm rounded-full">
    Action 1
  </button>
</div>
```

Implement roving tabindex: only one button in the tab order at a time, arrow keys move focus between buttons.

### A-01: `role="group"` used on a flat (non-subgrouped) row

`role="group"` is only valid for a subgroup nested inside an outer toolbar — never as the outermost role for a single flat row:

```html
<!-- Before (wrong — flat filter row using the subgroup role) -->
<div
  role="group"
  aria-label="Filter tasks by status"
  class="flex items-center gap-2"
>
  <button class="aiux-pill" aria-pressed="true">All</button>
  <button class="aiux-pill" aria-pressed="false">Active</button>
</div>

<!-- After (correct — flat row is role="toolbar") -->
<div
  role="toolbar"
  aria-label="Filter tasks by status"
  class="flex items-center gap-2"
>
  <button class="aiux-pill" aria-pressed="true">All</button>
  <button class="aiux-pill" aria-pressed="false">Active</button>
</div>
```

### C-05 / C-06: Card shell hand-rolled, or ghost bleeding into an action-set footer

```html
<!-- Before (wrong — hand-authored shell/footer, and Cancel copies the header's ghost variant) -->
<div class="bg-surface-primary rounded-2xl shadow-sm overflow-hidden">
  <div
    role="toolbar"
    aria-label="Asset actions"
    class="flex justify-between p-4"
  >
    <button
      class="aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-square"
      aria-label="Refresh"
    >
      ...
    </button>
  </div>
  <div class="flex justify-between p-4">
    <button class="aiux-btn aiux-btn-ghost">Cancel</button>
    <button class="aiux-btn aiux-btn-primary">Deploy</button>
  </div>
</div>

<!-- After (correct — aiux-card primitives for the shell/footer, secondary for the dismissive footer button) -->
<div class="aiux-card">
  <div class="aiux-card-body">
    <div role="toolbar" aria-label="Asset actions" class="flex justify-between">
      <button
        class="aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-square"
        aria-label="Refresh"
      >
        ...
      </button>
    </div>
  </div>
  <div class="aiux-card-actions justify-between">
    <button class="aiux-btn aiux-btn-secondary">Cancel</button>
    <button class="aiux-btn aiux-btn-primary">Deploy</button>
  </div>
</div>
```

### A-06: Filter pills without `aria-pressed`

```html
<!-- Before (wrong — visual only, no ARIA) -->
<button class="aiux-pill" style="background: dark; color: white;">All</button>
<button class="aiux-pill">Active</button>

<!-- After (correct — aria-pressed drives visual + accessible state) -->
<button class="aiux-pill" aria-pressed="true">All</button>
<button class="aiux-pill" aria-pressed="false">Active</button>
```

### A-08: Filter pills using checkbox instead of button

```html
<!-- Before (wrong — checkbox can't communicate toggle state clearly) -->
<label><input type="checkbox" checked /> All</label>
<label><input type="checkbox" /> Active</label>

<!-- After (correct — button with aria-pressed) -->
<button class="aiux-pill" aria-pressed="true">All</button>
<button class="aiux-pill" aria-pressed="false">Active</button>
```

### A-09: Disabled button using `aria-disabled` instead of native

```html
<!-- Before (wrong — aria-disabled on a button) -->
<button class="quick-action-item" aria-disabled="true" style="opacity: 0.4;">
  Coming soon
</button>

<!-- After (correct — native disabled attribute on button) -->
<button class="quick-action-item" disabled style="opacity: 0.4;">
  Coming soon
</button>

<!-- For links, aria-disabled is correct since <a> has no native disabled -->
<a
  href="#"
  class="quick-link-list-row"
  aria-disabled="true"
  style="opacity: 0.4; pointer-events: none;"
>
  Coming soon
</a>
```
