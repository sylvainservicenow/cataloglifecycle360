import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog, loadTextFacts, loadVariableStats} from '../../lib/catalog-data.js';
import {buildAiReadiness} from '../../lib/investigations/ai-readiness.js';
import {buildFormIntelligence, loadAllVariables} from '../../lib/investigations/form-intelligence.js';
import {buildOverlap} from '../../lib/investigations/overlap.js';
import {buildTaxonomy} from '../../lib/investigations/taxonomy.js';
import {buildCsdm, loadServiceData} from '../../lib/investigations/csdm.js';
import {OTTO_TOOLS, ottoContext} from '../../lib/otto.js';
import '../../components/cat-universe.js';
import '../../components/cat-appnav.js';

@customElement('x-snc-catalogintel-overview-page')
export default class OverviewPage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'The Catalog Intelligence 360 overview: live opportunity counts for metadata, forms, duplicates, categories and service alignment in the real service catalog',
    bestFor: 'When the user asks to find duplicate catalog items, confusing forms, poorly categorised items or service alignment, or to improve a catalog item'
  };

  static client_tools = OTTO_TOOLS;

  static properties = {
    _stats: {state: true},
    _opps: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      /* room for Otto's docked bar so it never covers the last cards */
      padding-bottom: 96px;
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
        this._opps = {};
        // Each opportunity is computed from real records and appears as soon as it is ready, so the first card never waits for the others.
        const put = (key, fn) => Promise.resolve().then(fn).then(v => (this._opps = {...this._opps, [key]: v})).catch(() => (this._opps = {...this._opps, [key]: {error: true}}));
        put('taxonomy', () => {
          const d = buildTaxonomy(m).discovery;
          return {n: d.affectedIds.length, of: d.stats.active, uncategorised: d.stats.uncategorised};
        });
        put('overlap', () => loadTextFacts(m).catch(() => {}).then(() => {
          const d = buildOverlap(m).discovery;
          return {n: d.stats.groups, items: d.affectedIds.length, of: d.stats.active};
        }));
        put('meta', () => Promise.all([loadVariableStats(), loadTextFacts(m)]).then(([v]) => {
          const d = buildAiReadiness(m, v).discovery;
          return {n: d.affectedIds.length, of: d.stats.active};
        }));
        put('form', () => Promise.all([loadVariableStats(), loadAllVariables()]).then(([v, vars]) => {
          const d = buildFormIntelligence(m, v, vars).discovery;
          return {n: d.affectedIds.length, of: d.stats.withForm};
        }));
        put('csdm', () => loadServiceData().then(data => {
          const d = buildCsdm(m, data).discovery;
          return {verified: d.stats.verified, candidates: d.stats.candidates, offerings: d.stats.offerings};
        }));
      })
      .catch(() => (this._stats = null));
  }

  firstUpdated() {
    document.title = i18n.getMessage('Catalog Intelligence 360');
    ottoContext(this, {page: 'Overview'}).then(c => this.setAiContext(c));
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
    const wait = (eyebrow, d) => html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm" role="status" data-investigation=${d}><p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${eyebrow}</p><p class="mt-2 text-sm text-text-secondary">${i18n.getMessage('Reading records…')}</p></div>`;
    const unavailable = (eyebrow, d) => html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm" data-investigation=${d}><p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${eyebrow}</p><p class="mt-2 text-sm text-text-secondary">${i18n.getMessage('This could not be read right now, so no figure is shown.')}</p></div>`;
    const card = (key, eyebrow, count, text, action, d) => {
      const v = o[key];
      if (!v) return wait(eyebrow, d);
      if (v.error) return unavailable(eyebrow, d);
      return html`<div class="rise rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm" data-investigation=${d}>
        <p class="font-mono text-xs uppercase tracking-wide text-text-secondary">${eyebrow}</p>
        <div class="mt-1 text-4xl font-bold text-text-primary">${count(v)}</div>
        <p class="mt-1 text-sm text-text-secondary">${text(v)}</p>
        <button class="aiux-btn aiux-btn-primary mt-3" @click=${() => this._inv(d)}>${action}</button>
      </div>`;
    };
    return html`<section aria-labelledby="opps" class="flex flex-col gap-3">
      <h2 id="opps" class="text-lg font-semibold text-text-primary">${i18n.getMessage('Where to look first')}</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        ${card('meta', i18n.getMessage('Metadata quality'), v => f(v.n), v => i18n.getMessage('of {0} active items have a potential gap in names, descriptions or forms. A prompt to review, not a verdict.', f(v.of)), i18n.getMessage('Investigate metadata'), 'ai-readiness')}
        ${card('form', i18n.getMessage('Form quality'), v => f(v.n), v => i18n.getMessage('of {0} items with a form have a question worth reviewing: missing or technical labels, or no guidance on hard questions.', f(v.of)), i18n.getMessage('Investigate forms'), 'form-intelligence')}
        ${card('overlap', i18n.getMessage('Potential duplication'), v => f(v.n), v => i18n.getMessage('groups of look-alike items ({0} items) to compare. Similar names are candidates, not proof.', f(v.items)), i18n.getMessage('Compare candidates'), 'overlap')}
        ${card('taxonomy', i18n.getMessage('Taxonomy and discoverability'), v => f(v.n), v => i18n.getMessage('of {0} active items may be hard to find, including {1} in no category at all.', f(v.of), f(v.uncategorised)), i18n.getMessage('Investigate categories'), 'taxonomy')}
        ${card('csdm', i18n.getMessage('Service alignment'), v => f(v.candidates), v => i18n.getMessage('items have a likely service offering to review. {0} are already verified as linked, out of {1} offerings.', f(v.verified), f(v.offerings)), i18n.getMessage('Check alignment'), 'csdm-alignment')}
      </div>
    </section>`;
  }

  render() {
    const s = this._stats;
    const f = n => new Intl.NumberFormat().format(n);
    return html`
      <div class="mx-auto flex max-w-7xl flex-col gap-6">
        <cat-appnav current="overview"></cat-appnav>
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
