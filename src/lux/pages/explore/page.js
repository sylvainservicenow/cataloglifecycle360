import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {OTTO_TOOLS, ottoContext} from '../../lib/otto.js';
import {setAppState} from '../../lib/app-state.js';
import '../../components/cat-universe.js';
import '../../components/cat-appnav.js';

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
      width: 100%;
      min-width: 0;
      /* leaves room for the platform's Otto input bar below the universe */
      height: calc(100dvh - 176px);
      min-height: 480px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    cat-universe {
      flex: 1;
      min-height: 0;
    }
  `;

  static properties = {_ctx: {state: true}};

  constructor() {
    super();
    this._ctx = {cat: '', item: '', lens: ''};
    this._sel = {itemId: null, categoryId: null, lens: 'overview'};
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

  render() {
    return html`
      <cat-appnav current="explore"></cat-appnav>
      <cat-universe class="w-full" @cat-universe:investigate=${this._investigate} @cat-universe:select=${this._onSelect} @cat-universe:focus=${this._onFocus} @cat-universe:lens=${this._onLens}></cat-universe>
    `;
  }
}
