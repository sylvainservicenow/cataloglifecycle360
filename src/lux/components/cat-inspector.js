import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {classLabel, CRITERIA, loadItemVariables, loadTextFacts} from '../lib/catalog-data.js';
import {assessVariable, isInput} from '../lib/investigations/form-intelligence.js';
import {loadServiceData} from '../lib/investigations/csdm.js';

const fmt = n => new Intl.NumberFormat().format(n);
const TYPE = () => ({
  1: i18n.getMessage('Yes / No'), 2: i18n.getMessage('Multi-line text'), 3: i18n.getMessage('Multiple choice'), 5: i18n.getMessage('Select box'),
  6: i18n.getMessage('Single-line text'), 7: i18n.getMessage('Checkbox'), 8: i18n.getMessage('Reference'), 9: i18n.getMessage('Date'), 10: i18n.getMessage('Date and time'),
  18: i18n.getMessage('Lookup select box'), 21: i18n.getMessage('List collector')
});

/**
 * The one item inspector, shared by Explore and Investigate. It only shows what the
 * native record holds and what the deterministic checks found: it has no buttons that
 * generate, recommend, compare or apply anything. Those live in the left panel.
 */
@customElement('cat-inspector')
export default class CatInspector extends AIUXElement {
  static properties = {
    itemId: {type: String, attribute: 'item-id'},
    model: {attribute: false},
    findings: {attribute: false}, // [{title, items: [{state: 'pass'|'fail'|'info', text}]}]
    lifecycle: {attribute: false}, // [{action, label, pillar, hint}] contextual Grow / Improve actions
    _vars: {state: true},
    _services: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      min-width: 0;
      height: 100%;
    }
    aside {
      box-sizing: border-box;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.1);
      border-radius: 1.5rem;
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
      font-size: 0.85rem;
      color: #1b1b1b;
      position: relative;
    }
    h2 {
      margin: 0 28px 6px 0;
      font-size: 1.1rem;
      line-height: 1.25;
      color: #032d42;
      overflow-wrap: anywhere;
    }
    h3 {
      margin: 14px 0 4px;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #656462;
    }
    p {
      margin: 2px 0;
      overflow-wrap: anywhere;
    }
    .lc {
      margin: 10px 0 4px;
      padding: 10px 12px;
      border-radius: 1rem;
      background: linear-gradient(135deg, #f6f2ff, #effaf3);
      border: 1px solid rgba(3, 45, 66, 0.1);
    }
    .lc-t {
      margin: 0 0 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #4d4c4a;
    }
    .lc-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .lc button {
      font: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      border: 1px solid currentColor;
      background: #fff;
      cursor: pointer;
    }
    .lc button.grow {
      color: #0b5e33;
    }
    .lc button.improve {
      color: #5a32b8;
    }
    .lc button:hover {
      background: #f7f9fb;
    }
    .lc button:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 99px;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
    }
    .badge.ok {
      background: #e3f6ea;
      color: #0d6b36;
    }
    .badge.off {
      background: #eef1f5;
      color: #4d5b6b;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 50%;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
      cursor: pointer;
      font: inherit;
    }
    .muted {
      color: #656462;
    }
    ul {
      list-style: none;
      margin: 4px 0;
      padding: 0;
      display: grid;
      gap: 4px;
    }
    li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px;
      align-items: start;
    }
    .mark {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: #fff;
      margin-top: 1px;
      background: #9aa7b7;
    }
    .mark.pass {
      background: #12a150;
    }
    .mark.fail {
      background: #e5484d;
    }
    small {
      display: block;
      color: #656462;
    }
    details {
      margin-top: 10px;
      border-top: 1px solid rgba(3, 45, 66, 0.08);
      padding-top: 8px;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
      color: #032d42;
    }
    dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 2px 10px;
      margin: 4px 0;
    }
    dt {
      color: #656462;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    a {
      color: #1d4fb8;
      font-weight: 600;
    }
    button:focus-visible,
    summary:focus-visible,
    a:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
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
    this.model = null;
    this.findings = [];
    this._vars = null;
    this._services = null;
  }

  willUpdate(changed) {
    if (changed.has('itemId')) {
      this._vars = null;
      this._services = null;
      if (this.itemId && this.model) loadTextFacts(this.model).then(() => this.requestUpdate()).catch(() => {});
    }
  }

  async _loadVars() {
    if (this._vars) return;
    const id = this.itemId;
    this._vars = {loading: true};
    try {
      const vars = await loadItemVariables(id);
      if (this.itemId === id) this._vars = {list: vars};
    } catch (e) {
      if (this.itemId === id) this._vars = {error: e.message};
    }
  }

  async _loadServices() {
    if (this._services) return;
    const id = this.itemId;
    this._services = {loading: true};
    try {
      const data = await loadServiceData();
      if (this.itemId === id) this._services = {list: (data.byItem.get(id) || []).map(l => data.offeringById.get(l.offering)?.name || l.offering)};
    } catch (e) {
      if (this.itemId === id) this._services = {error: e.message};
    }
  }

  _lifecycle(a) {
    this.dispatchEvent(new CustomEvent('cat-inspector:lifecycle', {detail: {action: a.action, itemId: this.itemId}, bubbles: true, composed: true}));
  }

  _close() {
    this.dispatchEvent(new CustomEvent('cat-inspector:close', {bubbles: true, composed: true}));
  }

  render() {
    const n = this.model?.nodes.find(x => x.id === this.itemId);
    if (!n) return nothing;
    const types = TYPE();
    const fmtDate = s => (s ? new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(new Date(String(s).replace(' ', 'T') + 'Z')) : '');
    // the same sections in the same order on every page; the investigation adds its own section after them
    const groups = [{title: i18n.getMessage('Metadata completeness'), items: CRITERIA.map(c => ({state: n.flags[c.key] ? 'pass' : 'fail', text: c.label()}))}, ...(this.findings || [])];
    return html`<aside aria-label=${i18n.getMessage('Selected item details')}>
      <button class="close" aria-label=${i18n.getMessage('Close the item details')} @click=${this._close}>✕</button>
      <h2>${n.name}</h2>
      <div class="badges"><span class="badge">${classLabel(n.cls)}</span><span class="badge ${n.active ? 'ok' : 'off'}">${n.active ? i18n.getMessage('Active') : i18n.getMessage('Inactive')}</span></div>

      ${this.lifecycle?.length
        ? html`<div class="lc" role="group" aria-label=${i18n.getMessage('Take this further')}>
            <p class="lc-t">${i18n.getMessage('Take this further')}</p>
            <div class="lc-row">${this.lifecycle.map(a => html`<button class=${a.pillar} title=${a.hint || ''} @click=${() => this._lifecycle(a)}>${a.label}</button>`)}</div>
          </div>`
        : nothing}
      <h3>${i18n.getMessage('Short description')}</h3>
      <p>${n.shortDescription || html`<em class="muted">${i18n.getMessage('None')}</em>`}</p>
      <h3>${i18n.getMessage('Description')}</h3>
      <p>${n.ctx === null ? html`<em class="muted" role="status">${i18n.getMessage('Loading…')}</em>` : n.descSnippet ? n.descSnippet + (n.descLen > n.descSnippet.length ? '…' : '') : html`<em class="muted">${i18n.getMessage('None')}</em>`}</p>
      <h3>${i18n.getMessage('Categories')}</h3>
      <p>${n.catIds.length ? n.catIds.map(id => this.model.catTitle[id] || id).join(', ') : html`<em class="muted">${i18n.getMessage('None')}</em>`}</p>

      ${groups.map(g => html`<h3>${g.title}</h3>
        <ul>${g.items.map(x => html`<li><span class="mark ${x.state}" aria-hidden="true">${x.state === 'pass' ? '✓' : x.state === 'fail' ? '✕' : 'i'}</span><span>${x.text}${x.detail ? html`<small>${x.detail}</small>` : nothing}<span class="vh"> ${{pass: i18n.getMessage('no gap found'), fail: i18n.getMessage('gap found'), info: ''}[x.state]}</span></span></li>`)}</ul>`)}

      <details @toggle=${e => e.target.open && this._loadVars()}>
        <summary>${i18n.getMessage('Form and questions')}</summary>
        ${!this._vars ? html`<p class="muted">${i18n.getMessage('Open to read this item’s variables.')}</p>`
          : this._vars.loading ? html`<p class="muted" role="status">${i18n.getMessage('Reading variables…')}</p>`
          : this._vars.error ? html`<p>${this._vars.error}</p>`
          : this._vars.list.length === 0 ? html`<p class="muted">${i18n.getMessage('This item has no variables.')}</p>`
          : html`<p class="muted">${i18n.getMessage('{0} variables, {1} required.', fmt(this._vars.list.length), fmt(this._vars.list.filter(v => v.mandatory).length))}</p>
            <ul>${this._vars.list.filter(isInput).slice(0, 40).map(v => {
              const issues = assessVariable(v);
              return html`<li><span class="mark ${issues.length ? 'fail' : 'pass'}" aria-hidden="true">${issues.length ? '!' : '✓'}</span><span>${v.label || v.name}${v.mandatory ? html` <span class="badge">${i18n.getMessage('required')}</span>` : nothing}
                <small>${types[v.type] || i18n.getMessage('Type {0}', v.type)}${issues.length ? ` · ${issues.map(i => i.text).join(' ')}` : ''}</small></span></li>`;
            })}</ul>${this._vars.list.filter(isInput).length > 40 ? html`<p class="muted">${i18n.getMessage('and {0} more', fmt(this._vars.list.filter(isInput).length - 40))}</p>` : nothing}`}
      </details>

      <details @toggle=${e => e.target.open && this._loadServices()}>
        <summary>${i18n.getMessage('Service offerings')}</summary>
        ${!this._services ? html`<p class="muted">${i18n.getMessage('Open to read this item’s service links.')}</p>`
          : this._services.loading ? html`<p class="muted" role="status">${i18n.getMessage('Reading service links…')}</p>`
          : this._services.error ? html`<p>${this._services.error}</p>`
          : this._services.list.length ? html`<ul>${this._services.list.map(s => html`<li><span class="mark pass" aria-hidden="true">✓</span><span>${s}<small>${i18n.getMessage('Verified link')}</small></span></li>`)}</ul>`
          : html`<p class="muted">${i18n.getMessage('No linked service offering. That is normal and not a gap.')}</p>`}
      </details>

      <details>
        <summary>${i18n.getMessage('Record')}</summary>
        <dl><dt>${i18n.getMessage('Requests')}</dt><dd>${fmt(n.requests)}</dd><dt>${i18n.getMessage('Created')}</dt><dd>${fmtDate(n.created)}</dd><dt>${i18n.getMessage('Updated')}</dt><dd>${fmtDate(n.updated)}</dd></dl>
        <p><a href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open the native record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a></p>
      </details>
    </aside>`;
  }
}
