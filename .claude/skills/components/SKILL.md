---
name: components
description: >
  Component generation and selection for the Horizon Design Knowledge design system —
  routes to the correct sheet for any DaisyUI primitive (button, card, modal, input,
  tabs, badge, and 22 others). Use when generating, validating, or selecting a
  component for a UI task.
metadata:
  author: servicenow
  version: '2.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Component Sheets

Each file below defines the design rules for one DaisyUI component as used in ServiceNow, including which real mechanism to generate — a governed production component, or the native element plus DaisyUI class family. Read the matching file when generating or validating a specific component.

## Content boundary

Component sheets contain **design intent only** — variant selection, anatomy, behavior rules, content rules, accessibility requirements, forced-colors behavioral pattern assignment, and which production mechanism to generate (the "Production component" header line — see below). They do NOT contain runtime implementation _internals_: how a wrapper resolves CSS variables, manages shadow DOM, or applies Janus overrides/themeGenerator behavior. Knowing _what_ to use is design intent; knowing _how it works inside_ is not. If you don't find internal implementation details in a sheet, that is intentional — do not invent them.

---

## Component routing table

| File                        | Component   | Description                                                                 |
| --------------------------- | ----------- | --------------------------------------------------------------------------- |
| `references/accordion.md`   | Accordion   | Expandable content sections for dense views and side panels                 |
| `references/alert.md`       | Alert       | Inline messages communicating important information without interruption    |
| `references/avatar.md`      | Avatar      | Visual representation of a person or entity                                 |
| `references/badge.md`       | Badge       | Status, category, or count indicator attached to another element            |
| `references/breadcrumbs.md` | Breadcrumbs | Hierarchical location indicator with parent-page navigation                 |
| `references/button.md`      | Button      | Standard interactive element for triggering actions ★ gold standard         |
| `references/card.md`        | Card        | Container grouping related content and information                          |
| `references/checkbox.md`    | Checkbox    | Multi-select control for independent options                                |
| `references/dropdown.md`    | Dropdown    | Action menu with a list of user-invokable actions                           |
| `references/icon.md`        | Icon        | Graphic symbol for recognition, labels, and common actions                  |
| `references/input.md`       | Input       | Single-line free-form text entry field                                      |
| `references/label-value.md` | Label Value | Field label paired with its value in record and card displays               |
| `references/menu.md`        | Menu        | Multi-level hierarchical menu (nested items expand inline, accordion-style) |
| `references/modal.md`       | Modal       | Workflow-interrupting dialog for input, confirmation, or critical info      |
| `references/pagination.md`  | Pagination  | Page navigation control for large data sets                                 |
| `references/pill.md`        | Pill        | Compact interactive element for tags, filters, or selected values           |
| `references/popover.md`     | Popover     | Contextual content panel triggered by a specific element                    |
| `references/progress.md`    | Progress    | Completion status indicator for tasks or processes                          |
| `references/radio.md`       | Radio       | Single-select control for mutually exclusive options                        |
| `references/select.md`      | Select      | Predefined-list value picker for form contexts                              |
| `references/steps.md`       | Steps       | Sequential multi-step process guide                                         |
| `references/tabs.md`        | Tabs        | Parallel view switcher for related content at the same level                |
| `references/textarea.md`    | Textarea    | Multi-line free-form text entry field                                       |
| `references/toast.md`       | Toast       | System-level asynchronous notification not tied to a page location          |
| `references/toggle.md`      | Toggle      | Binary on/off switch with immediate effect                                  |
| `references/tooltip.md`     | Tooltip     | Supplementary hover text for abbreviations, icons, and truncated content    |

---

## How to use a component sheet

1. **Find the component** in the table above.
2. **Read the sheet, starting with the header.** Every sheet opens with a three-line header: `DaisyUI base`, `Production component`, `Last updated`. The `Production component` line tells you what to generate — if it names a component (e.g. `<aiux-modal>`, `<aiux-tab-group>`), use that component, not hand-built class-family markup. If it says `None`, use the native element + the class family named in the sheet body; a governed wrapper may still exist in the codebase with zero production adoption (the sheet will say so) — do not use it anyway. Beyond the header, the sheet documents only what an agent would get wrong without it — ServiceNow-specific variants, token usage, anatomy, content rules, accessibility corrections, and forced-colors pattern assignment.
3. **DaisyUI defaults apply unless the sheet says otherwise.** If a property isn't mentioned in the sheet, DaisyUI's default behavior is correct.
4. **Check accessibility corrections.** If the sheet references a DaisyUI correction, apply it. For the full per-component corrections list, reference `@accessibility`.
5. **Check forced-colors pattern.** Each sheet's accessibility section states which forced-colors behavioral pattern the component follows (interactive, field, or container). For the state tables and CSS implementation, reference `@accessibility`.

---

## Styling rules

All component sheets use **Tailwind utility classes and DaisyUI component classes only**. No CSS custom properties are prescribed in sheet content. `themeVariables.css` custom properties are runtime implementation details — not referenced in design specs.

### DaisyUI naming collision awareness

- `text-primary` = brand teal text in DaisyUI, NOT the default text color
- `text-text-primary` = default text color
- `text-text-primary` / `text-text-secondary` / `text-text-tertiary` = Janus-registered utilities resolving to semantic variables
- When Figma shows "primary" for text color, verify whether it means brand teal (`text-primary`) or default text (`text-text-primary`)

---

## Cross-cutting pattern references

Component sheets reference these patterns when applicable. The patterns load on-demand — not every component needs every pattern.

| Pattern              | File                                      | When to load                                                        |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Color systems        | `@patterns`                               | Component uses status or category color mapping                     |
| Forced colors        | `@accessibility`                          | Component has interactive states or color-dependent differentiation |
| Truncation + tooltip | `@patterns`                               | Component has text that may overflow its container                  |
| Overflow strategies  | `@patterns`                               | Component has overflow behavior                                     |
| i18n / l10n          | `@internationalization` / `@localization` | Component has user-visible label or message text                    |

---

## Composition context

When a component is used inside a composition (action-set, contextual-actions, card, overflow, etc.), the composition spec governs how the component assembles. The component sheet governs how the individual component looks. Both apply.

Reference direction: composition specs reference component sheets. Component sheets do not reference composition specs.

For composition routing and validation, use `@compositions/SKILL.md`.

---

## Accessibility

All component generation must conform to the accessibility skill (`@accessibility`). Each component sheet's accessibility section lists the relevant APG pattern, the DaisyUI correction reference, and which forced-colors behavioral pattern (interactive / field / container) applies — the accessibility skill provides the full state tables, CSS, and ARIA implementation.

---

## Gold standard

`references/button.md` is the gold standard component sheet. All component sheets match its structure: the three-line header (`DaisyUI base` / `Production component` / `Last updated`), numbered sections, Design Spec content only, Tailwind + DaisyUI classes throughout, accessibility corrections incorporated, forced-colors pattern stated.
