# Phase 2 handoff (after Checkpoint B0)

Baseline `653134d`. B0 (Explore UX corrections) is done and browser-verified. Nothing is deployed.

## State
- `cat-universe.js`: wheel zoom (pointer-centred), drag pan (5px threshold, click suppressed after a drag), zoom/pan pad, +/-/0/arrow keys on the svg, scoped metrics via `_scope()` + `scopeStats()` in `lib/catalog-data.js`, per-lens legend, search-match rings, inset search focus ring.
- Completeness colours: 0/4 red, 1 orange, 2 amber, 3 teal, 4 green. Overview palette has no red. Demand = blue vs grey (not an error). CSDM = neutral.
- Multi-category items are drawn/counted once, in their primary category (`catIds[0]`); `alsoIn` reports the others.
- Verified facts: 1,598 items; 1,175 with no icon/picture; 10,971 variables; 713 variable sets; 987 `io_set_item`; 146 service offerings; no item→offering reference on `sc_cat_item`. Fields available: owner, group, flow_designer_flow, workflow, delivery_plan, taxonomy_topic.
- AI (configured, NOT yet invoked): Now Assist skill "Image generation" (`sn_nowassist_skill_config` 7e926a45ff558310a3aeffffffffffec, capability d6a4f234ffd5c310a3aeffffffffffcb); other skills include "Catalog item generation", "Catalog item form slot fill". `sys_generative_ai_predictions_log` is 403 for the SDK user. Approved: ONE text and ONE image test only, no retries; inspect invocation contract first.
- Otto: documented route is `withWidgetContext(AIUXElement)` + `setAiContext()` + `static client_tools` (see `.claude/skills/aiux-build/references/widget/chat-integration.md`). Not yet verified.

## Dev and testing
- A dev server for this app already runs (`now-sdk run dev`, PID may change; serves http://localhost/aiux/catalogintelligence360/<page>, rebuilds on save). Do not start a second one (port 3101 clash).
- Browser: `~/.claude/skills/gstack/browse/dist/browse connect` opens a headed browser you control; the user logs in manually inside it. The `handoff` Chrome is a separate profile and cannot be reused. Never copy cookies.
- The universe lives in shadow DOM: find `cat-universe` recursively, then use `.shadowRoot`. Dispatch real `PointerEvent`/`WheelEvent` for tests.
- Lint has 0 errors; ~95 pre-existing style warnings (hard-coded colours) are known.

## Remaining
**B** Investigate: `lib/discovery.js` (id, type, title, description, evidenceSource, method, classification deterministic|ai, affectedIds, severity+rationale, recommendedAction, nextSteps, assessedAt, version, dimension), `lib/investigations/{visual-enrichment,ai-readiness,csdm}.js`, `pages/investigate/page.js` (route `/investigate?d=&cat=&item=`), universe props `highlightIds`/`focusCategory`, nav item, Home/Explore links (the dock story CTA "Show where" is the natural entry). "Prepare Visual Enrichment" is a preview only; no record writes.
**C** AI Readiness: deterministic checks from sc_cat_item + item_option_new (load variables on demand), respect record producers (`sc_cat_item_producer` variables are on `producer_id`/`cat_item` — verify), transparent versioned method, semantic layer only if the approved text test works, else "pending". CSDM stays a separate dimension.
**D** Home→Explore→Investigate→Prepare Transformation (preview only); Otto tools; performance: baseline ~6.5 s; likely cost is full `sc_req_item` download (replace with an aggregate) and over-wide field lists; in-memory cache only (no browser storage). Measure before/after. Final: build, lint, screenshots, commit, STOP before deploy.
