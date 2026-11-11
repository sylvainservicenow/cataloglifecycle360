# Overflow

Governs what happens when content exceeds its container's visible capacity. Owns: strategy classification, escalation between strategies, per-strategy constraints, and validation checks. Does **not** own: component chrome/tokens (see the owning component sheet), ARIA implementation detail (see `@accessibility`), i18n/l10n (see `@internationalization`/`@localization`), or overflow **policy** — which strategy a composition uses, which items overflow, trigger position within a group (see § 7, last row).

Replaces `overflow-menu.md`, `overflow-scroll.md`, `overflow-show-more.md`, and `overflow-truncation.md`, and folds in `@compositions/references/overflow-spec.md`'s classification layer (folded 2026-08-17 — see `compositions/SKILL.md` for the redirect note). Consuming compositions (action-set, contextual-actions, tab-group, data-table toolbar, card quick links, etc.) load this file directly.

---

## 1. Strategy taxonomy

| Strategy | Mechanism | Hidden content | ARIA pattern | When appropriate |
|---|---|---|---|---|
| **Menu** | Trigger opens a popover panel of actions | Fully hidden until triggered | APG Menu Button | Action groups with discrete, activatable items |
| **Show More / View All** | Trigger navigates to a full view or expands the container | Hidden behind navigation or collapsed container | Link or button (no special ARIA pattern) | Bounded previews where a complete list exists elsewhere |
| **Scroll** | Horizontal or vertical scroll with indicators | Visible but requires scrolling to reach | None beyond native scroll semantics | Continuous content where all items are peers — never tabs (§ 2) |
| **Truncation + Expand** | Content truncates with an inline toggle | Clipped with a reveal control | `aria-expanded` on toggle | Long-form text/descriptions where partial preview is useful |

**Selection heuristics:**
- Are the hidden items actions the user performs? → Menu
- Does a complete view exist at another URL or in an expanded state? → Show More / View All
- Are items homogeneous peers where position doesn't imply priority? → Scroll, with caution (§ 5)
- Is the content continuous text, not discrete items? → Truncation + Expand
- Is this value selection (combobox, listbox, select), not overflow? → not this file — see `@components/references/select.md`

---

## 2. Escalation matrix ★

Nine rules, scattered across the four predecessor files, consolidated here as a set:

| Situation | Wrong strategy | Instead | Check |
|---|---|---|---|
| One item would overflow | Menu | Keep inline | MS-06 |
| Needs submenus / hierarchy | Menu | Restructure; dialog | MS-07 |
| Tabs overflow | Scroll | Menu — see `@compositions/tab-group-spec.md` L-03 | SC-01 |
| Discrete items (buttons, cards) | Truncation + Expand | Menu / Show More / Scroll | TE-04 |
| Continuous prose | Menu / Show More / Scroll | Truncation + Expand | TE-04 |
| Too long to expand in place | Show More | View All (navigate) | SV-08 |
| Single clamped line | Truncation + Expand | No toggle at all | TE-05 |
| Everything already fits | any | No trigger renders | SV-06 |
| Value selection (combobox/listbox) | any | Not overflow — `select.md` | — |

---

## 3. Menu — constraints & deltas

Full mechanics (trigger, panel, ARIA, keyboard, chrome) are owned by `@components/references/dropdown.md` §§ 2–4, 9–10 (see § 7). This section states only what `dropdown.md` doesn't decide: when a menu is the right escalation, and constraints specific to overflow use.

