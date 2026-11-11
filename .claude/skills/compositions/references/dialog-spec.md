# Dialog — Design Spec

## 1. Overview

A dialog is a modal overlay that interrupts the user's flow to present content, collect input, or require a decision. It answers: "What needs my attention before I continue?"

This spec governs dialog type classification, variant-specific behavior, focus management, cancelable close, framework selection, and content rules. It delegates to other specs for (see @components/SKILL.md for more info):

- **Modal container** (position variants, anatomy, spacing, typography, backdrop, shadow, border radius)
- **Header anatomy** (title, close button, spacing)
- **Footer button roles and ordering** — see `references/action-set-spec.md`
- **Individual button styling**

**Build with `<aiux-modal>` by default.** It owns the runtime mechanics — top-layer stacking, backdrop, dismissal, and focus management — so it's the correct choice whenever the component is available. **Hand-roll** native `<dialog>` + `showModal()` + DaisyUI `aiux-modal`/`aiux-modal-box` classes **only** when the real component isn't available (e.g., a sandboxed or standalone generation context with no access to `@servicenow/aiux-components-core`) — and in that case you own focus trapping, backdrop, and dismissal yourself, per §5–§7 below. The rest of this spec documents that hand-rolled fallback path in full, since it's the harder case to get right.

## 2. Dialog Types

Classify by the dialog's purpose — what the user is being asked to do.

| Type                | DaisyUI Class    | Limit        | When to Use                                                                                      |
| ------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| **Confirmation**    | `aiux-modal-box` | 0–n per page | Consequential action requiring user confirmation. Short message body, 2 buttons, no form inputs. |
| **Form**            | `aiux-modal-box` | 0–n per page | Collects structured input (text, selection, checkboxes) before an action.                        |
| **Informational**   | `aiux-modal-box` | 0–n per page | Read-only content for acknowledgment. Single dismiss/acknowledge action.                         |
| **Wizard**          | `aiux-modal-box` | 0–1 per page | Multi-step sequential flow. Back/Next navigation, state carries across steps.                    |
| **Preview/Review**  | `aiux-modal-box` | 0–n per page | Computed data display before committing. Loading state, then review, then confirm/cancel.        |
| **Selector/Picker** | `aiux-modal-box` | 0–n per page | Searchable/filterable list for selection. `role="listbox"` on item list.                         |

**Binary decision confirmations** (e.g., Allow/Deny, Approve/Reject — the user chooses between two opposing outcomes rather than a single proceed/cancel) are still **Confirmation** type. What changes is the footer's button-role composition: use the **Binary Decision** pattern (Completion + Rejection) from `references/action-set-spec.md` §3, not the default Workflow Progression pattern. It is not a distinct dialog type and does not change framework selection (§5) — it still requires the native `<dialog>` + `aiux-modal-box` shell (or `<aiux-modal>` when available).

## 3. Classification Hints

### Dialog vs. Other Overlays

| Signal                                             | Classification                                         |
| -------------------------------------------------- | ------------------------------------------------------ |
| Overlay blocks interaction with the page behind it | **Dialog** (this spec)                                 |
| Overlay coexists with page content, no backdrop    | **Panel**, **Popover**, or **Tooltip** (not this spec) |

### Disambiguation for ambiguous cases

- **"Search + select overlay (widget-selector)"**: Contains a selectable list. Classify as **Selector/Picker**. The search input is secondary to the selection action.
- **"Form with search (impersonate-user)"**: Primary interaction is search input. Classify as **Form** (hybrid with Selector). Classify by the primary interaction.

## 4. Variant Anatomy

All types share the three-section anatomy from `@components/SKILL.md` (header, body, footer). Header anatomy follows `references/header-spec.md` (Planned). Footer button roles and ordering follow `references/action-set-spec.md`. Body content varies by type.

```
┌─────────────────────────────────┐
│ header (→ header-spec.md)       │
├─────────────────────────────────┤
│ body                            │
│   [varies by dialog type]       │
├─────────────────────────────────┤
│ footer (→ action-set-spec.md)   │
└─────────────────────────────────┘
```

