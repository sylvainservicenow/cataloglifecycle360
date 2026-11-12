# Grow: Assembly Line integration boundary

Grow (`/grow`) is a **simulated** AI Catalog Assembly Line. It never creates or changes a catalog record, table, ACL, privilege or AI agent.

## Live vs simulated

| Part | Status |
|---|---|
| Catalog universe, investigations, AI recommendations, Otto, Improve counts | Live (existing) |
| Growth signals (services without an item, thin categories, proven demand) | Live, read-only |
| Duplicate detection against existing items | Live read-only text comparison (`lib/grow/live-compare.js`) |
| Category and service offering suggestions | Live read-only matching |
| Service owner request queue | Simulated (`lib/grow/scenario.js`) |
| Content Understanding of attachments | Simulated. Files stay in the browser; only name and size are read |
| Requirement extraction, draft, variables, workflow | Simulated |
| Governance findings and fixes | Simulated (stands in for the governance KB) |
| Human review and approval | Simulated, local state only |

## The boundary

The UI (`components/cat-grow.js`) only calls `createAssemblyLine(env)` from `lib/grow/assembly-line.js`:

| Method | Simulation today | Real integration point |
|---|---|---|
| `listRequests()` | Fixed sample queue | Service owner intake requests (intake table or Catalog Item Request API) |
| `analyse(intake, onStage)` | Scripted stages, calls `onStage(id, status)` | Start the pipeline, stream stage events (Flow / AI Agent run status) |
| stage `requirements` | `EXTRACTED_REQUIREMENTS` | Content Understanding extraction of attached documents |
| stage `duplicates` | Live `similarItems()` | AI duplicate and variation detection (keep or replace the live comparison) |
| stage `draft` | `buildDraft()` | Catalog Builder + Now Assist draft generation (item, variables, variable sets, workflow) |
| stage `governance` | `buildGovernance()` | Governance KB driven standardisation (findings with fixes) |
| stage `review` | Local review panel | Human review task and approval |
| `submitDecision(proposal, decision)` | Waits, returns a note | Complete the review task; on approval, Catalog Builder creates the draft item |

The returned **proposal** shape (`requirements`, `duplicates`, `draft`, `governance.findings[{id, severity, blocking, rule, kb, message, fix}]`) is the contract the UI renders. A real implementation returns the same shape, then `env` and the file attachment code (`_addFiles`) are the only other places to adapt.

## Before going live (needs explicit approval)

- Installing the Assembly Line application and its APIs on the instance
- Cross-scope privileges for any native catalog write
- Any custom table for proposals or review state
- Uploading attachments (today they are not read or sent anywhere)
