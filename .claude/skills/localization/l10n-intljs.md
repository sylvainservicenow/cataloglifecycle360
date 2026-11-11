---
name: l10n-intljs
description: Localize framework-agnostic TypeScript / JavaScript with the Mozilla Intl library — select the correct CLDR plural/ordinal category with Intl.PluralRules, render localized language/region/script/currency/calendar names with Intl.DisplayNames, detect RTL direction with Intl.Locale.getTextInfo(), drive first-day-of-week and calendar choices from getWeekInfo()/getCalendars(), build locale fallback chains, and verify CLDR data is actually applied. Use for plain JS/TS adapting per-locale behavior after i18n. Technology-specific companion to localization.
metadata:
  author: servicenow
  version: '1.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# TypeScript / JavaScript Localization with `Intl`

Technology binding of the **localization** skill for framework-agnostic TypeScript / JavaScript using the built-in [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) library. Assumes the code is already internationalized (see **i18n-intljs**): locale resolved with `Intl.Locale`, formatting delegated to the `Intl.*` constructors, segmentation/collation in place. This skill covers the **per-locale adaptation** that sits on top — choosing the right translated plural form, displaying localized names, detecting direction, and sourcing CLDR data from the runtime rather than hardcoding it. (Translation catalogs, RTL CSS, fonts, and layout fitting are not `Intl` concerns — keep those in your rendering layer / the **localization** governance skill; for Lit see **l10n-litjs**.)

`Intl` is itself CLDR-backed, so it is both the i18n formatter _and_ the source of authoritative per-locale data. Localization's job here is to **verify and apply** that data, not to re-derive it.

## When to use this skill

- Adding or QA-ing a specific locale/language for plain TS/JS code.
- A count- or rank-sensitive message picks its translated form with `if (n === 1)` instead of CLDR plural categories.
- Language, region, script, currency, or calendar names are shown from a hardcoded lookup table instead of localized at runtime.
- Direction (RTL/LTR), first day of week, weekend days, or default calendar are hardcoded per locale instead of read from locale data.
- Untranslated keys fall through to blanks or raw keys instead of a defined fallback chain.

## Instructions

### 1. Pick the correct CLDR plural / ordinal form with `Intl.PluralRules`

Languages have up to six plural categories (`zero`, `one`, `two`, `few`, `many`, `other`) — not just singular/plural. Resolve the category, then look up the **translated** message variant for that category from your catalog:

```js
const pr = new Intl.PluralRules(locale); // cardinal: "1 item" vs "2 items"
const category = pr.select(count); // 'one' | 'few' | 'many' | 'other' | …
const text = catalog[`items.${category}`].replace(
  '{n}',
  new Intl.NumberFormat(locale).format(count)
);

const ord = new Intl.PluralRules(locale, {type: 'ordinal'}); // "1st", "2nd", "3rd"
ord.select(3); // 'few' in en → suffix "rd"
```

- Provide one translated string per category the **target language** uses (`pr.resolvedOptions().pluralCategories` lists them); never collapse to two and never branch on the raw number.

### 2. Render localized names with `Intl.DisplayNames`

Show language pickers, region lists, currency labels, and calendar names in the user's language — don't ship a hand-maintained translation table:

```js
const langs = new Intl.DisplayNames(locale, {type: 'language'});
langs.of('de'); // 'German' (en) / 'Deutsch' (de) / 'allemand' (fr)
new Intl.DisplayNames(locale, {type: 'region'}).of('JP'); // 'Japan'
new Intl.DisplayNames(locale, {type: 'currency'}).of('EUR'); // 'Euro'
new Intl.DisplayNames(locale, {type: 'script'}).of('Hans'); // 'Simplified Han'
new Intl.DisplayNames(locale, {type: 'calendar'}).of('japanese'); // 'Japanese Calendar'
```

### 3. Detect direction and week structure from locale data — don't hardcode

Drive RTL mirroring and date UIs from the locale, not a maintained allowlist of RTL languages. These are **methods** on `Intl.Locale` (modern engines); the older `textInfo`/`weekInfo` accessor properties are deprecated and support varies — feature-detect:

