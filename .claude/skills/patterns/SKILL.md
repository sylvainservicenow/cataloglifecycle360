---
name: patterns
description: >
  Always-on index of cross-cutting UI patterns — status/severity color, truncation +
  tooltip, form validation and loading/empty/error states, RTL icon flip, and
  overflow/filter/sort controls. Use when building any UI with these behaviors, even if
  unnamed.
metadata:
  author: servicenow
  version: '2.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Pattern Index

---

## Trigger Index

**One-line rules are summaries only — when a trigger fires, load the full pattern file; do not apply from the one-liner alone.**

| Trigger                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Pattern file                         | One-line rule                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| A field value is shown in color to convey status, severity, urgency, or category                                                                                                                                                                                                                                                                                                                                                                                                               | `references/color-systems.md`        | Semantic class, never literal hue (category palette pending in color-systems.md)                                                        |
| Any label, title, or value that can overflow its container (variable-length or data-driven text)                                                                                                                                                                                                                                                                                                                                                                                               | `references/truncation-tooltip.md`   | Clamp + tooltip, never font-shrink                                                                                                      |
| A form field or form-level area shows input validation or error feedback                                                                                                                                                                                                                                                                                                                                                                                                                       | `references/error-and-validation.md` | Inline field message or form-level banner; ARIA required                                                                                |
| A container can be in a loading, empty, or error state                                                                                                                                                                                                                                                                                                                                                                                                                                         | `references/view-states.md`          | Skeleton at primary-content-region scope; spinner at card/component scope; three-question check for empty cause; error: deferred in v0.x |
| An icon has directional meaning (arrows, chevrons, send) that must mirror in RTL layouts                                                                                                                                                                                                                                                                                                                                                                                                       | `references/rtl-icon-flip.md`        | Intent triage first — semantic icons flip, literal/non-directional do not                                                               |
| A control changes the _data itself_ — narrows, reorders, regroups, or replaces the rows/items on the same page. **NOT:** changes rendering density/columns/layout (→ view-display); free-text input (→ search); navigates to a new URL (→ navigation). **Control choice:** filter = multi-select pills or dropdown (never tabs); sort/group-by = segmented or dropdown; dataset-switch = pills, segmented, dropdown, or tabs — tabs only when the chrome swaps, the one valid tab use above a collection. Full 4×4 matrix in the file | `references/view-controls.md`        | Decision matrix maps control type to affordance                                                                                         |
| A set of actions, items, tabs, or content exceeds its container's visible budget (>4 actions, items/tabs don't fit, content too tall)                                                                                                                                                                                                                                                                                                                                                             | `references/overflow.md`             | Classify strategy (§1) and check the escalation matrix (§2 ★) before implementing; `role="menu"` for menus, `aria-expanded` for in-place expansion/truncation, indicators for scroll |
| _(typography-hierarchy — planned, no file yet)_                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                    | When text scale / weight / hierarchy decisions are needed, this will govern                                                             |

---

## Cross-cutting pattern references

Component sheets reference these patterns when applicable. The patterns load on-demand — not every component needs every pattern. `@accessibility`, `@internationalization`, and `@localization` are skills in the separate `@servicenow/agent-pack-aiux` pack.

| Pattern       | File                                      | When to load                                                        |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Forced colors | `@accessibility`                          | Component has interactive states or color-dependent differentiation |
| i18n / l10n   | `@internationalization` / `@localization` | Component has user-visible label or message text                    |
