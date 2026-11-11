# CSS Custom Properties — Color Tokens & Design System

Ground-truth token reference derived from production apps (AICT) and platform widget components (ai-experience-components). Use these tokens in `static styles` CSS. Always provide a hardcoded hex fallback in case the token is not injected yet.

---

## Color Tokens — Semantic (most-used)

These are the tokens used heavily across both production repos. Use semantic tokens over raw palette tokens whenever possible.

### Text / Content

| Token                            | Purpose                                         | Fallback  |
| -------------------------------- | ----------------------------------------------- | --------- |
| `var(--color-text-primary)`      | Default / primary text — body, headings, labels | `#000`    |
| `var(--color-text-secondary)`    | Secondary / subdued text                        | `#4d4c4a` |
| `var(--color-text-tertiary)`     | Hint text, timestamps, captions                 | `#656462` |
| `var(--color-primary-content)`   | Text on primary-colored backgrounds             | `#fff`    |
| `var(--color-secondary-content)` | Text on secondary-colored backgrounds           | `#1e293b` |
| `var(--color-neutral-content)`   | Text on neutral backgrounds                     | `#fff`    |

**Rule:** `--color-text-primary` is the default for all body text. Use `--color-text-secondary/tertiary` only when you need explicit semantic intent (e.g. a card title vs a caption vs a timestamp).

### Backgrounds / Surfaces

| Token                                    | Purpose                                     | Fallback  |
| ---------------------------------------- | ------------------------------------------- | --------- |
| `var(--color-base-100)`                  | Card / panel background (primary surface)   | `#fff`    |
| `var(--color-base-200)`                  | Page background, hover state, muted section | `#f2f2f2` |
| `var(--color-base-300)`                  | Borders, dividers, input backgrounds        | `#e5e7eb` |
| `var(--color-background-primary)`        | Component's own background (nav, overlays)  | `#fff`    |
| `var(--color-background-primary-raised)` | Slightly elevated surface (activity stream) | `#F4F3F0` |
| `var(--color-background-tertiary)`       | Skeleton base, subtle borders               | `#e2e8f0` |
| `var(--color-background-inverse)`        | Tooltip background                          | `#1e293b` |

**Card surfaces:** `bg-base-100` (Tailwind) or `var(--color-base-100, #fff)` in CSS.

### Brand / Interactive

| Token                    | Purpose                | Fallback  |
| ------------------------ | ---------------------- | --------- |
| `var(--color-primary)`   | Primary action color   | `#007b9e` |
| `var(--color-secondary)` | Secondary action color | `#e2e8f0` |
| `var(--color-neutral)`   | Neutral elements       | `#1e293b` |
| `var(--color-accent)`    | Accent highlights      | —         |

### Status / Feedback

| Token                  | Purpose       | Fallback  |
| ---------------------- | ------------- | --------- |
| `var(--color-success)` | Success state | `#22c55e` |
| `var(--color-warning)` | Warning state | `#f59e0b` |
| `var(--color-error)`   | Error state   | `#be0003` |
| `var(--color-info)`    | Info state    | `#60a5fa` |

### Borders

| Token                         | Purpose               | Fallback  |
| ----------------------------- | --------------------- | --------- |
| `var(--color-border-default)` | Default border        | `#8A8986` |
| `var(--color-border-subtle)`  | Subtle / light border | `#E3E2DF` |

### Neutral Palette (raw — use sparingly)

| Token                | Fallback  |
| -------------------- | --------- |
| `var(--neutral-50)`  | `#F8F7F4` |
| `var(--neutral-300)` | `#cbd5e1` |
| `var(--neutral-400)` | `#94a3b8` |

---

## Typography Tokens

Use typography tokens for font size, weight, and line-height in `static styles`.

### Font Size + Line Height

| Token              | Value | Line height token               |
| ------------------ | ----- | ------------------------------- |
| `var(--text-xs)`   | ~12px | `var(--text-xs--line-height)`   |
| `var(--text-sm)`   | ~14px | `var(--text-sm--line-height)`   |
| `var(--text-base)` | ~16px | `var(--text-base--line-height)` |
| `var(--text-lg)`   | ~18px | `var(--text-lg--line-height)`   |
| `var(--text-xl)`   | ~20px | `var(--text-xl--line-height)`   |
| `var(--text-4xl)`  | ~36px | `var(--text-4xl--line-height)`  |

