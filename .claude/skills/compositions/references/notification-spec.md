# Notification — Design Spec

## 1. Overview

A notification communicates system events, status changes, or conditions requiring attention — it answers **"What just happened?"** or **"What needs my attention?"** This spec governs variant classification (toast vs. alert), severity styling, dismiss behavior, timing, event naming, and ARIA patterns. Individual button styling follows `@components/SKILL.md`. Dashboard attention cards, chat/log patterns, and dialogs are governed by their respective compositions.

**Build with `<aiux-alert-message>` / `<aiux-toast-notification>` by default.** These components own class generation, icon selection, dismiss/pause timers, and entrance animation internally — the correct choice whenever they're available. **Hand-roll** raw `aiux-alert`/`aiux-toast` markup **only** when the real component isn't available (e.g., a sandboxed or standalone generation context with no access to `@servicenow/aiux-components-alert`/`-toast`) — and in that case you own the markup, classes, and ARIA yourself, per the Element Table and checks below.

**One exception does not depend on component availability:** `<aiux-alert-message>` cannot correctly group an action button with dismiss today — a real Shadow DOM limitation in the component (tracked as `GAPS.md` CI-19, verified empirically), not an access issue. When using the real component, never include an action. When hand-rolling, you control the DOM directly and are not bound by that limitation — an action button is fine if the prompt calls for one, grouped correctly with dismiss per the Element Table.

**Toast stacking has no sanctioned pattern in either path.** Unlike the action-button case, this is a genuine design decision, not a component gap: per `@components/SKILL.md`, there is no consolidation/stacking UI in the Figma library or production, whether hand-rolled or componentized. Render independent toast elements — never a "+N more" expand trigger or a Show/Hide/Dismiss-All bar.

## 2. Notification Types

Every notification maps to exactly one of two types.

```
Toast (fixed overlay, auto-dismiss)
  └── [icon] [title-container] [buttons]

Alert (standalone, in-flow)
  └── [icon] [title-container] [buttons]
```

### Element Table

| Element                           | DaisyUI Class                                            | Limit              | When to Use                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alert container**               | `aiux-alert aiux-alert-{type} aiux-alert-soft shadow-lg` | 1 per notification | Always                                                                                                                                       |
| **Toast container**               | `aiux-toast aiux-toast-top aiux-toast-center z-50`       | 1 per toast        | Toast type — one container per independent toast, never a shared stacking container                                                          |
| **Severity icon**                 | Inherits `currentColor` from parent                      | 1                  | Always — `circle-info` (info), `circle-check` (success), `triangle-exclamation` (warning), `hexagon-exclamation` (error)                     |
| **Title**                         | `text-lg font-normal leading-5`                          | 0–1                | Always for toast; optional for alert                                                                                                         |
| **Description**                   | `text-base font-light`                                   | 0–1                | When title needs elaboration                                                                                                                 |
| **Action button**                 | `aiux-btn aiux-btn-neutral aiux-btn-sm`                  | 0–1                | Alert (persistent), hand-rolled fallback only — never with the real `<aiux-alert-message>` component (CI-19), never in toast or auto-dismiss |
| **Dismiss button (persistent)**   | `aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm`    | 0–1                | Alert with `dismissible: true`                                                                                                               |
| **Dismiss button (auto-dismiss)** | `aiux-btn aiux-btn-ghost aiux-btn-square aiux-btn-sm`    | 0–1                | Alert auto-dismiss mode; toast error only                                                                                                    |
| **Progress bar**                  | `aiux-progress aiux-progress-{type}` (3px, `rounded-sm`) | 0–1                | Alert auto-dismiss mode only                                                                                                                 |

**Dismiss button shape is mandatory.** Always pair `aiux-btn-ghost` with a shape modifier — `aiux-btn-circle` (persistent) or `aiux-btn-square` (auto-dismiss). Never render dismiss as a bare `aiux-btn-ghost aiux-btn-sm`; without the shape class it reads as a generic ghost action button and will be flagged as one.