```html
<dialog class="aiux-modal" aria-labelledby="dialog-title">
  <div class="aiux-modal-box">
    <!-- header: governed by header-spec.md -->
    <h2 id="dialog-title">Delete automation rules</h2>
    <!-- body: dialog-specific content per type -->
    <p>This will permanently delete 3 rules.</p>
    <!-- footer: governed by action-set-spec.md -->
    <div class="flex justify-end gap-2">
      <button class="aiux-btn aiux-btn-secondary">Cancel</button>
      <button class="aiux-btn aiux-btn-error">Delete</button>
    </div>
  </div>
</dialog>
```

### Confirmation

Short text body stating consequence, 2 buttons (cancel + action). Title names the action ("Delete automation rules"), not a question. Body describes what will happen, not "Are you sure?" No form controls.

**Binary decision variant:** When the confirmation asks the user to choose between two opposing outcomes (not just proceed/cancel), the title may be phrased as a question. The footer follows action-set-spec's Binary Decision pattern: Completion (`aiux-btn-primary`) + Rejection (`aiux-btn-secondary` — never `aiux-btn-neutral`, never `aiux-btn-error`) + optional Dismissive (`aiux-btn-secondary` — never `aiux-btn-ghost`). This still uses the native `<dialog>` + `aiux-modal-box` shell below — do not hand-roll a `<div role="dialog">` overlay pattern for binary-decision confirmations; that is exactly as prohibited as it is for any other dialog type.

```html
<dialog class="aiux-modal" aria-labelledby="perm-title">
  <div class="aiux-modal-box">
    <h2 id="perm-title">Allow Data Collection?</h2>
    <p>We'd like to collect anonymous usage data to improve your experience.</p>
    <div class="flex justify-end gap-2">
      <button class="aiux-btn aiux-btn-secondary">Ask Me Later</button>
      <button class="aiux-btn aiux-btn-secondary">Deny</button>
      <button class="aiux-btn aiux-btn-primary">Allow</button>
    </div>
  </div>
</dialog>
```

### Form

Contains form controls. Focus moves to first interactive control on open (see Focus Management).

### Informational

Read-only content. Single action button for dismiss or acknowledgment. Consent labels match the legal action ("I Agree", "Accept Terms"). Body scrolls independently; header and footer remain fixed.

### Wizard

Back/Next navigation. Back hidden on step 1. Step indicator: "Step 1 of 3" with `aria-current="step"`. Title static across steps. Closing discards all progress.

### Preview/Review

Async loading, then review, then confirm/cancel. Confirm disabled during loading. Loading: skeleton or spinner in body. Error: replaces body, footer shows only Cancel. Loading / empty / error renders follow `@patterns/SKILL.md`.

### Selector/Picker

Item list with `role="listbox"` / `role="option"`, `aria-selected`. Optional search with `aria-label`. Confirm label includes count ("Add 3 widgets"), disabled when nothing selected. Arrow keys navigate items; Enter selects.

## 5. Framework Selection

Use native `<dialog>` with `showModal()` and DaisyUI `aiux-modal` classes for all new modal dialogs built without the `<aiux-modal>` component (§1). This provides top-layer stacking, built-in backdrop via `::backdrop`, and a foundation for focus trapping. Do not build custom modal infrastructure with `z-index` layering or hand-built backdrops. This requirement applies to every dialog type without exception — including binary-decision confirmations, which commonly get hand-rolled as a generic `<div role="dialog" aria-modal="true">` overlay pattern from general web conventions. That fallback is prohibited here.

The footer's button-group container uses `flex justify-end gap-2` — required on every dialog footer, not merely illustrative in the example above. DaisyUI v5 dropped the `modal-action` helper class (see the `daisyui-aiux-prefix-migration` skill's v4→v5 table); the footer's buttons are raw children of `aiux-modal-box` and get their layout from these standard utility classes instead.

