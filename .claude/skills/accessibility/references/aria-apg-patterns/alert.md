# Alert and Notification Patterns

## Pattern Usage

An alert is an element that displays a brief, important message in a way that attracts the user's attention without interrupting the user's task. Dynamically rendered alerts are automatically announced by most screen readers, and in some operating systems, they may trigger an alert sound. It is important to note that, at this time, screen readers do not inform users of alerts that are present on the page before page load completes.

Because alerts are intended to provide important and potentially time-sensitive information without interfering with the user's ability to continue working, it is crucial they do not affect keyboard focus. The Alert Dialog Pattern is designed for situations where interrupting work flow is necessary.

## Keyboard Interaction

An alert (in its basic form) is not an interactive element, so it has no keyboard interaction. However, when an alert contains interactive elements such as links or buttons, those elements follow their respective keyboard patterns.

## WAI-ARIA Roles, States, and Properties

| Requirement          | Implementation                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alert role           | The widget has a role of `alert`.                                                                                                                                                                             |
| Accessible name      | The alert contains a message that conveys the nature of the alert. If the alert has a visible heading, use `aria-labelledby` to reference it. Otherwise, provide a concise accessible name with `aria-label`. |
| Live region behavior | The `alert` role has an implicit `aria-live` value of `assertive` and an implicit `aria-atomic` value of `true`.                                                                                              |

**Important Considerations:**

- Because an alert is for information that requires immediate attention, assistive technologies may automatically read the alert as soon as it appears, potentially interrupting whatever the user was doing.
- Do not include interactive elements that require user action within an alert if you need to maintain workflow continuity. Use an Alert Dialog instead.
- Alerts should not disappear automatically—users need adequate time to read them.

---

## ServiceNow Notification Patterns

Use this section when implementing Platform (async growl-style), Toast (transient action feedback), or Banner (system-level full-width) notification types. It specifies role strategy, keyboard interactions, and focus management for each type.

### WCAG Criteria

| Criterion                            | Requirement                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **4.1.3 Status Messages** (AA)       | Notifications that don't receive focus must use `role="status"` (polite) or `role="alert"` (assertive) on the visible element     |
| **2.1.1 Keyboard** (A)               | All interactive notifications (Platform, Banner) must be fully keyboard-operable                                                  |
| **2.4.3 Focus Order** (A)            | Focus restoration after dismiss must return to the logical prior position                                                         |
| **2.4.7 Focus Visible** (AA)         | Focus indicator must be visible on all interactive elements within a notification                                                 |
| **1.3.1 Info and Relationships** (A) | Semantic roles must convey notification type and urgency                                                                          |
| **2.2.2 Pause, Stop, Hide** (A)      | Auto-dismissing Toasts must stay visible long enough to be read — minimum 5 seconds or dynamically calculated from message length |

### Notification Types at a Glance

| Type     | Position                       | Trigger                            | Has Actions | Dismissal                        | role     |
| -------- | ------------------------------ | ---------------------------------- | ----------- | -------------------------------- | -------- |
| Platform | Floating overlay (growl-style) | Async / system-driven              | Yes         | X button, action, snooze, Escape | `status` |
| Toast    | Floating, brief                | User action (success/error)        | No          | Auto-dismiss, optional X         | `status` |
| Banner   | Top of page, full-width        | System-level (e.g. planned outage) | Yes         | X button (not Escape)            | `alert`  |

### Role Strategy

All three notification types are always visible in the DOM when active. Place the semantic role directly on the visible notification container — not on a hidden proxy element.

| Notification | Role            | Announcement behavior                                           |
| ------------ | --------------- | --------------------------------------------------------------- |
| Platform     | `role="status"` | Polite — waits for screen reader to finish current output       |
| Toast        | `role="status"` | Polite — waits for screen reader to finish current output       |
| Banner       | `role="alert"`  | Assertive — interrupts current screen reader output immediately |

`role="status"` implies `aria-live="polite"` + `aria-atomic="true"`. `role="alert"` implies `aria-live="assertive"` + `aria-atomic="true"`. Both are built into the browser; no extra attributes are needed.

