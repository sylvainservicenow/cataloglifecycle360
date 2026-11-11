import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {OTTO_TOOLS, ottoContext, investigateUrl, INVESTIGATION_OF} from '../../lib/otto.js';
import {loadCatalog} from '../../lib/catalog-data.js';
import {setAppState} from '../../lib/app-state.js';
import '../../components/cat-universe.js';
import '../../components/cat-appnav.js';
import '../../components/cat-inspector.js';

@customElement('x-snc-catalogintel-explore-page')
export default class ExplorePage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'The Catalog Intelligence 360 explorer: the real service catalog as a living universe of items, categories and intelligence lenses',
    bestFor: 'When the user asks to find duplicate catalog items, confusing forms, a better category, service alignment or improvements for the selected catalog item'
  };

  static client_tools = OTTO_TOOLS;

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      width: 100%;
      min-width: 0;
      /* leaves room for the platform's Otto input bar below the universe */
      height: calc(100dvh - 176px);
      min-height: 480px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .zones {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
      gap: 12px;
    }
    .zones.insp {
      grid-template-columns: 250px minmax(0, 1fr) minmax(260px, 310px);
    }
    @container (max-width: 960px) {
      .zones,
      .zones.insp {
        grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
      }
      .zones:not(.insp) {
        grid-template-columns: minmax(0, 1fr);
      }
      .intel {
        display: none;
      }
    }
    cat-universe {
      min-height: 0;
      min-width: 0;
    }
    .intel {
      overflow: auto;
      padding: 16px;
      border-radius: 1.5rem;
      border: 1px solid rgba(3, 45, 66, 0.1);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .intel h2 {
      margin: 0;
      font-size: 1.05rem;
      color: #032d42;
    }
    .intel p {
      margin: 0;
      font-size: 0.85rem;
      color: #656462;
    }
    .intel .sel {
      padding: 8px 10px;
      border-radius: 0.8rem;
      background: #eef4ff;
      color: #1d3f85;
    }
    .intel button {
      text-align: left;
      font: inherit;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 9px 12px;
      border-radius: 0.9rem;
      border: 1px solid rgba(3, 45, 66, 0.14);
      background: #fff;
      color: #032d42;
      cursor: pointer;
    }
    .intel button:hover {
      background: #f4f7fb;
    }
    .intel button:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
  `;

  static properties = {_ctx: {state: true}, _model: {state: true}, _sel: {state: true}, _closed: {state: true}};

  constructor() {
    super();
    this._ctx = {cat: '', item: '', lens: ''};
    this._sel = {itemId: null, categoryId: null, lens: 'overview'};
    this._model = null;
    this._closed = false;
  }

  /** The item and category the person has selected, for tools that act on "this item". */
  _ottoSelection() {
    return this._sel;
  }

  /** Tell Otto where the person is, using stable sys_ids only. */
  _pushOtto() {
    setAppState({itemId: this._sel.itemId, categoryId: this._sel.categoryId});
    ottoContext(this, {page: 'Explore', itemId: this._sel.itemId, categoryId: this._sel.categoryId, lens: this._sel.lens}).then(c => this.setAiContext(c));
  }

  _onSelect = e => {
    this._sel = {...this._sel, itemId: e.detail.id || null};
    this._pushOtto();
  };

  _onSelectOpen = e => {
    this._closed = false;
    this._onSelect(e);
  };

  _onFocus = e => {
    const id = e.detail.id && e.detail.id !== '__none__' ? e.detail.id : null;
    this._sel = {...this._sel, categoryId: id};
    this._pushOtto();
  };

  _onLens = e => {
    this._sel = {...this._sel, lens: e.detail.lens};
    this._pushOtto();
  };

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    // Context carried in from Investigate/Transform, so the person lands on what they just improved.
    const q = new URLSearchParams(window.location.search);
    this._ctx = {cat: q.get('cat') || '', item: q.get('item') || '', lens: q.get('lens') || ''};
    this._sel = {itemId: this._ctx.item || null, categoryId: this._ctx.cat || null, lens: this._ctx.lens || 'overview'};
    loadCatalog().then(m => (this._model = m)).catch(() => {});
  }

  /** Hand the carried-in context to the universe as properties; it applies them once its layout exists. */
  _applyContext() {
    const u = this.renderRoot?.querySelector('cat-universe');
    if (!u) return;
    u.focusId = this._ctx.cat || null;
    u.selectedId = this._ctx.item || null;
    u.lens = this._ctx.lens || '';
  }

  updated(changed) {
    if (changed.has('_ctx')) this._applyContext();
  }

  firstUpdated() {
    this._applyContext();
    this._pushOtto();
    document.title = i18n.getMessage('Explore · Catalog Intelligence 360');
  }

  _investigate = e => {
    const {discovery, categoryId, itemId} = e.detail;
    const q = new URLSearchParams({d: discovery});
    if (categoryId) q.set('cat', categoryId);
    if (itemId) q.set('item', itemId);
    navigate(`/investigate?${q}`);
  };

  _open(d) {
    const url = investigateUrl({d, item: this._sel.itemId || undefined, cat: this._sel.categoryId && this._sel.categoryId !== '__none__' ? this._sel.categoryId : undefined});
    setAppState({investigation: d});
    navigate(url);
  }

  render() {
    const n = this._model && this._sel.itemId ? this._model.nodes.find(x => x.id === this._sel.itemId) : null;
    const show = !!n && !this._closed;
    return html`
      <cat-appnav current="explore"></cat-appnav>
      <div class="zones ${show ? 'insp' : ''}">
        <section class="intel" aria-label=${i18n.getMessage('Intelligence')}>
          <h2>${i18n.getMessage('Intelligence')}</h2>
          <p>${i18n.getMessage('Explore the catalog here. To analyse and improve it, open an investigation: your selection comes with you.')}</p>
          ${n ? html`<p class="sel">${i18n.getMessage('Selected item')}: <b>${n.name}</b></p>` : html`<p>${i18n.getMessage('Click a dot in the universe to select an item.')}</p>`}
          ${Object.entries(INVESTIGATION_OF).map(([id, label]) => html`<button @click=${() => this._open(id)}>${label}</button>`)}
        </section>
        <cat-universe hide-detail @cat-universe:investigate=${this._investigate} @cat-universe:select=${this._onSelectOpen} @cat-universe:focus=${this._onFocus} @cat-universe:lens=${this._onLens}></cat-universe>
        ${show ? html`<cat-inspector .model=${this._model} item-id=${n.id} @cat-inspector:close=${() => (this._closed = true)}></cat-inspector>` : nothing}
      </div>
    `;
  }
}
