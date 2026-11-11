# Card — Design Spec

## 1. Overview

A card is a bounded content surface that groups related information into a scannable unit. Cards appear in dashboards (bento grids), list views, and detail panels.

This composition governs the card shell structure, surface treatment, token compliance, slot anatomy, and sub-pattern usage. It does NOT govern what goes inside the card body — that's determined by the content type (chart, list, metric, priority queue). It governs how the container frames that content.

For individual card shell rules (DaisyUI class anatomy, Seismic migration, radius/border/shadow overrides), see the card component sheet (card.md).

## 2. Card Types

The audit reveals three distinct types. Each has different anatomy and different rules. The validator must identify the type before applying checks.

**All card types (A / B / C) use `aiux-card` / `aiux-card-body` as the shell, styled with design tokens.** The "Implementation" lines below name each type's existing production components as recognition references — they are NOT templates. Some predate this rule and roll their own shell with custom CSS; that is legacy to migrate, not a pattern to copy. When generating a new card of any type, build the shell with `aiux-card` / `aiux-card-body` — never hand-author a `<div>` / `<section>` card shell. **Both classes are always required together — using `aiux-card` on the outer element but substituting a plain `<div>` with padding for `aiux-card-body` is not a valid shell.**

### 2.1 Type A — Container Card

**Definition:** Wraps child content via slots. Does not own its data rendering. Provides a consistent shell (header, body slot, optional footer) for arbitrary content.

**Implementation:** `aict-card` base component, consumed by wrapper cards (`aict-ai-value-card`, `aict-governance-card`, `aict-inventory-card`, `aict-strategy-card`, `aict-tasks-overview-card`).

**Identifying pattern:** Uses `<aict-card>` with the `card-title` / `subtitle` attributes, `show-arrow`, and `<slot>` for body content.

**RULE — Type A and Type B reuse the app's card wrapper; do not hand-roll the shell.** A Type A (container) or Type B (data-display) card MUST reuse the app's card wrapper component as its shell rather than writing raw `aiux-card` / `aiux-card-body` / `aiux-card-header` markup by hand. Pass the heading via the `card-title` attribute and the supporting line via `subtitle`; place body content — and, for Type B, the metric value / chart — in the default `<slot>`, header actions in `<slot name="header-action">`. This keeps the house heading style intact: the wrapper renders the header with `aiux-card-header-title` (the Horizon house weight, `--font-weight-normal` / 400), **not** DaisyUI's `aiux-card-title` (600 semibold). Hand-rolling the markup — or applying raw utilities like `text-lg font-medium` to a heading — bypasses the house style and is a violation. **Type C is the exception** (its badge cluster sits above the title, which the wrapper has no slot for) — see §2.3. Runtime binding is swappable and owned by the karuna repo: the current default wrapper is **`aict-card`** (AICT); switch to the ainpx equivalent once it matures.

> **Runtime binding (swappable).** "The app's card wrapper" is a runtime component owned by the karuna repo, not by this design-knowledge plugin. The current default is **`aict-card`** (AICT, the most mature app). When the ainpx card wrapper matures, switch the binding to it. The design intent (reuse a shell, slot the body, attributes for title/subtitle) is stable; only the concrete component name changes.

**Anatomy:**

```
┌─────────────────────────────────────────┐
│  Header: title + subtitle + arrow btn   │
├─────────────────────────────────────────┤
│                                         │
│  Body: <slot> (child content)           │
│                                         │
├─────────────────────────────────────────┤
│  Footer: <slot name="footer">           │  ← MISSING in current codebase
│  (action-set or AI insight row)         │
└─────────────────────────────────────────┘
```

### 2.2 Type B — Data Display Card

**Definition:** Self-contained — owns its data rendering. Receives data as properties and renders a specific visualization (metric value, score, stat with chart). Not a general-purpose container.

**Implementation:** `aict-metric-card`, `aict-score-card`, `aict-stat-card`.

**Identifying pattern:** Has `value` property. Renders numbers, charts, or scores directly. No `<slot>`.

**Anatomy:**

```
┌─────────────────────────────────────────┐
│  Header: title + subtitle + arrow btn   │
├─────────────────────────────────────────┤
│  Value: large metric (text-3xl+)        │
│  Change indicator: ▲/▼ with color       │
│  Chart: sparkline, bar, donut           │
├─────────────────────────────────────────┤
│  Footer: aggregation label or aiux-link      │  ← optional, not action-set
└─────────────────────────────────────────┘
```

### 2.3 Type C — Status/Priority Card

**Definition:** Communicates urgency, priority, or AI-driven recommendations. Uses status-colored borders, badge clusters, and AI insight content. Visually distinct from Type A and B.

**Implementation:** `aict-priority-card`.

**Identifying pattern:** Has `badges` array property, `variant` (primary/secondary), `dueStatus`, `aiInsight`.

**RULE — Type C is self-contained, but mirrors the `aict-card` structure for consistency.** A Type C status/priority card MUST NOT wrap `aict-card`: its badge cluster + due label sit **above** the title and `aict-card` exposes no slot there (`card.js` is karuna-owned and not editable from this plugin). Hand-build it instead, but **mirror the `aict-card` skeleton and reuse the same class hooks** so structure and style stay consistent with Type A/B — outer `aiux-card` (plus a status border such as `border-error` — full-strength, no opacity modifier), `aiux-card-body`, then an `aiux-card-header` whose heading uses `aiux-card-header-title` (house weight 400) and `aiux-card-header-subtitle`. The **only** structural addition over Type A/B is a badge-cluster + due-label row placed **above** the header. Reuse the same surface token (`bg-surface-primary`) and text tokens (`text-text-primary` / `-secondary` / `-tertiary`) the wrapper uses — never hardcoded hex, never a bespoke `static styles` shell for what these classes already provide, and never `aiux-card-title` (600) or `text-lg font-medium` on the heading. (The existing `aict-priority-card` predates this convention and uses hardcoded hex + `font-semibold`; do not copy it.)

**Anatomy:**

```
┌─────────────────────────────────────────┐
│  Badge cluster + meta label*            │
├─────────────────────────────────────────┤
│  Title                                  │
│  Meta: agent + assignee                 │
│  AI insight (sparkle + text)            │
├─────────────────────────────────────────┤
│  Footer: action-set                     │  ← MISSING — needed for approval context
└─────────────────────────────────────────┘
```

\* **meta label** is a general supporting-text slot in the badge-cluster row — a record number, a due/overdue label, a status age, an approval type, etc. Weight, color, and flexible positioning are defined in §5.3 (Badge System → "Badge-cluster row meta label"); reuse the `aiux-card-header-subtitle` class for its style.

### 2.4 Type Classification Hints

When validating a component file, classify by these signals:

| Signal                                                           | Type                     |
| ---------------------------------------------------------------- | ------------------------ |
| Imports or renders `<aict-card>`                                 | Type A — Container       |
| Has `value` prop AND renders numbers/charts directly             | Type B — Data Display    |
| Has `badges` array, `variant`, `dueStatus`, or `aiInsight` props | Type C — Status/Priority |
| Has `<slot>` for child content                                   | Type A — Container       |

