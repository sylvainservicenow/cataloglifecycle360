---
name: i18n-litjs
description: Internationalize Lit / AIUX widget code — externalize user-facing strings with i18n.getMessage(), parameterize messages, add translator comments, format locale-aware dates/numbers/currency with Intl, detect the user's locale, and guard SSR with isServer. Use for components extending AIUXWidgetElement or any Lit component with hardcoded strings or hand-rolled formatting. Technology-specific companion to internationalization.
metadata:
  author: servicenow
  version: '1.2.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Lit / AIUX Internationalization

Technology binding of the **internationalization** skill for Lit components (especially those extending `AIUXWidgetElement`). Apply the core i18n principles; this skill gives the concrete Lit/AIUX APIs for externalizing text, locale-aware formatting, and locale detection. Translation catalogs, RTL/bidi rendering, fonts, and layout fitting belong to **l10n-litjs**.

## When to use this skill

- A Lit component renders hardcoded user-facing text in `html` templates, attributes, or constants.
- Messages are built with string concatenation or template literals instead of placeholders.
- Dates, numbers, or currency are formatted with hand-rolled patterns instead of `Intl` APIs.
- i18n or locale logic accesses browser globals during server-side rendering without an `isServer` guard.

## Instructions

### 1. Externalize strings with `i18n.getMessage()`

Import from `@servicenow/aiux-services`:

```js
import {i18n} from '@servicenow/aiux-services';
```

- Simple message:
  ```js
  html`<p class="text-sm">${i18n.getMessage('No items found')}</p>`;
  ```
- Parameterized (use `{0}`/`{name}` placeholders — never concatenate):
  ```js
  i18n.getMessage('{0} items', [this.items.length + '']);
  i18n.getMessage('Hello {name}', {name: this.user.name});
  ```
- Disambiguate identical source strings and/or add translator context with the object form. The build-time extractor captures `code`, `message`, and `comment`; use a stable `code` to separate two strings that read alike, and `comment` to explain intent:
  ```js
  i18n.getMessage({message: 'Open', comment: 'Button label to open a record'});
  i18n.getMessage({code: 'WIDGET_SAVE', message: 'Save'});
  ```
- **Argument must be a literal.** The AST extractor only writes string/`{code, message, comment}` **literals** to `sys_ui_message`; a variable argument is never extracted and falls back to the source string in every locale. The `eslint-plugin-aiux-i18n` rules (`getmessage-no-variable-arg`, `no-hardcoded-html-text`, `no-hardcoded-translatable-attrs`) enforce this at build time.
- **Plural/gender limitation.** `i18n.getMessage` does plain placeholder substitution — it has **no** ICU plural/gender selection. `'{0} items'` renders "1 items" at count 1. Where count- or gender-sensitive output matters, prefer a structurally complete phrasing per case (separate messages) and raise true plural needs with the platform i18n owners; do not fake it with `if`/branch strings in the component.

### 2. Format locale-aware data with `Intl`

Lit components use the same built-in `Intl` library as any JS/TS. **For the full `Intl.*` surface — date/time/number/currency/percent/unit/relative-time/duration/list formatting, `formatToParts`, grapheme-safe length and truncation with `Intl.Segmenter`, locale-sensitive sort/search with `Intl.Collator`, and capability/fallback probing — follow `i18n-intljs`.** It is the source of truth for the API; don't re-derive it here. The Lit-specific rules layered on top:

- Pass the component's resolved locale (`this.getLocale()`, see §3) to every `Intl` constructor — never call them locale-less or with the browser default.
- Build formatters where they can be reused, not per render inside a hot template.
- Don't format props the backend already localized.

### 3. Detect the user's locale — never rely on the browser default

```js
getLocale() {
  if (isServer) return 'en';
  return (this.getAttribute('lang') || document.documentElement.lang || 'en').toLowerCase();
}
```

Pass the resolved locale explicitly to every `Intl` call. Normalize and validate the tag with `Intl.Locale` / `Intl.getCanonicalLocales` (POSIX `_` → BCP 47 `-`) as detailed in `i18n-intljs` §1 — don't hand-parse locale strings.

### 4. Cover everything user-facing

Scan templates and constants for: labels, headings, body text, `placeholder`/`title` attributes, `aria-label` and accessible names, error and empty-state messages, button text, and any prop/constant rendered to users.

### 5. Guard SSR with `isServer`

`Intl`/locale detection touches `document`/`window`; wrap it (and any browser-only i18n API access) in an `isServer` guard. Import `isServer` from `lit`:

```js
import {isServer} from 'lit';

connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    // Safe to access browser-only i18n / Intl / locale APIs here
  }
}
```

## Constraints and Don'ts

- Don't translate IDs, CSS class names, test-only strings, or props already pre-translated by the backend.
- Don't concatenate or use template literals (`` `Hello ${name}` ``) for translatable text — use `i18n.getMessage('Hello {name}', {name})`.
- Don't pass a variable to `i18n.getMessage()` — the literal is never extracted.
- Don't invent meaning for ambiguous strings — use the object form with `code`/`comment`.
- Don't call `Intl` constructors without passing the user's resolved locale, and don't hand-format dates/numbers/currency.
- Don't access browser globals (`Intl` with `document`-derived locale, `window`) in SSR-rendered code without an `isServer` guard.

## Output Checklist

- [ ] All user-facing strings wrapped with `i18n.getMessage()` using literal arguments.
- [ ] Parameterized messages use `{0}`/`{name}` placeholders, not concatenation or template literals.
- [ ] Ambiguous strings include a `code` and/or translator `comment`.
- [ ] ARIA labels, accessible names, error, and empty-state messages are externalized.
- [ ] Client-generated dates, numbers, relative time, and currency use the matching `Intl` API with the resolved locale; ISO 4217 codes stored.
- [ ] User's locale detected (not the browser default) and passed to every `Intl` call.
- [ ] SSR-rendered i18n/`Intl`/locale calls that touch browser APIs are guarded with `isServer`.

## Related skills

`internationalization` and `l10n-litjs` are part of this governance package; `accessibility` and `responsive-design` are separate **Horizon Design** skills (present only where that system is installed).

| Skill                | Relationship                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| internationalization | Governance source — defines _what_ must be externalized and _why_ (this is its Lit binding).                                       |
| i18n-intljs          | Source of truth for the `Intl.*` API surface this binding uses; consult it for formatting/segmentation/collation details (§2, §3). |
| l10n-litjs           | Localization companion — translation catalogs, RTL/bidi, fonts, layout fitting after i18n.                                         |
| accessibility        | Externalized `aria-label`/accessible names must remain WCAG 2.2 AA compliant per locale.                                           |
| responsive-design    | Locale-aware text length varies; layout must absorb it (detailed in l10n-litjs).                                                   |
