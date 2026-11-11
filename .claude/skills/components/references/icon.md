# Icon

**DaisyUI base:** None — no DaisyUI icon component
**Production mechanism:** `icon()` directive (`@servicenow/aiux-directive-icon`) — not the deprecated `<aiux-icon>` component, not hand-rolled inline `<svg>`
**Last updated:** 2026-07-04 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: <= 2,000 tokens. -->

### 1. When to use

Use an icon to aid recognition, reinforce labels, or represent common actions and features with a graphic symbol. Icons work best when their meaning is universally understood in the product context.

**Do not use icons:**

- As pure decoration without a visible label if the icon meaning is not universally understood.
- To convey status or urgency alone -- always pair with text or a color-coded component that communicates the same information non-visually.
- As custom graphics that conflict with established design-system icon meanings.

When in doubt, pair the icon with text.

### 2. Icon categories

Icons render via the `icon()` directive in a child position — e.g. `` html`${icon({name: 'star-fill', size: 'md'})}` `` — never as hand-written `<svg>` markup or the deprecated `<aiux-icon>` element. Its `alt` option controls the accessible-name treatment automatically; do not hand-write `aria-hidden` or `aria-label` on the icon itself.

| Category        | Definition                                                            | Treatment                                                                                                      |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Decorative**  | Accompanies a visible text label; adds visual reinforcement only      | Omit `alt` — the directive defaults to `aria-hidden="true"`                                                    |
| **Informative** | Stands alone without a visible text label; conveys meaning on its own | Accessible name on the **parent** interactive element (`aria-label` on the button/link), not `alt` on `icon()` |

Use the following decision table:

| Scenario                                                           | Treatment                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Icon next to a visible text label                                  | Decorative -- omit `alt`                                                        |
| Icon-only button or link                                           | Informative -- `aria-label` on the button/link, omit `alt` on the icon          |
| Icon that changes meaning contextually (e.g., outline/fill toggle) | Informative -- the accessible name on the parent must reflect the current state |
| Icon inside a badge, indicator, or status element                  | Usually informative -- the parent element needs a label conveying the status    |

`icon()`'s `alt` option exists for a standalone icon with no labelable parent at all (it sets `role="img"` + `aria-label` on the icon), but production consistently uses the parent-label pattern above instead — prefer it.

### 3. Sizing

Five size tiers, chosen via the `size` option — not Tailwind `w-*`/`h-*` classes. The directive sets the SVG's pixel dimensions directly:

| Size | Dimensions | `icon()` size value | Typical context                                                                    |
| ---- | ---------- | ------------------- | ---------------------------------------------------------------------------------- |
| XS   | 12 x 12    | `'xs'`              | Micro indicators, inline status dots, very compact UI                              |
| SM   | 16 x 16    | `'sm'`              | Dense list rows, inline mentions, compact controls (`aiux-btn-xs`, `aiux-btn-sm`)  |
| MD   | 20 x 20    | `'md'` (default)    | Default body content, standard buttons (`aiux-btn-md`), form field adornments      |
| LG   | 24 x 24    | `'lg'`              | Section headings, alert icons, larger buttons (`aiux-btn-lg`), prominent landmarks |
| XL   | 32 x 32    | `'xl'`              | Hero areas, empty-state illustrations, page-level callouts                         |

`'1x'`/`'2x'`/`'3x'` are also accepted as aliases for `sm`/`lg`/`xl` respectively — prefer the named tier (`xs`–`xl`) for clarity. Do not scale icons with CSS transforms or wrap them in sized containers to force a dimension -- use the `size` option.

Icons used within buttons, tabs, and pills must match the size convention of the surrounding component. See individual component specs for size guidance.

### 4. Outline vs. fill states

The variant is part of the icon `name` itself, not a separate prop: append `-fill` or `-outline` to the base name (e.g. `star-fill`, `star-outline`). Omitting the suffix defaults to `fill`.

- **Outline** (`-outline`) -- default / inactive state
- **Fill** (`-fill`) -- active, selected, or toggled-on state (e.g., `star-outline` = not favorited, `star-fill` = favorited)

This convention applies to icons in toggle-style contexts. Follow it consistently -- do not use the fill variant for default/inactive states.

### 5. Color

Icons inherit color via `currentColor`. **Set the color class on a wrapping element, never on `icon()`'s own `class` option:**

