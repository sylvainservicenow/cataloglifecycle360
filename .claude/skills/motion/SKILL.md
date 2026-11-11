---
name: motion
description: >
  Apply or audit the Horizon Design Knowledge motion design system for CSS transitions and animations.
  Use this skill whenever someone is implementing or reviewing animated UI — including
  fade, slide, scale, expand/collapse, swap, stagger, page navigation, drag-and-drop, and
  icon rotation patterns. Also use it for catching motion violations: transition-all
  (banned), hardcoded ms values like duration-[250ms] instead of tokens, named easing
  curves on opacity or color (must always be linear), missing motion-reduce: variants,
  and asymmetric enter/exit timing. If a task involves Tailwind transition classes,
  animation tokens (--duration-*, --ease-*, --delay-*), or prefers-reduced-motion
  support in any component, use this skill — don't handle it without consulting it first.
metadata:
  author: servicenow
  version: '1.0.0'
compatibility: >
  Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI,
  and other Agent Skills-compatible tools
license: MIT
---

# Motion

## Goals

- Apply the Horizon Design Knowledge motion token system (duration, easing, delay, offset, scale, stagger) consistently across all animated components.
- Use DaisyUI + Tailwind CSS utility classes with CSS custom property arbitrary values.
- Ensure all motion has a correct `motion-reduce:` counterpart.

## Token Reference

### Duration — CSS `--duration-{size}` / Tailwind `duration-[var(--duration-{size})]`

| Token            | Value | Use Case / Intent                                               |
| ---------------- | ----- | --------------------------------------------------------------- |
| `--duration-xs`  | 150ms | Exits, fades, reduced-motion fallbacks                          |
| `--duration-sm`  | 200ms | Hover states, secondary properties (shadow, border), icon swaps |
| `--duration-md`  | 250ms | Standard exits — slide out, collapse close, dismiss             |
| `--duration-lg`  | 300ms | Standard enters — slide in, expand open, appear                 |
| `--duration-xl`  | 350ms | Weighted/bounce animations, compound transforms                 |
| `--duration-2xl` | 450ms | Large spatial motion — drawers, panels, sidebars                |
| `--duration-3xl` | 500ms | Page-level transitions, route changes                           |

CSS duration properties can still be used for refinement in 50ms increments. Always reference tokens inside Tailwind arbitrary values: `duration-[var(--duration-lg)]`.

### Easing — CSS `--ease-{name}`

| Token                 | Value                                  | Use                                                     |
| --------------------- | -------------------------------------- | ------------------------------------------------------- |
| `--ease-enter`        | `cubic-bezier(0.21, 0.64, 0.52, 1.00)` | Elements entering the screen                            |
| `--ease-exit`         | `cubic-bezier(0.71, 0.01, 1.00, 1.00)` | Elements leaving the screen                             |
| `--ease-low-accel`    | `cubic-bezier(0.52, 0.01, 0.30, 0.99)` | Gentle motion; essential-motion reduced-motion fallback |
| `--ease-medium-accel` | `cubic-bezier(0.30, 0.00, 0.29, 1.00)` | Appear/dismiss, icon rotation, expand/collapse          |
| `--ease-high-accel`   | `cubic-bezier(0.30, 0.00, 0.08, 1.00)` | Snappy page navigation                                  |
| `--ease-light-bounce` | `cubic-bezier(0.3, 1.41, 0.4, 0.99)`   | Subtle spring feel                                      |
| `--ease-heavy-bounce` | `cubic-bezier(0.25, 2.25, 0.45, 1.00)` | Pronounced spring/bounce                                |
| `--ease-linear`       | `linear`                               | **Opacity and color transitions only**                  |

### Delay — CSS `--delay-{n}` / Tailwind `delay-[var(--delay-{n})]`

