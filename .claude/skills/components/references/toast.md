# Toast

**DaisyUI base:** `toast` / `alert` (prefixed `aiux-toast` / `aiux-alert`)
**Production component:** `<aiux-toast-notification>` (`@servicenow/aiux-components-toast`) — renders the positioned toast container + a soft alert body itself; `triggerTransientToast(message, type)` is the one-line wrapper. It does **not** reuse `<aiux-alert-message>`.
**Last updated:** 2026-06-29 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use toast for system-level or asynchronous notifications that are not tied to a specific location on the page. Toast stacks individual alert components in a floating position above the UI, suitable for events occurring independently of the user's current workflow -- background saves, async job completions, external system updates, and similar events.

**Toast vs. inline alert:** If the notification is contextually tied to a specific section of the page, use an inline alert (`references/alert.md`). If it originates from outside the user's current context, use toast.

**When not to use:**

- Do not use toast for messages that require the user to take an immediate action -- use a modal instead.
- Do not use toast for form validation errors -- those belong inline with the relevant fields.

**Build with the component, not by hand.** Use `<aiux-toast-notification>` (set `message`, `type`, `position`, `duration`, `dismissible`, `icon`), or `triggerTransientToast(message, type)` for the standard transient case. Do not hand-assemble a `<div class="aiux-toast">` + alert markup — the component already does it.

### 2. Anatomy

`<aiux-toast-notification>` is a **single, self-contained notification**. Internally it renders a positioned `aiux-toast` container wrapping a soft alert body — you only set props; the component owns the markup:

| Part            | What the component renders                                                              |
| --------------- | --------------------------------------------------------------------------------------- |
| **Container**   | `aiux-toast` + a position class (from `position`) + `z-50`, with slide in/out animation |
| **Alert body**  | `aiux-alert aiux-alert-soft aiux-alert-{type}` with `role="alert"`                      |
| **Icon**        | A built-in per-type icon (or a custom one via `icon`)                                   |
| **Message**     | `message` text, plus a default `<slot>` for richer content / an action                  |
| **Dismiss (×)** | A ghost circle button shown when `dismissible` is set                                   |

The body is the **soft alert** appearance (light tinted background, 1 px solid border in the status color, `shadow-lg`, `rounded-xl`). Note this is the component's own lightweight alert — it is **not** an `<aiux-alert-message>` instance, so the richer alert affordances (title, auto-dismiss **progress bar**, hover-**pause**) are not available here; for those use `<aiux-alert-message>` (see `references/alert.md`).

**Icon (intent vs. current):** the toast and the standalone alert share the soft-alert look, so they should use the same Horizon status icons via the `icon()` directive — info `circle-info-outline`, success `circle-check-outline`, warning `triangle-exclamation-outline`, error `circle-close-outline`. The component currently hardcodes generic inline SVGs instead, so a toast's icon looks different from the matching alert. This is internal to `<aiux-toast-notification>` — a consuming agent can't change it.

### 3. Positioning

Position is a layout decision passed via the `position` prop — not a Figma-defined visual scale. The component maps `"<block>-<inline>"` to `aiux-toast-{block}` + `aiux-toast-{inline}`:

- **Block:** `top` / `bottom` (and `middle` for vertical-center — rare, critical prominence only).
- **Inline:** `start` / `center` / `end`.

`triggerTransientToast()` fixes `bottom-end`. Hand-built page toasts in production commonly use `top-center`. Toast floats in a fixed viewport position and does not scroll with the page — do not place it inside scrollable containers, modals, popovers, or cards.

### 4. Multiple toasts

Each toast is an independent `<aiux-toast-notification>` element; there is **no built-in stacking container or consolidation controller**. Showing several means rendering several elements. A "3+ alerts" consolidation bar (Show / Hide / Dismiss All) is not in the Figma library or production — do not build one.

### 5. Content rules

- **No duplicate toasts:** do not show the same notification if an identical one is already visible. Deduplicate by message content or event ID.
- **Keep it brief:** a toast is a glance-able status message, not a place for reference content (the user can't scroll back to it).
- **Auto-dismiss:** informational/success toasts should auto-dismiss — set `duration` (ms; `0` = no auto-dismiss). Error and warning toasts should persist (`duration="0"`) until manually dismissed.

### 6. States

| State      | Treatment                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| **Empty**  | `visible` is false → the component renders `nothing`. No DOM impact on the page.          |
| **Active** | `visible` is true → one toast is fixed-positioned at `z-50` and runs its entry animation. |

Hover/focus and the dismiss interaction are handled by the component.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Alert — see `@accessibility` for the live-region roles and keyboard interaction model used by each alert item in the stack
- **DaisyUI corrections:** See `@accessibility` › Toast and › Alert. Apply all alert-component corrections to each alert item.
- **Forced colors:** Toast is a **container** component (positioning wrapper, no visible boundary). Each alert item inside the stack follows the **container** pattern; its dismiss / action buttons follow the **interactive** pattern — see `@accessibility`

**Horizon-specific design notes:**

- **Container must exist in the DOM before the first alert arrives** — do not create the container dynamically when a notification fires. Adding `role="status"` to an element at insertion time may not trigger screen reader announcements.
- The container carries `role="status"`. For urgent alerts (error, warning), apply `role="alert"` to the individual alert item. _Do not_ stack explicit `aria-live` alongside these roles — `status` implies `polite`, `alert` implies `assertive`. Nesting both causes duplicate announcements.
- **Focus management:** Toasts must not steal focus. Screen readers receive the announcement via the live region. The controller bar (when visible) is keyboard-accessible (`Tab` reaches actions, `Enter`/`Space` activates).

### 8. Scope boundary

This sheet covers the `<aiux-toast-notification>` component: when to use it, its anatomy, positioning, multiple-toast behavior, and content rules.

It does **not** cover:

- **The full standalone alert** (title, auto-dismiss progress bar, hover-pause, focus management) -- `<aiux-alert-message>` / `references/alert.md`. A toast renders its own lighter soft-alert body.
- **Notification lifecycle, timing, and coordination across a page's notifications** -- composition specs.

The referencing direction is one-way: composition specs reference this sheet for toast rules; this sheet does not reference composition specs.
