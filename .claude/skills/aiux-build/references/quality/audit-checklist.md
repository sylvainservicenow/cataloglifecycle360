# App Health Audit Checklist

10-category audit for AIUX application quality. Each category has pass/warn/fail criteria.

---

## 1. Structure

**Check:** Required files and directory layout. `<srcDir>` is the value of `srcDir` in `aiux.json` (scaffolded as `src/lux`); if unset it resolves to the project root. `package.json`, `aiux.json`, and `now.config.json` always stay at the true project root.

| Item                               | Pass | Warn                                                   | Fail                                                         |
| ---------------------------------- | ---- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `aiux.json` exists at root         | ✅   | —                                                      | ❌ Missing                                                   |
| `package.json` has `aiux.basename` | ✅   | ⚠️ Missing (valid for widget-only or global-page apps) | ❌ Mismatched with `aiux.json#basename`                      |
| `now.config.json` scope matches    | ✅   | —                                                      | ❌ Scope mismatch                                            |
| `<srcDir>/pages/layout.js` exists  | ✅   | —                                                      | ❌ Missing root layout                                       |
| `<srcDir>/pages/home/page.js` exists | ✅ | ⚠️ Different landing page                              | —                                                            |
| `<srcDir>/theme.js` exists         | ✅   | ⚠️ Missing (uses defaults)                             | —                                                            |
| No stray files in root             | ✅   | ⚠️ Unnecessary files                                   | —                                                            |
| Three-way config agreement         | ✅   | —                                                      | ❌ `aiux.json` ↔ `package.json` ↔ `now.config.json` mismatch |

---

## 2. Base Classes

**Check:** All components extend the correct AIUX base class.

| Item                                 | Pass | Warn               | Fail                                     |
| ------------------------------------ | ---- | ------------------ | ---------------------------------------- |
| Pages extend `AIUXElement`           | ✅   | —                  | ❌ Extends `LitElement`                  |
| Root layout extends `NavLayout`      | ✅   | —                  | ❌ Wrong base class                      |
| Widgets extend `AIUXWidgetElement`   | ✅   | —                  | ❌ Extends `LitElement` or `AIUXElement` |
| Chat widgets use `withWidgetContext` | ✅   | ⚠️ Not using mixin | —                                        |
| No direct `LitElement` usage         | ✅   | —                  | ❌ Found `LitElement` import             |

---

## 3. SSR Safety

**Check:** Browser-only APIs are guarded in SSR-executing code paths.

| Item                                    | Pass | Warn | Fail                        |
| --------------------------------------- | ---- | ---- | --------------------------- |
| No `window`/`document` in constructor   | ✅   | —    | ❌ Unguarded                |
| No browser APIs in `render()`           | ✅   | —    | ❌ Unguarded                |
| `isServer` guard in `connectedCallback` | ✅   | —    | ❌ Missing guard            |
| Loaders guard browser-only logic        | ✅   | —    | ❌ Missing `isServer` check |
| `isServer` import from `lit`            | ✅   | —    | ❌ Using `typeof window`    |

---

## 4. Styling

**Check:** Consistent, theme-aware styling.

| Item                                         | Pass | Warn                  | Fail                                              |
| -------------------------------------------- | ---- | --------------------- | ------------------------------------------------- |
| No hardcoded hex/rgb colors                  | ✅   | ⚠️ Found in edge case | ❌ Throughout templates                           |
| CSS custom properties for colors             | ✅   | —                     | ❌ Using raw color values                         |
| `:host { display: block }` on all components | ✅   | —                     | ❌ Missing                                        |
| DaisyUI classes have `aiux-` prefix          | ✅   | ⚠️ Some missing       | ❌ Unprefixed throughout                          |
| Cards use `bg-base-100 shadow-sm`            | ✅   | —                     | ❌ Using `bg-surface-primary` (not in production) |
| No hardcoded font families                   | ✅   | —                     | ❌ Found hardcoded fonts                          |
| No inline styles for spacing                 | ✅   | ⚠️ Few instances      | —                                                 |

---

## 5. Internationalization

**Check:** All user-facing text is externalized.

| Item                                   | Pass | Warn                      | Fail                   |
| -------------------------------------- | ---- | ------------------------- | ---------------------- |
| Client strings use `i18n.getMessage()` | ✅   | —                         | ❌ Hardcoded English   |
| Server strings use `gs.getMessage()`   | ✅   | —                         | ❌ Hardcoded English   |
| `i18n` imported from correct package   | ✅   | —                         | ❌ Wrong import        |
| No English strings in templates        | ✅   | ⚠️ Placeholder text found | ❌ User-facing English |
| Translation keys registered            | ✅   | ⚠️ Some missing           | —                      |

---

## 6. Accessibility

**Check:** WCAG 2.2 AA compliance.

