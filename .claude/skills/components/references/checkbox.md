# Checkbox

**DaisyUI base:** `checkbox`
**Production component:** None — native `<input type="checkbox">` + `aiux-checkbox` classes
**Last updated:** 2026-07-03 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant selection

Figma has only one color. Use `aiux-checkbox` — the checked state defaults to primary automatically (DaisyUI's base rule sets this; adding `aiux-checkbox-primary` explicitly is redundant but matches Figma's own Code Connect markup, so either form is fine). Label association follows §7 (wrap the input in a `<label>` — matches production usage).

The class family also exposes `aiux-checkbox-{secondary,accent,neutral,success,warning,info,error}`, but none are in the current Figma scale — do not use them.

### 2. Sizing

| Size class         | Use when                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| `aiux-checkbox-xs` | Extra-compact density. Requires target-size padding.                          |
| `aiux-checkbox-sm` | Compact density (tables, lists). Requires padding. Most common in production. |
| `aiux-checkbox-md` | Default. Standard forms and settings panels.                                  |

The default size is `aiux-checkbox-md`. `aiux-checkbox-xs` requires 4px padding on all sides and `aiux-checkbox-sm` requires 2px on all sides to meet the WCAG 2.5.8 24×24px minimum target size — apply `min-h-[24px] min-w-[24px]` to the clickable area when the visible box is smaller. The class family also exposes `aiux-checkbox-lg` and `aiux-checkbox-xl`, but neither is in the current Figma scale — do not use them.

### 3. Types

Checkbox supports two types per APG Checkbox:

**Dual-state:** Toggles between unchecked and checked. This is the default.

**Tri-state (indeterminate):** Used when a parent checkbox controls a group and some (but not all) children are checked. The parent shows a dash icon instead of a checkmark. The indeterminate state is both visual and behavioral and cannot be set declaratively — set `el.indeterminate = true` in JavaScript, and always accompany with `aria-checked="mixed"`.

### 4. Group behavior

When multiple checkboxes form a set, wrap them in `<fieldset>` with a `<legend>` that names the group — or use `role="group"` with `aria-labelledby` on a container element. The `<legend>` or labelled element provides the group label to assistive technology. Parent-child selection cascading (parent selects all children, indeterminate when some children are checked) is a composition-level concern — see §10.

### 5. Content rules

- Labels describe the item being selected, not the action: "Email notifications" not "Enable email notifications."
- Sentence case: "Weekly digest" not "Weekly Digest."
- Parallel phrasing across checkboxes in the same group — all noun phrases or all of the same grammatical structure.
- Every checkbox must have a visible `<label>`. No unlabeled or icon-only checkboxes.
- Never truncate a checkbox label. If the label does not fit, shorten the copy.

### 6. States

Unchecked, checked, indeterminate, hover, focus-visible, disabled. All six must be accounted for. Do not introduce separate read-only or invalid state concepts beyond these.

Figma also defines two AI-specific states — "AI completed" and "AI completed indeterminate" — signaling a value was set by AI rather than the user. Production has no matching class or treatment for either; do not invent one.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Checkbox — see `@accessibility`
- **DaisyUI corrections:** Wrap the input in a `<label>` (implicit association) — matches production usage (e.g. `ha-user-consent-modal.js`) and is fully accessible per `@accessibility`'s Checkbox APG pattern ("the native HTML `<label>` element can also be used"). Explicit `<label for="id">` is also valid when the label and input cannot sit adjacent in the DOM. Native `disabled`, not `aria-disabled`.
- **Forced colors:** Unchecked follows the **field** pattern; checked uses `SelectedItem` / `SelectedItemText` — see `@accessibility`

**Horizon-specific design notes:**

- **Tri-state:** When indeterminate, set `el.indeterminate = true` **and** `aria-checked="mixed"`. Native dual-state is automatic; tri-state requires explicit `aria-checked` management. Mixed state is entered programmatically, not via keyboard cycling.

### 8. RTL

The checkbox position relative to its label flips in RTL layouts — the checkbox moves to the right side of the label. Checkmark and indeterminate dash icons do not flip.

### 9. Element selection

Always use native `<input type="checkbox">`. Do not build custom checkboxes with `<div role="checkbox">` or `<span role="checkbox">` — native inputs provide form participation, built-in keyboard handling, and the `disabled` attribute for free. The native role (`checkbox`) matches the APG Checkbox pattern, so no `role` override is required.

A governed `<aiux-control-checkbox>` component exists (`@servicenow/aiux-components-control`), but it is not the Figma-aligned pattern (Figma's own Code Connect maps to the class-family markup above) and has no production adoption — use the native `<input>` + class-family pattern, not the component.

### 10. Scope boundary

This sheet covers individual checkbox decisions: which size, labeling and content conventions, state behavior, and accessibility requirements. It does not govern:

- **Parent-child group cascading** (selecting a parent selects all children, indeterminate when some children are checked, cascading clicks) — form composition spec.
- **How checkboxes compose inside forms** — form composition spec.
- **Table row selection using checkboxes** — table / data-table composition spec.
- **Filter pill interactions** — filter pills use `<button>` with `aria-pressed`, not checkboxes (see `@accessibility`).

The referencing direction is one-way: composition specs reference this sheet for individual checkbox rules; this sheet does not reference composition specs.
