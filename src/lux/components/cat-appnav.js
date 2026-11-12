import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog} from '../lib/catalog-data.js';
import {destination, getAppState, subscribeAppState} from '../lib/app-state.js';

/**
 * Compact in-app navigation, visible on every page whether Otto is open or closed
 * (it lives in the page, not in the collapsed platform sidebar). Links carry the
 * remembered investigation, item and category so moving around never loses context.
 */
@customElement('cat-appnav')
export default class CatAppNav extends AIUXElement {
  static properties = {
    current: {type: String},
    bare: {type: Boolean}, // inside the Explore toolbar: no selected-item label, sized to match its neighbours
    _state: {state: true},
    _itemName: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
    :host([bare]) {
      container-type: normal;
    }
    :host([bare]) nav {
      min-height: 0;
    }
    :host([bare]) .tabs {
      height: 40px;
      box-sizing: border-box;
      align-items: stretch;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      min-height: 40px;
    }
    .tabs {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      border-radius: 999px;
      background: rgba(3, 45, 66, 0.06);
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.35rem 0.95rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #4d4c4a;
      text-decoration: none;
      transition: background 0.25s, color 0.25s;
    }
    a:hover {
      color: #032d42;
      background: rgba(255, 255, 255, 0.6);
    }
    a[aria-current='page'] {
      background: #fff;
      color: #032d42;
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.18);
    }
    a:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .sel {
      min-width: 0;
      max-width: 100%;
      font-size: 0.8rem;
      color: #656462;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sel b {
      color: #032d42;
      font-weight: 600;
    }
    @media (prefers-reduced-motion: reduce) {
      a {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.current = '';
    this._state = getAppState();
    this._itemName = '';
    this._base = '';
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    const i = location.pathname.indexOf('/catalogintelligence360');
    this._base = i >= 0 ? location.pathname.slice(0, i + '/catalogintelligence360'.length) : '';
    this._off = subscribeAppState(s => (this._state = s));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._off?.();
  }

  willUpdate(changed) {
    if (changed.has('_state')) {
      const id = this._state.itemId;
      if (!id) this._itemName = '';
      else loadCatalog().then(m => (this._itemName = m.nodes.find(n => n.id === id)?.name || '')).catch(() => (this._itemName = ''));
    }
  }

  _go(e, page) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (page !== this.current) navigate(destination(page, this._state));
  }

  render() {
    const items = [
      ['overview', i18n.getMessage('Home')],
      ['explore', i18n.getMessage('Explore')],
      ['investigate', i18n.getMessage('Investigate')]
    ];
    return html`<nav aria-label=${i18n.getMessage('Catalog Intelligence 360')}>
      <div class="tabs">
        ${items.map(([page, label]) => html`<a href=${`${this._base}${destination(page, this._state)}`} aria-current=${this.current === page ? 'page' : 'false'} @click=${e => this._go(e, page)}>${label}</a>`)}
      </div>
      ${this._itemName && !this.bare ? html`<span class="sel" title=${this._itemName}>${i18n.getMessage('Selected item')}: <b>${this._itemName}</b></span>` : nothing}
    </nav>`;
  }
}
