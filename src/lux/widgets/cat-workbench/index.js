import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {plain} from '../../lib/catalog-data.js';
import {ApplyError, readMany, readOne, write} from '../../lib/apply-helpers.js';

const {discoverable, name, description, bestFor, server} = decorators;

const TYPE_NAME = () => ({'6': i18n.getMessage('Single-line text'), '2': i18n.getMessage('Multi-line text'), '1': i18n.getMessage('Yes / No'), '5': i18n.getMessage('Select box'), '7': i18n.getMessage('Checkbox'), '9': i18n.getMessage('Date')});
const FIT = () => ({strong: i18n.getMessage('Strong fit'), plausible: i18n.getMessage('Plausible'), weak: i18n.getMessage('Weak fit')});
const VERDICT = () => ({
  'likely-duplicate': i18n.getMessage('Likely duplicates'),
  'potential-overlap': i18n.getMessage('Potential overlap'),
  'different-purposes': i18n.getMessage('Different purposes'),
  'insufficient-information': i18n.getMessage('Not enough information')
});
const ACTION = () => ({
  'clarify-names': i18n.getMessage('Clarify the names'),
  'improve-descriptions': i18n.getMessage('Improve the descriptions'),
  'review-consolidation': i18n.getMessage('Review possible consolidation'),
  'retain-separate': i18n.getMessage('Keep them separate, with a documented reason')
});

/**
 * One review surface for the AI-assisted investigations. The AI step proposes; a person
 * edits, accepts or rejects and confirms; the write goes through the Table REST API as the
 * signed-in user; success is claimed only after the value is read back from the database.
 */