### Severity Mapping

| Severity    | DaisyUI Class                        | Icon                   | When to Use                           |
| ----------- | ------------------------------------ | ---------------------- | ------------------------------------- |
| **info**    | `aiux-alert-info aiux-alert-soft`    | `circle-info`          | Neutral information, status update    |
| **success** | `aiux-alert-success aiux-alert-soft` | `circle-check`         | Positive outcome, operation completed |
| **warning** | `aiux-alert-warning aiux-alert-soft` | `triangle-exclamation` | Caution needed, degraded state        |
| **error**   | `aiux-alert-error aiux-alert-soft`   | `hexagon-exclamation`  | Failure, critical problem             |

`primary` and `accent` are not notification severities — flag in toast contexts. Each severity has exactly one icon; do not mix. Title, description, and icon inherit severity color via `currentColor`. Dismiss button icons use `base-content`, not severity color. **Never substitute hardcoded severity colors** (`bg-amber-*`, `bg-green-*`, `bg-red-*`, hex, or Tailwind palette classes) for `aiux-alert-{type} aiux-alert-soft` — this holds even when the alert is nested inside a card or another composition; nesting does not relax it.

## 3. Critical Distinctions

### Toast vs. Alert — "System feedback or contextual feedback?"

| Scenario                       | Classification | Why                                  |
| ------------------------------ | -------------- | ------------------------------------ |
| "Record saved"                 | Toast          | Background action, system-level      |
| "Connection restored"          | Toast          | Transient system event               |
| "Form has 3 validation errors" | Alert          | Specific to visible content          |
| "API key expires in 7 days"    | Alert          | Persistent condition, section-scoped |
| "File upload failed — retry?"  | Alert          | Requires user action in context      |

## 4. Patterns

### Pattern 1: Toast

System-level, fixed overlay, auto-dismiss. Do not use when the user must act or when feedback is content-specific. Each toast is an independent element — no shared stacking container (§1).

```
┌─ Toast (fixed, top-center) ─────────────────────────────────────┐
│  [icon]  [title + description (FILL)]  [dismiss (opt)]          │
└────────────────────────────────────────────────────────────────┘
```

**Auto-dismiss:** 5000ms default. **No action button.** **Error toasts:** no auto-dismiss, show close button (`aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm`). **Hover pauses timer.** **Pointer-events:** `none` on container, `auto` on children. **Z-index:** `z-50`.

#### Animations

| Transition         | Keyframes                              | Duration       |
| ------------------ | -------------------------------------- | -------------- |
| Enter (top/bottom) | `slideInFromTop` / `slideInFromBottom` | 300ms ease-out |
| Enter (middle)     | `fadeIn`                               | 300ms ease-out |
| Exit (top/bottom)  | `slideOutToTop` / `slideOutToBottom`   | 300ms ease-in  |
| Exit (middle)      | `fadeOut`                              | 300ms ease-in  |

### Pattern 2: Alert

Contextual, inline, persistent or auto-dismiss with progress bar. Use for feedback specific to visible content.

```
┌─────────────────────────────────────────────────────────────────┐
│  [icon 24×24]  [title-container (FILL)]  [buttons (HUG)]        │
│                 ├─ title (H6)             ├─ action (sm, hand-rolled fallback only) │
│                 └─ description (body-md)  └─ dismiss             │
│  ── progress bar (3px, absolute bottom) ── (auto-dismiss only)  │
└─────────────────────────────────────────────────────────────────┘
```

**Width:** Fill parent. **`dismissible` defaults `true`** (per Figma). **Auto-dismiss mode:** progress bar shown, close button square (`aiux-btn-square`), action button removed, no pause button, hover pauses timer. **Action button:** hand-rolled fallback only (never with the real component, §1), persistent alerts only, label ≤ 2 words verb-first.

## 5. Classification Hints