**Decisive question — "is the card ITSELF a single status/priority entity, or does it GROUP many items?"** A card is Type C only when **the card body is one entity** whose own urgency/status it communicates (one case, one asset, one approval) — badges, `dueStatus`, and the AI insight describe **that single entity**. A card that **groups or lists multiple items** — even when each row carries its own priority/severity/SLA badge — is **Type A (a container)**, not Type C. Badges on **child items inside a list** are not a Type C signal; they belong to the items, not to the card. Test: if removing the collection would leave nothing, it was a container (Type A); if it leaves one focused entity with its own status, it's Type C. (Example: "a card grouping my assets and their outstanding tasks" = Type A container holding badged task rows — **not** Type C, even though the task rows have priority badges.)

## 3. Valid Layouts per Type

Not every DaisyUI card layout applies to every type. The card component sheet defines the full set of layout variants (image position, side layout, full-bleed). The table below constrains which layouts are valid for each card type.

| Layout                                               | Type A — Container                                                   | Type B — Data Display                                    | Type C — Status/Priority                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| **No image** (text-only)                             | ✅ Most common. Dashboard containers, slot wrappers.                 | ✅ Most common. Metric values, scores, stats.            | ✅ Most common. Badge + text + actions.                           |
| **Image top** (`<figure>` before `aiux-card-body`)   | ✅ Featured/hero container with visual context.                      | ✅ Chart or visualization rendered as image.             | ❌ Status cards lead with badges, not images.                     |
| **Image bottom** (`<figure>` after `aiux-card-body`) | ⚠️ Rare. Footer slot is usually more valuable than a trailing image. | ⚠️ Rare. Data should lead, not trail.                    | ❌ Not applicable.                                                |
| **Side image** (`aiux-card-side`)                    | ✅ Side-by-side content layout.                                      | ⚠️ Possible for chart-beside-value, but uncommon.        | ❌ Priority card anatomy doesn't support horizontal split.        |
| **Full-bleed image** (no `aiux-card-body`)           | ✅ Promotional/visual-first cards. No slots — image is the content.  | ❌ Data display requires text rendering, not image-only. | ❌ Status treatment (border, badges) requires structured content. |

**When a new layout emerges:** If a design introduces a card layout not in the component sheet's layout variants table, add it there first. Then update this table to indicate which types support it. The component sheet is the source of truth for _how_ a layout is built (which DaisyUI classes); this table governs _where_ a layout is valid.

## 4. Surface & Token Rules (All Types)

These checks apply universally regardless of card type. All corrections reference tokens and classes that exist today in `tailwind.css` and `themeVariables.css`.

### 4.1 Background

| Rule                                        | Correct       | Common Violations Found                                                                                                                          |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Card background uses DaisyUI semantic class | `bg-base-100` | `bg-white` (card.js), `background: white` (priority-card.js `.priority-primary`), `background: #f8fafc` (priority-card.js `.priority-secondary`) |
| Secondary variant background                | `bg-base-200` | Hardcoded `#f8fafc`                                                                                                                              |

`bg-base-100` resolves to white in light mode and `var(--neutral-200)` in dark mode via `themeVariables.css`. Using `bg-white` works in light mode but breaks in dark mode.

### 4.2 Shadow

| Rule                             | Correct                                                 | Common Violations Found                                  |
| -------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Standalone cards use `shadow-sm` | Tailwind `shadow-sm` class                              | No shadow (missing), or hardcoded `box-shadow` values    |
| Nested cards may suppress shadow | `shadow-none` when parent container provides separation | Inconsistent — some nested cards have shadow, some don't |

Cards use shadow as their primary shape-defining mechanism (no border in normal contrast). The shadow values are defined in `themeVariables.css` (`--shadow-sm` through `--shadow-2xl`).

### 4.3 Border

| Rule                                                | Correct                                                                                                | Common Violations Found                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No border in normal contrast                        | No `border` class or `aiux-card-border`                                                                | `border: 1px solid #e2e8f0` (card.js), `border-[var(--base-300,#e2e8f0)]` with hardcoded fallback (metric-card.js)                                                                                                                                        |
| If a border is needed for status treatment (Type C) | `border-success` or `border-error` (full-strength DaisyUI semantic border color — no opacity modifier) | Hardcoded `1.5px solid #d1fae5` (priority-card.js `.priority-primary`); `border-success/30` / `border-error/30` (opacity modifiers on semantic colors are banned project-wide by `daisyui_color_no_opacity_modifiers`, no exception for "subtle" borders) |

### 4.4 Radius

| Rule                                        | Correct                                           | Common Violations Found                                                                                                     |
| ------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Card radius resolves through `--radius-box` | Let DaisyUI `aiux-card` class inherit from theme  | `radius` string prop applied as inline style (card.js), `rounded-[32px]` hardcoded (metric-card.js, tasks-overview-card.js) |
| Radius must not be a component prop         | Remove `radius` property entirely                 | card.js exposes `radius` as a configurable prop — consumers pass arbitrary values                                           |
| Radius consistency across siblings          | All sibling cards in same context use same radius | tasks-overview-card passes `radius="32px"` while all other Type A cards pass `radius="24px"`                                |

**⚠️ OPEN:** The correct `--radius-box` value is under verification. `themeGenerator.js` defaults to `1rem` (16px); `themeVariables.css` defaults to `1.5rem` (24px); Figma shows 32px. The themeGenerator wins at runtime.

### 4.5 Text Colors

| Rule                | Correct class                              | Resolves to                                                       | Common Violations Found                              |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| Primary text        | `text-text-primary` or `text-text-primary` | `var(--color-text-primary)` = black (light) / white (dark)        | `text-slate-800`, `text-[#172b31]`                   |
| Secondary text      | `text-text-secondary`                      | `var(--color-text-secondary)` = `var(--neutral-800)`              | `text-slate-500`, `text-[#4a5e65]`, `text-slate-400` |
| Tertiary/muted text | `text-text-tertiary`                       | `var(--color-text-tertiary)` = `var(--neutral-600)`               | `text-slate-400`, `text-zinc-500`, `text-slate-600`  |
| Link text           | `text-primary-700` (Karuna utility)        | `var(--primary-700)` — matches `.aiux-link` color in tailwind.css | `text-sky-700`                                       |

The Karuna utility classes `text-text-primary`, `text-text-secondary`, `text-text-tertiary` are defined in `tailwind.css` under `@layer utilities` and reference the custom properties from `themeVariables.css`. These are the correct classes to use — they resolve per theme.

### 4.6 Badge size

Cards and widgets are compact, tight layouts; badges in them are secondary labels, not primary content — so they use the **small** size.

| Rule                                            | Correct                    | Common Violation                                         |
| ----------------------------------------------- | -------------------------- | -------------------------------------------------------- |
| Badges inside a card/widget default to small    | `aiux-badge aiux-badge-sm` | bare `aiux-badge` (resolves to the larger `md` default)  |
| Single badge that IS the card's primary content | `aiux-badge-md`+ (rare)    | using `md`/`lg` for ordinary status/priority/meta badges |

- [ ] **Badges in cards use `aiux-badge-sm`.** Applies to every badge in a card — the Type C badge cluster, a status badge by the title, badges in list rows. A bare `aiux-badge` resolves to DaisyUI's `md` (height ×6, 14px), which visually competes with the title/content; `aiux-badge-sm` (×5, 12px) reads as a proper secondary label. (Always pair the size with the base class: `aiux-badge aiux-badge-sm`.) Aligns with `aiux-badge.md` ("compact density / tight layouts → `aiux-badge-sm`"). Reserve `md`+ for the rare case where a single badge is the card's primary content.

