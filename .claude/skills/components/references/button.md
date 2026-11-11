# Button

**DaisyUI base:** `btn`
**Production component:** None — native `<button>` element + `aiux-btn` classes
**Last updated:** 2026-07-02 · v4

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant selection

Eight variants, matched to the Figma component library. Only one primary button per action group.

| Variant       | DaisyUI class                  | Use when                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary**   | `aiux-btn-primary`             | The single forward action in a view. One per group.                                                                                                                                                                                                                     |
| **Secondary** | `aiux-btn-secondary`           | Supporting action paired with a primary.                                                                                                                                                                                                                                |
| **Light**     | `aiux-btn-light`               | Low-emphasis action that still needs a visible button container.                                                                                                                                                                                                        |
| **Ghost**     | `aiux-btn-ghost`               | Inline action where button chrome adds noise. Transparent background, page-foreground text.                                                                                                                                                                             |
| **Accent**    | `aiux-btn-accent`              | AI-context substitute for Primary — use in AI-branded surfaces (e.g., prompt submission, AI-generated suggestions) in place of Primary, not alongside it.                                                                                                               |
| **Neutral**   | `aiux-btn-neutral`             | Dark neutral fill — stronger than secondary but without brand color. Usage guidance within action groups is defined in the action-set composition spec.                                                                                                                 |
| **Error**     | `aiux-btn-soft aiux-btn-error` | Destructive action. Replaces — never accompanies — primary. One per group maximum. Whether a group shows an error-colored action at all is determined by the action-set recipe based on entity context and button role — this sheet only defines the class combination. |
| **Link**      | `aiux-btn-link`                | A button whose action is not navigation but should carry minimal visual weight, styled like a link. Never use for real navigation — see § 9 Element selection.                                                                                                          |

`aiux-btn-outline` exists in the class family but is outside the current Figma scale — do not use it.

### 2. Sizing

| Context                                         | Size class    | Height | Rationale                                                      |
| ----------------------------------------------- | ------------- | ------ | -------------------------------------------------------------- |
| Contextual actions (row, card, toolbar)         | `aiux-btn-sm` | 32px   | Compact; doesn't dominate content.                             |
| Forward/primary actions (modals, forms, panels) | `aiux-btn-md` | 40px   | Default emphasis.                                              |
| Compact density override                        | `aiux-btn-xs` | 24px   | Only when `data-density="compact"` is active on the container. |
| Hero/landing call-to-action                     | `aiux-btn-lg` | 48px   | Rare. Only in single-action promotional surfaces.              |

The default size is `aiux-btn-md` (40px). `aiux-btn-xs` is 24px, `aiux-btn-sm` is 32px, `aiux-btn-lg` is 48px, `aiux-btn-xl` is 56px (rare — hero/promotional surfaces only).

### 3. Sub-types

Two icon-only shapes: **circular** (`aiux-btn-circle`) and **square** (`aiux-btn-square`). Both require:

1. An accessible label — `aria-label` on the button element.
2. A visible tooltip on hover/focus (reference `references/tooltip.md` for the tooltip pattern).
3. An unambiguous icon. If the icon meaning is uncertain, add a visible text label instead.

Circular is the default for icon-only. Use square only in dense grid toolbars where circles waste space.

For a fully padding-free icon button, add `p-0 min-h-0` alongside the shape class (e.g. `aiux-btn aiux-btn-ghost aiux-btn-circle p-0 min-h-0`) — there is no dedicated class or component prop for this, it is a plain Tailwind override on top of the shape class.

For a labeled (non-icon-only) button, an icon may precede or follow the label text; DOM order determines the visual order and mirrors automatically in RTL (see § 8).

**Sub-types not yet available:** Stateful button (toggle between two states — use `aiux-btn-ghost` with `aria-pressed` as interim; do not use DaisyUI's `swap` component which uses checkbox internals). AI button (no DaisyUI mapping — use the non-AI base variant as interim). Split button (use `aiux-join` group as interim — functional but not governed).

### 4. Pairing rules

- Primary (`aiux-btn-primary`) always appears with at least one secondary (`aiux-btn-secondary`) or a lower-emphasis alternative (`aiux-btn-light`, `aiux-btn-ghost`). A lone primary with no alternative is acceptable only in single-action confirmation dialogs.
- Error (`aiux-btn-soft aiux-btn-error`) replaces primary — it is never used alongside `aiux-btn-primary` in the same group.
- Never place two primaries (or two errors) in one action group. If two actions seem equally important, one is secondary.

### 5. Content rules

- Verb-first: "Save record", "Delete item", "Send message". Not "Record save" or noun-only labels.
- Sentence case: "Save record" not "Save Record".
- Never truncate button labels. If the label doesn't fit, shorten the copy — don't ellipsize.

### 6. States

Default, hover, focus-visible, active/pressed, disabled. All five must be accounted for. The focus-visible ring uses the brand-colored outline for primary and a neutral outline for non-primary variants. Disabled buttons use `aiux-btn-disabled` which reduces opacity.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Button — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Button (native `<button>`; native `disabled` attribute, not `aria-disabled`; anchors use `aria-disabled="true"` + `pointer-events: none`)
- **Forced colors:** Follows the **interactive** pattern. Ghost / bare variants (`btn-ghost`, `btn-link`) must use the transparent-border technique so the outline becomes visible — see `@accessibility` › Ghost / Bare Button Pattern

**Horizon-specific design notes:**

- **State-changing icons** (outline ↔ fill toggles): the parent's `aria-label` must not change based on the current state (e.g., "Add to favorites" ↔ "Remove from favorites"). The accessible name remains the same but is paired with `aria-pressed` on the parent button when appropriate. Tooltips on state changing buttons may change based on state, and may differ from the button's `aria-label`.

### 8. RTL

Button label and icon order mirror automatically in RTL layouts. In button groups, visual order of buttons reverses (primary moves to the left in RTL).

### 9. Element selection

Buttons trigger actions (`role="button"`). Links navigate to resources (`<a href>`). `aiux-btn-link` is a DaisyUI class that gives a button link-like styling (brand-colored text, no container) — but it is still a `<button>` element, not an `<a>`. If the interaction navigates, use an `<a>` tag with DaisyUI's `aiux-link` class, not `aiux-btn aiux-btn-link`.

### 10. Scope boundary

This sheet covers single-button decisions: which variant, which size, which label conventions. It does not govern:

- **How buttons group, space, and order** — defined by composition specs (action-set, contextual-actions).
- **When to use `aiux-btn-error`, `aiux-btn-neutral` in action groups** — the action-set spec owns role-based class assignment.
- **How buttons compose into toolbars or navigation** — contextual-actions spec.

The referencing direction is one-way: composition specs reference this sheet for individual button rules; this sheet does not reference composition specs.
