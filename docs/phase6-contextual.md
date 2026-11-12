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
