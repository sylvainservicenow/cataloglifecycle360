# Modal

**DaisyUI base:** `modal`
**Production component:** `<aiux-modal>` (`@servicenow/aiux-components-core`)
**Last updated:** 2026-07-06 · v5

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component

Production modals use the **`<aiux-modal>`** component. It owns the runtime mechanics — native `<dialog>` top-layer stacking, open/close, backdrop, dismissal, focus management, and the size variants — so do not hand-roll dialog markup, z-index, widths, or DaisyUI position classes. Render `<aiux-modal>` and fill its slots.

- **Size:** choose the size that fits the content — compact for short confirmations, larger for forms or content-heavy dialogs. Sizes are provided by the component; pick by content, do not hardcode widths.
- **Placement:** centered by default; edge placements (e.g., a mobile bottom-sheet) are a component option, not a hand-applied position class.

### 2. Anatomy

A modal has three regions, filled via the component's slots:

```
┌─────────────────────────────────┐
│ header: title + close button    │  ← header slot
├─────────────────────────────────┤
│ body: scrollable content area   │  ← default (body) slot
├─────────────────────────────────┤
│ footer: action buttons          │  ← footer slot
└─────────────────────────────────┘
```

- **Title** — a concise heading describing the dialog's purpose (see Content rules). Per the Figma modal library the title is the **h5 scale: 20px / weight 400** (ServiceNow Sans, primary text — not bold). `<aiux-modal>` does not impose this; set it on the slotted heading — `<h5 slot="header">…</h5>` gives the h5 scale (20px / 400) automatically. (Any element styled to the h5 scale via `text-xl font-normal` works too.)
- **Close button** — always present; every modal has a visible dismiss affordance.
- **Body** — the message, form, or content.
- **Footer** — the action buttons. Their roles, ordering, and color are governed by the action-set composition spec, not this sheet.

**No divider lines:** the header, body, and footer are separated by spacing, not by border lines or an `<hr>` — Horizon does not draw dividers between modal regions. (On `<aiux-modal>` this means `no-dividers`.)

The component owns the box surface, width, backdrop, and scrolling — do not re-style them.

### 3. Behavior

- **Blocking.** A modal interrupts the flow — while it is open the background does not scroll and cannot be interacted with. Use a modal only when the user must engage before continuing; for transient feedback use a toast.
- **Dismissal.** Closes on backdrop click and on Escape (provided by the component). The cancelable-close flow for unsaved changes is defined by the dialog composition spec.
- **No modal triggers inside modals.** Do not place a control that opens another modal within a modal's content.

### 4. Content rules

- **Title text:** Sentence case. Describes the purpose or action concretely — not a generic label like "Confirm" or "Warning". Type-specific title conventions (confirmation phrasing, wizard step titles) are defined in the dialog composition spec.
- **Title truncation:** If the title exceeds container width, it truncates with ellipsis. A tooltip reveals the full text on hover. Do not manually shorten titles — the component handles truncation. Reference `@patterns/references/truncation-tooltip.md` for the tooltip behavior.
- **Body content:** Appropriate to the dialog type (message text, form controls, list content). Content rules specific to each dialog type (confirmation body phrasing, form validation, wizard step indicators) are defined in the dialog composition spec.

### 5. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Dialog (Modal) — see `@accessibility` for the full keyboard / focus-trap / role-vs-alertdialog specification
- **DaisyUI corrections:** See `@accessibility` › Modal (native `<dialog>` with `showModal()`; `aria-haspopup="dialog"` on trigger)
- **Forced colors:** Follows the **container** pattern; the close button follows the **interactive** pattern — see `@accessibility`

**Horizon-specific design notes:**

- `aria-labelledby` on the dialog **must** point to the title element's `id` — never omit. `aria-describedby` pointing at the body is optional but recommended for simple dialogs.
- **Background inert:** Apply the `inert` attribute to the main content region when the modal is open. `aria-modal="true"` hides background content from the accessibility tree, but `inert` additionally prevents focus and pointer events.
- **Per-dialog-type focus management** (which element receives focus on open) is owned by `@compositions/dialog-spec.md`.

### 6. RTL

Modal content, title alignment, and close button position mirror in RTL. The close button moves to the left side of the header. Footer button order reverses (primary moves to the left). Body content follows standard RTL text direction.

### 7. Scope boundary

This sheet covers the modal **container**: available classes and positioning, anatomy, behavior rules, content rules for the container elements, and accessibility of the container itself.

It does **not** cover:

- **Dialog type classification** (confirmation, form, wizard, etc.) — `@compositions/dialog-spec.md`
- **Focus management details** (which element receives focus per dialog type) — `@compositions/dialog-spec.md`
- **Footer button roles, ordering, and color mapping** — `@compositions/action-set-spec.md`
- **Individual button styling** — `references/button.md`
- **When to use modal vs. other overlays** — `@compositions/dialog-spec.md`
- **Cancelable close flow for unsaved changes** — `@compositions/dialog-spec.md`
- **Runtime mechanics** (dialog stacking, open/close, focus, backdrop, size implementation, widths) — the `<aiux-modal>` component

The referencing direction is one-way: the dialog composition spec references this sheet for container rules; this sheet does not reference composition specs.
