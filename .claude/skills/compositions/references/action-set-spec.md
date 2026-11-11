# Action Set — Design Spec

## 1. Overview

An action set is a horizontal group of buttons representing the available actions for a content unit — a card, a form, a panel, a modal, or a record header. It answers: "What can I do here?" Individual button styling follows `@components/SKILL.md`. This spec governs how buttons assemble.

## 2. Roles

Six semantic roles, three visual classes. The role determines position and companion rules. The class determines appearance.

| Role            | Signal                       | Class                         | Limit |
| --------------- | ---------------------------- | ----------------------------- | ----- |
| **Primary**     | "Move forward" — progression | `aiux-btn aiux-btn-primary`   | 0–1   |
| **Completion**  | "Resolve this positively"    | `aiux-btn aiux-btn-primary`   | 0–1   |
| **Rejection**   | "Resolve this negatively"    | `aiux-btn aiux-btn-secondary` | 0–1   |
| **Dismissive**  | "Exit without deciding"      | `aiux-btn aiux-btn-secondary` | 0–1   |
| **Secondary**   | "Other options" — supporting | `aiux-btn aiux-btn-secondary` | 0–2   |
| **Destructive** | "Remove permanently"         | `aiux-btn aiux-btn-error`     | 0–1   |

Visual class mapping:

| Class                | Roles                            | Distinguished by                                                       |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `aiux-btn-primary`   | Primary, Completion              | Pattern (progression vs. binary decision)                              |
| `aiux-btn-secondary` | Rejection, Dismissive, Secondary | Label and position                                                     |
| `aiux-btn-error`     | Destructive only                 | Always far-left (footer) or in overflow (inline). The only red button. |

`aiux-btn-error` is not for rejection. Rejection is a decision; destruction is data loss. Only the latter gets red. `aiux-btn-success`, `aiux-btn-soft`, `aiux-btn-outline`, `aiux-btn-ghost` are not used in action sets.

**`aiux-btn-error` vs. `aiux-btn-soft aiux-btn-error` (primary negative):** `@components/SKILL.md` §4 defines a "primary negative" role (`aiux-btn-soft aiux-btn-error`) that replaces `aiux-btn-primary` as the forward action for standalone destructive confirmations. This is distinct from the action-set's destructive role — primary negative is the _forward_ action in a single-purpose destructive context (e.g., a confirmation dialog where Delete is the only positive outcome). The action-set's destructive is a _secondary_ add-on to an existing action set, spatially separated. Do not confuse the two.

### Key distinctions

**Primary vs. Completion:** Does the action resolve something (completion) or advance something (primary)? Both use `aiux-btn-primary`. The distinction determines the pattern — completion enables rejection as a companion.

**Rejection vs. Dismissive:** Does someone else experience a consequence (rejection) or does nothing change (dismissive)? Both use `aiux-btn-secondary`. Rejection only appears in binary decisions alongside completion.

**Rejection vs. Destructive:** Am I refusing (aiux-btn-secondary, decision pair) or destroying (aiux-btn-error, separated)?

## 3. Patterns

**Pattern 1: Workflow Progression** — Primary + Dismissive (+ optional Secondary, Destructive). The user advances a workflow.

```
Footer:
[Delete error] ← spacer → [Save draft secondary] [Cancel secondary] [Save primary]

Inline:
[Save draft secondary] [Cancel secondary] [Save primary] [⋯ overflow]
```

**Pattern 2: Binary Decision** — Completion + Rejection (+ optional Dismissive, Secondary, Destructive). The user makes a judgment between opposing outcomes.

```
Footer:
[Delete error] ← spacer → [Review later secondary] [Reject secondary] [Approve primary]

Inline:
[Reject secondary] [Approve primary] [⋯ overflow]
```

## 4. Container Categories

**Footer** (modal, dialog, card footer, form, panel) — action-set owns full width. Destructive is visible far-left with a flex spacer.

**Inline** (record header, page header) — action-set shares space with title/nav. Destructive overflows into the menu, never visible top-level.

