# Forced Colors CSS Reference for Atomic Components

This reference provides guidance for implementing Windows High Contrast Mode (forced-colors) support across all atomic components in the design system.

> **See also:** Component-specific forced colors patterns for the following components are documented in the `## Forced Colors Requirements` section at the bottom of each corresponding file in `aria-apg-patterns/`:
>
> - **Button** — [`aria-apg-patterns/button.md`](aria-apg-patterns/button.md)
> - **Tabs** — [`aria-apg-patterns/tabs.md`](aria-apg-patterns/tabs.md)
> - **Accordion** — [`aria-apg-patterns/accordion.md`](aria-apg-patterns/accordion.md)
> - **Checkbox** — [`aria-apg-patterns/checkbox.md`](aria-apg-patterns/checkbox.md)
> - **Radio** — [`aria-apg-patterns/radio-group.md`](aria-apg-patterns/radio-group.md)
> - **Toggle / Switch** — [`aria-apg-patterns/switch.md`](aria-apg-patterns/switch.md)
> - **Breadcrumbs** — [`aria-apg-patterns/breadcrumb.md`](aria-apg-patterns/breadcrumb.md)
> - **Menu** — [`aria-apg-patterns/menu-and-menubar.md`](aria-apg-patterns/menu-and-menubar.md)
> - **Dropdown** — [`aria-apg-patterns/menu-button.md`](aria-apg-patterns/menu-button.md) (action menus) · [`aria-apg-patterns/combobox.md`](aria-apg-patterns/combobox.md) (selection / filterable)
> - **Alert** — [`aria-apg-patterns/alert.md`](aria-apg-patterns/alert.md)
> - **Toast** — [`aria-apg-patterns/alert.md`](aria-apg-patterns/alert.md)
> - **Modal / Dialog** — [`aria-apg-patterns/dialog.md`](aria-apg-patterns/dialog.md)
> - **Popover** — [`aria-apg-patterns/dialog.md`](aria-apg-patterns/dialog.md)
> - **Tooltip** — [`aria-apg-patterns/tooltip.md`](aria-apg-patterns/tooltip.md)
> - **Progress Bar** — [`aria-apg-patterns/meter.md`](aria-apg-patterns/meter.md)
> - **Table** — [`aria-apg-patterns/table.md`](aria-apg-patterns/table.md)
> - **List** — [`aria-apg-patterns/listbox.md`](aria-apg-patterns/listbox.md)

## Overview

When `forced-colors: active` is detected, the browser overrides most colors with system colors. This reference defines how to use the `forced-colors` media query and system color keywords to ensure accessibility in high contrast environments.

```css
@media (forced-colors: active) {
  /* Forced colors styles */
}
```

### Critical: Using `forced-color-adjust: none`

**The browser applies automatic color overrides before your CSS rules.** To gain full control over system colors on interactive elements, you must disable the automatic adjustment:

```css
@media (forced-colors: active) {
  .button {
    /* Disable automatic backplate and color overrides */
    forced-color-adjust: none;

    /* Now manually set colors using System Color keywords */
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }
}
```

**When to use `forced-color-adjust: none`:**

- Interactive elements that need `ButtonFace` background (buttons, clickable cards, tabs, form controls)
- Elements with multiple interactive states (hover, active, selected) that need predictable color changes
- Images, avatars, or media that must preserve their original appearance

**When NOT to use it:**

- Non-interactive display containers (tooltips, popovers, alerts, toasts, modals, badges)
- These should use `Canvas` background with `CanvasText` borders — the browser's default handling is correct
- Page-level containers
- Purely decorative elements

### System Color Palette

| Token              | Usage                                                          |
| ------------------ | -------------------------------------------------------------- |
| `Canvas`           | Background for pages, panels, or non-interactive containers    |
| `CanvasText`       | Color for all non-interactive text                             |
| `LinkText`         | Non-visited hyperlinks                                         |
| `VisitedText`      | Visited hyperlinks                                             |
| `ActiveText`       | Text in active links when pressed                              |
| `ButtonFace`       | Background of buttons and interactive controls                 |
| `ButtonText`       | Text and SVGs on buttons                                       |
| `ButtonBorder`     | Button border or outline                                       |
| `Field`            | Background for form fields (inputs, checkboxes, radio buttons) |
| `FieldText`        | Text color for inputs, textareas, content editable divs        |
| `Highlight`        | Background when content is focused or hovered                  |
| `HighlightText`    | Text color when focused or hovered                             |
| `Mark`             | Background highlight for search results                        |
| `MarkText`         | Text color for search result highlights                        |
| `GrayText`         | Foreground color for disabled controls                         |
| `SelectedItem`     | Background of selected/pressed items                           |
| `SelectedItemText` | Text of selected/pressed items                                 |

