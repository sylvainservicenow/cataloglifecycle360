import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog} from '../../lib/catalog-data.js';
import '../../components/cat-universe.js';

@customElement('x-snc-catalogintel-home-page')
export default class HomePage extends AIUXElement {
  static properties = {
    _stats: {state: true}
  };

  static styles = css`
    :host {
      display: block;
    }
    .hero-universe {
      height: clamp(340px, 52vh, 560px);
    }
    @media (prefers-reduced-motion: no-preference) {
      .rise {
        animation: rise 0.7s ease both;
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
      }
    }
  `;

  constructor() {
    super();
    this._stats = null;
  }

  connectedCallback() {
    super.connectedCallback();
    loadCatalog()
      .then(m => (this._stats = m.stats))
      .catch(() => (this._stats = null));
  }

  firstUpdated() {
    document.title = i18n.getMessage('Catalog Intelligence 360');
  }

  _go = () => navigate('/explore');

  _kpi(value, label) {
    return html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div class="text-3xl font-bold text-text-primary">${value}</div>
      <div class="text-sm text-text-secondary">${label}</div>
    </div>`;
  }

  _card(title, text) {
    return html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 class="text-lg font-semibold text-text-primary">${title}</h2>
      <p class="mt-1 text-sm text-text-secondary">${text}</p>
    </div>`;
  }

  render() {
    const s = this._stats;
    const f = n => new Intl.NumberFormat().format(n);
    return html`
      <div class="mx-auto flex max-w-7xl flex-col gap-6">
        <section class="rise flex flex-col gap-3">
          <p class="font-mono text-xs uppercase tracking-wide text-primary-900">${i18n.getMessage('Catalog Intelligence 360')}</p>
          <h1 class="max-w-3xl break-words text-4xl font-bold text-text-primary">${i18n.getMessage('Your service catalog, as a living universe.')}</h1>
          <p class="max-w-2xl text-base leading-relaxed text-text-secondary">
            ${i18n.getMessage('Every dot is a real catalog item from this instance. Zoom into a category, switch lenses and see where your catalog is rich, thin or quiet.')}
          </p>
        </section>

        <section class="hero-universe overflow-hidden rounded-3xl border border-base-300 shadow-sm" aria-label=${i18n.getMessage('Catalog universe preview')}>
          <cat-universe compact @cat-universe:enter=${this._go}></cat-universe>
        </section>

        ${s
          ? html`<section aria-label=${i18n.getMessage('Catalog at a glance')} class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              ${this._kpi(f(s.items), i18n.getMessage('catalog items'))}
              ${this._kpi(f(s.populatedCategories), i18n.getMessage('categories in use'))}
              ${this._kpi(f(s.complete), i18n.getMessage('items with complete metadata'))}
              ${this._kpi(f(s.requestedItems), i18n.getMessage('items that have been requested'))}
            </section>`
          : nothing}

        <section class="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label=${i18n.getMessage('Intelligence lenses')}>
          ${this._card(i18n.getMessage('Completeness'), i18n.getMessage('See which items are missing descriptions, icons or a category.'))}
          ${this._card(i18n.getMessage('Lifecycle and demand'), i18n.getMessage('Spot inactive items and the few that have actually been requested.'))}
          ${this._card(i18n.getMessage('CSDM foundation'), i18n.getMessage('Service offerings are ready to be aligned with the catalog in a later milestone.'))}
        </section>

        <div>
          <button class="aiux-btn aiux-btn-primary" @click=${this._go}>${i18n.getMessage('Explore the universe')}</button>
        </div>
      </div>
    `;
  }
}
