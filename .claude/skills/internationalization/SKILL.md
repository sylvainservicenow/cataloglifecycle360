---
name: internationalization
description: Make a system globally ready WITHOUT translating it. Use when reviewing or building software for hardcoded strings, non-parameterized messages, hardwired date/time/number/currency formats, Gregorian-only calendars, non-Unicode handling, blocked non-ASCII input, or byte/codepoint sorting. Technology-agnostic; pair with a i18n-{technology} skill for concrete APIs.
metadata:
  author: servicenow
  version: '2.1.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Internationalization (i18n)

Internationalization makes a system **globally ready without translating it**. The product still ships in one source language, but every locale-dependent decision is externalized to a locale-driven API or resource instead of being hardcoded. Translation, RTL rendering, fonts, and per-locale CLDR data adaptation are **out of scope here** — those belong to the companion **localization** skill. The CLDR line: i18n _calls_ the locale-aware (CLDR-backed) formatter and passes it a locale; **verifying and adapting** that the correct, current per-locale data is applied is localization. Keep the two concerns separate: i18n is the locale-neutral enablement layer; localization is the per-locale adaptation on top of it.

## When to use this skill

- Reviewing or building any user-facing system for global readiness, before any translation work begins.
- User-facing text is hardcoded, concatenated, or interpolated rather than externalized as a parameterized message.
- Dates, times, timestamps, numbers, currencies, percentages, or units are formatted with hand-rolled patterns instead of locale-aware APIs.
- Code assumes the Gregorian calendar, a single time zone, ASCII text, LTR direction, or byte/codepoint length and ordering.
- Non-ASCII or composed (IME) input is blocked, corrupted, or rejected by validation.
- Sorting or searching uses raw byte/codepoint order instead of locale-sensitive collation.

## Dispatch to a technology skill

This skill is technology-agnostic — it defines _what_ to make locale-neutral. For the concrete APIs, **Read the matching `i18n-<technology>` companion file** (path in the table below — these are bundled files of this skill, not separately invocable skills) and follow it alongside this skill. Detect the technology from the codebase (file extensions, manifests, framework markers), then dispatch:

| Input technology                 | Detect by                                                     | Companion skill | File             |
| -------------------------------- | ------------------------------------------------------------- | --------------- | ---------------- |
| Lit / JS web components          | `.js`/`.ts` with `lit`, `@lit/localize`                       | `i18n-litjs`    | `i18n-litjs.md`  |
| Framework-agnostic TypeScript/JS | `.js`/`.ts` using `Intl.*` directly, no framework message API | `i18n-intljs`   | `i18n-intljs.md` |

- If multiple technologies are present, read each relevant companion file and apply it to its part of the codebase.
- If no companion matches the technology, apply this skill's principles directly using that platform's locale-aware APIs.
- The companion provides exact APIs; this skill remains the source of truth for _what_ must be externalized and _why_. The matched localization companion (`l10n-<technology>`) handles translation and per-locale adaptation afterward.

## Goals

- Externalize every locale-dependent value (text, formats, calendar, collation) behind locale-driven APIs or resources.
- Keep the source code locale-neutral so that adding a locale requires **no code change** — only data.
- Guarantee Unicode correctness end to end so any script can be stored, processed, input, and displayed without loss.

## Instructions

### 1. Resolve and thread the user's locale

- Establishing _which_ locale a request runs in is an i18n responsibility (the system must be _capable_ of running in any locale); the per-locale data and translations are localization's.
- Resolve from an explicit user preference first, then a negotiated source (`Accept-Language`, session/profile, platform locale), then a defined default. Never read the process/host default for user-facing output.
- Thread the resolved locale **explicitly** to every message lookup and formatter (the companions show the call). Don't rely on an ambient/global default.
- Keep locale (formatting) and language (translation) as separate inputs where the platform distinguishes them — a user may read English but expect German number/date formats.
- **Normalize locale codes at every external boundary.** Standards-based and CLDR/`Intl`-driven layers expect BCP 47 (`pt-BR`, `zh-TW`, `fr-CA`), but ServiceNow uses non-standard codes for some locales — notably `pb` (= `pt-BR`), `zt` (= `zh-TW`), and `fq` (= `fr-CA`), among others. When a locale identifier crosses to or from a system **external to the ServiceNow platform**, map it between the ServiceNow code and the canonical BCP 47 tag at the boundary, in **both** directions: never feed a ServiceNow-proprietary code to a CLDR/`Intl`/standards-based API, and never assume an external system understands `pb`/`zt`/`fq`. When reviewing code that ingests or emits a locale across such a boundary, confirm this mapping exists. Treat the mapping as **data** (a lookup table), not scattered conditionals.

### 2. Externalize user-facing text