| Token         | Value | Use Case                                                         |
| ------------- | ----- | ---------------------------------------------------------------- |
| `--delay-0`   | 0ms   | No delay — simultaneous start                                    |
| `--delay-50`  | 50ms  | Subtle cascade — tight stagger between adjacent items            |
| `--delay-100` | 100ms | Standard stagger — default gap between list or card items        |
| `--delay-150` | 150ms | Medium cascade — three-or-more-item sequences                    |
| `--delay-200` | 200ms | Noticeable sequence — deliberate step-by-step reveals            |
| `--delay-250` | 250ms | Deliberate pause — breathing room before a secondary element     |
| `--delay-300` | 300ms | Extended sequence — content appearing after a container finishes |
| `--delay-350` | 350ms | Long cascade — large grids or complex multi-panel layouts        |
| `--delay-400` | 400ms | Dramatic reveal — hero sections, onboarding highlights           |
| `--delay-450` | 450ms | Complex choreography — deeply nested or multi-stage sequences    |
| `--delay-500` | 500ms | Maximum delay — use sparingly; anything longer feels broken      |

For stagger patterns prefer the semantic shorthand tokens `--stagger-tight` (50ms) and `--stagger-loose` (100ms) over referencing `--delay-50`/`--delay-100` directly.

### Offsets, scale, stagger

```css
/* Slide offsets */
--slide-offset-sm: 20px;
--slide-offset-md: 50px;
--slide-offset-lg: 100px;

/* Scale — down (shrink) */
--scale-down-sm: 0.95; /* subtle shrink — cards, alerts, appear/dismiss */
--scale-down-md: 0.8; /* moderate shrink — modals */
--scale-down-lg: 0.5; /* dramatic shrink — swap states */

/* Scale — up (lift) */
--scale-up-sm: 1.03; /* subtle lift — drag pickup, active elevation */
--scale-up-md: 1.08; /* moderate lift — hover emphasis, card focus */
--scale-up-lg: 1.1; /* strong lift — prominent hover, feature callouts */

/* Stagger increments */
--stagger-tight: 50ms;
--stagger-loose: 100ms;

/* Appear / Dismiss */
--appear-duration: 300ms;
--dismiss-duration: 250ms;
--appear-slide: 15px; /* tighter than --slide-offset-sm (20px) */
--appear-scale: 0.95; /* alias for --scale-down-sm */
```

Always reference these with `var()` in Tailwind arbitrary values: `scale-[var(--scale-down-sm)]`, `translate-y-[var(--slide-offset-sm)]`, `delay-[var(--stagger-tight)]`.

### Transition Properties

Choose the narrowest property that covers the animation — `transition-all` is banned because it animates layout, paint, and composite properties simultaneously, causing unnecessary repaints.

| Tailwind class           | CSS property animated                                        | When to use                                                                     |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `transition-opacity`     | `opacity`                                                    | Fade patterns — lightest GPU cost, use for any opacity-only animation           |
| `transition-transform`   | `transform`, `translate`, `scale`, `rotate`                  | Slide, scale, rotate — GPU-composited, no layout cost                           |
| `transition-colors`      | `color`, `background-color`, `border-color`, `outline-color` | Hover/focus color changes, theme switches, focus rings                          |
| `transition-shadow`      | `box-shadow`                                                 | Card lift on hover, elevation changes                                           |
| `transition-[grid-rows]` | `grid-template-rows`                                         | Expand/collapse — preferred over height animation                               |
| `transition-[height]`    | `height`                                                     | Only when grid-rows isn't applicable; requires known height                     |
| `transition`             | All of the above combined                                    | General-purpose fallback when multiple unrelated properties animate together    |
| `transition-none`        | none                                                         | Disables all transitions — pair with `motion-reduce:` to strip animation        |
| `transition-discrete`    | Enables `transition-behavior: allow-discrete`                | Required when animating to/from `display: none` (e.g. showing a hidden element) |

**Split transition syntax** is the escape hatch when two properties need different easing or timing — most commonly opacity (linear) and transform (named curve):

