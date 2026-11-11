# Tailwind CSS Reference

Utility class categories commonly used in AIUX apps. Prefer Tailwind utilities in templates over `@apply` in `static styles`.

---

## Layout

| Class             | Purpose                       |
| ----------------- | ----------------------------- |
| `flex`            | Flexbox container             |
| `flex-col`        | Column direction              |
| `flex-row`        | Row direction                 |
| `flex-wrap`       | Allow wrapping                |
| `flex-1`          | Grow to fill                  |
| `flex-shrink-0`   | Prevent shrinking             |
| `grid`            | Grid container                |
| `grid-cols-2/3/4` | Grid columns                  |
| `items-center`    | Align items vertically center |
| `items-start/end` | Align to start/end            |
| `justify-center`  | Justify center                |
| `justify-between` | Space between items           |
| `justify-end`     | Justify end                   |

---

## Spacing

| Class                          | Purpose                          |
| ------------------------------ | -------------------------------- |
| `p-1/2/3/4/6/8`                | Padding all sides                |
| `px-*`, `py-*`                 | Horizontal/vertical padding      |
| `pt-*`, `pb-*`, `pl-*`, `pr-*` | Individual side padding          |
| `m-*`                          | Margin (same pattern as padding) |
| `gap-1/2/3/4`                  | Gap between flex/grid children   |
| `space-x-*`, `space-y-*`       | Space between children           |

---

## Typography

| Class                        | Purpose               |
| ---------------------------- | --------------------- |
| `text-xs`                    | 12px                  |
| `text-sm`                    | 14px                  |
| `text-base`                  | 16px                  |
| `text-lg`                    | 18px                  |
| `text-xl`                    | 20px                  |
| `font-normal`                | 400 weight            |
| `font-medium`                | 500 weight            |
| `font-semibold`              | 600 weight            |
| `font-bold`                  | 700 weight            |
| `leading-tight/snug/normal`  | Line height           |
| `tracking-tight/normal/wide` | Letter spacing        |
| `truncate`                   | Ellipsis overflow     |
| `line-clamp-2/3`             | Multi-line truncation |

---

## Sizing

| Class               | Purpose                               |
| ------------------- | ------------------------------------- |
| `w-full`            | 100% width                            |
| `w-1/2`, `w-1/3`    | Fractional widths                     |
| `w-48`, `w-64`      | Fixed widths                          |
| `h-full`            | 100% height                           |
| `h-screen`          | Viewport height                       |
| `min-h-0`           | Reset min-height (important for flex) |
| `max-w-sm/md/lg/xl` | Max width                             |

---

## Borders & Rounding

| Class             | Purpose                              |
| ----------------- | ------------------------------------ |
| `rounded`         | Small border radius                  |
| `rounded-lg`      | Large border radius                  |
| `rounded-full`    | Circular                             |
| `rounded-box`     | DaisyUI box radius token             |
| `border`          | 1px border                           |
| `border-2`        | 2px border                           |
| `border-base-300` | Theme-aware border color             |
| `divide-y`        | Horizontal dividers between children |

---

## Colors (DaisyUI Semantic)

Use DaisyUI semantic color classes. These adapt automatically to light/dark themes.

### Background

| Class                                                | Purpose                                      |
| ---------------------------------------------------- | -------------------------------------------- |
| `bg-base-100`                                        | Card / panel surface                         |
| `bg-base-200`                                        | Page background, hover state, muted sections |
| `bg-base-300`                                        | Input background, skeleton base              |
| `bg-primary`                                         | Primary action / hero sections               |
| `bg-secondary`                                       | Secondary action                             |
| `bg-success` / `bg-error` / `bg-warning` / `bg-info` | Status backgrounds                           |

### Text

| Class                    | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `text-text-primary`      | Default body text, headings, labels         |
| `text-text-secondary`    | Secondary / subdued text                    |
| `text-text-tertiary`     | Hint text, timestamps, captions, muted text |
| `text-primary`           | Brand-color text                            |
| `text-error`             | Error text                                  |
| `text-success`           | Success text                                |
| `text-warning`           | Warning text                                |
| `text-primary-content`   | Text on primary-colored backgrounds         |
| `text-secondary-content` | Text on secondary-colored backgrounds       |

### Border

| Class                             | Purpose              |
| --------------------------------- | -------------------- |
| `border-base-200`                 | Light border         |
| `border-base-300`                 | Standard border      |
| `border-base-content`             | High contrast border |
| `border-error` / `border-success` | Status borders       |

---

## Visibility & Overflow

| Class             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `hidden`          | Display none                                           |
| `invisible`       | Invisible but takes space                              |
| `overflow-hidden` | Clip overflow                                          |
| `overflow-y-auto` | Vertical scroll (but prefer `<fade-scroll>` for lists) |

---

## Responsive

| Prefix | Breakpoint |
| ------ | ---------- |
| `sm:`  | 640px      |
| `md:`  | 768px      |
| `lg:`  | 1024px     |
| `xl:`  | 1280px     |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
```

---

## Motion

| Class                           | Purpose                   |
| ------------------------------- | ------------------------- |
| `transition-all`                | Transition all properties |
| `duration-200`                  | 200ms transition          |
| `ease-in-out`                   | Easing function           |
| `motion-reduce:transition-none` | Remove motion for a11y    |