**Header close button:** The close (×) affordance in the header uses `aiux-btn-ghost aiux-btn-circle aiux-btn-sm` with an `aria-label` (e.g., "Close dialog") — see `modal.js`. This is a distinct, non-footer affordance and is exempt from `references/action-set-spec.md`'s ban on `aiux-btn-ghost` for action-set button roles; that ban applies only to the footer's action-set buttons (primary/completion/rejection/dismissive/secondary/destructive), not this icon-only header control.

## 6. Focus Management

**On open:** Store currently focused element. Move focus into dialog: Form type goes to first form control; all others go to close button or first focusable element. Activate focus trap (Tab/Shift+Tab cycle within dialog).

**On close:** Deactivate focus trap. Restore focus to previously focused element.

## 7. Cancelable Close

When a dialog has unsaved changes, closing (Escape, backdrop click, close button) fires a cancelable event. Consumer calls `event.preventDefault()` if changes exist, shows a nested confirmation, then closes programmatically if confirmed.

Escape closes the dialog (dismissive). For form dialogs with unsaved changes, Escape triggers the cancelable close flow instead.

## 8. Content Rules

- **Title text:** General title conventions (sentence case, concrete action, no generic labels) — see `@components/SKILL.md` §4. For confirmation dialogs, title names the action as a statement, not a question.
- **Confirmation body:** States the consequence. "This will permanently delete 3 rules. This action cannot be undone.", not "Are you sure you want to delete?"
- **Consent label:** Must match the legal action ("I Agree", "Accept Terms"), not a generic "OK" or "Close".
- **Wizard step indicator:** Shows current position ("Step 1 of 3"). Title remains static across steps.
- **Selector confirm label:** Reflects action with count ("Add 3 widgets"), not generic "OK".
- **Footer button labels:** Follow `references/action-set-spec.md` content rules and `@components/button.md` content rules.
- **Grouped body content:** When body content is broken into multiple visually distinct sections (e.g., a list of labeled info groups), each section uses `aiux-card`/`aiux-card-body` shell classes, not a bare `<div class="bg-surface-secondary rounded-lg p-4">`. A plain utility-styled div duplicates styling the card component already provides.

## 9. Accessibility

For modal container ARIA (role, `aria-modal`, `aria-labelledby`, `aria-haspopup`, `aria-describedby`), see `@components/SKILL.md` § Accessibility, which delegates to `@accessibility` and the APG Dialog pattern. This section covers only dialog-type-specific decisions.

- **APG pattern:** Dialog (modal) — see `@accessibility`
- **Per-type focus management on open:**
  - **Form:** first interactive form control
  - **Confirmation, Informational, Wizard, Preview/Review:** close button or first focusable element
  - **Selector/Picker:** the searchable list (Arrow keys then navigate items)
- **Focus restore on close:** Previously focused element. Required.
- **Focus trap** is required for all dialog types — Tab/Shift+Tab cycle within the dialog. Native `<dialog>` with `showModal()` provides partial inertness; a focus-trap implementation is still required.

## 10. Scope Boundary

This spec covers dialog type classification, variant-specific behavior (body content per type), focus management, cancelable close, framework selection, and content rules.

It does **not** cover:

- **Modal container styling** — see `@components/SKILL.md`
- **Header anatomy** — see `references/header-spec.md` (Planned)
- **Footer button roles, ordering, and color mapping** — see `references/action-set-spec.md`
- **Individual button styling** — see `@components/SKILL.md`
- **Side panels, popovers, tooltips, non-modal overlays** — not dialogs

Referencing direction: dialog spec references `@components/SKILL.md`, `@components/SKILL.md`, `references/action-set-spec.md`, and `references/header-spec.md` (Planned).

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above. Used by `references/SKILL.md` during validation.

### Structural checks

