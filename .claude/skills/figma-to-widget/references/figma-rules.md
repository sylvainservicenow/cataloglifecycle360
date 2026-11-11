# Figma-to-Widget Rules

Rules that apply specifically when generating a widget from a Figma design.

---

## Real Data — Always Preferred

Use real ServiceNow table data. If the Figma design shows incidents, pull from the incident table. If it shows tasks, pull from task. Derive the appropriate table and fields from the design content.

- **Do not hardcode mock data** — fetch from the actual ServiceNow table the design represents
- Identify the table from the visible data in the design (e.g. INC numbers → `incident`, CHG numbers → `change_request`, tasks → `task`)
- Query only the fields the widget actually renders — keep the server call lean

A minimal fallback to an empty array (not fabricated records) is acceptable for error states:

```js
async fetchData() {
  try {
    this.loading = true
    const response = await this.server.get({ action: 'getData' })
    this.items = response.data?.items ?? []
  } catch {
    this.items = []
    this.error = this.i18n.getMessage('Failed to load data')
  } finally {
    this.loading = false
  }
}
```

---

## Template Safety — Always Required

Every array or object access inside a Lit template MUST use optional chaining.

```js
// CORRECT
${this.items?.map(item => html`...`)}
${this.data?.total ?? 0}
${this.user?.name ?? ''}
${this.items?.length ? this.items.map(i => this._renderItem(i)) : ''}

// WRONG
${this.items.map(...)}
${this.data.total}
${this.user.name}
```

Initialise **every** property used in the template inside the constructor, even if the initial value is `null` or `[]`:

```js
constructor() {
  super()
  this.items = []
  this.total = 0
  this.user = null
  this.loading = false
  this.error = ''
}
```

---

## Icons from Blueprint

The blueprint component tree marks icons in two ways — handle both:

### Matched icons — `aiux-icon[name]`

Render as:

```html
<aiux-icon name="name" size="sm"></aiux-icon>
```

Use `size="sm"` for list/inline icons, `size="md"` for standalone or header icons.

### Unmatched icons — `icon?`

The translator could not identify the icon from the layer name. Either:

- Pick the most semantically appropriate name from the icon catalog, **or**
- Add a comment: `<!-- TODO: custom icon -->`

Never leave `icon?` as a literal string in the output.

---

## Typography Fidelity — Always Required

The blueprint's Tailwind classes are the source of truth for typography. They are pre-mapped directly from Figma. Do not override or supplement them.

**Font weight — use only what the blueprint provides:**

```js
// CORRECT — blueprint says class="text-sm text-text-tertiary", use exactly that
html`<span class="text-sm text-text-tertiary">${...}</span>`

// WRONG — blueprint has no font-weight class, do not add one
html`<span class="text-sm font-semibold text-text-tertiary">${...}</span>`
// WRONG — blueprint says font-normal, do not upgrade to font-bold for a "heading"
html`<h3 class="text-base font-bold">${...}</h3>`
```

**Sibling text elements with different classes — keep them separate:**

When the blueprint shows two adjacent text nodes with different Tailwind classes (e.g. a large bold number and a small muted denominator), render them as two distinct elements inside a flex container. Never concatenate them into one element.

```js
// Blueprint shows:
//   span  class="text-4xl font-bold text-text-primary"  → "87"
//   span  class="text-sm text-text-tertiary"          → "/543"

// CORRECT
html` <div class="flex items-baseline gap-1">
  <span class="text-4xl font-bold text-text-primary"
    >${this.i18n.getMessage('{0}', [this.widgetData?.current ?? 87])}</span
  >
  <span class="text-sm text-text-tertiary"
    >${this.i18n.getMessage('/{0}', [this.widgetData?.total ?? 543])}</span
  >
</div>`;

// WRONG — loses the size difference
html`<span class="text-sm text-text-tertiary"
  >${this.widgetData?.current}/${this.widgetData?.total}</span
>`;
```

---

## Internationalisation — Always Required

Every piece of user-facing text must be wrapped in `i18n.getMessage()`. Never output a raw string literal in the template.

```js
// CORRECT
html`<span>${this.i18n.getMessage('Tasks needing attention')}</span>`;
html`<span>${this.i18n.getMessage('Due {0}', [item.dueDate])}</span>`;

// WRONG
html`<span>Tasks needing attention</span>`;
```

This applies to: headings, labels, button text, status text, empty states, error messages, and tooltips.

---

## Data Fetching — Always Required

Every widget must call the server in `fetchData()` using:

```js
async fetchData() {
  try {
    this.loading = true
    const response = await this.server.get({ action: 'getData' })
    this.items = response.data?.items ?? []
  } catch {
    this.items = []
    this.error = this.i18n.getMessage('Failed to load data')
  } finally {
    this.loading = false
  }
}
```

- Action name must be `'getData'` unless the design clearly implies a different name
- Fall back to an empty array on error — do not fabricate hardcoded records
- Show an error message on failure rather than silently hiding it

---

## Skeleton Loader — Always Required

Every widget must show a skeleton loading state while `fetchData()` is in progress.

- The skeleton must mirror the **actual layout structure** — same number of rows, same column arrangement
- Use `bg-base-200 animate-pulse rounded` for skeleton blocks
- Guard with `this.loading` in the render method:

```js
import {repeat} from 'lit/directives/repeat.js';

if (this.loading)
  return html`<div class="widget-container ...">
    ${repeat(
      [1, 2, 3],
      i => i,
      () => html`
        <div class="flex items-center gap-3 p-3">
          <div class="w-8 h-8 bg-base-200 animate-pulse rounded-full"></div>
          <div class="flex-1 h-4 bg-base-200 animate-pulse rounded"></div>
        </div>
      `
    )}
  </div>`;
```

---

## Class and Element Naming — Always Required

The prompt header provides the exact class name to use:

```
Create widget "My Widget" (class: MyWidget, element: my-widget)
```

- Use **exactly** the class name given — do not add prefixes, suffixes, or rename it
- Never invent a different name, even if it seems more descriptive

```js
// Prompt says: class: TasksNeedingAttention

// CORRECT
class TasksNeedingAttention extends BaseWidgetElement { ... }
```

---

## Return Format

Return ONLY the JavaScript code for `index.js`.

- No markdown fences, no ` ```js ` blocks
- No file name header, no explanations, no plan text
- No "Here is the widget:", no "I've implemented:", no commentary of any kind
- Start immediately with the import statement
- End with the last line of JavaScript — nothing after it
