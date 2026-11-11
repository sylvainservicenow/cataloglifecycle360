import {aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {getJson} from './catalog-data.js';

/**
 * Native writes go through the Table REST API as the signed-in user, so the platform's
 * own ACLs decide. Nothing here uses elevated access.
 */
const JSON_HEADERS = {Accept: 'application/json', 'Content-Type': 'application/json'};

export class ApplyError extends Error {
  constructor(message, {status = null, platform = '', kind = 'failed', step = ''} = {}) {
    super(message);
    this.status = status;
    this.platform = platform;
    this.kind = kind;
    this.step = step;
  }
}

async function platformMessage(res) {
  const text = await res.text().catch(() => '');
  try {
    const o = JSON.parse(text);
    return [o?.error?.message, o?.error?.detail].filter(Boolean).join(': ');
  } catch {
    return text.slice(0, 200);
  }
}

/** The platform refuses edits to a record whose application differs from the user's current application. */
export async function scopeMismatch(recordUrl) {
  try {
    const rec = (await getJson(`${recordUrl}?sysparm_fields=sys_scope.scope,sys_scope.name&sysparm_exclude_reference_link=true`)).rows;
    const r = Array.isArray(rec) ? rec[0] : rec;
    const cur = await (await aiuxFetch('/api/now/ui/concoursepicker/current', {headers: {Accept: 'application/json'}})).json();
    const app = cur?.result?.currentApplication;
    const recordScope = r?.['sys_scope.scope'];
    if (!recordScope || !app?.scopeName || recordScope === app.scopeName) return null;
    return {recordApp: r['sys_scope.name'] || recordScope, currentApp: app.name || app.scopeName};
  } catch {
    return null;
  }
}

/** One Table API write. Throws ApplyError with the platform's own message, naming an application-context mismatch when that is the cause. */
export async function write(method, url, body, contextUrl = url) {
  let res;
  try {
    res = await aiuxFetch(url, {method, headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined});
  } catch (e) {
    const status = e?.response?.status ?? null;
    res = {ok: false, status, text: async () => JSON.stringify(e?.response?.data ?? '')};
  }
  if (res.ok) return method === 'DELETE' || res.status === 204 ? null : (await res.json())?.result ?? null;
  const platform = await platformMessage(res);
  if (res.status === 401 || res.status === 403) {
    const sm = await scopeMismatch(contextUrl);
    if (sm) throw new ApplyError(i18n.getMessage('This item belongs to the {0} application, but your current application is {1}. Switch the application picker to {0}, then try again. Nothing was changed.', sm.recordApp, sm.currentApp), {status: res.status, platform, kind: 'scope', step: 'write'});
    throw new ApplyError(i18n.getMessage('Your account is not permitted to make this change (access control). Nothing was changed.'), {status: res.status, platform, kind: 'acl', step: 'write'});
  }
  throw new ApplyError(/abort|business rule/i.test(platform) ? i18n.getMessage('A rule on the record stopped the change. Nothing was changed.') : i18n.getMessage('The platform did not accept the change. Nothing was changed.'), {status: res.status, platform, kind: /abort|business rule/i.test(platform) ? 'aborted' : 'failed', step: 'write'});
}

export async function readOne(url, fields) {
  const rows = (await getJson(`${url}?sysparm_fields=${fields}&sysparm_exclude_reference_link=true`)).rows;
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function readMany(table, query, fields) {
  const p = new URLSearchParams({sysparm_query: query, sysparm_fields: fields, sysparm_exclude_reference_link: 'true', sysparm_limit: '50'});
  return (await getJson(`/api/now/table/${table}?${p}`)).rows;
}
