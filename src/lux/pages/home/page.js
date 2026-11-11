import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog, loadTextFacts, loadVariableStats} from '../../lib/catalog-data.js';
import {buildAiReadiness} from '../../lib/investigations/ai-readiness.js';
import '../../components/cat-universe.js';

@customElement('x-snc-catalogintel-home-page')
export default class HomePage extends AIUXElement {
  static properties = {
    _stats: {state: true},
    _opps: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }
    .hero-universe {
      height: clamp(320px, 40vh, 440px);
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
    this._opps = null;
  }

  connectedCallback() {
    super.connectedCallback();
    loadCatalog()
      .then(m => {
        this._stats = m.stats;
        this._opps = {visual: m.nodes.filter(n => !n.flags.icon).length, items: m.nodes.length, readiness: null};
        // AI readiness needs variable counts; they arrive after the catalog, so the first card never waits for them.
        return Promise.all([loadVariableStats(), loadTextFacts(m)])
          .then(([v]) => buildAiReadiness(m, v).discovery.affectedIds.length)
          .catch(() => null)
          .then(n => (this._opps = {...this._opps, readiness: n, readinessActive: m.nodes.filter(x => x.active).length}));
      })
      .catch(() => (this._stats = null));
  }

  firstUpdated() {
    document.title = i18n.getMessage('Catalog Intelligence 360');
  }

  _go = () => navigate('/explore');
  _inv = d => navigate(`/investigate?d=${d}`);

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

  _renderOpportunities() {
    const o = this._opps;
    const f = n => new Intl.NumberFormat().format(n);
    const card = (cls, eyebrow, count, text, action, d) => html`<div class="rise opp ${cls} rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${eyebrow}</p>
      <div class="mt-1 text-4xl font-bold text-text-primary">${count}</div>
      <p class="mt-1 text-sm text-text-secondary">${text}</p>
      <button class="aiux-btn aiux-btn-primary mt-3" @click=${() => this._inv(d)}>${action}</button>
    </div>`;
    return html`<section aria-labelledby="opps" class="flex flex-col gap-3">
      <h2 id="opps" class="text-lg font-semibold text-text-primary">${i18n.getMessage('Where to look first')}</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        ${card('visual', i18n.getMessage('Visual enrichment'), f(o.visual), i18n.getMessage('of {0} catalog items have no icon or picture.', f(o.items)), i18n.getMessage('Investigate visuals'), 'visual-enrichment')}
        ${o.readiness == null && o.readinessActive == null
          ? html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm" role="status"><p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${i18n.getMessage('AI readiness')}</p><p class="mt-2 text-sm text-text-secondary">${i18n.getMessage('Assessing items for conversational AI…')}</p></div>`
          : o.readiness == null
            ? html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"><p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${i18n.getMessage('AI readiness')}</p><p class="mt-2 text-sm text-text-secondary">${i18n.getMessage('Variable data could not be read, so this assessment is unavailable right now.')}</p></div>`
            : card('ready', i18n.getMessage('AI readiness'), f(o.readiness), i18n.getMessage('of {0} active items have a potential gap found by deterministic checks. A prompt to review, not a verdict.', f(o.readinessActive)), i18n.getMessage('Investigate AI readiness'), 'ai-readiness')}
      </div>
    </section>`;
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

        ${this._opps ? this._renderOpportunities() : nothing}

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