## 5. Type-Specific Rules

### 5.1 Type A — Container Card

#### Header Anatomy

> **Forward reference:** Card headers will follow the header recipe (section variant) when it ships. Until then, header rules are inline here. The header recipe will define page, section, record, and panel header variants — card headers map to the section variant.

> **Scope — these header rules apply to EVERY card type that renders a header, not just Type A.** Type A and Type B reuse `aict-card`'s header; Type C mirrors the same header skeleton (§2.3). They live here only because §5.1 is the canonical header section; read them for Type B and Type C headers too.

- [ ] **Shell is the app card wrapper, not hand-rolled:** the card reuses the app's card wrapper (default `aict-card`) and passes the heading via the `card-title` attribute — it does NOT hand-write `aiux-card` / `aiux-card-header` markup. The wrapper emits a real heading styled with `aiux-card-header-title` (house weight, 400). Do NOT use DaisyUI's `aiux-card-title` (600 semibold), raw utilities like `text-lg font-medium`, or `font-semibold` / `font-bold` directly on a heading element — all of these bypass the house weight and are violations. Heading level should reflect the page outline (`<h3>` is typical within a page that has an `<h1>` title and `<h2>` section headings).
- [ ] **Title text token:** `text-text-primary` or `text-text-primary`
- [ ] **Subtitle is optional (all card types) — only render it when there is supporting information to show.** It is not a required header element; `aict-card` renders the `<p class="aiux-card-header-subtitle">` only when a `subtitle` value is passed (Type C, which mirrors the skeleton, applies the same rule). Do not invent filler subtitle text just to fill the slot, and do not treat the anatomy diagram (which depicts title + subtitle + arrow together) as a requirement that all three always appear.
- [ ] **Subtitle uses secondary text (when present):** `text-text-secondary`
- [ ] **Arrow button (when present):** `aiux-btn aiux-btn-circle aiux-btn-outline aiux-btn-sm`, border color `border-base-300`, icon color inherits via `currentColor`. The arrow button is **navigation** (pop-out or detail view) — it is not a contextual action. Do not use `aiux-btn-primary` or `aiux-btn-ghost`. Do not place it inside the header actions toolbar. It sits at the end of the header row, visually aligned to the top.
- [ ] **Header actions (when present):** Icon-only buttons in the header use `aiux-btn-ghost aiux-btn-sm aiux-btn-circle` with `aria-label` on each button. Group them in a container with `role="toolbar"` and `aria-label` describing the group (e.g., "Card actions"). Maximum three visible actions — overflow additional actions into a dropdown menu triggered by a vertical ellipsis (`ellipsis-v.svg`). These rules align with the contextual-actions composition recipe (card header variant).
- [ ] **Header layout:** `flex items-start justify-between`. Title and subtitle on the left, actions and arrow button on the right. When both header actions and an arrow button are present, header actions appear first (closer to the title), arrow button last (at the far end).

#### Footer Slot

