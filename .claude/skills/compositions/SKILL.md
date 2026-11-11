---
name: compositions
description: >
  Composition generation and validation for ServiceNow UI — action sets, contextual
  actions, forms, cards, dialogs, data tables, and notifications. Use when assembling
  or validating multi-region components where each region has distinct layout and rules.
metadata:
  author: servicenow
  version: '2.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Horizon Design Knowledge Compositions

## What do you need?

| Task                                                                                                                        | Start here                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generate** a single composition                                                                                           | Read the spec → follow its design model                                                                                                                              |
| **Generate** a multi-region composition (card with header toolbar + footer action-set, dialog with body + action-set, etc.) | Classify each region **before writing code** → load and apply the full spec for **every** region, not just the container spec → see Multi-Region Orchestration below |
| **Validate** an existing component                                                                                          | Classify below → load spec → run its checks                                                                                                                          |
| **Classify** a button group or pattern                                                                                      | Use the decision tree below                                                                                                                                          |
| **Multi-region validation**                                                                                                 | Classify each region → validate sequentially → run cross-composition rules                                                                                           |

---

## Classification

### Button groups

Does the group have a **call to action** — one button that advances, completes, or decides?

- **Yes → Action set.** One button carries visual hierarchy (`btn-primary` or `btn-error`). Roles are distinct. Spec: `references/action-set-spec.md`
- **No → Contextual actions.** All buttons are equal-weight peers. Same variant, same visual weight, no spacers. Spec: `references/contextual-actions-spec.md`

**The test:** If you removed every button except one, would that one button "mean more" than the others? If yes → action-set. If every button would be equally missed → contextual actions.

### Overflow

Content exceeds its container's visible capacity. Four strategies exist — strategy selection is owned by the consuming composition's spec, not this skill.

| Signal                                                                                                              | Strategy             |
| ------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `role="menu"` on popover panel, `role="menuitem"` children                                                          | Menu                 |
| "View all" / "See all" link (`<a>`, navigational) OR "Show more" button (`<button>` with `aria-expanded`, in-place) | Show More / View All |
| `overflow-x-auto` / `overflow-y-auto` container with indicators                                                     | Scroll               |
| `line-clamp-*` with "Show more/less" toggle                                                                         | Truncation + Expand  |

**Classification and per-strategy mechanics moved to `@patterns/references/overflow.md`** (folded in 2026-08-17 from this skill's former `references/overflow-spec.md`, which no longer exists). Load that file for strategy taxonomy, escalation, constraints, and validation checks — this skill still owns overflow **policy** (which strategy a composition uses, which items overflow, trigger position) in each composition's own spec.

### Containers and assemblies

| Signal                                               | Composition  | Spec                              |
| ---------------------------------------------------- | ------------ | --------------------------------- |
| Card with header/body/footer regions, shadow, radius | Card         | `references/card-spec.md`         |
| Label + input/control + field message wrapper        | Form         | `references/form-spec.md`         |
| Tab bar switching parallel content views             | Tab group    | `references/tab-group-spec.md`    |
| Interrupting dialog with overlay                     | Dialog       | `references/dialog-spec.md`       |
| Tabular row-column data display                      | Data table   | `references/data-table-spec.md`   |
| System-level async notification                      | Notification | `references/notification-spec.md` |

### When classification fails

If the pattern cannot be matched to any spec: run general checks only (token compliance, a11y compliance via `@accessibility/SKILL.md`). Tag the region as "unclassified" in the report.

---

## Composition Library

| Composition        | Spec                                    | Status |
| ------------------ | --------------------------------------- | ------ |
| Action set         | `references/action-set-spec.md`         | Active |
| Contextual actions | `references/contextual-actions-spec.md` | Active |
| Card               | `references/card-spec.md`               | Active |
| Form               | `references/form-spec.md`               | Active |
| Tab group          | `references/tab-group-spec.md`          | Active |
| Dialog             | `references/dialog-spec.md`             | Active |
| Data table         | `references/data-table-spec.md`         | Active |
| Notification       | `references/notification-spec.md`       | Active |

---

## Pattern check (before generating any composition)

Before generating, load `@patterns/SKILL.md`, evaluate each trigger in its index against what you are building.

---

## Validation Protocol

This protocol works for any composition spec. Every spec contains a `## Validation Checks` appendix with check tables organized by category (structural, container, layout, semantic, content, accessibility). Each check has a stable ID and a spec section reference.

### Quick check (3–7 sentences)

1. Classify the composition using the decision tree above
2. Load the matching spec
3. Run the top 5 highest-signal checks from the spec's check appendix:
   - Structural checks first (is the classification correct?)
   - Token compliance (hardcoded values?)
   - ARIA baseline (correct roles and labels?)
4. Respond in 3–7 sentences: classification, key findings, one fix prompt
5. End with a ready-to-run fix prompt for the highest-priority finding

### Full review (structured checklist)

1. Classify the composition with reasoning
2. Load the matching spec
3. Run every check in the spec's `## Validation Checks` appendix
4. Produce a structured report using this template:

```
## [Composition] Review — [Component / Location]

**File:** [path]
**Classification:** [composition name] — [reasoning]
**Spec:** [spec filename]

### [Category name] (from spec check appendix)
- [pass/fail/n-a] [Check ID] [Check name]: [finding]
- [pass/fail/n-a] [Check ID] [Check name]: [finding]

### [Next category]
- ...

### Recommendations (prioritized)

1. **[severity]** [Check ID] — [description]
   **Fix:** [instruction referencing the spec section]

2. **[severity]** [Check ID] — [description]
   **Fix:** [instruction]
```

### Validate and fix

1. Run full review
2. For each violation, read the spec section cited by the check
3. Apply the fix pattern described in that spec section
4. Re-run the failing checks to confirm resolution

---

## Multi-Region Orchestration

This applies when a component contains multiple compositions (e.g., a card with contextual actions in the header and an action set in the footer) — **for generation as much as for validation.** A container spec (e.g. `references/card-spec.md`) governs the shell, slots, and token rules, but it does NOT restate the full rules for a composition nested in one of its regions. Loading only the container spec and generating a footer action-set "by analogy" from the container's own examples is how cross-region mistakes happen (e.g. carrying a header toolbar's `btn-ghost` into a footer's dismissive button, which is banned by `references/action-set-spec.md`). Treat "the container spec mentions this region" as a pointer to follow, not as the content itself.

### Step 1: Scope

Generating: identify distinct regions from the request (header actions, body, footer actions, etc.) before writing any markup. Validating: read the component source and identify distinct regions where compositions live.

### Step 2: Classify each region

Apply the classification decision tree to each region independently. A card's header toolbar and footer button group are almost always two _different_ compositions (contextual-actions vs. action-set) with different rules — classify them separately even though they share one card shell.

### Step 3: Load and apply every region's spec

**Generating:** before writing code for a region, load that region's full spec (not just the container spec's inline reference to it) and follow its design model — role-to-class mapping, layout, ARIA. Do this for every region, then assemble them inside the container spec's shell/slot structure.

