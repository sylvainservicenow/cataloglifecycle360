import {html, css, svg, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {guard} from 'lit/directives/guard.js';
import {repeat} from 'lit/directives/repeat.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {CRITERIA, classLabel, loadCatalog, packCircles, packGrid, packItems} from '../lib/catalog-data.js';

const CLASS_COLORS = ['#2F6FED', '#0E9F8E', '#F2994A', '#8B5CF6', '#E5484D', '#12A150', '#D6409F', '#64748B', '#B7791F', '#0891B2', '#7C8DA6', '#A3A3A3'];
const AMBER = '#F08A24';
const SOFT = '#D5DEEA';
const LENSES = [
  {id: 'overview', label: () => i18n.getMessage('Overview'), hint: () => i18n.getMessage('Colour by item type')},
  {id: 'quality', label: () => i18n.getMessage('Completeness'), hint: () => i18n.getMessage('Colour by metadata completeness')},
  {id: 'lifecycle', label: () => i18n.getMessage('Lifecycle'), hint: () => i18n.getMessage('Colour by creation year, inactive items hollow')},
  {id: 'demand', label: () => i18n.getMessage('Demand'), hint: () => i18n.getMessage('Items that have been requested')},
  {id: 'csdm', label: () => i18n.getMessage('CSDM'), hint: () => i18n.getMessage('Service offering alignment')}
];

const STORY = {
  icon: (n, t, p) => i18n.getMessage('{0} of {1} items ({2}%) have no icon or picture.', n, t, p),
  description: (n, t, p) => i18n.getMessage('{0} of {1} items ({2}%) have no description.', n, t, p),
  shortDescription: (n, t, p) => i18n.getMessage('{0} of {1} items ({2}%) have no short description.', n, t, p),
  category: (n, t, p) => i18n.getMessage('{0} of {1} items ({2}%) are not in any category.', n, t, p)
};

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (c1, c2, t) => {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
};
const qualityColor = s => (s >= 0.75 ? mix('#F2B134', '#12A150', (s - 0.75) * 4) : mix('#E5484D', '#F2B134', s / 0.75));
const trunc = (s, max) => (s.length > max ? s.slice(0, Math.max(1, max - 1)).trimEnd() + '…' : s);
const fmt = n => new Intl.NumberFormat().format(n);

@customElement('cat-universe')
export default class CatUniverse extends AIUXElement {
  static properties = {
    compact: {type: Boolean},
    _model: {state: true},
    _error: {state: true},
    _lens: {state: true},
    _gap: {state: true},
    _focus: {state: true},
    _selected: {state: true},
    _hover: {state: true},
    _query: {state: true},
    _searchOpen: {state: true},
    _legendOpen: {state: true},
    _narrow: {state: true}
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 360px;
      container-type: inline-size;
    }
    .stage {
      position: relative;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      border-radius: 1.5rem;
      border: 1px solid rgba(3, 45, 66, 0.1);
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
      background:
        radial-gradient(1100px 640px at 18% 8%, #ffffff 0%, rgba(255, 255, 255, 0) 62%),
        radial-gradient(900px 600px at 92% 92%, #e6efff 0%, rgba(230, 239, 255, 0) 66%),
        linear-gradient(160deg, #f8f7f4 0%, #edf2f9 100%);
    }
    svg.universe {
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
    }

    /* ---------- universe ---------- */
    .halo {
      fill: rgba(255, 255, 255, 0.66);
      stroke: rgba(3, 45, 66, 0.09);
      stroke-width: 1;
      cursor: pointer;
      transition: fill 0.4s, stroke 0.4s, r 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), x 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), y 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .halo.band {
      fill: rgba(255, 255, 255, 0.4);
      stroke: rgba(3, 45, 66, 0.28);
      stroke-dasharray: 5 6;
    }
    .cl {
      transition: opacity 0.6s;
    }
    .cl:hover .halo,
    .halo:focus-visible {
      fill: #fff;
      stroke: rgba(47, 111, 237, 0.6);
      stroke-width: 1.6;
      outline: none;
    }
    .halo:focus-visible {
      stroke: #032d42;
      stroke-width: 2.4;
    }
    svg.has-focus .cl:not(.on) {
      opacity: 0.14;
    }
    svg.has-focus .cl.on .halo {
      fill: rgba(255, 255, 255, 0.94);
      stroke: rgba(3, 45, 66, 0.2);
    }
    .dot {
      stroke: rgba(255, 255, 255, 0.95);
      stroke-width: 0.8;
      cursor: pointer;
      transition: fill 0.6s ease, opacity 0.5s, cx 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), cy 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), r 0.5s;
    }
    .dot.hollow {
      stroke-width: 1.5;
    }
    .dot.dim {
      opacity: 0.2;
    }
    .dot:focus-visible {
      stroke: #032d42;
      stroke-width: 2.4;
      outline: none;
    }
    .ring {
      fill: none;
      stroke: #032d42;
      stroke-width: 1.8;
      pointer-events: none;
      transform-box: fill-box;
      transform-origin: center;
    }
    .lbl,
    .ilbl {
      font-family: inherit;
      font-weight: 600;
      fill: #032d42;
      pointer-events: none;
      text-anchor: middle;
      opacity: 0;
      transition: opacity 0.4s;
      paint-order: stroke;
      stroke: rgba(248, 247, 244, 0.95);
      stroke-width: 0.3em;
      stroke-linejoin: round;
    }
    .lbl.sub {
      font-weight: 500;
      fill: #5d5c5a;
    }
    .ilbl {
      font-weight: 500;
    }
    @media (prefers-reduced-motion: no-preference) {
      .cl {
        animation: reveal 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) var(--d, 0ms) backwards;
        transform-box: fill-box;
        transform-origin: center;
      }
      @keyframes reveal {
        from {
          opacity: 0;
          transform: scale(0.55);
        }
      }
      .ring {
        animation: pulse 1.8s ease-out infinite;
      }
      @keyframes pulse {
        from {
          transform: scale(1);
          opacity: 1;
        }
        to {
          transform: scale(2.4);
          opacity: 0;
        }
      }
      .halo.ambient {
        animation: breathe 10s ease-in-out infinite;
        transform-box: fill-box;
        transform-origin: center;
      }
      @keyframes breathe {
        50% {
          transform: scale(1.02);
        }
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot,
      .halo,
      .cl,
      .lbl,
      .ilbl {
        transition: none;
      }
    }

    /* ---------- chrome ---------- */
    .bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: center;
      justify-content: space-between;
      padding: 0 2px 10px;
    }
    .lenses {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      flex-wrap: wrap;
      background: rgba(3, 45, 66, 0.06);
      border-radius: 0.9rem;
    }
    .lens-btn {
      border: 0;
      background: transparent;
      color: #4d4c4a;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.4rem 0.85rem;
      border-radius: 0.7rem;
      cursor: pointer;
      transition: background 0.3s, color 0.3s, box-shadow 0.3s;
    }
    .lens-btn:hover {
      background: rgba(255, 255, 255, 0.7);
    }
    .lens-btn[aria-pressed='true'] {
      background: #fff;
      color: #032d42;
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.18);
    }
    .lens-btn:focus-visible,
    .chip:focus-visible,
    .search input:focus-visible,
    .close:focus-visible,
    .res:focus-visible,
    .pill:focus-visible,
    .row-btn:focus-visible,
    .open:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .search {
      position: relative;
      width: min(300px, 100%);
    }
    .search input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(3, 45, 66, 0.14);
      border-radius: 0.9rem;
      padding: 0.5rem 0.85rem;
      font: inherit;
      font-size: 0.8125rem;
      background: #fff;
      color: #1b1b1b;
    }
    .glass {
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(14px) saturate(1.2);
      border: 1px solid rgba(3, 45, 66, 0.09);
      box-shadow: 0 6px 24px rgba(3, 45, 66, 0.1);
      border-radius: 1rem;
    }
    .results {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      margin: 0;
      padding: 4px;
      list-style: none;
      max-height: 300px;
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
      top: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px;
      font-size: 0.8125rem;
    }
    .chip {
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 600;
      color: #2f6fed;
      padding: 0.35rem 0.65rem;
      border-radius: 0.7rem;
      cursor: pointer;
    }
    .chip:hover {
      background: rgba(47, 111, 237, 0.08);
    }
    .crumb-cur {
      font-weight: 700;
      color: #032d42;
      padding: 0 0.7rem 0 0.2rem;
      max-width: 36ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dock {
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 12px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
      pointer-events: none;
    }
    .dock > * {
      pointer-events: auto;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 0;
      font: inherit;
      font-size: 0.8125rem;
      color: #1b1b1b;
      padding: 0.5rem 0.85rem;
      cursor: pointer;
      text-align: left;
    }
    .pill b {
      color: #032d42;
    }
    .caret {
      transition: transform 0.3s;
    }
    .pill[aria-expanded='true'] .caret {
      transform: rotate(180deg);
    }
    .sheet {
      position: absolute;
      left: 12px;
      bottom: 62px;
      width: min(360px, calc(100% - 24px));
      padding: 14px 16px;
      font-size: 0.8125rem;
      color: #1b1b1b;
      animation: slide-up 0.3s ease;
      z-index: 3;
    }
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
    }
    .sheet h3 {
      margin: 0 0 2px;
      font-size: 0.9375rem;
      color: #032d42;
    }
    .sheet p {
      margin: 0 0 8px;
      color: #4d4c4a;
      line-height: 1.4;
    }
    .big {
      font-size: 1.5rem;
      font-weight: 700;
      color: #032d42;
      line-height: 1.1;
    }
    .row-btn {
      display: block;
      width: 100%;
      border: 0;
      background: transparent;
      font: inherit;
      color: inherit;
      text-align: left;
      padding: 5px 6px;
      margin: 0 -6px;
      border-radius: 0.6rem;
      cursor: pointer;
    }
    .row-btn:hover,
    .row-btn[aria-pressed='true'] {
      background: rgba(240, 138, 36, 0.12);
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .track {
      height: 6px;
      background: rgba(3, 45, 66, 0.08);
      border-radius: 99px;
      overflow: hidden;
      margin-top: 4px;
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
    .story {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.5rem 0.55rem 0.5rem 0.85rem;
      max-width: min(520px, 60%);
      font-size: 0.8125rem;
      color: #1b1b1b;
      animation: slide-up 0.6s ease 1.6s backwards;
    }
    .spark {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #f08a24;
      flex: none;
      box-shadow: 0 0 0 0 rgba(240, 138, 36, 0.5);
    }
    @media (prefers-reduced-motion: no-preference) {
      .spark {
        animation: glow 2.4s ease-out infinite;
      }
      @keyframes glow {
        to {
          box-shadow: 0 0 0 10px rgba(240, 138, 36, 0);
        }
      }
    }
    .story small {
      display: block;
      color: #656462;
    }
    .cta {
      border: 0;
      flex: none;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      background: #032d42;
      color: #fff;
      padding: 0.4rem 0.8rem;
      border-radius: 0.7rem;
      cursor: pointer;
    }
    .cta:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .detail {
      position: absolute;
      top: 12px;
      right: 12px;
      bottom: 12px;
      width: min(340px, calc(100% - 24px));
      padding: 18px;
      overflow: auto;
      animation: slide-in 0.35s ease;
      color: #1b1b1b;
      font-size: 0.875rem;
      z-index: 4;
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(24px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .detail,
      .sheet,
      .story {
        animation: none;
      }
    }
    .detail h2 {
      margin: 0 30px 4px 0;
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
      margin-top: 8px;
      color: #2f6fed;
      font-weight: 600;
      text-decoration: none;
    }
    .tip {
      position: absolute;
      pointer-events: none;
      transform: translate(12px, 14px);
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
    .enter {
      position: absolute;
      right: 16px;
      bottom: 16px;
      font-size: 0.9rem;
      padding: 0.6rem 1.1rem;
    }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    @container (max-width: 560px) {
      .story {
        display: none;
      }
    }
    @container (max-width: 700px) {
      .detail {
        top: auto;
        height: 56%;
        left: 12px;
        width: auto;
      }
      .story {
        max-width: 100%;
      }
      .dock {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  constructor() {
    super();
    this.compact = false;
    this._model = null;
    this._error = '';
    this._lens = 'overview';
    this._gap = null;
    this._focus = null;
    this._selected = null;
    this._hover = null;
    this._query = '';
    this._searchOpen = false;
    this._legendOpen = false;
    this._narrow = false;
    this._cam = {x: 0, y: 0, w: 1000};
    this._anim = 0;
    this._layout = null;
    this._ro = null;
    this._onKey = e => {
      if (e.key !== 'Escape' || this.compact) return;
      if (this._searchOpen) this._searchOpen = false;
      else if (this._legendOpen) this._legendOpen = false;
      else if (this._selected) this._selected = null;
      else if (this._focus) this._focusCluster(null);
    };
    this._onPop = () => {
      const id = this._hashFocus();
      if (id !== this._focus) this._focusCluster(id, false, true);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('popstate', this._onPop);
    this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._anim);
    this._ro?.disconnect();
    if (!isServer) {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('popstate', this._onPop);
    }
  }

  updated() {
    this._applyCam();
  }

  async _load() {
    try {
      const model = await loadCatalog();
      this._layout = this._computeLayout(model);
      this._model = model;
      await this.updateComplete;
      const stage = this.renderRoot.querySelector('.stage');
      let lastW = stage.clientWidth;
      this._ro = new ResizeObserver(() => {
        if (!this._focus && Math.abs(stage.clientWidth - lastW) > 2) this._cam = this._fitAll();
        lastW = stage.clientWidth;
        this._narrow = lastW < 220;
        this._applyCam();
      });
      this._ro.observe(stage);
      const fit = this._fitAll();
      const start = this._hashFocus();
      this._cam = {...fit, w: fit.w * 0.55};
      this._applyCam();
      if (start && this._layout.byId.has(start)) this._focusCluster(start, false, true);
      else this._flyTo(fit, 1700);
    } catch (e) {
      this._error = e?.message || 'error';
    }
  }

  /* ---------- layout ---------- */
  _computeLayout(model) {
    const cats = model.clusters.filter(c => !c.uncategorised);
    const unc = model.clusters.find(c => c.uncategorised);
    const prepared = cats.map(c => {
      const n = c.items.length;
      const compact = packItems(n, 1);
      const roomy = packItems(n, n <= 40 ? 2.5 : n <= 100 ? 1.9 : 1.55);
      const labeled = n >= 8;
      const fs = Math.min(20, Math.max(9, compact.radius * 0.17));
      return {id: c.id, r: compact.radius + (labeled ? fs * 2.9 : 3), shape: 'circle', halo: compact.radius, haloX: roomy.radius, pts: compact.pts, ptsX: roomy.pts, labeled, fs, cluster: c};
    });
    const packed = packCircles(prepared, 5, 0.52);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    packed.forEach(p => {
      minX = Math.min(minX, p.x - p.halo);
      maxX = Math.max(maxX, p.x + p.halo);
      minY = Math.min(minY, p.y - p.halo);
      maxY = Math.max(maxY, p.y + p.r);
    });
    const all = packed.map(p => ({...p}));
    if (unc) {
      const cols = Math.max(24, Math.round(((maxX - minX) * 0.7) / 10.2));
      const a = packGrid(unc.items.length, cols, 10.2);
      const b = packGrid(unc.items.length, cols, 22);
      all.push({
        id: unc.id, shape: 'band', x: (minX + maxX) / 2, y: maxY + 70 + a.h / 2, w: a.w, h: a.h, wX: b.w, hX: b.h, halo: 0,
        pts: a.pts, ptsX: b.pts, labeled: false, fs: 15, cluster: unc
      });
      maxY = maxY + 70 + a.h + 10;
      minX = Math.min(minX, (minX + maxX) / 2 - a.w / 2);
      maxX = Math.max(maxX, (minX + maxX) / 2 + a.w / 2);
    }
    const byId = new Map();
    all.forEach(c => {
      c.items = c.cluster.items.map((n, i) => ({n, x: c.x + c.pts[i].x, y: c.y + c.pts[i].y, xx: c.x + c.ptsX[i].x, yy: c.y + c.ptsX[i].y}));
      byId.set(c.id, c);
    });
    const itemPos = new Map();
    all.forEach(c => c.items.forEach(i => itemPos.set(i.n.id, i)));
    return {packed: all, byId, itemPos, bounds: {minX, maxX, minY, maxY}, titles: new Map(all.map(c => [c.id, c.cluster.title]))};
  }

  _stageSize() {
    const el = this.renderRoot?.querySelector('.stage');
    return el ? {w: el.clientWidth || 800, h: el.clientHeight || 500} : {w: 800, h: 500};
  }

  _fitAll() {
    const {minX, maxX, minY, maxY} = this._layout.bounds;
    const {w, h} = this._stageSize();
    const dock = this.compact ? 0 : 74; // keep the bottom dock clear of the universe
    const pad = 1.05;
    const usableH = Math.max(120, h - dock);
    const ww = Math.max((maxX - minX) * pad, ((maxY - minY) * pad * w) / usableH);
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2 + (dock / 2) * (ww / w), w: ww};
  }

  _applyCam() {
    const svgEl = this.renderRoot?.querySelector('svg.universe');
    if (!svgEl) return;
    const {w, h} = this._stageSize();
    const ch = (this._cam.w * h) / w;
    svgEl.setAttribute('viewBox', `${this._cam.x - this._cam.w / 2} ${this._cam.y - ch / 2} ${this._cam.w} ${ch}`);
    const pxPerUnit = w / this._cam.w;
    svgEl.querySelectorAll('[data-fs]').forEach(t => {
      const px = Number(t.dataset.fs) * pxPerUnit;
      let show;
      if (t.classList.contains('ilbl')) show = this._focus === t.dataset.cl && px >= 8.5;
      else show = !this._focus && px >= (t.classList.contains('sub') ? 11 : 9);
      t.style.opacity = show ? 1 : 0;
    });
  }

  _flyTo(target, ms = 1000) {
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
      const w = Math.exp(lerp(Math.log(from.w), Math.log(target.w), e));
      this._cam = {x: lerp(from.x, target.x, e), y: lerp(from.y, target.y, e), w};
      this._applyCam();
      if (t < 1) this._anim = requestAnimationFrame(step);
    };
    this._anim = requestAnimationFrame(step);
  }

  _hashFocus() {
    if (isServer) return null;
    const m = /cluster=([0-9a-f]{32}|__none__)/.exec(window.location.hash);
    return m ? m[1] : null;
  }

  _focusCluster(id, keepSelection = false, fromHistory = false) {
    if (!fromHistory && !this.compact && id !== this._focus) {
      const url = new URL(window.location.href);
      url.hash = id ? `cluster=${id}` : '';
      window.history.pushState(window.history.state, '', url);
    }
    this._focus = id;
    this._hover = null;
    if (!keepSelection) this._selected = null;
    if (!this._layout) return;
    if (!id) return this._flyTo(this._fitAll(), 1100);
    const c = this._layout.byId.get(id);
    if (!c) return;
    const {w, h} = this._stageSize();
    const drawer = w > 900;
    const usable = drawer ? 0.64 : 0.95;
    let ww;
    let half;
    if (c.shape === 'band') {
      ww = Math.max(c.wX * 1.12, (c.hX * 1.4 * w) / h) / usable;
      half = c.wX / 2;
    } else {
      ww = Math.max(c.haloX * 2.35, (c.haloX * 2.35 * w) / h) / usable;
      half = c.haloX;
    }
    this._flyTo({x: c.x + (drawer ? ww * 0.17 : 0), y: c.y, w: ww}, 1100);
    void half;
  }

  _select(id) {
    const pos = this._layout.itemPos.get(id);
    if (!pos) return;
    if (this._focus !== pos.n.cluster) this._focusCluster(pos.n.cluster, true);
    this._selected = id;
    this._searchOpen = false;
    this._legendOpen = false;
  }

  /* ---------- lens ---------- */
  _fill(n) {
    switch (this._lens) {
      case 'quality':
        if (this._gap) return n.flags[this._gap] ? SOFT : AMBER;
        return qualityColor(n.score);
      case 'lifecycle': {
        const {minYear, maxYear} = this._model.stats;
        const t = maxYear > minYear ? (Number(n.created.slice(0, 4)) - minYear) / (maxYear - minYear) : 1;
        return n.active ? mix('#B8C7DC', '#2F6FED', t) : '#ffffff';
      }
      case 'demand':
        return n.requests ? AMBER : '#CBD5E1';
      case 'csdm':
        return '#B8C7DC';
      default:
        return CLASS_COLORS[this._classIndex(n.cls)];
    }
  }

  _classIndex(cls) {
    if (!this._classOrder) this._classOrder = Object.entries(this._model.stats.classes).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const i = this._classOrder.indexOf(cls);
    return Math.min(i < 0 ? CLASS_COLORS.length - 1 : i, CLASS_COLORS.length - 1);
  }

  _setLens(id) {
    this._lens = id;
    if (id !== 'quality') this._gap = null;
  }

  /** The most significant verified gap: the criterion with the most missing items. */
  _story() {
    const s = this._model.stats;
    const total = s.items;
    const top = CRITERIA.map(c => ({key: c.key, miss: s.missing[c.key]})).sort((a, b) => b.miss - a.miss)[0];
    if (!top || !top.miss) return null;
    let worst = null;
    for (const c of this._layout.packed) {
      if (c.cluster.uncategorised) continue;
      const m = c.cluster.items.filter(n => !n.flags[top.key]).length;
      if (m > (worst?.m ?? 0)) worst = {title: c.cluster.title, m, n: c.cluster.items.length};
    }
    return {key: top.key, miss: top.miss, pct: Math.round((100 * top.miss) / total), total, worst};
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
    else if (this._selected) this._selected = null;
  }

  _onSvgKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('[data-item],[data-cluster]');
    if (!t) return;
    e.preventDefault();
    this._onSvgClick(e);
  }

  _onMove(e) {
    if (this.compact) return;
    const t = e.target.closest?.('[data-item],[data-cluster]');
    if (!t) {
      if (this._hover) this._hover = null;
      return;
    }
    const r = this.renderRoot.querySelector('.stage').getBoundingClientRect();
    const pos = {x: e.clientX - r.left, y: e.clientY - r.top};
    const item = t.dataset.item && t.dataset.cluster === this._focus ? this._layout.itemPos.get(t.dataset.item)?.n : null;
    if (item) {
      this._hover = {...pos, title: item.name, sub: classLabel(item.cls) + (item.active ? '' : ' · ' + i18n.getMessage('Inactive'))};
    } else if (!this._focus || t.dataset.cluster !== this._focus) {
      const c = this._layout.byId.get(t.dataset.cluster);
      this._hover = c ? {...pos, title: c.cluster.title, sub: i18n.getMessage('{0} items · click to explore', fmt(c.items.length))} : null;
    } else {
      this._hover = null;
    }
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
    return html`
      ${this.compact ? nothing : this._renderBar()}
      <div class="stage">
        ${this._narrow ? html`<div class="state" role="status"><small>${i18n.getMessage('Not enough room here. Collapse the sidebar or widen the window.')}</small></div>` : nothing}
        ${guard([this._model, this._lens, this._gap, this._focus, this._selected, this.compact], () => this._renderSvg())}
        ${this.compact ? this._renderEnter() : html`${this._renderCrumbs()}${this._selected ? this._renderDetail() : nothing}${this._renderDock()}`}
        ${this._hover ? this._renderTip() : nothing}
        <div class="vh" aria-live="polite">${this._focus ? i18n.getMessage('Exploring {0}', this._layout.titles.get(this._focus)) : nothing}</div>
      </div>
    `;
  }

  _renderSvg() {
    const L = this._layout;
    return html`<svg class="universe ${classMap({'has-focus': !!this._focus})}" role="group"
      aria-label=${i18n.getMessage('Catalog universe: {0} items in {1} groups', String(this._model.stats.items), String(L.packed.length))}
      @click=${this._onSvgClick} @keydown=${this._onSvgKey} @pointermove=${this._onMove} @pointerleave=${() => (this._hover = null)}>
      ${repeat(L.packed, c => c.id, (c, i) => this._renderCluster(c, i))}
    </svg>`;
  }

  _renderCluster(c, idx) {
    const on = this._focus === c.id;
    const interactive = !this.compact;
    const count = c.items.length;
    const dotR = on ? (c.shape === 'band' ? 4.8 : 5.4) : 4.2;
    const band = c.shape === 'band';
    const bw = on ? c.wX : c.w;
    const bh = on ? c.hX : c.h;
    const haloEl = band
      ? svg`<rect class="halo band" style="x:${c.x - bw / 2}px;y:${c.y - bh / 2}px;width:${bw}px;height:${bh}px;rx:26px" data-cluster=${c.id}
          tabindex=${interactive && !on ? 0 : -1} role=${interactive ? 'button' : 'presentation'}
          aria-label=${i18n.getMessage('Not yet in a category, {0} items. Press Enter to explore.', String(count))}></rect>`
      : svg`<circle class="halo ${this._focus ? '' : 'ambient'}" style="cx:${c.x}px;cy:${c.y}px;r:${on ? c.haloX : c.halo}px" data-cluster=${c.id}
          tabindex=${interactive && !on ? 0 : -1} role=${interactive ? 'button' : 'presentation'}
          aria-label=${i18n.getMessage('{0}, {1} items. Press Enter to explore.', c.cluster.title, String(count))}></circle>`;
    const selected = this._selected && this._layout.itemPos.get(this._selected);
    const ring = selected && selected.n.cluster === c.id
      ? svg`<circle class="ring" style="cx:${selected.xx}px;cy:${selected.yy}px;r:7.5px"></circle>` : nothing;
    return svg`<g class="cl ${on ? 'on' : ''}" style="--d:${Math.min(idx * 9, 1000)}ms">
      ${haloEl}
      ${c.items.map(it => {
        const n = it.n;
        const isSel = this._selected === n.id;
        const hollow = this._lens === 'lifecycle' && !n.active;
        const dim = (this._lens === 'demand' && !n.requests) || false;
        return svg`<circle class="dot ${classMap({hollow, dim})}"
          style="cx:${on ? it.xx : it.x}px;cy:${on ? it.yy : it.y}px;r:${isSel ? 6.8 : dotR}px;fill:${this._fill(n)};${hollow ? 'stroke:#2F6FED;' : ''}${isSel ? 'stroke:#032D42;stroke-width:2.2;' : ''}"
          data-item=${n.id} data-cluster=${c.id}
          tabindex=${interactive && on ? 0 : -1} role=${interactive && on ? 'button' : 'presentation'}
          aria-label=${interactive && on ? n.name : nothing}></circle>`;
      })}
      ${ring}
      ${c.labeled
        ? svg`<text class="lbl" data-fs=${c.fs} x=${c.x} y=${c.y + c.halo + c.fs * 1.25} font-size=${c.fs}>${trunc(c.cluster.title, 24)}</text>
          <text class="lbl sub" data-fs=${c.fs * 0.8} x=${c.x} y=${c.y + c.halo + c.fs * 2.35} font-size=${c.fs * 0.8}>${count}</text>`
        : nothing}
      ${band
        ? svg`<text class="lbl" data-fs=${c.fs} x=${c.x} y=${c.y - c.h / 2 - 14} font-size=${c.fs}>${i18n.getMessage('Not yet in a category')}</text>
          <text class="lbl sub" data-fs=${c.fs * 0.8} x=${c.x} y=${c.y - c.h / 2 + 0} font-size=${c.fs * 0.8} dy="-0.2em">${count}</text>`
        : nothing}
      ${on && count <= 30 && !band
        ? c.items.map(it => svg`<text class="ilbl" data-fs="4.4" data-cl=${c.id} x=${it.xx + (it.xx >= c.x ? 7.5 : -7.5)} y=${it.yy + 1.6}
            font-size="4.4" style="text-anchor:${it.xx >= c.x ? 'start' : 'end'}">${trunc(it.n.name, 26)}</text>`)
        : nothing}
    </g>`;
  }

  _renderEnter() {
    return html`<button class="enter chip glass" @click=${this._enter}>${i18n.getMessage('Enter the universe')} →</button>`;
  }

  _renderBar() {
    const matches = this._searchMatches();
    return html`<div class="bar">
      <div class="lenses" role="group" aria-label=${i18n.getMessage('Intelligence lenses')}>
        ${LENSES.map(l => html`<button class="lens-btn" aria-pressed=${this._lens === l.id} title=${l.hint()} @click=${() => this._setLens(l.id)}>${l.label()}</button>`)}
      </div>
      <div class="search">
        <input type="search" placeholder=${i18n.getMessage('Search the catalog…')} aria-label=${i18n.getMessage('Search catalog items')}
          .value=${this._query}
          @input=${e => { this._query = e.target.value; this._searchOpen = true; }}
          @focus=${() => { this._searchOpen = true; }}>
        ${this._searchOpen && matches.length ? html`<ul class="results glass">
          ${matches.map(n => html`<li><button class="res" @click=${() => this._select(n.id)}>${n.name}
            <small>${this._layout.titles.get(n.cluster)} · ${classLabel(n.cls)}</small></button></li>`)}
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
      <button class="chip" @click=${() => window.history.length > 1 && this._hashFocus() ? window.history.back() : this._focusCluster(null)}>← ${i18n.getMessage('All categories')}</button>
      <span class="crumb-cur" aria-current="page">${this._layout.titles.get(this._focus)}</span>
    </nav>`;
  }

  _renderTip() {
    const h = this._hover;
    return html`<div class="tip" style="left:${h.x}px;top:${h.y}px" role="presentation">${h.title}<small>${h.sub}</small></div>`;
  }

  _fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return isNaN(d) ? s : new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(d);
  }

  _catName(id) {
    return this._model.catTitle?.[id] || id;
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
      ${n.shortDescription ? html`<p>${n.shortDescription}</p>` : html`<p><em>${i18n.getMessage('No short description')}</em></p>`}
      <strong>${i18n.getMessage('Metadata completeness')} · ${Math.round(n.score * 100)}%</strong>
      <ul class="checks">${CRITERIA.map(c => html`<li><span class="mark ${n.flags[c.key] ? 'y' : 'n'}" aria-hidden="true">${n.flags[c.key] ? '✓' : '✕'}</span>
        <span>${c.label()} <span class="vh">${n.flags[c.key] ? i18n.getMessage('present') : i18n.getMessage('missing')}</span></span></li>`)}</ul>
      <dl>
        <dt>${i18n.getMessage('Categories')}</dt><dd>${n.catIds.length ? n.catIds.map(id => this._catName(id)).join(', ') : i18n.getMessage('None')}</dd>
        <dt>${i18n.getMessage('Requests')}</dt><dd>${fmt(n.requests)}</dd>
        <dt>${i18n.getMessage('Created')}</dt><dd>${this._fmtDate(n.created)}</dd>
        <dt>${i18n.getMessage('Updated')}</dt><dd>${this._fmtDate(n.updated)}</dd>
      </dl>
      <a class="open" href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a>
    </aside>`;
  }

  /* bottom dock: collapsed lens summary (left) + one verified opportunity (right) */
  _renderDock() {
    const s = this._model.stats;
    const story = this._selected ? null : this._story();
    const summary = {
      overview: () => i18n.getMessage('{0} items · {1} categories', fmt(s.items), fmt(s.populatedCategories)),
      quality: () => i18n.getMessage('{0} items fully described', fmt(s.complete)),
      lifecycle: () => i18n.getMessage('{0} active · {1} inactive', fmt(s.active), fmt(s.items - s.active)),
      demand: () => i18n.getMessage('{0} items requested', fmt(s.requestedItems)),
      csdm: () => i18n.getMessage('{0} service offerings', s.offerings == null ? '—' : fmt(s.offerings))
    }[this._lens]();
    const lens = LENSES.find(l => l.id === this._lens);
    return html`
      ${this._legendOpen ? this._renderSheet() : nothing}
      <div class="dock">
        <button class="pill glass" aria-expanded=${this._legendOpen} @click=${() => { this._legendOpen = !this._legendOpen; }}>
          <b>${lens.label()}</b> ${summary} <span class="caret" aria-hidden="true">▴</span>
        </button>
        ${story && !this._focus ? this._renderStory(story) : nothing}
      </div>`;
  }

  _renderStory(st) {
    const active = this._lens === 'quality' && this._gap === st.key;
    return html`<div class="story glass" role="note">
      <span class="spark" aria-hidden="true"></span>
      <span>${STORY[st.key](fmt(st.miss), fmt(st.total), String(st.pct))}
        ${st.worst ? html`<small>${i18n.getMessage('Most affected category: {0} ({1} of {2} items)', st.worst.title, fmt(st.worst.m), fmt(st.worst.n))}</small>` : nothing}
        <small>${i18n.getMessage('Counted directly from catalog records.')}</small></span>
      <button class="cta" @click=${() => (active ? this._setLens('overview') : ((this._lens = 'quality'), (this._gap = st.key)))}>${active ? i18n.getMessage('Clear') : i18n.getMessage('Show where')}</button>
    </div>`;
  }

  _renderSheet() {
    const s = this._model.stats;
    const total = s.items;
    let body;
    switch (this._lens) {
      case 'quality':
        body = html`<h3>${i18n.getMessage('Metadata completeness')}</h3>
          <p><span class="big">${fmt(s.complete)}</span> ${i18n.getMessage('of {0} items have all four fields. Select a field to highlight what is missing.', fmt(total))}</p>
          ${CRITERIA.map(c => html`<button class="row-btn" aria-pressed=${this._gap === c.key} @click=${() => { this._gap = this._gap === c.key ? null : c.key; }}>
            <span class="row"><span>${c.label()}</span><span>${i18n.getMessage('{0} missing', fmt(s.missing[c.key]))}</span></span>
            <div class="track"><div class="fill" style="width:${100 - (100 * s.missing[c.key]) / total}%"></div></div></button>`)}
          ${this._gap ? nothing : html`<div class="ramp" style="background:linear-gradient(90deg,#E5484D,#F2B134,#12A150)"></div>
          <div class="ramp-lbl"><span>${i18n.getMessage('0 of 4')}</span><span>${i18n.getMessage('4 of 4')}</span></div>`}`;
        break;
      case 'lifecycle':
        body = html`<h3>${i18n.getMessage('Lifecycle')}</h3>
          <p><span class="big">${fmt(s.active)}</span> ${i18n.getMessage('active · {0} inactive (hollow)', fmt(total - s.active))}</p>
          <div class="ramp" style="background:linear-gradient(90deg,#B8C7DC,#2F6FED)"></div>
          <div class="ramp-lbl"><span>${s.minYear}</span><span>${s.maxYear}</span></div>`;
        break;
      case 'demand':
        body = html`<h3>${i18n.getMessage('Demand')}</h3>
          <p><span class="big">${fmt(s.requestedItems)}</span> ${i18n.getMessage('items requested · {0} request items in total', fmt(s.requests))}</p>
          <p>${i18n.getMessage('{0}% of items have never been requested in the records available.', String(Math.round((100 * (total - s.requestedItems)) / total)))}</p>`;
        break;
      case 'csdm':
        body = html`<h3>${i18n.getMessage('CSDM alignment')}</h3>
          <p><span class="big">${s.offerings == null ? '—' : fmt(s.offerings)}</span> ${i18n.getMessage('service offerings exist on this instance')}</p>
          <p>${i18n.getMessage('Catalog items do not carry a native service offering link here, so no alignment is shown. Suggestions will come in a later milestone.')}</p>`;
        break;
      default: {
        const order = Object.entries(s.classes).sort((a, b) => b[1] - a[1]);
        body = html`<h3>${i18n.getMessage('Item types')}</h3>
          <p><span class="big">${fmt(total)}</span> ${i18n.getMessage('items in {0} categories', fmt(s.populatedCategories))}${s.uncategorised ? i18n.getMessage(' · {0} not yet in a category', fmt(s.uncategorised)) : nothing}</p>
          <div class="legend">${order.slice(0, 8).map(([c, n], i) => html`<span><i class="sw" style="background:${CLASS_COLORS[Math.min(i, CLASS_COLORS.length - 1)]}"></i>${classLabel(c)} ${fmt(n)}</span>`)}</div>`;
      }
    }
    return html`<section class="sheet glass" aria-label=${i18n.getMessage('Lens details')}>${body}</section>`;
  }
}