| Container      | Category | Wrapper                                                                                                 | Destructive     |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| Modal / Dialog | Footer   | Flex container (`flex justify-end gap-2`) — DaisyUI v5 dropped `modal-action`, buttons are raw children | Visible, spacer |
| Card           | Footer   | `<slot name="footer">`                                                                                  | Visible, spacer |
| Form / Panel   | Footer   | Flex container                                                                                          | Visible, spacer |
| Record header  | Inline   | Flex cluster                                                                                            | Overflowed      |
| Page header    | Inline   | Flex cluster                                                                                            | Overflowed      |

## 5. Context Mappings

### Binary Decision (Completion + Rejection)

| Entity                     | Completion | Rejection | Dismissive   |
| -------------------------- | ---------- | --------- | ------------ |
| completable (approval)     | Approve    | Reject    | Review later |
| completable (call)         | Answer     | Decline   | —            |
| completable (permission)   | Allow      | Deny      | —            |
| completable (invitation)   | Accept     | Decline   | Maybe later  |
| completable (verification) | Confirm    | Deny      | —            |

### Workflow Progression (Primary + Dismissive)

| Entity       | Primary | Dismissive | Secondary  |
| ------------ | ------- | ---------- | ---------- |
| editable     | Save    | Cancel     | —          |
| submittable  | Submit  | Cancel     | Save draft |
| configurable | Apply   | Cancel     | Reset      |
| creatable    | Create  | Cancel     | —          |
| resolvable   | Resolve | Cancel     | Reassign   |

Destructive (Delete) is an add-on to any context, not its own entity characteristic.

## 6. Layout Rules

**Direction:** Horizontal. Vertical stack below 640px (`--hz-breakpoint-sm`). Forward action on top in vertical (thumb-reach priority).

**Alignment:** Right-aligned (`flex justify-end`). **Gap:** `gap-2` (8px default).

**Single-button card footer:** When a card footer action set contains exactly one button (primary or completion, no other roles present), the button spans full width (`w-full`) rather than right-aligning. A lone CTA in a card footer should fill the available space — a small right-aligned button in a wide footer underemphasizes the action.

**Footer ordering (L→R) — by pattern:**

Workflow progression:
`destructive → spacer → [overflow ⋯] → secondary → dismissive → primary`

Binary decision (with dismissive):
`destructive → spacer → dismissive → [overflow ⋯] → secondary → rejection → completion`

Binary decision (no dismissive):
`destructive → spacer → [overflow ⋯] → secondary → rejection → completion`

The spacer separates destructive from the right cluster. When no destructive is present, omit the spacer and left-side position — all buttons right-cluster. The decision pair (rejection + completion) is always adjacent — no button between them. In binary decisions, dismissive sits leftmost in the right cluster (immediately after the spacer or at position 0 if no destructive). In workflow progression, dismissive sits adjacent to primary because cancel/close is the direct alternative to the forward action.

**Inline ordering (L→R) — by pattern:**

Workflow progression: `secondary → dismissive → primary → [overflow ⋯]`
Binary decision: `dismissive → secondary → rejection → completion → [overflow ⋯]`

**Constraints:** Max 4 visible elements (buttons + overflow trigger). Overflow menu ≥ 2 items minimum. One forward action only (primary XOR completion). Each role appears once (secondary max 2). **Generate only the buttons explicitly described in the prompt or derivable from the §5 context mapping — do not invent supporting actions not mentioned.** A "single CTA" means exactly one button; a "Review & Approve" prompt produces one primary button, not a primary + an invented secondary.

**Density:**

| Density  | Gap            | Button size          |
| -------- | -------------- | -------------------- |
| compact  | `gap-1` (4px)  | `aiux-btn-sm` (32px) |
| default  | `gap-2` (8px)  | `aiux-btn-md` (40px) |
| spacious | `gap-3` (12px) | `aiux-btn-md` (40px) |

## 7. Content Rules

Labels are verb-first, sentence case, ≤ 3 words. Never truncate — shorten the label instead. Loading state replaces the label with a spinner; no adjacent spinner.

## 8. Accessibility Contract

For per-button accessibility (APG, DaisyUI corrections, forced colors), see `@components/SKILL.md` § Accessibility, which delegates to `@accessibility/SKILL.md`. This section covers only composition-level rules.

