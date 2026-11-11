import {html, css, svg, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {guard} from 'lit/directives/guard.js';
import {repeat} from 'lit/directives/repeat.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {CRITERIA, classLabel, loadCatalog, packCircles, packItems} from '../lib/catalog-data.js';

const CLASS_COLORS = ['#2F6FED', '#0E9F8E', '#F2994A', '#8B5CF6', '#E5484D', '#12A150', '#D6409F', '#64748B', '#B7791F', '#0891B2', '#7C8DA6', '#A3A3A3'];
const LENSES = [
  {id: 'overview', label: () => i18n.getMessage('Overview'), hint: () => i18n.getMessage('Colour by item type')},
  {id: 'quality', label: () => i18n.getMessage('Completeness'), hint: () => i18n.getMessage('Colour by metadata completeness')},
  {id: 'lifecycle', label: () => i18n.getMessage('Lifecycle'), hint: () => i18n.getMessage('Colour by creation year, inactive items hollow')},
  {id: 'demand', label: () => i18n.getMessage('Demand'), hint: () => i18n.getMessage('Items that have been requested')},
  {id: 'csdm', label: () => i18n.getMessage('CSDM'), hint: () => i18n.getMessage('Service offering alignment')}
];

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (c1, c2, t) => {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
};
const qualityColor = s => (s >= 0.75 ? mix('#F2B134', '#12A150', (s - 0.75) * 4) : mix('#E5484D', '#F2B134', s / 0.75));

@customElement('cat-universe')
export default class CatUniverse extends AIUXElement {
  static properties = {
    compact: {type: Boolean},
    _model: {state: true},
    _error: {state: true},
    _lens: {state: true},
    _focus: {state: true},
    _selected: {state: true},
    _hover: {state: true},
    _query: {state: true},
    _searchOpen: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 360px;
      container-type: inline-size;
    }
    .stage {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: inherit;
      background:
        radial-gradient(1200px 700px at 20% 10%, #ffffff 0%, rgba(255, 255, 255, 0) 60%),
        radial-gradient(900px 600px at 90% 90%, #e9f1ff 0%, rgba(233, 241, 255, 0) 65%),
        linear-gradient(160deg, #f8f7f4 0%, #eef3fa 100%);
    }
    svg.universe {
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
      cursor: default;
    }
    .halo {
      fill: rgba(255, 255, 255, 0.72);
      stroke: rgba(3, 45, 66, 0.1);
      stroke-width: 1;
      transition: fill 0.4s, stroke 0.4s, opacity 0.5s;
      cursor: pointer;
    }
    .cl {
      transition: opacity 0.6s;
    }
    .cl:hover .halo,
    .halo:focus-visible {
      fill: #fff;
      stroke: rgba(47, 111, 237, 0.55);
      stroke-width: 2;
      outline: none;
    }
    .halo:focus-visible {
      stroke: #032d42;
      stroke-width: 3;
    }
    svg.has-focus .cl:not(.on) {
      opacity: 0.16;
    }
    svg.has-focus .cl.on .halo {
      fill: rgba(255, 255, 255, 0.92);
      stroke: rgba(3, 45, 66, 0.22);
    }
    .dot {
      transition: fill 0.55s ease, opacity 0.5s, r 0.3s;
      stroke: rgba(255, 255, 255, 0.9);
      stroke-width: 0.8;
      cursor: pointer;
    }
    .dot.hollow {
      stroke-width: 1.4;
    }
    .dot.dim {
      opacity: 0.22;
    }
    .dot.sel {
      stroke: #032d42;
      stroke-width: 2;
    }
    .dot:focus-visible {
      stroke: #032d42;
      stroke-width: 2.4;
      outline: none;
    }
    .lbl {
      font-family: inherit;
      font-weight: 600;
      fill: #032d42;
      pointer-events: none;
      text-anchor: middle;
      transition: opacity 0.35s;
      paint-order: stroke;
      stroke: rgba(255, 255, 255, 0.9);
      stroke-width: 0.35em;
      stroke-linejoin: round;
    }
    .lbl.sub {
      font-weight: 500;
      fill: #4d4c4a;
    }
    @media (prefers-reduced-motion: no-preference) {
      .halo.ambient {
        animation: breathe 9s ease-in-out infinite;
        transform-box: fill-box;
        transform-origin: center;
      }
      @keyframes breathe {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.018);
        }
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot,
      .halo,
      .cl {
        transition: none;
      }
    }

    /* floating chrome */
    .glass {
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(14px) saturate(1.2);
      border: 1px solid rgba(3, 45, 66, 0.1);
      box-shadow: 0 8px 30px rgba(3, 45, 66, 0.1);
      border-radius: 1rem;
    }
    .topbar {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    .topbar > * {
      pointer-events: auto;
    }
    .lenses {
      display: flex;
      gap: 4px;
      padding: 4px;
      flex-wrap: wrap;
    }
    .lens-btn {
      border: 0;
      background: transparent;
      color: #4d4c4a;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.45rem 0.8rem;
      border-radius: 0.7rem;
      cursor: pointer;
      transition: background 0.25s, color 0.25s;
    }
    .lens-btn:hover {
      background: rgba(3, 45, 66, 0.06);
    }
    .lens-btn[aria-pressed='true'] {
      background: #032d42;
      color: #fff;
    }
    .lens-btn:focus-visible,
    .chip:focus-visible,
    .search input:focus-visible,
    .close:focus-visible,
    .res:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .search {
      position: relative;
      width: min(280px, 100%);
    }
    .search input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(3, 45, 66, 0.15);
      border-radius: 0.8rem;
      padding: 0.55rem 0.8rem;
      font: inherit;
      font-size: 0.8125rem;
      background: rgba(255, 255, 255, 0.92);
      color: #1b1b1b;
    }
    .results {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      margin: 0;
      padding: 4px;
      list-style: none;
      max-height: 280px;
      overflow: auto;
      z-index: 5;
    }
    .res {
      display: block;
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      padding: 0.5rem 0.6rem;
      border-radius: 0.6rem;
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
      color: #1b1b1b;
    }
    .res:hover {
      background: rgba(47, 111, 237, 0.08);
    }
    .res small {
      display: block;
      color: #656462;
    }
    .crumbs {
      position: absolute;
      left: 12px;
      top: 64px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      font-size: 0.8125rem;
    }
    .chip {
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 600;
      color: #2f6fed;
      padding: 0.35rem 0.6rem;
      border-radius: 0.6rem;
      cursor: pointer;
    }
    .chip:hover {
      background: rgba(47, 111, 237, 0.08);
    }
    .crumb-cur {
      font-weight: 700;
      color: #032d42;
      padding-right: 0.6rem;
    }
    .insight {
      position: absolute;
      left: 12px;
      bottom: 12px;
      width: min(340px, calc(100% - 24px));
      padding: 14px 16px;
      font-size: 0.8125rem;
      color: #1b1b1b;
    }
    .insight h3 {
      margin: 0 0 2px;
      font-size: 0.9375rem;
      color: #032d42;
    }
    .insight p {
      margin: 0 0 8px;
      color: #4d4c4a;
      line-height: 1.4;
    }
    .big {
      font-size: 1.6rem;
      font-weight: 700;
      color: #032d42;
      line-height: 1.1;
    }
    .bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2px 8px;
      margin-top: 6px;
    }
    .track {
      grid-column: 1 / -1;
      height: 6px;
      background: rgba(3, 45, 66, 0.08);
      border-radius: 99px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #2f6fed, #0e9f8e);
      transition: width 0.7s ease;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-top: 8px;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: #4d4c4a;
    }
    .sw {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .ramp {
      height: 8px;
      border-radius: 99px;
      margin-top: 8px;
    }
    .ramp-lbl {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: #656462;
      margin-top: 2px;
    }
    .detail {
      position: absolute;
      top: 64px;
      right: 12px;
      bottom: 12px;
      width: min(360px, calc(100% - 24px));
      padding: 18px;
      overflow: auto;
      animation: slide 0.35s ease;
      color: #1b1b1b;
      font-size: 0.875rem;
    }
    @keyframes slide {
      from {
        opacity: 0;
        transform: translateX(24px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .detail {
        animation: none;
      }
    }
    .detail h2 {
      margin: 0 28px 4px 0;
      font-size: 1.125rem;
      line-height: 1.25;
      color: #032d42;
      overflow-wrap: anywhere;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 0;
      background: rgba(3, 45, 66, 0.07);
      cursor: pointer;
      font-size: 1rem;
      color: #032d42;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0 12px;
    }
    .tag {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 99px;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
    }
    .tag.ok {
      background: #e3f6ea;
      color: #0d6b36;
    }
    .tag.off {
      background: #fdebec;
      color: #a1171b;
    }
    .detail dl {
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 12px;
    }
    .detail dt {
      color: #656462;
    }
    .detail dd {
      margin: 0;
      text-align: right;
    }
    .checks {
      list-style: none;
      padding: 0;
      margin: 8px 0 14px;
    }
    .checks li {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 4px 0;
    }
    .mark {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
      flex: none;
    }
    .mark.y {
      background: #12a150;
    }
    .mark.n {
      background: #e5484d;
    }
    .open {
      display: inline-block;
      margin-top: 6px;
      color: #2f6fed;
      font-weight: 600;
      text-decoration: none;
    }
    .open:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .tip {
      position: absolute;
      pointer-events: none;
      transform: translate(12px, 12px);
      padding: 6px 10px;
      border-radius: 0.6rem;
      background: #032d42;
      color: #fff;
      font-size: 0.75rem;
      max-width: 260px;
      z-index: 6;
    }
    .tip small {
      display: block;
      opacity: 0.75;
    }
    .state {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      text-align: center;
      color: #4d4c4a;
      padding: 24px;
    }
    .orbit {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 3px solid rgba(47, 111, 237, 0.18);
      border-top-color: #2f6fed;
      animation: spin 1s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .orbit {
        animation-duration: 3s;
      }
    }
    .enter {
      position: absolute;
      right: 16px;
      bottom: 16px;
    }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    @container (max-width: 640px) {
      .detail {
        top: auto;
        height: 52%;
        left: 12px;
        width: auto;
      }
      .insight {
        display: none;
      }
      .crumbs {
        top: 112px;
      }
    }
  `;

  constructor() {
    super();
    this.compact = false;
    this._model = null;
    this._error = '';
    this._lens = 'overview';
    this._focus = null;
    this._selected = null;
    this._hover = null;
    this._query = '';
    this._searchOpen = false;
    this._cam = {x: 0, y: 0, w: 1000};
    this._anim = 0;
    this._layout = null;
    this._onKey = e => {
      if (e.key !== 'Escape') return;
      if (this._searchOpen) this._searchOpen = false;
      else if (this._selected) this._selected = null;
      else if (this._focus) this._focusCluster(null);
    };
    this._ro = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.addEventListener('keydown', this._onKey);
    this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._anim);
    this._ro?.disconnect();
    this.removeEventListener('keydown', this._onKey);
  }

  async _load() {
    try {
      const model = await loadCatalog();
      this._layout = this._computeLayout(model);
      this._model = model;
      await this.updateComplete;
      this._ro = new ResizeObserver(() => this._applyCam());
      this._ro.observe(this.renderRoot.querySelector('.stage'));
      this._cam = this._fitAll();
      this._applyCam();
    } catch (e) {
      this._error = e?.message || 'error';
    }
  }

  /* ---------- layout ---------- */
  _computeLayout(model) {
    const prepared = model.clusters.map(c => {
      const {pts, radius} = packItems(c.items.length);
      return {id: c.id, r: radius, pts, cluster: c};
    });
    const packed = packCircles(prepared, 14);
    const byId = new Map();
    packed.forEach(p => {
      const items = p.cluster.items.map((n, i) => ({n, x: p.x + p.pts[i].x, y: p.y + p.pts[i].y}));
      byId.set(p.id, {...p, items});
    });
    const minX = Math.min(...packed.map(p => p.x - p.r));
    const maxX = Math.max(...packed.map(p => p.x + p.r));
    const minY = Math.min(...packed.map(p => p.y - p.r));
    const maxY = Math.max(...packed.map(p => p.y + p.r + p.r * 0.35));
    const itemPos = new Map();
    byId.forEach(c => c.items.forEach(i => itemPos.set(i.n.id, i)));
    const catTitle = new Map(model.clusters.map(c => [c.id, c.title]));
    return {packed: [...byId.values()], byId, itemPos, catTitle, bounds: {minX, maxX, minY, maxY}};
  }

  _stageSize() {
    const el = this.renderRoot?.querySelector('.stage');
    return el ? {w: el.clientWidth || 800, h: el.clientHeight || 500} : {w: 800, h: 500};
  }

  _fitAll() {
    const {minX, maxX, minY, maxY} = this._layout.bounds;
    const {w, h} = this._stageSize();
    const pad = 1.06;
    const ww = Math.max((maxX - minX) * pad, ((maxY - minY) * pad * w) / h);
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2 + (this.compact ? 0 : 20), w: ww};
  }

  _applyCam() {
    const svgEl = this.renderRoot?.querySelector('svg.universe');
    if (!svgEl) return;
    const {w, h} = this._stageSize();
    const ch = (this._cam.w * h) / w;
    svgEl.setAttribute('viewBox', `${this._cam.x - this._cam.w / 2} ${this._cam.y - ch / 2} ${this._cam.w} ${ch}`);
    const pxPerUnit = w / this._cam.w;
    svgEl.querySelectorAll('.lbl').forEach(t => {
      const fs = Number(t.dataset.fs);
      const onScreen = fs * pxPerUnit;
      const focusOk = !this._focus || t.dataset.cl === this._focus;
      t.style.opacity = onScreen >= 9 && focusOk ? (t.classList.contains('sub') ? (onScreen >= 12 ? 1 : 0) : 1) : 0;
    });
  }

  _flyTo(target, ms = 900) {
    cancelAnimationFrame(this._anim);
    const reduce = !isServer && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = {...this._cam};
    if (reduce || ms === 0) {
      this._cam = target;
      this._applyCam();
      return;
    }
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      const e = ease(t);
      // zoom in log space so the motion feels uniform
      const w = Math.exp(lerp(Math.log(from.w), Math.log(target.w), e));
      this._cam = {x: lerp(from.x, target.x, e), y: lerp(from.y, target.y, e), w};
      this._applyCam();
      if (t < 1) this._anim = requestAnimationFrame(step);
    };
    this._anim = requestAnimationFrame(step);
  }

  _focusCluster(id, keepSelection = false) {
    this._focus = id;
    if (!keepSelection) this._selected = null;
    if (!this._layout) return;
    if (!id) return this._flyTo(this._fitAll());
    const c = this._layout.byId.get(id);
    const {w, h} = this._stageSize();
    const usable = w > 900 ? 0.62 : 0.95; // leave room for the detail drawer
    const ww = Math.max(c.r * 2.5, (c.r * 2.5 * w) / h) / usable;
    this._flyTo({x: c.x + (w > 900 ? c.r * 0.55 : 0), y: c.y, w: ww});
  }

  _select(id) {
    const pos = this._layout.itemPos.get(id);
    if (!pos) return;
    const n = pos.n;
    if (this._focus !== n.cluster) this._focusCluster(n.cluster, true);
    this._selected = id;
    this._searchOpen = false;
  }

  /* ---------- lens ---------- */
  _fill(n) {
    switch (this._lens) {
      case 'quality':
        return qualityColor(n.score);
      case 'lifecycle': {
        const {minYear, maxYear} = this._model.stats;
        const t = maxYear > minYear ? (Number(n.created.slice(0, 4)) - minYear) / (maxYear - minYear) : 1;
        return n.active ? mix('#B8C7DC', '#2F6FED', t) : '#ffffff';
      }
      case 'demand':
        return n.requests ? '#F2994A' : '#CBD5E1';
      case 'csdm':
        return '#B8C7DC';
      default:
        return CLASS_COLORS[this._classIndex(n.cls)];
    }
  }

  _classIndex(cls) {
    const order = Object.entries(this._model.stats.classes).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const i = order.indexOf(cls);
    return Math.min(i < 0 ? CLASS_COLORS.length - 1 : i, CLASS_COLORS.length - 1);
  }

  _dim(n) {
    if (this._lens === 'demand') return !n.requests;
    return false;
  }

  /* ---------- events ---------- */
  _onSvgClick(e) {
    const t = e.target.closest?.('[data-item],[data-cluster]');
    if (!t) {
      if (this._selected) this._selected = null;
      return;
    }
    if (this.compact) return this._enter();
    const item = t.dataset.item;
    const cl = t.dataset.cluster;
    if (item && this._focus === cl) this._select(item);
    else if (cl !== this._focus) this._focusCluster(cl);
  }

  _onSvgKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('[data-item],[data-cluster]');
    if (!t) return;
    e.preventDefault();
    this._onSvgClick(e);
  }

  _onMove(e) {
    const t = e.target.closest?.('[data-item]');
    if (!t || this.compact) {
      if (this._hover) this._hover = null;
      return;
    }
    const n = this._layout.itemPos.get(t.dataset.item)?.n;
    const r = this.renderRoot.querySelector('.stage').getBoundingClientRect();
    this._hover = n ? {n, x: e.clientX - r.left, y: e.clientY - r.top} : null;
  }

  _enter() {
    this.dispatchEvent(new CustomEvent('cat-universe:enter', {bubbles: true, composed: true}));
  }

  /* ---------- render ---------- */
  render() {
    if (this._error) {
      return html`<div class="stage"><div class="state" role="alert"><div><strong>${i18n.getMessage('The catalog could not be loaded')}</strong><p>${this._error}</p>
        <button class="chip" @click=${() => { this._error = ''; this._load(); }}>${i18n.getMessage('Retry')}</button></div></div></div>`;
    }
    if (!this._model) {
      return html`<div class="stage"><div class="state" role="status"><div><div class="orbit"></div>${i18n.getMessage('Mapping your catalog universe…')}</div></div></div>`;
    }
    const focusId = this._focus;
    return html`
      <div class="stage">
        ${guard([this._model, this._lens, this._focus, this._selected, this.compact], () => this._renderSvg())}
        ${this.compact ? this._renderEnter() : html`${this._renderTopbar()}${this._renderCrumbs()}${this._selected ? this._renderDetail() : nothing}${this._renderInsight()}`}
        ${this._hover && !this._selected ? this._renderTip() : nothing}
        <div class="vh" aria-live="polite">${focusId ? i18n.getMessage('Exploring {0}', this._layout.catTitle.get(focusId)) : ''}</div>
      </div>
    `;
  }

  _renderSvg() {
    const L = this._layout;
    const hasFocus = !!this._focus;
    return html`<svg class="universe ${classMap({'has-focus': hasFocus})}" role="group"
      aria-label=${i18n.getMessage('Catalog universe: {0} items in {1} clusters', String(this._model.stats.items), String(L.packed.length))}
      @click=${this._onSvgClick} @keydown=${this._onSvgKey} @pointermove=${this._onMove} @pointerleave=${() => (this._hover = null)}>
      ${repeat(L.packed, c => c.id, c => this._renderCluster(c))}
    </svg>`;
  }

  _renderCluster(c) {
    const on = this._focus === c.id;
    const fs = Math.max(8, c.r * 0.2);
    const count = c.items.length;
    const interactive = !this.compact;
    return svg`<g class="cl ${on ? 'on' : ''}">
      <circle class="halo ${this._focus ? '' : 'ambient'}" cx=${c.x} cy=${c.y} r=${c.r} data-cluster=${c.id}
        tabindex=${interactive && !on ? 0 : -1} role=${interactive ? 'button' : 'presentation'}
        aria-label=${i18n.getMessage('{0}, {1} items. Press Enter to explore.', c.cluster.title, String(count))}></circle>
      ${c.items.map(({n, x, y}) => {
        const selected = this._selected === n.id;
        return svg`<circle class="dot ${classMap({hollow: this._lens === 'lifecycle' && !n.active, dim: this._dim(n), sel: selected})}"
          cx=${x} cy=${y} r=${selected ? 6.4 : 4.2} data-item=${n.id} data-cluster=${c.id}
          style="fill:${this._fill(n)};${this._lens === 'lifecycle' && !n.active ? 'stroke:#2F6FED;' : ''}"
          tabindex=${interactive && on ? 0 : -1} role=${interactive && on ? 'button' : 'presentation'}
          aria-label=${interactive && on ? n.name : nothing}></circle>`;
      })}
      <text class="lbl" data-fs=${fs} data-cl=${c.id} x=${c.x} y=${c.y + c.r + fs * 1.15} font-size=${fs}>${c.cluster.title}</text>
      <text class="lbl sub" data-fs=${fs * 0.8} data-cl=${c.id} x=${c.x} y=${c.y + c.r + fs * 2.2} font-size=${fs * 0.8}>${count}</text>
    </g>`;
  }

  _renderEnter() {
    return html`<button class="enter chip glass" style="font-size:.9rem;padding:.6rem 1.1rem" @click=${this._enter}>${i18n.getMessage('Enter the universe')} →</button>`;
  }

  _renderTopbar() {
    const matches = this._searchMatches();
    return html`<div class="topbar">
      <div class="lenses glass" role="group" aria-label=${i18n.getMessage('Intelligence lenses')}>
        ${LENSES.map(l => html`<button class="lens-btn" aria-pressed=${this._lens === l.id} title=${l.hint()}
          @click=${() => { this._lens = l.id; }}>${l.label()}</button>`)}
      </div>
      <div class="search">
        <input type="search"
          placeholder=${i18n.getMessage('Search the catalog…')} aria-label=${i18n.getMessage('Search catalog items')}
          .value=${this._query}
          @input=${e => { this._query = e.target.value; this._searchOpen = true; }}
          @focus=${() => { this._searchOpen = true; }}>
        ${this._searchOpen && matches.length ? html`<ul class="results glass">
          ${matches.map(n => html`<li><button class="res" @click=${() => this._select(n.id)}>${n.name}
            <small>${this._layout.catTitle.get(n.cluster)} · ${classLabel(n.cls)}</small></button></li>`)}
        </ul>` : nothing}
      </div>
    </div>`;
  }

  _searchMatches() {
    const q = this._query.trim().toLowerCase();
    if (q.length < 2) return [];
    return this._model.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 8);
  }

  _renderCrumbs() {
    if (!this._focus) return nothing;
    return html`<nav class="crumbs glass" aria-label=${i18n.getMessage('Breadcrumb')}>
      <button class="chip" @click=${() => this._focusCluster(null)}>← ${i18n.getMessage('All categories')}</button>
      <span class="crumb-cur" aria-current="page">${this._layout.catTitle.get(this._focus)}</span>
    </nav>`;
  }

  _renderTip() {
    const {n, x, y} = this._hover;
    return html`<div class="tip" style="left:${x}px;top:${y}px" role="presentation">${n.name}<small>${classLabel(n.cls)}${n.active ? '' : ' · ' + i18n.getMessage('Inactive')}</small></div>`;
  }

  _fmt(n) {
    return new Intl.NumberFormat().format(n);
  }

  _fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return isNaN(d) ? s : new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(d);
  }

  _renderDetail() {
    const n = this._layout.itemPos.get(this._selected)?.n;
    if (!n) return nothing;
    return html`<aside class="detail glass" aria-label=${i18n.getMessage('Item details')}>
      <button class="close" aria-label=${i18n.getMessage('Close details')} @click=${() => { this._selected = null; }}>✕</button>
      <h2>${n.name}</h2>
      <div class="tags">
        <span class="tag">${classLabel(n.cls)}</span>
        <span class="tag ${n.active ? 'ok' : 'off'}">${n.active ? i18n.getMessage('Active') : i18n.getMessage('Inactive')}</span>
      </div>
      ${n.shortDescription ? html`<p>${n.shortDescription}</p>` : html`<p style="color:#656462"><em>${i18n.getMessage('No short description')}</em></p>`}
      <strong>${i18n.getMessage('Metadata completeness')} · ${Math.round(n.score * 100)}%</strong>
      <ul class="checks">${CRITERIA.map(c => html`<li><span class="mark ${n.flags[c.key] ? 'y' : 'n'}" aria-hidden="true">${n.flags[c.key] ? '✓' : '✕'}</span>
        <span>${c.label()} <span class="vh">${n.flags[c.key] ? i18n.getMessage('present') : i18n.getMessage('missing')}</span></span></li>`)}</ul>
      <dl>
        <dt>${i18n.getMessage('Categories')}</dt><dd>${n.catIds.length ? n.catIds.map(id => this._catName(id)).join(', ') : i18n.getMessage('None')}</dd>
        <dt>${i18n.getMessage('Requests')}</dt><dd>${this._fmt(n.requests)}</dd>
        <dt>${i18n.getMessage('Created')}</dt><dd>${this._fmtDate(n.created)}</dd>
        <dt>${i18n.getMessage('Updated')}</dt><dd>${this._fmtDate(n.updated)}</dd>
      </dl>
      <a class="open" href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a>
    </aside>`;
  }

  _catName(id) {
    return this._model.catTitle?.[id] || id;
  }

  _renderInsight() {
    const s = this._model.stats;
    const total = s.items;
    const pct = v => `${(100 * v / total).toFixed(0)}%`;
    const f = n => this._fmt(n);
    let body;
    switch (this._lens) {
      case 'quality':
        body = html`<h3>${i18n.getMessage('Metadata completeness')}</h3>
          <p><span class="big">${f(s.complete)}</span> ${i18n.getMessage('of {0} items have all four fields', f(total))}</p>
          ${CRITERIA.map(c => html`<div class="bar"><span>${c.label()}</span><span>${i18n.getMessage('{0} missing', f(s.missing[c.key]))}</span>
            <div class="track"><div class="fill" style="width:${100 - (100 * s.missing[c.key]) / total}%"></div></div></div>`)}
          <div class="ramp" style="background:linear-gradient(90deg,#E5484D,#F2B134,#12A150)"></div>
          <div class="ramp-lbl"><span>${i18n.getMessage('0 of 4')}</span><span>${i18n.getMessage('4 of 4')}</span></div>`;
        break;
      case 'lifecycle':
        body = html`<h3>${i18n.getMessage('Lifecycle')}</h3>
          <p><span class="big">${f(s.active)}</span> ${i18n.getMessage('active · {0} inactive (hollow)', f(total - s.active))}</p>
          <div class="ramp" style="background:linear-gradient(90deg,#B8C7DC,#2F6FED)"></div>
          <div class="ramp-lbl"><span>${s.minYear}</span><span>${s.maxYear}</span></div>`;
        break;
      case 'demand':
        body = html`<h3>${i18n.getMessage('Demand')}</h3>
          <p><span class="big">${f(s.requestedItems)}</span> ${i18n.getMessage('items requested · {0} request items in total', f(s.requests))}</p>
          <p>${i18n.getMessage('{0} of items have never been requested in the records available.', pct(total - s.requestedItems))}</p>`;
        break;
      case 'csdm':
        body = html`<h3>${i18n.getMessage('CSDM alignment')}</h3>
          <p><span class="big">${s.offerings == null ? '—' : f(s.offerings)}</span> ${i18n.getMessage('service offerings exist on this instance')}</p>
          <p>${i18n.getMessage('Catalog items do not carry a native service offering link here, so no alignment is shown. Suggestions will come in a later milestone.')}</p>`;
        break;
      default: {
        const order = Object.entries(s.classes).sort((a, b) => b[1] - a[1]);
        body = html`<h3>${i18n.getMessage('Item types')}</h3>
          <p><span class="big">${f(total)}</span> ${i18n.getMessage('items in {0} categories', f(s.populatedCategories))}${s.uncategorised ? i18n.getMessage(' · {0} uncategorised', f(s.uncategorised)) : ''}</p>
          <div class="legend">${order.slice(0, 8).map(([c, n], i) => html`<span><i class="sw" style="background:${CLASS_COLORS[Math.min(i, CLASS_COLORS.length - 1)]}"></i>${classLabel(c)} ${f(n)}</span>`)}</div>`;
      }
    }
    return html`<section class="insight glass" aria-label=${i18n.getMessage('Lens insight')}>${body}</section>`;
  }
}