**Do not use these common but wrong patterns:**

- **`role="region"` on the notification container** — `role="region"` is a landmark for page structure, not a live region. It does not announce content changes to screen readers. Platform and Toast must use `role="status"`; Banner must use `role="alert"`.
- **A separate hidden `aria-live` announcer element** — a `<div class="sr-only" aria-live="polite">` or `<div role="status" style="position:absolute;left:-9999px">` fed by JavaScript is unnecessary here. All three notification types are always visible — the live region role goes on the visible element itself, not on a hidden proxy.
- **`role="alertdialog"` for Banner** — `role="alertdialog"` is for modal dialogs that require an immediate response. Banner is non-modal; use `role="alert"` instead.

```html
<!-- BAD — role="region" does not announce changes; hidden announcer is unnecessary -->
<div id="announcer" role="status" aria-live="polite" class="sr-only"></div>
<div role="region" class="platform-notification">New notification</div>

<!-- GOOD — role="status" directly on the visible element; no hidden announcer -->
<div role="status" class="platform-notification">New notification</div>
```

> **Do not use `role="alert"` for Platform notifications.** Platform notifications are async background events — they arrive while the user is working on something else. Interrupting with an assertive announcement is disruptive. The user can reach the notification at their own pace via the keyboard shortcut. `role="alert"` is reserved for Banner only.

```html
<!-- BAD — role="alert" on Platform interrupts the user mid-task -->
<div role="alert" class="platform-notification">
  Task assigned: Review Q3 report
</div>

<!-- GOOD — role="status" announces politely when the screen reader is free -->
<div role="status" class="platform-notification">
  Task assigned: Review Q3 report
</div>
```

The only notification that uses `role="alert"` is **Banner**. Platform and Toast use `role="status"`.

### Live Region Failure Modes

These three patterns silently break screen reader announcements with no visible indication of failure.

#### ❌ `aria-hidden="true"` on a live region container

`aria-hidden` propagates inward through the entire subtree. A child `role="status"` or `role="alert"` element inside a hidden ancestor is completely silenced — `aria-hidden="false"` on the child cannot override it.

```html
<!-- BAD — role="status" is silenced by the ancestor aria-hidden -->
<div aria-hidden="true" class="toast-wrapper">
  <div role="status">Record saved.</div>
</div>

<!-- GOOD — aria-hidden is never placed on the live region or its ancestors -->
<div class="toast-wrapper">
  <div role="status">Record saved.</div>
</div>
```

#### ❌ `display:none` or `visibility:hidden` on the live region element itself

Hiding the live region container removes it from the accessibility tree. Even when it becomes visible again, screen readers do not re-observe it for mutations — the announcement is lost.

```html
<!-- BAD — display:none removes the element from the accessibility tree -->
<div role="status" style="display:none" class="toast">
  <!-- content injected here will never be announced -->
</div>

<!-- GOOD — container stays in the DOM; content is cleared when inactive -->
<div role="status" class="toast">
  <!-- empty when inactive; populated to trigger announcement -->
</div>
```

Control visual appearance with `opacity`, `transform`, or `pointer-events` — not `display` or `visibility`. Clear text content when the notification is dismissed.

#### ❌ `aria-live` without `aria-atomic="true"`

Without `aria-atomic="true"`, screen readers may announce only the mutated portion of the container rather than the full message. `role="status"` and `role="alert"` imply `aria-atomic="true"` automatically — but if you use `aria-live` directly, you must add `aria-atomic="true"` explicitly.

```html
<!-- BAD — partial mutations may be announced piecemeal -->
<div aria-live="polite" class="toast">Loading complete. 3 items updated.</div>

<!-- GOOD — full content announced as a unit -->
<div aria-live="polite" aria-atomic="true" class="toast">
  Loading complete. 3 items updated.
</div>

<!-- BEST — use the role shorthand; aria-atomic is implicit -->
<div role="status" class="toast">Loading complete. 3 items updated.</div>
```

**Timing rule:** the notification element must be in the DOM _before_ content is injected. If you render the element and populate it in the same frame, some screen readers will miss the announcement. Inject an empty container first, then populate it.

