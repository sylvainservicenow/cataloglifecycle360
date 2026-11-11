# Alert

**DaisyUI base:** `alert` — via `aiux-alert` classes, applied internally by the component
**Production component:** `<aiux-alert-message>` (`@servicenow/aiux-components-alert`)
**Last updated:** 2026-07-02 · v8

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component & variant selection

Alerts are built with the **`<aiux-alert-message>`** component — set the `type` attribute to the desired variant; the component owns class generation, icon selection, the dismiss/pause timers, and the entrance animation internally. Do not hand-write `aiux-alert` markup.

Six standard variants, confirmed against the Figma alert component. Every alert renders with the soft/tinted treatment — this is not configurable.

| Variant     | `type`    | Use when                                                          |
| ----------- | --------- | ----------------------------------------------------------------- |
| **Error**   | `error`   | A failure occurred that blocks the user or requires action.       |
| **Warning** | `warning` | A potential issue that may require attention but is not blocking. |
| **Info**    | `info`    | Neutral contextual information or guidance.                       |
| **Success** | `success` | An action completed successfully.                                 |
| **Primary** | `primary` | Brand-colored emphasis for non-status messages.                   |
| **Accent**  | `accent`  | Secondary brand emphasis. Rare.                                   |

**Sizing:** Figma defines two sizes, `sm` and `md`. `<aiux-alert-message>` has no `size` prop — it renders at a single fixed size regardless of context.

**Extended severity types — do not use:** The component also accepts `critical`, `high`, `moderate`, `positive`, `low`, `ai` as `type` values, but these are not part of Figma's alert component and must not be used. They also currently render with no color treatment at all — a class-name mismatch inside the component means the intended color CSS never applies.

See `@patterns/references/color-systems.md` for the full semantic color mapping and when to use each color.

### 2. Anatomy

```
┌────────────────────────────────────────────────────────────────┐
│  [icon]  [title]          [pause/resume]ⁱ  [dismiss]           │
│          [description]                                         │
├────────────────────────────────────────────────────────────────┤
│  [progress bar — auto-dismiss only]                             │
└────────────────────────────────────────────────────────────────┘
ⁱ auto-dismiss only
```

| Slot / prop        | Required | Notes                                                                                                                                              |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Icon**           | Auto     | Severity icon resolved from `type` (mapping below), or overridden per-instance via the `icon` prop. Decorative — hidden from assistive technology. |
| **Title**          | Yes      | `alert-title` attribute. Renders as `<h6>` automatically — do not hand-style the title with typography utility classes.                            |
| **Description**    | No       | `message` attribute.                                                                                                                               |
| **Pause / Resume** | No       | Shown automatically when `dismissible` and `duration > 0`.                                                                                         |
| **Dismiss**        | No       | Shown when `dismissible` is set.                                                                                                                   |
| **Progress bar**   | No       | Shown automatically when `dismissible` and `duration > 0`.                                                                                         |

**Do not generate an action inside the alert.** Figma's anatomy includes an action button grouped with dismiss on the right, vertically centered against the text block. The component can't produce this: any slotted content renders as a sibling of the title inside the same content block, never a sibling of dismiss (a separate Shadow DOM region) — no wrapping fixes this. Ship title + description + dismiss only until this is resolved.

**Severity icon mapping (intent vs. current):** Figma specifies `circle-info-outline` (Info/Primary/Accent), `circle-check-outline` (Success), `triangle-exclamation-outline` (Warning), and `hexagon-exclamation` (Error). The component currently renders `circle-close-outline` for Error instead — this default is internal to `<aiux-alert-message>`; a consuming agent can't change it except by overriding per-instance via the `icon` prop.

### 3. Content rules

- **Title:** Describe the situation in six words or fewer. Sentence case. Do not blame the user ("Your session expired" not "You failed to save"). Required for every alert.
- **Description:** Explain what happened and what the user can do. One sentence, 30 words maximum. Optional. Must add context the title does not — do not restate the title in longer form.
- **Action label:** Not currently generated — see §2 for why the action slot is excluded from anatomy until the component supports proper grouping with dismiss.

### 4. Behavior

**Dismissal:** When `dismissible`, the dismiss button is always visible at the inline-end edge of the alert — it is not hidden behind hover or another interaction.

