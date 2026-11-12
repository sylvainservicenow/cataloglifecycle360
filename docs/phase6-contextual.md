# Phase 6: contextual intelligence

Journey: Select → Understand → Act → Review → Apply, all in Explore.

- One implementation: `components/cat-workspace.js`. `/explore` and the `/investigate?d=` deep link both mount it; the Investigate nav item is gone.
- Left panel with an item selected: its real findings (metadata, forms, overlap, categories, services) and five AI actions, signalled ones first. Single-item categories show a cautious "Review category fit" signal, not proof.
- One click on an action opens the review panel inline and starts the existing AI assessment (`autostart` on `cat-workbench` / `cat-transform`). Nothing runs on selection alone. Overlap needs a candidate group (≥2 items); otherwise it explains.
- A proposal is bound to its own record (`_proposal`), survives view switches and selecting other items, can be resumed or discarded, and never retargets. Apply, read-back and findings refresh are unchanged.
- Otto tools use the same actions and now start the assessment.
- Universe and inspector are not remounted when switching views (only after a verified category change, which reloads the catalog).

## Phase 7: interactive Home and deep-link contract

`lib/app-state.js` `exploreLink({lens, d, cat, item, highlight})` is the one contract. `highlight` = `all | requested | complete | categories | service` (population highlights, resolved from the native model with the same predicates as the Home KPIs) or `metadata-gaps | form-gaps | overlap | taxonomy-gaps | service-candidates` (open the matching investigation). The highlight survives until cleared; opening an investigation replaces it. No sys_ids travel in URLs.

## Phase 8: intelligent Explore

- `components/cat-toolbar.js`: one toolbar (Home | Explore | Investigate, lenses, search). The universe's own bar is hidden (`hide-bar`); search text is passed back as `externalQuery`.
- `lib/opportunities.js`: deterministic Top 10 over results already in memory. Ranking: evidence strength (verified fact 3, strong heuristic 2, weak heuristic 1), then recorded demand, then number of findings, then name. Round-robin across metadata / forms / duplicates / categories / services, one entry per item, at most two per category. No AI call, no score.
- Panel states: A overview (Top 10 + views), B Home highlight (population explanation + opportunities inside it), C category focus, D item (findings, AI actions), E proposal, F return. Choosing an opportunity selects the item (and highlights its candidate group) without any AI call.

## Build fix: pages must extend the base class directly

The AIUX build only recognises a page file whose class is `extends AIUXElement` or `extends mixin(AIUXElement)` (one level; see `PAGE_BASE_REGEX` in the SDK). From Phase 6 the Explore and Investigate pages extended a shared component class instead, so the build silently produced only the Overview route. The shared workspace is now a mixin (`withWorkspace`, which applies `withWidgetContext` itself) and each page is `extends withWorkspace(AIUXElement)`. Check `dist/manifest.json` → `pages` after a build: it must list /overview, /explore and /investigate.
