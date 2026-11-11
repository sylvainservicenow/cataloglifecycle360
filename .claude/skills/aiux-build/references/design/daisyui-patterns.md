# DaisyUI Patterns

DaisyUI component patterns for AIUX apps. All classes use the `aiux-` prefix (DaisyUI v5).

**Source of truth:** The project's `@servicenow/aiux` dependency (declared in `package.json`). This metapackage transitively provides the `tailwind.css` with `@source inline()` safelists. Only classes registered there are available at runtime. Always verify against the installed metapackage — do NOT assume availability.

---

## Prefix Convention

All DaisyUI classes in AIUX use the `aiux-` prefix:

```html
<!-- Standard DaisyUI → AIUX prefixed -->
<button class="aiux-btn aiux-btn-primary">Click</button>
<div class="aiux-card aiux-card-border">...</div>
<span class="aiux-badge aiux-badge-success">Active</span>
```

### Safelist Registration

DaisyUI classes must be registered via `@source inline()` in the project's `tailwind.css` to prevent tree-shaking. This file is provided transitively through `@servicenow/aiux` in `package.json`. After `pnpm install`, check the resolved `tailwind.css` in `node_modules` to see which classes are safelisted for the installed version.

---

## Component Reference

The table below reflects the `@servicenow/aiux` metapackage safelist at `components/core/src/styles/tailwind.css`. Verify against the installed version — run the commands in "Verifying Availability" below.

### Buttons & Actions

| Component | Classes                                                                                                        | Notes                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Button    | `aiux-btn aiux-btn-{primary,secondary,ghost,outline,soft,dash,link,neutral,accent,info,success,warning,error}` | Sizes: `xs,sm,md,lg,xl`. Shapes: `wide,block,square,circle` |
| Pill      | `aiux-pill aiux-pill-{active,disabled,primary}`                                                                | Sizes: `xs,sm,md,lg,xl`                                     |
| Link      | `aiux-link aiux-link-{hover,neutral,primary,secondary,accent,info,success,warning,error}`                      | —                                                           |

### Form Controls

| Component  | Classes                                                                                     | Notes                                         |
| ---------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Input      | `aiux-input aiux-input-{ghost,neutral,primary,secondary,accent,info,success,warning,error}` | Sizes: `xs,sm,md,lg`                          |
| Textarea   | `aiux-textarea`                                                                             | Same variant/size pattern as input            |
| Select     | `aiux-select`                                                                               | Same variant/size pattern. Sizes include `xl` |
| File Input | `aiux-file-input`                                                                           | Same variant/size pattern                     |
| Checkbox   | `aiux-checkbox aiux-checkbox-{primary,secondary,accent,neutral,success,warning,info,error}` | Sizes: `xs,sm,md,lg,xl`                       |
| Radio      | `aiux-radio`                                                                                | Same variant/size pattern as checkbox         |
| Toggle     | `aiux-toggle aiux-toggle-{primary,secondary,accent,neutral,success,warning,info,error}`     | Sizes: `xs,sm,md,lg,xl`                       |
| Range      | `aiux-range`                                                                                | Same variant/size pattern                     |
| Label      | `aiux-label`, `aiux-floating-label`                                                         | —                                             |
| Fieldset   | `aiux-fieldset aiux-fieldset-{legend,label}`                                                | —                                             |
| Validator  | `aiux-validator aiux-validator-hint`                                                        | —                                             |
| Rating     | `aiux-rating aiux-rating-{half,hidden}`                                                     | Sizes: `xs,sm,md,lg`                          |

### Data Display