```html
<!-- Wrong: one timing function applies to both -->
<div
  class="transition-[transform,opacity] duration-[var(--duration-lg)] [transition-timing-function:var(--ease-enter)]"
>
  <!-- Correct: split so each property gets its own curve -->
  <div
    class="[transition:transform_var(--duration-lg)_var(--ease-enter),opacity_var(--duration-sm)_linear]"
  ></div>
</div>
```

Use split syntax whenever an element combines a spatial transform with opacity. Tailwind's shorthand utilities don't support per-property easing, so you need the arbitrary `[transition:...]` value.

### State Variants

Tailwind variant prefixes that scope transition classes to a specific trigger. Transitions defined without a variant are always active; variants make them conditional.

| Variant              | Triggers on                                                           | Example                                            |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `hover:`             | Mouse hover                                                           | `hover:scale-[1.02]`                               |
| `focus:`             | Any focus (keyboard or click)                                         | `focus:ring-2`                                     |
| `focus-visible:`     | Keyboard focus only — preferred for focus rings                       | `focus-visible:ring-2`                             |
| `active:`            | Press / tap                                                           | `active:scale-[var(--scale-down-sm)]`              |
| `group-hover:`       | Parent element with `.group` class is hovered                         | `group-hover:translate-x-1`                        |
| `open:`              | `<details>` or `<dialog>` element is open                             | `open:grid-rows-[1fr]`                             |
| `data-[state=open]:` | Custom `data-state="open"` attribute — use for JS-driven components   | `data-[state=open]:opacity-100`                    |
| `motion-safe:`       | `prefers-reduced-motion` is **not** set — adds motion only when safe  | `motion-safe:translate-y-[var(--slide-offset-sm)]` |
| `motion-reduce:`     | `prefers-reduced-motion: reduce` is active — strips or gentles motion | `motion-reduce:transition-none`                    |

`motion-safe:` and `motion-reduce:` are opposites. Prefer `motion-reduce:` as the override on top of full motion (opt-out), rather than `motion-safe:` as the gate (opt-in) — it means the default state already has transitions, which browsers with no preference inherit correctly.

---

## Patterns

### Fade In / Out

- Enter: `opacity-0 → opacity-100`, `--duration-sm` (200ms), `ease-linear`
- Exit: `--duration-xs` (150ms), `ease-linear`
- Opacity **always** uses `linear` easing.

```html
<!-- Hidden -->
<div
  class="opacity-0 transition-opacity duration-[var(--duration-sm)] [transition-timing-function:linear]"
>
  ...
</div>
<!-- Visible -->
<div
  class="opacity-100 transition-opacity duration-[var(--duration-sm)] [transition-timing-function:linear]"
>
  ...
</div>
```

### Slide

- Enter (slide up): `translateY(offset) → 0`, opacity `0 → 1`, `--duration-lg` (300ms)
- Exit (slide down): `--duration-sm` (200ms)
- Split transition: transform uses `--ease-enter`/`--ease-exit`, opacity uses `linear`.

```html
<div
  class="opacity-0 translate-y-[var(--slide-offset-sm)]
            [transition:transform_var(--duration-lg)_var(--ease-enter),opacity_var(--duration-sm)_linear]
            data-[open]:opacity-100 data-[open]:translate-y-0"
></div>
```

### Scale In / Out

- Enter: `scale-[var(--scale-down-sm)] → scale-100`, `--ease-enter`
- Exit: `scale-100 → scale-[var(--scale-down-sm)]`, `--ease-exit`
- `transform-origin: center` unless element is edge-anchored (dropdowns, drawers).

```html
<div
  class="opacity-0 scale-[var(--scale-down-sm)]
            [transition:transform_var(--duration-lg)_var(--ease-enter),opacity_var(--duration-sm)_linear]
            data-[open]:opacity-100 data-[open]:scale-100"
></div>
```

