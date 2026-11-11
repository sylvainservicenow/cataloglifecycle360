# Phase 4: Full intelligence and transformation

Journey: Explore → Investigate → Understand → Recommend → Transform → Verify. Visual enrichment, icons and images are out of scope and were removed from Home, Investigate and Explore's detail panel.

## Investigations (all computed on demand from native records, never stored)

| Investigation | Deterministic discovery | AI step (one Generic Prompt call, on request) | Apply (human-confirmed, read-back verified) |
| --- | --- | --- | --- |
| Metadata (`ai-readiness`) | Name, description and form-presence checks | Semantic assessment; wording proposals (Transform) | `short_description`, `description` of the item |
| Forms (`form-intelligence`) | Every active variable: missing/technical/generic labels, required non-obvious inputs without guidance, repeated labels; answer choices on request | Better label and help text for flagged questions | `question_text`, `help_text` of the variable only |
| Overlap (`overlap`) | Candidate groups from names via an inverted word index (same name, same words, similar names); no all-pairs comparison | Compare a chosen group; verdict, similarities, differences, recommendation | None by design: no merge, deactivate or delete. Wording changes reuse Transform |
| Categories (`taxonomy`) | No category, vague category names, name fits another category better, look-alike categories | Chooses only among real existing categories; may add a clearly-labelled proposal | Adds a `sc_cat_item_category` link; never removes one |
| Services (`csdm-alignment`) | Verified links from `sc_cat_item_subscribe_mtom`; candidates anchored in item names | Judges candidate offerings; "no clear match" and "not enough information" are valid | Adds a `sc_cat_item_subscribe_mtom` link |

Correction to earlier phases: a native item-to-service-offering table exists (`sc_cat_item_subscribe_mtom`), so "no native link" was wrong.

## Safety properties

- Discovery and AI never write. Writes go through the Table REST API as the signed-in user, after an explicit confirmation, with a stale check and a read-back. Success is only shown if the read-back matches.
- Variable edits touch only `question_text` and `help_text`. Types, choices, requirements, scripts and defaults are never sent.
- Variables from a shared variable set are labelled with how many items share them.
- The server step validates every returned id against the candidates it was given.

## Security and instance changes

No ACL, role, table or API-access change was made in Phase 4. Earlier, documented: `admin`'s current application is Global (see phase3b-apply-changes.md). The four cross-scope privilege rows are unchanged.

## Test records written during validation (disposable instance)

| Record | Change | Rollback |
| --- | --- | --- |
| `sc_cat_item_category` `410be9b83bac53d80aa6ee5943e45a56` | "Report Network Issue" linked to "Network and Systems" | Delete that row |
| `item_option_new` `1e272cf04f79e2001f6eac118110c7bb` ("What can we help you with?") | Label `grcCode` → "Enter the GRC code" (help text proposal was rejected) | Set `question_text` back to `grcCode` |
| `sc_cat_item_subscribe_mtom` `afcc65f83bec53d80aa6ee5943e45a9e` | "Request zoom webinar" linked to the "Zoom" offering, to exercise the apply path. The AI itself answered "not enough information", so this link is not recommended. | Delete that row (automated deletion was refused in this session, so it was left in place) |

## Limits

- Conversational invocation through Otto's chat bar could not be driven by browser automation here. The registered client tools were verified by calling them directly.
- Forms: assessing all variables reads about ten thousand rows once (about 12 s) per session, then results are patched in place after an apply.
- The "name fits another category better" signal compares words in names only and is deliberately weak.
- Category and service writes are additive. Removing or replacing assignments is not offered.
