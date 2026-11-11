# Tooltip

**DaisyUI base:** `tooltip` (prefixed `aiux-tooltip`) — stories/docs only; not for production
**Production mechanism:** `tooltip()` directive (`@servicenow/aiux-directive-tooltip`) for declarative use, `TooltipController` (`@servicenow/aiux-controller-tooltip`) for programmatic. Per `daisyui.md` → `prefer_tooltip_directive`, do **not** use the DaisyUI `aiux-tooltip` / `data-tip` classes in production components.
**Last updated:** 2026-06-29 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component distinction

**Tooltip vs. popover:** Tooltip is for brief, non-interactive, read-only text triggered by hover or focus. Popover (`references/popover.md`) is for longer, interactive content (links, buttons, form elements) triggered by an explicit user action.

**Tooltip vs. modal:** Tooltip supplements an element with clarifying information. Modal interrupts the workflow and demands user engagement. Never use a tooltip for critical information the user must act on.

**When not to use:**

- Do not use tooltip for information essential to completing a task — surface it inline instead.
- Do not use tooltip on touch devices — tooltips rely on hover, which is unavailable. If the information is needed on mobile, show it inline.
- Do not use tooltip to label form fields — use a visible `<label>` element instead.

### 2. How to build

Attach the `tooltip()` directive to the trigger element — it creates a single shared `<div role="tooltip">` per root, positions it, and wires `aria-describedby` automatically. You do not assemble any markup.

```js
import {tooltip} from '@servicenow/aiux-directive-tooltip';

html`<button class="aiux-btn" ${tooltip({content: 'Save record'})}>
  Save
</button>`;
```

Options: `content` (text), `positions` (candidate sides — see §3), `offset` (gap px, default 8), `showDelay` / `hideDelay` (ms — see §5). For programmatic control (open/close from code), use `TooltipController` from `@servicenow/aiux-controller-tooltip`.

Under the hood the directive builds the DaisyUI tooltip markup for you — a shared `<div class="aiux-tooltip" role="tooltip" popover="manual">` with an `aiux-tooltip-content` child — and toggles the placement class. All visual styling is **owned by those classes and design tokens** (surface color, padding, font size, border radius, and the **tail/arrow** drawn by `.aiux-tooltip::after`). You do not set any of it, and you must **not** hand-build this markup yourself — that DaisyUI-class path is production-banned outside stories (`prefer_tooltip_directive`).

**Known styling gap:** the corner radius renders at 12px instead of Figma's 8px — the 8px override is on `.aiux-tooltip::before` but the directive's visible box is `.aiux-tooltip-content` (which keeps the 12px `--radius-field` default). Nothing for a consuming agent to do — it is fixed in the theme CSS.

### 3. Placement

The directive auto-selects the best side via a fit engine that respects viewport edges, toggling the `aiux-tooltip-{top,bottom,left,right}` class accordingly (the tail follows the chosen side) — **omit positioning in most cases**. When a specific side is required (matching Figma's top / bottom / left / right placement), pass `positions` with candidate sides in preference order, e.g. `tooltip({content, positions: ['top-center', 'bottom-center']})`. The fit engine falls back through the candidates when the first does not fit.

### 4. Color

Figma defines a default plus six semantic colors (`primary`, `accent`, `info`, `success`, `warning`, `error`), and the `aiux-tooltip-{color}` classes exist for them. But the directive reuses one shared tooltip element and **exposes no color option** — it never toggles a color class, so only the default neutral surface can be produced through the production path.

Use the default. Do not hand-build a colored DaisyUI tooltip (`aiux-tooltip-error` etc.) to work around this — that path is production-banned. When color is genuinely needed (reinforcing a status already shown visually), it must come from the directive, not a hand-built class.

### 5. Behavior rules

- **Appearance delay:** Set `showDelay` so the tooltip does not appear on accidental hover — production uses ~300ms (the directive default is `0`). Optionally set `hideDelay`.
- **Hover trigger:** Tooltip appears on pointer hover over the trigger element and disappears when the pointer leaves.
- **Focus trigger:** Tooltip appears on keyboard focus of the trigger element and disappears on blur.
- **No click trigger:** Tooltip does not appear on click. If click-triggered content is needed, use a popover.
- **Viewport awareness:** Tooltips should reposition to avoid being clipped at viewport edges. Choose the placement class based on the trigger's position in the layout.
- **Truncation trigger:** When a text element is truncated (showing ellipsis), a tooltip with the full text should appear on hover. Reference `@patterns/references/truncation-tooltip.md` for the truncation-tooltip interaction pattern.
- **No stacking:** Do not apply multiple tooltips to the same element.

### 6. Content rules

- Keep tooltip text under 50 characters. For longer content, use a popover.
- For icon-only buttons, use a verb phrase: "Save record", "Open menu", "Delete item".
- Do not repeat visible label text verbatim — add information that is not already visible.
- Sentence case, no period at the end.
- Tooltips are text-only — no links, buttons, images, or other interactive content. If interactive content is needed, use a popover.

### 7. States

The directive manages visibility: **hidden** by default; **visible** on hover or keyboard focus of the trigger (after `showDelay`). There is no separate styled-state work for a consuming agent — programmatic show/hide is done through `TooltipController`, not a CSS class.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Tooltip — see `@accessibility` (`role="tooltip"`; `aria-describedby` on the trigger; keyboard: Tab to show via `:focus`, Escape to dismiss while trigger retains focus)
- **DaisyUI corrections:** See `@accessibility` › Tooltip (use the Popover-API variant, not CSS-only `data-tip`)
- **Forced colors:** Follows the **container** pattern — see `@accessibility`

**Horizon-specific design notes:**

- **Tooltip content must not be interactive** — screen reader users cannot navigate into a tooltip. If interactive content is required, use a popover with `role="dialog"`.
- **Icon-only triggers** still require their own `aria-label` and must be keyboard focusable (tabindex="0" may be added). The tooltip provides supplementary visual context, not the primary name. `aria-describedby` may optionally point to the tooltip to supplement the label.
- **Truncated text:** When the "Enable keyboard focus on text that displays a tooltip" accessibility preference is active, truncated text becomes focusable and the tooltip is triggered on focus.

### 9. Scope boundary

This sheet covers the tooltip **container**: placement, anatomy, trigger behavior, content rules, states, and accessibility of the tooltip itself.

It does **not** cover:

- **Truncation-tooltip interaction pattern** (when and how truncation triggers a tooltip) — `@patterns/references/truncation-tooltip.md`.
- **Popover behavior** (interactive content, click-triggered) — `references/popover.md`.
- **Icon-only button rules** (when to require tooltip, touch targets) — `references/button.md`.
- **How tooltips compose into larger patterns** (form field hints, toolbar action labels) — composition specs.

The referencing direction is one-way: composition specs reference this sheet for tooltip container rules; this sheet does not reference composition specs.