### Expand / Collapse

- Animate `grid-rows` from `0fr` → `1fr`; revealed content fades with `--ease-medium-accel`.
- Enter `--duration-lg` (300ms) / Exit `--duration-md` (250ms).

```html
<div
  class="grid grid-rows-[0fr] transition-[grid-rows] duration-[var(--duration-lg)]
            [transition-timing-function:var(--ease-medium-accel)]
            data-[open]:grid-rows-[1fr]"
>
  <div class="overflow-hidden"><!-- content --></div>
</div>
```

### Appear / Dismiss (alerts, toasts)

Primary pattern for overlaid notifications. Combines scale + slide + fade from center.

- Enter: `opacity-0 scale-[var(--appear-scale)] translate-y-[var(--appear-slide)] → visible`, `--appear-duration` (300ms), `--ease-medium-accel`
- Exit: `--dismiss-duration` (250ms), `--ease-medium-accel`, scale returns to `scale-[var(--appear-scale)]`.
- `transform-origin: center`.

```html
<div
  class="opacity-0 scale-[var(--appear-scale)] translate-y-[var(--appear-slide)]
            [transition:transform_var(--appear-duration)_var(--ease-medium-accel),opacity_var(--appear-duration)_linear]
            data-[open]:opacity-100 data-[open]:scale-100 data-[open]:translate-y-0
            motion-reduce:translate-y-0 motion-reduce:scale-100
            motion-reduce:[transition:opacity_var(--duration-xs)_linear]"
></div>
```

### Icon Rotation

For toggle icons (+ → ×, chevron open/close).

```html
<span
  class="transition-transform duration-[var(--duration-sm)] [transition-timing-function:var(--ease-medium-accel)]
             data-[open]:rotate-180"
></span>
```

### Swap

For content that replaces in place — icon state changes, counter flips, label toggles. Old content shrinks out while new content grows in.

- Out: `scale-100 → scale-[var(--scale-down-lg)]`, opacity `1 → 0`, `--ease-low-accel`
- In: `scale-[var(--scale-down-lg)] → scale-100`, opacity `0 → 1`, `--ease-low-accel`

```html
<!-- Exiting element -->
<div
  class="[transition:transform_var(--duration-sm)_var(--ease-low-accel),opacity_var(--duration-xs)_linear]
             data-[swap-out]:scale-[var(--scale-down-lg)] data-[swap-out]:opacity-0
             motion-reduce:scale-100 motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-xs)]"
></div>
<!-- Entering element -->
<div
  class="scale-[var(--scale-down-lg)] opacity-0
             [transition:transform_var(--duration-sm)_var(--ease-low-accel),opacity_var(--duration-xs)_linear]
             data-[swap-in]:scale-100 data-[swap-in]:opacity-100
             motion-reduce:scale-100 motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-xs)]"
></div>
```

### Stagger

Layers incremental delays onto any base pattern. Use `delay-[var(--stagger-tight)]` / `delay-[var(--stagger-loose)]` on list children.

```html
<div class="... delay-0">Item 1</div>
<div class="... delay-[var(--stagger-tight)]">Item 2</div>
<div class="... [animation-delay:calc(2*var(--stagger-tight))]">Item 3</div>
```

### Page Navigation

- Forward: new content slides in from `+X`, old exits to `-X`. `--ease-high-accel`, `--duration-lg` (300ms).
- Backward: reverse directions.

### Drag & Drop

- Pickup: `scale-[var(--scale-up-sm)] opacity-95`, `--duration-sm` (200ms).
- Settle: animate position back with `--ease-medium-accel`.
- Displaced items reflow using `transition-transform`.

---

## Timing Principles

