---
name: l10n-litjs
description: Localize Lit / AIUX widget code — verify translation delivery and fallback, mirror layout for RTL via CSS logical properties and Tailwind logical utilities, isolate bidi text, cover target scripts/fonts, absorb text expansion, and pseudolocalize. Use for AIUX widgets rendering in RTL locales or non-Latin scripts. Technology-specific companion to localization.
metadata:
  author: servicenow
  version: '1.2.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Lit / AIUX Localization

Technology binding of the **localization** skill for Lit components. Assumes the code is already internationalized (see **i18n-litjs**): strings externalized via `i18n.getMessage()`, locale-aware `Intl` formatting and locale detection in place. This skill covers rendering the result correctly per locale — translation delivery, RTL/bidi, fonts/scripts, and layout fitting. (Locale-aware `Intl` formatting and `getLocale()` are i18n concerns — see **i18n-litjs**.)

## When to use this skill

- Adding or QA-ing a target language/locale for an AIUX widget.
- A component uses physical CSS properties or directional Tailwind utilities that break RTL.
- Mixed-direction (bidi) text — embedded Latin, numbers, or URLs in RTL — renders out of order.
- Translated labels truncate, overlap, or render tofu (□) in a target script.

## Instructions

### 1. Translation delivery and fallback

Lit/AIUX widget strings are not shipped in per-widget catalog files — the build-time extractor writes each `i18n.getMessage()` literal to the platform **`sys_ui_message`** table, translators provide a per-language row, and at render the server fetches the page's translations (`fetchWidgetTranslationsForPage`), injects them as `window.__WIDGET_MESSAGES__`, and `i18n.loadMessages()` loads them client-side.

- The actual **record translation** of the underlying `sys_ui_message` records per language is a platform task, handled outside this skill.
- Verify untranslated keys **fall back to the source string** (the `message` fallback), never to a blank or a raw key.
- Run **`now-sdk run dev --pseudo`** (pseudolocalization) early to surface unextracted strings, concatenation, and text-expansion overflow before real translation exists.

### 2. Mirror layout for RTL — CSS logical properties (in `static styles`)

Set the component/document direction for RTL locales (`dir="rtl"` on the host or root). Derive the direction from locale data via `Intl.Locale.getTextInfo()` per `l10n-intljs` §3 — not from a hardcoded RTL-language list. Then rely on logical, not physical, properties:

| Physical                         | Logical                                       |
| -------------------------------- | --------------------------------------------- |
| `margin-left` / `margin-right`   | `margin-inline-start` / `margin-inline-end`   |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right`   | `border-inline-start` / `border-inline-end`   |
| `left` / `right`                 | `inset-inline-start` / `inset-inline-end`     |
| `text-align: left` / `right`     | `text-align: start` / `end`                   |
| `float: left` / `right`          | `float: inline-start` / `inline-end`          |

When `left: 0` and `right: 0` appear together, use the shorthand `inset-inline: 0`; `top/left/right/bottom: 0` becomes `inset: 0`.

### 3. Mirror layout for RTL — Tailwind logical utilities (in templates)

| Physical                      | Logical                       |
| ----------------------------- | ----------------------------- |
| `ml-*` / `mr-*`               | `ms-*` / `me-*`               |
| `pl-*` / `pr-*`               | `ps-*` / `pe-*`               |
| `left-*` / `right-*`          | `start-*` / `end-*`           |
| `text-left` / `text-right`    | `text-start` / `text-end`     |
| `border-l-*` / `border-r-*`   | `border-s-*` / `border-e-*`   |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |

Symmetric utilities (`px-*`, `mx-*`, `border-t-*`, `border-b-*`) are direction-neutral — leave them. Mirror only directional UI (chevrons, back/forward, progress); do **not** mirror logos, numerals, media controls mapping to physical reality, or charts with intrinsic direction.

### 4. Isolate bidirectional (bidi) text

Logical CSS handles _layout_ direction; it does **not** fix _character-level_ reordering when LTR runs (Latin words, numbers, URLs, user names) are embedded in RTL text (or vice versa). Isolate each embedded run so the bidi algorithm keeps ordering correct:

- Wrap embedded opposite-direction runtime values in `<bdi>`:
  ```js
  html`<span
    >${i18n.getMessage('Sent by {0}', [''])}<bdi>${userName}</bdi></span
  >`;
  ```
- For container-level isolation in `static styles`, use `unicode-bidi: isolate` (with `direction`), not `embed`/`bidi-override`.
- Set `dir="auto"` on inputs/elements whose content direction is unknown at author time (free-text fields, user-generated content).

### 5. Fonts, scripts, and text expansion

- Ensure the widget's font stack (and `@font-face`/fallback) covers every target **script** (CJK, Arabic, Hebrew, Devanagari, Thai) so nothing renders tofu; allow taller scripts adequate `line-height`.
- Don't size containers to the English string — translations can run 30–40%+ longer (German, Finnish, Russian). Avoid fixed widths/heights and single-line truncation on translatable text; prefer wrapping or graceful ellipsis with full-text access. Verify labels, buttons, table headers, tabs, and tooltips at the longest expected translation.

## Constraints and Don'ts

- Don't localize backend data or props already localized upstream.
- Don't replace symmetric/block-axis properties (`px-*`, `py-*`, `border-t`, `border-b`) — only inline-axis properties need logical equivalents.
- Don't rely on logical CSS alone for mixed-direction text — isolate bidi runs with `<bdi>`/`unicode-bidi: isolate`.
- Don't mirror non-directional elements (logos, numerals, intrinsic-direction media) in RTL.
- Don't size UI to the source language or bake translatable text into images.
- Don't leave fallback showing raw message keys or blanks for untranslated entries.

## Output Checklist

- [ ] Untranslated keys fall back to the source string, never to keys or blanks; `now-sdk run dev --pseudo` run to catch extraction/expansion defects.
- [ ] RTL locales render mirrored via `dir` + logical CSS/Tailwind; only directional elements mirrored.
- [ ] Bidi runs (embedded Latin, numbers, user content) isolated with `<bdi>`/`unicode-bidi: isolate`/`dir="auto"`.
- [ ] Fonts/fallbacks cover all target scripts (no tofu); line-height accommodates tall scripts.
- [ ] Layout absorbs 30–40%+ expansion without truncation or overlap; no fixed-width single-line traps.

## Related skills

`localization` and `i18n-litjs` are part of this governance package; `accessibility` and `responsive-design` are separate skills (both are **Horizon Design** skills, present only where that system is installed).

| Skill             | Relationship                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| localization      | Governance source — defines _what_ to adapt per locale and _why_ (this is its Lit binding).                                                                  |
| i18n-litjs        | Prerequisite — externalized strings, `Intl` formatting, and locale detection must exist first.                                                               |
| l10n-intljs       | Source of truth for the `Intl` data APIs this binding consumes — `PluralRules`, `DisplayNames`, and direction/week data via `getTextInfo()`/`getWeekInfo()`. |
| accessibility     | RTL mirroring, focus order, and bidi must keep the UI WCAG 2.2 AA compliant per locale.                                                                      |
| responsive-design | Text expansion and reflow must hold from 320px up without truncation or overlap.                                                                             |
