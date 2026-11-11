# Popover

**DaisyUI base:** None — `<aiux-sn-popover>` is a custom JS component, not DaisyUI `dropdown`
**Production components:** `<aiux-sn-popover>` (`@servicenow/aiux-sn-popover`) · `<aiux-control-popover>`
**Last updated:** 2026-07-02 · v4

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component

Production popovers use `<aiux-sn-popover>` — a dedicated component with `trigger` / `content` slots and a property API. It is **not** built from DaisyUI `dropdown` classes (those belong to the dropdown menu — `references/dropdown.md`); `<aiux-sn-popover>` owns its own positioning, panel chrome, focus, and dismissal.

Choose popover vs. a neighbouring pattern:

- **Popover vs. tooltip:** Tooltip is brief, non-interactive read-only text on hover/focus. Popover is longer, interactive content (links, buttons, form elements) triggered by an explicit click/Enter. (`references/tooltip.md`)
- **Popover vs. modal:** Popover supplements the current context without blocking it — the user can dismiss and return. Modal interrupts the workflow and requires engagement. (`references/modal.md`)
- **Popover vs. dropdown menu:** Dropdown menu is an action list of invokable items. Popover is a general-purpose contextual panel holding any combination of text, controls, and media. (`references/dropdown.md`)

### 2. Anatomy

`<aiux-sn-popover>` takes two slots and renders the panel itself:

| Region      | How                                                                             |
| ----------- | ------------------------------------------------------------------------------- |
| **Trigger** | `slot="trigger"` — the interactive element (button/link) that opens the panel.  |
| **Content** | `slot="content"` — arbitrary panel content.                                     |
| **Heading** | `heading="…"` property — renders an optional title row **with** a close button. |
| **Arrow**   | `arrow` property — shows a caret pointing from the panel toward the trigger.    |

The panel surface, shadow, radius, padding, header row, and close button are all owned by the component. Use `bare` to drop border/shadow/background, and `no-padding` to drop the content padding. Do not hand-build the panel from `dropdown` classes.

**Title and close are coupled.** Setting `heading` renders the title row _and_ a close button together; omitting it renders neither. The component cannot keep the heading while hiding the close, show a close without a heading, or apply a distinct header background. Do not hand-roll the header to work around this.

**Heading typography and the header divider are not adjustable.** `heading` is a string property, not a slot — there is no light-DOM element an agent can pass in to change its weight or size, unlike accordion's slot-based title. The header row's divider always renders whenever `heading` is set; there is no property to suppress it. Do not attempt to override either with wrapper classes.

**There is no footer region.** The component exposes only the default `content` slot — do not attempt to fake a footer by styling the last child of the content slot.

The arrow orients automatically to the resolved `placement` (§3) — there is no separate per-side arrow control.

### 3. Placement

Set the `placement` property. Twelve values — four sides × three alignments:

`top` · `top-left` · `top-right` · `bottom` (default) · `bottom-left` · `bottom-right` · `left` · `left-top` · `left-bottom` · `right` · `right-top` · `right-bottom`

The component auto-flips when viewport space is constrained, so pick the placement that suits the trigger's position (prefer `bottom` unless the trigger sits near the block-end edge). `offset` controls the gap between trigger and panel (default 8px). The exact positioning and flip logic are owned by the component.

### 4. Open and dismiss

The popover opens when the slotted trigger is clicked; toggle it programmatically with the `opened` property or the `show()` / `hide()` methods. Dismissal is automatic and on by default — outside-click (`close-on-outside-click`) and Escape (`close-on-escape`) — and focus returns to the trigger. The panel teleports to the document body and does **not** lock page scroll (unlike modal). Hover is not a popover trigger — for hover text use a tooltip.

### 5. Interaction modes and nesting

The `interaction-type` property sets focus/keyboard behaviour by content type:

| Value              | Use for                                                   |
| ------------------ | --------------------------------------------------------- |
| `dialog` (default) | Interactive dialog content — focus is trapped while open. |
| `none`             | Simple content — no focus trap.                           |
| `listbox`          | Selection lists — no focus trap.                          |
| `combo`            | Comboboxes — no focus trap.                               |

**No nesting:** do not open a popover from within another popover. If content needs a secondary layer, use a modal or restructure the information architecture.

### 6. Content rules

- Every popover should contain at least one focusable interactive element. If the content is purely static text, use a tooltip instead.
- The trigger must have a clear visual affordance (icon, underline, or button chrome) indicating it opens additional content.
- Size the panel with the `constrain` property (min/max width or height; `'target'` matches the trigger's size). Do not let content overflow or truncate.
- Do not use popover for critical information that must not be missed — use an alert or modal instead.

### 7. States

Open/closed and the trigger's active state are driven by the `opened` property and managed by the component. A disabled trigger cannot open the popover — disable the trigger element itself. Focus handling and panel visibility are component-managed.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Dialog — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Dropdown (DaisyUI's CSS-only `:focus-within` toggle is insufficient for popovers with interactive content; manage `aria-expanded` and panel visibility in JavaScript)
- **Forced colors:** Follows the **container** pattern — see `@accessibility`

### 9. RTL

Popover placement mirrors automatically in RTL layouts — the component swaps inline-start/end sides and content follows standard RTL text direction. No manual mirroring is needed.

### 10. Scope boundary

This sheet covers the popover **container**: which component to use, anatomy, placement choice, trigger behavior, content rules, and states. It does **not** cover:

- **Runtime mechanism** — positioning and flip logic, open/dismiss handling, focus trapping, teleport, and ARIA wiring are owned by `<aiux-sn-popover>`.
- **What content goes inside the popover** — governed by the consuming composition spec or feature context.
- **Dropdown menu behavior** (action list with menu items) — `references/dropdown.md`.
- **Tooltip behavior** (non-interactive hover text) — `references/tooltip.md`.
- **Modal overlay behavior** (focus-trapping, workflow-interrupting dialog) — `references/modal.md`.
- **How popovers compose into larger patterns** (contextual actions, filter panels, settings flyouts) — composition specs.

The referencing direction is one-way: composition specs reference this sheet for popover container rules; this sheet does not reference composition specs.