- **Minimum item count: ≥ 3.** `dropdown.md:27`'s general floor governs here too — fewer than 3 actions shouldn't overflow into a menu at all; keep them inline or merge with another control instead. (Resolved 2026-08-17 — supersedes MS-06's original ≥2 wording.)
- **No nesting.** MS-07 — overflow menus don't contain sub-menus. If the action set needs hierarchy, restructure (e.g., a dialog) rather than nesting.
- **No form controls inside the `role="menu"` element.** MS-08 scopes to the menu list itself, not the panel — a search `<input>` as a panel-level sibling of the item list (`dropdown.md` § 6's pattern) is compliant. (Resolved 2026-08-17.)
- **Icon all-or-none.** MV-09 — every item in a menu follows the same icon pattern; mixed icon/no-icon presentation is a violation.
- **Destructive items: `text-error` only.** MT-05 — no other visual differentiation (no `bg-error`, no icon-color change). The label itself must communicate severity.
- **Grouping.** MA-08 — logically distinct item groups use `role="group"` with `aria-label` and a visual separator (separator token owned by `dropdown.md` § 7).
- **Labels ≤ 4 words, consistent grammatical form.** MT-01 / MT-03 — all imperative or all noun-phrase, not mixed. Long labels signal the wrong pattern (consider a dialog).
- **No truncation in menu items.** MT-04 stands — if labels truncate inside the menu, the menu is too narrow or the labels are too long; fix the labels, don't truncate.
- **Keyboard, Popover-specific delta only.** `dropdown.md` § 9 covers the full APG keyboard model. Three rules are specific to this pattern's Popover-API implementation and not restated there: `Tab` exits the menu without trapping focus (MK-08); focus returns to the trigger on every close path — Escape, item activation, *and* light-dismiss (MK-09); items use roving `tabindex` (MK-10).

---

## 4. Show More / View All

The `<a>` vs `<button>` disambiguation is this pattern's core decision — applies `@components/references/button.md` § 9 (link vs. button by navigational intent):

- **View All is an `<a href>`** (SV-01) — it navigates to a full view.
- **Show More is a `<button>`** with `aria-expanded` (SV-02) — it expands the current container in place.
- **Label toggles** "Show more" ↔ "Show less" on state change (SV-05); exact phrasing, not "Expand"/"Collapse"/"See more" — text-expansion and exact-phrase handling route to `@localization`/`@internationalization`, not specified here.
- **Count recommended, not required.** SV-07 — "View all (12)" is preferred over bare "View all"; omitting it is not a violation.
- **Trigger absent when everything already fits.** SV-06 — no trigger renders if there's nothing hidden.
- **Full expansion only, for DOM-reveal.** SV-08 — when Show More applies, it reveals *all* hidden items in one action, not incrementally. (Resolved 2026-08-17.) Scoped to revealing already-present DOM only — a fetch-based incremental load-more (`content-tree/src/handlers/on-load-more.js`) is a different mechanic outside this pattern (it doesn't use the `aria-expanded`/`aria-controls` trigger contract at all) and SV-08 doesn't govern it.
- **Focus after expansion [NEW].** Neither predecessor file said where focus goes after Show More expands. Per the disclosure pattern, focus stays on the trigger (which persists and relabels) unless the composition has a reason to move it.

ARIA wiring (`aria-expanded`, `aria-controls`) routes to `@accessibility` › `aria-apg-patterns/disclosure.md` (SV-03 / SV-04).

---

## 5. Scroll

- **Use with caution.** A scroll container hides content behind a physical gesture — items pushed off-screen get less attention than visible ones, creating an implicit priority hierarchy even among items intended as equal peers.
- **Never for tabs.** SC-01 — see § 2.
- **Indicators required.** SC-02 — a scrollable container needs at least one visual affordance (arrow buttons, fade gradient, or a visible scrollbar). No indicator is a violation.
- **Keyboard, either form.** SC-05 — arrow keys scroll the container when it has focus, OR each item is individually focusable via roving `tabindex`.
- **RTL [NEW].** Use logical properties (`start-0`/`end-0`), not physical (`left-0`/`right-0`), for indicator position and `aria-label` direction. Scroll-position detection (`scrollLeft > 0`) is RTL-fragile — `scrollLeft` sign/behavior varies by engine under `dir="rtl"`; detect direction-aware, not via a raw positive/negative check. Arrow-glyph mirroring itself defers to the tracked `rtl-icon-flip.md` decision.
- **`motion-reduce` for `scroll-smooth` [NEW].** Programmatic smooth scroll is a vestibular-trigger case per `motion/SKILL.md:28` — pair `scroll-smooth` with a `motion-reduce:` fallback.

Arrow-button element type and `aria-label` route to `@components/references/button.md` (SC-03 / SC-04, icon-only button conventions). Container semantic grouping (`role="group"` + `aria-label`) routes to `@accessibility` generic ARIA grouping guidance (SC-06).

---

## 6. Truncation + Expand

- **Prose only.** TE-04 — not discrete items (buttons, links, cards); see § 2.
- **Minimum 2 visible lines.** TE-05 — collapsed state must show ≥ 2 lines; single-line truncation with a "Show more" toggle adds a click for minimal benefit. (One conforming exception exists in production for a single-line AI-summary peek — `notifications-menu/.../render-summary-banner.js` — surfaced, not adjudicated.)
- **`line-clamp-2` / `-3` / `-4`.** TE-06 — real Tailwind classes, not the arbitrary-value form `line-clamp-[N]` (not valid Tailwind syntax).
- **Label toggles.** TE-03 — "Show more" ↔ "Show less", same as § 4.
- **No animation.** TE-07 — expand/collapse is instant; no height transition. Animating creates layout shift that disrupts reading position. `motion/SKILL.md` § Expand/Collapse's generic grid-rows animation is written for content not yet rendered in its layout position (e.g. accordions, disclosure panels); a truncation reveal un-clips text already in its final position, so that section's rationale doesn't transfer here — not treated as a live conflict.

ARIA wiring (`aria-expanded`, `aria-controls` [TE-08, new]) routes to `@accessibility` › `aria-apg-patterns/disclosure.md` (TE-02 / TE-08).

RTL: not yet written. `truncation-tooltip.md` § 7 covers ellipsis mirroring for the clamp case and is safe to follow — its inverted inline-start/inline-end terminology has been corrected.

---

## 7. Route-outs (C-03 dual pointers)

| Concern | Owner in pack | Normative owner |
|---|---|---|
| Panel chrome, placement, trigger config, RTL | `@components/references/dropdown.md` §§ 2–4, 10 | — |
| Menu keyboard + ARIA (structure, standard keys, trigger wiring, decorative icons, disabled items) | `dropdown.md` § 9 | `@accessibility` › `menu-button.md`, `menu-and-menubar.md` |
| `<a>` vs `<button>`, labels, never-truncate | `@components/references/button.md` §§ 5, 9 | — |
| Nested action menus | `@components/references/menu.md` | — |
| Expand/collapse motion | `@motion/SKILL.md` § Expand/Collapse | — |
| Disclosure ARIA (Show More, Truncation+Expand) | — | `@accessibility` › `disclosure.md` |
| Tab overflow (escalation + markup) | `@compositions/tab-group-spec.md` L-03 | `@accessibility` › `tabs.md` |
| Labels, counts, text expansion | — | `@internationalization` / `@localization` |
| Overflow **policy** (`max_visible`, which items, trigger position) | consuming composition spec | — |

That last row keeps compositions in the picture — policy never moves here.

---

## 8. Validation checks

Stable IDs preserved from the four predecessor files (no renumbering). `Owned` checks are governed by this file; `→ pointer` checks route to their true owner per § 7 (C-04 — the ID survives, the rule doesn't restate here).

### Menu (MS- / MA- / MK- / MV- / MT-)

| ID | Status | Rule / pointer |
|---|---|---|
| MS-06 | Owned | Minimum 3 items, aligned with `dropdown.md:27` (§ 3) |
| MS-07 | Owned | No nested menus |
| MS-08 | Owned | No form controls inside `role="menu"` — scoped to the list, not the panel (§ 3) |
| MS-01 / MS-02 | → pointer | Trigger is `<button>`; panel uses Popover API — `dropdown.md` §§ 2–4 |
| MS-03 / MS-04 / MS-05 | → pointer | Panel `role="menu"`, items `role="menuitem"`, item element — `dropdown.md` § 2 + `@accessibility` › `menu-button.md` |
| MA-08 | Owned | Groups carry `aria-label` |
| MA-01 / MA-02 / MA-03 / MA-04 | → pointer | Trigger ARIA wiring (`aria-haspopup`, `aria-expanded`, `aria-controls`, panel `id`) — `dropdown.md` §§ 3, 9 |
| MA-06 | → pointer | Icon-only trigger `aria-label` — `dropdown.md` § 3 (also requires a visible tooltip) |
| MA-05 / MA-07 | → pointer | Decorative icons `aria-hidden`; disabled items `aria-disabled` — `@accessibility` › `menu-button.md` |
| MK-08 | Owned | `Tab` exits without trapping focus |
| MK-09 | Owned | Focus returns to trigger on every close path |
| MK-10 | Owned | Roving `tabindex` |
| MK-01–MK-07 | → pointer | Standard APG menu keyboard (open, navigate, activate, escape) — `@accessibility` › `menu-button.md`, `menu-and-menubar.md` |
| MV-09 | Owned | Icon all-or-none |
| MV-01 / MV-02 / MV-04 | → pointer | Panel surface tokens (bg, border, shadow) — `dropdown.md` § 2 |
| MV-03 | → pointer | Panel radius — `dropdown.md` § 2. Note: the prior value (`rounded-xl` = 16px) was wrong; 16px is `rounded-2xl`. Not corrected in `skills/eval/suites/patterns/prompts.json:118` as part of this change — see that file's header note. |
| MV-05 / MV-06 / MV-08 | → pointer | Item hover/active/text-size chrome — `dropdown.md`'s `aiux-menu` |
| MV-07 | → pointer | Item default text color — `dropdown.md`'s `aiux-menu` (destructive override stays owned, MT-05) |
| MV-10 | → pointer | Separator token — `dropdown.md` § 7 |
| MT-01 / MT-03 | Owned | Labels ≤ 4 words; consistent grammatical form |
| MT-04 | Owned | No truncation in menu items (§ 3) |
| MT-05 | Owned | Destructive items use `text-error` only |
| MT-02 | → pointer | Label content quality (verb-first, no "click here") — `@components/references/button.md` § 5 |

### Scroll (SC-)

| ID | Status | Rule / pointer |
|---|---|---|
| SC-01 | Owned | Never for tabs — escalate to Menu (§ 2), see `@compositions/tab-group-spec.md` L-03 |
| SC-02 | Owned | Indicators required |
| SC-05 | Owned | Keyboard: container-scroll or roving `tabindex` |
| SC-03 / SC-04 | → pointer | Arrow button element + `aria-label` — `@components/references/button.md` |
| SC-06 | → pointer | Container semantic grouping — `@accessibility` generic ARIA grouping |

### Show More / View All (SV-)

| ID | Status | Rule / pointer |
|---|---|---|
| SV-01 | Owned | View All is `<a href>` |
| SV-02 | Owned | Show More is `<button>` |
| SV-05 | Owned | Label toggles Show more/Show less |
| SV-06 | Owned | Trigger absent when everything fits |
| SV-07 | Owned (recommended, not pass/fail) | Count included — "View all (N)" preferred |
| SV-08 | Owned | Full expansion only, DOM-reveal scope (§ 4) |
| SV-03 / SV-04 | → pointer | `aria-expanded` / `aria-controls` — `@accessibility` › `disclosure.md` |

### Truncation + Expand (TE-)

| ID | Status | Rule / pointer |
|---|---|---|
| TE-01 | Owned | Toggle is `<button>` |
| TE-03 | Owned | Label toggles |
| TE-04 | Owned | Prose only — escalation (§ 2) |
| TE-05 | Owned | Minimum 2 visible lines |
| TE-06 | Owned | `line-clamp-2/-3/-4`, not `line-clamp-[N]` |
| TE-07 | Owned | No animation on expand/collapse |
| TE-02 / TE-08 (new) | → pointer | `aria-expanded` / `aria-controls` — `@accessibility` › `disclosure.md` |
