import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import '../../components/cat-universe.js';

@customElement('x-snc-catalogintel-explore-page')
export default class ExplorePage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      /* leaves room for the platform's Otto input bar below the universe */
      height: calc(100dvh - 176px);
      min-height: 480px;
    }
  `;

  static properties = {_ctx: {state: true}};

  constructor() {
    super();
    this._ctx = {cat: '', item: '', lens: ''};
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    // Context carried in from Investigate/Transform, so the person lands on what they just improved.
    const q = new URLSearchParams(window.location.search);
    this._ctx = {cat: q.get('cat') || '', item: q.get('item') || '', lens: q.get('lens') || ''};
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
      <cat-universe class="h-full w-full" @cat-universe:investigate=${this._investigate}></cat-universe>
    `;
  }
}