| Component   | Classes                                                                                                   | Notes                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Card        | `aiux-card aiux-card-{border,dash,side}`                                                                  | Parts: `title,body,actions`. Sizes: `xs,sm,md,lg,xl`                                       |
| Card Header | `aiux-card-header aiux-card-header-{title,subtitle}`                                                      | Structured header inside card                                                              |
| Badge       | `aiux-badge aiux-badge-{primary,secondary,accent,neutral,ghost,info,success,warning,error,moderate,high}` | Variants: `outline,dash,soft`. Sizes: `xs,sm,md,lg,xl`                                     |
| Status      | `aiux-status aiux-status-{primary,secondary,accent,info,success,warning,error}`                           | Sizes: `xs,sm,md,lg`                                                                       |
| Table       | `aiux-table aiux-table-{zebra,pin-rows,pin-cols}`                                                         | Sizes: `xs,sm,md,lg,xl`                                                                    |
| List        | `aiux-list aiux-list-{row,col-grow}`                                                                      | —                                                                                          |
| Stats       | `aiux-stats aiux-stats-{horizontal,vertical}`                                                             | Items: `aiux-stat aiux-stat-{title,value,desc,figure,actions}`                             |
| Avatar      | `aiux-avatar aiux-avatar-{group,online,offline,placeholder,available,away,busy}`                          | —                                                                                          |
| Kbd         | `aiux-kbd`                                                                                                | Sizes: `xs,sm,md,lg,xl`                                                                    |
| Countdown   | `aiux-countdown`                                                                                          | —                                                                                          |
| Timeline    | `aiux-timeline aiux-timeline-{horizontal,vertical,compact,snap-icon}`                                     | Parts: `aiux-timeline-{start,middle,end,box}`                                              |
| Steps       | `aiux-steps aiux-steps-{horizontal,vertical}`                                                             | Items: `aiux-step aiux-step-{neutral,primary,secondary,accent,info,success,warning,error}` |

### Feedback & Loading

| Component | Classes                                                                                     | Notes                                                                   |
| --------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Alert     | `aiux-alert aiux-alert-{info,success,warning,error,outline,dash,soft,vertical,horizontal}`  | —                                                                       |
| Loading   | `aiux-loading aiux-loading-{spinner,dots,ring,ball,bars,infinity}`                          | Sizes: `xs,sm,md,lg,xl`                                                 |
| Skeleton  | `aiux-skeleton aiux-skeleton-{text,primary,pulse}`                                          | Extended: `list,title,item,circle,card`. Reveal: `aiux-skeleton-reveal` |
| Progress  | `aiux-progress aiux-progress-{primary,secondary,accent,neutral,info,success,warning,error}` | —                                                                       |
| Tooltip   | `aiux-tooltip aiux-tooltip-{content,top,bottom,left,right,open}`                            | Color variants available                                                |

### Navigation & Layout

| Component   | Classes                                                                                         | Notes                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Dropdown    | `aiux-dropdown aiux-dropdown-{content,start,center,end,top,bottom,left,right,hover,open,close}` | —                                                                             |
| Menu        | `aiux-menu aiux-menu-{title,active,focus,disabled,dropdown,dropdown-show,dropdown-toggle}`      | Sizes: `xs,sm,md,lg`. Directions: `horizontal,vertical`                       |
| Tabs        | `aiux-tabs aiux-tabs-{box,border,lift}`                                                         | Sizes: `xs,sm,md,lg,xl`. Items: `aiux-tab aiux-tab-{active,disabled,content}` |
| Breadcrumbs | `aiux-breadcrumbs`                                                                              | —                                                                             |
| Pagination  | `aiux-pagination`                                                                               | —                                                                             |
| Collapse    | `aiux-collapse aiux-collapse-{title,content,arrow,plus,open,close}`                             | Prefer native `<details>/<summary>`                                           |
| Divider     | `aiux-divider aiux-divider-{vertical,horizontal,start,end}`                                     | Color variants available                                                      |
| Indicator   | `aiux-indicator aiux-indicator-{item,start,center,end,top,middle,bottom}`                       | —                                                                             |
| Join        | `aiux-join aiux-join-{item,vertical,horizontal}`                                                | —                                                                             |
| Carousel    | `aiux-carousel aiux-carousel-{item,start,center,end,vertical}`                                  | Also: `nav-btn`, `indicator`                                                  |
| Stack       | `aiux-stack aiux-stack-{top,end}`                                                               | —                                                                             |

### Overlays

| Component | Classes                                                                               | Notes                                                                                   |
| --------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Modal     | `aiux-modal aiux-modal-{box,action,backdrop,toggle,open,top,middle,bottom,start,end}` | Use native `<dialog>`                                                                   |
| Toast     | `aiux-toast aiux-toast-{top,bottom,middle,start,center,end}`                          | —                                                                                       |
| Chat      | `aiux-chat aiux-chat-{start,end,image,header,footer,bubble}`                          | Bubble colors: `aiux-chat-bubble-{primary,secondary,accent,info,success,warning,error}` |

### Utilities

`aiux-rounded-box`

---

## Verifying Availability

The safelist lives in the installed metapackage at `node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css`. Always verify before using a class:

