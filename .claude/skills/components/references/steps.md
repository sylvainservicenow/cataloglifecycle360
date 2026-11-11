# Steps

**DaisyUI base:** `steps` (prefixed `aiux-steps`)
**Production component:** None — native `<ul>`/`<li>` + `aiux-steps`/`aiux-step-*` classes
**Last updated:** 2026-06-29 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use stepper to guide users through a multi-step process where steps have a defined sequence. Appropriate for form submissions, guided setup flows, registration, and checkout-style sequences where labeled stages help the user understand progress and scope.

| Need                                           | Component        | Why                                                |
| ---------------------------------------------- | ---------------- | -------------------------------------------------- |
| Sequential workflow with progress tracking     | **Steps**        | Status per step communicates position and progress |
| Parallel sections, any-order access            | **Tabs**         | No sequence; user visits sections freely           |
| Location trail in a hierarchy                  | **Breadcrumbs**  | Shows path, not workflow progress                  |
| One or two actions with no meaningful sequence | **Button group** | Stepper overhead adds nothing for trivial flows    |

> **Not the same as `<aiux-stepper>`.** A component named `<aiux-stepper>` exists but is an unrelated AI-agent execution-plan viewer (subscribes to workflow updates, renders its own collapsible progress list). It does **not** use the `aiux-steps` classes. For a generic sequential stepper, use the `aiux-steps`/`aiux-step-*` classes below — do not reach for `<aiux-stepper>`.

### 2. Orientation

Steps support horizontal (default) and vertical layout.

- **Horizontal:** Indicators in a row with labels below each indicator. Separators run inline between indicators.
- **Vertical:** Indicators in a column with labels at the inline-end of each indicator. Separators run block-wise between indicators.

Use `aiux-steps-vertical` for vertical orientation. Horizontal is the default (`aiux-steps` alone, or `aiux-steps-horizontal`). Both orientations are in the Figma library.

### 3. Status system

Each step carries an independent status. Status is independent of the active (currently viewed) step — **revisiting a complete step does not reset it.** The user's progress is preserved.

| Status          | Class               | Indicator treatment                                       |
| --------------- | ------------------- | --------------------------------------------------------- |
| **Not Started** | _(no modifier)_     | Neutral fill with step number                             |
| **Active**      | `aiux-step-primary` | Primary fill with step number                             |
| **In Progress** | `aiux-step-info`    | Info fill with step number                                |
| **Complete**    | `aiux-step-success` | Primary fill with checkmark icon (set `data-content="✓"`) |
| **Cancelled**   | `aiux-step-neutral` | Neutral fill                                              |
| **Error**       | `aiux-step-error`   | Error fill                                                |

The full color palette — `aiux-step-{neutral,primary,secondary,accent,info,success,warning,error}` — is in the Figma library, so every status above is design-approved. Production today uses only `aiux-step-primary` (reached/active step) plus the default neutral (upcoming steps); the other statuses are approved but not yet adopted in product. Error status does not automatically block navigation to other steps — enforcement depends on workflow configuration. (Connector lines fill to match progress automatically — applying `aiux-step-primary` colors the preceding connector; no separate markup needed.)

### 4. Step marker: number or icon

A step's indicator carries either a **number** (default) or an **icon** as its identifier, set via `data-content` on the `<li>`. This is a visual-identity choice for the marker only — it does **not** imply a navigation model (whether steps run in sequence or any order is workflow logic, not a marker decision; see §8).

Use the **number** unless the marker must be non-numeric. The one icon use in scope today is the **completed-step checkmark** (`data-content="✓"`, see §3) — the only icon marker production uses. Figma also defines a broader icon variant (icons replacing numbers per step); treat that as deferred until its usage is confirmed, and do not hand-roll arbitrary per-step icons in the meantime.

<!-- §5 intentionally absent — do not renumber. Pagination (legacy overflow arrows) omitted; gap keeps §7 Accessibility's number stable for the parallel a11y-branch edit. -->

### 6. Content rules

- Sentence case: "Review details" not "Review Details".
- Each step should represent a meaningful, completable unit of work — not a single field or a collection of unrelated tasks.
- Labels truncate with ellipsis when they exceed slot width; show the full text in a tooltip on hover (`@patterns/references/truncation-tooltip.md`).
- **Do not set your own font size or weight on the step label.** `aiux-step` provides the label typography (renders 16px / weight 400); adding `text-*` / `font-*` classes makes labels inconsistent across steppers. Figma specifies `body-md` at light (300) weight, but that weight is not available in karuna — do not try to force it.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Steps. Non-interactive steps need no corrections beyond the `<ul>`/`<li>` semantics; interactive steps require an APG Tab or custom navigation pattern.
- **Forced colors:** Step indicators follow the **interactive** pattern — see `@accessibility`

**Horizon-specific design notes:**

- **Interactive steps** must use `aria-current="step"` on the active step and a descriptive `aria-label` on each step element (e.g., `aria-label="Step 3: Review details — Complete"`).
- **Hit targets** must meet 24×24 CSS pixel minimum (WCAG 2.5.8).

### 8. Scope boundary

This sheet covers individual stepper decisions: when to use steps, orientation, status mapping, numbered vs. non-numbered, label conventions, and accessibility. It does not govern:

- **How steppers compose with form panels or page content** — defined by composition specs.
- **Spacing and alignment of steppers within layouts** — layout composition specs.
- **Multi-step form validation orchestration** — workflow logic, not component rules.
- **Keyboard navigation model between steps** — a composition concern.

The referencing direction is one-way: composition specs reference this sheet for individual stepper rules; this sheet does not reference composition specs.