- Correct: `` html`<div class="text-error">${icon({name: 'circle-close-fill', size: 'md'})}</div>` `` — the icon inherits `color` from its parent.
- Broken (do not use): `icon({name: 'upload-outline', size: 'xl', class: 'text-primary'})` — `icon()` always sets `style="color:currentColor"` inline on the SVG itself, and an inline style beats any class in the CSS cascade. A color utility passed via `class` is silently overridden and has no visible effect. Non-color classes (e.g. `shrink-0`, `opacity-70`) in `class` are unaffected and safe to use.

| Intent              | Class                                                     | When to use                                      |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Default             | `text-text-primary`                                       | Standard icons in body content                   |
| Subdued             | `text-text-secondary`                                     | Supporting icons, metadata labels                |
| Placeholder / hint  | `text-text-tertiary`                                      | Disabled-adjacent icons, low-emphasis adornments |
| Interactive (brand) | `text-primary`                                            | Icons inside primary buttons or active tabs      |
| Status              | `text-error`, `text-warning`, `text-success`, `text-info` | Status indicator icons paired with status text   |

Do not hardcode hex, `rgb()`, or named color values. Use `currentColor` inheritance via one of the two patterns above.

**AI Sparkle icon:** A specific 4-point star SVG with a gradient used for AI-generated content attribution (`icon({name: 'sn-sparkmoji-logo-fill', ...})`). See `styling/SKILL.md` for the exact definition. Do not substitute a generic star or sparkle icon.

### 6. Content rules

- Always use `icon()` from `@servicenow/aiux-directive-icon` -- never the deprecated `<aiux-icon>` component or a hand-written inline `<svg>`.
- Prefer icons from the design-system icon library before reaching for custom icons.
- When pairing an icon with a label, the icon should reinforce the label meaning -- not contradict or duplicate it with a different concept.
- In icon-only buttons, always provide a tooltip with the action label (see `references/tooltip.md`).
- Custom icons must maintain visual consistency with the icon library (style, stroke weight, optical size) and remain legible at all supported sizes.
- **Internationalization:** All user-facing strings — `aria-label` values on icon-only buttons, tooltip text, and state-change labels — must be wrapped with `i18n.getMessage()`. See `@internationalization` for the full API and parameterized message syntax.

### 7. RTL and directional behavior

Icons are categorized by whether they carry directional meaning:

| Category            | Examples                                | RTL behavior                                                                                                                                                                |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Directional**     | Arrows, chevrons, back/forward, reply   | Flip if the direction is semantic ("next / back"); don't flip if it's literal ("the arrow on the left"). See `@patterns/references/rtl-icon-flip.md` for the full decision. |
| **Non-directional** | Settings gear, search, checkmark, close | Do not flip in RTL                                                                                                                                                          |

Apply this distinction correctly. Flipping a non-directional icon in RTL creates a meaningless mirror image. The AI Sparkle icon is non-directional and does not flip.

Reference `@patterns/references/rtl-icon-flip.md` for the full intent-triage decision (semantic / literal / non-directional) and the flip mechanism.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **Forced colors:** Icons inside interactive elements follow the **interactive** pattern; purely decorative icons inside containers follow the **container** pattern. The `icon()` directive already sets `color: currentColor` on the SVG automatically, so this inherits without extra wiring — see `@accessibility` › Icon

**Horizon-specific design notes:**

- **Decorative icons:** `aria-hidden="true"`. The adjacent visible text label is the accessible name.
- **Informative (icon-only) buttons / links:** The icon stays `aria-hidden="true"` — the **parent** interactive element carries the `aria-label`, not the icon.

- **No interactive icons:** There should be no interactive icons — use buttons when interactive.

- Meaning must never be conveyed by icon color alone (WCAG 1.4.1) — icons with explicit fill/stroke colors lose color distinction in forced-colors mode.

### 9. Scope boundary

This sheet covers individual icon decisions: when to use an icon, sizing, color, outline/fill convention, decorative vs. informative treatment, directional behavior in RTL, and accessibility requirements.

It does **not** cover:

- **How icons compose within buttons, tabs, pills, or alerts** -- those component specs define icon placement, spacing, and size within their anatomy.
- **Icon library catalog** -- the full list of available icon names is generated at `directives/icon/types/__generated__/icon-names.d.ts`; this spec does not enumerate it.
- **AI Sparkle icon definition** -- see `styling/SKILL.md` for the SVG and gradient spec.

The referencing direction is one-way: composition specs and component specs reference this sheet for individual icon rules; this sheet does not reference composition specs.