| Signal                                                  | Classification     |
| ------------------------------------------------------- | ------------------ |
| DaisyUI `aiux-toast` class + fixed positioning + `z-50` | Toast              |
| DaisyUI `aiux-alert` class + inline positioning         | Alert              |
| Card layout + badge system + no `aiux-alert-*` classes  | Not a notification |

### Disambiguation

- **"Has auto-dismiss but no fixed positioning"**: Alert with auto-dismiss enabled. Not a toast.
- **"Displays a list of attention items with badges"**: Not a notification — dashboard card pattern.
- **"Alert lives inside a card that also has its own footer action buttons"**: Two independent button groups, governed by two independent specs. The alert's own action/dismiss buttons follow this spec's Element Table. The card's footer action-set is a separate composition — see `references/action-set-spec.md` (no `aiux-btn-ghost`/`aiux-btn-outline`/`aiux-btn-soft`/`aiux-btn-success`; footer wrapper is DaisyUI `aiux-card-actions`, not a custom flex/padding div). Do not let either composition's button variants bleed into the other's buttons.

## 6. Layout Rules

### Arrangement

- **Alert direction:** `flex` horizontal. **Alignment:** `items-center`. **Gap:** `gap-4` (16px).
- **Toast max width:** `max-width: min(768px, calc(100vw - 2rem))`.

### Ordering

**Alert** (left to right): `[severity icon (24×24, shrink-0)] [title-container (FILL)] [buttons (HUG)]`

Title container: title + description stacked with `gap-0.5` (2px). Buttons: action + dismiss with `gap-4` (16px).

### Constraints

- **No action button in toast:** Toasts are ephemeral.
- **Auto-dismiss removes action button:** Close button only (square shape). No pause button.
- **Error toast persistence:** Error severity toasts do not auto-dismiss. Show close button.
- **No stacking/consolidation UI:** See §1 — render independent toast elements regardless of implementation path.

```html
<!-- Toast (hand-rolled fallback) -->
<div
  class="aiux-toast aiux-toast-top aiux-toast-center z-50"
  style="pointer-events: none; max-width: min(768px, calc(100vw - 2rem))"
>
  <div
    class="aiux-alert aiux-alert-info aiux-alert-soft shadow-lg"
    role="alert"
    aria-live="assertive"
    style="pointer-events: auto"
  >
    ${icon({name: 'circle-info', size: 'lg'})}
    <div>
      <h6 class="text-lg font-normal leading-5">Record saved</h6>
      <p class="text-base font-light">
        Changes applied to incident INC0012345.
      </p>
    </div>
  </div>
</div>

<!-- Inline alert with action (hand-rolled fallback only — see §1 CI-19 note) -->
<div
  class="aiux-alert aiux-alert-warning aiux-alert-soft shadow-lg"
  role="alert"
  aria-live="assertive"
>
  ${icon({name: 'triangle-exclamation', size: 'lg'})}
  <div>
    <h6 class="text-lg font-normal leading-5">API key expiring</h6>
    <p class="text-base font-light">Your key expires in 7 days. Rotate now.</p>
  </div>
  <div class="flex gap-4">
    <button class="aiux-btn aiux-btn-neutral aiux-btn-sm">Rotate key</button>
    <button
      class="aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm"
      aria-label="Dismiss notification"
    >
      ✕
    </button>
  </div>
</div>
```

## 7. Reconciliation Decisions

| Decision                    | Spec Standard                   | Reasoning                                          |
| --------------------------- | ------------------------------- | -------------------------------------------------- |
| Auto-dismiss duration       | **5000ms**                      | 3000ms (code) too short, 8000ms (service) too long |
| Error toast persistence     | **No auto-dismiss, show close** | Errors need acknowledgment                         |
| Toast max-width             | **768px** (Figma)               | Code's 400px causes truncation                     |
| Alert `dismissible` default | **`true`** (Figma)              | Figma is design source of truth                    |

## 8. Event Naming

All events use `notification:` namespace.

