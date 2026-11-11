---
name: i18n-intljs
description: Internationalize framework-agnostic TypeScript / JavaScript with the Mozilla Intl library — resolve and normalize the user's locale with Intl.Locale, format locale-aware dates, numbers, currency, percentages, units, relative time, durations, and lists with the Intl.* constructors, segment text grapheme-aware with Intl.Segmenter, and sort/search with Intl.Collator. Use for plain JS/TS (Node, Deno, workers, vanilla browser, any framework) that hand-rolls formatting or reads the host default locale. Technology-specific companion to internationalization.
metadata:
  author: servicenow
  version: '1.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# TypeScript / JavaScript Internationalization with `Intl`

Technology binding of the **internationalization** skill for framework-agnostic TypeScript / JavaScript that uses the built-in [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) library. Apply the core i18n principles; this skill gives the concrete `Intl.*` APIs for locale resolution, locale-aware formatting, Unicode-correct segmentation, and locale-sensitive collation. Translation catalogs, RTL/bidi rendering, fonts, and CLDR per-locale adaptation belong to **l10n-intljs**.

`Intl` is locale-data-driven (CLDR-backed) and built into the runtime — no dependency to add. It does **not** externalize text: `Intl` has no message/catalog API, so string externalization and parameterization still use your platform's message system (see _Constraints_). For Lit / AIUX widgets, use **i18n-litjs** instead — it wraps the same `Intl` calls behind `i18n.getMessage()` and `getLocale()`.

## When to use this skill

