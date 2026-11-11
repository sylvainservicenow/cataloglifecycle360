# Phase 2 AI verification (2026-11-11)

Run with `now-sdk exec` (scope global, no rollback context), one call each, no retries. Both scripts only call the capability; they write no catalog, attachment, table or CSDM records. Side effects: one Script Execution History row per run, plus the standard generative-AI log entries.

## Text: Generic Prompt (capability `0c90ca79533121106b38ddeeff7b12d7`) — WORKS
- Contract: `sn_one_extend.OneExtendUtil.execute({executionRequests: [{payload: {prompt}, capabilityId, meta: {}}]})`; inputs `prompt`; outputs `response`, `status`, `error`, `provider`.
- Result: `status: completed`, provider **Azure OpenAI**, model **gpt-4.1-mini-2025-04-14**, ~5.4 s round trip, valid JSON returned for a clarity assessment of the item "Request New Laptop" (clarity: clear, no issues).
- Limitation: this is a server-side API. There is no REST endpoint that a browser page can call. The app can use it only from a widget server script (`@server`) running after deployment; that path is therefore unverified until deploy.

## Image: Image generation (capability `d6a4f234ffd5c310a3aeffffffffffcb`) — NOT AVAILABLE
- The capability record is active but is a stub ("Moveworks - Image generation"): `sys_one_extend_capability_definition`, `sys_one_extend_definition_attribute`, `sys_one_extend_definition_config` and `sys_one_extend_resource_mapping` have no rows for it.
- Same call contract returned `status: error`, `message: "Plan invalid or not created."` in 41 ms.
- To enable: an administrator must add an executable definition (a provider/flow mapping) for this capability, or approve another image service. No generated image exists, and none is shown anywhere in the app.

## Not readable with the SDK user
`sys_generative_ai_predictions_log` and `sn_ex_gen_ai_usage` return 403, so quota usage could not be observed beyond the single calls above.