1. **Enter/Exit asymmetry**: exits are always 50–100ms faster than enters.
2. **Fixed slide timing**: all slide sizes (sm/md/lg offset) use `--duration-lg` (300ms) enter / `--duration-sm` (200ms) exit. The offset size does not change the duration.
3. **Compound motions add 50–100ms**: combining two or more transform properties? Add 50-100ms to base duration. Appear (scale + slide + fade) = 300ms vs. Fade alone = 200ms.
4. **Priority Affects Speed**: High-priority UI (e.g. alerts, toasts, modals) should complete within 300ms. Low-priority e.g. reflow motion can extend to 400-500ms.

---

## Transform Direction & Origin

1. **Scale Origin = Center**: All scale transforms use `transform-origin: center` unless element is anchored to an edge (e.g. dropdowns scale from the anchor point).
2. **Slide Direction = Context**: Alerts slide from direction of origin (e.g. top alerts slide down, bottom toasts slide up). Content slides opposite to reading direction (e.g. new content slides in from right, old content slides from left).
3. **Forward/Backward Convention**: Forward navigation = slide left (content moves right-to-left). Backward navigation = slide right (content moves left-to-right). Vertical = down for forward, up for backward.
4. **Rotation Direction**: Clockwise for "open" or "expand" states, counter-clockwise for "close" or "collapse" states. Exception: chevrons rotate 90 degrees down to indicate revealed content below.

---

## Opacity & Color

1. **Opacity and color always use `linear`** — never apply a named curve to opacity or color.
2. **Split transition syntax** when mixing opacity with transforms:
   ```css
   transition:
     transform var(--duration-lg) var(--ease-enter),
     opacity var(--duration-sm) linear;
   ```
3. **Opacity Delay for Clarity**: When content replaces other content, delay new content opacity by 50ms so old content fades before new content appears.
4. **Backdrop Fades Separately**: Modal or dialog backdrops fade independently from content. Backdrop duration = content duration, but can start earlier for smooth reveal.

---

## Stacking & Choreography

1. **Stagger Direction = Reading Order**: Items stagger in the order users would read them (e.g. top-to-bottom, left-to-right in LTR languages). Exit stagger reverses or happens simultaneously.
2. **Z-Index Determines Timing**: Elements appearing "on top" (e.g. modals, popovers, tooltips) animate last. Background elements (e.g. page content) animate first.
3. **Container Before Content**: When both container and content animate, container completes 50-80% before content starts. Example: Modal backdrop fades → modal scales in → modal content staggers.
4. **Maximum Simultaneous Animations**: Limit to 6-8 elements animating at once. For larger sets, use tighter stagger (50ms) or batch into groups.

---

## Reduced Motion

The principle: **retain motion where its removal causes "visual teleportation" or breaks the user's mental model of the layout (Essential Motion); simplify to a fade where motion is used primarily for emphasis or rhythm (Expressive Motion).**

Classify every animated element as one of two types before writing its `motion-reduce:` variant:

- **Essential** — motion that conveys spatial information or preserves direct manipulation (layout transitions, navigation direction, drag/drop). Removing it would teleport content or break the user's mental model. Keep the motion, but soften the curve to `ease-low-accel` and reduce offsets to `sm`.
- **Expressive** — motion used for rhythm, emphasis, or visual polish. The state change is fully communicated without it. Replace with a 150ms linear fade.

### Essential Motion — Preserve with gentler easing

| Pattern              | `motion-reduce:` behavior                                 | Why it's essential                                                     |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Expand / Collapse    | Keep `transition-[grid-rows]`; switch to `ease-low-accel` | Removing teleports content into view — breaks spatial continuity       |
| Page Content Nav     | Keep directional slide; switch to `ease-low-accel`        | Direction communicates forward vs. backward — functional wayfinding    |
| Drag Settle + Reflow | Keep position animation, `ease-low-accel`, remove scale   | Removing creates teleportation — breaks direct manipulation continuity |

