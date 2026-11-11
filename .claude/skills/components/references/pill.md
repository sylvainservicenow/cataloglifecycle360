# Pill

**DaisyUI base:** None — `aiux-pill` is a custom utility-class family (no DaisyUI component)
**Production component:** None — composed from the `aiux-pill` class family (defined in `components/core/src/styles/tailwind.css`)
**Last updated:** 2026-06-24 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use a pill for an interactive element the user can select, dismiss, or filter with — it always has at least one interactive affordance. Build pills with the `aiux-pill` class, never `badge` classes (`aiux-pill` owns the correct shape, padding, and interactive states). Choosing a pill over another labeled element is ultimately a composition-context call — see §12.

### 2. Pill types

| Type          | Purpose                                          | Key affordance                                 |
| ------------- | ------------------------------------------------ | ---------------------------------------------- |
| **Selection** | Toggleable option in filter UIs or option groups | Click toggles selected state (`aria-pressed`)  |
| **Input**     | Selected value inside a multi-select input field | Dismiss button (x) to remove                   |
| **Tagging**   | User or entity tag for @mentions and assignments | Avatar (XS) alongside the name; dismiss button |

### 3. Sizing

Three sizes are part of the design scale — **`aiux-pill-sm`, `aiux-pill-md` (default), `aiux-pill-lg`** — each setting its own font size and padding. Pick the size to match the surrounding component; do not mix sizes within the same input or filter group. Exact padding and font dimensions are owned by the `aiux-pill` classes.

The class family also exposes `aiux-pill-xs` and `aiux-pill-xl`, but these are outside the current Figma scale — do not use them.

Labels truncate at a maximum width with `text-ellipsis whitespace-nowrap overflow-hidden`; when truncated, show a tooltip with the full content (see `@patterns/references/truncation-tooltip.md`).

### 4. Base styling

Use the `aiux-pill` class family — do not hand-roll the shape, border, or fill:

| Intent                   | Class                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| **Default (unselected)** | `aiux-pill` — exact colors owned by the class; never add CSS             |
| **Selected**             | add `aiux-pill-primary` — exact colors owned by the class; never add CSS |
| **Disabled**             | `aiux-pill-disabled` (or native `disabled`)                              |

Exact colors, borders, and state fills are owned by the class. Never add `<style>` rules or inline `style=` attributes to implement these states — the `aiux-pill` classes own all fills, borders, and state colors completely.

The class also exposes `aiux-pill-active` (a neutral grey selected fill), but that treatment is outside the current Figma scale — do not use it. The selected state is `aiux-pill-primary`.

Note the naming trap: `aiux-pill-active` is a **persistent selected/toggled** class, **not** the press state. The press (`active`) state is the CSS `:active` pseudo-class, applied automatically — no class needed.

### 5. Anatomy — identifier slot

Pills can include an optional start icon at the inline-start of the label. The icon scales with the pill size. Use a start icon only when it adds meaningful context that aids recognition — do not use icons purely for decoration.

For tagging pills where the label is a person's name, use an XS avatar (see `references/avatar.md`) in the start-icon position instead.

### 6. Dismiss button

When a pill is dismissible, a dismiss button (close icon) is nested inside the pill at the inline-end, as its last child — not placed beside the pill. The dismiss button is a distinct interactive target from the label, with its own hover and focus states. Use a ghost icon-only button (`aiux-btn-ghost aiux-btn-circle aiux-btn-xs`) for the dismiss affordance, with a `close` icon as the glyph (see `references/icon`). Because the pill then contains an interactive child, the pill body is a non-button container (`<span class="aiux-pill">`), not a `<button>` (buttons cannot nest).

There is no dedicated dismissible-pill component — compose it from these documented primitives (`aiux-pill` container + `aiux-btn` dismiss + `close` icon); do not invent classes.

**Focus management on dismiss:** When a pill is removed, move focus to the next pill, the previous pill, or the input field — never let focus be lost.

### 7. Content rules

- Pill labels should be concise — ideally one to three words.
- For tagging pills, use the person's display name as the label.
- Sentence case: "In progress" not "In Progress" or "IN PROGRESS".
- Labels truncate automatically when they exceed the maximum width. When truncated, display a tooltip with the full content on hover. Reference `@patterns/references/truncation-tooltip.md` for the tooltip pattern.
- **Internationalization:** All user-facing strings (labels, tooltip text) follow `@internationalization`.

### 8. States

Pills get their interactive states — hover, press (`:active`), focus, selected, and disabled — from the `aiux-pill` class family. Never add `<style>` blocks or inline `style=` attributes to implement any pill color, border, fill, or opacity — the classes own these entirely. Which class maps to the selected and disabled states is in §4; hover, press, and focus are applied automatically.

### 9. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Filter Pills (use `<button>` with `aria-pressed`, never `<input type="checkbox">`)
- **Forced colors:** Follows the **interactive** pattern. Use the transparent-border technique so the outline appears in high-contrast mode — see `@accessibility`

**Horizon-specific design notes:**

- The pill body is a `<button>` (or `role="button"` with `tabindex="0"` on a non-button host). Provide an `aria-label` when the pill contains an avatar or icon adding visual context not present in the visible text.
- **Selection pills** communicate state via `aria-pressed`. Visual styling alone is insufficient.

### 10. RTL

Pill layout mirrors automatically in RTL:

- Identifier (icon or avatar) stays at inline-start, dismiss button stays at inline-end — both flip with direction.
- In pill lists, tab order reverses to follow the reading direction.
- Text alignment inherits from document direction.

<!-- 11. Pill list — grouping multiple pills (tag clouds, filter sets) is absent from both the aiux-pill class and the Figma pill component; it is a composition concern, deferred to §12. -->

### 12. Scope boundary

This sheet covers single-pill decisions: which type, which size, which styling class, dismiss behavior, content conventions, and accessibility requirements. It does not govern:

- **Runtime styling mechanism** — exact shape, padding, sizing dimensions, and per-state fills are owned by the `aiux-pill` class family in `tailwind.css`.
- **How pills group or compose** — pill lists, tag clouds, filter sets, filter bars, tag inputs, and multi-select fields are defined by composition specs.
- **Whether a pill is the right choice over another labeled element** — §1 gives guidance, but the composition context makes the final call.
- **Color palette definitions for pill variants** — see `@patterns/references/color-systems.md` if status-colored pills are needed.

The referencing direction is one-way: composition specs reference this sheet for individual pill rules; this sheet does not reference composition specs.
