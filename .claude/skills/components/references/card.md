# Card

**DaisyUI base:** `card`
**Production component:** None — native `<div>` element + `aiux-card` classes
**Last updated:** 2026-07-06 · v6

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Anatomy

DaisyUI provides a structured card with named sub-elements. All are optional — a card can be as simple as `<div class="aiux-card">` with arbitrary content.

| Element        | DaisyUI class                                                                | Purpose                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Card shell** | `aiux-card`                                                                  | Outer container. Provides surface color, radius, shadow.                                                                                              |
| **Header**     | `aiux-card-header` (+ `aiux-card-header-title`, `aiux-card-header-subtitle`) | Standard heading treatment. Title is required; subtitle is optional — add it only when there is real supporting information to show, never as filler. |
| **Body**       | `aiux-card-body`                                                             | Content region with size-dependent padding. A free-form slot — wraps text, form fields, data displays, or any content.                                |
| **Actions**    | `aiux-card-actions`                                                          | Button group at the bottom of `aiux-card-body`. Uses `justify-end` by default.                                                                        |
| **Border**     | `aiux-card-border`                                                           | Applied by default. Adds the 1 px `border-base-300` border defined by the surface treatment.                                                          |

**Heading: always use the header — never `aiux-card-title`.** `aiux-card-header-title` (font-weight-normal, 400) is the only heading treatment for a card, inside `aiux-card-header` above `aiux-card-body`. This applies even to a card with no subtitle or actions — add `aiux-card-header` for the heading alone rather than placing a heading in the body. DaisyUI's `aiux-card-title` (600 semibold) exists in the class family but must not be used — it conflicts with the house weight.

`aiux-card-header-title` sets weight only — it has no font-size of its own (unlike `aiux-card-header-subtitle`, which already sets 12px). Pair it explicitly with `text-base` (16px); do not rely on the heading tag's own default size.

`aiux-card-header` does not set its own padding — pair it with `pl-6 pr-4 pt-4` (or `px-6 pt-4` when the header has no trailing action) to match the Figma spacing.

**Surface treatment (per Figma):** White surface, hairline border, 32 px radius, subtle shadow. `aiux-card` (with `aiux-card-border` for the border) already applies all of this via the Horizon 2.0 overrides in `tailwind.css` — do not add `bg-base-100`, `rounded-4xl`, `border border-base-300`, or `shadow-sm` as separate utility classes; that duplicates what the class already provides and can conflict with future theme changes. The border is present on all card variants by default — `aiux-card-border` is an alias for this default treatment, not an opt-in modifier. If a plain (non-`aiux-card`) container needs the same surface fill, use the semantic token `bg-surface-primary`, never `bg-base-100` (see `daisyui.md` → `card_surface_backgrounds`).

### 2. Body content

The body is a free-form slot — per Figma, it accepts arbitrary content (text, form fields, data displays). There is no structured image-position variant system in the current Figma library.

Need an image alongside card content? A real hero/thumbnail card layout exists in production — in the gallery list view (`components/list/src/components/list-layouts/gallery/`) — but it is a bespoke implementation scoped to that component (its own Tailwind classes, not `aiux-card-side`), and card grid/gallery layout is out of this sheet's scope (see § 9). It is not built with the classes below.

The `aiux-card` class family also exposes `aiux-card-side` (horizontal layout) and a `<figure>` convention for full-bleed/side images, but neither has a confirmed Figma pattern or any production usage yet — do not use until confirmed.

### 3. Sizing

| Context                        | Size class     | Body padding | Notes             |
| ------------------------------ | -------------- | ------------ | ----------------- |
| Minimal chrome                 | `aiux-card-xs` | 8px (`p-2`)  | Tightest padding. |
| Compact cards in dense layouts | `aiux-card-sm` | 16px (`p-4`) | Reduced padding.  |
| Standard card (default)        | `aiux-card-md` | 24px (`p-6`) | Default padding.  |