```html
<!-- Essential: preserve motion, use gentler curve -->
<div
  class="grid grid-rows-[0fr]
            transition-[grid-rows] duration-[var(--duration-lg)] [transition-timing-function:var(--ease-medium-accel)]
            data-[open]:grid-rows-[1fr]
            motion-reduce:[transition-timing-function:var(--ease-low-accel)]"
>
  <div class="overflow-hidden">content</div>
</div>
```

### Expressive Motion — Simplify to fade

| Pattern           | `motion-reduce:` behavior                        | Why it's expressive                                           |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Fade              | Unchanged — already opacity-only at 150ms linear | Already the minimal form                                      |
| Slide             | 150ms linear fade, no position change            | State change is clear without the spatial move                |
| Scale             | 150ms linear fade, no scale                      | State change is clear without the size change                 |
| Appear / Dismiss  | 150ms linear fade, no scale or position          | Scale + slide is embellishment; opacity carries the state     |
| Swap              | 150ms linear fade, no scale                      | Icon state communicated by shape — scale is emphasis          |
| Stagger           | 150ms linear fade per item; preserve delays      | Cascade rhythm is informational; spatial movement is emphasis |
| Icon Rotation     | 150ms linear fade, no rotation                   | Icon shape communicates state — rotation is emphasis          |
| Page Open / Close | 150ms linear fade, no slide                      | Vertical slide is emphasis, not directional wayfinding        |
| Drag Pickup       | Shadow only, no scale                            | Scale lift is emphasis — shadow indicates draggable state     |

```html
<!-- Expressive: strip to fade only -->
<div
  class="opacity-0 scale-[var(--scale-down-sm)]
            [transition:transform_var(--duration-lg)_var(--ease-enter),opacity_var(--duration-sm)_linear]
            data-[open]:opacity-100 data-[open]:scale-100
            motion-reduce:scale-100 motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-xs)]"
></div>
```

---

## Instructions

1. **Scan** — Run these Grep passes before reading any file. Each pattern is paired with the exact regex to use:

   | What to catch                                         | Grep pattern                                                                                                               | Note                                                                                                                                                                                                           |
   | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Hardcoded ms in Tailwind arbitrary value              | `duration-\[\d+ms\]\|delay-\[\d+ms\]`                                                                                      | Matches `duration-[250ms]` — never use raw ms in class values                                                                                                                                                  |
   | Plain numeric Tailwind duration class                 | `\bduration-\d+\b`                                                                                                         | Matches `duration-300`, `duration-200`, etc. — use `duration-[var(--duration-lg)]` instead                                                                                                                     |
   | `transition-all` (too broad)                          | `transition-all`                                                                                                           | Single-line, simple keyword                                                                                                                                                                                    |
   | Named easing on opacity/color in split transition     | `opacity_(?:\d+ms\|var\(--duration-[a-z0-9-]+\))_var\(--ease-\|color_(?:\d+ms\|var\(--duration-[a-z0-9-]+\))_var\(--ease-` | Use **multiline mode**. Matches all easing-on-opacity occurrences — then discard any result ending in `--ease-linear` (the only allowed value). ripgrep doesn't support negative lookaheads, so filter by eye. |
   | Missing `motion-reduce:` on animated elements         | `transition-\|animation-` then cross-check same element lacks `motion-reduce:`                                             | Two-pass: find animated elements, verify each has a `motion-reduce:` class                                                                                                                                     |
   | Hardcoded `transform-origin` (not needed when center) | `transform-origin:\s*center\|style=\{[^}]*transformOrigin`                                                                 | Flag explicit center declarations — the default is already center                                                                                                                                              |
   | Raw delay not using stagger tokens                    | `delay-\[\d`                                                                                                               | Matches `delay-[100ms]`; `delay-[var(--stagger-tight)]` is fine                                                                                                                                                |
   | Height animation (use grid-rows instead)              | `transition-\[height\]\|transition-\[max-height\]`                                                                         | Flag both; grid-rows avoids needing a known height                                                                                                                                                             |
   | Old numeric duration token names                      | `--duration-\(75\|100\|150\|200\|250\|300\|350\|400\|450\|500\)`                                                           | Flag uses of old numeric tokens — should be migrated to t-shirt scale                                                                                                                                          |
   | Old overshoot easing token names                      | `--ease-\(light\|heavy\)-overshoot`                                                                                        | Flag old names — renamed to `--ease-light-bounce` / `--ease-heavy-bounce`                                                                                                                                      |
   | Old flat scale token names                            | `--scale-\(sm\|md\|lg\)[^-]`                                                                                               | Flag old names — renamed to `--scale-down-*`                                                                                                                                                                   |

   For the **easing-on-opacity** check, use multiline mode because JSX className attributes frequently span multiple lines:

   ```
   # Grep pattern (multiline: true):
   opacity_(?:\d+ms|var\(--duration-[a-z0-9-]+\))_var\(--ease-
   ```

   This matches every opacity easing declaration regardless of whether the duration is a raw ms value or a `var()` token. Any result containing `--ease-linear` is correct and can be skipped. Any result using any other named curve (`--ease-enter`, `--ease-exit`, etc.) is a violation — the most common subtle bug in this system.

