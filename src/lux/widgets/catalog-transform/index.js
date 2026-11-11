import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {getJson, plain} from '../../lib/catalog-data.js';
import {aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {assessmentCache} from '../semantic-assess/index.js';

const {discoverable, name, description, bestFor, server} = decorators;

/** Which deterministic checks concern which field. */
const FIELDS = [
  {key: 'shortDescription', raw: 'short', apiName: 'short_description', label: () => i18n.getMessage('Short description'), checks: ['short-present', 'short-informative'], max: 200},
  {key: 'description', raw: 'description', apiName: 'description', label: () => i18n.getMessage('Description'), checks: ['desc-present', 'desc-substantive'], max: 8000}
];

@customElement('cat-transform')
@discoverable(false)
@name('Transform workspace')
@description('Generate, review, approve and apply improved short descriptions and descriptions for one catalog item.')
@bestFor('Improving catalog item wording with AI under explicit human approval')
@server('./transform-server.js')
export default class CatTransform extends AIUXWidgetElement {
  static properties = {
    itemId: {type: String, attribute: 'item-id'},
    readiness: {attribute: false}, // AI readiness result from the page (assessments by item)
    _phase: {state: true}, // reading | ready | generating | review | applying | done | error
    _item: {state: true},
    _pick: {state: true}, // {shortDescription: bool, description: bool}
    _gen: {state: true}, // generation result
    _edit: {state: true}, // {field: edited text}
    _decision: {state: true}, // {field: 'accept'|'reject'}
    _confirm: {state: true},
    _error: {state: true},
    _errKind: {state: true},
    _errDetail: {state: true},
    _stale: {state: true},
    _result: {state: true},
    _gapsBefore: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      color: #1b1b1b;
      font-size: 0.9rem;
    }
    * {
      box-sizing: border-box;
    }
    .stack {
      display: grid;
      gap: 14px;
      animation: rise 0.35s ease;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .stack,
      .field {
        animation: none;
      }
    }
    h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #032d42;
    }
    h3 {
      margin: 0;
      font-size: 0.95rem;
      color: #032d42;
    }
    p {
      margin: 0;
      line-height: 1.45;
    }
    .muted {
      color: #656462;
      font-size: 0.8rem;
    }
    .eyebrow {
      font-family: ui-monospace, monospace;
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1d4fb8;
    }
    .flow {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      font-size: 0.72rem;
      color: #656462;
    }
    .flow li {
      padding: 2px 8px;
      border-radius: 99px;
      background: rgba(3, 45, 66, 0.06);
    }
    .flow li.on {
      background: #032d42;
      color: #fff;
    }
    .flow li.done {
      background: #e3f6ea;
      color: #0d6b36;
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 9px;
      border-radius: 99px;
      background: #efe7ff;
      color: #5b2db8;
      justify-self: start;
    }
    .badge.det {
      background: #e6efff;
      color: #1d4fb8;
    }
    .note {
      border-left: 3px solid #f2b134;
      background: #fff8e6;
      padding: 8px 10px;
      border-radius: 0.5rem;
      font-size: 0.82rem;
      color: #5a4300;
    }
    .note.info {
      border-color: #2f6fed;
      background: #eef4ff;
      color: #1d3f85;
    }
    .note.bad {
      border-color: #e5484d;
      background: #fdebec;
      color: #7a1316;
    }
    .note.ok {
      border-color: #12a150;
      background: #e3f6ea;
      color: #0d4d28;
    }
    .field {
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 1rem;
      padding: 12px 14px;
      display: grid;
      gap: 10px;
      background: #fff;
      animation: rise 0.35s ease;
    }
    .field.rejected {
      opacity: 0.6;
      background: #fafafa;
    }
    .field header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @container (max-width: 560px) {
      .cols {
        grid-template-columns: 1fr;
      }
    }
    .col {
      border-radius: 0.8rem;
      padding: 8px 10px;
      background: rgba(3, 45, 66, 0.04);
      display: grid;
      gap: 4px;
      align-content: start;
      min-width: 0;
    }
    .col.after {
      background: #f7f3ff;
      border: 1px solid rgba(91, 45, 184, 0.25);
    }
    .col b {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #656462;
    }
    .val {
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .val.empty {
      color: #656462;
      font-style: italic;
    }
    textarea {
      width: 100%;
      min-height: 90px;
      resize: vertical;
      font: inherit;
      border: 1px solid rgba(3, 45, 66, 0.2);
      border-radius: 0.6rem;
      padding: 8px 10px;
      background: #fff;
      color: #1b1b1b;
    }
    textarea.short {
      min-height: 64px;
    }
    .seg {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      background: rgba(3, 45, 66, 0.07);
      border-radius: 0.7rem;
    }
    .seg button {
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.3rem 0.8rem;
      border-radius: 0.55rem;
      cursor: pointer;
      color: #4d4c4a;
    }
    .seg button[aria-pressed='true'].yes {
      background: #12a150;
      color: #fff;
    }
    .seg button[aria-pressed='true'].no {
      background: #656462;
      color: #fff;
    }
    .gap {
      font-size: 0.78rem;
      color: #7a5a00;
    }
    ul {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 3px;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .primary {
      border: 0;
      background: #032d42;
      color: #fff;
      font: inherit;
      font-weight: 600;
      font-size: 1rem;
      padding: 0.8rem 1.3rem;
      border-radius: 0.9rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .primary.ai {
      background: linear-gradient(135deg, #5b2db8, #1d4fb8);
    }
    .primary:hover:not(:disabled) {
      box-shadow: 0 6px 18px rgba(3, 45, 66, 0.25);
      transform: translateY(-1px);
    }
    .primary:disabled {
      opacity: 0.45;
      cursor: default;
    }
    .ghost {
      border: 1px solid rgba(3, 45, 66, 0.2);
      background: #fff;
      color: #032d42;
      font: inherit;
      font-weight: 600;
      padding: 0.6rem 1rem;
      border-radius: 0.8rem;
      cursor: pointer;
    }
    .link {
      border: 0;
      background: transparent;
      color: #1d4fb8;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0.3rem 0;
    }
    button:focus-visible,
    textarea:focus-visible,
    input:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    label.check {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .diff {
      border-radius: 0.8rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      overflow: hidden;
    }
    .diff > div {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(3, 45, 66, 0.08);
    }
    .diff > div:last-child {
      border-bottom: 0;
    }
    del {
      background: #fdebec;
      color: #7a1316;
      text-decoration: line-through;
    }
    ins {
      background: #e3f6ea;
      color: #0d4d28;
      text-decoration: none;
    }
    .spin {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid rgba(91, 45, 184, 0.2);
      border-top-color: #5b2db8;
      animation: spin 0.9s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    this.itemId = '';
    this.readiness = null;
    this._reset();
  }

  _reset() {
    this._phase = 'reading';
    this._item = null;
    this._pick = {shortDescription: false, description: false};
    this._gen = null;
    this._edit = {};
    this._decision = {};
    this._confirm = false;
    this._error = '';
    this._errKind = '';
    this._errDetail = null;
    this._stale = false;
    this._result = null;
    this._gapsBefore = null;
  }

  willUpdate(changed) {
    if (changed.has('itemId') && this.itemId) {
      this._reset();
      this._open();
    }
  }

  /* ---------- data ---------- */
  _fieldGaps(field) {
    const a = this.readiness?.assessments.get(this.itemId);
    return a ? a.failed.filter(f => field.checks.includes(f.check.id)) : [];
  }

  async _open() {
    const id = this.itemId;
    const r = await this._call({action: 'read', itemId: id});
    if (id !== this.itemId) return;
    if (!r) return;
    this._item = r.item;
    this._gapsBefore = FIELDS.flatMap(f => this._fieldGaps(f)).map(g => g.check.id);
    this._pick = Object.fromEntries(FIELDS.map(f => [f.key, this._fieldGaps(f).length > 0]));
    // no gap is needed to ask for wording: with none found, offer both fields (the person can untick)
    if (!Object.values(this._pick).some(Boolean)) this._pick = Object.fromEntries(FIELDS.map(f => [f.key, true]));
    this._phase = 'ready';
  }

  async _call(input) {
    try {
      const r = await this.server.get(input);
      if (r?.isError) {
        this._error = r.errorMessage || i18n.getMessage('The request failed.');
        this._errKind = r.errorKind || 'failed';
        this._errDetail = r.detail || null;
        this._stale = !!r.stale;
        this._phase = 'error';
        return null;
      }
      return r;
    } catch (e) {
      this._error = e?.message || i18n.getMessage('The request could not be reached.');
      this._phase = 'error';
      return null;
    }
  }

  async _generate() {
    const fields = FIELDS.filter(f => this._pick[f.key]).map(f => f.key);
    if (!fields.length) return;
    this._phase = 'generating';
    const cached = assessmentCache.get(this.itemId);
    const r = await this._call({action: 'generate', itemId: this.itemId, fields, assessmentIssues: cached?.assessment?.issues || []});
    if (!r) return;
    this._gen = r;
    this._edit = Object.fromEntries(fields.map(k => [k, r.proposals[k].proposed]));
    this._decision = Object.fromEntries(fields.map(k => [k, 'accept']));
    this._phase = 'review';
  }

  /** Fields whose accepted wording differs from what is saved today. */
  _changes() {
    if (!this._gen) return [];
    return FIELDS.filter(f => this._gen.proposals[f.key] && this._decision[f.key] === 'accept' && (this._edit[f.key] || '').trim() && (this._edit[f.key] || '').trim() !== plain(this._gen.baseline[f.raw]))
      .map(f => ({field: f, from: plain(this._gen.baseline[f.raw]), to: this._edit[f.key].trim()}));
  }

  _tooLong() {
    return this._changes().find(c => c.to.length > c.field.max);
  }

  /**
   * The platform refuses edits to a record whose application differs from the user's
   * current application and reports it as a generic ACL failure. Compare the two so the
   * person gets the real reason and the action to take. Returns null when they match
   * or when either side cannot be read.
   */
  async _scopeMismatch(url) {
    try {
      const rec = (await getJson(`${url}?sysparm_fields=sys_scope.scope,sys_scope.name&sysparm_exclude_reference_link=true`)).rows;
      const r = Array.isArray(rec) ? rec[0] : rec;
      const cur = await (await aiuxFetch('/api/now/ui/concoursepicker/current', {headers: {Accept: 'application/json'}})).json();
      const app = cur?.result?.currentApplication;
      const recordScope = r?.['sys_scope.scope'];
      if (!recordScope || !app?.scopeName || recordScope === app.scopeName) return null;
      return {recordScope, recordApp: r['sys_scope.name'] || recordScope, currentScope: app.scopeName, currentApp: app.name || app.scopeName};
    } catch {
      return null;
    }
  }

  _scopeMessage(m) {
    return i18n.getMessage('This item belongs to the {0} application, but your current application is {1}. Switch the application picker to {0}, then try again. Nothing was changed.', m.recordApp, m.currentApp);
  }

  /**
   * Apply through the standard Table REST API as the signed-in user: native ACLs
   * decide, and no cross-scope privilege is involved. Order: fresh read and stale
   * check, update only the approved fields, read back from the database.
   */
  async _apply() {
    const changes = this._changes();
    if (!changes.length || this._confirm !== true) return;
    this._phase = 'applying';
    const id = this.itemId;
    // Write through the record's own class table (e.g. sc_cat_item_producer) so that table's ACLs apply.
    const table = /^[a-z][a-z0-9_]*$/.test(this._item?.cls || '') ? this._item.cls : 'sc_cat_item';
    const url = `/api/now/table/${table}/${id}`;
    const fields = 'sys_id,short_description,description,sys_updated_on';
    const fail = (kind, message, detail) => {
      this._errKind = kind;
      this._error = message;
      this._errDetail = detail || null;
      this._stale = kind === 'stale';
      this._phase = 'error';
    };
    let step = 'read';
    /** Failed HTTP calls throw; recover the status and the platform's own message. */
    const explain = e => {
      const status = e?.response?.status ?? null;
      const raw = e?.response?.data ?? e?.response?.body ?? '';
      let msg = '';
      try {
        const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
        msg = o?.error?.message || '';
        if (o?.error?.detail) msg += ` (${o.error.detail})`;
      } catch {
        msg = String(raw).slice(0, 300);
      }
      return {status, msg, step};
    };
    try {
      // 1. fresh read, stale check
      const fresh = (await getJson(`${url}?sysparm_fields=${fields}&sysparm_exclude_reference_link=true`)).rows;
      const cur = Array.isArray(fresh) ? fresh[0] : fresh;
      const b = this._gen.baseline;
      const moved = !cur || String(cur.sys_updated_on || '') !== String(b.updated || '') || changes.some(c => String(cur[c.field.apiName] || '') !== String(b[c.field.raw] || ''));
      if (moved) return fail('stale', i18n.getMessage('The item changed after these proposals were generated. Nothing was applied. Reload the current values and generate again.'));
      // 2. write only the approved fields
      step = 'update';
      const body = Object.fromEntries(changes.map(c => [c.field.apiName, c.to]));
      const res = await aiuxFetch(url, {method: 'PATCH', headers: {Accept: 'application/json', 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const msg = (() => { try { return JSON.parse(text)?.error?.message || ''; } catch { return ''; } })();
        if (res.status === 401 || res.status === 403) {
          const sm = await this._scopeMismatch(url);
          if (sm) return fail('scope', this._scopeMessage(sm), {recordClass: this._item.cls, status: res.status, lastError: msg, recordUnchanged: true, ...sm});
        }
        const kind = res.status === 401 || res.status === 403 ? 'acl' : /abort|business rule/i.test(msg) ? 'aborted' : 'failed';
        const title = {acl: i18n.getMessage('Your account is not permitted to change this item (access control). Nothing was changed.'), aborted: i18n.getMessage('A rule on the catalog item stopped the update. Nothing was changed.'), failed: i18n.getMessage('The platform did not accept the update. Nothing was changed.')}[kind];
        return fail(kind, title, {recordClass: this._item.cls, status: res.status, lastError: msg, recordUnchanged: true});
      }
      // 3. read back from the database; success is only claimed if it matches
      step = 'verify';
      const back = (await getJson(`${url}?sysparm_fields=${fields}&sysparm_exclude_reference_link=true`)).rows;
      const after = Array.isArray(back) ? back[0] : back;
      const verified = changes.every(c => String(after[c.field.apiName] || '') === c.to);
      this._result = {applied: changes.map(c => c.field.key), persisted: {short: after.short_description, description: after.description, updated: after.sys_updated_on}, verified};
      this._phase = 'done';
      this.dispatchEvent(new CustomEvent('cat-transform:applied', {detail: {itemId: id, persisted: this._result.persisted, verified}, bubbles: true, composed: true}));
    } catch (e) {
      const x = explain(e);
      const denied = x.status === 401 || x.status === 403;
      if (denied && step !== 'verify') {
        const sm = await this._scopeMismatch(url);
        if (sm) return fail('scope', this._scopeMessage(sm), {recordClass: this._item?.cls, status: x.status, lastError: `${x.step}: ${x.msg}`, recordUnchanged: true, ...sm});
      }
      const msg = step === 'verify'
        ? i18n.getMessage('The update may have been saved, but reading it back failed, so it is not reported as applied. Check the record.')
        : denied
          ? i18n.getMessage('The platform refused this {0} (HTTP {1}). Nothing was reported as applied.', step === 'read' ? i18n.getMessage('read') : i18n.getMessage('update'), String(x.status))
          : i18n.getMessage('The update could not be completed. Nothing was reported as applied.');
      fail(denied ? 'acl' : 'failed', msg, {recordClass: this._item?.cls, status: x.status, lastError: `${x.step}: ${x.msg || e?.message || ''}`, recordUnchanged: step !== 'verify' ? true : undefined});
    }
  }

  /* ---------- render ---------- */
  render() {
    if (!this.itemId) return nothing;
    return html`<div class="stack">${this._renderHead()}${this._body()}</div>`;
  }

  _renderHead() {
    const steps = [['ready', i18n.getMessage('Investigate')], ['generating', i18n.getMessage('Generate')], ['review', i18n.getMessage('Review')], ['approve', i18n.getMessage('Approve')], ['applying', i18n.getMessage('Apply')], ['done', i18n.getMessage('Verify')]];
    const order = {reading: 0, ready: 0, error: 0, generating: 1, review: 2, applying: 4, done: 5};
    const at = order[this._phase] ?? 0;
    return html`<div class="eyebrow">${i18n.getMessage('Transform workspace')}</div>
      <h2 tabindex="-1" id="tf-title">${this._item ? this._item.name : i18n.getMessage('Loading the item…')}</h2>
      <ol class="flow" aria-label=${i18n.getMessage('Steps')}>${steps.map(([, l], i) => html`<li class=${i < at ? 'done' : i === at ? 'on' : ''}>${l}</li>`)}</ol>`;
  }

  _body() {
    switch (this._phase) {
      case 'reading':
        return html`<p role="status"><span class="spin"></span>${i18n.getMessage('Reading the current record…')}</p>`;
      case 'error':
        return html`<div class="note bad" role="alert"><b>${this._kindTitle()}</b><br>${this._error}
          
          ${this._errDetail ? html`<details><summary>${i18n.getMessage('Technical detail')}</summary><p class="muted">${i18n.getMessage('Record class')}: ${this._errDetail.recordClass} · ${i18n.getMessage('record unchanged')}: ${String(this._errDetail.recordUnchanged)}${this._errDetail.lastError ? ' · ' + this._errDetail.lastError : ''}${this._errDetail.threw ? ' · ' + this._errDetail.threw : ''}${this._errDetail.actionAborted ? ' · ' + i18n.getMessage('aborted by a rule') : ''}</p></details>` : nothing}</div>
          <div class="actions">${this._stale ? html`<button class="ghost" @click=${() => this._open()}>${i18n.getMessage('Reload current values')}</button>` : html`<button class="ghost" @click=${() => this._open()}>${i18n.getMessage('Start again')}</button>`}</div>`;
      case 'ready':
        return this._renderReady();
      case 'generating':
        return html`<p role="status"><span class="spin"></span>${i18n.getMessage('Asking the language model for one proposal per field… about 5 seconds.')}</p>`;
      case 'review':
        return this._renderReview();
      case 'applying':
        return html`<p role="status"><span class="spin"></span>${i18n.getMessage('Applying the approved changes and reading the record back…')}</p>`;
      default:
        return this._renderDone();
    }
  }

  _kindTitle() {
    return ({
      stale: i18n.getMessage('The record changed: nothing applied'),
      privilege: i18n.getMessage('Blocked by a cross-scope privilege'),
      scope: i18n.getMessage('Wrong application context'),
      acl: i18n.getMessage('Blocked by access control'),
      aborted: i18n.getMessage('Stopped by a rule on the item'),
      failed: i18n.getMessage('The update did not succeed'),
      input: i18n.getMessage('Nothing to do'),
      ai: i18n.getMessage('The AI step failed')
    })[this._errKind] || i18n.getMessage('The request failed');
  }

  _renderReady() {
    const cached = assessmentCache.get(this.itemId);
    return html`
      <div class="note info">${i18n.getMessage('Nothing changes until you approve it. The language model only drafts wording; you decide.')}</div>
      <h3>${i18n.getMessage('Choose what to improve')}</h3>
      ${FIELDS.map(f => {
        const gaps = this._fieldGaps(f);
        const cur = plain(this._item[f.raw]);
        return html`<label class="field"><span class="check"><input type="checkbox" .checked=${this._pick[f.key]} @change=${e => (this._pick = {...this._pick, [f.key]: e.target.checked})}>
          <span><b>${f.label()}</b> <span class="badge det">${gaps.length ? i18n.getMessage('Gap found') : i18n.getMessage('No gap found')}</span></span></span>
          <span class="val ${cur ? '' : 'empty'}">${cur || i18n.getMessage('Not provided')}</span>
          ${gaps.map(g => html`<span class="gap">• ${g.detail}</span>`)}</label>`;
      })}
      ${cached ? html`<div class="note info"><span class="badge">${i18n.getMessage('AI assessment, earlier')}</span> ${i18n.getMessage('Clarity')}: <b>${cached.assessment.clarity}</b>. ${cached.assessment.issues.slice(0, 2).join(' ')}</div>` : nothing}
      <div class="actions"><button class="primary ai" ?disabled=${!Object.values(this._pick).some(Boolean)} @click=${this._generate}>${i18n.getMessage('Generate Improvements')}</button>
        <span class="muted">${i18n.getMessage('One AI request for this item.')}</span></div>`;
  }

  _renderReview() {
    const g = this._gen;
    const changes = this._changes();
    const bad = this._tooLong();
    return html`
      <div class="badge">${i18n.getMessage('AI-generated · needs your judgement')}</div>
      ${g.summary ? html`<p><b>${i18n.getMessage('Intended changes')}:</b> ${g.summary}</p>` : nothing}
      ${FIELDS.filter(f => g.proposals[f.key]).map(f => this._renderField(f, g.proposals[f.key]))}
      <p class="muted">${g.provider} ${g.model} · ${Math.round(g.latencyMs / 100) / 10}s</p>
      ${this._renderApproval(changes, bad)}`;
  }

  _renderField(f, p) {
    const cur = plain(this._gen.baseline[f.raw]);
    const dec = this._decision[f.key];
    const hasMarkup = /<[a-z][\s\S]*>/i.test(this._gen.baseline[f.raw] || '');
    return html`<section class="field ${dec === 'reject' ? 'rejected' : ''}" aria-label=${f.label()}>
      <header><h3>${f.label()}</h3>
        <div class="seg" role="group" aria-label=${i18n.getMessage('Decision for {0}', f.label())}>
          <button class="yes" aria-pressed=${dec === 'accept'} @click=${() => (this._decision = {...this._decision, [f.key]: 'accept'})}>${i18n.getMessage('Accept')}</button>
          <button class="no" aria-pressed=${dec === 'reject'} @click=${() => (this._decision = {...this._decision, [f.key]: 'reject'})}>${i18n.getMessage('Reject')}</button>
        </div></header>
      <div class="cols">
        <div class="col"><b>${i18n.getMessage('Current value')}</b><span class="val ${cur ? '' : 'empty'}">${cur || i18n.getMessage('Not provided')}</span>
          ${hasMarkup ? html`<span class="muted">${i18n.getMessage('Formatting in the current text is shown as plain text and will be replaced if you accept.')}</span>` : nothing}</div>
        <div class="col after"><b>${i18n.getMessage('AI-proposed value')} · ${i18n.getMessage('editable')}</b>
          <textarea class=${f.key === 'shortDescription' ? 'short' : ''} aria-label=${i18n.getMessage('Proposed {0}', f.label())} .value=${this._edit[f.key] ?? ''} ?disabled=${dec === 'reject'}
            @input=${e => (this._edit = {...this._edit, [f.key]: e.target.value})}></textarea>
          <span class="muted">${(this._edit[f.key] || '').length} / ${f.max}</span></div>
      </div>
      <p><b>${i18n.getMessage('Why')}:</b> ${p.reason || i18n.getMessage('No reason was returned.')}</p>
      ${p.needsConfirmation.length ? html`<div class="note"><b>${i18n.getMessage('A person should confirm')}:</b><ul>${p.needsConfirmation.map(x => html`<li>${x}</li>`)}</ul></div>` : nothing}
    </section>`;
  }

  _renderApproval(changes, bad) {
    const blocked = false;
    return html`<section class="field" aria-label=${i18n.getMessage('Approval')}>
      <h3>${i18n.getMessage('Changes awaiting your approval')}</h3>
      ${changes.length ? html`<div class="diff">${changes.map(c => html`<div><b>${c.field.label()}</b><br><del>${c.from || i18n.getMessage('Not provided')}</del><br><ins>${c.to}</ins></div>`)}</div>`
        : html`<p class="muted">${i18n.getMessage('Nothing is selected to change. Accept and edit a proposal above.')}</p>`}
      ${bad ? html`<div class="note bad" role="alert">${i18n.getMessage('{0} is longer than its {1}-character limit. Shorten it to continue.', bad.field.label(), String(bad.field.max))}</div>` : nothing}
      <label class="check"><input type="checkbox" .checked=${this._confirm} ?disabled=${!changes.length || blocked} @change=${e => (this._confirm = e.target.checked)}>
        <span>${i18n.getMessage('I confirm I want these exact changes saved to this catalog item.')}</span></label>
      <div class="actions"><button class="primary" ?disabled=${!changes.length || !this._confirm || blocked || !!bad} @click=${this._apply}>${i18n.getMessage('Apply approved changes')}</button>
        <button class="ghost" @click=${() => this._open()}>${i18n.getMessage('Start over')}</button></div>
      <p class="muted">${i18n.getMessage('Saved with your own account, so your access controls apply. Before saving, the item is read again; if it changed since these proposals were made, nothing is applied.')}</p>
    </section>`;
  }

  _renderDone() {
    const r = this._result;
    const after = this.readiness?.assessments.get(this.itemId);
    const nowGaps = after ? after.failed.map(f => f.check.id) : [];
    const resolved = (this._gapsBefore || []).filter(id => !nowGaps.includes(id));
    const open = nowGaps;
    const label = id => this.readiness?.assessments.get(this.itemId)?.results.find(x => x.check.id === id)?.check.label() || id;
    const by = new Map((this.readiness?.assessments.get(this.itemId)?.results || []).map(x => [x.check.id, x.check.label()]));
    return html`
      ${r.verified ? html`<div class="note ok" role="status"><b>${i18n.getMessage('Saved and verified.')}</b> ${i18n.getMessage('The item was read back from the database and matches what you approved.')}</div>`
        : html`<div class="note bad" role="alert"><b>${i18n.getMessage('Saved, but the values read back differ from what you approved.')}</b> ${i18n.getMessage('Review the record before relying on it.')}</div>`}
      ${FIELDS.filter(f => r.applied.includes(f.key)).map(f => html`<div class="col"><b>${f.label()} · ${i18n.getMessage('now saved')}</b><span class="val">${plain(r.persisted[f.raw])}</span></div>`)}
      <h3>${i18n.getMessage('Deterministic gaps, recalculated')}</h3>
      ${resolved.length ? html`<ul>${resolved.map(id => html`<li>✓ ${by.get(id) || label(id)} · ${i18n.getMessage('resolved')}</li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('No gap was resolved by this change.')}</p>`}
      ${open.length ? html`<p class="muted">${i18n.getMessage('Still open: {0}', open.map(id => by.get(id) || id).join(', '))}</p>` : html`<p>${i18n.getMessage('No gaps remain for this item.')}</p>`}
      <div class="actions"><button class="primary" @click=${() => this.dispatchEvent(new CustomEvent('cat-transform:close', {bubbles: true, composed: true}))}>${i18n.getMessage('Back to Investigate')}</button>
        <button class="ghost" @click=${() => this.dispatchEvent(new CustomEvent('cat-transform:explore', {detail: {itemId: this.itemId}, bubbles: true, composed: true}))}>${i18n.getMessage('See it in Explore')}</button></div>`;
  }
}