| #    | Check                                   | Spec section            | Description                                                                                                                                                                                     |
| ---- | --------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Type identified                         | §2 Dialog Types         | One of: Confirmation, Form, Informational, Wizard, Preview/Review, Selector/Picker                                                                                                              |
| S-02 | Not a panel/popover                     | §3 Classification Hints | Overlay blocks interaction (backdrop present). Coexisting overlay → stop                                                                                                                        |
| S-03 | Single type per dialog                  | §2 Dialog Types         | No mixed types (e.g., Wizard + Selector) without classification as a hybrid with a declared primary type                                                                                        |
| S-04 | Uses native `<dialog>` + `showModal()`  | §5 Framework Selection  | All new modal dialogs use native `<dialog>` with `showModal()` and DaisyUI `aiux-modal` classes. Custom inline overlay without focus trap → flag                                                |
| S-05 | No custom modal infrastructure          | §5 Framework Selection  | No hand-built backdrop/z-index layering. Use native `<dialog>` with `showModal()` for top-layer stacking                                                                                        |
| S-06 | Three-section anatomy present           | §4 Variant Anatomy      | Header, body, footer slots are present. Delegates to `references/header-spec.md` (Planned) and `references/action-set-spec.md`                                                                  |
| S-07 | DaisyUI modal classes used              | §5 Framework Selection  | Uses `aiux-modal`, `aiux-modal-box` DaisyUI classes on native `<dialog>`, with the footer as a `flex justify-end gap-2` container (DaisyUI v5 dropped `modal-action`). No custom overlay markup |
| S-08 | Close button exempt from action-set ban | §5 Framework Selection  | Header close (×) button uses `aiux-btn-ghost aiux-btn-circle aiux-btn-sm`. Not a violation of action-set-spec's btn-ghost ban — that ban is footer-action-set-only                              |

### Focus management checks

| #    | Check                           | Spec section        | Description                                                                                      |
| ---- | ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| F-01 | Focus stored on open            | §6 Focus Management | Previously focused element stored before moving focus into dialog                                |
| F-02 | Focus moves into dialog on open | §6 Focus Management | Form type: focus goes to first form control. All others: close button or first focusable element |
| F-03 | Focus trap active               | §6 Focus Management | Tab/Shift+Tab cycles within dialog only. Background page is unreachable                          |
| F-04 | Focus trap implemented          | §6 Focus Management | A focus trap mechanism is active — Tab/Shift+Tab cycle within the dialog boundary                |
| F-05 | Focus restores on close         | §6 Focus Management | Focus returns to stored element when dialog closes                                               |
| F-06 | Focus trap deactivated on close | §6 Focus Management | Trap is deactivated before restoring focus                                                       |

### Cancelable close checks

| #     | Check                             | Spec section        | Description                                                                                                |
| ----- | --------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| CC-01 | Escape closes dialog              | §7 Cancelable Close | Escape key dismisses. For form dialogs with unsaved changes, Escape triggers cancelable close flow         |
| CC-02 | Backdrop click closes dialog      | §7 Cancelable Close | Click outside `aiux-modal-box` fires dismissal. For unsaved forms, fires cancelable close flow             |
| CC-03 | Cancelable event on unsaved close | §7 Cancelable Close | When unsaved changes exist, close action fires a cancelable event. Consumer calls `event.preventDefault()` |
| CC-04 | Nested confirmation shown         | §7 Cancelable Close | If consumer calls `preventDefault()`, a nested confirmation dialog is shown before close                   |
| CC-05 | Programmatic close after confirm  | §7 Cancelable Close | Dialog closes programmatically only after nested confirmation is confirmed                                 |

### Variant-specific checks

