# Truncation + Tooltip

Single-line and multi-line text overflow handling with tooltip reveal. Covers ellipsis truncation, tooltip trigger rules, "never truncate" exceptions, and truncation detection. For multi-line prose with an expand/collapse toggle, see `@patterns/references/overflow.md` § 6 instead. For icon-only tooltip requirements (labeling, not overflow), see `@components/references/tooltip.md`.

---

## 1. Truncation modes

| Mode                     | CSS                                                                                   | Use when                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Single-line ellipsis** | `truncate` (Tailwind shorthand for `overflow-hidden text-ellipsis whitespace-nowrap`) | Labels, titles, breadcrumb items, pill text, table cells in default mode                                 |
| **Multi-line clamp**     | `line-clamp-2` / `-3` / `-4`                                                          | Descriptions, card body text, contextual-actions labels — where 2–3 visible lines provide useful context |
| **No truncation**        | _(none)_                                                                              | Elements in the "never truncate" list (§ 3)                                                              |

**Single-line** is the default. Use multi-line clamp only when the consuming spec explicitly calls for it (e.g., `line-clamp-2` on contextual-action labels). Do not mix modes on the same element.

---

## 2. Tooltip trigger rules

A tooltip showing the full text is **required** whenever content is visually truncated.

| Trigger context      | Tooltip required?        | Notes                                          |
| -------------------- | ------------------------ | ---------------------------------------------- |
| Single-line ellipsis | Yes — on hover and focus | Show only when text is actually clipped (§ 4)  |
| Multi-line clamp     | Yes — on hover and focus | Show only when text exceeds the clamp boundary |
| Fully visible text   | No                       | Tooltip would duplicate visible content        |

**Tooltip content:** The complete, untruncated text. Do not add extra information — the tooltip mirrors what truncation hid.

**Tooltip container:** See `@components/references/tooltip.md` for placement, delay, ARIA, and implementation guidance.

---

## 3. Never-truncate elements

These elements must never be truncated. If the text does not fit, **shorten the copy**.

| Element           | Spec reference                          | Instead of truncating |
| ----------------- | --------------------------------------- | --------------------- |
| Button labels     | `@components/references/button.md`      | Shorten the copy      |
| Checkbox labels   | `@components/references/checkbox.md`    | Shorten the copy      |
| Toggle labels     | `@components/references/toggle.md`      | Shorten the copy      |
| Action-set labels | `@compositions/action-set-spec.md`      | Shorten the copy      |
| Pagination labels | `@components/references/pagination.md`  | Shorten the copy      |
| Menu item labels  | `@patterns/references/overflow.md` § 3  | Shorten the copy      |

If a design requires truncation on one of these, escalate — the label is too long, not the container too small.

---

## 4. Truncation detection

The tooltip must only appear when content is actually clipped — not on every element that _could_ truncate. If the text fits within its container at the current width, no tooltip is shown.

> **Implementation note:** For single-line, compare `scrollWidth > clientWidth`. For multi-line clamp, compare `scrollHeight > clientHeight`. Check on `mouseenter` / `focusin` rather than on every render. Recalculate when the container resizes.

---

## 5. Accessibility

**Truncated text must be keyboard-accessible.** When the platform accessibility preference "Enable keyboard focus on text that displays a tooltip" is active, truncated text becomes focusable (`tabindex="0"`) and the tooltip triggers on focus. When the preference is off, truncated text is not focusable — the tooltip activates only on hover.

**ARIA wiring:**

- Tooltip element: `role="tooltip"` with a unique `id`.
- Trigger element: `aria-describedby` pointing to the tooltip's `id`.

**Forced colors:** Truncated text relies on ellipsis (`…`) which renders in `CanvasText` — no special forced-colors handling needed. The tooltip container follows `@accessibility/references/forced-colors-reference.md` (container state table) — `@accessibility` is a skill in the separate `@servicenow/agent-pack-aiux` pack.

---

## 6. Width constraint

A truncation class (`truncate` or `line-clamp-2`/`-3`/`-4`) has no visible effect without a width constraint. Every truncated element must have an explicit max-width, a fixed width, or inherit a constraint from its container (grid column, flex layout, parent with overflow). The specific width value is owned by the consuming component or composition spec — not this pattern.

---

## 7. RTL

Ellipsis position mirrors automatically in RTL — the `…` appears at the inline-end (left) side. Tooltip placement follows `@components/references/tooltip.md` RTL rules. No additional RTL handling is needed for truncation itself.

---

## 8. Scope boundary

This pattern covers: truncation CSS modes, tooltip trigger rules for clipped text, "never truncate" exceptions, detection behavior, accessibility requirements, and width constraint rules.

It does **not** cover:

- **Tooltip container rules** (anatomy, placement, delay, ARIA roles, forced colors) — `@components/references/tooltip.md`.
- **Multi-line prose expand/collapse** (show more / show less toggle) — `@patterns/references/overflow.md` § 6.
- **Icon-only tooltip requirements** (labeling, not overflow) — `@components/references/tooltip.md`.
- **Which compositions truncate and where** — each composition spec owns its own truncation policy.
- **Overflow strategy selection** (when to truncate vs. scroll vs. menu vs. show more) — `@patterns/references/overflow.md` § 1.

---

## Validation checks

Stable check IDs for structured reporting.

| #     | Check                          | Spec section                | Description                                                                                                         |
| ----- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TT-01 | Tooltip on truncated text      | § 2 Tooltip trigger rules   | Every visually truncated element has a tooltip showing the full text.                                               |
| TT-02 | Never-truncate respected       | § 3 Never-truncate elements | Button, checkbox, toggle, action-set, pagination, and menu item labels are not truncated.                           |
| TT-03 | Conditional tooltip display    | § 4 Truncation detection    | Tooltip activates only when text is actually clipped, not unconditionally.                                          |
| TT-04 | ARIA wiring                    | § 5 Accessibility           | Tooltip has `role="tooltip"` + `id`; trigger has `aria-describedby` pointing to it.                                 |
| TT-05 | Width constraint present       | § 6 Width constraint        | Elements with `truncate` or `line-clamp-*` have an explicit or inherited width constraint.                          |
| TT-06 | Keyboard-accessible truncation | § 5 Accessibility           | When the truncated-text-focus preference is active, truncated elements are focusable and tooltip triggers on focus. |
