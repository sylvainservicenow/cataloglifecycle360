# Badge

**DaisyUI base:** `badge` (`aiux-badge` prefix)
**Production component:** None — composed from the `aiux-badge` class family (defined in `components/core/src/styles/tailwind.css`)
**Last updated:** 2026-07-02 · v4

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant selection

Badge supports ten color variants, confirmed against production: `aiux-badge-neutral`, `aiux-badge-primary`, `aiux-badge-secondary`, `aiux-badge-accent`, `aiux-badge-info`, `aiux-badge-success`, `aiux-badge-warning`, `aiux-badge-error`, plus two Horizon-specific priority colors, `aiux-badge-moderate` and `aiux-badge-high`. See `@patterns/references/color-systems.md` for when to use each color.

**Figma defines additional colors this class family does not support** (e.g. fuchsia, amber, lime, pink, violet, indigo, teal) — do not use them; only the ten above have real classes.

Style modifiers: default (filled, no modifier class needed), `aiux-badge-soft` (tinted background, darker text), `aiux-badge-outline` (border only, no fill), and `aiux-badge-ghost` (solid neutral background — not literally transparent). Do not use `aiux-badge-dash`: it has no confirmed production usage and is not part of Figma's badge component.

**Figma also defines a Primary/Secondary/Tertiary emphasis hierarchy per color, which this class family cannot reproduce for most colors** — do not attempt to build a 3-tier emphasis scale on a badge.

### 2. Sizing

| Context                           | Size class      | Rationale                                              |
| --------------------------------- | --------------- | ------------------------------------------------------ |
| Default                           | `aiux-badge-md` | Standard inline label.                                 |
| Compact density or tight layouts  | `aiux-badge-sm` | Reduced height for dense views (lists, table cells).   |
| Minimal indicator (count on icon) | `aiux-badge-xs` | Smallest readable size. Count badges on icon overlays. |
| Emphasized standalone label       | `aiux-badge-lg` | Rare. Only when the badge is the primary content.      |
| Hero / large-format display       | `aiux-badge-xl` | Rare. Large promotional or standalone displays.        |

The default size is `aiux-badge-md`.

### 3. Sub-types

**Count badge** — displays a numeric value.

**Icon badge** — icon placed before or after the text label. Use status icons that reinforce the badge's semantic color (e.g., `circle-close-outline` with `aiux-badge-error`). Icon-only badges are prohibited; use a dot indicator or add a text label.

### 4. Positioning

Badge placement depends on context:

| Context                | Position                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List row or table cell | Inline, next to the label it describes.                                                                                                                                                                                                              |
| Card                   | In a single badge cluster at the top of the card, above the title — never scattered below the title, in the body, or in the footer. Alignment within that top row is flexible (leading, trailing, or split to the far end) — there is no fixed side. |

Badge-on-icon (upper-right quadrant overlay) and badge-on-avatar (lower-right, presence-style) were legacy patterns — no longer current. Do not generate them; if a surface needs an overlay indicator on an icon or avatar today, confirm the current pattern against Figma first.

### 5. Content rules

- Single word or short phrase (2–3 words maximum). Badges are not sentences.
- Sentence case: "In progress" not "In Progress" or "IN PROGRESS".
- Never truncate badge text. If the label doesn't fit, shorten the copy.

### 6. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Badge
- **Forced colors:** Follows the **container** pattern — see `@accessibility` › Badge. Use the transparent-border technique so the outline appears in high-contrast mode.

**Horizon-specific design notes:**

- Badges are non-interactive — they do not receive focus and are not clickable.
- When a badge conveys status not also communicated by surrounding text, ensure the parent element or a nearby label provides equivalent meaning for screen readers.
- Color alone must not be the only differentiator — pair with an icon or distinct label text (WCAG 1.4.1).

### 7. RTL

Badge position does not flip in RTL. The badge stays in the same quadrant position regardless of text direction. This is intentional — upper-right remains upper-right.

### 8. Scope boundary

This sheet covers single-badge decisions: which variant, which size, which content conventions, and where to position relative to a parent element. It does not govern:

- **How badges group or combine with other components in layouts** — defined by composition specs.
- **Color palette definitions and decision logic** — see `@patterns/references/color-systems.md`.

The referencing direction is one-way: composition specs reference this sheet for individual badge rules; this sheet does not reference composition specs.