```js
const loc = new Intl.Locale(tag);
const dir = (loc.getTextInfo?.() ?? loc.textInfo)?.direction ?? 'ltr'; // 'rtl' for ar, he, fa, ur
element.setAttribute('dir', dir);

const week = loc.getWeekInfo?.() ?? loc.weekInfo; // { firstDay, weekend:[...], minimalDays }
calendar.firstDayOfWeek = week?.firstDay ?? 1; // 1 = Monday … 7 = Sunday (ISO)
```

- Use `loc.getCalendars?.()` (or `Intl.DateTimeFormat(tag).resolvedOptions().calendar`) for the locale's default/available calendars instead of assuming Gregorian.
- Pass the detected `direction` to your CSS/rendering layer (logical properties, `<bdi>`, etc. — those belong to the rendering binding, e.g. **l10n-litjs**).

### 4. Build a fallback chain and verify CLDR data is applied

```js
const candidates = Intl.getCanonicalLocales([
  requested,
  new Intl.Locale(requested).minimize().toString(),
  'en'
]);
// → e.g. ['pt-BR', 'pt', 'en'] — try each against your catalog until a translation exists

// Confirm the runtime didn't silently fall back to a different locale:
const used = new Intl.DateTimeFormat(requested).resolvedOptions().locale;
if (new Intl.Locale(used).language !== new Intl.Locale(requested).language) {
  /* requested locale's CLDR data is unavailable in this runtime — log / widen the fallback */
}
```

- Ensure untranslated catalog keys fall back to the source string (then `en`), never to a blank or raw key.
- Check the runtime's CLDR coverage with `Intl.supportedValuesOf('calendar' | 'currency' | 'numberingSystem' | …)` before promising a locale.

## Constraints and Don'ts

- Don't reduce plurals to singular/plural or branch on the raw number — use `Intl.PluralRules.select()` and supply a translated variant per CLDR category.
- Don't ship hand-maintained tables of language/region/currency/script names — use `Intl.DisplayNames`.
- Don't hardcode RTL-language allowlists, first-day-of-week, weekend days, or default calendars — read them from `Intl.Locale` / `resolvedOptions()`.
- Don't assume `getTextInfo()`/`getWeekInfo()` exist everywhere — feature-detect and fall back (older `textInfo`/`weekInfo` properties or a safe default).
- Don't trust the requested locale was honored — verify with `resolvedOptions().locale` and define a fallback chain.
- Don't put CSS/bidi/font/layout fixes here — `Intl` supplies data and direction; rendering lives in your view layer (see **l10n-litjs** for Lit).
- Don't localize backend data or values already localized upstream.

## Output Checklist

- [ ] Count/rank-sensitive messages select a translated variant via `Intl.PluralRules` (cardinal and `type:'ordinal'`), covering every category the target language uses.
- [ ] Language, region, script, currency, and calendar names rendered with `Intl.DisplayNames` in the user's locale.
- [ ] Direction set from `Intl.Locale.getTextInfo().direction` (feature-detected); first day of week / weekend / minimal days from `getWeekInfo()`.
- [ ] Default/available calendar sourced from `getCalendars()` / `resolvedOptions()`, not assumed Gregorian.
- [ ] Locale fallback chain built with `Intl.getCanonicalLocales` + `minimize()`; untranslated keys fall back to source string, never blanks/keys.
- [ ] Runtime CLDR coverage verified with `resolvedOptions().locale` and `Intl.supportedValuesOf` before committing to a locale.

## Related skills

`localization` and `i18n-intljs` are part of this governance package; `l10n-litjs` is the sibling binding for Lit / AIUX components.

| Skill        | Relationship                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| localization | Governance source — defines _what_ to adapt per locale and _why_ (this is its plain-JS/TS binding).              |
| i18n-intljs  | Prerequisite — locale resolution, `Intl` formatting, segmentation, and collation must exist first.               |
| l10n-litjs   | Sibling binding for Lit / AIUX widgets — applies the direction/data this skill derives to CSS/bidi/fonts/layout. |