**Auto-dismiss with progress bar:** Set `duration` (ms) to enable auto-dismiss — a common default for informational/success alerts is 5000 ms (`duration="0"`, the component's own default, disables it). A progress bar counts down and the alert dismisses on completion. The user can dismiss manually before the timer expires. A pause/resume button appears alongside dismiss so keyboard users can control the timer. Auto-dismiss requires `dismissible`. **APG deviation:** the APG Alert pattern states alerts should not disappear automatically; auto-dismiss deviates from this, and the intent is for the live region to downgrade to `role="status"` (polite) so transient content doesn't interrupt the user — the component currently always announces via `role="alert"` / assertive, regardless of `duration`.

**Hover pause:** Design intent is that hovering the alert pauses the auto-dismiss timer and moving the pointer away resumes it. Not implemented in the component — only the manual pause/resume button works today.

**Show More / Show Less:** Figma defines an expand/collapse control for description text exceeding two lines. Not implemented in the component at all — no truncation logic and no related prop exist; `message` always renders in full.

**Entrance animation:** Alerts animate in using the appear/dismiss pattern from `@motion` — scaled down and offset, transitioning to full size and opacity over `--appear-duration` with `--ease-medium-accel`. `motion-reduce:` simplifies to fade-only. This is built into the component; no additional markup needed.

**No embedded inputs:** The dismiss button, pause/resume button, and any slotted action are the only interactive elements. Do not embed form controls in the alert body.

**Simultaneous messages:** Do not render multiple alerts in the same section. Composition-level notification guidance governs stacking, timing, and lifecycle management.

### 5. States

The alert container itself has no hover or focus states. Interactive children (dismiss button, pause/resume button, slotted actions) follow their own state cycles per `references/button.md`.

### 6. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Alert — see `@accessibility`. Actionable alerts (with dismiss or required-response controls) follow the Alert Dialog pattern.
- **DaisyUI corrections:** See `@accessibility` › Alert
- **Forced colors:** Follows the **container** pattern; dismiss / pause / resume buttons follow the **interactive** pattern — see `@accessibility`
- **Internationalization & motion:** All user-facing strings must use `i18n.getMessage()` — see `@internationalization`. Auto-dismiss timer and entrance animations must respect `prefers-reduced-motion` — see `@motion`.

**Horizon-specific design notes:**

- **Focus management:** Actionable alerts take focus on appearance and restore focus on dismiss. Non-actionable alerts do **not** take focus and rely solely on the live-region announcement. _This deliberately diverges from the blanket focus rule in `@accessibility` › Alert — non-actionable alerts must not interrupt the user's focus._
- **"On appearance" means appearing, not existing.** An alert that is part of the page the user arrives on — a persistent banner above a list, a standing notice in a widget — must not take focus, even though its dismiss button makes it actionable by the rule above. `<aiux-alert-message>` cannot tell the two cases apart: `autofocusControls` defaults to `true` and `firstUpdated` moves focus to the dismiss button on every load, including SSR hydration. Any statically rendered alert must therefore bind `.autofocusControls=${false}`, as a property binding — `autofocus-controls="false"` is a Boolean attribute whose presence alone reads as `true`. Keep `duration` at `0` there too; a standing notice must not auto-dismiss. Only an alert raised in response to something the user or the system just did keeps the default.

### 7. RTL

Alert content, title, icon, and action controls mirror for RTL layouts. The severity icon remains at the inline-start edge; the dismiss button remains at the inline-end edge. Text alignment inherits from document direction. The progress bar anchors at `inset-inline-start` and shrinks toward `inset-inline-end`.

### 8. Scope boundary

This sheet covers the individual alert component: variant selection, anatomy, content rules, dismissal behavior, auto-dismiss timer, entrance animation, states, and accessibility.

It does **not** cover:

- **Runtime mechanism** — class generation, icon rendering, timer/pause math, and animation implementation are owned by `<aiux-alert-message>`.
- **How alerts stack, float, or coordinate lifecycle** — composition-level notification guidance governs stacking and timing.
- **Form field validation messages** — use field-level validation on the input component. See `@patterns/references/error-and-validation.md`.
- **Toast notifications** — see `references/toast.md` for system-level asynchronous notifications.

The referencing direction is one-way: composition specs reference this sheet for individual alert rules; this sheet does not reference composition specs.