```bash
# Confirm the file exists
ls node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css

# Search for a specific class
grep "aiux-skeleton" node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css
```

If a class is not safelisted, it will be tree-shaken and silently fail at runtime. Options:

1. Use an alternative that IS safelisted
2. Implement the styles manually in the component's `static styles`
3. Request the platform team add it to the metapackage

---

## Accessibility Requirements Per Component

### Buttons

- Visible focus ring (`:focus-visible`)
- `aria-label` when icon-only
- `aria-disabled="true"` + `pointer-events: none` instead of `disabled` attribute when needed

### Modals

```html
<dialog
  class="aiux-modal"
  aria-modal="true"
  role="dialog"
  aria-labelledby="modal-title"
>
  <div class="aiux-modal-box">
    <h3 id="modal-title">${i18n.getMessage('Confirm Action')}</h3>
    <div class="aiux-modal-action">
      <button class="aiux-btn" @click="${this._close}">
        ${i18n.getMessage('Cancel')}
      </button>
      <button class="aiux-btn aiux-btn-primary" @click="${this._confirm}">
        ${i18n.getMessage('Confirm')}
      </button>
    </div>
  </div>
</dialog>
```

### Toggles

- Always pair with a visible `<label>`
- Use `role="switch"` and `aria-checked`

### Tabs

- `role="tablist"` on container
- `role="tab"` + `aria-selected` on each tab
- `role="tabpanel"` on content

---

## Key Rules

1. **Semantic colors directly** — `bg-primary`, `bg-success`, etc.
2. **DaisyUI components carry their own rounding** — add only classes that change the component's variant or size
3. **Card surfaces** — `bg-base-100 shadow-sm`
4. **Collapse** — native `<details>/<summary>` elements
5. **Tooltips** — tooltip directive from `@servicenow/aiux-directive-tooltip`
6. **Disabled state** — native `disabled` attribute on the element
7. **Skeleton loaders** — `aiux-skeleton` class; for animated variants use `static styles` CSS (see `css-custom-properties.md`)
8. **Modals** — `<dialog>` element
9. **Non-blocking alerts** — `aiux-alert aiux-alert-{info|success|warning|error} aiux-alert-soft`
10. **Status chips** — `aiux-badge aiux-badge-sm aiux-badge-{success|warning|error} aiux-badge-soft`
11. **Async loading in buttons** — add `aiux-loading aiux-loading-spinner aiux-loading-xs` inside the button while `_saving` is true

---

## Card Pattern

```html
<!-- Elevated card -->
<div class="aiux-card bg-base-100 shadow-sm">
  <div class="aiux-card-body p-6">
    <h2 class="aiux-card-title text-base font-medium text-text-primary">
      ${i18n.getMessage('Card Title')}
    </h2>
    <p class="text-sm text-text-tertiary">${this._description}</p>
    <div class="aiux-card-actions justify-end mt-2">
      <button class="aiux-btn aiux-btn-primary aiux-btn-sm">
        ${i18n.getMessage('Action')}
      </button>
    </div>
  </div>
</div>

<!-- Bordered card -->
<div class="aiux-card aiux-card-border bg-base-100">
  <div class="aiux-card-body">...</div>
</div>

<!-- Card wrapping slotted content -->
<div class="aiux-card bg-base-100 shadow-sm">
  <slot></slot>
</div>
```

---

## Badge Pattern

```html
<span class=${classMap({
  'aiux-badge': true,
  'aiux-badge-success': this._status === 'active',
  'aiux-badge-warning': this._status === 'pending',
  'aiux-badge-error': this._status === 'error'
})}>
  ${this._statusLabel}
</span>
```

---

## Dropdown Menu Pattern

```html
<div class="aiux-dropdown aiux-dropdown-end">
  <button tabindex="0" class="aiux-btn aiux-btn-ghost aiux-btn-sm">
    <aiux-icon name="ellipsis-vertical-outline" size="sm"></aiux-icon>
  </button>
  <ul
    tabindex="0"
    class="aiux-dropdown-content aiux-menu p-2 shadow bg-base-100 rounded-box w-52"
  >
    <li><a @click="${this._handleEdit}">${i18n.getMessage('Edit')}</a></li>
    <li><a @click="${this._handleDelete}">${i18n.getMessage('Delete')}</a></li>
  </ul>
</div>
```