The default size is `aiux-card-md` (24 px body padding) — applied by omitting a size class, not by writing `aiux-card-md` explicitly. The class family also exposes `aiux-card-lg` and `aiux-card-xl`, but neither has any production usage or a confirmed Figma pattern yet — do not use until confirmed.

### 4. Nesting

When a card sits inside another container (a panel, a pane, or another card), consider shadow and radius:

- **Nested cards** may use `shadow-none` if the parent container already provides visual separation through its own surface treatment. Whether to suppress shadow depends on the specific layout — the composition recipe defines this per card type.
- **Radius** — when a card is visually nested inside a parent container, a smaller radius may be appropriate to maintain visual hierarchy. The composition recipe defines nesting-specific radius rules per card type.
- Cards should never nest more than two levels deep. If a design requires deeper nesting, that is a content structure problem, not a card problem.

### 5. States

| State                                       | Treatment                                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default**                                 | Surface fill, shadow, radius, and border — all applied automatically by `aiux-card`/`aiux-card-border`. Do not add `shadow-sm`/`rounded-4xl`/`bg-base-100` explicitly (see §1). |
| **Hover** (interactive cards only)          | `hover:shadow-md` — shadow increases. No background color change.                                                                                                               |
| **Focus-visible** (interactive cards only)  | Focus ring using `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.                                                                        |
| **Active/pressed** (interactive cards only) | `active:shadow-xs` — shadow compresses. Subtle feedback.                                                                                                                        |
| **Selected** (selectable cards only)        | Composition recipe defines treatment — typically `ring-2 ring-primary` or `border-2 border-primary`.                                                                            |
| **Disabled**                                | `opacity-50 pointer-events-none`. Rare — cards are not typically disabled.                                                                                                      |
| **Loading**                                 | Skeleton placeholder matching the card's layout structure. Defined in the composition recipe, not here.                                                                         |

### 6. Content rules

- **Title text:** Sentence case. Describes the content group concretely — not a generic label like "Details" or "Info".
- **Title truncation:** If the title exceeds container width, it truncates with ellipsis. A tooltip reveals the full text on hover. Reference `@patterns/references/truncation-tooltip.md` for the tooltip behavior.
- **Body content:** Appropriate to the card type (text, form controls, data displays, media). Content rules specific to each card type are defined in the card composition recipe.
- **Internationalization:** All user-facing strings — header titles, card titles, action labels, and tooltip text — must be wrapped with `i18n.getMessage()`. See `@internationalization` for the full API and parameterized message syntax.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Card (use `role="group"` with `aria-labelledby` pointing to the card heading; no button-in-button nesting on clickable cards)
- **Forced colors:** Non-clickable cards follow the **container** pattern; clickable cards follow the **interactive** pattern — see `@accessibility`

### 8. RTL

Card layout mirrors automatically in RTL:

- `aiux-card-actions` with `justify-end` moves buttons to the inline-start side in RTL.
- Sidebar borders using `border-s-4` (logical property) automatically switch sides.
- Text alignment inherits from document direction.

### 9. Scope boundary

This sheet covers single-card decisions: which DaisyUI classes to use, what radius/shadow/border treatment applies, anatomy, sizing, states, and accessibility of the card container itself. It does not govern:

- **Card type taxonomy** (container, data display, status/priority) — defined by the card composition recipe.
- **Card header anatomy** (title, subtitle, actions layout, arrow button placement) — the card composition recipe owns header assembly rules.
- **Card header icon actions** (which actions appear, overflow behavior, toolbar ARIA) — the contextual-actions composition recipe owns card header action rules.
- **What goes in card body slots** — the composition recipe owns slot assembly rules.
- **AI card treatment** (gradient, sparkle, insight rows) — the composition recipe defines AI-specific visual treatment.
- **Card grid layout** (how cards arrange on a page, responsive column counts) — layout concern outside this sheet.
- **Action-set rules within card footers** — the action-set composition recipe owns button group rules. This sheet only documents that `aiux-card-actions` is the DaisyUI container class.

The referencing direction is one-way: composition specs reference this sheet for individual card shell rules; this sheet does not reference composition specs.
