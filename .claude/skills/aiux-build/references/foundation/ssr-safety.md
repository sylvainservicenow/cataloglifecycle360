# SSR Safety

AIUX apps use server-side rendering (SSR). Guard browser-only APIs so components run safely in both environments.

---

## The Guard

```js
import {isServer} from 'lit';
```

Use `isServer` from `lit` — not custom checks like `typeof window !== 'undefined'`.

---

## Where Guards ARE Required

| Location                   | Why                                      |
| -------------------------- | ---------------------------------------- |
| `constructor()`            | Runs on server during SSR                |
| `render()`                 | Runs on server to produce HTML           |
| `connectedCallback()`      | Runs on server for Lit SSR               |
| `willUpdate(changed)`      | Runs on server before render             |
| `static async loader(ctx)` | Runs on server blocking SSR              |
| Top-level module scope     | Evaluated on import in both environments |

```js
connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    window.addEventListener('resize', this._onResize);
    this._observer = new IntersectionObserver(this._cb);
  }
}

static async loader(ctx) {
  if (isServer) return {};  // skip client-only logic
  const stored = localStorage.getItem('prefs');
  return {prefs: JSON.parse(stored)};
}
```

---

## Where Guards Are NOT Required

| Location                        | Why                                       |
| ------------------------------- | ----------------------------------------- |
| Event handlers (`@click`, etc.) | Only fire in browser                      |
| `firstUpdated()`                | Only runs after first DOM render (client) |
| `updated(changed)`              | Only runs after DOM updates (client)      |
| `disconnectedCallback()`        | Only runs when removed from DOM (client)  |

```js
// No guard needed — these are client-only
firstUpdated() {
  this.shadowRoot.querySelector('#input')?.focus();
}

_handleClick() {
  window.scrollTo(0, 0);
}
```

---

## Detection Guidance

When unsure whether code runs on the server, trace the call chain:

1. Is it called from `constructor`, `render`, `connectedCallback`, `willUpdate`, or a `loader`?
2. Is it called from a function that is called from one of those?
3. Is it a top-level statement that executes on `import`?

If YES to any → guard with `isServer`.

---

## Common Browser APIs That Need Guards

- `window`, `document`, `navigator`, `location`
- `localStorage`, `sessionStorage`
- `IntersectionObserver`, `ResizeObserver`, `MutationObserver`
- `requestAnimationFrame`, `cancelAnimationFrame`
- `fetch` (in loaders — use `ctx.protocol`/`ctx.hostname` instead)
- `CustomEvent` dispatch (no DOM in SSR)
- `matchMedia`, `getComputedStyle`
- `HTMLElement.prototype.focus`, `.scrollIntoView`

---

## Tailwind v4 Directives

Valid Tailwind v4 directives for AIUX apps:

```css
/* In global CSS */
@import 'tailwindcss';
@config '../tailwind.config.js';

/* In component static styles — use @apply or utility classes in templates */
@layer base { ... }
@layer components { ... }
@layer utilities { ... }
```

Components should prefer Tailwind utility classes in templates over `@apply` in `static styles`.
