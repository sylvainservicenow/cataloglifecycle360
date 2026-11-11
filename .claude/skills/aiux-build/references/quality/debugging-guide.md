# Debugging Guide

Structured diagnostics for AIUX widget, app, build, and deploy issues.

---

## Component Issues

- [ ] Extending `AIUXWidgetElement` (not LitElement directly)?
- [ ] `super()` called in constructor?
- [ ] `super.connectedCallback()` called?
- [ ] `super.disconnectedCallback()` called?
- [ ] Properties defined in `static properties`?
- [ ] Component exported from index.js?
- [ ] Event handlers bound in constructor?

---

## Server Script Issues

- [ ] Using `export default function server(data, _options, input) { ... }`?
- [ ] Checking `input.action` correctly?
- [ ] Populating `data` object (not returning)?
- [ ] Using `gs.info()` for debugging?
- [ ] `gr.query()` called after building query?
- [ ] Using `getValue` for text, `getDisplayValue` for references?
- [ ] `setLimit()` present? Use GlideQuery `.select()` if restricting fetched columns.

---

## Data Fetching Issues

- [ ] `this.server.get()` being called?
- [ ] Correct action name in request?
- [ ] Response being logged?
- [ ] Loading state reset in `finally` block?
- [ ] Error caught and displayed?
- [ ] In-flight guard (`this._fetching`) present?

---

## Rendering Issues

- [ ] Using `` html`...` `` template literal?
- [ ] All properties reactive (declared in `static properties`)?
- [ ] Conditional rendering checking correct state?
- [ ] `:host` has `display: block`?
- [ ] Not mutating arrays/objects directly? (use `this.items = [...newItems]`)

---

## Styling Issues

- [ ] `height: 100%` on both `:host` and container?
- [ ] Tailwind classes spelled correctly?
- [ ] Custom CSS in `static styles`?
- [ ] No missing semicolons in CSS?
- [ ] Using CSS custom properties? (`var(--color-text-primary)`, `var(--color-base-100)` — not `white` or `#hex`)
- [ ] `aiux-` prefix on DaisyUI classes?

---

## i18n Issues

- [ ] Importing `i18n` from `@servicenow/aiux-services`?
- [ ] All user-facing strings wrapped in `i18n.getMessage()`?
- [ ] Server-side strings using `gs.getMessage()`?
- [ ] Translation keys registered in `required_translations`?

---

## Cleanup Issues

- [ ] `disconnectedCallback()` implemented?
- [ ] All `addEventListener` calls have matching `removeEventListener`?
- [ ] Record watcher subscriptions unsubscribed?
- [ ] Timers (`setTimeout`/`setInterval`) cleared?
- [ ] Observers disconnected?
- [ ] Scoped contexts unprovided?

---

## Import Issues

- [ ] Relative imports starting with `./`?
- [ ] No circular dependencies?
- [ ] Using correct Lit directive paths? (`lit/directives/unsafe-html.js`)
- [ ] Widget-to-widget using `@servicenow/glide-widgets/` path?

---

## Common Error Fixes

### "SyntaxError: Unexpected token"

Check bundler output for invalid identifiers from relative imports.

### "this.server is undefined"

Not extending `AIUXWidgetElement`. Widgets MUST extend `AIUXWidgetElement`, not `AIUXElement`.

### "this is undefined in client_tools"

Arrow function in `client_tools.definition`. Use regular function.

### Data not loading

1. Add `gs.info()` in server script to trace execution
2. Check browser console for network errors
3. Verify action name matches between client and server
4. Check parameter priority: `input > options > default`

### Component not rendering

1. Check browser console for errors
2. Verify `@customElement` decorator present with unique tag name
3. Ensure `render()` returns `html` template
4. Check all properties initialized in constructor

### Styles not applying

1. Verify CSS is in `` static styles = css`...` `` block
2. Check DaisyUI classes have `aiux-` prefix
3. Ensure `:host` has `display: block`
4. Check CSS custom property fallbacks

### Properties not updating UI

1. Verify property is in `static properties` with `type`
2. Check `state: true` for internal state
3. Don't mutate arrays/objects — reassign: `this.items = [...newItems]`
4. Check `updated(changedProperties)` logic

### Server script returns empty data

1. Check `gs.info()` logs in System Logs
2. Verify GlideRecord table name is correct
3. Confirm `gr.query()` is called
4. Check ACLs — user may not have access
5. Try `GlideRecordSecure` — it silently filters inaccessible records

### Event listeners not firing

1. Handlers bound in constructor?
2. Using `@event` syntax in templates (not `onevent`)?
3. Custom events have `composed: true` to cross shadow DOM?

### Memory leaks

1. `disconnectedCallback()` with `super.disconnectedCallback()`?
2. All `window`/`document` listeners removed?
3. Record watchers unsubscribed?
4. Intervals/timeouts cleared?

### Context stale after navigation

1. `willUpdate` checking `this.loaderData !== this._prevLoaderData`?
2. Re-calling `provide(this, ...)` inside `willUpdate`?
3. `unprovide(this)` in `disconnectedCallback`?

### Build failure

1. Check `pnpm build` output for compilation errors
2. Verify all imports resolve
3. Check `aiux.json` ↔ `package.json` ↔ `now.config.json` alignment
4. Delete `dist/` and rebuild

### Deploy failure

1. Check `.bin/deploy-full` output
2. Clear instance cache
3. Verify scope matches across config files
4. Check role/ACL XML in `fluent/update/`
