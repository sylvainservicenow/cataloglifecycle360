# Radio

**DaisyUI base:** `radio` (prefixed `aiux-radio`)
**Production component:** None — native `<input type="radio">` + `aiux-radio` classes
**Last updated:** 2026-07-02 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant selection

Radio has no shape variants — only color. The Figma library uses two:

| Variant     | Class               | Use when                                                   |
| ----------- | ------------------- | ---------------------------------------------------------- |
| **Primary** | `aiux-radio`        | Default — a bare `aiux-radio` checks in the primary color. |
| **Accent**  | `aiux-radio-accent` | AI / completed contexts that use the accent color.         |

Primary is expressible as a bare `aiux-radio` (the default checks in primary) or an explicit `aiux-radio-primary` — both render the primary default. The class family also exposes `aiux-radio-{neutral,secondary,success,warning,info,error}`, but those are outside the current Figma scale — do not use them. Exact fill colors are owned by the classes/theme.

### 2. Anatomy

A radio group has four parts: the **radio input** (`<input type="radio">` with `id`, `name`, optional `value`), a **per-option label**, a **group container**, and a visible **group label**. Radios belong to one group by sharing the same `name` attribute — not by sitting in the same container.

Labeling and group-semantics requirements (label wrapping vs. explicit `<label for>` pairing, `<fieldset>`/`<legend>` vs `role="radiogroup"` + `aria-labelledby`) are covered in §7.

**Group label — must match `<aiux-control-radio-group>`'s rendered output exactly**, not an independent style choice (same rule as textarea.md §3). The source of truth is `components/controls/src/base/utils/render-form-field-label.ts`; if that file's output differs from the snapshot below, the file wins: the group label text sits in its own inner `<span>` with `font-normal text-text-primary` (`text-error` when invalid) — never `font-semibold` directly on the `<legend>`/label element. This applies whichever group-semantics pattern from §7 is used.

`<aiux-control-radio-group>` itself is referenced only for that label output — it is not the Figma-aligned pattern and has no production adoption as a tag; build radio groups from native `<input type="radio">` + the class family, not the component.

### 3. Sizing

| Size             | Class           |
| ---------------- | --------------- |
| Extra small      | `aiux-radio-xs` |
| Small            | `aiux-radio-sm` |
| Medium (default) | `aiux-radio-md` |

`aiux-radio-lg` and `aiux-radio-xl` exist in the class family but are outside the current Figma scale — do not use them. Target-size requirements for the smaller controls are covered in §7.

### 4. Behavior rules

- **Mutual exclusion is enforced by the browser.** Setting `checked` on one radio automatically unchecks others sharing its `name` — no JavaScript required.
- **No empty state via user interaction.** Native `<input type="radio">` allows users to change the selection but not clear it back to unchecked. If "no selection" is a valid outcome, include an explicit option in the group that represents it.

### 5. Content rules

- Group label describes the choice being made, not the individual options — "Notification frequency", not "How often".
- Option labels use parallel phrasing across the group — all nouns, or all short phrases sharing the same grammatical structure.
- Each option label clearly describes what that option represents on its own; the reader should not need sibling options for context.
- Sentence case: "Daily summary" not "Daily Summary".

### 6. States

A radio has only its native states: unchecked, checked (native `checked` attribute), and disabled (native `disabled` attribute). Do not introduce separate read-only or invalid state concepts beyond these. Focus-visible behavior is covered in §7.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Radio Group — see `@accessibility`
- **DaisyUI corrections:** Wrap each option's input in a `<label>` (implicit association) — matches production usage and is fully accessible per `@accessibility`'s Radio Group APG pattern. Explicit `<label for="id">` is also valid when the label and input cannot sit adjacent in the DOM. Group via `<fieldset>`/`<legend>` or `role="radiogroup"`; native `disabled` on the input.
- **Forced colors:** Unchecked follows the **field** pattern; checked uses `SelectedItem` / `SelectedItemText` — see `@accessibility`

**Horizon-specific design notes:**

- **Target size:** `radio-xs` requires 4 px padding on all sides; `radio-sm` requires 2 px — both must reach the 24×24 px WCAG 2.5.8 minimum.
- **Description text** must be associated via `aria-describedby` — visual proximity alone is not sufficient. Group-level description goes on the container; per-option description goes on the individual input.

### 8. RTL

Radio indicator and option label swap sides in RTL layouts — the indicator appears on the right of the label. The circular indicator does not flip; circles are directionally neutral.

### 9. Scope boundary

This sheet covers single-radio-group decisions: which color modifier, which size, labeling, and group semantics. It does not govern:

- **How radio groups lay out inside forms** (column placement, spacing with other controls, horizontal vs. vertical orientation) — form composition spec.
- **Row-level single-select in tables or lists** — table/list composition specs own that interaction even when radios are the visual affordance.

The referencing direction is one-way: composition specs reference this sheet for individual radio rules; this sheet does not reference composition specs.
