import {html, css, nothing, isServer} from 'lit';
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
import {exploreLink} from '../../lib/app-state.js';
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
      padding-bottom: 72px;
      container-type: inline-size;
    }
    /* command centre: the universe is the centrepiece, KPIs and the AI entry point sit beside it */
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 16px;
      height: clamp(340px, calc(100dvh - 470px), 560px);
    }
    .hero-universe {
      position: relative;
      min-height: 0;
      border-radius: 1.75rem;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
    .hero-universe cat-universe {
      display: block;
      height: 100%;
    }
    .hero-universe:hover,
    .hero-universe:focus-within {
      box-shadow: 0 16px 44px rgba(47, 111, 237, 0.24);
      transform: translateY(-2px);
    }
    .side {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }
    .grid {
      display: grid;
      gap: 12px;
    }
    .grid.kpis {
      flex: 1;
      min-height: 0;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: minmax(0, 1fr);
    }
    .grid.four {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @container (max-width: 1000px) {
      .hero {
        grid-template-columns: minmax(0, 1fr);
        height: auto;
      }
      .hero-universe {
        height: 360px;
      }
      .grid.four {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @container (max-width: 560px) {
      .grid.four {
        grid-template-columns: minmax(0, 1fr);
      }
      .hero-universe {
        height: 300px;
      }
    }
    h2.sec {
      margin: 0;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #4d4c4a;
    }
    /* every tile is one link: the whole surface is the target */
    a.tile {
      --tone: #2f6fed;
      --tint: #f1f6ff;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      padding: 14px 18px;
      border-radius: 1.4rem;
      border: 1px solid color-mix(in srgb, var(--tone) 20%, #ffffff);
      background: linear-gradient(155deg, var(--tint), #ffffff 75%);
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
      color: #1b1b1b;
      text-decoration: none;
      transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
      min-width: 0;
      overflow: hidden;
    }
    a.tile::before {
      content: '';
      position: absolute;
      left: 0;
      top: 16%;
      bottom: 16%;
      width: 4px;
      border-radius: 0 4px 4px 0;
      background: var(--tone);
    }
    a.tile:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(3, 45, 66, 0.15);
      border-color: color-mix(in srgb, var(--tone) 55%, #ffffff);
    }
    a.tile:focus-visible,
    .hero-universe :focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    a.tile.red {
      --tone: #d6383d;
      --tint: #fff3f3;
    }
    a.tile.amber {
      --tone: #d9820b;
      --tint: #fff8ec;
    }
    a.tile.green {
      --tone: #12894a;
      --tint: #effaf3;
    }
    a.tile.blue {
      --tone: #2f6fed;
      --tint: #f1f6ff;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #3b3a38;
    }
    .eyebrow svg {
      width: 17px;
      height: 17px;
      flex: none;
      color: var(--tone);
    }
    .num {
      font-size: 2.5rem;
      line-height: 1.05;
      font-weight: 700;
      color: var(--tone);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
    .kpis a.tile .num {
      font-size: clamp(2rem, 4.2vw, 3rem);
      order: 1;
    }
    .kpis a.tile .eyebrow {
      order: 2;
      font-size: 0.86rem;
      align-items: flex-start;
    }
    .opps a.tile {
      padding: 16px 18px 16px 20px;
      gap: 4px;
      justify-content: flex-start;
    }
    .opps .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 0.72rem;
      color: #4d4c4a;
    }
    .opps .num {
      font-size: 2.4rem;
    }
    .txt {
      margin: 0;
      font-size: 0.86rem;
      color: #3b3a38;
      line-height: 1.4;
    }
    .arrow {
      position: absolute;
      top: 12px;
      right: 14px;
      color: var(--tone);
      opacity: 0.5;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    a.tile:hover .arrow,
    a.tile:focus-visible .arrow {
      opacity: 1;
      transform: translateX(3px);
    }
    /* the AI entry point */
    a.ai {
      display: grid;
      gap: 6px;
      padding: 16px 18px;
      border-radius: 1.4rem;
      color: #ffffff;
      text-decoration: none;
      background: linear-gradient(135deg, #3b2a8f 0%, #2f6fed 100%);
      box-shadow: 0 10px 26px rgba(59, 42, 143, 0.28);
      transition: transform 0.22s ease, box-shadow 0.22s ease;
      position: relative;
      overflow: hidden;
    }
    a.ai::after {
      content: '';
      position: absolute;
      right: -30px;
      top: -40px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 70%);
      pointer-events: none;
    }
    a.ai:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 34px rgba(59, 42, 143, 0.36);
    }
    a.ai:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 3px;
    }
    .ai-head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1rem;
    }
    .ai-head svg {
      width: 20px;
      height: 20px;
    }
    .ai p {
      margin: 0;
      font-size: 0.86rem;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.92);
    }
    .ai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }
    .ai-chips span {
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.18);
    }
    .tile.wait {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 18px;
      min-height: 96px;
      border-radius: 1.4rem;
      border: 1px dashed #c3cedc;
      background: #fafbfc;
      cursor: default;
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
    @media (prefers-reduced-motion: reduce) {
      a.tile,
      a.tile:hover,
      a.ai,
      a.ai:hover,
      .hero-universe,
      .hero-universe:hover,
      .arrow {
        transition: none;
        transform: none;
      }
    }
  `;

  constructor() {
    super();
    this._stats = null;
    this._opps = null;
    this._base = '';
  }

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) {
      const i = location.pathname.indexOf('/catalogintelligence360');
      this._base = i >= 0 ? location.pathname.slice(0, i + '/catalogintelligence360'.length) : '';
    }
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

  _enter = () => navigate(exploreLink({lens: 'overview'}));

  /** One Explore deep link per tile; a plain click navigates in-app, modified clicks keep the browser's own behaviour. */
  _tile(e, target) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    navigate(target);
  }

  _link(tone, target, inner, label) {
    return html`<a class="tile rise ${tone}" href=${`${this._base}${target}`} aria-label=${label} @click=${e => this._tile(e, target)}>${inner}</a>`;
  }

  _icon(kind) {
    const paths = {
      doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
      form: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
      copy: 'M8 8h11v12H8zM5 16V4h11',
      tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
      link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
      grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
      check: 'M5 12.5l4.5 4.5L19 7.5',
      pulse: 'M3 12h4l3-8 4 16 3-8h4',
      layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5'
    };
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${paths[kind]}></path></svg>`;
  }

  _kpi(tone, icon, value, label, target) {
    return this._link(tone, target, html`<span class="num">${value}</span><span class="eyebrow">${this._icon(icon)}${label}</span><span class="arrow" aria-hidden="true">→</span>`, `${value} ${label}`);
  }

  /** The AI entry point: opens Explore, whose intelligence panel already lists the best opportunities and one-click AI actions. */
  _renderAi() {
    return html`<a class="ai rise" href=${`${this._base}${exploreLink({})}`} aria-label=${i18n.getMessage('AI intelligence. Open Explore to see what deserves attention and let AI propose improvements.')} @click=${e => this._tile(e, exploreLink({}))}>
      <span class="ai-head">${this._icon('spark')}${i18n.getMessage('AI intelligence')}</span>
      <p>${i18n.getMessage('Select any item and AI reads its real records, then proposes better descriptions, form questions, categories and service links for you to review.')}</p>
      <span class="ai-chips" aria-hidden="true"><span>${i18n.getMessage('Descriptions')}</span><span>${i18n.getMessage('Forms')}</span><span>${i18n.getMessage('Duplicates')}</span><span>${i18n.getMessage('Categories')}</span><span>${i18n.getMessage('Services')}</span></span>
    </a>`;
  }

  /**
   * The four most relevant opportunities, chosen deterministically from the five engines:
   * evidence strength first (3 = a direct check of a record field or link, 2 = a text-similarity
   * heuristic, 1 = a weak suggestion), then the number of affected items. The fifth stays in Explore.
   */
  _rankedOpportunities() {
    const o = this._opps || {};
    const f = n => new Intl.NumberFormat().format(n);
    const defs = [
      {key: 'meta', tier: 3, n: o.meta?.n, tone: 'amber', icon: 'doc', title: i18n.getMessage('Metadata quality'), count: f(o.meta?.n), text: i18n.getMessage('of {0} active items have a potential gap in their descriptions or form.', f(o.meta?.of)), highlight: 'metadata-gaps'},
      {key: 'taxonomy', tier: o.taxonomy?.uncategorised > 0 ? 3 : 2, n: o.taxonomy?.n, tone: 'red', icon: 'tag', title: i18n.getMessage('Discoverability'), count: f(o.taxonomy?.n), text: i18n.getMessage('items may be hard to find, {0} of them in no category.', f(o.taxonomy?.uncategorised)), highlight: 'taxonomy-gaps'},
      {key: 'form', tier: 2, n: o.form?.n, tone: 'amber', icon: 'form', title: i18n.getMessage('Form quality'), count: f(o.form?.n), text: i18n.getMessage('forms have a question worth reviewing, out of {0}.', f(o.form?.of)), highlight: 'form-gaps'},
      {key: 'overlap', tier: 2, n: o.overlap?.items, tone: 'amber', icon: 'copy', title: i18n.getMessage('Possible duplicates'), count: f(o.overlap?.n), text: i18n.getMessage('groups of look-alike items ({0} items) to compare.', f(o.overlap?.items)), highlight: 'overlap'},
      {key: 'csdm', tier: 1, n: o.csdm?.candidates, tone: 'blue', icon: 'link', title: i18n.getMessage('Service alignment'), count: f(o.csdm?.candidates), text: i18n.getMessage('items may align with a service offering. {0} are already linked.', f(o.csdm?.verified)), highlight: 'service-candidates'}
    ];
    const ready = defs.filter(d => o[d.key] && !o[d.key].error && d.n > 0).sort((a, b) => b.tier - a.tier || b.n - a.n);
    return {cards: ready.slice(0, 4), pending: defs.filter(d => !o[d.key]).length};
  }

  _renderOpportunities() {
    const {cards, pending} = this._rankedOpportunities();
    const slots = pending ? 4 : cards.length;
    return html`<section aria-labelledby="opps" class="flex flex-col gap-2">
      <h2 id="opps" class="sec">${i18n.getMessage('Where to look first')}</h2>
      <div class="grid four opps">
        ${cards.map(d => {
          const target = exploreLink({highlight: d.highlight});
          return html`<a class="tile rise ${d.tone}" data-investigation=${d.key} href=${`${this._base}${target}`} aria-label=${`${d.title}: ${d.count}. ${d.text}`} @click=${e => this._tile(e, target)}>
            <span class="eyebrow">${this._icon(d.icon)}${d.title}</span>
            <span class="num">${d.count}</span>
            <span class="txt">${d.text}</span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>`;
        })}
        ${Array.from({length: Math.max(0, slots - cards.length)}, () => html`<div class="tile wait rise" role="status"><span class="eyebrow">${i18n.getMessage('Reading records…')}</span></div>`)}
      </div>
    </section>`;
  }

  render() {
    const s = this._stats;
    const f = n => new Intl.NumberFormat().format(n);
    return html`
      <div class="mx-auto flex max-w-7xl flex-col gap-4">
        <cat-appnav current="overview"></cat-appnav>
        <section class="rise flex flex-col gap-1">
          <p class="font-mono text-xs uppercase tracking-wide text-primary-900">${i18n.getMessage('Catalog Intelligence 360')}</p>
          <h1 class="max-w-3xl break-words text-3xl font-bold text-text-primary">${i18n.getMessage('Your service catalog, as a living universe.')}</h1>
        </section>

        <section class="hero" aria-label=${i18n.getMessage('Catalog overview')}>
          <div class="hero-universe" role="group" aria-label=${i18n.getMessage('Catalog universe preview. Select to open Explore.')}>
            <cat-universe compact @cat-universe:enter=${this._enter}></cat-universe>
          </div>
          <div class="side">
            ${s
              ? html`<section aria-label=${i18n.getMessage('Catalog at a glance')} class="grid kpis">
                  ${this._kpi('blue', 'grid', f(s.items), i18n.getMessage('catalog items'), exploreLink({highlight: 'all', lens: 'overview'}))}
                  ${this._kpi('blue', 'layers', f(s.populatedCategories), i18n.getMessage('categories in use'), exploreLink({highlight: 'categories', lens: 'overview'}))}
                  ${this._kpi('green', 'check', f(s.complete), i18n.getMessage('items with complete metadata'), exploreLink({highlight: 'complete', lens: 'quality'}))}
                  ${this._kpi('blue', 'pulse', f(s.requestedItems), i18n.getMessage('items requested'), exploreLink({highlight: 'requested', lens: 'demand'}))}
                </section>`
              : nothing}
            ${this._renderAi()}
          </div>
        </section>

        ${this._opps ? this._renderOpportunities() : nothing}
      </div>
    `;
  }
}
