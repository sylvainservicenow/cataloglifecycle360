# Phase 3B: Apply, instance changes and rollback

Apply writes through the Table REST API as the signed-in user (`PATCH /api/now/table/<record class>/<sys_id>`), after a fresh read and stale check, then reads the value back. Native ACLs decide; no cross-scope privilege is used.

## Root cause of the earlier HTTP 403

Not an ACL, role, API policy or cross-scope rule. The platform refuses edits to a `sys_metadata` record when its application differs from the user's current application, and reports it as "ACL Exception Update Failed due to security constraints". `admin`'s current application was *Employee Slate (built for Now Assist)* while catalog items live in *Global*.

The widget now detects this (kind `scope`, "Wrong application context") and tells the person to switch the application picker.

## Instance changes made (disposable demo instance)

| Change | Before | After | Revert |
| --- | --- | --- | --- |
| `sys_user_preference` `apps.current_app` for `admin` | `52b1b0c1d5733210f8772ea6f2961886` (Employee Slate) | `global` | Application picker, or set the value back |
| Session current application and update set (application picker API) | Employee Slate / its update set | Global / "..._global_batch [Global]" | Application picker |
| `sc_cat_item_producer` 011f117a9f3002002920bde8132e7020, `short_description` | empty | "Make an existing Standard Change Template unavailable when it is no longer needed or valid." | Set the field back to empty |

Side effects of that one update (platform-generated): `sys_mod_count` 22→23, `sys_updated_on`, `version` 1→2. The change is captured in the current update set.

## Cross-scope privileges: potentially redundant

Four `sys_scope_privilege` rows for `x_snc_catalogintel` were created for the earlier server-side write path and kept unchanged by decision: `sc_cat_item` Write, `sc_cat_item_producer` Write, `GlideRecord.setValue` Execute, `GlideRecord.update` Execute. The REST approach does not use them, so they are probably redundant. Review and remove them once the REST path is accepted.

## Phase 3C: closing the loop

- After a verified Apply, Investigate updates the item's findings and the affected-item count in place and shows "Counts updated … N → M". Nothing is applied to shared state unless the native read-back matched.
- "See it in Explore" opens Explore on the Completeness lens with the item's category focused and the item selected. The improved dot blooms (reduced-motion safe) and its detail panel notes "Improved by an approved update: 50% → 75%". The note lives in the session's cached model only; it is not stored.
- Application-context check: `_scopeMismatch` compares the record's application with the user's current application. Verified read-only by switching the session to Employee Slate and back to Global: it returns nothing when they match, and names both applications and the action when they differ.
- Explore reads `cat`, `item` and `lens` from the URL and hands them to the universe as properties (attribute bindings did not update on this page).

## Limitations

- The improvement highlight is session-only; a full reload recomputes completeness from the database without the "improved" marker.
- The four cross-scope privilege rows remain in place and are probably redundant (see above).