- [ ] **Footer slot exists:** `<slot name="footer">` should be present on `aict-card`. _(Currently MISSING — Decision 1 from Doc 55. Engineering task required.)_
- [ ] **Footer content is action-set or AI insight row:** No other content types in the footer slot.
- [ ] **If action-set in footer:** Follows the action-set composition recipe — load and apply `references/action-set-spec.md` in full, not just this reference. See action-set-spec.md.
- [ ] **Never reuse the header toolbar's `aiux-btn-ghost` variant on footer action-set buttons — even for the dismissive role.** This is the single most common cross-region mistake on this composition: a card's header actions (§5.1 Header Anatomy, above) correctly use `aiux-btn-ghost aiux-btn-sm aiux-btn-circle` for equal-weight peers, and it is tempting to carry that same "low emphasis" visual into the footer for a Cancel/Defer/Dismiss button because it also reads as "the lesser action." It is not the same role. Per `action-set-spec.md` §2, Dismissive is `aiux-btn aiux-btn-secondary` — `aiux-btn-ghost` is not one of the three classes an action-set button is ever allowed to use (`aiux-btn-primary`, `aiux-btn-secondary`, `aiux-btn-error` only). A card with a ghost-styled header toolbar and a ghost-styled dismissive footer button is two compositions bleeding into one, not deliberate visual consistency. See `contextual-actions-spec.md` §5 "Combined with a card footer action-set" / check C-06 for the same rule from the other direction.
- [ ] **NO divider line above the footer/actions.** Footer buttons and action-sets must NOT be separated from the card body by a `border-t` / `border-top` rule, an `<hr>`, or an `aiux-divider`. Separation comes from **spacing** (the card's internal gap / footer slot padding), never a drawn line. This applies to every card type, not just the AI insight row (§6). A `border-t border-base-200` (or any top border) above a button row is a generic web-design habit that does not exist in Horizon — flag and remove it.

#### Body Slot

The body slot is intentionally unconstrained — it accepts any content. The composition recipe does not validate body content beyond token compliance (which applies to all elements regardless of slot). When the body renders async, empty, or error content, follow `@patterns/SKILL.md`.

Supporting description text (body text that could run long) must follow `@patterns/SKILL.md` — `line-clamp-2` for compact density, `line-clamp-3` for spacious, with a full-text tooltip on hover/focus.

### 5.2 Type B — Data Display Card

#### Shared Card Shell

- [ ] **Uses the `aiux-card` shell:** Type B cards use `aiux-card` / `aiux-card-body` like every other type (see § 2). _(Migration in progress: some existing components — `metric-card`, `score-card`, `stat-card` — predate this and still roll their own container CSS. New cards use the `aiux-card` shell; legacy ones are migration targets, not templates.)_

#### Value Display

- [ ] **Metric value uses heading font:** `font-sans` for large numeric values. Weight is `font-medium`.
- [ ] **Positive change indicator:** `aiux-badge aiux-badge-soft aiux-badge-success aiux-badge-sm` for a pill-shaped indicator (e.g. "▲ 12%"). The `aiux-badge-soft` modifier produces a pastel success background via `color-mix` — no opacity modifier needed. _(Currently: `#16a34a` text, `#dcfce7` background hardcoded in metric-card.js.)_
- [ ] **Negative change indicator:** `aiux-badge aiux-badge-soft aiux-badge-error aiux-badge-sm` for a pill-shaped indicator (e.g. "▼ 8%"). _(Currently: `#dc2626` text, `#fee2e2` background hardcoded.)_

DaisyUI's status colors (`--color-success`, `--color-error`) are defined in `themeVariables.css` and resolve per theme. Do NOT use opacity modifiers (`bg-success/10`, `bg-error/10`) — these violate `daisyui_color_no_opacity_modifiers`. Use `aiux-badge-soft` instead.

#### Chart Colors

- [ ] **Chart/sparkline colors use datavis tokens:** `var(--datavis-qualitative-*)` defined in `themeVariables.css`. _(Currently: mixed — some use datavis tokens, some hardcode.)_
- [ ] **Chart background is transparent:** `var(--datavis-chart-bg)` resolves to `transparent`. Do not add opaque backgrounds to chart containers inside cards.

### 5.3 Type C — Status/Priority Card

#### Variant Surface Treatment

- [ ] **Primary variant surface:** `bg-base-100` background with `border-success` border (full-strength, no opacity modifier — `border-success/30` violates `daisyui_color_no_opacity_modifiers`). _(Currently: `background: white`, `border: 1.5px solid #d1fae5`.)_
- [ ] **Secondary variant surface:** `bg-base-200` background with `border-base-300` border. _(Currently: `background: #f8fafc`, `border: 1px solid #e2e8f0`.)_
- [ ] **Radius:** Inherits from `--radius-box` — same as other card types.

#### Badge System

Badges should use DaisyUI's `aiux-badge` class with semantic color modifiers. The `aiux-badge-soft` modifier produces the correct pastel background + colored text pairing without needing dedicated subtle/text token pairs. (Badge **size** in cards is `aiux-badge-sm` — see §4.6.)

Every badge in a card requires **all four classes together**: `aiux-badge aiux-badge-soft aiux-badge-{color} aiux-badge-sm`. Omitting `aiux-badge-soft` renders a solid-fill badge; omitting `aiux-badge-sm` renders the larger md default that competes with card content. Never use bare `aiux-badge-{color}` without `aiux-badge-soft`.

- [ ] **Task badge:** `aiux-badge aiux-badge-soft aiux-badge-info aiux-badge-sm`. _(Currently: hardcoded `#e0f2fe` background, `#0369a1` text.)_
- [ ] **Expired badge:** `aiux-badge aiux-badge-soft aiux-badge-error aiux-badge-sm`. _(Currently: hardcoded `#fee2e2` background, `#dc2626` text.)_
- [ ] **AI badge:** `aiux-badge aiux-badge-soft aiux-badge-success aiux-badge-sm`. _(Currently: hardcoded `#f0fdf4` background, `#15803d` text, `#bbf7d0` border.)_
- [ ] **Risk badge:** `aiux-badge aiux-badge-soft aiux-badge-warning aiux-badge-sm`. _(Currently: hardcoded `#fef3c7` background, `#92400e` text.)_
- [ ] **Workflow state badge (pending, in-progress, under review):** `aiux-badge aiux-badge-soft aiux-badge-neutral aiux-badge-sm`. Process-position states ("Pending Approval," "Under Review," "Awaiting," "In Progress") mark where an item is in a workflow — not urgency. Do **not** use `aiux-badge-warning` for these; `aiux-badge-warning` signals something is at risk or blocked. Reserve semantic colors for outcomes: `success` = resolved/completed, `error` = failed/expired, `warning` = blocked/overdue/at risk, `info` = informational.
- [ ] **Badge radius:** DaisyUI `aiux-badge` class already applies pill radius via the Karuna override in `tailwind.css` (`.aiux-badge { border-radius: calc(infinity * 1px); }`). No manual `rounded-full` or hardcoded `9999px` needed.
- [ ] **All badges sit in a single cluster at the top of the card, above the title.** Status, state, priority, and category badges share one top row. Never render a standalone badge below the title, in the body, or in the footer — scattering badges (e.g. a lone category badge under the heading) breaks the scan pattern and matches no Type C card.
- [ ] **Badges carry status / state / priority / urgency signals only.** Category, type, and other descriptive labels are rendered as subtitle text below the title — not a badge (the same way data-display and metric cards render their subtitle). A descriptive category such as "Complaint" or "Tabular dataset" must not become a neutral badge.
- [ ] **Badge-cluster row meta label.** The top badge-cluster row may carry ONE short supporting text label alongside the badges. This slot is **general** — it holds a record number, a status age ("Requested 2 days ago"), a due/overdue label, an approval type, etc. The "due label" in the §2.3 anatomy is just one instance of it. **Style it by reusing the `aiux-card-header-subtitle` class** (which resolves to `font-size: var(--font-size-xs)` ≈ `text-xs`, `color: var(--color-text-tertiary)`, weight `normal`) rather than hand-listing raw utilities — that keeps it identical to the header subtitle and drift-proof if the tokens change. It is low-emphasis metadata: **never a badge, never `font-medium`/bold, never a status color.** **Order and alignment within the top row are flexible — there is no fixed slot.** Order the badges and the meta label by **scan priority** (lead with whatever the persona reads first). The label may come **before** the badges, **after** them, or be pushed to the **far end** with `ms-auto` — these are illustrative, not an exhaustive list.

#### Action-Set Footer (Pending — Decision 1)

- [ ] **Completable entity cards have action-set:** If the card represents a completable entity (approval, task assignment), it should have an action-set footer. _(Currently: no card has an action-set. Priority card is the strongest candidate.)_
- [ ] **Action-set follows action-set composition recipe:** See action-set-spec.md for button roles, ordering, and semantic color mapping. This includes the dismissive role → `aiux-btn-secondary`, never `aiux-btn-ghost` — see §5.1 Footer Slot above for why this is easy to get wrong on a card specifically (the badge-cluster/header region above legitimately uses `aiux-btn-ghost`; the footer does not inherit that).

## 6. Sub-Pattern: AI Insight Row

Four Type A cards share an identical "AI insight row" pattern at the bottom — a sparkmoji icon, insight text, and a right chevron.

**The AI insight row is optional — include it only when there is a genuine AI-generated insight to surface.** It is not a required element of any card type. Do not invent filler insight text to fill the row, and do not treat the §2.3 anatomy (which depicts the insight row) as a requirement that every Type C card has one. A card with no insight simply omits the row — same principle as the optional subtitle (§5.1).

### Token Compliance

| Element             | Correct                                                                                          | Common Violation                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Sparkmoji icon      | `icon({name: 'sn-sparkmoji-logo-fill', size: 'xs'})` from `@servicenow/aiux-directive-icon`      | Hand-drawn inline `<svg>` star; `ai-sparkle.svg`; green star |
| Sparkmoji color     | inherits via `currentColor` — same as the insight text (`text-text-primary`), NOT a status color | `text-success` / green; hardcoded `#25CB40`                  |
| Insight text color  | `text-text-primary`                                                                              | `text-primary-700` / `text-sky-700` (blue link color)        |
| Insight text weight | `font-normal` (400)                                                                              | `font-medium` (500)                                          |
| Chevron icon color  | `text-text-tertiary` (navigable rows only)                                                       | hardcoded `#94a3b8`                                          |

**Why the fill sparkmoji + text-primary, not a green sparkle:** the real AI-insight surfaces (`ai-insights.js`, `home`, `inventory-list`) use the `sn-sparkmoji-logo-fill` icon (the ServiceNow "sparkmoji") colored the same as the text via `currentColor`, with `text-text-primary` `font-normal` body text. The earlier "green sparkle (`text-success`) + blue `text-primary-700`" rule was stale — it predated the sparkmoji icon. Source SVGs live at `public/icons/sn-sparkmoji-logo-{fill,outline}-{12,16,20,24,32}.svg`; the icon directive resolves them by name.

### Structure

The row is exactly: sparkmoji + one sentence (+ optional chevron). It has no
surface fill of its own — it sits inline on the card. The **sparkmoji icon flows
inline with the text as one unit** (an `inline-block` prefix inside the text
element), NOT a separate flex column with a gap. The chevron is OPTIONAL and only
present on navigable rows; informational rows omit it (and drop `cursor-pointer`).

```html
<!-- Informational insight row (no chevron) -->
<p class="text-text-primary text-xs font-normal">
  <span class="inline-block align-text-bottom me-0.5"
    >${icon({name: 'sn-sparkmoji-logo-fill', size: 'xs'})}</span
  >Insight sentence here — flows as one unit with the icon.
</p>
```

```html
<!-- Navigable insight row — add a trailing chevron + interactivity -->
<button
  class="flex items-start gap-1.5 text-text-primary text-xs font-normal text-start"
>
  <span class="inline-block align-text-bottom me-0.5"
    >${icon({name: 'sn-sparkmoji-logo-fill', size: 'xs'})}</span
  >Insight sentence here.
  <span class="ms-auto text-text-tertiary"
    >${icon({name: 'chevron-right-outline', size: 'xs'})}</span
  >
</button>
```

### Rules

- Must have an `@click` handler or `href` if `cursor-pointer` is applied. `cursor-pointer` without interactivity is misleading.
- No `border-top` — visual separation from card body is provided by the card's internal spacing, not a divider.
- Consistent across all instances. Do not vary the layout, spacing, or icon treatment per card.
- Lives in the footer slot of Type A cards, or at the bottom of the body in Type B/C cards.
- **Content is an AI-surfaced insight, written conversationally — not a mechanical data dump.** The row explains _what's going on and why it matters_ in the AI's voice (e.g. "Connection failing — endpoint returning 503 for 15 min; 3 dependent AI Systems at risk"), not a raw log line ("503 503 503"). The sparkle marks it as AI-generated, so phrase it as something the AI is telling the user.
- **In-card status messaging = a status badge in the badge cluster + this insight row. They are SEPARATE elements in separate rows — never combined into one box.** The status badge lives where all other badges live: the Type C badge cluster at the top of the card body, or the Identity zone next to the title. The insight row carries only the explanation. "badge + insight row" means _use both patterns_, NOT _put a badge inside the insight row_.
- **The insight row contains exactly the sparkle icon + one explanatory sentence (+ an optional chevron on navigable rows). Nothing else.** Do not place a status badge, a timestamp ("12 min ago"), a relative-time label, a severity chip, a count, or any other metadata inside or beside the insight row. Status goes to the badge cluster; time and other metadata go to the card's supporting / meta text row.
- **The insight row has no background or filled container box of its own.** It sits inline on the card surface and uses lower-emphasis text (the exact class comes from the Token Compliance table above / the project text-token rules — do not hardcode it here). Wrapping the insight row in its own filled box with a badge header + body text recreates the `aiux-alert` component this section forbids, just built from `<div>`s — do not do it.
- **Do not duplicate status.** If the card already shows its state via a badge in the Identity zone (e.g. an "Error" badge by the title), do not add a second status badge ("Scan failed") lower down. One status signal per card.
- **Never embed `aiux-alert*` inside a card body or footer, and never put `role="alert"` or a full alert-style border on the card root either** — the `aiux-alert` component is reserved for section- or page-level notifications. An "alert-type" or urgent widget rendered as a card is still a Type C status card: urgency is conveyed by a status badge (e.g. `aiux-badge-soft aiux-badge-error`) + the insight row, never by alert treatment on the card. Convey the signal with a badge + insight row per the rules above instead.

## 7. Sub-Pattern: Arrow Button (Pop-Out / Navigate)

Present in most Type A and Type B card headers. Navigates to a detail view or opens a pop-out modal.

### Token Compliance

| Element        | Correct                                                 | Current Violation                                                                                                                        |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Button classes | `aiux-btn aiux-btn-circle aiux-btn-outline aiux-btn-sm` | Sometimes `aiux-btn-ghost` (inconsistent) — never `aiux-btn-ghost`: the visible border distinguishes navigation from a contextual action |
| Border         | `border-base-300`                                       | `border-gray-200` or Slate classes                                                                                                       |
| Icon           | Inherits via `currentColor` from button text color      | `#94a3b8` hardcoded                                                                                                                      |

### Rules

- The arrow button is **navigation**, not an action. It must not use `aiux-btn-primary`.
- Always positioned at the end (right in LTR) of the card header, aligned to the top of the header content.
- Uses `aria-label` describing the destination (e.g., "View inventory details").

## 8. Nesting Rules

Cards can nest inside other containers (panels, panes, page sections). When nesting:

- **Nested cards** may use `shadow-none` if the parent container provides visual separation through its own surface treatment and elevation. Whether to suppress shadow depends on the specific layout context.
- **Radius** resolves through `--radius-box` for all standalone cards. When cards are visually nested inside a parent container, a smaller radius may be appropriate to maintain visual hierarchy — apply `rounded-2xl` (16px) for nested contexts.
- **Maximum nesting depth is two levels.** If a design requires deeper nesting, that's a content structure problem — restructure the information hierarchy instead of adding more card layers.
- **Surface color differentiation:** When cards nest, use `bg-base-100` for the child card and `bg-base-200` (or `bg-background-secondary`) for the parent container to maintain visual separation. Do not use identical surface colors for parent and child without shadow differentiation.

## 9. Structural Issues

### Missing footer slot (Decision 1 — Blocks recipe completion)

`aict-card` has no `<slot name="footer">`. The recommended fix is to add one — see Doc 55 Decision 1. This is an engineering task that unblocks action-set-in-card and formalizes the AI insight row placement.

### Type B cards build separate shells

`aict-metric-card`, `aict-score-card`, and `aict-stat-card` each construct their own card container instead of using the shared `aiux-card` / `aiux-card-body` shell. This means token fixes must be applied per-component rather than once on the shared shell.

**Generating a new card:** build the shell with `aiux-card` / `aiux-card-body` directly (see §2) — this is the primary path and inherits all token fixes automatically. `aict-card` is one Type A consumer of this shell, not a requirement.

**Migrating these existing components,** options:

- **Option A (preferred):** Refactor onto the `aiux-card` / `aiux-card-body` shell — inherits all token fixes automatically.
- **Option B:** Extract a shared base CSS class that all card types consume.
- **Option C:** Accept per-component maintenance — validate each independently.

### Radius prop should be removed entirely

The `radius` prop on `aict-card` is the root cause of radius inconsistency. Every wrapper passes a different value (`"24px"`, `"32px"`). The fix is not to standardize the prop value — it's to remove the prop and let `--radius-box` resolve through the theme:

```css
.aiux-card {
  border-radius: var(--radius-box);
}
```

This single change removes 6 instances of `radius="24px"` from wrapper components, fixes the `radius="32px"` inconsistency in tasks-overview-card, and makes radius token-governed and theme-switchable.

### AI sparkmoji should use the icon system, not a hand-drawn SVG

A hand-drawn sparkle SVG (e.g. `fill="#25CB40"`) is copy-pasted into several component files. The fix: use the icon directive with the `sn-sparkmoji-logo-fill` icon and let the color inherit via `currentColor` (the icon takes the insight text's color, `text-text-primary` — not green). This eliminates the duplicate inline SVGs and keeps the icon theme-responsive. See §6 for the full rule.

## 10. Token Quick Reference

All tokens and classes below exist today in `tailwind.css` and `themeVariables.css`.

| Property                  | Class / Token                                                 | Source File                            | Notes                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card background           | `bg-base-100`                                                 | themeVariables.css                     | White (light), `neutral-200` (dark). Not `bg-white`.                                                                                                                    |
| Card shadow               | `shadow-sm`                                                   | themeVariables.css                     | `--shadow-sm` defined in `:root`.                                                                                                                                       |
| Card border               | None                                                          | —                                      | No border in normal contrast.                                                                                                                                           |
| Card radius               | Inherited via `--radius-box`                                  | themeVariables.css / themeGenerator.js | Value under verification.                                                                                                                                               |
| Primary text              | `text-text-primary`                                           | tailwind.css utility                   | Resolves to `var(--color-text-primary)`.                                                                                                                                |
| Secondary text            | `text-text-secondary`                                         | tailwind.css utility                   | Resolves to `var(--color-text-secondary)`.                                                                                                                              |
| Tertiary/muted text       | `text-text-tertiary`                                          | tailwind.css utility                   | Resolves to `var(--color-text-tertiary)`.                                                                                                                               |
| Link text                 | `text-primary-700`                                            | tailwind.css utility                   | Matches `.aiux-link` / `.aiux-link-primary` color.                                                                                                                      |
| AI insight sparkmoji      | `sn-sparkmoji-logo-fill` (icon directive)                     | public/icons + icon directive          | Color inherits via `currentColor` (= `text-text-primary`), NOT a green/`text-success` fill.                                                                             |
| Arrow button border       | `border-base-300`                                             | DaisyUI                                | `var(--color-base-300)`.                                                                                                                                                |
| Status success            | `aiux-badge-soft aiux-badge-success`                          | DaisyUI                                | Soft produces pastel bg + colored text.                                                                                                                                 |
| Status error              | `aiux-badge-soft aiux-badge-error`                            | DaisyUI                                | Same pattern.                                                                                                                                                           |
| Status warning            | `aiux-badge-soft aiux-badge-warning`                          | DaisyUI                                | Same pattern.                                                                                                                                                           |
| Status info               | `aiux-badge-soft aiux-badge-info`                             | DaisyUI                                | Same pattern.                                                                                                                                                           |
| Badge radius              | Automatic via `.aiux-badge`                                   | tailwind.css override                  | `border-radius: calc(infinity * 1px)`.                                                                                                                                  |
| Positive change indicator | `aiux-badge aiux-badge-soft aiux-badge-success aiux-badge-sm` | DaisyUI                                | Per §5.2 — do NOT use `bg-success/10` / `text-success` opacity or standalone text; `aiux-badge-soft` produces the pastel bg + text pairing without an opacity modifier. |
| Negative change indicator | `aiux-badge aiux-badge-soft aiux-badge-error aiux-badge-sm`   | DaisyUI                                | Per §5.2 — do NOT use `bg-error/10` / `text-error` opacity or standalone text; same `aiux-badge-soft` pattern.                                                          |
| Datavis chart colors      | `var(--datavis-qualitative-*)`                                | themeVariables.css                     | 33-color palette defined in `:root`.                                                                                                                                    |

## 11. Scope Boundary

This recipe covers how cards compose — type classification, slot anatomy, sub-patterns, token compliance per region, and structural prerequisites. It does NOT cover:

- **Individual card shell rules** (DaisyUI class anatomy, Seismic migration, which DaisyUI modifiers to use) — see the card component sheet (card.md).
- **Action-set rules within card footers** — the action-set composition recipe owns button group rules. This recipe only documents that the footer slot should contain an action-set when the entity is completable.
- **Card grid layout** (how cards arrange on a page, responsive column counts) — Track A layout concern.
- **Content inside the body slot** (chart configuration, list rendering, metric formatting) — content-specific, not a card composition concern.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above.

### Structural checks

| #    | Check                                          | Spec section                                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Card type identified                           | §2 Card Types, §2.4 Type Classification Hints          | Every card classifies as Type A (Container), Type B (Data Display), or Type C (Status/Priority). Use the classification signals — `<aict-card>` import → A; `value` prop + direct numeric/chart rendering → B; `badges`/`variant`/`dueStatus`/`aiInsight` props → C.                                                                                                                                                                                                                                                            |
| S-02 | Card shell uses `aiux-card` / `aiux-card-body` | §2 Card Types, §5.2 Shared Card Shell                  | **Every card type (A / B / C)** builds its shell with the `aiux-card` class wrapping a `aiux-card-body` content region. Two violation patterns: (1) fully hand-authored shell — a `<div>` / `<section>` with `rounded-*` / `bg-*` / `shadow-*` / `p-*` utilities standing in for both card classes; (2) partial shell — `aiux-card` on the outer element but a plain `<div>` with manual padding substituted for `aiux-card-body`. Both lose the card's tokenized padding, density modifiers (`aiux-card-sm`), and flex layout. |
| S-03 | Type A footer slot present                     | §5.1 Footer Slot                                       | `<slot name="footer">` exists on the Type A shell. Currently MISSING on `aict-card` (Decision 1 from Doc 55) — unblocks action-set-in-card and formalizes the AI insight row placement.                                                                                                                                                                                                                                                                                                                                         |
| S-04 | Type B/C use the card shell too                | §5.2 Shared Card Shell, §9                             | Type B and Type C use the same `aiux-card` / `aiux-card-body` shell as Type A — not a bespoke container. Legacy components (`metric-card`, `score-card`, `stat-card`, `priority-card`) that roll their own shell are migration targets, not patterns to copy.                                                                                                                                                                                                                                                                   |
| S-05 | `radius` prop removed                          | §4.4 Radius, §9 Radius prop should be removed entirely | `aict-card` must not expose `radius` as a configurable prop. Radius resolves through `--radius-box` via the DaisyUI `aiux-card` class. Per-wrapper radius values (`"24px"`, `"32px"`) are violations.                                                                                                                                                                                                                                                                                                                           |
| S-06 | Layout valid for type                          | §3 Valid Layouts per Type                              | The chosen DaisyUI card layout (no image, image top, image bottom, side image, full-bleed) matches the permitted set for the card's type. Full-bleed and side image are invalid for Type C; full-bleed is invalid for Type B.                                                                                                                                                                                                                                                                                                   |

### Semantic / token checks

| #    | Check                                             | Spec section                             | Description                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Background uses DaisyUI semantic                  | §4.1 Background                          | Card background is `bg-base-100` (or `bg-base-200` for secondary variant). `bg-white`, hardcoded `background: white`, and literals like `#f8fafc` are violations.                                                                                                                                                                                                                     |
| V-02 | Standalone cards use `shadow-sm`                  | §4.2 Shadow                              | Standalone cards use the `shadow-sm` class. Missing shadow or hardcoded `box-shadow` values are violations. Nested cards may use `shadow-none` when the parent provides separation.                                                                                                                                                                                                   |
| V-03 | No border in normal contrast                      | §4.3 Border                              | Type A and Type B cards have no `border` class and no `aiux-card-border`. `border: 1px solid #e2e8f0` and `border-[var(--base-300,#e2e8f0)]` with hardcoded fallbacks are violations.                                                                                                                                                                                                 |
| V-04 | Type C border uses full-strength semantic color   | §4.3 Border                              | When Type C needs a status border, use `border-success` or `border-error` — full-strength, no opacity modifier. Hardcoded `1.5px solid #d1fae5` is a violation, and so is `border-success/30` / `border-error/30` (opacity modifiers on semantic colors are banned project-wide, no "subtle border" exception).                                                                       |
| V-05 | Radius via `--radius-box`                         | §4.4 Radius                              | Card radius resolves through `--radius-box` from the theme. Inline `radius` style props and hardcoded `rounded-[32px]` are violations.                                                                                                                                                                                                                                                |
| V-06 | Text color tokens                                 | §4.5 Text Colors                         | Primary text uses `text-text-primary` or `text-text-primary`; secondary uses `text-text-secondary`; tertiary uses `text-text-tertiary`; link text uses `text-primary-700`. Slate and zinc classes and hex literals are violations.                                                                                                                                                    |
| V-07 | Value change indicators                           | §5.2 Value Display                       | Type B positive change uses `aiux-badge aiux-badge-soft aiux-badge-success aiux-badge-sm`; negative change uses `aiux-badge aiux-badge-soft aiux-badge-error aiux-badge-sm`. Hardcoded `#16a34a`/`#dcfce7`, `#dc2626`/`#fee2e2`, and opacity modifiers (`bg-success/10`, `bg-error/10`) are violations.                                                                               |
| V-08 | Chart colors use datavis tokens                   | §5.2 Chart Colors                        | Chart/sparkline colors reference `var(--datavis-qualitative-*)`. Chart backgrounds are transparent (`var(--datavis-chart-bg)`). Mixed or hardcoded chart palettes are violations.                                                                                                                                                                                                     |
| V-09 | Type C variant surfaces                           | §5.3 Variant Surface Treatment           | Primary variant: `bg-base-100` + `border-success` (full-strength, no opacity). Secondary variant: `bg-base-200` + `border-base-300`. Hardcoded `background: white` / `#f8fafc`, hex borders, and `border-success/30`-style opacity modifiers are violations.                                                                                                                          |
| V-10 | Badges use `aiux-badge-soft` semantic             | §5.3 Badge System                        | Task → `aiux-badge aiux-badge-soft aiux-badge-info`; expired → `aiux-badge-soft aiux-badge-error`; AI → `aiux-badge-soft aiux-badge-success`; risk → `aiux-badge-soft aiux-badge-warning`. Hardcoded backgrounds/text colors on badges are violations. Badge radius is automatic via the `.aiux-badge` override — no `rounded-full`/`9999px`.                                         |
| V-11 | AI insight row tokens                             | §6 Sub-Pattern: AI Insight Row           | Icon → `sn-sparkmoji-logo-fill` via the icon directive, colored by `currentColor` (same as text); insight text → `text-text-primary` `font-normal`; chevron (navigable only) → `text-text-tertiary`. Hand-drawn star SVG, `text-success`/green, `text-primary-700`/blue, and `font-medium` are violations.                                                                            |
| V-12 | Arrow button tokens                               | §7 Sub-Pattern: Arrow Button             | Classes are `aiux-btn aiux-btn-circle aiux-btn-outline aiux-btn-sm`; border is `border-base-300`; icon color inherits via `currentColor`. `aiux-btn-ghost`, Slate borders, and hardcoded icon colors are violations.                                                                                                                                                                  |
| V-13 | No ghost-bleed from header into footer action-set | §5.1 Footer Slot, §5.3 Action-Set Footer | Footer action-set buttons never use `aiux-btn-ghost`, including the dismissive role (Cancel/Defer/Dismiss). Per `action-set-spec.md` §2, dismissive is `aiux-btn aiux-btn-secondary`. `aiux-btn-ghost` on a footer button is a violation even when the card's header toolbar correctly uses `aiux-btn-ghost` for its own equal-weight peers — the two regions do not share a variant. |

### Layout checks

| #    | Check                                     | Spec section                                      | Description                                                                                                                                                                                                                                                                                                                                              |
| ---- | ----------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | Header layout                             | §5.1 Header Anatomy                               | Type A header is `flex items-start justify-between`. Title and subtitle sit left; header actions and arrow button sit right. When both are present, header actions come first and the arrow button is last.                                                                                                                                              |
| L-02 | Arrow button position and role            | §5.1 Header Anatomy, §7 Sub-Pattern: Arrow Button | The arrow button is navigation — `aiux-btn aiux-btn-circle aiux-btn-outline aiux-btn-sm` at the end of the header row, top-aligned. It must not sit inside the header actions toolbar and must not use `aiux-btn-primary` or `aiux-btn-ghost`.                                                                                                           |
| L-03 | Heading element and level                 | §5.1 Header Anatomy, §2.1 Type A RULE             | Card reuses the app card wrapper (default `aict-card`) and sets the heading via `aiux-card-title` — not hand-rolled `aiux-card`/`aiux-card-header` markup. Wrapper emits a real heading with `aiux-card-header-title` (house weight 400), NOT DaisyUI `aiux-card-title` (600) or raw `text-lg font-medium` on a `<h3>`. Level reflects the page outline. |
| L-04 | Header actions limit and grouping         | §5.1 Header Anatomy                               | Icon-only header buttons use `aiux-btn-ghost aiux-btn-sm aiux-btn-circle` with per-button `aria-label`, grouped in a container with `role="toolbar"` and a toolbar `aria-label`. Max three visible actions — overflow the rest into a vertical-ellipsis dropdown. Aligns with contextual-actions-spec.md (card header variant).                          |
| L-05 | AI insight row structure                  | §6 Sub-Pattern: AI Insight Row                    | `sn-sparkmoji-logo-fill` icon flows **inline with the text as one unit** (inline-block prefix), text is `text-text-primary` `text-xs` `font-normal`; optional trailing chevron only on navigable rows. No `border-top`. Consistent across instances. Lives in the Type A footer slot, or at the bottom of the body for Type B/C.                         |
| L-06 | Nesting depth and surface differentiation | §8 Nesting Rules                                  | Maximum two levels of card nesting. Nested cards use `bg-base-100` with the parent at `bg-base-200`/`bg-background-secondary`. Identical surface colors without shadow differentiation are violations. Deeper nesting indicates a content-hierarchy problem — restructure instead.                                                                       |

### Accessibility checks

| #    | Check                                       | Spec section                   | Description                                                                                                                                                  |
| ---- | ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-01 | AI insight row interactivity matches cursor | §6 Sub-Pattern: AI Insight Row | If `cursor-pointer` is applied, the row must have an `@click` handler or `href`. Pointer cursor without interactivity is misleading.                         |
| A-02 | Arrow button `aria-label`                   | §7 Sub-Pattern: Arrow Button   | Arrow buttons use `aria-label` describing the destination (e.g., "View inventory details").                                                                  |
| A-03 | Header actions toolbar semantics            | §5.1 Header Anatomy            | Icon-only header buttons carry per-button `aria-label`; the group carries `role="toolbar"` with an `aria-label` describing the group (e.g., "Card actions"). |

---

## Resolution Guidance

### S-02: Type B card builds its own shell

**Generating a new card:** build the shell with the `aiux-card` / `aiux-card-body` classes directly (see §2) — this is the primary path, and inherits the shared token fixes for background, shadow, border, and radius automatically. The `aict-card` web component is one Type A consumer of this shell, not a requirement.

**Migrating an existing Type B component** that rolls its own shell: refactor it onto the `aiux-card` / `aiux-card-body` shell (Option A, preferred) so it inherits the same token fixes. If refactor isn't feasible, extract a shared base CSS class (Option B) so token fixes apply once. Per-component maintenance (Option C) is the fallback — validate each independently.

### S-03: Type A card missing footer slot

Add `<slot name="footer">` to the `aict-card` template. This is an engineering task (Doc 55 Decision 1) that unblocks action-set-in-card and formalizes AI insight row placement. Until the slot ships, Type A cards cannot carry an action-set or a structurally correct AI insight row.

### S-05: `radius` prop present on card

Remove the `radius` prop from `aict-card` entirely. Replace with:

```css
.aiux-card {
  border-radius: var(--radius-box);
}
```

This single change deletes the six `radius="24px"` passes from wrapper components, fixes the `radius="32px"` inconsistency on tasks-overview-card, and makes radius token-governed and theme-switchable.

### V-01: Hardcoded `bg-white` or hex background

Change to `bg-base-100` (primary surface) or `bg-base-200` (secondary variant). `bg-white` works in light mode but breaks in dark mode — `bg-base-100` resolves correctly in both themes via `themeVariables.css`.

### V-03 / V-04: Hardcoded border on card

Type A and Type B: remove the border entirely — the shadow is the shape-defining mechanism. Type C with status treatment: replace hardcoded borders like `1.5px solid #d1fae5` with the full-strength DaisyUI semantic border class — `border-success` or `border-error` — **not** an opacity-modified variant (`border-success/30`, `border-error/30`); opacity modifiers on semantic colors are banned project-wide with no "subtle border" exception. Pair Type C secondary variant borders with `border-base-300`.

### V-05: Hardcoded radius

Delete the hardcoded radius (`rounded-[32px]`, inline `radius` style prop) and let the DaisyUI `aiux-card` class inherit `--radius-box` from the theme. For nested contexts where a smaller radius is appropriate, use `rounded-2xl` (16px).

### V-06: Slate / zinc / hex text colors

Replace with the Karuna utility classes that resolve per theme:

- `text-slate-800`, `text-[#172b31]` → `text-text-primary` (or `text-text-primary`)
- `text-slate-500`, `text-[#4a5e65]`, `text-slate-400` → `text-text-secondary`
- `text-slate-400`, `text-zinc-500`, `text-slate-600` → `text-text-tertiary`
- `text-sky-700` → `text-primary-700`

### V-07: Hardcoded change indicator colors

Replace each hardcoded pair with the `aiux-badge-soft` pattern — do NOT use opacity modifiers (`bg-success/10`, `bg-error/10`), which violate `daisyui_color_no_opacity_modifiers`:

- `#16a34a` text + `#dcfce7` background → `aiux-badge aiux-badge-soft aiux-badge-success aiux-badge-sm`
- `#dc2626` text + `#fee2e2` background → `aiux-badge aiux-badge-soft aiux-badge-error aiux-badge-sm`

### V-10: Hardcoded badge colors

Replace each hardcoded badge pair with the semantic `aiux-badge-soft` class. The `aiux-badge-soft` modifier produces the pastel background + colored text pairing automatically:

```html
<!-- Before -->
<span style="background: #e0f2fe; color: #0369a1;">Task</span>

<!-- After -->
<span class="aiux-badge aiux-badge-soft aiux-badge-info">Task</span>
```

Pill radius is applied automatically via the `.aiux-badge` override in `tailwind.css` — do not add `rounded-full` or `9999px`.

### V-11: Hand-drawn sparkle / wrong insight-row colors

Use the icon directive with the `sn-sparkmoji-logo-fill` icon, flowing inline with the text, colored by `currentColor`:

```html
<p class="text-text-primary text-xs font-normal">
  <span class="inline-block align-text-bottom me-0.5"
    >${icon({name: 'sn-sparkmoji-logo-fill', size: 'xs'})}</span
  >Insight sentence here.
</p>
```

This eliminates the duplicate hand-drawn inline SVGs and keeps the icon theme-responsive. Do NOT use a green sparkle (`text-success`), blue link text (`text-primary-700`), or `font-medium` — the insight icon and text are both `text-text-primary` `font-normal`. See §6.

### V-12: Arrow button uses `aiux-btn-ghost` or hardcoded border

Change to `aiux-btn aiux-btn-circle aiux-btn-outline aiux-btn-sm` with `border-base-300`. The icon color must inherit via `currentColor` — remove any hardcoded `#94a3b8` or Slate-class icon colors. The arrow button is navigation, never an action — it must not use `aiux-btn-primary`.

### V-13: Footer action-set button uses `aiux-btn-ghost`

Change the button to its correct action-set role class per `action-set-spec.md` §2 — most commonly `aiux-btn-secondary` for the dismissive role (Cancel, Defer, Not now). `aiux-btn-ghost` is never a valid action-set class (only `aiux-btn-primary`, `aiux-btn-secondary`, `aiux-btn-error` are). This mistake usually happens by visual analogy to the card's own header toolbar, which correctly uses `aiux-btn-ghost` for its equal-weight icon peers — that variant does not carry over to the footer; the footer is a different composition (action-set) with its own role-to-class mapping.

```html
<!-- Before (wrong — Defer copies the header's ghost treatment) -->
<div class="aiux-card-actions justify-end">
  <button class="aiux-btn aiux-btn-ghost aiux-btn-sm">Defer</button>
  <button class="aiux-btn aiux-btn-primary aiux-btn-sm">Approve Policy</button>
</div>

<!-- After (correct — dismissive role maps to secondary) -->
<div class="aiux-card-actions justify-end">
  <button class="aiux-btn aiux-btn-secondary aiux-btn-sm">Defer</button>
  <button class="aiux-btn aiux-btn-primary aiux-btn-sm">Approve Policy</button>
</div>
```

### L-02: Arrow button placed inside header actions toolbar

Move the arrow button out of the toolbar cluster to the end of the header row, top-aligned. The toolbar hosts contextual actions (icon-only `aiux-btn-ghost aiux-btn-sm aiux-btn-circle` buttons under `role="toolbar"`); the arrow button is a navigation affordance that sits visually separate at the far end.

### L-04: More than three visible header actions

Move the lowest-priority actions into an overflow dropdown triggered by a vertical ellipsis (`ellipsis-v.svg`), until three or fewer remain visible. The overflow trigger itself still uses `aiux-btn-ghost aiux-btn-sm aiux-btn-circle` with an `aria-label` (e.g., "More actions"). See contextual-actions-spec.md (card header variant) for the full overflow pattern.

### L-06: Cards nested three or more levels deep

Restructure the information hierarchy — deeper nesting indicates a content problem, not a layout problem. Flatten to two levels maximum. Differentiate the two surfaces with `bg-base-200` on the parent and `bg-base-100` on the child; use `rounded-2xl` (16px) on the nested card when a smaller radius reinforces the hierarchy.

### A-01: `cursor-pointer` on AI insight row without handler

Either add an `@click` handler (or `href` on an anchor) that navigates to the linked detail, or remove `cursor-pointer`. A pointer cursor without interactivity is a misleading affordance.