### Font Weight

| Token                        | Value |
| ---------------------------- | ----- |
| `var(--font-weight-light)`   | 300   |
| `var(--font-weight-normal)`  | 400   |
| `var(--font-weight-regular)` | 400   |
| `var(--font-weight-medium)`  | 500   |

### Font Family

| Token                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `var(--font-sans)`       | Default sans-serif (Inter, system-ui)     |
| `var(--font-servicenow)` | ServiceNow brand font ("ServiceNow Sans") |

**When to use `--font-servicenow`:** Page-level headings, nav app titles. Body text always uses `--font-sans`.

### Usage in `static styles`

```js
static styles = css`
  .card-title {
    font-family: var(--font-servicenow);
    font-size: var(--text-lg);
    font-weight: var(--font-weight-normal);
    line-height: var(--text-lg--line-height);
    color: var(--color-text-primary, #1e293b);
  }

  .card-description {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-normal);
    line-height: var(--text-sm--line-height);
    color: var(--color-text-tertiary, #475569);
  }
`;
```

---

## Motion Tokens

Use these for all transitions and animations.

| Token                      | Purpose                              |
| -------------------------- | ------------------------------------ |
| `var(--duration-xs)`       | Micro interactions (hover highlight) |
| `var(--duration-sm)`       | Fast transitions (collapse)          |
| `var(--duration-md)`       | Default transition                   |
| `var(--duration-lg)`       | Expand animations                    |
| `var(--duration-3xl)`      | Skeleton shimmer loop                |
| `var(--ease-medium-accel)` | Card hover, sidebar toggle           |
| `var(--ease-enter)`        | Enter animations                     |
| `var(--ease-out)`          | Exit animations                      |

```js
static styles = css`
  .nav-button {
    transition: background-color var(--duration-sm) linear;
  }

  .item-card:hover {
    transform: translateX(4px);
    transition: transform var(--duration-md) var(--ease-medium-accel);
  }

  .skeleton::after {
    animation: shimmer var(--duration-3xl) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-button, .item-card { transition: none; }
    .skeleton::after { animation: none; }
  }
`;
```

---

## Spacing Token

| Token            | Value           | Usage                       |
| ---------------- | --------------- | --------------------------- |
| `var(--spacing)` | `0.25rem` (4px) | Multiply for spacing values |

```js
// Manual spacing utilities (when Tailwind can't be used in static styles)
static styles = css`
  .gap-3 { gap: calc(var(--spacing, 0.25rem) * 3); }   /* = 12px */
  .p-4  { padding: calc(var(--spacing, 0.25rem) * 4); } /* = 16px */
`;
```

**Note:** In templates, prefer Tailwind utilities (`gap-3`, `p-4`). Only write manual spacing classes when building layout that can't use Tailwind (e.g. inside `static styles` for custom component internals like the sidebar).

---

## Radius Tokens

| Token               | Value            |
| ------------------- | ---------------- |
| `var(--radius-lg)`  | `0.5rem` (8px)   |
| `var(--radius-xl)`  | `0.75rem` (12px) |
| `var(--radius-2xl)` | `1rem` (16px)    |

---

## `:host` Rules

Every component **must** declare `:host` in `static styles`. The correct value depends on page type:

| Page / Component type | `:host` display                                                 | Why                                                |
| --------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Standard page         | `display: block`                                                | Default                                            |
| Home / dashboard      | `display: block; min-height: 100%; container-type: inline-size` | Responsive containers                              |
| List page             | `display: contents`                                             | `aiux-list-connected` needs to inherit flex height |
| Record page           | `display: block; height: 100%`                                  | Fill parent height                                 |
| Widget                | `display: block; height: 100%`                                  | Fill dashboard cell                                |
| Simple component      | `display: block`                                                | Default                                            |

```js
// Page with responsive containers
static styles = css`
  :host {
    display: block;
    min-height: 100%;
    container-type: inline-size;
  }
`;

// List page — MUST be contents
static styles = css`
  :host {
    display: contents;
  }
`;

// Widget
static styles = css`
  :host {
    display: block;
    height: 100%;
  }
  .widget-container {
    height: 100%;
  }
`;
```

---

## Practical Patterns from Production

### Card (correct pattern — from real AICT app)

```html
<!-- bg-base-100 + shadow-sm is the real production card pattern -->
<div class="aiux-card bg-base-100 shadow-sm">
  <div class="aiux-card-body p-6">
    <h2 class="aiux-card-title text-text-primary">
      ${i18n.getMessage('Card Title')}
    </h2>
    <p class="text-sm text-text-tertiary">${description}</p>
  </div>
</div>
```

### Widget heading (from platform widgets)

```html
<!-- text-sm + font-medium + text-text-secondary -->
<span class="text-sm font-medium text-text-secondary">
  ${i18n.getMessage('Widget Title')}
</span>
```

### Status badge with soft variant

```html
<span class="aiux-badge aiux-badge-sm aiux-badge-success aiux-badge-soft gap-1">
  <aiux-icon name="check-outline" size="sm"></aiux-icon>
  ${i18n.getMessage('Active')}
</span>
```

### Skeleton loader (with motion)

```js
static styles = css`
  .skeleton {
    position: relative;
    overflow: hidden;
  }
  .skeleton::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--color-background-tertiary, #e2e8f0);
    border-radius: inherit;
    opacity: 0.5;
    animation: skeleton-bg-pulse 1.5s ease-in-out infinite;
  }
  @keyframes skeleton-bg-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton::before { animation: none; }
  }