**Validating:** for each classified region, load its spec, run checks, collect findings, then release the spec from context before loading the next. This keeps token budget manageable.

### Step 4: Cross-composition rules

After all per-region generation or validation, run the cross-composition rules below against the assembled component / collected findings.

---

## Cross-Composition Rules

These fire when multiple compositions share a surface. They catch boundary violations no individual spec can detect.

### X-001: Role redundancy

**When:** Action set + contextual actions on the same surface.
**Check:** No action-set role duplicates a contextual-action function. Compare semantic purpose across regions.
**Violation:** "Reject" as both a header icon-button and a footer button.
**Fix:** Remove from contextual-actions. Action-set footer is canonical for entity decisions.

### X-002: Classification escalation

**When:** Contextual actions inside a card with entity context (completable, resolvable, deletable).
**Check:** Does any button in the contextual-actions group advance, complete, or resolve the entity?
**Violation:** An "Approve" icon button in a toolbar — that's an action-set role masquerading as contextual.
**Fix:** Extract entity-decision actions to a footer action-set.

### X-003: Token consistency

**When:** Any two+ compositions on the same surface.
**Check:** All regions use the same token strategy. No mixing hardcoded hex with DaisyUI semantic classes. No mixing `bg-white` with `bg-base-100`.
**Fix:** Align all regions to DaisyUI semantic classes.

### X-005: ARIA scope conflict

**When:** Nested compositions with interactive elements.
**Check:** No conflicting ARIA role hierarchies. No duplicate `role="toolbar"` without distinct `aria-label`. No nested `role="group"` without differentiation.
**Fix:** Ensure each ARIA scope is distinct and labeled.

### X-006: Emphasis hierarchy

**When:** Action set + contextual actions, or multiple action sets.
**Check:** One clear primary action across the entire surface. No competing `btn-primary` elements across regions.
**Fix:** Demote the less important region's emphasis.

### X-007: Overflow strategy conflict

**When:** Two+ compositions with overflow on the same surface.
**Check:** Independent overflow triggers don't collide visually or create confusing interaction patterns. No stacked overflow menus.
**Fix:** Consolidate into a single overflow when possible.

### X-008: Missing expected region

**When:** Explicit surface map referenced, or card with entity context.
**Check:** Expected composition regions are present. A completable entity card should have an action-set footer.
**Fix:** Flag as gap. Do not invent content — report what's missing.

### X-009: Component sheet compliance

**When:** Any composition using buttons, cards, badges, or other primitives.
**Check:** Individual component usage follows the component sheet rules. Defer to `@components/SKILL.md`.
**Fix:** Apply the component sheet correction.

---

## Reference Direction

Compositions reference component specs for individual rules: `@components/SKILL.md`. Component specs do not reference composition specs. A component spec says what a button _is_. A composition spec says how buttons _assemble_.

Compositions reference cross-cutting patterns: `@patterns/SKILL.md`, `@accessibility/SKILL.md`. Patterns do not reference compositions.

## Cross-cutting pattern references

Component sheets reference these patterns when applicable. The patterns load on-demand — not every component needs every pattern.

| Pattern     | File                                      | When to load                                     |
| ----------- | ----------------------------------------- | ------------------------------------------------ |
| i18n / l10n | `@internationalization` / `@localization` | Component has user-visible label or message text |
