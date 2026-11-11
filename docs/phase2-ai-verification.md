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

## Cross-scope requirements for the deployed semantic widget (read-only investigation, 2026-11-11)
The widget server script runs in scope `x_snc_catalogintel` and uses: `GlideRecordSecure` on `sc_cat_item` and `item_option_new` (global tables), and `sn_one_extend.OneExtendUtil.execute()`.
- `sn_one_extend.OneExtendUtil` is a platform scriptable API, not a script include; there is no `sys_script_include` record to set access on.
- Other apps that call it from their own scope (AI Agent Advisor, AI Admin Center, Insights Clustering Utils) hold an **Execute API** privilege for target `OneExtendUtil.executeSecure` (target scope `sn_one_extend`, status Allowed). No app holds one for `OneExtendUtil.execute`.
- In the dev-server run the call to `.execute` succeeded from our scope with no privilege row for it. Whether the deployed app, running as an end user, behaves the same is unverified. If it is blocked, the documented-in-practice route is `executeSecure`, which would need the Execute API privilege above (approval required) and a re-test (one more inference call, approval required).
- Rows that already exist for our scope (all created by the platform's cross-scope tracking at 2026-11-11 15:45:03 instance time, when the dev server first ran the widget, by user `admin`, status Allowed): Execute API `GlideRecordSecure.getValue`; Read `sc_cat_item`; Read `item_option_new`. They were not created deliberately. They are the privileges the script needs and can be reviewed or removed by an administrator.
- Nothing was created or changed to investigate this. No inference call was made for it.
- Unknown: whether non-admin catalog users hold whatever role the capability requires. Test with a representative non-admin user after deployment.
