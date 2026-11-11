# Design Principles

These rules apply to every generated widget without exception.
They extend and take precedence over any general styling guidance in the base skill.

## Aesthetic

Design for a **premium, minimalist feel**. Prioritise generous whitespace over density.
Every element should earn its space — if it doesn't serve the user, remove it.

## Color

**Never hardcode hex values or RGB literals.** Always use aiux-kit semantic utilities and DaisyUI tokens:

- Backgrounds → `bg-base-100`, `bg-base-200`, `var(--color-surface)`
- Text → `text-text-primary`, `text-text-tertiary`, `var(--color-text-secondary)`
- Brand → `text-primary`, `bg-primary`, `var(--primary)`

Hardcoded colors break dark mode and theme switching. There are no exceptions to this rule.

## Typography

- Body text → `font-sans`
- Widget headings → `font-sans`
- Use the standard Tailwind type scale: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Never set raw `font-size` values in CSS — use the scale

## Spacing

Build on the **4px / 8px grid**. Prefer Tailwind spacing scale values: `gap-2` (8px), `gap-4` (16px), `p-4` (16px), `p-6` (24px).
Give sections room to breathe — use `p-6` on the widget container, `gap-3` or `gap-4` between list items.

## Icons

Always render icons with `<aiux-icon name="icon-name" size="md">`.

- **Never use emoji** in place of icons
- **Never write inline `<svg>` or `<path d=...>`** when a catalog icon exists
- The icon catalog has **871 icons** — consult `icon-catalog.md` to find the right name
- Icons inherit `currentColor` — style the parent wrapper, not the icon element directly

## Widget Container

Every widget's outermost element must use this exact class string as its base:

```html
<div class="widget-container flex flex-col p-6 rounded-3xl"></div>
```

- `widget-container` — applies `background: var(--color-surface)`, `height: 100%`, and the card shadow via `static styles`
- `flex flex-col` — establishes the vertical layout
- `p-6` — consistent 24px internal padding
- `rounded-3xl` — standard card corner radius

Never replace `widget-container` with inline background or height styles.

## Scrollable Lists

Always wrap scrollable content in `<fade-scroll>` — never `overflow-y: auto` or `overflow-y: scroll` directly on a container.

```html
<!-- Correct -->
<fade-scroll class="flex-1 min-h-0">
  ${this.items?.map(item => this._renderItem(item))}
</fade-scroll>

<!-- Wrong -->
<div style="overflow-y: auto">...</div>
```