---

## Three Behavioral Patterns

Every component falls into one of three forced-colors behavioral patterns. Pick the pattern that matches the component, then follow the matching state table and CSS section in this file.

### Pattern 1: Interactive

Applies to: button, clickable card, tab, accordion trigger, selectable pill, menu item, pagination control, step indicator, navbar link.

| State                 | Background     | Text / Icon        | Border         |
| --------------------- | -------------- | ------------------ | -------------- |
| Default               | `ButtonFace`   | `ButtonText`       | `ButtonBorder` |
| Focus / Hover         | `Highlight`    | `HighlightText`    | `Highlight`    |
| Disabled              | `ButtonFace`   | `GrayText`         | `GrayText`     |
| Pressed / Selected    | `SelectedItem` | `SelectedItemText` | `ButtonBorder` |
| Pressed + Focus/Hover | `SelectedItem` | `SelectedItemText` | `Highlight`    |
| Pressed + Disabled    | `ButtonFace`   | `GrayText`         | `GrayText`     |

Focus / hover also adds `outline: 2px solid Highlight; outline-offset: 2px`.

Full state table with all combinations and CSS implementation: see [Interactive Components (Button-like)](#interactive-components-button-like).

### Pattern 2: Field

Applies to: text input, textarea, select, checkbox (unchecked), radio (unchecked).

| State         | Background | Text        | Border         |
| ------------- | ---------- | ----------- | -------------- |
| Default       | `Field`    | `FieldText` | `ButtonBorder` |
| Focus / Hover | `Field`    | `FieldText` | `Highlight`    |
| Disabled      | `Field`    | `GrayText`  | `GrayText`     |
| Read-only     | `Field`    | `FieldText` | `GrayText`     |
| Placeholder   | `Field`    | `GrayText`  | `ButtonBorder` |

Focus / hover also adds `outline: 2px solid Highlight; outline-offset: 2px`. A checked checkbox / radio switches to the interactive pattern's selected state (`SelectedItem` / `SelectedItemText`).

Full state table and CSS implementation: see [Form Inputs](#form-inputs).

### Pattern 3: Container

Applies to: card (non-clickable), modal, dialog, popover, tooltip, toast, alert, dropdown panel, accordion panel, table.

| Element            | Background | Text         | Border                   |
| ------------------ | ---------- | ------------ | ------------------------ |
| Container          | `Canvas`   | `CanvasText` | `2px solid ButtonBorder` |
| Header / separator | —          | —            | `1px solid ButtonBorder` |

Containers have no hover / focus / selected states. Interactive elements _inside_ containers follow Pattern 1 or Pattern 2.

Containers do NOT use `forced-color-adjust: none` — the browser's default `Canvas` / `CanvasText` handling is correct. Only interactive elements inside the container need `forced-color-adjust: none`.

### Cross-cutting rules across all patterns

- **Ghost / bare buttons** with transparent background in normal mode must render with `2px solid ButtonBorder` when forced-colors is active. Use the transparent border technique (`border: 2px solid transparent` in normal mode) so no layout shift occurs. See [Ghost / Bare Button Pattern](#ghost--bare-button-pattern).
- **Color is never the sole differentiator.** Every state communicated by color in normal mode (selected, error, active) must also be communicated by border, outline, icon, text, or position in forced colors.
- **Icons inherit from the parent.** SVG icons inside interactive elements use `fill: currentColor` so they shift to the correct system color in each state automatically.
- **Minimum border width:** 2px for interactive elements and containers; 1px for internal separators (table cell borders, accordion panel borders, list dividers).
- **`forced-color-adjust: none` exceptions** — only these may preserve original colors: images (`<img>`, CSS background images), data visualizations and charts, brand logos, slotted media content in composite components (card image slots, list item thumbnails). Never apply to text, borders, or interactive state indicators.

---

## Interactive Components (Button-like)

The following components share the same state pattern: Button, Clickable/Selectable Card, Tab, Accordion Segment, Selectable Pill, Pagination, Steps.

### State Reference Table

| State                     | Background     | Text/Icon          | Border         | Outline               |
| ------------------------- | -------------- | ------------------ | -------------- | --------------------- |
| Default                   | `ButtonFace`   | `ButtonText`       | `ButtonBorder` | none                  |
| Hover                     | `Highlight`    | `HighlightText`    | `Highlight`    | none                  |
| Focus                     | `ButtonFace`   | `ButtonText`       | `Highlight`    | `2px solid Highlight` |
| Focus + Hover             | `Highlight`    | `HighlightText`    | `Highlight`    | `2px solid Highlight` |
| Active (momentary press)  | `SelectedItem` | `SelectedItemText` | `SelectedItem` | none                  |
| Active + Focus            | `SelectedItem` | `SelectedItemText` | `SelectedItem` | `2px solid Highlight` |
| Disabled                  | `ButtonFace`   | `GrayText`         | `GrayText`     | none                  |
| Selected/Pressed (toggle) | `SelectedItem` | `SelectedItemText` | `ButtonBorder` | none                  |
| Selected + Hover          | `SelectedItem` | `SelectedItemText` | `Highlight`    | none                  |
| Selected + Focus          | `SelectedItem` | `SelectedItemText` | `Highlight`    | `2px solid Highlight` |
| Selected + Disabled       | `ButtonFace`   | `GrayText`         | `GrayText`     | none                  |

> **Ghost/bare buttons** (transparent background in normal mode) must always render with a visible `ButtonBorder` border in forced-colors mode — see the Ghost / Bare Button Pattern below.

> **Step components:** The current step (`aria-current="step"`) uses `border-color: SelectedItem` (same as the Active state row above), not `ButtonBorder`. Completed steps (`.is-completed`) use the standard Selected border (`ButtonBorder`). Connector lines: `background-color: ButtonBorder`; completed connectors: `background-color: SelectedItem`.

### Ghost / Bare Button Pattern

Ghost buttons become invisible in forced-colors mode without explicit border handling. Use the transparent border technique so no layout shift occurs in normal mode:

```css
/* Normal mode: reserve border space without showing it */
.button--ghost {
  border: 2px solid transparent;
}

/* Forced colors: activate the border and apply button colors */
@media (forced-colors: active) {
  .button--ghost {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border-color: ButtonBorder;
  }

  .button--ghost:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .button--ghost:focus,
  .button--ghost:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .button--ghost:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }
}
```

---

## Form Inputs

The following components share the form input pattern: Text Input, Textarea, Select.

### State Reference Table

| State    | Background | Text        | Border         | Outline               |
| -------- | ---------- | ----------- | -------------- | --------------------- |
| Default  | `Field`    | `FieldText` | `ButtonBorder` | none                  |
| Hover    | `Field`    | `FieldText` | `Highlight`    | none                  |
| Focus    | `Field`    | `FieldText` | `Highlight`    | `2px solid Highlight` |
| Disabled | `Field`    | `GrayText`  | `GrayText`     | none                  |
| Readonly | `Field`    | `FieldText` | `GrayText`     | none                  |
| Invalid  | `Field`    | `FieldText` | `LinkText`     | none                  |

### Text Input

```css
@media (forced-colors: active) {
  .input {
    forced-color-adjust: none;
    background-color: Field;
    color: FieldText;
    border: 2px solid ButtonBorder;
  }

  .input::placeholder {
    color: GrayText;
  }

  .input:hover:not(:disabled):not(:read-only) {
    border-color: Highlight;
  }

  .input:focus,
  .input:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .input:disabled {
    background-color: Field;
    color: GrayText;
    border-color: GrayText;
  }

  .input:read-only {
    background-color: Field;
    color: FieldText;
    border-color: GrayText;
  }

  .input:invalid,
  .input[aria-invalid='true'] {
    border-color: LinkText;
  }

  .input:invalid:focus,
  .input[aria-invalid='true']:focus {
    border-color: LinkText;
    outline: 2px solid LinkText;
    outline-offset: 2px;
  }
}
```

Textarea and select follow the same pattern using their respective element selectors (`textarea`, `select`). Select dropdown icons use `fill: FieldText; stroke: FieldText` in the default state and `fill: GrayText; stroke: GrayText` when disabled.

---

## Dropdown, Menu, and Listbox Patterns

These components share a two-layer structure: a **popup container** and **individual item elements** inside it. Each layer has different forced-colors requirements.

| Layer                                                    | `forced-color-adjust`             | Background      | Text            |
| -------------------------------------------------------- | --------------------------------- | --------------- | --------------- |
| Container (menu panel, listbox popup, combobox dropdown) | **NOT set** (omit entirely)       | `Canvas`        | `CanvasText`    |
| Each individual item element                             | `none` (set directly on the item) | varies by state | varies by state |

**Why items need their own `forced-color-adjust: none`**: Relying on inheritance from the container is unreliable across browsers. Apply `forced-color-adjust: none` directly to each item element so hover and selection color pairs render correctly.

### Item Color State Rules

| Item state              | `background-color` | `color`            | When it applies                                         |
| ----------------------- | ------------------ | ------------------ | ------------------------------------------------------- |
| Default                 | `Canvas`           | `CanvasText`       | Base state                                              |
| Hover / keyboard cursor | `Highlight`        | `HighlightText`    | Transient cursor position only                          |
| `aria-selected="true"`  | `SelectedItem`     | `SelectedItemText` | Committed selection in listbox / combobox options       |
| `aria-checked="true"`   | `SelectedItem`     | `SelectedItemText` | Checked state of `menuitemradio` and `menuitemcheckbox` |
| Disabled                | `Canvas`           | `GrayText`         |                                                         |

**Critical — always set both properties as a pair.** Setting only `background-color: Highlight` without `color: HighlightText` leaves `CanvasText` (dark) on a Highlight (cyan) background in Windows High Contrast Mode. Every hover/focus/selection rule must include both the background-color AND the color.

**Critical — Highlight vs. SelectedItem are not interchangeable:**

- `Highlight` / `HighlightText` = transient cursor position (hover, `aria-activedescendant` pointer, keyboard focus)
- `SelectedItem` / `SelectedItemText` = persistent committed state (`aria-selected="true"`, `aria-checked="true"`)

Using `Highlight` for selection or `SelectedItem` for hover is a correctness error — they convey different semantic states to assistive technology users.

### Complete CSS Pattern

```css
@media (forced-colors: active) {
  /* ========================================
     CONTAINER — no forced-color-adjust
     The browser handles Canvas/CanvasText automatically.
     Do NOT set forced-color-adjust on the container.
     ======================================== */
  .menu-panel,
  .dropdown-popup,
  .listbox-popup,
  .combobox-listbox {
    background-color: Canvas;
    border: 2px solid ButtonBorder;
    /* Do NOT add forced-color-adjust here */
  }

  /* ========================================
     ITEM — BASE STATE
     forced-color-adjust: none is required on each item
     individually. Do not rely on container inheritance.

     Apply this to EVERY element that can be hovered, focused,
     or selected — regardless of whether you target it by class
     or by role attribute. Without forced-color-adjust: none,
     the browser applies a text backplate (contrasting box behind
     text characters) that creates a "weird highlight" visual on
     top of your Highlight/SelectedItem backgrounds.
     ======================================== */
  .menu-item,
  [role='menuitem'],
  .dropdown-item,
  .list-option,
  [role='option'],
  .combobox-option {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
  }

  /* ========================================
     ITEM — HOVER / KEYBOARD CURSOR
     BOTH background-color AND color are required.
     Without color: HighlightText, text stays CanvasText
     (dark) on a Highlight (cyan) background — unreadable.
     ======================================== */
  .menu-item:hover,
  [role='menuitem']:hover,
  .dropdown-item:hover,
  .list-option:hover,
  [role='option']:hover,
  .combobox-option:hover,
  .combobox-option.is-active {
    /* aria-activedescendant target */
    background-color: Highlight;
    color: HighlightText; /* REQUIRED — always pair with Highlight */
  }

  /* ========================================
     ITEM — FOCUS STATE
     Focus ring only; background stays Canvas so
     focus is visible against the ring.
     ======================================== */
  .menu-item:focus,
  .menu-item:focus-visible,
  [role='menuitem']:focus,
  [role='menuitem']:focus-visible,
  .dropdown-item:focus,
  .dropdown-item:focus-visible,
  .list-option:focus,
  .list-option:focus-visible,
  [role='option']:focus,
  [role='option']:focus-visible,
  .combobox-option:focus,
  .combobox-option:focus-visible {
    background-color: Canvas;
    color: CanvasText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     ITEM — FOCUS + HOVER
     Hover background wins; focus ring still visible.
     ======================================== */
  .menu-item:focus:hover,
  .menu-item:focus-visible:hover,
  [role='menuitem']:focus:hover,
  [role='menuitem']:focus-visible:hover,
  .dropdown-item:focus:hover,
  .dropdown-item:focus-visible:hover,
  .list-option:focus:hover,
  .list-option:focus-visible:hover,
  [role='option']:focus:hover,
  [role='option']:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText; /* REQUIRED — always pair with Highlight */
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     ITEM — COMMITTED SELECTION (aria-selected)
     Use SelectedItem/SelectedItemText — NOT Highlight.
     Highlight is transient; SelectedItem is persistent.
     ======================================== */
  .list-option[aria-selected='true'],
  [role='option'][aria-selected='true'],
  .combobox-option[aria-selected='true'] {
    background-color: SelectedItem;
    color: SelectedItemText; /* REQUIRED — always pair with SelectedItem */
  }

  .list-option[aria-selected='true']:focus,
  .list-option[aria-selected='true']:focus-visible,
  [role='option'][aria-selected='true']:focus,
  [role='option'][aria-selected='true']:focus-visible,
  .combobox-option[aria-selected='true']:focus,
  .combobox-option[aria-selected='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     MENUITEMCHECKBOX / MENUITEMRADIO — CHECKED STATE
     aria-checked="true" = committed selection.
     Use SelectedItem/SelectedItemText — NOT Highlight.
     ======================================== */
  [role='menuitemcheckbox'][aria-checked='true'],
  [role='menuitemradio'][aria-checked='true'] {
    background-color: SelectedItem;
    color: SelectedItemText; /* REQUIRED — always pair with SelectedItem */
  }

  [role='menuitemcheckbox'][aria-checked='true'] svg,
  [role='menuitemcheckbox'][aria-checked='true'] [class*='icon'],
  [role='menuitemcheckbox'][aria-checked='true'] [class*='check'],
  [role='menuitemradio'][aria-checked='true'] svg,
  [role='menuitemradio'][aria-checked='true'] [class*='icon'],
  [role='menuitemradio'][aria-checked='true'] [class*='dot'] {
    forced-color-adjust: none;
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  [role='menuitemcheckbox'][aria-checked='true']:focus,
  [role='menuitemcheckbox'][aria-checked='true']:focus-visible,
  [role='menuitemradio'][aria-checked='true']:focus,
  [role='menuitemradio'][aria-checked='true']:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     ITEM — DISABLED STATE
     ======================================== */
  .menu-item[aria-disabled='true'],
  .dropdown-item[aria-disabled='true'],
  .list-option[aria-disabled='true'] {
    background-color: Canvas;
    color: GrayText;
  }

  /* ========================================
     ITEM — ICONS
     Icons must track their parent item's text color.
     ======================================== */
  .menu-item svg,
  [role='menuitem'] svg,
  .dropdown-item svg,
  .list-option svg,
  [role='option'] svg {
    fill: CanvasText;
    stroke: CanvasText;
  }

  .menu-item:hover svg,
  [role='menuitem']:hover svg,
  .dropdown-item:hover svg,
  .list-option:hover svg,
  [role='option']:hover svg,
  .combobox-option:hover svg,
  .combobox-option.is-active svg {
    fill: HighlightText; /* Track HighlightText, not CanvasText */
    stroke: HighlightText;
  }

  .list-option[aria-selected='true'] svg,
  [role='option'][aria-selected='true'] svg,
  .combobox-option[aria-selected='true'] svg {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }
}
```

### Combobox — Three-Part Breakdown

A combobox popup has three parts with different treatments:

| Part                    | `forced-color-adjust`   | Colors                                                                                                                       |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Text input field        | `none`                  | `Field` / `FieldText` / `ButtonBorder` border                                                                                |
| Toggle button (chevron) | `none`                  | `ButtonFace` / `ButtonText` / `ButtonBorder` border                                                                          |
| Listbox popup container | **NOT set**             | `Canvas` background, `CanvasText` border                                                                                     |
| Listbox option element  | `none` (on each option) | Default `Canvas`/`CanvasText`; hover `Highlight`/`HighlightText`; `aria-selected="true"` → `SelectedItem`/`SelectedItemText` |

See component-specific CSS in [aria-apg-patterns/combobox.md](aria-apg-patterns/combobox.md) (selection / filterable dropdowns) and [aria-apg-patterns/menu-button.md](aria-apg-patterns/menu-button.md) (action dropdowns with `role="menu"`).

---

## Display Components

### Avatar

```css
@media (forced-colors: active) {
  .avatar {
    background-color: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }

  /* Preserve original image colors */
  .avatar img {
    forced-color-adjust: none;
  }

  /* Initials fallback */
  .avatar-initials {
    color: CanvasText;
  }
}
```

### Badge

```css
@media (forced-colors: active) {
  .badge {
    background-color: Canvas;
    color: CanvasText;
    border: 2px solid CanvasText;
  }
}
```

### Icon

```css
@media (forced-colors: active) {
  /* Standalone / decorative icon */
  .icon {
    fill: CanvasText;
    stroke: CanvasText;
  }

  /* Icon inside a link */
  a .icon,
  [role='link'] .icon {
    fill: LinkText;
    stroke: LinkText;
  }

  a:visited .icon,
  [role='link']:visited .icon {
    fill: VisitedText;
    stroke: VisitedText;
  }

  a:active .icon,
  [role='link']:active .icon {
    fill: ActiveText;
    stroke: ActiveText;
  }
}
```
