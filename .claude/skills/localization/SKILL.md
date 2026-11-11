---
name: localization
description: Culturally adapt a well-internationalized system for specific locales — translation, RTL orientation, font/script coverage, layout fitting (truncation/overlap), and CLDR data adaptation. Use when adding or reviewing locale support, translation catalogs, RTL layouts, script/font issues, text-expansion overflow, or locale data patterns. Technology-agnostic; pair with a l10n-{technology} skill for concrete APIs. Prerequisite: internationalization.
metadata:
  author: servicenow
  version: '2.1.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Localization (l10n)

Localization is the **cultural and linguistic adaptation of an already-internationalized system** for one or more target locales. It assumes the i18n layer is in place: strings externalized, formats locale-driven, Unicode-clean, collation-ready. If those preconditions are missing, **stop and apply the internationalization skill first** — localizing a non-internationalized system means hardcoding workarounds you will have to undo. Keep the separation: i18n makes the system _capable_ of any locale; localization _supplies and adapts_ the per-locale specifics.

## When to use this skill

- Adding, reviewing, or QA-ing support for one or more specific locales/languages.
- Producing or maintaining translation catalogs and translator context.
- Enabling RTL (Arabic, Hebrew, Farsi, Urdu) layout and bidi behavior.
- Resolving missing-glyph / font-fallback / line-height issues for non-Latin scripts.
- Fixing truncation, overlap, or clipping caused by translated text expansion.
- Adapting locale data patterns (date order, first day of week, name/address/phone formats, units) from CLDR.

## Prerequisite

The system must already be internationalized (see **internationalization**): externalized parameterized messages, locale-aware formatting APIs, UTC/ISO storage, Unicode/UTF-8 throughout, locale-sensitive collation. Verify this before localizing.

## Dispatch to a technology skill

This skill is technology-agnostic — it defines _what_ to adapt per locale. For the concrete APIs (catalog formats, RTL/bidi, font fallback, CLDR access), **Read the matching `l10n-<technology>` companion file** (path in the table below — these are bundled files of this skill, not separately invocable skills) and follow it alongside this skill. Detect the technology from the codebase, then dispatch:

| Input technology                 | Detect by                                                     | Companion skill | File             |
| -------------------------------- | ------------------------------------------------------------- | --------------- | ---------------- |
| Lit / JS web components          | `.js`/`.ts` with `lit`, `@lit/localize`                       | `l10n-litjs`    | `l10n-litjs.md`  |
| Framework-agnostic TypeScript/JS | `.js`/`.ts` using `Intl.*` directly, no framework message API | `l10n-intljs`   | `l10n-intljs.md` |

- First confirm the i18n prerequisite is met for that technology (see the matched `i18n-<technology>` companion); if not, dispatch there first.
- If multiple technologies are present, read each relevant companion file and apply it to its part of the codebase.
- If no companion matches, apply this skill's principles directly using that platform's localization APIs and CLDR data.
- The companion provides exact APIs; this skill remains the source of truth for _what_ must be adapted per locale and _why_.

## Goals

- Deliver accurate, context-aware translations for each target language.
- Make the UI render correctly in every target locale: direction, script/fonts, and layout that absorbs text expansion without truncation or overlap.
- Drive locale-specific behavior from authoritative CLDR data rather than per-locale custom code.

## Instructions

### 1. Translation

- Translate from the externalized catalogs only — never edit source strings to "localize."
- Supply translators with **context/comments, screenshots, and a glossary/terminology** list; keep brand terms and do-not-translate terms in the glossary.
- Apply the correct **plural rules per language** (CLDR plural categories: zero/one/two/few/many/other — not just singular/plural) and **gender/select** variants.
- Define a **fallback chain** (e.g. `pt-BR → pt → en`) and ensure untranslated keys fall back gracefully rather than showing keys or blanks.
- Use **pseudolocalization** early to surface concatenation, missing extraction, and expansion problems before real translation. Note these are _i18n_ defects caught during an l10n pass — fixes belong in the i18n layer (route them back to the matching `i18n-<technology>` companion), not patched per-locale here.

### 2. Right-to-left (RTL) orientation

- For RTL locales, mirror the layout direction and align flow to the start edge using **logical**, direction-aware constructs (set document/component direction; rely on logical start/end, not physical left/right).
- Handle **bidi** text (mixed RTL/LTR, numbers, embedded Latin) with proper isolation so ordering stays correct.
- **Mirror** directional UI: navigation, progress, chevrons/back-forward icons, sliders. **Do not mirror** logos, media controls that map to physical reality, numerals, or charts with intrinsic direction.