2. **Apply** — When implementing or fixing:
   - Match duration to the token whose value fits the animation's distance/complexity category.
   - Choose easing from the table above based on enter/exit direction and motion type.
   - Always write asymmetric durations (enter ≠ exit).
   - Use split transition syntax when combining opacity with spatial transforms. Inside `[transition:...]` arbitrary values, use `var(--duration-*)` tokens rather than raw ms: `[transition:transform_var(--duration-lg)_var(--ease-enter),opacity_var(--duration-sm)_linear]`.
   - Add `transition-discrete` when animating to/from `display: none`.
   - For every animated element, classify it as essential or expressive (see **Reduced Motion** section above) and add the corresponding `motion-reduce:` variant.

---

## Constraints and Don'ts

- Do not use hardcoded `ms` values — always reference a `--duration-*` or `--delay-*` token.
- Do not apply `--ease-enter`, `--ease-exit`, or any named curve to `opacity` or `color` — use `linear` only.
- Do not use `transition-all`; specify only the properties that animate.
- Do not set `transform-origin` when `center` (the default) is correct.
- Do not omit `motion-reduce:` variants on any element with transitions or animations.
- Do not exceed 6–8 simultaneously animating elements.
- Do not apply motion to HDS/ServiceNow reusable components directly.
- Do not use old numeric duration tokens (`--duration-300`) — use t-shirt scale (`--duration-lg`).
- Do not use old overshoot easing names (`--ease-light-overshoot`) — use `--ease-light-bounce` / `--ease-heavy-bounce`.
- Do not use old flat scale tokens (`--scale-sm`) — use directional tokens (`--scale-down-sm`, `--scale-up-sm`).

---

## Output Checklist

1. All `transition-duration` values reference a `--duration-{size}` t-shirt token (not numeric).
2. All `transition-delay` values match a `--delay-*` token or use `--stagger-tight`/`--stagger-loose`.
3. Opacity and color transitions use `linear` easing only.
4. Spatial transforms use an appropriate named easing curve (`--ease-enter`, `--ease-exit`, `--ease-medium-accel`, etc.).
5. Enter duration > exit duration (50–100ms asymmetry).
6. Split transition syntax used when combining opacity with transform.
7. Every animated element has a `motion-reduce:` variant classified as essential or expressive.
8. Stagger delays use `--stagger-tight` (50ms) or `--stagger-loose` (100ms) tokens.
9. `transition-discrete` present on any element animating from `display: none`.
10. No hardcoded pixel or millisecond values where a token exists.
11. Scale tokens use directional naming: `--scale-down-*` for shrink, `--scale-up-*` for lift.
12. Appear/dismiss patterns use `--appear-*` / `--dismiss-*` tokens and `--ease-medium-accel`.