| #    | Check                                            | Spec section                         | Description                                                                                                                                |
| ---- | ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| V-01 | Confirmation: no form controls                   | §4 Variant Anatomy (Confirmation)    | Short text body, 2 buttons only. No `<input>`, `<select>`, `<textarea>`                                                                    |
| V-02 | Confirmation: title is statement                 | §8 Content Rules                     | Title names the action ("Delete automation rules"), not a question ("Are you sure?")                                                       |
| V-03 | Form: focus to first control                     | §4 Variant Anatomy (Form)            | Focus goes to first interactive form control on open, not close button                                                                     |
| V-04 | Binary decision: correct role-to-variant mapping | §4 Variant Anatomy (Confirmation)    | Rejection uses `aiux-btn-secondary` (not `aiux-btn-neutral`/`aiux-btn-error`); Dismissive uses `aiux-btn-secondary` (not `aiux-btn-ghost`) |
| V-08 | Wizard: Back hidden on step 1                    | §4 Variant Anatomy (Wizard)          | Back button absent or hidden on the first step                                                                                             |
| V-09 | Wizard: step indicator present                   | §4 Variant Anatomy (Wizard)          | Step indicator shows "Step N of M" with `aria-current="step"`                                                                              |
| V-10 | Wizard: title static                             | §4 Variant Anatomy (Wizard)          | Title does not change between steps                                                                                                        |
| V-11 | Wizard: close discards all                       | §4 Variant Anatomy (Wizard)          | Closing the wizard discards all in-progress data                                                                                           |
| V-12 | Preview/Review: confirm disabled during load     | §4 Variant Anatomy (Preview/Review)  | Confirm button disabled while async data loads                                                                                             |
| V-13 | Preview/Review: error replaces body              | §4 Variant Anatomy (Preview/Review)  | On error, body content replaced with error state; only Cancel shown in footer                                                              |
| V-14 | Selector: `role="listbox"` on item list          | §4 Variant Anatomy (Selector/Picker) | Item list has `role="listbox"`. Items have `role="option"` and `aria-selected`                                                             |
| V-15 | Selector: confirm label includes count           | §4 Variant Anatomy (Selector/Picker) | "Add 3 widgets", not "OK". Disabled when nothing selected                                                                                  |
| V-16 | Selector: arrow keys navigate items              | §4 Variant Anatomy (Selector/Picker) | Arrow keys move selection within item list. Enter selects                                                                                  |

### Accessibility checks

| #    | Check                       | Spec section                         | Description                                                                 |
| ---- | --------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| A-01 | `aria-labelledby` present   | §9 Accessibility                     | Points to dialog title `id`. Required.                                      |
| A-02 | `aria-describedby` present  | §9 Accessibility                     | Points to body content id. Recommended.                                     |
| A-03 | `aria-modal="true"`         | §9 Accessibility                     | Present (implicit when using `showModal()` on native `<dialog>`)            |
| A-04 | `role="dialog"`             | §9 Accessibility                     | Implicit on native `<dialog>`. Explicit if using a non-`<dialog>` element   |
| A-05 | Selector search labelled    | §4 Variant Anatomy (Selector/Picker) | Search input has `aria-label` describing its purpose                        |
| A-06 | Informational consent label | §8 Content Rules                     | Consent button label matches the legal action ("I Agree"), not generic "OK" |

### Content checks

| #    | Check                                  | Spec section       | Description                                                                                           |
| ---- | -------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| T-01 | Title describes purpose                | §8 Content Rules   | "Delete automation rules" not "Confirm" or "Warning"                                                  |
| T-02 | Confirmation body states consequence   | §8 Content Rules   | "This will permanently delete 3 rules. This action cannot be undone." Not "Are you sure?"             |
| T-03 | No "Are you sure?" body copy           | §8 Content Rules   | Consequence stated directly. "Are you sure?" phrasing is prohibited                                   |
| T-04 | Wizard step indicator format           | §8 Content Rules   | "Step N of M" format. `aria-current="step"` on current step indicator                                 |
| T-05 | Selector confirm label reflects count  | §8 Content Rules   | "Add 3 widgets" when 3 selected. "Add widgets" or "OK" is prohibited                                  |
| T-06 | Footer button labels follow action-set | §10 Scope Boundary | Delegate button label content rules to `references/action-set-spec.md`                                |
| T-07 | Grouped body sections use card shell   | §8 Content Rules   | Multiple labeled info sections in the body use `aiux-card`/`aiux-card-body`, not bare styled `<div>`s |