`;
```

### Error / alert

```html
<div class="aiux-alert aiux-alert-error aiux-alert-soft">
  <aiux-icon name="triangle-exclamation-outline" size="sm"></aiux-icon>
  <span>${this._error}</span>
</div>
```

### Loading spinner inline

```html
<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>
```

### Toast

```html
<div class="aiux-toast aiux-toast-top aiux-toast-center z-50">
  <div class="aiux-alert aiux-alert-success aiux-alert-soft">
    ${message}
    <button
      class="aiux-btn aiux-btn-sm aiux-btn-circle aiux-btn-ghost"
      @click="${dismiss}"
    >
      ✕
    </button>
  </div>
</div>
```

### Icon-only button (with a11y)

```html
<button
  class="aiux-btn aiux-btn-ghost aiux-btn-sm aiux-btn-square"
  aria-label=${i18n.getMessage('Delete')}
  @click=${this._handleDelete}
>
  <aiux-icon name="trash-outline" size="sm" aria-hidden="true"></aiux-icon>
</button>
```

### Responsive container query grid

```js
static styles = css`
  :host {
    display: block;
    container-type: inline-size;
  }
  .grid-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  @container (min-width: 1024px) {
    .grid-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @container (min-width: 1280px) {
    .grid-cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`;
```

---

## Token Quick Reference

| Intent                   | Use                                                            |
| ------------------------ | -------------------------------------------------------------- |
| White background / card  | `bg-base-100` / `var(--color-base-100, #fff)`                  |
| Light grey / page bg     | `bg-base-200` / `var(--color-base-200, #f2f2f2)`               |
| Border colour            | `border-base-300` / `var(--color-base-300, #e5e7eb)`           |
| Default text             | `text-text-primary` / `var(--color-text-primary, #000)`        |
| Primary heading text     | `text-text-primary` / `var(--color-text-primary, #000)`        |
| Subdued / secondary text | `text-text-secondary` / `var(--color-text-secondary, #4d4c4a)` |
| Hint / caption text      | `text-text-tertiary` / `var(--color-text-tertiary, #656462)`   |
| Muted (partial opacity)  | `text-text-tertiary`                                           |
| Font family              | `var(--font-sans)`                                             |
| ServiceNow brand font    | `var(--font-servicenow)`                                       |
| Font size — small        | `var(--text-sm, 14px)`                                         |
| Font size — normal       | `var(--text-base, 16px)`                                       |
| Font size — large        | `var(--text-lg, 18px)`                                         |
| Font weight — normal     | `var(--font-weight-normal, 400)`                               |
| Font weight — medium     | `var(--font-weight-medium, 500)`                               |
| Transition — fast        | `var(--duration-sm) linear`                                    |
| Transition — standard    | `var(--duration-md) var(--ease-medium-accel)`                  |
| Spacing unit             | `calc(var(--spacing, 0.25rem) * N)`                            |
| Border radius            | `var(--radius-xl, 0.75rem)`                                    |
