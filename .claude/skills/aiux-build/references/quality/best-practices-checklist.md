# Best Practices Checklist

All 48 principles grouped by category. Validate every implementation against this list.

---

## Widget Core (P1–P25)

- [ ] **P1** Extend `AIUXWidgetElement` — never plain `LitElement`
- [ ] **P2** `i18n.getMessage()` for all user-facing text
- [ ] **P3** `state: true` for internal state properties
- [ ] **P4** All properties initialized in `constructor()`
- [ ] **P5** Data fetch in `connectedCallback()` after `super.connectedCallback()`
- [ ] **P6** Cleanup in `disconnectedCallback()` — listeners, watchers, timers
- [ ] **P7** `_renderX()` helper methods for complex templates
- [ ] **P8** `height: 100%` on `:host` and container
- [ ] **P9** CSS custom properties for all colors
- [ ] **P10** Loading, error, empty, data states all handled
- [ ] **P11** `@discoverable(true)` on every widget
- [ ] **P12** `<aiux-icon>` for icons — no inline SVG
- [ ] **P13** Widget heading: `text-sm font-medium text-text-secondary`
- [ ] **P14** `<fade-scroll>` for scrollable lists
- [ ] **P15** `this.trackEvent()` for key user actions
- [ ] **P16** GlideQuery `.select()` used when column restriction is needed (GlideRecord fetches all columns — switch to GlideQuery to restrict)
- [ ] **P17** `setLimit()` on every GlideRecord query
- [ ] **P18** `canRead()`/`canWrite()` after `.get()`
- [ ] **P19** Validate and coerce all `input.*` parameters
- [ ] **P20** Error shape: `data.isError` + `data.errorMessage`
- [ ] **P21** No orphan `data.*` fields — client ↔ server aligned
- [ ] **P22** `gs.getMessage()` for server-side user strings
- [ ] **P23** In-flight request guard (`this._fetching`)
- [ ] **P24** Property `type` in every `static properties` entry
- [ ] **P25** Reactive state triggers re-render — no manual `this.update()`

---

## Lit Patterns (P26–P33)

- [ ] **P26** `classMap` for conditional classes
- [ ] **P27** No `nothing` in attribute positions
- [ ] **P28** No self-mutation of `@property()` values
- [ ] **P29** Namespace-scoped events: `bubbles: true, composed: true`
- [ ] **P30** No anonymous arrow handlers in `.map()` loops
- [ ] **P31** `<details>/<summary>` for collapse — not DaisyUI input hack
- [ ] **P32** Tooltip directive — not `data-tip`
- [ ] **P33** Cards use `bg-base-100 shadow-sm` (elevated) or `bg-base-100 border border-base-300` (bordered)

---

## Performance & Cleanup (P34–P36)

- [ ] **P34** Resource cleanup in `disconnectedCallback` — observers, listeners, timers, AbortControllers
- [ ] **P35** No `await` on fire-and-forget — fire and `.catch()`
- [ ] **P36** `lazyImage` directive for `<img>` elements

---

## Chat Integration (P37–P39)

- [ ] **P37** `withWidgetContext(AIUXElement)` for chat-integrated widgets
- [ ] **P38** `client_tools` definitions use regular functions (not arrows)
- [ ] **P39** `setAiContext()` pushes serializable state to chat

---

## Observability (P40–P41)

- [ ] **P40** `createLogger` (server) / `getLogger` (browser) — no `console.*`
- [ ] **P41** Correct severity: `debug` per-request, `info` lifecycle, `warn` degraded, `error` failures

---

## App-Level (P42–P43)

- [ ] **P42** `display: contents` on list pages
- [ ] **P43** Bind `aiux-list-connected:*` events — not `aiux-list:*`

---

## Accessibility (P44)

- [ ] **P44** `aria-live="polite"` or `role="status"` on regions with polled or async-updated content

---

## Responsive Text (P45)

- [ ] **P45** Dynamic/prop-driven text elements use `class="break-words max-w-full"` — legible at 320px without horizontal overflow

---

## Data Completeness (P46–P47)

- [ ] **P46** Client `catch` blocks assign `i18n.getMessage('...')` to `this._error` — never raw `e.message`
- [ ] **P47** When server uses `setLimit()`, return `data.hasMore` + `data.totalAvailable` via `GlideAggregate`; client renders truncation notice when `hasMore` is `true`

---

## Document Title (P48)

- [ ] **P48** `setDocumentTitle(getMessage('...'))` in `firstUpdated()` on every non-layout page — WCAG 2.4.2; `utils/document-title.js` must exist

---

## Additional Best Practices

### Component

- [ ] `static styles` includes `:host { display: block }`
- [ ] No `...super.properties` spread
- [ ] `@query` only for imperative DOM APIs (`showModal`, `focus`)
- [ ] No imperative DOM manipulation (`classList.add`, `el.style.*`)

### Server Script

- [ ] Action routing via `switch` or `if/else` on `input.action`
- [ ] `GlideRecordSecure` for all queries (not `GlideRecord`)
- [ ] No `getRowCount()` — use `GlideAggregate` for counts
- [ ] `addNotNullQuery('field')` for non-empty filters

### Styling

- [ ] No hardcoded font families
- [ ] Tailwind utility classes in templates, not `@apply` in styles
- [ ] DaisyUI classes with `aiux-` prefix
- [ ] New DaisyUI classes registered in safelist

### SSR

- [ ] `isServer` guard in constructor, render, connectedCallback, willUpdate, loader
- [ ] No guard needed in event handlers, firstUpdated, updated, disconnectedCallback

### Context

- [ ] Global context: `createContext` for app-wide singletons
- [ ] Scoped context: `createScopedContext` for nested layouts
- [ ] `willUpdate` re-provision for scoped context on navigation
- [ ] `unprovide(this)` in `disconnectedCallback`
- [ ] `detailContext.get(this)` — always pass `this` for scoped

### Navigation

- [ ] `navigate()` uses app-relative paths (no basePath)
- [ ] Anchor links use full `basePath`-prefixed href
- [ ] No relative hrefs (`./page`)
- [ ] Sidebar items have correct active state logic

### Motion

- [ ] `@media (prefers-reduced-motion: reduce)` fallback in CSS
- [ ] `motion-reduce:` Tailwind prefix for template transitions
