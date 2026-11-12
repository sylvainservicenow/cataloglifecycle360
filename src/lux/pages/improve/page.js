import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext, decorators} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {loadCatalog} from '../../lib/catalog-data.js';
import {loadOpportunities} from '../../lib/opportunity-loader.js';
import {OTTO_TOOLS, ottoContext} from '../../lib/otto.js';
import {exploreLink} from '../../lib/app-state.js';
import {icon} from '../../lib/icons.js';
import {pillarStyles} from '../../lib/pillars.js';
import '../../components/cat-appnav.js';

// application-local: this page is only reachable through this application's own experience
const {global} = decorators;

/**
 * Improve: the entry point for continuously optimising what already exists. It reuses the five existing
 * investigations (live counts from real records) and sends each one to the Explore workspace, where the
 * AI recommendations and the confirmed apply flow already live. It deliberately adds no new write path.
 */
@customElement('x-snc-catlife360-improve-page')
@global(false)
export default class ImprovePage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'The Improve area of Catalog Lifecycle 360: live counts for metadata gaps, form quality, duplicates, categories and service alignment in the real catalog',
    bestFor: 'When the user asks what to improve in the catalog, or to fix descriptions, forms, categories, duplicates or service links'
  };

  static client_tools = OTTO_TOOLS;

  static properties = {
    _stats: {state: true},
    _opps: {state: true}
  };

  static styles = [
    pillarStyles,
    css`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
        padding-bottom: 72px;
        container-type: inline-size;
      }
      .banner {
        position: relative;
        display: grid;
        gap: 8px;
        padding: 22px 26px;
        border-radius: 1.75rem;
        color: #fff;
        overflow: hidden;
        background: linear-gradient(125deg, #3b2a8f 0%, #6b3fd4 55%, #2f6fed 120%);
        box-shadow: 0 14px 34px rgba(59, 42, 143, 0.26);
      }
      .banner::after {
        content: '';
        position: absolute;
        right: -60px;
        top: -80px;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 70%);
        pointer-events: none;
      }
      .banner h1 {
        margin: 0;
        font-size: clamp(1.5rem, 3vw, 2.1rem);
        line-height: 1.15;
      }
      .banner p {
        margin: 0;
        max-width: 60ch;
        color: rgba(255, 255, 255, 0.92);
      }
      .banner .eyebrow {
        font-family: ui-monospace, monospace;
        font-size: 0.74rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.85;
      }
      .cta {
        justify-self: start;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        padding: 0.55rem 1.1rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.88rem;
        color: #3b2a8f;
        background: #fff;
        text-decoration: none;
        transition: transform 0.2s ease;
      }
      .cta:hover {
        transform: translateY(-2px);
      }
      .cta:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 3px;
      }
      .cta svg {
        width: 18px;
        height: 18px;
      }
      h2.sec {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #4d4c4a;
      }
      .lenses {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
        gap: 12px;
      }
      a.lens {
        --tone: #6b3fd4;
        --tint: #f6f2ff;
        position: relative;
        display: grid;
        gap: 4px;
        align-content: start;
        padding: 16px 18px 16px 20px;
        border-radius: 1.4rem;
        border: 1px solid color-mix(in srgb, var(--tone) 20%, #ffffff);
        background: linear-gradient(155deg, var(--tint), #ffffff 75%);
        color: #1b1b1b;
        text-decoration: none;
        overflow: hidden;
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }
      a.lens::before {
        content: '';
        position: absolute;
        left: 0;
        top: 16%;
        bottom: 16%;
        width: 4px;
        border-radius: 0 4px 4px 0;
        background: var(--tone);
      }
      a.lens:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(3, 45, 66, 0.15);
      }
      a.lens:focus-visible {
        outline: 3px solid #2f6fed;
        outline-offset: 2px;
      }
      a.lens.red {
        --tone: #d6383d;
        --tint: #fff3f3;
      }
      a.lens.amber {
        --tone: #d9820b;
        --tint: #fff8ec;
      }
      a.lens.blue {
        --tone: #2f6fed;
        --tint: #f1f6ff;
      }
      .lens .name {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #4d4c4a;
      }
      .lens .name svg {
        width: 17px;
        height: 17px;
        color: var(--tone);
      }
      .lens .num {
        font-size: 2.3rem;
        line-height: 1.05;
        font-weight: 700;
        color: var(--tone);
        font-variant-numeric: tabular-nums;
      }
      .lens .txt {
        font-size: 0.85rem;
        color: #3b3a38;
        line-height: 1.4;
      }
      .lens .go {
        margin-top: 4px;
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--tone);
      }
      .lens.wait {
        border-style: dashed;
        background: #fafbfc;
        min-height: 130px;
      }
      .how {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      @container (max-width: 760px) {
        .how {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .how li {
        padding: 14px 16px;
        border-radius: 1.2rem;
        background: #fff;
        border: 1px solid rgba(3, 45, 66, 0.1);
        font-size: 0.86rem;
        line-height: 1.45;
        color: #3b3a38;
      }
      .how b {
        display: block;
        margin-bottom: 2px;
        color: #032d42;
      }
      .back {
        font-size: 0.86rem;
        color: #3b3a38;
      }
      .back a {
        font-weight: 700;
        color: #12894a;
      }
      @media (prefers-reduced-motion: reduce) {
        a.lens,
        a.lens:hover,
        .cta,
        .cta:hover {
          transition: none;
          transform: none;
        }
      }
    `
  ];

  constructor() {
    super();
    this._stats = null;
    this._opps = null;
    this._base = '';
  }

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) {
      const i = location.pathname.indexOf('/cataloglifecycle360');
      this._base = i >= 0 ? location.pathname.slice(0, i + '/cataloglifecycle360'.length) : '';
    }
    loadCatalog()
      .then(m => {
        this._stats = m.stats;
        loadOpportunities(m, o => (this._opps = o));
      })
      .catch(() => (this._stats = null));
  }

  firstUpdated() {
    document.title = i18n.getMessage('Improve');
    ottoContext(this, {page: 'Improve'}).then(c => this.setAiContext(c));
  }

  _go(e, target) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    navigate(target);
  }

  _lenses() {
    const o = this._opps || {};
    const f = n => new Intl.NumberFormat().format(n ?? 0);
    return [
      {key: 'meta', tone: 'amber', ico: 'metadata', title: i18n.getMessage('Metadata quality'), n: o.meta?.n, text: i18n.getMessage('of {0} active items have a potential gap in their descriptions or form.', f(o.meta?.of)), target: exploreLink({highlight: 'metadata-gaps'})},
      {key: 'taxonomy', tone: 'red', ico: 'taxonomy', title: i18n.getMessage('Discoverability'), n: o.taxonomy?.n, text: i18n.getMessage('items may be hard to find, {0} of them in no category.', f(o.taxonomy?.uncategorised)), target: exploreLink({highlight: 'taxonomy-gaps'})},
      {key: 'form', tone: 'amber', ico: 'form', title: i18n.getMessage('Form quality'), n: o.form?.n, text: i18n.getMessage('forms have a question worth reviewing, out of {0}.', f(o.form?.of)), target: exploreLink({highlight: 'form-gaps'})},
      {key: 'overlap', tone: 'amber', ico: 'overlap', title: i18n.getMessage('Possible duplicates'), n: o.overlap?.n, text: i18n.getMessage('groups of look-alike items ({0} items) to compare.', f(o.overlap?.items)), target: exploreLink({highlight: 'overlap'})},
      {key: 'csdm', tone: 'blue', ico: 'service', title: i18n.getMessage('Service alignment'), n: o.csdm?.candidates, text: i18n.getMessage('items may align with a service offering. {0} are already linked.', f(o.csdm?.verified)), target: exploreLink({highlight: 'service-candidates'})}
    ].map(l => ({...l, state: !o[l.key] ? 'wait' : o[l.key].error ? 'error' : 'ok'}));
  }

  render() {
    const f = n => new Intl.NumberFormat().format(n);
    return html`
      <div class="mx-auto flex max-w-7xl flex-col gap-4">
        <cat-appnav current="improve"></cat-appnav>
        <section class="banner" aria-labelledby="imp-h">
          <span class="eyebrow">${i18n.getMessage('Improve')}</span>
          <h1 id="imp-h">${i18n.getMessage('Make what you already have work harder.')}</h1>
          <p>${i18n.getMessage('Every number below is counted from your real catalog records. Open one to review the items, then let AI propose a better description, form, category or service link. Nothing is saved until you confirm.')}</p>
          <a class="cta" href=${`${this._base}${exploreLink({})}`} @click=${e => this._go(e, exploreLink({}))}>${icon('spark')}${i18n.getMessage('Open the AI workspace')}</a>
        </section>

        <section aria-labelledby="lenses-h" class="flex flex-col gap-2">
          <h2 id="lenses-h" class="sec">${i18n.getMessage('Where to improve')}${this._stats ? html` · ${i18n.getMessage('{0} catalog items', f(this._stats.items))}` : nothing}</h2>
          <div class="lenses">
            ${this._lenses().map(l =>
              l.state === 'ok'
                ? html`<a class="lens ${l.tone}" data-investigation=${l.key} href=${`${this._base}${l.target}`} aria-label=${`${l.title}: ${f(l.n)}. ${l.text}`} @click=${e => this._go(e, l.target)}>
                    <span class="name">${icon(l.ico)}${l.title}</span>
                    <span class="num">${f(l.n ?? 0)}</span>
                    <span class="txt">${l.text}</span>
                    <span class="go">${i18n.getMessage('Review in Explore')} →</span>
                  </a>`
                : html`<div class="lens wait" role="status"><span class="name">${l.title}</span><span class="txt">${l.state === 'error' ? i18n.getMessage('Not available right now.') : i18n.getMessage('Reading records…')}</span></div>`
            )}
          </div>
        </section>

        <section aria-labelledby="how-h" class="flex flex-col gap-2">
          <h2 id="how-h" class="sec">${i18n.getMessage('How improvement works')}</h2>
          <ol class="how">
            <li><b>${i18n.getMessage('1. Find')}</b>${i18n.getMessage('Deterministic checks of real records point to the items worth your time.')}</li>
            <li><b>${i18n.getMessage('2. Review an AI proposal')}</b>${i18n.getMessage('AI reads the item and proposes better wording, questions, categories or services.')}</li>
            <li><b>${i18n.getMessage('3. Confirm to apply')}</b>${i18n.getMessage('You approve each change. The workspace shows exactly what will be written first.')}</li>
          </ol>
        </section>

        <p class="back">${i18n.getMessage('Missing something rather than fixing it?')} <a href=${`${this._base}/grow`} @click=${e => this._go(e, '/grow')}>${i18n.getMessage('Grow the catalog')} →</a></p>
      </div>
    `;
  }
}
