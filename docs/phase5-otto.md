# Phase 5: Otto integration

## How Otto reaches the application (verified in the platform source and in production)

- Otto (the AIEL/AIEX layer) learns about an application only from **widget contexts registered at runtime**. `withWidgetContext` registers a page's `static client_tools` and `static aiContext` with `__AIEX_GLOBALS__` when the page connects, and `setAiContext()` pushes live state. Otto's tool call arrives as a `userIntent` addressed to that registered widget, and the tool runs on the page.
- Inspect it in the browser console: `__AIEX_GLOBALS__.getLatestState()` → `customWidgetContext` (what is registered), `userIntent` (what Otto chose), `clientToolContext` (what ran and its result).

## Root causes found

1. **Otto missing on Home.** The nav layout (`is-home-page.js`) treats any route ending in `/home` as a "home page": chat is not docked there and the app is expected to host its own chat anchor. Fix: the page moved to `/overview` (landing updated, nav label still "Home"). Otto is now docked on every page.
2. **No tools on two of three pages.** Only Investigate used `withWidgetContext`. Before the fix, Explore's registered contexts held only the platform nav layout (`navigateToMenuItem`), so a request made there was routed to generic workflows ("Create a Data Visualization", form-design advice, procurement categories). Fix: Overview, Explore and Investigate all register the same core tools.
3. **Context lacked stable identity.** Context used item names. It now carries sys_ids, class, category, investigation and lens, updated on selection, focus and lens changes.
4. **Race in the tool.** A tool that opened an investigation while the page was already building it returned before the build finished. Builds are now shared in-flight promises.

## Tools (registered on every page; `lib/otto.js`)

`show_duplicate_items`, `find_confusing_forms`, `recommend_category`, `check_service_alignment`, `prepare_improvements`, `open_investigation`; Investigate adds `focus_category`, `select_item`, `explain_discovery`, `prepare_action`.

- Descriptions say what the tool does, when to use it and that it must not be replaced by general knowledge or visualisation workflows.
- Item-specific tools take `item_id` (sys_id, validated against the natively loaded catalog), fall back to the page's selection, and return `needsItem` with an instruction to ask the person when nothing is selected.
- Tools reuse the existing investigations and workspaces. They never save: proposals need a click and confirmation.

## Other

- Overview legend: `pc_hardware_cat_item` is labelled "Hardware Catalog Item".
- No ACL, role, table or API-access change. Route rename removed the old `x-snc-catalogintel-home-page` record on install; `/home` no longer exists.