### Platform Notifications

Async floating notifications that can appear at any time regardless of user activity. Visually similar to growl-style alerts. Contain actionable content (buttons, links). May queue and roll up into a summary when multiple are pending.

The Platform notification container has `role="status"`. When its content is injected or updated, the browser announces a brief summary and the keyboard shortcut to move focus to the notification.

#### Keyboard Interaction: Single Notification

| State                   | Key                      | Behavior                                                                                    |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Notification appears    | (none)                   | Focus stays where it is. aria-live region announces summary + shortcut.                     |
| User presses shortcut   | [shortcut]               | Focus moves to the notification container. Previous focus position is stored.               |
| Focused on notification | Tab                      | Cycles through interactive elements within the notification (action button, snooze, close). |
| Focused on notification | Shift+Tab                | Reverse cycle through interactive elements.                                                 |
| Focused on notification | Escape                   | Dismisses the notification. Focus returns to stored position.                               |
| Focused on notification | Enter/Space on action    | Performs the action. Focus moves to the action target. Stored position is discarded.        |
| Focused on notification | Enter/Space on snooze    | Snoozes the notification. Focus returns to stored position.                                 |
| Focused on notification | Enter/Space on close (X) | Dismisses the notification. Focus returns to stored position.                               |

#### Keyboard Interaction: Multiple Notifications (Roll-Up)

When more than one Platform notification is pending, they collapse into a single summary notification.

| State                      | Key                   | Behavior                                                                                                                                   |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Roll-up appears            | (none)                | Focus stays where it is. aria-live region announces: _"You have [n] new notifications. Press [shortcut] to open the notification center."_ |
| User presses shortcut      | [shortcut]            | Focus moves to the notification center side panel.                                                                                         |
| Inside notification center | Tab                   | Cycles through notification items and their actions within the panel.                                                                      |
| Inside notification center | Enter/Space on action | Performs the action. Focus stays within the notification center panel.                                                                     |
| Inside notification center | Escape or close panel | Closes the notification center. User navigates back to their previous context on their own.                                                |

**Focus management:** Single notification stores focus on shortcut press and restores it on dismiss/snooze/close. Roll-up does not automatically restore focus — the user manages their own return since they may be working through multiple items.

### Toast Notifications

Small, transient messages confirming the result of a user action (success, error, info). No interactive content beyond an optional close button. Auto-dismiss after a timeout.

The Toast element has `role="status"`. When its content is set, the browser announces the full message. No shortcut is offered because there is nothing to act on.

#### Keyboard Interaction

| State                                               | Key         | Behavior                                                                                                           |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Toast appears                                       | (none)      | Focus does not move. aria-live region reads the message. Toast auto-dismisses after timeout.                       |
| Toast has optional close button and user tabs to it | Enter/Space | Dismisses the toast immediately. Focus returns to the element that had focus before (or the next logical element). |

**Focus management:** Focus never moves to the Toast automatically. The close button, if present, is a convenience — not a required interaction. Escape does not dismiss Toasts (they auto-dismiss and are non-blocking).

### Banner Notifications

Full-width bar at the top of the page for system-level messages (planned outages, maintenance windows, critical system status). Contains actionable content and a close button.

When loaded on page load, no special announcement is needed — the banner is in the DOM and reachable in normal tab order. When injected dynamically, the banner element has `role="alert"` so the browser immediately interrupts and announces the full content.

#### Keyboard Interaction

| State                       | Key                      | Behavior                                                                                                   |
| --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Banner appears on page load | (none)                   | No announcement. Banner is in the DOM and reachable via normal tab order.                                  |
| Banner injected dynamically | (none)                   | Focus stays where it is. aria-live region announces content + shortcut. Previous focus position is stored. |
| User presses shortcut       | [shortcut]               | Focus moves to the banner.                                                                                 |
| Focused on banner           | Tab                      | Cycles through interactive elements in the banner (links, action button, close).                           |
| Focused on banner           | Enter/Space on action    | Performs the action. Focus moves to the action target.                                                     |
| Focused on banner           | Enter/Space on close (X) | Dismisses the banner. Focus returns to stored position.                                                    |
| Focused on banner           | Escape                   | Does nothing. Banner does not dismiss on Escape.                                                           |

