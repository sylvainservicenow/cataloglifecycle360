# Validation Rules

Automated assertions to validate AIUX components. Run after every implementation.

---

## Component Structure

| Rule                   | Check                                                   | Severity |
| ---------------------- | ------------------------------------------------------- | -------- |
| Base class             | Class extends `AIUXElement` or `AIUXWidgetElement`      | Error    |
| Custom element tag     | `@customElement('tag-name')` with unique namespaced tag | Error    |
| Export                 | Widget has `export default`                             | Error    |
| Constructor            | `super()` called first                                  | Error    |
| connectedCallback      | `super.connectedCallback()` called                      | Error    |
| disconnectedCallback   | `super.disconnectedCallback()` called                   | Error    |
| Static properties type | Every entry has `type` key                              | Error    |
| State declaration      | Every `this._*` assignment has matching `state: true`   | Error    |
| Property init          | All properties have defaults in constructor             | Warning  |

---

## Widget-Specific

| Rule             | Check                                                  | Severity |
| ---------------- | ------------------------------------------------------ | -------- |
| Discoverable     | `@discoverable(true)` present                          | Error    |
| bestFor          | `@bestFor('...')` with meaningful description          | Error    |
| Name             | `@name('...')` decorator                               | Warning  |
| Description      | `@description('...')` decorator                        | Warning  |
| Server decorator | If server.js exists → `@server('./server.js')` present | Error    |
| Render states    | `render()` handles loading, error, empty, data         | Warning  |
| Widget height    | `:host` has `height: 100%`                             | Warning  |

---

## Server Script

| Rule             | Check                                                                                                 | Severity |
| ---------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Export           | `export default function server(data, _options, input)`                                               | Error    |
| Security         | Using `GlideRecordSecure` (not `GlideRecord`)                                                         | Error    |
| Field selection  | GlideQuery `.select()` used when restricting fetched columns (GlideRecord has no field-selection API) | Warning  |
| Limit            | `setLimit()` called before `query()`                                                                  | Error    |
| Access check     | `canRead()` after `get()`                                                                             | Warning  |
| Error shape      | `data.isError` + `data.errorMessage` includes actual error (`e.message`), not generic string alone    | Error    |
| Input validation | `input.*` has defaults                                                                                | Warning  |
| Server strings   | `gs.getMessage()` for user-facing text                                                                | Warning  |
| Truncation data  | If `setLimit()` is used, server returns `data.hasMore` and `data.totalAvailable` via `GlideAggregate` | Warning  |
| Truncation UI    | Client renders a truncation notice (e.g. "Showing X of Y") when `hasMore` is `true`                   | Warning  |

---

## Page-Level

| Rule                | Check                                                                                            | Severity |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Document title      | Non-layout pages call `setDocumentTitle(getMessage('...'))` in `firstUpdated()` (WCAG 2.4.2)     | Error    |
| Document title util | `utils/document-title.js` exists, exports `setDocumentTitle`, SSR-safe (`typeof document` guard) | Error    |

---

## Internationalization

| Rule              | Check                                                                                 | Severity |
| ----------------- | ------------------------------------------------------------------------------------- | -------- |
| Client i18n       | All template strings use `i18n.getMessage()`                                          | Error    |
| Server i18n       | User-facing strings use `gs.getMessage()`                                             | Error    |
| No hardcoded text | No English strings in templates                                                       | Error    |
| Import            | `i18n` imported from `@servicenow/aiux-services`                                      | Error    |
| Client catch i18n | Client `catch` blocks assign `i18n.getMessage(...)` to `_error` — not raw `e.message` | Error    |

---

## SSR Safety

| Rule                    | Check                                             | Severity |
| ----------------------- | ------------------------------------------------- | -------- |
| Constructor guard       | No `window`/`document`/`navigator` in constructor | Error    |
| Render guard            | No browser APIs in `render()`                     | Error    |
| Loader guard            | `isServer` check when using browser APIs          | Error    |
| connectedCallback guard | Browser APIs guarded with `!isServer`             | Error    |
| Event handler safe      | No `isServer` needed                              | Info     |

---

## Styling

