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
      padding-bottom: 96px;
      container-type: inline-size;
    }
    .hero-universe {
      height: clamp(320px, 40vh, 440px);
      cursor: pointer;
      position: relative;
      transition: box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .hero-universe:hover,
    .hero-universe:focus-within {
      box-shadow: 0 10px 34px rgba(47, 111, 237, 0.22);
      border-color: rgba(47, 111, 237, 0.55);
    }
    .grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    }
    .grid.kpis {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    }
    .grid.three {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    }
    h2.sec {
      margin: 0;
      font-size: 1.1rem;
      color: #032d42;
    }
    /* every tile is one link: the whole surface is the target */
    a.tile {
      --tone: #2f6fed;
      --tint: #f1f6ff;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 18px;
      border-radius: 1.25rem;
      border: 1px solid color-mix(in srgb, var(--tone) 22%, #ffffff);
      border-left: 4px solid var(--tone);
      background: linear-gradient(160deg, var(--tint), #ffffff 70%);
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.07);
      color: #1b1b1b;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      min-width: 0;
    }
    a.tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(3, 45, 66, 0.14);
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
      gap: 8px;
      font-size: 0.72rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #4d4c4a;
      font-weight: 600;
    }
    .eyebrow svg {
      width: 18px;
      height: 18px;
      flex: none;
      color: var(--tone);
    }
    .num {
      font-size: 2.6rem;
      line-height: 1.05;
      font-weight: 700;
      color: var(--tone);
      font-variant-numeric: tabular-nums;
    }
    .kpis .num {
      font-size: 2rem;
    }
    .txt {
      margin: 0;
      font-size: 0.86rem;
      color: #4d4c4a;
      line-height: 1.4;
    }
    .go {
      margin-top: auto;
      padding-top: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--tone);
    }
    .go span {
      display: inline-block;
      transition: transform 0.2s ease;
    }
    a.tile:hover .go span {
      transform: translateX(4px);
    }
    .tile.wait {
      cursor: default;
      border-left-color: #c3cedc;
      background: #fafbfc;
    }
    .hint {
      margin: 0;
      font-size: 0.8rem;
      color: #4d4c4a;
    }
    .open-hint {
      position: absolute;
      left: 14px;
      bottom: 12px;
      padding: 4px 11px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      color: #032d42;
      font-size: 0.78rem;
      font-weight: 600;
      pointer-events: none;
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
      .go span,
      .hero-universe {
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

  _kpi(tone, icon, value, label, sub, target) {
    return this._link(tone, target, html`<span class="eyebrow">${this._icon(icon)}${label}</span><span class="num">${value}</span><span class="txt">${sub}</span><span class="go">${i18n.getMessage('Show in the universe')} <span aria-hidden="true">→</span></span>`, `${value} ${label}. ${sub}`);
  }

  _card(tone, icon, title, text, target, action) {
    return this._link(tone, target, html`<span class="eyebrow">${this._icon(icon)}${title}</span><p class="txt">${text}</p><span class="go">${action} <span aria-hidden="true">→</span></span>`, `${title}. ${text}`);
  }

  _renderOpportunities() {
    const o = this._opps;
    const f = n => new Intl.NumberFormat().format(n);
    const wait = (eyebrow, d) => html`<div class="tile wait rise" role="status" data-investigation=${d} style="display:flex"><span class="eyebrow">${eyebrow}</span><p class="txt">${i18n.getMessage('Reading records…')}</p></div>`;
    const unavailable = (eyebrow, d) => html`<div class="tile wait rise" data-investigation=${d} style="display:flex"><span class="eyebrow">${eyebrow}</span><p class="txt">${i18n.getMessage('This could not be read right now, so no figure is shown.')}</p></div>`;
    // colour says how firm the finding is: red for gaps that matter, amber for candidates to review, blue for information
    const card = (key, tone, icon, eyebrow, count, text, action, highlight, d) => {
      const v = o[key];
      if (!v) return wait(eyebrow, d);
      if (v.error) return unavailable(eyebrow, d);
      const target = exploreLink({highlight});
      return html`<a class="tile rise ${tone}" data-investigation=${d} href=${`${this._base}${target}`} aria-label=${`${eyebrow}: ${count(v)}. ${text(v)}`} @click=${e => this._tile(e, target)}>
        <span class="eyebrow">${this._icon(icon)}${eyebrow}</span>
        <span class="num">${count(v)}</span>
        <span class="txt">${text(v)}</span>
        <span class="go">${action} <span aria-hidden="true">→</span></span>
      </a>`;
    };
    return html`<section aria-labelledby="opps" class="flex flex-col gap-3">
      <h2 id="opps" class="sec">${i18n.getMessage('Where to look first')}</h2>
      <p class="hint">${i18n.getMessage('Each card opens Explore with exactly these items highlighted in the universe. Counts are prompts to review, not verdicts.')}</p>
      <div class="grid">
        ${card('meta', 'amber', 'doc', i18n.getMessage('Metadata quality'), v => f(v.n), v => i18n.getMessage('of {0} active items have a potential gap in names, descriptions or forms. A prompt to review, not a verdict.', f(v.of)), i18n.getMessage('Show these items'), 'metadata-gaps', 'ai-readiness')}
        ${card('form', 'amber', 'form', i18n.getMessage('Form quality'), v => f(v.n), v => i18n.getMessage('of {0} items with a form have a question worth reviewing: missing or technical labels, or no guidance on hard questions.', f(v.of)), i18n.getMessage('Show these items'), 'form-gaps', 'form-intelligence')}
        ${card('overlap', 'amber', 'copy', i18n.getMessage('Potential duplication'), v => f(v.n), v => i18n.getMessage('groups of look-alike items ({0} items) to compare. Similar names are candidates, not proof.', f(v.items)), i18n.getMessage('Compare candidates'), 'overlap', 'overlap')}
        ${card('taxonomy', 'red', 'tag', i18n.getMessage('Taxonomy and discoverability'), v => f(v.n), v => i18n.getMessage('of {0} active items may be hard to find, including {1} in no category at all.', f(v.of), f(v.uncategorised)), i18n.getMessage('Show these items'), 'taxonomy-gaps', 'taxonomy')}
        ${card('csdm', 'blue', 'link', i18n.getMessage('Service alignment'), v => f(v.candidates), v => i18n.getMessage('items have a likely service offering to review. {0} are already verified as linked, out of {1} offerings.', f(v.verified), f(v.offerings)), i18n.getMessage('Check alignment'), 'service-candidates', 'csdm-alignment')}
      </div>
    </section>`;
  }

  render() {
    const s = this._stats;
    const f = n => new Intl.NumberFormat().format(n);
    const csdm = this._opps?.csdm && !this._opps.csdm.error ? this._opps.csdm : null;
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

        <section class="hero-universe overflow-hidden rounded-3xl border border-base-300 shadow-sm" aria-label=${i18n.getMessage('Catalog universe preview. Select to open Explore.')}>
          <cat-universe compact @cat-universe:enter=${this._enter}></cat-universe>
          <span class="open-hint" aria-hidden="true">${i18n.getMessage('Click anywhere to explore')}</span>
        </section>

        ${s
          ? html`<section aria-label=${i18n.getMessage('Catalog at a glance')} class="grid kpis">
              ${this._kpi('blue', 'grid', f(s.items), i18n.getMessage('catalog items'), i18n.getMessage('{0} active. Open the full catalog.', f(s.active)), exploreLink({highlight: 'all', lens: 'overview'}))}
              ${this._kpi('blue', 'layers', f(s.populatedCategories), i18n.getMessage('categories in use'), i18n.getMessage('Each holds at least one item.'), exploreLink({highlight: 'categories', lens: 'overview'}))}
              ${this._kpi('green', 'check', f(s.complete), i18n.getMessage('items with complete metadata'), i18n.getMessage('Description, short description, icon and category all present.'), exploreLink({highlight: 'complete', lens: 'quality'}))}
              ${this._kpi('blue', 'pulse', f(s.requestedItems), i18n.getMessage('items that have been requested'), i18n.getMessage('Unique items, from {0} request records.', f(s.requests)), exploreLink({highlight: 'requested', lens: 'demand'}))}
            </section>`
          : nothing}

        ${this._opps ? this._renderOpportunities() : nothing}

        <section class="grid three" aria-label=${i18n.getMessage('Intelligence lenses')}>
          ${this._card('green', 'check', i18n.getMessage('Completeness'), i18n.getMessage('See which items are missing descriptions, icons or a category.'), exploreLink({lens: 'quality'}), i18n.getMessage('Open the Completeness lens'))}
          ${this._card('blue', 'pulse', i18n.getMessage('Lifecycle and demand'), i18n.getMessage('Spot inactive items and the few that have actually been requested. The Demand lens is one click away.'), exploreLink({lens: 'lifecycle'}), i18n.getMessage('Open the Lifecycle lens'))}
          ${this._card('blue', 'link', i18n.getMessage('CSDM foundation'), csdm ? i18n.getMessage('{0} items are linked to a service offering and {1} more may align with one.', f(csdm.verified), f(csdm.candidates)) : i18n.getMessage('See which items link to a service offering and where a match is plausible.'), exploreLink({lens: 'csdm', highlight: 'service'}), i18n.getMessage('Open the CSDM lens'))}
        </section>
      </div>
    `;
  }
}