@customElement('cat-workbench')
@discoverable(false)
@name('Improvement workbench')
@description('Generate, review, approve and apply AI-assisted improvements for form questions, categories and service offerings, and compare overlapping items.')
@bestFor('Reviewing AI recommendations for catalog quality under explicit human approval')
@server('./workbench-server.js')
export default class CatWorkbench extends AIUXWidgetElement {
  static properties = {
    mode: {type: String}, // form | overlap | category | service | starter
    context: {attribute: false},
    autostart: {attribute: false}, // start the assessment as soon as the context is valid (set by the host after an explicit click)
    _starter: {state: true},
    _phase: {state: true}, // ready | generating | review | applying | done | error
    _res: {state: true},
    _edit: {state: true},
    _dec: {state: true},
    _confirm: {state: true},
    _error: {state: true},
    _errKind: {state: true},
    _detail: {state: true},
    _result: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      color: #1b1b1b;
    }
    h2 {
      margin: 0 0 4px;
      font-size: 1.15rem;
      color: #032d42;
    }
    h3 {
      margin: 14px 0 6px;
      font-size: 0.95rem;
      color: #032d42;
    }
    p {
      margin: 4px 0;
    }
    .muted {
      color: #656462;
      font-size: 0.85rem;
    }
    .eyebrow {
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #656462;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
    }
    .badge.ai {
      background: #efe7ff;
      color: #5b2db8;
    }
    .badge.strong,
    .badge.ok {
      background: #e3f6ea;
      color: #0d6b36;
    }
    .badge.plausible {
      background: #fff3d1;
      color: #7a5a00;
    }
    .badge.weak,
    .badge.none {
      background: #eef1f5;
      color: #4d5b6b;
    }
    .note {
      margin: 10px 0;
      padding: 8px 12px;
      border-radius: 10px;
      border-left: 3px solid #f2b134;
      background: #fff8e6;
      color: #5a4300;
      font-size: 0.88rem;
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
    .row {
      margin: 10px 0;
      padding: 12px;
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 14px;
      background: #fff;
    }
    .row.off {
      background: #fafafa;
      opacity: 0.75;
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
    .col b {
      display: block;
      font-size: 0.75rem;
      color: #656462;
      margin-bottom: 2px;
    }
    .val {
      display: block;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(3, 45, 66, 0.04);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    textarea,
    input[type='text'],
    select {
      width: 100%;
      box-sizing: border-box;
      min-height: 56px;
      padding: 8px 10px;
      border: 1px solid rgba(3, 45, 66, 0.2);
      border-radius: 8px;
      font: inherit;
      color: inherit;
      background: #fff;
    }
    ul {
      margin: 4px 0 4px 18px;
      padding: 0;
    }
    li {
      margin: 2px 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
      align-items: center;
    }
    button {
      font: inherit;
      border-radius: 999px;
      padding: 7px 16px;
      cursor: pointer;
      border: 1px solid rgba(3, 45, 66, 0.2);
      background: #fff;
      color: #032d42;
    }
    button.primary {
      background: #032d42;
      color: #fff;
      border-color: #032d42;
      font-weight: 600;
    }
    button.ai {
      background: linear-gradient(135deg, #5b2db8, #1d4fb8);
      color: #fff;
      border: 0;
      font-weight: 600;
    }
    button[aria-pressed='true'].yes {
      background: #12a150;
      color: #fff;
      border-color: #12a150;
    }
    button[aria-pressed='true'].no {
      background: #656462;
      color: #fff;
      border-color: #656462;
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    button:focus-visible,
    textarea:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .check {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-top: 12px;
    }
    .spin {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(91, 45, 184, 0.2);
      border-top-color: #5b2db8;
      border-radius: 50%;
      vertical-align: -3px;
      margin-right: 6px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .spin {
        animation: spin 0.9s linear infinite;
      }
      .row {
        animation: rise 0.4s ease both;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
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
    this.mode = 'form';
    this.context = null;
    this._reset();
  }

  _reset() {
    this._phase = 'ready';
    this._res = null;
    this._edit = {};
    this._dec = {};
    this._confirm = false;
    this._error = '';
    this._errKind = '';
    this._detail = null;
    this._result = null;
    this._starter = [];
    this._baseline = null;
  }

  willUpdate(changed) {
    if (changed.has('context') || changed.has('mode')) this._reset();
  }

  updated(changed) {
    if ((changed.has('context') || changed.has('mode')) && this.autostart && this.context && this._phase === 'ready') this._generate();
  }

  /* ---------- generate ---------- */
  async _generate() {
    this._phase = 'generating';
    try {
      // for a starter form, remember how many questions the item has now so Apply can detect a change in between
      if (this.mode === 'starter') this._baseline = (await readMany('item_option_new', `cat_item=${this.context.item.id}`, 'sys_id').catch(() => null))?.length ?? null;
      const r = await this.server.get({kind: this.mode, context: this.context});
      if (r?.isError) {
        this._fail(r.errorKind || 'ai', r.errorMessage || i18n.getMessage('The request failed.'));
        return;
      }
      this._res = r;
      if (this.mode === 'starter') {
        this._starter = (r.questions || []).map((q, i) => ({key: `q${i}`, label: q.label, type: q.type, mandatory: q.required, help: q.help || '', choices: (q.choices || []).join('\n'), reason: q.reason}));
      }
      const rows = this._rows(r);
      this._edit = Object.fromEntries(rows.map(x => [x.key, x.proposed]));
      this._dec = Object.fromEntries(rows.map(x => [x.key, 'accept']));
      this._phase = 'review';
    } catch (e) {
      this._fail('ai', e?.message || i18n.getMessage('The request could not be reached.'));
    }
  }

  _fail(kind, message, detail = null) {
    this._errKind = kind;
    this._error = message;
    this._detail = detail;
    this._phase = 'error';
  }

  /** The reviewable proposals of this mode, in one shape. */
  _rows(r = this._res) {
    const c = this.context;
    if (!r) return [];
    if (this.mode === 'starter') return this._starter;
    if (this.mode === 'form') {
      return (r.variables || []).flatMap(p => {
        const v = c.variables.find(x => x.id === p.id);
        if (!v) return [];
        return ['label', 'help'].filter(f => p[f]).map(f => ({key: `${p.id}:${f}`, variable: v, field: f, current: f === 'label' ? v.label : v.help, proposed: p[f].proposed, reason: p[f].reason}));
      });
    }
    if (this.mode === 'category') {
      return (r.recommendations || []).map(x => {
        const cand = c.candidates.find(k => k.id === x.categoryId);
        return {key: x.categoryId, id: x.categoryId, title: cand?.title || x.categoryId, fit: x.fit, reason: x.reason, present: c.current.includes(x.categoryId)};
      });
    }
    if (this.mode === 'service') {
      return (r.matches || []).map(x => {
        const cand = c.candidates.find(k => k.id === x.offeringId);
        return {key: x.offeringId, id: x.offeringId, title: cand?.name || x.offeringId, desc: cand?.desc || '', fit: x.fit, reason: x.reason, present: c.existing.includes(x.offeringId)};
      });
    }
    return [];
  }

  _changes() {
    return this._rows().filter(r => {
      if (this.mode === 'starter') return this._dec[r.key] === 'accept' && r.label.trim();
      if (this._dec[r.key] !== 'accept') return false;
      if (this.mode === 'form') return (this._edit[r.key] || '').trim() && (this._edit[r.key] || '').trim() !== r.current;
      return !r.present;
    });
  }

  /** A starter question that cannot be created as it stands: too long, or a select box without at least two choices. */
  _starterProblem() {
    if (this.mode !== 'starter') return '';
    for (const r of this._changes()) {
      if (r.label.trim().length > 120) return i18n.getMessage('A question label is much longer than is useful. Shorten it before applying.');
      if (r.type === '5' && this._choiceList(r).length < 2) return i18n.getMessage('A select box needs at least two choices.');
    }
    return '';
  }

  _choiceList(r) {
    return r.choices.split('\n').map(x => x.trim()).filter(Boolean);
  }

  _editQ(key, patch) {
    this._starter = this._starter.map(r => (r.key === key ? {...r, ...patch} : r));
    this._confirm = false;
  }

  _tooLong() {
    return this.mode === 'form' ? this._changes().find(r => (this._edit[r.key] || '').trim().length > (r.field === 'label' ? 80 : 200) * 1.5) : null;
  }

  /* ---------- apply ---------- */
  async _apply() {
    const changes = this._changes();
    if (!changes.length || this._confirm !== true) return;
    this._phase = 'applying';
    try {
      const done = this.mode === 'form' ? await this._applyForm(changes) : this.mode === 'starter' ? await this._applyStarter(changes) : await this._applyLink(changes);
      this._result = done;
      this._phase = 'done';
      this.dispatchEvent(new CustomEvent('cat-workbench:applied', {detail: {mode: this.mode, itemId: this.context.item.id, verified: done.verified, ...done.payload}, bubbles: true, composed: true}));
    } catch (e) {
      if (e instanceof ApplyError) this._fail(e.kind, e.message, {status: e.status, platform: e.platform, step: e.step});
      else this._fail('failed', i18n.getMessage('The change could not be completed. Nothing was reported as applied.'), {platform: e?.message});
    }
  }

  async _applyForm(changes) {
    const byVar = new Map();
    changes.forEach(c => (byVar.get(c.variable.id) || byVar.set(c.variable.id, []).get(c.variable.id)).push(c));
    const results = [];
    for (const [id, list] of byVar) {
      const url = `/api/now/table/item_option_new/${id}`;
      const fresh = await readOne(url, 'question_text,help_text');
      // stale check against what was shown when the proposal was made
      for (const c of list) {
        const now = plain(c.field === 'label' ? fresh.question_text : fresh.help_text);
        if (now !== c.current) throw new ApplyError(i18n.getMessage('A question changed after these proposals were generated. Nothing was applied. Reload and generate again.'), {kind: 'stale', step: 'read'});
      }
      const body = {};
      list.forEach(c => (body[c.field === 'label' ? 'question_text' : 'help_text'] = (this._edit[c.key] || '').trim()));
      await write('PATCH', url, body, `/api/now/table/item_option_new/${id}`);
      const back = await readOne(url, 'question_text,help_text');
      list.forEach(c => {
        const want = (this._edit[c.key] || '').trim();
        const got = plain(c.field === 'label' ? back.question_text : back.help_text);
        results.push({key: c.key, variable: c.variable, field: c.field, from: c.current, to: got, verified: got === want});
      });
    }
    return {verified: results.every(r => r.verified), results, payload: {changed: results.map(r => ({id: r.variable.id, field: r.field, value: r.to}))}};
  }

  /** Create each approved question as a native variable on the item, then its choices, and read every record back. */
  async _applyStarter(changes) {
    const itemId = this.context.item.id;
    const itemUrl = `/api/now/table/sc_cat_item/${itemId}`;
    const nowCount = (await readMany('item_option_new', `cat_item=${itemId}`, 'sys_id')).length;
    if (this._baseline != null && nowCount !== this._baseline) throw new ApplyError(i18n.getMessage('This item\'s questions changed after these suggestions were generated. Nothing was created. Generate again.'), {kind: 'stale', step: 'read'});
    const taken = new Set((await readMany('item_option_new', `cat_item=${itemId}`, 'name')).map(x => x.name));
    const slug = (s, max) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, max);
    const results = [];
    let n = 0;
    for (const c of changes) {
      n++;
      let name = slug(c.label, 36) || `question_${n}`;
      if (/^[0-9]/.test(name)) name = `q_${name}`;
      for (let k = 2; taken.has(name); k++) name = `${slug(c.label, 32) || 'question'}_${k}`;
      taken.add(name);
      const body = {cat_item: itemId, name, question_text: c.label.trim(), type: c.type, mandatory: !!c.mandatory, order: String(n * 100), active: true};
      if (c.help.trim()) body.help_text = c.help.trim();
      const made = await write('POST', '/api/now/table/item_option_new', body, itemUrl);
      const id = made?.sys_id;
      if (!id) throw new ApplyError(i18n.getMessage('The platform did not return the new question. Nothing more was created.'), {kind: 'failed', step: 'write'});
      const choices = c.type === '5' ? this._choiceList(c) : [];
      let k = 0;
      for (const text of choices) {
        k++;
        await write('POST', '/api/now/table/question_choice', {question: id, text, value: slug(text, 40) || String(k), order: String(k * 100)}, itemUrl);
      }
      const back = await readOne(`/api/now/table/item_option_new/${id}`, 'question_text,type,cat_item,mandatory');
      const backChoices = choices.length ? await readMany('question_choice', `question=${id}`, 'text') : [];
      const verified = plain(back.question_text) === c.label.trim() && String(back.type) === c.type && String(back.cat_item) === itemId && backChoices.length === choices.length;
      results.push({key: c.key, id, name, label: c.label.trim(), typeName: TYPE_NAME()[c.type], choices: backChoices.length, verified});
    }
    return {verified: results.every(r => r.verified), results, payload: {created: results.map(r => r.id)}};
  }

  async _applyLink(changes) {
    const isCat = this.mode === 'category';
    const table = isCat ? 'sc_cat_item_category' : 'sc_cat_item_subscribe_mtom';
    const [a, b] = isCat ? ['sc_cat_item', 'sc_category'] : ['sc_cat_item', 'service_offering'];
    const itemId = this.context.item.id;
    const results = [];
    for (const c of changes) {
      const exists = await readMany(table, `${a}=${itemId}^${b}=${c.id}`, 'sys_id');
      if (!exists.length) await write('POST', `/api/now/table/${table}`, {[a]: itemId, [b]: c.id}, `/api/now/table/sc_cat_item/${itemId}`);
      const back = await readMany(table, `${a}=${itemId}^${b}=${c.id}`, 'sys_id');
      results.push({key: c.key, title: c.title, verified: back.length > 0});
    }
    return {verified: results.every(r => r.verified), results, payload: {added: results.filter(r => r.verified).map(r => r.key)}};
  }

  /* ---------- render ---------- */
  render() {
    if (!this.context) return nothing;
    switch (this._phase) {
      case 'generating':
        return html`<div role="status"><span class="spin" aria-hidden="true"></span>${i18n.getMessage('The AI is reading the real records and preparing a proposal…')}</div>`;
      case 'error':
        return html`<div class="note bad" role="alert"><b>${this._errKind === 'scope' ? i18n.getMessage('Wrong application context') : this._errKind === 'acl' ? i18n.getMessage('Blocked by access control') : this._errKind === 'stale' ? i18n.getMessage('The record changed: nothing applied') : i18n.getMessage('The step did not succeed')}</b><br>${this._error}
          ${this._detail?.platform ? html`<details><summary>${i18n.getMessage('Technical detail')}</summary><p class="muted">${this._detail.status ? `HTTP ${this._detail.status} · ` : ''}${this._detail.platform}</p></details>` : nothing}</div>
          <div class="actions"><button @click=${this._reset.bind(this)}>${i18n.getMessage('Start again')}</button></div>`;
      case 'applying':
        return html`<div role="status"><span class="spin" aria-hidden="true"></span>${i18n.getMessage('Saving, then reading the values back from the database…')}</div>`;
      case 'review':
        return this._renderReview();
      case 'done':
        return this._renderDone();
      default:
        return this._renderReady();
    }
  }

  _renderReady() {
    const c = this.context;
    const intro = {
      form: i18n.getMessage('The AI will propose clearer labels and help text for the flagged questions of this item. Behaviour, types, choices, requirements and scripts are never touched.'),
      overlap: i18n.getMessage('The AI will compare these items using their descriptions, categories and form questions. Similar names alone are not treated as proof of duplication. Nothing is merged, deactivated or deleted.'),
      category: i18n.getMessage('The AI will choose among the real, existing categories most likely to suit this item. It will not invent categories, and adding one never removes another.'),
      service: i18n.getMessage('The AI will judge whether this item delivers one of the candidate service offerings. “No clear match” and “not enough information” are valid answers.'),
      starter: i18n.getMessage('This item has no input questions. AI can suggest a starter form based on its name, descriptions and catalog context.')
    }[this.mode];
    const count = this.mode === 'starter' ? 1 : this.mode === 'form' ? c.variables.length : this.mode === 'overlap' ? c.items.length : c.candidates.length;
    const unit = {form: i18n.getMessage('question(s) to improve'), overlap: i18n.getMessage('items to compare'), category: i18n.getMessage('existing categories considered'), service: i18n.getMessage('offerings considered'), starter: i18n.getMessage('item described to the AI')}[this.mode];
    return html`<div class="eyebrow">${this.mode === 'starter' ? i18n.getMessage('No questions configured') : i18n.getMessage('Improvement workbench')}</div>
      <h2>${c.item?.name || c.title}</h2>
      <p>${intro}</p>
      <p class="muted"><span class="badge ai">${i18n.getMessage('AI step')}</span> ${count} ${unit}. ${i18n.getMessage('One model call. Nothing is saved until you approve.')}</p>
      ${this.mode === 'form' && c.variables.some(v => v.shared > 1 || v.fromSet) ? html`<div class="note">${i18n.getMessage('Some of these questions belong to a shared variable set. Changing one changes it on every item that uses the set.')}</div>` : nothing}
      <div class="actions"><button class="ai" @click=${this._generate}>${{form: i18n.getMessage('Generate better wording'), overlap: i18n.getMessage('Compare with AI'), category: i18n.getMessage('Recommend a category'), service: i18n.getMessage('Check service alignment'), starter: i18n.getMessage('Suggest questions with AI')}[this.mode]}</button></div>`;
  }

  _renderReview() {
    const r = this._res;
    const changes = this._changes();
    const bad = this._tooLong();
    return html`<div class="eyebrow">${i18n.getMessage('Review')} · <span class="badge ai">${i18n.getMessage('AI-generated, needs your judgement')}</span></div>
      <h2>${this.context.item?.name || this.context.title}</h2>
      ${r.summary ? html`<p>${r.summary}</p>` : nothing}
      ${this.mode === 'overlap' ? this._renderOverlap(r) : this._renderRows()}
      ${this.mode === 'starter' && r.assumptions?.length ? html`<div class="note" role="status"><b>${i18n.getMessage('Assumptions to confirm')}</b><ul>${r.assumptions.map(a => html`<li>${a}</li>`)}</ul></div>` : nothing}
      ${this.mode === 'overlap' ? nothing : this._renderApprove(changes, bad)}`;
  }

  _decide(key, v) {
    this._dec = {...this._dec, [key]: v};
    this._confirm = false;
  }

  _renderRows() {
    const rows = this._rows();
    const r = this._res;
    if (this.mode === 'starter') return this._renderStarterRows(rows);
    if (!rows.length) {
      return html`<div class="note info" role="status">${this.mode === 'form' ? i18n.getMessage('The AI found nothing it could improve without guessing.') : this.mode === 'service' ? i18n.getMessage('The AI did not find a clear match. That is a valid result: not every item belongs to an offering.') : i18n.getMessage('The AI did not find a suitable existing category.')}</div>
        ${r.newCategoryProposal ? html`<div class="note">${i18n.getMessage('Proposal only, not an existing category: “{0}”. {1}', r.newCategoryProposal.name, r.newCategoryProposal.reason)}</div>` : nothing}
        ${this.mode === 'service' ? html`<p class="muted">${i18n.getMessage('Conclusion: {0}.', {match: i18n.getMessage('match'), 'no-clear-match': i18n.getMessage('no clear match'), 'insufficient-information': i18n.getMessage('not enough information')}[r.conclusion])}</p>` : nothing}`;
    }
    return html`${this.mode === 'service' && r.conclusion !== 'match' ? html`<div class="note" role="status"><b>${r.conclusion === 'insufficient-information' ? i18n.getMessage('The AI says there is not enough information to be sure.') : i18n.getMessage('The AI found no clear match.')}</b> ${i18n.getMessage('Treat the suggestion below as a lead to check, not a confirmed match.')}</div>` : nothing}
      ${rows.map(row => {
        const off = this._dec[row.key] === 'reject';
        return html`<div class="row ${off ? 'off' : ''}">
          ${this.mode === 'form' ? html`
            <div class="actions" style="margin:0 0 6px"><b>${row.variable.label || row.variable.name}</b> <span class="badge">${row.field === 'label' ? i18n.getMessage('Question label') : i18n.getMessage('Help text')}</span>
              ${row.variable.shared > 1 ? html`<span class="badge">${i18n.getMessage('Shared by {0} items', String(row.variable.shared))}</span>` : row.variable.fromSet ? html`<span class="badge">${i18n.getMessage('From a shared variable set')}</span>` : nothing}</div>
            <div class="cols"><div class="col"><b>${i18n.getMessage('Current value')}</b><span class="val">${row.current || i18n.getMessage('Not provided')}</span></div>
              <div class="col"><b>${i18n.getMessage('AI-proposed value · editable')}</b>
                <textarea aria-label=${i18n.getMessage('Proposed {0}', row.field)} .value=${this._edit[row.key] ?? ''} ?disabled=${off} @input=${e => { this._edit = {...this._edit, [row.key]: e.target.value}; this._confirm = false; }}></textarea></div></div>
            <p class="muted">${i18n.getMessage('Why: {0}', row.reason)}</p>`
          : html`
            <div class="actions" style="margin:0 0 6px"><b>${row.title}</b> <span class="badge ${row.fit}">${FIT()[row.fit]}</span>
              ${row.present ? html`<span class="badge ok">${i18n.getMessage('Already linked')}</span>` : html`<span class="badge">${i18n.getMessage('Proposed, not yet linked')}</span>`}</div>
            ${row.desc ? html`<p class="muted">${row.desc}</p>` : nothing}
            <p>${row.reason}</p>
            ${this.mode === 'category' ? html`<p class="muted">${i18n.getMessage('Current categories: {0}', this.context.item.categories.join(', ') || i18n.getMessage('none'))}. ${i18n.getMessage('Approving adds this category; it does not remove any.')}</p>` : nothing}`}
          <div class="actions"><button class="yes" aria-pressed=${this._dec[row.key] === 'accept'} @click=${() => this._decide(row.key, 'accept')}>${i18n.getMessage('Accept')}</button>
            <button class="no" aria-pressed=${off} @click=${() => this._decide(row.key, 'reject')}>${i18n.getMessage('Reject')}</button></div>
        </div>`;
      })}
      ${r.newCategoryProposal ? html`<div class="note">${i18n.getMessage('Proposal only, not an existing category: “{0}”. {1}', r.newCategoryProposal.name, r.newCategoryProposal.reason)}</div>` : nothing}`;
  }

  _renderStarterRows(rows) {
    if (!rows.length) return html`<div class="note info" role="status">${i18n.getMessage('The AI did not find enough in this item’s name and descriptions to suggest questions without guessing. That is a valid result: add a clearer description first, or build the form by hand.')}</div>`;
    return html`${rows.map(row => {
      const off = this._dec[row.key] === 'reject';
      return html`<div class="row ${off ? 'off' : ''}">
        <div class="actions"><b>${i18n.getMessage('Question {0}', row.key.slice(1) * 1 + 1)}</b><span class="badge ai">${i18n.getMessage('AI-suggested')}</span></div>
        <label class="muted">${i18n.getMessage('Label')}<input type="text" .value=${row.label} ?disabled=${off} @input=${e => this._editQ(row.key, {label: e.target.value})}></label>
        <div class="cols"><label class="muted">${i18n.getMessage('Answer type')}
            <select ?disabled=${off} @change=${e => this._editQ(row.key, {type: e.target.value})}>${Object.entries(TYPE_NAME()).map(([k, v]) => html`<option value=${k} ?selected=${row.type === k}>${v}</option>`)}</select></label>
          <label class="check"><input type="checkbox" .checked=${row.mandatory} ?disabled=${off} @change=${e => this._editQ(row.key, {mandatory: e.target.checked})}><span>${i18n.getMessage('Required')}</span></label></div>
        <label class="muted">${i18n.getMessage('Help text (optional)')}<textarea .value=${row.help} ?disabled=${off} @input=${e => this._editQ(row.key, {help: e.target.value})}></textarea></label>
        ${row.type === '5' ? html`<label class="muted">${i18n.getMessage('Choices, one per line')}<textarea .value=${row.choices} ?disabled=${off} @input=${e => this._editQ(row.key, {choices: e.target.value})}></textarea></label>` : nothing}
        <p class="muted">${i18n.getMessage('Why: {0}', row.reason)}</p>
        <div class="actions"><button class="yes" aria-pressed=${this._dec[row.key] === 'accept'} @click=${() => this._decide(row.key, 'accept')}>${i18n.getMessage('Accept')}</button>
          <button class="no" aria-pressed=${off} @click=${() => this._decide(row.key, 'reject')}>${i18n.getMessage('Reject')}</button></div>
      </div>`;
    })}`;
  }

  _renderApprove(changes, bad) {
    const rows = this._rows();
    if (!rows.length) return nothing;
    if (this.mode === 'starter') {
      const problem = this._starterProblem();
      return html`<h3>${i18n.getMessage('Records that would be created')}</h3>
        ${changes.length ? html`<ul>${changes.map(c => html`<li>${i18n.getMessage('A {0} question “{1}” on this item', TYPE_NAME()[c.type], c.label.trim())}${c.mandatory ? ` · ${i18n.getMessage('required')}` : ''}${c.type === '5' ? ` · ${i18n.getMessage('{0} choices', String(this._choiceList(c).length))}` : ''}</li>`)}</ul>
          <p class="muted">${i18n.getMessage('Each is a new native catalog variable (and its choices) created as you. Existing questions are not changed.')}</p>`
          : html`<p class="muted">${i18n.getMessage('Nothing accepted yet.')}</p>`}
        ${problem ? html`<div class="note bad" role="alert">${problem}</div>` : nothing}
        <label class="check"><input type="checkbox" .checked=${this._confirm} ?disabled=${!changes.length || !!problem} @change=${e => (this._confirm = e.target.checked)}>
          <span>${i18n.getMessage('I have reviewed these questions and approve creating them as native records.')}</span></label>
        <div class="actions"><button class="primary" ?disabled=${!changes.length || !this._confirm || !!problem} @click=${this._apply}>${i18n.getMessage('Create approved questions')}</button>
          <button @click=${this._generate}>${i18n.getMessage('Regenerate')}</button></div>`;
    }
    return html`<h3>${i18n.getMessage('Changes awaiting your approval')}</h3>
      ${changes.length ? html`<ul>${changes.map(c => this.mode === 'form'
          ? html`<li><b>${c.variable.label || c.variable.name}</b> · ${c.field === 'label' ? i18n.getMessage('label') : i18n.getMessage('help text')}: “${c.current || i18n.getMessage('Not provided')}” → “${(this._edit[c.key] || '').trim()}”</li>`
          : html`<li>${this.mode === 'category' ? i18n.getMessage('Add the category “{0}”', c.title) : i18n.getMessage('Link to the service offering “{0}”', c.title)}</li>`)}</ul>`
        : html`<p class="muted">${i18n.getMessage('Nothing accepted yet, or the accepted wording equals the current value.')}</p>`}
      ${bad ? html`<div class="note bad" role="alert">${i18n.getMessage('A proposed value is much longer than is useful. Shorten it before applying.')}</div>` : nothing}
      <label class="check"><input type="checkbox" .checked=${this._confirm} ?disabled=${!changes.length || !!bad} @change=${e => (this._confirm = e.target.checked)}>
        <span>${i18n.getMessage('I have reviewed these changes and approve saving them to the native records.')}</span></label>
      <div class="actions"><button class="primary" ?disabled=${!changes.length || !this._confirm || !!bad} @click=${this._apply}>${i18n.getMessage('Apply approved changes')}</button>
        <button @click=${this._generate}>${i18n.getMessage('Regenerate')}</button></div>`;
  }

  _renderOverlap(r) {
    const c = this.context;
    const by = new Map(c.items.map(i => [i.id, i]));
    return html`<p><span class="badge ${r.verdict === 'different-purposes' ? 'ok' : r.verdict === 'insufficient-information' ? 'none' : 'plausible'}">${VERDICT()[r.verdict]}</span></p>
      <div class="note info">${i18n.getMessage('This is an AI interpretation of the records, not proof. Nothing is merged, deactivated or deleted.')}</div>
      <div class="cols"><div><h3>${i18n.getMessage('What they share')}</h3>${r.similarities.length ? html`<ul>${r.similarities.map(s => html`<li>${s}</li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('Nothing specific was found.')}</p>`}</div>
        <div><h3>${i18n.getMessage('How they differ')}</h3>${r.differences.length ? html`<ul>${r.differences.map(s => html`<li>${s}</li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('No clear difference was found.')}</p>`}</div></div>
      <h3>${i18n.getMessage('Recommendation')}</h3>
      <div class="row"><b>${ACTION()[r.recommendation.action]}</b><p>${r.recommendation.text}</p></div>
      <h3>${i18n.getMessage('Each item')}</h3>
      ${r.perItem.map(p => html`<div class="row"><b>${by.get(p.id)?.name || p.id}</b><p>${p.note}</p>
        ${p.suggestedName ? html`<p class="muted">${i18n.getMessage('A clearer name could be: “{0}”. Use Transform to review wording changes.', p.suggestedName)}</p>` : nothing}
        <div class="actions"><button @click=${() => this.dispatchEvent(new CustomEvent('cat-workbench:improve', {detail: {itemId: p.id}, bubbles: true, composed: true}))}>${i18n.getMessage('Improve wording in Transform')}</button>
          <button @click=${() => this.dispatchEvent(new CustomEvent('cat-workbench:select', {detail: {itemId: p.id}, bubbles: true, composed: true}))}>${i18n.getMessage('Show in the universe')}</button></div></div>`)}
      <div class="actions"><button @click=${this._generate}>${i18n.getMessage('Compare again')}</button></div>`;
  }

  _renderDone() {
    const r = this._result;
    return html`${r.verified
        ? html`<div class="note ok" role="status"><b>${i18n.getMessage('Saved and verified.')}</b> ${i18n.getMessage('Each change was read back from the database and matches what you approved.')}</div>`
        : html`<div class="note bad" role="alert"><b>${i18n.getMessage('Saved, but a value read back differs from what you approved.')}</b> ${i18n.getMessage('Review the record before relying on it.')}</div>`}
      <ul>${r.results.map(x => this.mode === 'starter'
        ? html`<li>${x.verified ? '✓' : '✕'} <b>${x.label}</b> · ${x.typeName}${x.choices ? ` · ${i18n.getMessage('{0} choices', String(x.choices))}` : ''}</li>`
        : this.mode === 'form'
        ? html`<li>${x.verified ? '✓' : '✕'} <b>${x.variable.label || x.variable.name}</b> · ${x.field === 'label' ? i18n.getMessage('label') : i18n.getMessage('help text')}: “${x.to}”</li>`
        : html`<li>${x.verified ? '✓' : '✕'} ${this.mode === 'category' ? i18n.getMessage('Category “{0}” is now linked', x.title) : i18n.getMessage('Service offering “{0}” is now linked', x.title)}</li>`)}</ul>
      <div class="actions"><button class="primary" @click=${() => this.dispatchEvent(new CustomEvent('cat-workbench:close', {bubbles: true, composed: true}))}>${i18n.getMessage('Back to the item')}</button>
        <button @click=${() => this.dispatchEvent(new CustomEvent('cat-workbench:explore', {detail: {itemId: this.context.item.id}, bubbles: true, composed: true}))}>${i18n.getMessage('Show it in the universe')}</button></div>`;
  }
}