**Focus management:** Dynamic injection stores the user's previous focus position. Dismissing via the X button restores focus. Performing an action moves focus to the action's target — stored position is discarded. Escape is intentionally non-functional on Banners to prevent accidental dismissal of system-level information.

**Building one on `<aiux-alert-message>`:** its `autofocusControls` property defaults to `true` and moves focus to the alert's close button (or a slotted action) in `firstUpdated`. For a banner that is present on page load that is exactly the "no focus move" rule above being broken, on every load. Bind `.autofocusControls=${false}` — a property binding, because `autofocus-controls="false"` is a Boolean attribute whose presence alone reads as `true`. Leave `duration` at `0`: a system-level banner must not auto-dismiss.

### Implementation

```js
// Toast — role="status" on the visible element
render() {
  return html`
    <div role="status" class="notification-toast">
      ${this._message}
    </div>
  `;
}

// Banner — role="alert" on the visible element
render() {
  return html`
    <div role="alert" class="notification-banner">
      ${this._message}
    </div>
  `;
}
```

When injecting content into an existing `role="status"` or `role="alert"` container already in the DOM, clear and repopulate using `requestAnimationFrame` to guarantee the mutation is observed:

```js
_showToast(message) {
  this._container.textContent = '';
  requestAnimationFrame(() => {
    this._container.textContent = message;
  });
}
```

### Cross-Cutting Notes

**Focus restoration pattern:** Store a reference to `document.activeElement` at the moment the shortcut is pressed. On dismiss, return focus to the stored element. If the stored element is no longer in the DOM, fall back to a sensible ancestor or `document.body`. On action completion, focus follows the action target — the stored reference is discarded.

**Keyboard shortcuts:** Toast does not require a shortcut. Platform (or notification center), and Banner do. Shortcut assignments must be determined during implementation and registered in the application's keyboard shortcut registry (not hardcoded) so they appear in the application's keyboard shortcut help UI. Avoid collisions with browser-native shortcuts and assistive technology shortcuts (JAWS, NVDA, VoiceOver all reserve key combinations).

**Timing:** Toast auto-dismiss duration should be at least 5 seconds, or dynamically calculated from message length. If a dynamic Banner is injected during an active polite aria-live announcement (e.g., a Toast was just read), the assertive Banner will interrupt; polite announcements will queue.

---

## Forced Colors Requirements

### Alert

```css
@media (forced-colors: active) {
  /* ========================================
     CONTAINER
     ======================================== */
  .alert {
    background-color: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }

  .alert-icon {
    fill: CanvasText;
    stroke: CanvasText;
  }

  .alert-title {
    color: CanvasText;
  }

  /* ========================================
     CLOSE BUTTON - BASE STATE
     ======================================== */
  .alert-close {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .alert-close svg,
  .alert-close [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     CLOSE BUTTON - HOVER STATE
     ======================================== */
  .alert-close:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .alert-close:hover svg,
  .alert-close:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     CLOSE BUTTON - FOCUS STATE
     ======================================== */
  .alert-close:focus,
  .alert-close:focus-visible {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     CLOSE BUTTON - ACTIVE STATE
     ======================================== */
  .alert-close:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }

  .alert-close:active svg,
  .alert-close:active [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }
}
```

### Toast

Toast notifications use `role="status"` (non-urgent) or `role="alert"` (urgent) on their container. The container follows the same Canvas/CanvasText treatment as Alert. Action links inside a toast use link system colors. Close buttons follow the standard button pattern in `button.md`.

```css
@media (forced-colors: active) {
  /* ========================================
     CONTAINER
     ======================================== */
  .toast {
    background-color: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }

  .toast-icon {
    fill: CanvasText;
    stroke: CanvasText;
  }

  /* ========================================
     ACTION LINK
     ======================================== */
  .toast-action {
    color: LinkText;
  }

  .toast-action:hover {
    text-decoration: underline;
  }

  .toast-action:focus,
  .toast-action:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .toast-action:active {
    color: ActiveText;
  }
}
```
