# Accordion

**DaisyUI base:** `collapse` / `collapse-arrow` / `collapse-plus` — via `aiux-collapse` classes for a standalone disclosure
**Production component(s):** `<aiux-accordion-group>` (`@servicenow/aiux-components-accordion`) for multiple coordinated items; native `<details>`/`<summary>` + `aiux-collapse` classes for a single standalone disclosure
**Last updated:** 2026-07-02 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Variant selection

Two implementation paths, chosen by whether items need shared open/close coordination:

- **Single standalone disclosure** (no coordination with other items) — hand-write native `<details class="aiux-collapse aiux-collapse-{arrow|plus}">` + `<summary>`.
- **Multiple coordinated items** — use `<aiux-accordion-group>` with an `items` array (`{title, content, open, disabled}`); the component renders every item's markup internally.

Three icon variants control the expand/collapse indicator, available on both paths:

| Variant     | Class                 | Indicator           |
| ----------- | --------------------- | ------------------- |
| **Arrow**   | `aiux-collapse-arrow` | Chevron rotates 90° |
| **Plus**    | `aiux-collapse-plus`  | `+` toggles to `−`  |
| **No icon** | `aiux-collapse`       | No visual indicator |

Choose arrow as the default. Use plus when the accordion sits inside dense panels where the smaller glyph reduces visual noise. No-icon is only appropriate when another visual cue (e.g., background color change) communicates expandability. Set via the `icon` prop (`'arrow' | 'plus' | ''`) on `<aiux-accordion-group>`, or the matching `aiux-collapse-*` class on a standalone `<details>`.

Bordered and filled are a single coupled choice, not independent options: bordered items get a `bg-base-100` background with a `border-base-300` border; non-bordered items sit on `bg-base-200`. Set via the `bordered` boolean prop on `<aiux-accordion-group>`, or apply the same classes directly to a standalone `<details>`.

### 2. Content slots

- **Header label** — primary text inside the trigger. Truncates with ellipsis when it exceeds container width; full text appears in a tooltip on hover. Reference `@patterns/references/truncation-tooltip.md`. Figma specifies the header at normal weight (400), not the component's default. On `<aiux-accordion-group>`, **do not** pass the label through `items[].title` — that plain string inherits the wrapper's `font-semibold`. Always set it via the `title-{index}` slot with an explicit `font-normal` class instead: `<span slot="title-${i}" class="font-normal">…</span>`. For a standalone disclosure, apply `font-normal` directly to the `<summary>`.
- **Panel content** — the expandable body (`content` on an `<aiux-accordion-group>` item, or the element following `<summary>` for a standalone disclosure). Supports any content (text, forms, components). Panel padding uses `aiux-collapse-content`, which applies `p-4` by default. Figma specifies body text at light weight (300) in `text-text-secondary`; the component's internal wrapper renders plain `items[].content` at normal weight (400) with no color set (defaults to black). Raw `font-light` is not a usable class in this project (not in the Tailwind safelist) — pass the content through the `content-{index}` slot instead, wrapped in `class="body-sm text-text-secondary"` (`body-sm` is the project's compiled body-text utility bundling the correct size, line-height, and light weight; `text-text-secondary` supplies the color, which `body-sm` does not set).

### 3. Heading level

The header element's heading level (`h1`–`h6`) is configurable. Default is level 2. Set an appropriate level based on the page's document outline; do not skip heading levels. On `<aiux-accordion-group>`, set the `heading-level` prop. For a standalone `<details>`, wrap the `<summary>` in an element with `role="heading"` and the matching `aria-level`, following the APG Accordion pattern (see `@accessibility`).

### 5. Expand modes

By default (`multiple` unset or `false`), opening one item closes the previously open item — only one item is expanded at a time. Set `multiple` to `true` on `<aiux-accordion-group>` to allow several items open simultaneously; choose this when content sections are independent and vertical space allows it. A standalone `<details>` has no coordination concern since it is the only item.

### 6. States

Default (collapsed), expanded, disabled, focus-visible, hover. All five must be accounted for.

- **Expanded** — panel content is visible. `aiux-collapse-open` is applied. Trigger has `aria-expanded="true"`.
- **Collapsed** — panel content is hidden. `aiux-collapse-close` is applied. Trigger has `aria-expanded="false"`.
- **Disabled** — trigger is non-interactive. Use the native `disabled` attribute on the trigger button. Disabled items cannot be expanded or collapsed.
- **Focus-visible** — outline appears on the `.aiux-collapse` container (not the trigger itself). Uses a neutral `base-content` outline, not brand-colored.

### 7. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Accordion — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Accordion
- **Forced colors:** Headers follow the **interactive** pattern; panels follow the **container** pattern — see `@accessibility`

**Horizon-specific design notes:**

- Default `aria-level` is 2; the agent must set an appropriate heading level based on the page's document outline (see § 3).
- The `collapse-plus` variant's `::after` pseudo-element uses `content: '+' / ''` so the indicator character is hidden from assistive technology.

### 8. RTL

Header label and panel content align to the right. The trigger icon mirrors to the opposite side.

### 9. Scope boundary

This sheet covers individual accordion decisions: which variant, which heading level, content slot conventions, and accessibility requirements. It does not govern:

- **How accordions compose inside panels, tabs, or side drawers** — defined by composition specs.
- **How accordion items group with other content types** — layout composition specs.

The referencing direction is one-way: composition specs reference this sheet for individual accordion rules; this sheet does not reference composition specs.
