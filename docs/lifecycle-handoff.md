# Lifecycle handoff: connecting Understand, Grow and Improve

`src/lux/lib/handoff.js` carries context between the three pillars. It holds `action`, `source` (investigation, lens), `item`, `group`, `category`, `service` (sys_ids and display names already in the catalog) and `returnTo` (an app-relative path). It lives in memory and `sessionStorage` of the browser tab only: never in the URL, never sent anywhere, no table.

| From Understand | Action | Lands in |
|---|---|---|
| Item in an overlap group | Improve: Consolidate | Improve remediation workspace |
| Item with flagged form questions | Improve: Simplify | Improve remediation workspace |
| Item with category findings | Improve: Reclassify | Improve remediation workspace |
| Service offering with no item (Services investigation) | Grow: Create item | Grow intake, prefilled |
| Thin category (3 items or fewer) | Grow: Fill gap | Grow intake, prefilled |
| Any selected item | Grow: Create variant | Grow intake, prefilled, base item compared first |

Actions only appear when the engines already hold the evidence (the investigation data is loaded).

- **Grow** consumes the handoff once, prefills the intake from live records, and shows a "Live context" bar with Back to Understand and Start without context. Assembly Line outputs remain simulated.
- **Improve** shows live evidence for the item(s) and a remediation path. "Open the AI proposal" navigates to the existing Understand workspace (`/explore?d=…&item=…&open=workspace`), so AI proposals and the confirmed apply step are the existing ones. Explore shows a slim "Back to remediation" bar until the person presses Done.
- No new backend, table, ACL, privilege or native write.