---

## Resolution Guidance

### S-04, S-05: Wrong framework

```diff
- <!-- Custom inline dialog infrastructure -->
- <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
-   <div class="bg-base-100 rounded-2xl shadow-xl p-6">
+ <dialog class="aiux-modal" aria-labelledby="dialog-title">
+   <div class="aiux-modal-box">
      <!-- content -->
+   </div>
+   <form method="dialog" class="aiux-modal-backdrop"><button>close</button></form>
+ </dialog>
```

### F-03, F-04: Missing focus trap

The dialog must trap focus so Tab/Shift+Tab cycles within the dialog boundary. Native `<dialog>` with `showModal()` provides partial inertness, but a focus trap implementation is still required to prevent focus from escaping to browser chrome. Store the previously focused element on open and restore it on close.

### V-03: Form dialog — focus not going to first control

```javascript
firstUpdated() {
  const firstControl = this.shadowRoot.querySelector('input, select, textarea, button');
  firstControl?.focus();
}
```

### CC-03, CC-04: Missing cancelable close for unsaved form

```javascript
_handleClose(e) {
  if (this._hasUnsavedChanges()) {
    e.preventDefault();
    this._showUnsavedConfirmation = true;
  }
}

_onUnsavedConfirm() {
  this._showUnsavedConfirmation = false;
  this._forceClose();
}
```

### A-01: Missing ARIA labelledby

```diff
- <dialog class="aiux-modal">
-   <div class="aiux-modal-box">
-     <h2>Delete automation rules</h2>
+ <dialog class="aiux-modal" aria-labelledby="dialog-title">
+   <div class="aiux-modal-box">
+     <h2 id="dialog-title">Delete automation rules</h2>
```

### T-03: Confirmation body uses "Are you sure?" phrasing

```diff
- <p>Are you sure you want to delete this rule?</p>
+ <p>This will permanently delete the rule. This action cannot be undone.</p>
```

### V-04: Binary decision — wrong variant on Rejection or Dismissive

```diff
- <button class="aiux-btn aiux-btn-neutral">Deny</button>
+ <button class="aiux-btn aiux-btn-secondary">Deny</button>

- <button class="aiux-btn aiux-btn-ghost">Ask Me Later</button>
+ <button class="aiux-btn aiux-btn-secondary">Ask Me Later</button>
```

### T-07: Grouped body sections — bare div instead of card shell

```diff
- <div class="bg-surface-secondary rounded-lg p-4">
-   <h3 class="text-sm font-semibold text-text-primary mb-1">Usage Analytics</h3>
-   <p class="text-sm text-text-secondary">We now collect anonymized usage data...</p>
- </div>
+ <div class="aiux-card bg-surface-secondary">
+   <div class="aiux-card-body">
+     <h3 class="text-sm font-semibold text-text-primary">Usage Analytics</h3>
+     <p class="text-sm text-text-secondary">We now collect anonymized usage data...</p>
+   </div>
+ </div>
```

### V-08: Wizard — Back visible on step 1

```javascript
render() {
  return html`
    ${this._currentStep > 1 ? html`
      <button class="aiux-btn aiux-btn-secondary" @click=${this._goBack}>Back</button>
    ` : nothing}
  `;
}
```

### V-15: Selector — confirm button not disabled when nothing selected

```javascript
// Confirm button
html`<button
  class="aiux-btn aiux-btn-primary"
  ?disabled=${this._selectedItems.length === 0}
  @click=${this._handleConfirm}
>
  ${this._selectedItems.length > 0
    ? `Add ${this._selectedItems.length} widget${this._selectedItems.length === 1 ? '' : 's'}`
    : 'Add widgets'}
</button>`;
```

### V-12: Preview/Review — confirm not disabled during load

```javascript
html`<button
  class="aiux-btn aiux-btn-primary"
  ?disabled=${this._loading}
  @click=${this._handleConfirm}
>
  Confirm
</button>`;
```
