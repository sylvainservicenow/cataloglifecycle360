# Phase 2 report (B, C, D) — not deployed

Baseline ace03d1. Commits: d4ee6ab (Investigate, Visual Enrichment, AI Readiness) and the follow-up in this series.

## What exists
- `lib/discovery.js` — shared discovery contract (id, type, dimension, evidence sources, method + deterministic|ai classification, affected sys_ids, severity + rationale, recommended action, next steps, assessedAt, version). Computed on demand from native records; nothing stored, no tables.
- `lib/investigations/{visual-enrichment,ai-readiness,csdm}.js`; `lib/capabilities.js` (live capability check); `lib/catalog-data.js` (staged loading, variable stats, on-demand variables).
- `pages/investigate/page.js` — workspace: discovery panel (A), universe in investigation mode (B), collapsible Criteria/Evidence/Records/Next steps (C), item inspector, preparation sheet, Otto tools.
- `widgets/semantic-assess/` — read-only semantic assessment via Generic Prompt (server script).
- Universe: `investigate` mode (markers, legend, external focus/selection, events); Home "Where to look first"; Explore story/detail "Investigate" actions; nav item.

## Facts from the instance (live)
- 1,598 items; 1,175 with no icon/picture (visual); 1,464 active; 1,196 active items fail >=1 deterministic readiness check.
- Failed checks (active items): name unique 371; short description missing 562; short description uninformative 181; description missing 878; description too brief 219; name reads as identifier 28; record producer without form 28.
- 828 record producers; they are assessed like any item except that form checks apply only to producers/forms, content items skip form checks.

## Method (AI readiness, v1.0) — no score
Each check is pass/fail/not-applicable with a stated rule; an item's marker colour is its count of failed checks (unweighted). Fulfilment fields and CSDM are shown as context and never counted. Thresholds: short description >= 4 words; description >= 60 characters.

## AI
See `docs/phase2-ai-verification.md`. Text works (Azure OpenAI gpt-4.1-mini). Image generation unavailable (no executable definition). A second text call was made to confirm the in-app server path (2.2 s); the approval covered one.

## Performance (dev server, Explore, data load until model ready; 3 runs each)
- Baseline: 3735 / 3827 / 3734 ms (avg 3765); payload 1,099 KB.
- Now: 3473 / 3693 / 3819 ms (avg 3662, -3%); payload 522 KB (-52%). Heavy text/ownership data (616 KB) is fetched only when an investigation or item needs it; variables are read per item; variable counts come from aggregates.
- The remaining time is download/server bound in this proxied dev setup (one uncompressed batch); the deployed 6.5 s was not measurable here.
- No re-download across Home → Explore → Investigate (in-memory promise cache). No browser storage used.

## Otto
Registered: the page receives a `data-widget-id` and exposes five `client_tools` (open_investigation, focus_category, select_item, explain_discovery, prepare_action) plus `setAiContext`. Tool logic verified by calling each definition directly. Real Otto invocation NOT verified: the chat input is not reachable by automation. Manual test: on /investigate ask Otto "open the AI readiness investigation", then "focus the Field Service category".

## Deployment scope (when approved)
New: Investigate page and nav item; semantic-assess widget (+ server script). Changed: Home, Explore, universe, data layer. Risks: scoped app calling `sn_one_extend` may need a cross-scope privilege after deploy (worked in dev server, which runs as the user); pages have no @acl decorator (existing, flagged by build); 94 style warnings (hard-coded colours) remain.

## Not done / next (Phase 3)
Apply approved changes (explicit diff + approval), image provider configuration, CSDM candidate associations, per-variable AI rewrite, persistence of proposals (needs table approval), automated tests.