### 3. Font and script support

- Ensure bundled/fallback fonts cover every target **script** (Latin diacritics, CJK, Arabic, Hebrew, Devanagari, Thai, etc.); define a **font-fallback** chain so no locale renders tofu (□).
- Allow taller scripts adequate **line-height/leading** and avoid clipping of ascenders/descenders and combining marks.
- Never bake text into images; text must stay live so it can be translated and rendered with the right font.

### 4. UI layout: absorb expansion, prevent truncation and overlap

- Plan for **text expansion** — translations can run 30–40%+ longer than English (German, Finnish, Russian) and some far shorter (CJK). Don't size containers to the source-language string.
- Use **flexible, wrapping** layouts; avoid fixed widths/heights, single-line truncation, and tight absolute positioning that overlaps when text grows.
- Verify labels, buttons, table headers, tabs, and tooltips at the longest expected translation; allow wrapping or graceful ellipsis with full-text access.

### 5. CLDR data adaptation

i18n already _calls_ CLDR-backed formatters; localization's job is to **verify and adapt** that the right per-locale data is current and actually applied. Adapt locale-specific behavior from the **Common Locale Data Repository (CLDR)** rather than custom per-locale code:

- **Date/time patterns and order** (e.g. d/M/y vs. M/d/y), **first day of the week**, weekend days, and the locale's **default calendar**.
- **Number/currency** grouping, decimal separators, and currency symbol placement.
- **Name and address** field order and components; **telephone** and **postal** formats.
- **Measurement system** (metric vs. US/imperial) and unit display.
- Verify the platform's CLDR version is current and that the target locale's data is actually applied at runtime.
- **Key CLDR/fallback lookups on canonical BCP 47, not ServiceNow codes.** CLDR data, `Intl` keys, and fallback chains are addressed by BCP 47 (`pt-BR`, `zh-TW`, `fr-CA`). ServiceNow uses non-standard codes for some locales — `pb` (= `pt-BR`), `zt` (= `zh-TW`), `fq` (= `fr-CA`), among others. When a locale identifier arrives from or is sent to a system **external to the ServiceNow platform**, map it to/from canonical BCP 47 **before** any CLDR lookup, fallback-chain construction, or formatter call. Build the chain on the canonical tag (`pt-BR → pt → en`), never on the ServiceNow code (`pb`) — a chain built on `pb` resolves no CLDR data and silently falls through to the default.

### 6. Cultural adaptation

- Review **colors, icons, imagery, examples, and tone** for cultural appropriateness; replace locale-inappropriate assets.
- Respect locale expectations for **honorifics, name display order, and sort order**.

## Constraints and Don'ts

- Don't localize a system that isn't internationalized — fix i18n first.
- Don't hardcode per-locale layout fixes; drive direction from logical constructs and data from CLDR.
- Don't size UI to the source language or rely on single-line truncation for translatable text.
- Don't reduce plurals to singular/plural; use CLDR plural categories for the language.
- Don't mirror non-directional elements (logos, numerals, intrinsic-direction media) in RTL.
- Don't ship text baked into images.
- Don't build fallback chains or perform CLDR/`Intl` lookups on ServiceNow non-standard codes (`pb`/`zt`/`fq`, …) — normalize to canonical BCP 47 first when the identifier crosses a boundary with a non-ServiceNow system.

## Output Checklist

- [ ] Translations come from externalized catalogs with translator context, glossary, and screenshots.
- [ ] CLDR plural categories and gender/select variants applied per language; fallback chain handles untranslated keys.
- [ ] Pseudolocalization run to catch extraction, concatenation, and expansion defects.
- [ ] RTL locales render mirrored via logical direction; bidi isolation correct; only directional elements mirrored.
- [ ] Fonts/fallbacks cover all target scripts (no tofu); line-height accommodates tall scripts; no text in images.
- [ ] Layout absorbs 30–40%+ expansion without truncation or overlap; no fixed-width single-line traps.
- [ ] Date order, first day of week, calendar, number/currency, name/address/phone, and units sourced from CLDR.
- [ ] Colors, icons, imagery, and tone reviewed for cultural appropriateness.
- [ ] Locale identifiers crossing a boundary with systems external to the ServiceNow platform mapped between ServiceNow codes (`pb`/`zt`/`fq`, …) and canonical BCP 47 before any CLDR lookup, fallback-chain construction, or formatter call.