| Rule                  | Check                                                                                                                | Severity |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Host display          | `:host { display: block }` (or `contents` for list pages)                                                            | Error    |
| No hardcoded colors   | No hex/rgb/named colors in templates                                                                                 | Warning  |
| CSS custom properties | Colors use `var(--color-*)`                                                                                          | Warning  |
| DaisyUI prefix        | All DaisyUI classes use `aiux-` prefix                                                                               | Warning  |
| Card wrapper          | Widget root is `aiux-card` + `aiux-card-body`, not a raw `<div>`                                                     | Warning  |
| Card background       | Cards use `bg-base-100 shadow-sm`                                                                                    | Info     |
| No inline SVG         | Using `<aiux-icon>`                                                                                                  | Warning  |
| Text overflow         | Dynamic/prop-driven text has `overflow-wrap: break-word; word-break: break-word; max-width: 100%` — legible at 320px | Warning  |

---

## Events

| Rule              | Check                                                                                                          | Severity |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Namespace         | Custom events use `namespace:action` format                                                                    | Warning  |
| Bubbling          | `bubbles: true, composed: true`                                                                                | Error    |
| No self-mutation  | `@property()` values not self-assigned                                                                         | Error    |
| Bound handlers    | Event handlers bound in constructor                                                                            | Warning  |
| No arrow in loops | `.map()` uses data attributes, not arrow closures                                                              | Warning  |
| Action guard      | Event handlers that call `server.get()` use a boolean flag (e.g. `_actioning`) to prevent overlapping requests | Warning  |

---

## Cleanup

| Rule            | Check                                              | Severity |
| --------------- | -------------------------------------------------- | -------- |
| Listeners       | Every `addEventListener` has `removeEventListener` | Error    |
| Observers       | Every observer has `.disconnect()`                 | Error    |
| Timers          | Every `setTimeout`/`setInterval` is cleared        | Error    |
| Record watcher  | Subscription has `.unsubscribe()`                  | Error    |
| Scoped context  | `unprovide(this)` in `disconnectedCallback`        | Error    |
| AbortController | `.abort()` in cleanup                              | Warning  |

---

## Observability

| Rule                             | Check                                           | Severity |
| -------------------------------- | ----------------------------------------------- | -------- |
| No console in backend            | No `console.*` in server files                  | Error    |
| No console.warn/error in browser | New `console.warn`/`console.error` flagged      | Warning  |
| Structured logging               | `createLogger` (server) / `getLogger` (browser) | Info     |

---

## Accessibility

**Invoke the `accessibility` skill now** if any of the following apply to the component or widget being validated:

| Condition                                                        | Invoke `accessibility` skill? |
| ---------------------------------------------------------------- | ----------------------------- |
| Component has buttons, inputs, links, or any clickable element   | Yes — always                  |
| Component renders a modal, dialog, drawer, or overlay            | Yes — always                  |
| Component has tabs, menus, dropdowns, or disclosure patterns     | Yes — always                  |
| Component uses drag-and-drop or resizable panels                 | Yes — always                  |
| Component renders dynamic or async-updated content               | Yes — always                  |
| Component is a layout, page, or navigation shell                 | Yes — always                  |
| Component is purely static display with no interaction           | Yes — reflow and forced-colors still apply |

> There is no case where `accessibility` is skipped. The conditions above are listed to help identify *which reference files* inside the skill to load — not to gate whether the skill is invoked.

After the `accessibility` skill has been applied, run these minimum checks:

| Rule             | Check                                                                                  | Severity |
| ---------------- | -------------------------------------------------------------------------------------- | -------- |
| Keyboard access  | All interactive elements reachable and operable via keyboard                           | Error    |
| ARIA labels      | Icon-only buttons and controls have `aria-label` or `aria-labelledby`                  | Error    |
| Form labels      | Every form input has an associated `<label>` or `aria-label`                           | Error    |
| Live regions     | Async-updated regions have `aria-live="polite"` or `role="status"`                     | Error    |
| Reflow 320px     | No horizontal scroll at 320px viewport width (WCAG 1.4.10)                            | Error    |
| Forced-colors    | Interactive, field, and container components have `@media (forced-colors: active)` CSS | Error    |

---

## Chat Integration

| Rule               | Check                                             | Severity |
| ------------------ | ------------------------------------------------- | -------- |
| Mixin              | Chat widgets use `withWidgetContext(AIUXElement)` | Error    |
| No arrow functions | `client_tools.definition` is regular function     | Error    |
| Context push       | `setAiContext()` called with serializable data    | Warning  |
