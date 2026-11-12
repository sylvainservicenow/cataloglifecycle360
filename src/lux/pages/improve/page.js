import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext, decorators} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {CRITERIA, classLabel, loadCatalog, loadItemVariables} from '../../lib/catalog-data.js';
import {assessVariable, isInput} from '../../lib/investigations/form-intelligence.js';
import {buildTaxonomy, ISSUE as TAXONOMY_ISSUE} from '../../lib/investigations/taxonomy.js';
import {ACTIONS, clearHandoff, consumeHandoff, patchHandoff, pendingFor, sourceLabel} from '../../lib/handoff.js';
import {loadOpportunities} from '../../lib/opportunity-loader.js';
import {OTTO_TOOLS, investigateUrl, ottoContext} from '../../lib/otto.js';
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
    _opps: {state: true},
    _ctx: {state: true},
    _model: {state: true},
    _anchor: {state: true},
    _evidence: {state: true}
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
      [hidden] {
        display: none !important;
      }
      .b-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 4px;
        position: relative;
        z-index: 1;
      }
      .cta {
        border: 0;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        font-size: 0.88rem;
      }
      .cta.ghost {
        color: #fff;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.5);
      }
      .cta.solid {
        color: #fff;
        background: linear-gradient(135deg, #3b2a8f, #6b3fd4);
      }
      .cta.ghost.dark {
        color: #3b2a8f;
        background: #fff;
        border: 1px solid #c9b8f0;
      }
      .cta[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .rem-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }
      @container (max-width: 900px) {
        .rem-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .card {
        display: grid;
        gap: 10px;
        padding: 18px 20px;
        border-radius: 1.4rem;
        background: #fff;
        border: 1px solid rgba(3, 45, 66, 0.1);
        min-width: 0;
      }
      .tag.live {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #0b5e33;
        background: #dcf5e6;
        border: 1px solid #a8dfbf;
      }
      .evs {
        display: grid;
        gap: 10px;
      }
      .ev {
        padding: 12px 14px;
        border-radius: 1.1rem;
        border: 1px solid rgba(3, 45, 66, 0.12);
        background: #fafbfc;
      }
      .ev.on {
        border-color: #6b3fd4;
        background: #f6f2ff;
        box-shadow: inset 4px 0 0 #6b3fd4;
      }
      .ev-h {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        color: #032d42;
      }
      .ev-m {
        margin: 4px 0 0;
        font-size: 0.84rem;
        color: #3b3a38;
        line-height: 1.4;
      }
      .chip {
        padding: 1px 9px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        background: #eef2f7;
        color: #36495a;
      }
      .pickb {
        margin-top: 8px;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 0.3rem 0.9rem;
        border-radius: 999px;
        border: 1px solid #6b3fd4;
        color: #5a32b8;
        background: #fff;
        cursor: pointer;
      }
      .pickb[aria-pressed='true'] {
        color: #fff;
        background: #6b3fd4;
      }
      .sub {
        margin: 6px 0 0;
        font-size: 0.9rem;
        color: #032d42;
      }
      .flags {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }
      .flags li {
        font-size: 0.86rem;
        padding: 8px 12px;
        border-radius: 0.9rem;
        background: #fff8ec;
        border-left: 4px solid #d9820b;
      }
      .flags small {
        display: block;
        color: #3b3a38;
      }
      .path {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }
      .path li {
        display: grid;
        grid-template-columns: 30px 1fr;
        gap: 10px;
        font-size: 0.88rem;
        opacity: 0.6;
      }
      .path li.done,
      .path li.now {
        opacity: 1;
      }
      .path .n {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-weight: 700;
        color: #fff;
        background: #9aa7b7;
      }
      .path .done .n {
        background: #12894a;
      }
      .path .now .n {
        background: #6b3fd4;
        animation: pulse 1.6s ease-in-out infinite;
      }
      @keyframes pulse {
        50% {
          box-shadow: 0 0 0 7px rgba(107, 63, 212, 0.16);
        }
      }
      .path small {
        display: block;
        color: #4d4c4a;
      }
      @media (prefers-reduced-motion: reduce) {
        .path .now .n {
          animation: none;
        }
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
    this._ctx = null;
    this._model = null;
    this._anchor = '';
    this._evidence = null;
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
        this._model = m;
        this._openContext();
        loadOpportunities(m, o => (this._opps = o));
      })
      .catch(() => (this._stats = null));
  }

  firstUpdated() {
    document.title = i18n.getMessage('Improve');
    ottoContext(this, {page: 'Improve'}).then(c => this.setAiContext(c));
  }

  /* ---------- remediation workspace (context from Understand) ---------- */
  _openContext() {
    const h = pendingFor('improve');
    if (!h) return;
    consumeHandoff();
    this._ctx = h;
    this._anchor = h.item?.id || h.group?.ids[0] || '';
    this._loadEvidence();
  }

  _investigation() {
    return {consolidate: 'overlap', simplify: 'form-intelligence', reclassify: 'taxonomy'}[this._ctx?.action];
  }

  /** Live evidence for the item being worked on, from the same readers the Understand workspace uses. */
  async _loadEvidence() {
    const h = this._ctx;
    const id = this._anchor;
    this._evidence = {loading: true};
    try {
      if (h.action === 'simplify' && id) {
        const vars = await loadItemVariables(id);
        const flagged = vars.filter(isInput).map(v => ({v, issues: assessVariable(v)})).filter(x => x.issues.length);
        this._evidence = {kind: 'form', total: vars.filter(isInput).length, flagged: flagged.slice(0, 6)};
      } else if (h.action === 'reclassify' && id) {
        const f = buildTaxonomy(this._model).findings.get(id) || [];
        this._evidence = {kind: 'category', findings: f.map(x => ({label: TAXONOMY_ISSUE[x.kind](), text: x.text}))};
      } else this._evidence = {kind: 'none'};
    } catch (e) {
      this._evidence = {error: e.message};
    }
  }

  _pickAnchor(id) {
    this._anchor = id;
  }

  /** Goes to the existing, confirmed AI proposal flow in Understand. Nothing is changed here. */
  _launch(workspace) {
    const id = this._anchor;
    if (!id) return;
    patchHandoff({stage: 'remediating', item: {id, name: this._model.nodes.find(n => n.id === id)?.name || ''}});
    navigate(investigateUrl({d: this._investigation(), item: id, open: workspace ? 'workspace' : undefined}));
  }

  _finish() {
    clearHandoff();
    this._ctx = null;
    this._evidence = null;
  }

  _itemCard(id, pick) {
    const n = this._model.nodes.find(x => x.id === id);
    if (!n) return nothing;
    const on = this._anchor === id;
    return html`<article class="ev ${on ? 'on' : ''}">
      <div class="ev-h"><b>${n.name}</b><span class="chip">${classLabel(n.cls)}</span>${n.active ? nothing : html`<span class="chip">${i18n.getMessage('Inactive')}</span>`}</div>
      <p class="ev-m">${n.catIds.length ? n.catIds.map(c => this._model.catTitle[c] || c).join(', ') : i18n.getMessage('No category')} · ${i18n.getMessage('{0} requests', String(n.requests))}</p>
      <p class="ev-m">${n.shortDescription || i18n.getMessage('No short description')}</p>
      <p class="ev-m">${i18n.getMessage('Metadata: {0} of {1} present', String(n.fields), String(CRITERIA.length))}</p>
      ${pick ? html`<button class="pickb" aria-pressed=${on} @click=${() => { this._pickAnchor(id); }}>${on ? i18n.getMessage('Working on this item') : i18n.getMessage('Work on this item')}</button>` : nothing}
    </article>`;
  }

  _renderRemediation() {
    const h = this._ctx;
    const ids = h.group?.ids || (h.item ? [h.item.id] : []);
    const ev = this._evidence;
    const a = this._model.nodes.find(n => n.id === this._anchor);
    const title = {
      consolidate: i18n.getMessage('Consolidate look-alike items'),
      simplify: i18n.getMessage('Simplify the form of “{0}”', a?.name || ''),
      reclassify: i18n.getMessage('Reclassify “{0}”', a?.name || '')
    }[h.action];
    const next = {
      consolidate: i18n.getMessage('AI compares the items and recommends which to keep, merge or retire.'),
      simplify: i18n.getMessage('AI reviews each question and proposes clearer labels, help text and requirements.'),
      reclassify: i18n.getMessage('AI proposes categories that fit the item better. It only adds categories; it never removes one.')
    }[h.action];
    return html`
      <section class="banner" aria-labelledby="rem-h">
        <span class="eyebrow">${ACTIONS[h.action].label()} · ${i18n.getMessage('from the {0}', sourceLabel(h))}</span>
        <h1 id="rem-h">${title}</h1>
        <p>${next}</p>
        <div class="b-row">
          <button class="cta" @click=${() => navigate(h.returnTo || '/explore')}>← ${i18n.getMessage('Back to Understand')}</button>
          <button class="cta ghost" @click=${() => this._finish()}>${i18n.getMessage('Done, clear context')}</button>
        </div>
      </section>
      <div class="rem-grid">
        <section class="card" aria-labelledby="ev-h">
          <h2 id="ev-h" class="sec">${i18n.getMessage('Evidence')} · <span class="tag live">${i18n.getMessage('Live records')}</span></h2>
          <div class="evs">${ids.map(id => this._itemCard(id, ids.length > 1))}</div>
          ${!ev || ev.loading ? html`<p class="ev-m" role="status">${i18n.getMessage('Reading records…')}</p>`
            : ev.error ? html`<p class="ev-m" role="alert">${ev.error}</p>`
            : ev.kind === 'form' ? html`<h3 class="sub">${i18n.getMessage('{0} of {1} questions flagged', String(ev.flagged.length), String(ev.total))}</h3><ul class="flags">${ev.flagged.map(x => html`<li><b>${x.v.label || x.v.name}</b><small>${x.issues.map(i => i.text).join(' ')}</small></li>`)}</ul>`
            : ev.kind === 'category' ? html`<h3 class="sub">${i18n.getMessage('Category findings')}</h3>${ev.findings.length ? html`<ul class="flags">${ev.findings.map(f => html`<li><b>${f.label}</b><small>${f.text}</small></li>`)}</ul>` : html`<p class="ev-m">${i18n.getMessage('No signal found for this item.')}</p>`}`
            : nothing}
        </section>
        <section class="card" aria-labelledby="path-h">
          <h2 id="path-h" class="sec">${i18n.getMessage('Remediation path')}</h2>
          <ol class="path">
            <li class="done"><span class="n" aria-hidden="true">✓</span><span><b>${i18n.getMessage('Found in Understand')}</b><small>${i18n.getMessage('Deterministic checks of your real records.')}</small></span></li>
            <li class="now"><span class="n" aria-hidden="true">2</span><span><b>${i18n.getMessage('Review an AI proposal')}</b><small>${i18n.getMessage('AI reads the real records and proposes. Nothing is saved.')}</small></span></li>
            <li><span class="n" aria-hidden="true">3</span><span><b>${i18n.getMessage('Confirm to apply')}</b><small>${i18n.getMessage('You approve each change; the workspace shows exactly what will be written.')}</small></span></li>
          </ol>
          <div class="b-row">
            <button class="cta solid" ?disabled=${!this._anchor} @click=${() => this._launch(true)}>${icon('spark')}${i18n.getMessage('Open the AI proposal')}</button>
            <button class="cta ghost dark" ?disabled=${!this._anchor} @click=${() => this._launch(false)}>${i18n.getMessage('See the findings first')}</button>
          </div>
          <p class="ev-m">${i18n.getMessage('The proposal and the confirmed apply step are the same ones used in Understand. Here you only choose what to work on.')}</p>
        </section>
      </div>`;
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
        ${this._ctx && this._model ? this._renderRemediation() : nothing}
        <section class="banner" aria-labelledby="imp-h" ?hidden=${!!this._ctx}>
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

        <section aria-labelledby="how-h" class="flex flex-col gap-2" ?hidden=${!!this._ctx}>
          <h2 id="how-h" class="sec">${i18n.getMessage('How improvement works')}</h2>
          <ol class="how">
            <li><b>${i18n.getMessage('1. Find')}</b>${i18n.getMessage('Deterministic checks of real records point to the items worth your time.')}</li>
            <li><b>${i18n.getMessage('2. Review an AI proposal')}</b>${i18n.getMessage('AI reads the item and proposes better wording, questions, categories or services.')}</li>
            <li><b>${i18n.getMessage('3. Confirm to apply')}</b>${i18n.getMessage('You approve each change. The workspace shows exactly what will be written first.')}</li>
          </ol>
        </section>

        <p class="back">${this._ctx ? nothing : i18n.getMessage('Tip: select an item in Understand and use “Take this further” to land here with its context.')}</p>
        <p class="back">${i18n.getMessage('Missing something rather than fixing it?')} <a href=${`${this._base}/grow`} @click=${e => this._go(e, '/grow')}>${i18n.getMessage('Grow the catalog')} →</a></p>
      </div>
    `;
  }
}