| Event        | Name                        | Detail Payload                        |
| ------------ | --------------------------- | ------------------------------------- |
| Dismiss      | `notification:dismiss`      | `{ id, variant: 'toast' \| 'alert' }` |
| Auto-dismiss | `notification:auto-dismiss` | `{ id, variant }`                     |
| Show         | `notification:show`         | `{ id, variant, type }`               |

## 9. Content Rules

**Title ≤ 6 words** — what happened, not what to do. **Description ≤ 1 sentence:** toast ≤ 15 words, alert ≤ 30 words. **Action labels** verb-first, ≤ 2 words. **No duplicate info** between title and description. Button labels follow `@components/SKILL.md` § Content rules.

## 10. Accessibility

For per-variant accessibility, see `@components/SKILL.md` § Accessibility, which delegate to `@accessibility` and the APG Alert / Alert Dialog patterns. This section covers only composition-level role-vs-severity routing.

| Variant | Severity       | `role`   | Implied live-region |
| ------- | -------------- | -------- | ------------------- |
| Toast   | error, warning | `alert`  | `assertive`         |
| Toast   | info, success  | `status` | `polite`            |
| Alert   | error, warning | `alert`  | `assertive`         |
| Alert   | info, success  | `status` | `polite`            |

- **Do NOT** stack explicit `aria-live` with `role="alert"` or `role="status"` — the role already implies the live-region.
- **Do NOT** combine `role="alert"` on a visible notification with `ariaLive.announce()` for the same event — this produces duplicate announcements.
- Dismiss buttons: `aria-label="Dismiss notification"`. Severity icons: `aria-hidden="true"`.
- Timers must be cleared in `disconnectedCallback`. Toast and auto-dismiss must be SSR-guarded; static alert content is SSR-safe.

## 11. Scope Boundary

This spec covers variant classification, severity styling, dismiss behavior, timing, event naming, content rules, and ARIA for notification compositions.

It does **not** cover:

- **Individual button styling** — see `@components/SKILL.md`
- **Dashboard attention cards** — see `references/card-spec.md`
- **Chat/log patterns** (`role="log"`) — conversation pattern
- **Dialogs** — see `references/dialog-spec.md`

Referencing direction: this spec references `@components/SKILL.md`. The card composition references this spec for notification/card disambiguation. Dialog composition is a peer.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above.

### Structural checks

| #    | Check                                | Spec section                            | Description                                                                                             |
| ---- | ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| S-01 | Variant identified                   | §2 Notification Types                   | Toast (fixed overlay, auto-dismiss) or Alert (in-flow, persistent or timed)                             |
| S-02 | Not a dashboard card                 | §3 Critical Distinctions                | Uses DaisyUI `aiux-alert-*` classes, not badge-based categorization                                     |
| S-03 | Not a chat/log                       | §11 Scope Boundary                      | No `role="log"` with chronological messages                                                             |
| S-04 | Single variant                       | §2 Notification Types                   | No mixed behaviors (e.g., alert with fixed positioning)                                                 |
| S-05 | No action with real component        | §1 Overview                             | If using `<aiux-alert-message>`, no action button (CI-19). Hand-rolled fallback may include one.        |
| S-06 | No hand-rolled toast stacking        | §1 Overview, §6 Constraints             | No consolidation container, no "+N more" expand trigger — independent toast elements regardless of path |
| S-07 | Cross-composition boundary respected | §5 Classification Hints, Disambiguation | Alert-in-card button styling not mixed with footer action-set styling                                   |

### Layout checks

| #    | Check                    | Spec section                         | Description                                                                                                                                                                                             |
| ---- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | Shadow correct           | §6 Layout Rules, Arrangement         | Toast and standard alert use `shadow-lg`                                                                                                                                                                |
| L-02 | Toast max-width 768px    | §6 Layout Rules, Arrangement         | `max-width: min(768px, calc(100vw - 2rem))`                                                                                                                                                             |
| L-03 | Button styling DaisyUI   | §2 Notification Types, Element Table | Action: `aiux-btn aiux-btn-neutral aiux-btn-sm`. Dismiss persistent: `aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm`. Dismiss auto-dismiss: `aiux-btn aiux-btn-ghost aiux-btn-square aiux-btn-sm` |
| L-04 | Progress bar transparent | §2 Notification Types, Element Table | No visible background track                                                                                                                                                                             |