- Plain TS/JS (Node, Deno, Bun, service workers, vanilla browser, or any framework's non-component code) formats dates, numbers, currency, or lists with hand-rolled patterns.
- Code calls an `Intl.*` constructor with no locale argument (falling back to the host/runtime default).
- String length, truncation, or word-splitting uses `.length`, `.slice()`, or regex on code units instead of grapheme/word segmentation.
- Sorting or searching uses `<`, `>`, or `.sort()` default (code-unit order) instead of locale-sensitive collation.
- Locale strings are parsed or compared by hand (string `split('-')`, `.startsWith('en')`) instead of `Intl.Locale` / `Intl.getCanonicalLocales`.

## Instructions

### 1. Resolve and normalize the locale with `Intl.Locale`

Resolve the locale from an explicit preference → negotiated source → defined default; **never** read the runtime default for user-facing output. Normalize and validate it before use:

```js
// Canonicalize and validate (throws RangeError on a malformed tag)
const [tag] = Intl.getCanonicalLocales(rawTag.replace(/_/g, '-')); // POSIX en_US → BCP 47 en-US
const locale = new Intl.Locale(tag);
locale.language; // 'en'   locale.region; // 'US'   locale.baseName; // 'en-US'
```

- Pass the resolved `locale` (or its string) explicitly to **every** `Intl.*` constructor below — never call them locale-less.
- Keep formatting locale and translation language as separate inputs where they differ (a user may read English yet expect German number/date formats).
- Use `locale.maximize()` / `minimize()` to build fallback candidates; let the constructors' `localeMatcher` resolve the best supported one.

### 2. Format with the `Intl` constructors — never hand-roll

Create the formatter **once** (construction is expensive) and reuse it. Use `formatToParts()` when you must compose around the formatted value instead of concatenating strings by hand.

| Need                       | Constructor                                               | Key options                                                                                |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Dates / times              | `Intl.DateTimeFormat(locale, opts)`                       | `dateStyle`/`timeStyle` or field opts, `timeZone`, `calendar`, `hourCycle`                 |
| Decimals / percent / units | `Intl.NumberFormat(locale, opts)`                         | `style: 'decimal'\|'percent'\|'unit'`, `unit`, `minimum/maximumFractionDigits`, `notation` |
| Currency                   | `Intl.NumberFormat(locale, {style:'currency', currency})` | `currency` is the **ISO 4217 code** (store the code, never the symbol), `currencyDisplay`  |
| Relative time              | `Intl.RelativeTimeFormat(locale, opts)`                   | `numeric: 'auto'`, `style`                                                                 |
| Durations                  | `Intl.DurationFormat(locale, opts)`                       | `style`, `<unit>Display`                                                                   |
| Lists ("a, b, and c")      | `Intl.ListFormat(locale, opts)`                           | `type: 'conjunction'\|'disjunction'\|'unit'`, `style`                                      |

```js
const money = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'JPY'
});
money.format(1990); // locale-correct symbol, placement, and fraction digits

// Compose without string concatenation:
const parts = new Intl.DateTimeFormat(locale, {
  dateStyle: 'long'
}).formatToParts(date);
```

- **Non-Gregorian calendars / time zones** are options, not new code paths: `{calendar: 'japanese'}`, `{calendar: 'islamic'}`, `{timeZone: 'Asia/Tokyo'}`. Store instants as UTC/ISO 8601 (or epoch) and resolve calendar, era, and zone at format time.
- Do not format values a backend already localized.

### 3. Unicode-correct length and truncation with `Intl.Segmenter`

`"👨‍👩‍👧".length` is `8`, not `1`. Measure, iterate, and truncate by **grapheme cluster**, never by `.length` / `.slice()` / code-unit regex:

```js
const seg = new Intl.Segmenter(locale, {granularity: 'grapheme'});
const graphemes = [...seg.segment(text)]; // one entry per user-perceived character
const truncated = graphemes
  .slice(0, 10)
  .map(s => s.segment)
  .join('');
```

Use `granularity: 'word'` for word counting / word-boundary search, and `'sentence'` for sentence splitting — all locale-aware.

### 4. Sort and search with `Intl.Collator`

Raw `.sort()` and `<`/`>` use code-unit order ("Z" < "a", accents misordered). Use a collator:

```js
const collator = new Intl.Collator(locale, {
  numeric: true,
  sensitivity: 'base'
});
items.sort((a, b) => collator.compare(a.name, b.name)); // locale-correct ordering, "file2" < "file10"
```

- `sensitivity: 'base'` or `'accent'` folds case/width for accent- and case-insensitive **search**; `numeric: true` sorts embedded numbers naturally.

### 5. Probe support and resolved settings before relying on a value

```js
Intl.supportedValuesOf('calendar'); // capability list for graceful fallback
new Intl.DateTimeFormat(locale).resolvedOptions(); // what the runtime actually chose (locale, calendar, timeZone…)
```

Use `resolvedOptions().locale` to confirm the runtime honored the requested locale rather than silently falling back, and to log the effective locale.

## Constraints and Don'ts

- `Intl` does **not** externalize text — keep using your platform's message API/catalog for all user-facing strings; never hardcode or concatenate translatable text just because formatting is now locale-aware.
- Don't call any `Intl.*` constructor without an explicit, resolved locale, and don't hand-format dates, numbers, currency, or lists.
- Don't read the runtime/host default (`undefined` locale arg, `navigator.language` as the sole source) for user-facing output — resolve from the user's preference.
- Don't use `String.prototype.length` / `.slice()` / `.toUpperCase()` for user-visible length, truncation, or case-insensitive compare — use `Intl.Segmenter` / `Intl.Collator`.
- Don't parse or compare locale tags by hand — use `Intl.Locale` and `Intl.getCanonicalLocales`.
- Don't store currency symbols — store the ISO 4217 code and pass it to `Intl.NumberFormat`.
- Don't reconstruct a formatter inside a loop or hot path — build once, reuse.

## Output Checklist

- [ ] Locale resolved from the user's preference (not the runtime default), canonicalized via `Intl.getCanonicalLocales`, and represented with `Intl.Locale`.
- [ ] The resolved locale is passed explicitly to every `Intl.*` constructor; formatting locale and translation language kept distinct.
- [ ] Dates, times, numbers, percentages, units, currency, relative time, durations, and lists use the matching `Intl` constructor (built once, reused); `formatToParts` used instead of manual concatenation.
- [ ] ISO 4217 currency codes stored; instants stored as UTC/ISO 8601 with calendar/era/time zone resolved at format time; alternate calendars set via the `calendar` option.
- [ ] User-visible length, truncation, and word/sentence boundaries use `Intl.Segmenter` (grapheme/word/sentence), never `.length`/`.slice()`.
- [ ] Sorting and searching use `Intl.Collator` with appropriate `sensitivity`/`numeric`, never code-unit order.
- [ ] Capability/fallback verified with `Intl.supportedValuesOf` and `resolvedOptions()`.

## Related skills

`internationalization` and `l10n-intljs` are part of this governance package; `i18n-litjs` is the sibling binding for Lit / AIUX components.

| Skill                | Relationship                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| internationalization | Governance source — defines _what_ must be externalized and _why_ (this is its plain-JS/TS binding).                   |
| l10n-intljs          | Localization companion — `Intl.PluralRules`, `Intl.DisplayNames`, RTL via `getTextInfo()`, CLDR adaptation after i18n. |
| i18n-litjs           | Sibling binding for Lit / AIUX widgets — wraps these same `Intl` calls behind `i18n.getMessage()`/`getLocale()`.       |
