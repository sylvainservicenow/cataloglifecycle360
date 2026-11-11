/* ------------------------------------------------------------------ *
 * Capability checks for AI features, read from native records.
 * Nothing here calls a model: it only reports whether a capability has an
 * executable definition, and records the outcome of the approved manual test.
 * ------------------------------------------------------------------ */
import {getJson} from './catalog-data.js';

export const CAPABILITIES = {
  image: {id: 'd6a4f234ffd5c310a3aeffffffffffcb', name: 'Image generation'},
  text: {id: '0c90ca79533121106b38ddeeff7b12d7', name: 'Generic Prompt'}
};

/**
 * Outcomes of the single approved verification call per capability, run on
 * 2026-11-11 through sn_one_extend.OneExtendUtil.execute() (see docs/phase2-ai-verification.md).
 * These are facts about a past test, not live status.
 */
export const VERIFICATION = {
  text: {date: '2026-11-11', ok: true, provider: 'Azure OpenAI', model: 'gpt-4.1-mini', latencyMs: 5420, note: 'Returned valid JSON for a catalog-item clarity prompt.'},
  image: {date: '2026-11-11', ok: false, latencyMs: 41, note: 'Request rejected: "Plan invalid or not created". The capability record has no executable definition.'}
};

async function count(table, query) {
  const p = new URLSearchParams({sysparm_query: query, sysparm_fields: 'sys_id', sysparm_limit: '50', sysparm_exclude_reference_link: 'true'});
  return (await getJson(`/api/now/table/${table}?${p}`)).rows.length;
}

/** Live check: does the capability exist, and does it have at least one definition to run? */
export async function checkCapability(key) {
  const cap = CAPABILITIES[key];
  try {
    const exists = await count('sys_one_extend_capability', `sys_id=${cap.id}^active=true`);
    const definitions = exists ? await count('sys_one_extend_capability_definition', `capability=${cap.id}`) : 0;
    return {key, name: cap.name, state: !exists ? 'missing' : definitions ? 'defined' : 'no-definition', exists: !!exists, definitions, verification: VERIFICATION[key], error: null};
  } catch (e) {
    return {key, name: cap.name, state: 'unknown', exists: null, definitions: null, verification: VERIFICATION[key], error: e.message};
  }
}
