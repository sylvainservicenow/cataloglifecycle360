# Progress

**DaisyUI base:** `progress` (prefixed `aiux-progress`)
**Production component:** None — native `<progress>` element + `aiux-progress` classes
**Last updated:** 2026-06-25 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use progress bar to communicate the completion status of a task, process, or data load. Appropriate when the user benefits from seeing how far along something is.

**Progress bar vs. skeleton:** Use progress bar when the completion percentage is known or can be estimated. When the duration is unknown and a percentage cannot be meaningfully communicated, use a skeleton (`aiux-skeleton`) — not a loading spinner. (See `avoid_daisyui_loading`: the DaisyUI loading component is disallowed for new work; `aiux-skeleton` is the standard loading affordance.)

**Do not use when:**

- Binary complete/incomplete states — use a badge or status indicator.
- Rating or scoring — use a dedicated rating component.
- The system is loading data with no percentage available — use a skeleton (`aiux-skeleton`).

### 2. Color variants

The color carries semantic weight — pick the variant that matches the state; do not use these styles arbitrarily for visual variety. Apply one color class on top of the base `aiux-progress`.

| Variant     | Class                   | Meaning                                          |
| ----------- | ----------------------- | ------------------------------------------------ |
| **Default** | `aiux-progress`         | Neutral/unstarted state                          |
| **Primary** | `aiux-progress-primary` | Brand-colored progress for primary workflows     |
| **Accent**  | `aiux-progress-accent`  | Accent-colored progress for highlighted contexts |
| **Neutral** | `aiux-progress-neutral` | Subdued neutral fill                             |
| **Info**    | `aiux-progress-info`    | Informational or paused/inactive state           |
| **Success** | `aiux-progress-success` | Normal/successful progress                       |
| **Warning** | `aiux-progress-warning` | Requires attention; something may be wrong       |
| **Error**   | `aiux-progress-error`   | Process has failed or is in an error state       |

The class family also exposes `aiux-progress-secondary`, but it is outside the current Figma scale — do not use it. Exact fill colors are owned by the classes/theme.

### 3. Determinate fill

Set `value` and `max` on the `<progress>` element — the bar fills proportionally to `value`. The determinate bar is the only form in the current Figma library and production use.

The native `<progress>` element also supports an **indeterminate** mode (omit `value` → the bar animates), but it is not in the Figma library or current production use. Treat it as out of scope for now; add it here if it ships.

### 4. Sizing

The bar height is 8px (`h-2`) — a single thickness, not a size scale. Width is fluid: the bar fills its container. Do not override width with arbitrary pixel values — let the container determine the bar's width.

### 5. Content rules

- Always pair a progress bar with a visible label that describes what is progressing (e.g., "Uploading files").
- Sentence case for labels: "Uploading files" not "Uploading Files".

### 6. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Progress
- **Forced colors:** Track uses `Field`/`ButtonBorder`; filled portion uses `Highlight` — see `@accessibility`

**Horizon-specific design notes:**

- **Use the native `<progress>` element.** It provides implicit `role="progressbar"` and announces value changes automatically. Set `value` and `max` for determinate; omit `value` for indeterminate.
- **Labeling:** `aria-labelledby` (preferred when a visible label exists) or `aria-label` (when not). Note: `aria-labelledby` only works within the same shadow root.
- **Live region:** For long-running determinate operations, wrap the percentage text in an `aria-live="polite"` region so screen readers announce updates without interrupting the user.

### 7. RTL

For time-based progress (elapsed time, countdown), the bar fills inline-end to inline-start in RTL. For all other progress types (task completion, form progress), the bar fills inline-start to inline-end regardless of language direction. This asymmetry is intentional — time direction follows reading direction; task completion does not.

### 8. Compositional constraints

- Always pair a progress bar with a label that describes what is progressing.
- Do not use more than one progress bar in the same content section — multiple bars create confusion about what the user should track.
- Do not mix a progress bar and a skeleton in the same context.

### 9. Scope boundary

This sheet covers single progress bar decisions: which variant, determinate fill, sizing, labeling, and accessibility. It does not govern:

- **How progress bars compose into multi-step flows** — defined by composition specs (steps, wizards).
- **Loading states for page-level content** — use skeleton patterns (`aiux-skeleton`).
- **Progress within file upload components** — the upload composition spec owns that layout.

The referencing direction is one-way: composition specs reference this sheet for individual progress bar rules; this sheet does not reference composition specs.