**Modal implicit dismissive:** Binary decision modals may rely on backdrop/X as the escape. Workflow progression modals require an explicit dismissive button in the modal's footer container.

**Shadow DOM hosting:** When the action-set is a Lit component inside a DaisyUI layout container (e.g., the modal footer's `flex justify-end gap-2` container), the host element must use `display: contents` so it contributes no box. The parent's flex layout applies directly to the action-set's button children. A host with default `display: block` breaks the flex row.

## 9. States

Default, hover, focus-visible, active/pressed, disabled, loading — per `@components/SKILL.md` §6. Composition-level: when a form is submitting, all action-set buttons disable except Cancel. When a modal is confirming an async operation, the active button shows a spinner and all other buttons disable.

**Disabled implementation:** Use the `disabled` HTML attribute, not `aria-disabled` (per `@components/SKILL.md` §7). The native attribute removes the button from tab order and blocks click events. `aiux-btn-disabled` applies the visual treatment (20% opacity). `aria-disabled` leaves the button focusable and clickable — it only announces the state, it doesn't enforce it.

**Loading ARIA:** A button in loading state sets `aria-busy="true"`. The spinner element is `aria-hidden="true"` — screen readers should not announce the spinner as content. The button's accessible name remains the action label (e.g., "Approve"), not "loading."

**Focus-visible rings:** Primary buttons show a brand-colored focus ring. Secondary buttons show a neutral ring (`--neutral-500`). In a binary decision (Reject + Approve adjacent), the focus ring is the keyboard user's primary visual cue for which button has focus — brand teal vs. neutral gray (per `@components/SKILL.md` §6).

## 10. Edge Cases

1. **Both primary and completion present:** Determine whether the action resolves or advances. Only one forward action per set. Split across contexts if both are genuinely needed.
2. **No forward action identified:** May not be an action set — consider contextual-actions or toolbar pattern instead.
3. **Rejection without completion:** Invalid. Rejection only exists as half of a binary decision.
4. **Single-item overflow:** Move an additional secondary into the menu to reach the ≥ 2 minimum.
5. **Destructive as the only action:** Not an action set — a single destructive button without a forward action is a standalone confirmation trigger, not a composition.
6. **"Confirm" label ambiguity:** Three cases — resolving (completion), advancing (primary), gating destruction (primary). The confirmation modal for a delete uses `aiux-btn-primary` for Confirm, not `aiux-btn-error`.
7. **Inline context with no overflow needed:** If ≤ 3 non-destructive buttons and no destructive, render as a simple cluster with no overflow trigger.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above.

### Structural checks

| #    | Check                                     | Spec section             | Description                                                                                                                                                                        |
| ---- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Single forward action                     | §2 Roles, §6 Constraints | Exactly one Primary OR one Completion — never both, never zero. Two `aiux-btn-primary` buttons in the same set is a violation.                                                     |
| S-02 | Pattern correctly identified              | §3 Patterns              | Binary decision contexts use Completion + Rejection. Workflow progression uses Primary + Dismissive. Mixing (e.g., rejection without completion) is a violation.                   |
| S-03 | Rejection paired with completion          | §2 Key distinctions      | Rejection only appears in binary decision patterns alongside Completion. An action-set with Rejection but no Completion is invalid.                                                |
| S-04 | Dismissive present for reversible actions | §3 Patterns              | If the user can defer or exit without consequence, a Dismissive button must exist. Exception: binary decisions where deferral is inappropriate (live calls, security permissions). |
| S-05 | Button count ≤ 4                          | §6 Constraints           | No more than 4 visible elements (buttons + overflow trigger).                                                                                                                      |
| S-06 | No role duplication                       | §2 Roles (Limit column)  | Each role appears at most once, except Secondary (max 2).                                                                                                                          |

### Container context checks

| #    | Check                              | Spec section                  | Description                                                                                                                                                                                                                               |
| ---- | ---------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | Container category identified      | §4 Container Categories       | Footer (full-width, owns the strip) or Inline (constrained, shares space). Determines destructive handling and overflow position.                                                                                                         |
| C-02 | Correct wrapper for container type | §4 Container Categories table | Modal/dialog uses a `flex justify-end gap-2` footer container (DaisyUI v5 dropped `modal-action`). Card uses footer slot. Form/panel uses flex container. Inline uses right-aligned flex cluster.                                         |
| C-03 | Modal footer uses correct layout   | §4 Container Categories       | If inside a `aiux-modal-box`, action-set buttons must be raw children wrapped in `<div class="flex justify-end gap-2">`. Hand-wired footer divs without this layout, or reliance on the nonexistent `modal-action` class, are violations. |
| C-04 | No action-set in modal header      | §4, §8 Accessibility Contract | Close/dismiss is a header concern (X button). Confirm/cancel/submit are footer concerns (the modal's flex footer container). Mixing them is a violation.                                                                                  |
| C-05 | Card footer slot exists            | §4 Container Categories       | Card action-sets live in the named footer slot or dedicated footer area. Buttons loose inside the body slot are violations.                                                                                                               |
| C-06 | Modal implicit dismissive          | §8 Accessibility Contract     | Binary decision modals may rely on backdrop/X as the escape. Workflow progression modals require explicit dismissive in the modal's footer container.                                                                                     |

### Layout checks

| #    | Check                                     | Spec section                                        | Description                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L-01 | Ordering correct for pattern and category | §6 Layout Rules (footer/inline ordering by pattern) | Check the specific formula for the pattern (progression vs. binary) AND the category (footer vs. inline). In binary decisions, dismissive sits leftmost in the right cluster — no spacer between dismissive and the decision pair. The spacer only exists when destructive is present (separates destructive from the rest). Decision pair (rejection + completion) always adjacent. |
| L-02 | Destructive handling matches category     | §4 Container Categories (Destructive column)        | Footer: visible far-left with flex spacer. Inline: inside overflow menu, never visible top-level.                                                                                                                                                                                                                                                                                    |
| L-03 | Decision pair adjacent                    | §3 Pattern 2                                        | In binary decisions, Rejection sits immediately left of Completion — no spacer or secondary between them.                                                                                                                                                                                                                                                                            |
| L-04 | Right-aligned group                       | §6 Layout Rules                                     | Forward action is rightmost (or second-to-rightmost if overflow trigger follows). Group uses `flex justify-end`.                                                                                                                                                                                                                                                                     |
| L-05 | Gap matches density                       | §6 Density table                                    | `gap-2` (8px) default, `gap-1` (4px) compact, `gap-3` (12px) spacious. No extra spacing between specific pairs except the destructive spacer.                                                                                                                                                                                                                                        |
| L-06 | Button size matches density               | §6 Density table                                    | `aiux-btn-md` (40px) at default/spacious. `aiux-btn-sm` (32px) at compact. NOT `aiux-btn-xs` — action-sets use one step down.                                                                                                                                                                                                                                                        |

### Semantic / token checks

| #    | Check                                                          | Spec section                     | Description                                                                                                                                                                                                                              |
| ---- | -------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Forward action uses `aiux-btn-primary`                         | §2 Visual class mapping          | Both Primary and Completion use `aiux-btn aiux-btn-primary`. The forward action is always the brand-colored button.                                                                                                                      |
| V-02 | Non-forward, non-destructive use `aiux-btn-secondary`          | §2 Visual class mapping          | Rejection, Dismissive, and Secondary all use `aiux-btn aiux-btn-secondary`. Distinguished by label and position only.                                                                                                                    |
| V-03 | `aiux-btn-error` only for Destructive                          | §2 Roles, §2 Key distinctions    | The red button is reserved for permanent data loss (Delete, Remove, Revoke). Never for Rejection.                                                                                                                                        |
| V-04 | Only three classes used                                        | §2 Roles                         | `aiux-btn-primary`, `aiux-btn-secondary`, `aiux-btn-error` only. No `aiux-btn-success`, `aiux-btn-soft`, `aiux-btn-outline`, `aiux-btn-ghost`, `aiux-btn-neutral`, `aiux-btn-accent`.                                                    |
| V-05 | Disabled uses native attribute                                 | §9 States                        | Native `disabled` HTML attribute, not `aria-disabled`. `aiux-btn-disabled` for visual treatment (20% opacity). `aria-disabled` leaves the button focusable and clickable.                                                                |
| V-06 | No `aiux-btn-soft aiux-btn-error` alongside `aiux-btn-primary` | §2 Roles (primary negative note) | `aiux-btn-soft aiux-btn-error` is a standalone destructive forward action from `@components/button.md` §4. The action-set destructive role uses `aiux-btn-error` (not soft). If both appear, it's a role conflict — two forward actions. |

### Content checks

| #    | Check                | Spec section     | Description                                                                                                 |
| ---- | -------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| T-01 | Labels verb-first    | §7 Content Rules | Each label starts with a verb (Approve, Save, Cancel). Not noun-first (Approval, Cancellation).             |
| T-02 | Labels sentence case | §7 Content Rules | "Save record" not "Save Record". Exception: single-word labels.                                             |
| T-03 | Labels ≤ 3 words     | §7 Content Rules | Concise. "Save and Continue" acceptable. "Save Changes and Return to List" is not.                          |
| T-04 | No truncation        | §7 Content Rules | Labels never truncate. Shorten the copy instead. Loading replaces label with spinner — no adjacent spinner. |

---

## Resolution Guidance

### S-01: Both primary and completion present

Determine whether the action resolves or advances — only one forward action per set. Common case: a form with "Submit" and "Mark complete." If submitting IS completing, use Completion only (binary pattern). If they're separate concerns, split across contexts (submit in form footer, complete in record header).

### S-03: Rejection without completion

Rejection is one half of a binary decision — the positive counterpart must exist. If there's Reject but no Approve, either the positive action is missing or this is actually a Destructive action (permanent removal, not a decision).

### S-05: More than 4 visible actions

Move lowest-priority secondaries into overflow until visible count ≤ 4 and overflow menu ≥ 2 items. Overflow trigger: `aiux-btn aiux-btn-secondary aiux-btn-square` with vertical ellipsis. Footer: trigger sits left of visible actions. Inline: trigger sits right of forward action. Forward actions, rejection, and dismissive never overflow. Structure the overflow menu per `@patterns/references/overflow.md` § 3.

### V-03: `aiux-btn-error` used for Rejection

Change to `aiux-btn-secondary`. Rejection is a consequential decision, not data loss. Only permanent removal (Delete, Remove, Revoke) gets red. The Figma button spec labels `aiux-btn-error` as "error (destructive)."

### V-04: `aiux-btn-success`, `aiux-btn-soft`, `aiux-btn-outline`, or `aiux-btn-ghost` found

Replace with the correct role class:

- `aiux-btn-success` → `aiux-btn-primary` (no green button in the system)
- `aiux-btn-soft` or `aiux-btn-ghost` (dismissive) → `aiux-btn-secondary`
- `aiux-btn-outline` (secondary) → `aiux-btn-secondary`
- `aiux-btn-outline aiux-btn-error` (destructive) → `aiux-btn-error`

### L-02: Destructive visible in inline context

Move destructive into the overflow menu. In record/page headers, destructive actions are never visible top-level. The destructive action keeps its role semantics inside the menu — distinguish with error-colored text.

### L-02: Destructive not separated in footer

Insert a flex spacer (`flex-grow` or `ml-auto` on the right cluster) between destructive and the other buttons.

### C-03: Modal footer missing correct layout

Wrap footer buttons in `<div class="flex justify-end gap-2">`. DaisyUI v5 dropped the `modal-action` helper class (see the `daisyui-aiux-prefix-migration` skill's v4→v5 table) — buttons are raw children of `aiux-modal-box` and the flex/right-alignment/spacing comes from these standard utility classes instead.

### C-04: Close button as only dismiss in actionable modal

If a modal requires a deliberate user decision (confirmation, form submission, destructive action), a header X button alone is insufficient. Add a footer with at least a Cancel button, using the standard `flex justify-end gap-2` container.

### Edge case: No forward action identified

If all buttons are equally weighted, this may not be an action set — consider contextual-actions or toolbar pattern. Action sets require one Primary (progression) or one Completion (binary decision).
