# Toggle

**DaisyUI base:** `toggle` (prefixed `aiux-toggle`)
**Production component:** None — native `<input type="checkbox">` + `aiux-toggle` classes
**Last updated:** 2026-06-29 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant (color)

**Use the default, uncolored `aiux-toggle`.** The Figma library defines no color variants — the on state reads from the thumb position, not from a track color. This is also the rule in `daisyui.md` → `toggle_default_variant_only`.

The class family exposes 8 color modifiers (`aiux-toggle-{primary,secondary,accent,neutral,success,warning,info,error}`), but:

- **Never use color as a brand accent** (`primary` / `secondary` / `accent` / `neutral`). Production overuses `aiux-toggle-primary` for emphasis — that is the anti-pattern this rule exists to prevent; do not copy it.
- **Reserve a semantic color** (`success` / `warning` / `error` / `info`) for the rare case where the on-state itself communicates that condition — and even then, color must not be the only signal.

### 2. Sizing

The Figma scale has three:

| Size class       | Use when                                     |
| ---------------- | -------------------------------------------- |
| `aiux-toggle-sm` | Compact density (tables, lists).             |
| `aiux-toggle-md` | Default. Standard forms and settings panels. |
| `aiux-toggle-lg` | Emphasized or touch-friendly contexts.       |

The default size is `aiux-toggle-md`. `aiux-toggle-{xs,xl}` exist in the class family but are outside the current Figma scale — do not use them. For `aiux-toggle-sm`, ensure the clickable area still meets the WCAG 2.5.8 24×24px minimum target size (add vertical padding / `min-h-[24px]` when the visible track is shorter).

**Label font scales with the toggle size** — at regular weight, using token-backed Tailwind utilities (never hardcoded px). No `aiux-toggle`-coupled CSS sets this, so apply it on the label yourself:

| Toggle size      | Label font                       |
| ---------------- | -------------------------------- |
| `aiux-toggle-md` | `text-sm` (14px) · `font-normal` |
| `aiux-toggle-sm` | `text-xs` (12px) · `font-normal` |

(In Figma `aiux-toggle-xs` pairs with a 10px regular label, but xs is outside the Figma scale — do not use it.)

### 3. Types

Toggle has exactly one type: **dual-state** (on / off). Indeterminate is not supported. APG Switch defines only `aria-checked="true"` and `aria-checked="false"` — do not call `el.indeterminate = true` on a toggle. The indeterminate property is a checkbox-only behavior; toggles must always represent a definite on or off state.

### 4. Pairing rules

**Dependent toggles.** When two toggles in the same panel control mutually exclusive settings (one being on requires the other to be off), the dependent toggle is set to `disabled` while the controlling toggle is on. Do not render two toggles whose checked states contradict each other.

### 5. Content rules

- The label describes **what is true when the toggle is on**. Never use a negative verb in the on-state label.
  - ✓ "Email notifications" (on = notifications are active)
  - ✗ "Disable email notifications" (negative framing)
  - ✗ "No notifications" (describes the off state)
- Sentence case: "Weekly digest" not "Weekly Digest".
- Parallel phrasing across toggles in the same panel — all noun phrases or all of the same grammatical structure.
- A visible text label beside the toggle is the default; its font scales with the toggle size at regular weight (see §2). Figma also offers a label-off variant for compact contexts (table rows, toolbars) where adjacent content already names the control — in that case an accessible name (`aria-label`) is still required (see §7).
- Never truncate a toggle label. If the label does not fit, shorten the copy.

### 6. States

Off (unchecked), on (checked), hover, focus-visible, disabled. All five must be accounted for. Do not introduce separate read-only or invalid state concepts beyond these.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Switch — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Toggle (explicit `<label for="id">`, never implicit; add `role="switch"` to the input; native `disabled` on the input)
- **Forced colors:** Off follows the **field** pattern; on uses `SelectedItem` / `SelectedItemText` — see `@accessibility`

**Horizon-specific design notes:**

- **Target size:** `toggle-xs` needs 4 px padding top/bottom; `toggle-sm` needs 2 px — both must reach the 24×24 px WCAG 2.5.8 minimum.
- **Switch role:** Override the native checkbox role with `role="switch"`. Do not set `aria-checked` explicitly — browsers reflect the native `checked` state automatically, even with the role overridden. Manual `aria-checked` management is only needed for fully custom controls (e.g., `<div role="switch">`).

- **Description text** must be associated via `aria-describedby` — visual proximity alone is not sufficient.

### 8. Element selection

Always use a native `<input type="checkbox">`. Do not build custom toggles with `<div role="switch">` or `<span role="switch">` — the native input gives form participation, the `disabled` attribute, and `Space`-key toggling for free. The `role="switch"` override, `aria-checked` behavior, and the Enter-key handler are accessibility mechanics — see §7.

### 9. Scope boundary

This sheet covers individual toggle decisions: which size, which color modifier, labeling and content conventions, state behavior, and accessibility requirements. It does not govern:

- **When to use toggle vs. checkbox vs. radio** — selection-control choice within a form is governed by the form composition spec.
- **How toggles compose inside settings panels and forms** — form composition spec.
- **Confirmation patterns for destructive immediate actions** — workflow patterns are governed by the dialog and form composition specs.
- **Toggle as a table row control** — table / data-table composition spec.

The referencing direction is one-way: composition specs reference this sheet for individual toggle rules; this sheet does not reference composition specs.