### Semantic / visual checks

| #    | Check                        | Spec section                            | Description                                                                            |
| ---- | ---------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| V-01 | Severity is standard         | §2 Notification Types, Severity Mapping | info, success, warning, or error. Flag `primary`/`accent` in toast                     |
| V-02 | No hardcoded severity colors | §2 Notification Types, Severity Mapping | Uses `aiux-alert-{type} aiux-alert-soft`, not `bg-amber-*`, `bg-red-*`, etc.           |
| V-03 | No hardcoded link colors     | §2 Notification Types, Severity Mapping | Uses DaisyUI `aiux-link` class or `var(--hz-color-text-link)`                          |
| V-04 | Title/desc `currentColor`    | §2 Notification Types, Severity Mapping | Not hardcoded hex                                                                      |
| V-05 | Icon `currentColor`          | §2 Notification Types, Severity Mapping | No hardcoded hex on icon                                                               |
| V-06 | Dismiss icon `base-content`  | §2 Notification Types, Severity Mapping | Not severity color                                                                     |
| V-07 | `role` severity-appropriate  | §10 Accessibility                       | error/warning → `alert`. info/success → `status`                                       |
| V-08 | `aria-live` explicit         | §10 Accessibility                       | Toast/alert error/warning: `assertive`. info/success: `polite`                         |
| V-09 | No duplicate announcements   | §10 Accessibility                       | `role="alert"` and `ariaLive.announce()` not both for same event                       |
| V-10 | Auto-dismiss 5000ms          | §7 Reconciliation Decisions             | Not 3000ms, not 8000ms                                                                 |
| V-11 | Error toast no auto-dismiss  | §4 Patterns, Pattern 1: Toast           | Persist with close button                                                              |
| V-12 | Hover pauses auto-dismiss    | §4 Patterns, Pattern 1: Toast           | Pause on hover, resume on mouse-out                                                    |
| V-15 | Toast: no close by default   | §4 Patterns, Pattern 1: Toast           | Auto-dismiss toasts hide close button                                                  |
| V-16 | Toast: close on error        | §4 Patterns, Pattern 1: Toast           | Error toasts show close button                                                         |
| V-17 | Alert `dismissible` true     | §7 Reconciliation Decisions             | Figma default is `true`                                                                |
| V-18 | Auto-dismiss close is square | §2 Notification Types, Element Table    | `aiux-btn aiux-btn-ghost aiux-btn-square aiux-btn-sm`. Not `aiux-btn-circle`           |
| V-19 | No pause button              | §4 Patterns, Pattern 2: Alert           | Close button only in auto-dismiss                                                      |
| V-21 | Icons `aria-hidden`          | §10 Accessibility                       | Severity icons: `aria-hidden="true"`                                                   |
| V-22 | Dismiss has shape modifier   | §2 Notification Types, Element Table    | `aiux-btn-ghost` always paired with `aiux-btn-circle` or `aiux-btn-square`, never bare |

### Content / text checks

| #    | Check                        | Spec section      | Description                                                       |
| ---- | ---------------------------- | ----------------- | ----------------------------------------------------------------- |
| T-01 | `notification:` namespace    | §8 Event Naming   | Not `alert-dismiss`, `toast-dismiss`, or `warning-banner:dismiss` |
| T-02 | Payload has `id` + `variant` | §8 Event Naming   | Variant is `'toast'` or `'alert'`                                 |
| T-03 | Dismiss `aria-label`         | §10 Accessibility | `aria-label="Dismiss notification"`                               |
| T-04 | Title ≤ 6 words              | §9 Content Rules  | What happened, not what to do                                     |
| T-05 | Description ≤ 1 sentence     | §9 Content Rules  | Toast ≤ 15 words, alert ≤ 30                                      |
| T-06 | Action label verb-first      | §9 Content Rules  | "View details", not "Details"                                     |
| T-07 | No duplicate info            | §9 Content Rules  | Description adds context the title doesn't                        |