| Item                                      | Pass | Warn            | Fail           |
| ----------------------------------------- | ---- | --------------- | -------------- |
| Interactive elements keyboard-accessible  | ✅   | —               | ❌ Click-only  |
| ARIA labels on icon-only buttons          | ✅   | —               | ❌ Missing     |
| Form inputs have labels                   | ✅   | —               | ❌ Unlabeled   |
| Modals have `aria-modal`, `role="dialog"` | ✅   | —               | ❌ Missing     |
| Focus management on navigation            | ✅   | ⚠️ Partial      | —              |
| Color contrast meets 4.5:1 ratio          | ✅   | ⚠️ Borderline   | ❌ Below ratio |
| `prefers-reduced-motion` fallbacks        | ✅   | ⚠️ Missing some | —              |
| Reflow at 320px — no horizontal scroll (WCAG 1.4.10) | ✅ | ⚠️ Some overflow | ❌ Horizontal scroll at 320px |
| Forced-colors (Windows High Contrast) CSS on all interactive, field, and container components | ✅ | ⚠️ Missing on some | ❌ No forced-colors support |

---

## 7. Performance

**Check:** No performance anti-patterns.

| Item                                       | Pass | Warn                                        | Fail                           |
| ------------------------------------------ | ---- | ------------------------------------------- | ------------------------------ |
| No state mutation in `render()`            | ✅   | —                                           | ❌ Side effects in render      |
| `repeat()` with keys for dynamic lists     | ✅   | ⚠️ Using `.map()` for sorted/filtered lists | —                              |
| No N+1 query patterns in server scripts    | ✅   | —                                           | ❌ Query inside loop           |
| GlideQuery `.select()` for column restriction | ✅   | —                                        | ❌ GlideRecord used where column restriction is needed (it has no field-selection API) |
| `setLimit()` on all queries                | ✅   | —                                           | ❌ Unbounded query             |
| Resource cleanup in `disconnectedCallback` | ✅   | —                                           | ❌ Leaking listeners/observers |
| No `await` on fire-and-forget              | ✅   | ⚠️ Analytics/prefs awaited                  | —                              |
| No `getRowCount()`                         | ✅   | —                                           | ❌ Use `GlideAggregate`        |
| In-flight request guard                    | ✅   | ⚠️ Missing on some methods                  | —                              |
| `lazyImage` for `<img>` elements           | ✅   | ⚠️ Raw `<img>` found                        | —                              |

---

## 8. Security

**Check:** Server-side security patterns.

| Item                                              | Pass | Warn                       | Fail                   |
| ------------------------------------------------- | ---- | -------------------------- | ---------------------- |
| `GlideRecordSecure` (not `GlideRecord`)           | ✅   | —                          | ❌ Using `GlideRecord` |
| `canRead()` after `.get()`                        | ✅   | ⚠️ Missing on some queries | ❌ Never checked       |
| Input validation with defaults                    | ✅   | ⚠️ Partial                 | ❌ Raw input used      |
| Error shape: `data.isError` + `data.errorMessage` | ✅   | —                          | ❌ Empty catch blocks  |
| No PII in `trackEvent()`                          | ✅   | —                          | ❌ PII in analytics    |
| CSRF token used for mutations                     | ✅   | —                          | ❌ Missing             |

---

## 9. Observability

**Check:** Structured logging, no raw console usage.

| Item                                      | Pass | Warn                      | Fail                            |
| ----------------------------------------- | ---- | ------------------------- | ------------------------------- |
| No `console.*` in server-side code        | ✅   | —                         | ❌ `console.log` in loaders/API |
| No new `console.warn/error` in components | ✅   | ⚠️ New instance found     | —                               |
| `createLogger` in backend modules         | ✅   | ⚠️ Missing in some        | —                               |
| `getLogger` in browser components         | ✅   | ⚠️ Missing in some        | —                               |
| Correct severity levels                   | ✅   | ⚠️ `info` for per-request | —                               |
| Catch blocks log errors                   | ✅   | ⚠️ Silent catches         | ❌ Empty catch                  |

---

## 10. Chat Integration

**Check:** Widget-chat communication patterns (when applicable).

| Item                                             | Pass | Warn                        | Fail                         |
| ------------------------------------------------ | ---- | --------------------------- | ---------------------------- |
| `withWidgetContext` mixin used                   | ✅   | —                           | ❌ Direct `__AIEX_GLOBALS__` |
| `client_tools.definition` regular function       | ✅   | —                           | ❌ Arrow function            |
| `setAiContext()` with serializable data          | ✅   | ⚠️ Not calling setAiContext | —                            |
| `static aiContext` has `description` + `bestFor` | ✅   | ⚠️ Missing                  | —                            |

---

## Audit Output Format

```
=== AIUX App Health Audit ===
App: my-app (x_snc_my_app)

1. Structure:     ✅ PASS (8/8)
2. Base Classes:  ✅ PASS (5/5)
3. SSR Safety:    ⚠️ WARN (4/5 — 1 unguarded connectedCallback)
4. Styling:       ✅ PASS (7/7)
5. i18n:          ❌ FAIL (3/5 — 2 hardcoded English strings)
6. Accessibility:  ⚠️ WARN (5/7 — missing aria-label on 2 icon buttons)
7. Performance:   ✅ PASS (10/10)
8. Security:      ✅ PASS (6/6)
9. Observability: ⚠️ WARN (4/6 — console.log in api/incidents.js)
10. Chat:         N/A (no chat widgets)

Overall: 7 PASS / 3 WARN / 1 FAIL
Priority fixes: i18n (2 strings), a11y (2 labels), observability (1 file)
```