- Mark every user-visible string for extraction via the platform's message API/catalog. No hardcoded display strings in templates, logic, or constants.
- **Never concatenate or interpolate** translatable fragments — word order, gender, and plural agreement vary by language. Use a single parameterized message with placeholders (`{0}`, `{name}`) and pass values as arguments.
- Use the message API's **plural** and **gender/select** support (ICU MessageFormat style) rather than building `if`/branch strings.
- Provide translator **context/comments** for ambiguous strings (e.g. "Open" as verb vs. adjective).
- Do **not** translate: technical IDs, CSS classes, log/debug-only strings, enum keys, or values already localized upstream.

### 3. Format with locale-aware APIs, never hand-rolled patterns

Delegate all of these to locale-data-driven formatters (the technology skill names the exact API):

- **Dates / times / timestamps** — locale-aware date/time formatters; never assemble `MM/DD/YYYY` by hand.
- **Numbers / percentages / units** — locale number formatters (decimal/group separators differ by locale).
- **Currency** — currency formatters that derive symbol, placement, and fraction digits from the currency code and locale; store the ISO 4217 code, never the symbol.
- Pass the **user's resolved locale** explicitly to every formatter; do not rely on the process/host default.

### 4. Calendars, time zones, and time storage

- Do not assume Gregorian. Support alternate calendar systems where the locale requires them: **Gregorian, Japanese imperial (wareki/era), Islamic/Hijri, Buddhist, Hebrew, Persian (Solar Hijri)**, etc. Use the platform's calendar/chronology abstraction.
- **Store** instants in an unambiguous, locale-neutral form — UTC + ISO 8601 (or epoch) — and compute the **display** value (calendar, time zone, era) at render time.
- Track and apply the user's **time zone** separately from storage; never store wall-clock time without zone.

### 5. Unicode conformance

- Use **UTF-8** for storage/transport and a full-Unicode string type internally; support supplementary-plane characters (emoji, CJK extensions) — beware UTF-16 surrogate pairs.
- Apply **normalization** (NFC) at boundaries before comparison/storage; treat canonically equivalent strings as equal.
- Measure and truncate text by **grapheme cluster**, never by byte or code unit, to avoid splitting combining marks or surrogate pairs.

### 6. Input method (IME) and field readiness

- Accept the full Unicode range in input fields; do not restrict to ASCII or Latin-only patterns.
- Respect **IME composition** — do not act on or validate per-keystroke while composition is in progress.
- Make validation Unicode-aware (names, addresses, postal codes vary widely); avoid assumptions like "names are `[A-Za-z]`".

### 7. Sorting, searching, and collation

- Sort and compare strings with **locale-sensitive collation**, not raw byte/codepoint order.
- Make search **case-, accent-, and width-folding** aware using collation strength, so a query matches expected variants for the locale.

### 8. Keep direction and layout logical (not yet styled)

- Don't hardcode LTR assumptions in structure or APIs; express position/flow logically so localization can apply RTL later. Actual RTL rendering, fonts, and layout fitting are localization concerns — defer them.

## Constraints and Don'ts

- Don't translate anything here — i18n delivers a locale-neutral, ready system; translation is localization.
- Don't concatenate or template-interpolate translatable text; use one parameterized message.
- Don't hand-format dates, numbers, or currency, and don't omit the explicit locale argument.
- Don't assume Gregorian calendar, a single time zone, ASCII-only text, LTR-only direction, or byte-length/byte-order semantics.
- Don't bake locale-specific data into code paths; it must be data-driven so new locales need no code change.
- Don't pass ServiceNow non-standard locale codes (`pb`, `zt`, `fq`, …) to standards-based formatters, CLDR/`Intl` APIs, or external systems without first mapping to canonical BCP 47 (and reverse-mapping inbound).

## Output Checklist

- [ ] User's locale resolved from preference/negotiation (not the process default) and threaded explicitly to every lookup and formatter; locale and language kept distinct.
- [ ] All user-facing strings are externalized and parameterized; no concatenation or interpolation of translatable text.
- [ ] Plurals and gender/select handled by the message API, with translator context on ambiguous strings.
- [ ] Dates, times, timestamps, numbers, percentages, units, and currency use locale-aware APIs with an explicit locale.
- [ ] Instants stored as UTC/ISO 8601; calendar, era, and time zone resolved at display time.
- [ ] Alternate calendar systems supported where required (Japanese, Hijri, Buddhist, Hebrew, Persian, …).
- [ ] UTF-8 end to end; NFC normalization at boundaries; grapheme-aware length/truncation.
- [ ] Inputs accept full Unicode and respect IME composition; validation is not ASCII-bound.
- [ ] Sorting and searching use locale-sensitive collation with appropriate strength/folding.
- [ ] No locale-specific values hardcoded — adding a locale requires data only, no code change.
- [ ] Locale codes mapped between ServiceNow non-standard codes (`pb`→`pt-BR`, `zt`→`zh-TW`, `fq`→`fr-CA`, …) and canonical BCP 47 at every boundary with systems external to the ServiceNow platform, in both directions.