---

## Resolution Guidance

### V-02: Hardcoded severity colors

```diff
- <div class="border-amber-200 bg-amber-50 text-amber-800 rounded-2xl p-4">
+ <div class="aiux-alert aiux-alert-warning aiux-alert-soft shadow-lg">
```

Remove all `bg-amber-*`, `border-amber-*`, `text-amber-*`, `bg-red-*`, `bg-green-*`, `bg-blue-*` used as severity indicators.

### V-03, V-04: Hardcoded text/link colors

```diff
- <p class="text-text-primary">Description</p>
+ <p>Description</p>  <!-- inherits severity via currentColor -->

- <a class="text-blue-600 hover:text-blue-800">Learn more</a>
+ <a class="aiux-link aiux-link-hover">Learn more</a>
```

### V-06: Dismiss button severity color

```diff
- <button class="text-warning aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm">
+ <button class="aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm">  <!-- base-content via aiux-btn-ghost -->
```

### S-05: Action button generated alongside the real component

```diff
- <aiux-alert-message type="warning" alert-title="API key expiring">
-   <button slot="action" class="aiux-btn aiux-btn-neutral aiux-btn-sm">Rotate key</button>
- </aiux-alert-message>
+ <!-- Hand-rolled fallback (action grouped correctly with dismiss) -->
+ <div class="aiux-alert aiux-alert-warning aiux-alert-soft shadow-lg" role="alert">
+   ${icon({name: 'triangle-exclamation', size: 'lg'})}
+   <div>
+     <h6 class="text-lg font-normal leading-5">API key expiring</h6>
+     <p class="text-base font-light">Your key expires in 7 days. Rotate now.</p>
+   </div>
+   <div class="flex gap-4">
+     <button class="aiux-btn aiux-btn-neutral aiux-btn-sm">Rotate key</button>
+     <button class="aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm" aria-label="Dismiss notification">✕</button>
+   </div>
+ </div>
```

### V-07, V-08: ARIA role/live

```javascript
get _isUrgent() {
  return this.type === 'error' || this.type === 'warning';
}

// In render:
role="${this._isUrgent ? 'alert' : 'status'}"
aria-live="${this._isUrgent ? 'assertive' : 'polite'}"
```

### T-01, T-02: Event namespace

```diff
- this.dispatchEvent(new CustomEvent('alert-dismiss'));
+ this.dispatchEvent(new CustomEvent('notification:dismiss', {
+   detail: { id: this.id, variant: 'alert', type: this.type },
+   bubbles: true, composed: true
+ }));
```

### V-10, V-11: Auto-dismiss timing

```diff
- this.duration = 3000;
+ this.duration = 5000;

// Error severity exemption:
connectedCallback() {
  super.connectedCallback();
  if (this.type === 'error') {
    this.duration = 0;  // no auto-dismiss
    this.dismissible = true;  // show close button
  }
}
```

### V-12: Hover pause

```javascript
@mouseenter=${this._pauseTimer}
@mouseleave=${this._resumeTimer}

_pauseTimer() { if (this._dismissTimer) { clearTimeout(this._dismissTimer); } }
_resumeTimer() { if (this.duration > 0) { this._startTimer(this._remainingTime); } }
```

### V-18: Dismiss button shape

```diff
- <button class="aiux-btn aiux-btn-ghost aiux-btn-circle aiux-btn-sm">  <!-- always circle -->
+ <button class="aiux-btn aiux-btn-ghost ${this.duration > 0 ? 'aiux-btn-square' : 'aiux-btn-circle'} aiux-btn-sm">
```
