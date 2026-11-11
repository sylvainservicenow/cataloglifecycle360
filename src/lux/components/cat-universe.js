import {html, css, svg, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {guard} from 'lit/directives/guard.js';
import {repeat} from 'lit/directives/repeat.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {CRITERIA, classLabel, loadCatalog, packCircles, packGrid, packItems, scopeStats} from '../lib/catalog-data.js';

/* Categorical palette for item types: deliberately contains no red or green, which are reserved for status. */
const CLASS_COLORS = ['#2F6FED', '#0E9F8E', '#F2994A', '#8B5CF6', '#0891B2', '#D6409F', '#64748B', '#B7791F', '#4F46E5', '#84A98C', '#7C8DA6', '#A3A3A3'];
/* Completeness: number of the four fields present, 0 → 4. Red is only for the genuinely empty. */
const FIELD_COLORS = ['#E5484D', '#F2812F', '#F2B134', '#0E9F8E', '#12A150'];
const REQUESTED = '#2F6FED';
const NO_REQUESTS = '#C3CEDC';
const INACTIVE_STROKE = '#64748B';
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
const trunc = (s, max) => (s.length > max ? s.slice(0, Math.max(1, max - 1)).trimEnd() + '…' : s);
const fmt = n => new Intl.NumberFormat().format(n);

@customElement('cat-universe')
export default class CatUniverse extends AIUXElement {
  static properties = {
    compact: {type: Boolean},
    /* Investigation mode: the host page supplies what is highlighted, so lenses, stats and the built-in detail panel are hidden. */
    investigate: {type: Boolean},
    markers: {attribute: false}, // {sys_id: colour} for items to highlight; every other item is de-emphasised
    legendItems: {attribute: false}, // [{color, label}] describing the markers
    focusId: {attribute: 'focus-id'}, // category (cluster) id to focus
    selectedId: {attribute: 'selected-id'}, // item sys_id to select
    lens: {type: String}, // lens to open with (e.g. 'quality'), set by the host page
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
      cursor: grab;
    }
    svg.universe.panning {
      cursor: grabbing;
    }
    svg.universe.panning * {
      cursor: grabbing;
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
      opacity: 0.55;
    }
    .dot:focus-visible {
      stroke: #032d42;
      stroke-width: 2.4;
      outline: none;
    }
    .match {
      fill: none;
      stroke: #7c3aed;
      stroke-width: 1.6;
      stroke-dasharray: 2.4 2;
      pointer-events: none;
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
      .bloom {
        animation: bloom 2.2s ease-out 3 both;
      }
      @keyframes bloom {
        from {
          transform: scale(0.8);
          opacity: 1;
        }
        to {
          transform: scale(3);
          opacity: 0;
        }
      }
      .gain {
        animation: gain-in 0.7s ease both;
      }
      @keyframes gain-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
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
      /* room for the 3px + 2px focus outlines so none is clipped by an ancestor */
      padding: 6px 7px 12px;
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
    .zbtn:focus-visible,
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
    /* inset ring: cannot be clipped by any ancestor, still a >=3:1 visible indicator */
    .search input:focus,
    .search input:focus-visible {
      outline: 2px solid #2f6fed;
      outline-offset: -2px;
      border-color: #2f6fed;
      box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.18);
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
    .dock > *,
    .dock-l > * {
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
    .dock-l {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
    }
    .sheet {
      position: absolute;
      left: 0;
      bottom: calc(100% + 6px);
      width: min(360px, calc(100vw - 48px));
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
      gap: 3px 12px;
      margin: 0;
      padding: 0.4rem 0.8rem;
      list-style: none;
      font-size: 0.75rem;
      color: #3b3a38;
      max-width: min(560px, 100%);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .legend .note {
      color: #656462;
    }
    .sw.grad {
      width: 44px;
      border-radius: 99px;
    }
    .sw.hollow {
      background: #fff;
      border: 2px solid #64748b;
      box-sizing: border-box;
    }
    .sw.match {
      background: #fff;
      border: 2px dashed #7c3aed;
      box-sizing: border-box;
    }
    .sw.sel {
      background: #fff;
      border: 2px solid #032d42;
      box-sizing: border-box;
    }
    .pct {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .scope-note {
      margin: 6px 0 0;
      font-size: 0.75rem;
      color: #656462;
    }

    /* ---------- zoom and pan controls ---------- */
    .zoom {
      position: absolute;
      top: 12px;
      right: 12px;
      display: grid;
      grid-template-columns: repeat(3, 32px);
      grid-auto-rows: 32px;
      gap: 2px;
      padding: 4px;
      z-index: 2;
      transition: right 0.35s ease;
    }
    .zoom.shift {
      right: calc(min(340px, 100% - 24px) + 24px);
    }
    /* investigation mode: the host owns the right edge (inspector), so the pad sits under the breadcrumb */
    :host([investigate]) .zoom {
      right: auto;
      left: 12px;
      top: 64px;
    }
    :host([investigate]:not([selected-id=''])) .crumbs {
      max-width: calc(100% - 392px);
    }
    .zbtn {
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      color: #032d42;
      font: inherit;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
    }
    .zbtn:hover {
      background: rgba(47, 111, 237, 0.1);
    }
    .zbtn:disabled {
      opacity: 0.35;
      cursor: default;
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
      flex-wrap: wrap;
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
    .cta.alt {
      background: #fff;
      color: #032d42;
      border: 1px solid rgba(3, 45, 66, 0.25);
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
      background: #eef1f5;
      color: #4d5b6b;
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
      .zoom.shift {
        right: 12px;
      }
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
    this.investigate = false;
    this.markers = null;
    this.legendItems = null;
    this.focusId = null;
    this.selectedId = null;
    this.lens = '';
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
    this._drag = null;
    this._justDragged = false;
    this._scopeCache = new Map();
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
    this._onWheel = e => this._wheel(e);
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

  updated(changed) {
    this._applyCam();
    if (changed.has('_focus') && changed.get('_focus') !== undefined) this._emit('cat-universe:focus', {id: this._focus});
    if (changed.has('_selected') && changed.get('_selected') !== undefined) this._emit('cat-universe:select', {id: this._selected});
    if (changed.has('lens') && this.lens && LENSES.some(l => l.id === this.lens)) this._setLens(this.lens);
    if (changed.has('focusId') || changed.has('selectedId')) this._syncExternal();
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {detail, bubbles: true, composed: true}));
  }

  /** Apply focus / selection set by the host page, once the layout exists. */
  _syncExternal() {
    if (!this._layout) return;
    const want = this.focusId || null;
    if (want !== this._focus && (!want || this._layout.byId.has(want))) this._focusCluster(want, !!this.selectedId, true);
    const sel = this.selectedId || null;
    if (sel !== this._selected) {
      if (sel && !this._layout.itemPos.has(sel)) return;
      if (sel) this._select(sel, true);
      else this._selected = null;
    }
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
      else this._flyTo(fit, this.investigate ? 900 : 1700);
      this._syncExternal();
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
    if (isServer || this.investigate) return null;
    const m = /cluster=([0-9a-f]{32}|__none__)/.exec(window.location.hash);
    return m ? m[1] : null;
  }

  _focusCluster(id, keepSelection = false, fromHistory = false) {
    if (!fromHistory && !this.compact && !this.investigate && id !== this._focus) {
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
    if (this._focus !== pos.n.cluster) this._focusCluster(pos.n.cluster, true, this.investigate);
    this._selected = id;
    this._searchOpen = false;
    this._legendOpen = false;
  }

  /* ---------- lens ---------- */
  _fill(n) {
    if (this.markers) return this.markers[n.id] ?? SOFT;
    switch (this._lens) {
      case 'quality':
        if (this._gap) return n.flags[this._gap] ? SOFT : AMBER;
        return FIELD_COLORS[n.fields];
      case 'lifecycle': {
        const {minYear, maxYear} = this._model.stats;
        const t = maxYear > minYear ? (Number(n.created.slice(0, 4)) - minYear) / (maxYear - minYear) : 1;
        return n.active ? mix('#B8C7DC', '#2F6FED', t) : '#ffffff';
      }
      case 'demand':
        return n.requests ? REQUESTED : NO_REQUESTS;
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
    const s = this._scope().stats;
    const total = s.items;
    const top = CRITERIA.map(c => ({key: c.key, miss: s.missing[c.key]})).sort((a, b) => b.miss - a.miss)[0];
    if (!top || !top.miss) return null;
    let worst = null;
    for (const c of this._focus ? [] : this._layout.packed) {
      if (c.cluster.uncategorised) continue;
      const m = c.cluster.items.filter(n => !n.flags[top.key]).length;
      if (m > (worst?.m ?? 0)) worst = {title: c.cluster.title, m, n: c.cluster.items.length};
    }
    return {key: top.key, miss: top.miss, pct: Math.round((100 * top.miss) / total), total, worst};
  }

  /**
   * Items and metrics for what is on screen: the focused category's own dots,
   * or the whole catalog. Items that belong to several categories are drawn
   * (and counted) once, in their primary category; `alsoIn` reports the others.
   */
  _scope() {
    const key = this._focus || '*';
    let v = this._scopeCache.get(key);
    if (!v) {
      const c = this._focus ? this._layout.byId.get(this._focus) : null;
      const nodes = c ? c.cluster.items : this._model.nodes;
      v = {
        nodes,
        stats: scopeStats(nodes),
        title: c ? c.cluster.title : null,
        alsoIn: c && !c.cluster.uncategorised ? this._model.nodes.filter(n => n.cluster !== key && n.catIds.includes(key)).length : 0
      };
      this._scopeCache.set(key, v);
    }
    return v;
  }

  /* ---------- camera: wheel, drag, buttons, keys ---------- */
  _clampCam(cam) {
    const {minX, maxX, minY, maxY} = this._layout.bounds;
    const mx = (maxX - minX) * 0.15;
    const my = (maxY - minY) * 0.15;
    return {
      x: Math.min(maxX + mx, Math.max(minX - mx, cam.x)),
      y: Math.min(maxY + my, Math.max(minY - my, cam.y)),
      w: Math.min(this._fitAll().w * 1.6, Math.max(40, cam.w))
    };
  }

  _wheel(e) {
    if (this.compact || !this._layout) return;
    e.preventDefault();
    cancelAnimationFrame(this._anim);
    const {w: W, h: H} = this._stageSize();
    const r = this.renderRoot.querySelector('.stage').getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const unit = e.deltaMode === 1 ? 0.05 : 0.0015;
    const cam = this._cam;
    const w2 = Math.min(this._fitAll().w * 1.6, Math.max(40, cam.w * Math.exp(e.deltaY * unit * (e.ctrlKey ? 3 : 1))));
    const ch = (cam.w * H) / W;
    const wx = cam.x - cam.w / 2 + (px / W) * cam.w;
    const wy = cam.y - ch / 2 + (py / H) * ch;
    const ch2 = (w2 * H) / W;
    this._cam = this._clampCam({x: wx - (px / W - 0.5) * w2, y: wy - (py / H - 0.5) * ch2, w: w2});
    this._hover = null;
    this._applyCam();
  }

  _onDown(e) {
    if (this.compact || e.button !== 0 || !e.isPrimary) return;
    this._drag = {id: e.pointerId, x: e.clientX, y: e.clientY, cam: {...this._cam}, moved: false};
  }

  _dragMove(e) {
    const d = this._drag;
    if (!d || d.id !== e.pointerId) return false;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return false; // below the threshold it is still a click
      d.moved = true;
      cancelAnimationFrame(this._anim);
      const svgEl = this.renderRoot.querySelector('svg.universe');
      try {
        svgEl.setPointerCapture(e.pointerId);
      } catch {
        /* capture is an optimisation; panning still works without it */
      }
      svgEl.classList.add('panning');
      this._hover = null;
    }
    const k = d.cam.w / this._stageSize().w;
    this._cam = this._clampCam({x: d.cam.x - dx * k, y: d.cam.y - dy * k, w: d.cam.w});
    this._applyCam();
    return true;
  }

  _onUp(e) {
    const d = this._drag;
    if (!d || d.id !== e.pointerId) return;
    this._drag = null;
    this.renderRoot.querySelector('svg.universe')?.classList.remove('panning');
    if (d.moved) {
      // the click that follows a drag must not select anything
      this._justDragged = true;
      setTimeout(() => (this._justDragged = false), 0);
    }
  }

  _zoomBy(factor) {
    const c = this._cam;
    this._flyTo(this._clampCam({...c, w: c.w * factor}), 240);
  }

  _panBy(fx, fy) {
    const {w, h} = this._stageSize();
    const c = this._cam;
    this._flyTo(this._clampCam({x: c.x + fx * c.w, y: c.y + (fy * c.w * h) / w, w: c.w}), 240);
  }

  _resetView() {
    if (this._focus) this._focusCluster(this._focus, true);
    else this._flyTo(this._fitAll(), 900);
  }

  /* ---------- events ---------- */
  _onSvgClick(e) {
    if (this._justDragged) return;
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
    const k = {'+': () => this._zoomBy(0.7), '=': () => this._zoomBy(0.7), '-': () => this._zoomBy(1.4), _: () => this._zoomBy(1.4), 0: () => this._resetView(),
      ArrowLeft: () => this._panBy(-0.18, 0), ArrowRight: () => this._panBy(0.18, 0), ArrowUp: () => this._panBy(0, -0.18), ArrowDown: () => this._panBy(0, 0.18)}[e.key];
    if (k && !this.compact && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      return k();
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('[data-item],[data-cluster]');
    if (!t) return;
    e.preventDefault();
    this._onSvgClick(e);
  }

  _onMove(e) {
    if (this.compact || this._dragMove(e) || this._drag?.moved) return;
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

  /** Ask the host page to open an investigation for what is on screen (category and/or item). */
  _investigate(discovery, itemId = null) {
    this._emit('cat-universe:investigate', {discovery, categoryId: this._focus && this._focus !== '__none__' ? this._focus : null, itemId});
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
      ${this.compact || this.investigate ? nothing : this._renderBar()}
      <div class="stage">
        ${this._narrow ? html`<div class="state" role="status"><small>${i18n.getMessage('Not enough room here. Collapse the sidebar or widen the window.')}</small></div>` : nothing}
        ${guard([this._model, this._lens, this._gap, this._focus, this._selected, this.compact, this._matchKey(), this.markers], () => this._renderSvg())}
        ${this.compact ? this._renderEnter() : html`${this._renderCrumbs()}${this._renderZoom()}${this._selected && !this.investigate ? this._renderDetail() : nothing}${this._renderDock()}`}
        ${this._hover ? this._renderTip() : nothing}
        <div class="vh" aria-live="polite">${this._focus ? i18n.getMessage('Exploring {0}', this._layout.titles.get(this._focus)) : nothing}</div>
      </div>
    `;
  }

  _matchKey() {
    return this._searchOpen ? this._query.trim().toLowerCase() : '';
  }

  _renderZoom() {
    const b = (label, glyph, fn) => html`<button class="zbtn" aria-label=${label} title=${label} @click=${fn}>${glyph}</button>`;
    return html`<div class="zoom glass ${classMap({shift: !!this._selected && !this.investigate})}" role="group" aria-label=${i18n.getMessage('Zoom and pan')}>
      ${b(i18n.getMessage('Zoom in'), '+', () => this._zoomBy(0.6))}
      ${b(i18n.getMessage('Pan up'), '↑', () => this._panBy(0, -0.2))}
      ${b(i18n.getMessage('Zoom out'), '−', () => this._zoomBy(1.6))}
      ${b(i18n.getMessage('Pan left'), '←', () => this._panBy(-0.2, 0))}
      ${b(i18n.getMessage('Reset view'), '⌂', this._resetView.bind(this))}
      ${b(i18n.getMessage('Pan right'), '→', () => this._panBy(0.2, 0))}
      <span></span>${b(i18n.getMessage('Pan down'), '↓', () => this._panBy(0, 0.2))}<span></span>
    </div>`;
  }

  _renderSvg() {
    const L = this._layout;
    const mk = this._matchKey();
    const matchIds = new Set(mk.length >= 2 ? this._model.nodes.filter(n => n.name.toLowerCase().includes(mk)).slice(0, 8).map(n => n.id) : []);
    return html`<svg class="universe ${classMap({'has-focus': !!this._focus})}" role="group"
      aria-label=${i18n.getMessage('Catalog universe: {0} items in {1} groups', String(this._model.stats.items), String(L.packed.length))}
      @click=${this._onSvgClick} @keydown=${this._onSvgKey} @pointerdown=${this._onDown} @pointermove=${this._onMove}
      @pointerup=${this._onUp} @pointercancel=${this._onUp} @wheel=${this._onWheel} @pointerleave=${() => (this._hover = null)}>
      ${repeat(L.packed, c => c.id, (c, i) => this._renderCluster(c, i, matchIds))}
    </svg>`;
  }

  _renderCluster(c, idx, matchIds) {
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
        const dim = this.markers ? !this.markers[n.id] : this._lens === 'demand' && !n.requests;
        return svg`<circle class="dot ${classMap({hollow, dim})}"
          style="cx:${on ? it.xx : it.x}px;cy:${on ? it.yy : it.y}px;r:${isSel ? 6.8 : dotR}px;fill:${this._fill(n)};${hollow ? `stroke:${INACTIVE_STROKE};` : ''}${isSel ? 'stroke:#032D42;stroke-width:2.2;' : ''}"
          data-item=${n.id} data-cluster=${c.id}
          tabindex=${interactive && on ? 0 : -1} role=${interactive && on ? 'button' : 'presentation'}
          aria-label=${interactive && on ? n.name : nothing}></circle>`;
      })}
      ${c.items.filter(it => it.n.improved && !this.investigate).map(it => svg`<circle class="bloom" style="cx:${on ? it.xx : it.x}px;cy:${on ? it.yy : it.y}px;r:${dotR + 2.5}px"></circle>`)}
      ${c.items.filter(it => matchIds.has(it.n.id)).map(it => svg`<circle class="match" style="cx:${on ? it.xx : it.x}px;cy:${on ? it.yy : it.y}px;r:${dotR + 3}px"></circle>`)}
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
      <strong class="pct"><i class="sw" style="background:${FIELD_COLORS[n.fields]}"></i>${i18n.getMessage('Metadata completeness')} · ${n.fields * 25}%</strong>
      ${n.improved ? html`<p class="gain" role="status">✓ ${i18n.getMessage('Improved by an approved update: {0}% → {1}%.', String(n.improved.from * 25), String(n.improved.to * 25))} ${n.improved.gained.map(k => CRITERIA.find(c => c.key === k)?.label()).filter(Boolean).join(', ')}</p>` : nothing}
      <ul class="checks">${CRITERIA.map(c => html`<li><span class="mark ${n.flags[c.key] ? 'y' : 'n'}" aria-hidden="true">${n.flags[c.key] ? '✓' : '✕'}</span>
        <span>${c.label()} <span class="vh">${n.flags[c.key] ? i18n.getMessage('present') : i18n.getMessage('missing')}</span></span></li>`)}</ul>
      <dl>
        <dt>${i18n.getMessage('Categories')}</dt><dd>${n.catIds.length ? n.catIds.map(id => this._catName(id)).join(', ') : i18n.getMessage('None')}</dd>
        <dt>${i18n.getMessage('Requests')}</dt><dd>${fmt(n.requests)}</dd>
        <dt>${i18n.getMessage('Created')}</dt><dd>${this._fmtDate(n.created)}</dd>
        <dt>${i18n.getMessage('Updated')}</dt><dd>${this._fmtDate(n.updated)}</dd>
      </dl>
      <div class="tags">
        <button class="chip" @click=${() => this._investigate('ai-readiness', n.id)}>${i18n.getMessage('Metadata')}</button>
        <button class="chip" @click=${() => this._investigate('form-intelligence', n.id)}>${i18n.getMessage('Form')}</button>
        <button class="chip" @click=${() => this._investigate('overlap', n.id)}>${i18n.getMessage('Similar items')}</button>
        <button class="chip" @click=${() => this._investigate('taxonomy', n.id)}>${i18n.getMessage('Category')}</button>
        <button class="chip" @click=${() => this._investigate('csdm-alignment', n.id)}>${i18n.getMessage('Service')}</button>
      </div>
      <a class="open" href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a>
    </aside>`;
  }

  /* bottom dock: legend + collapsed lens summary (left), one verified opportunity (right) */
  _renderDock() {
    if (this.investigate) return html`<div class="dock"><div class="dock-l">${this._renderLegend(null)}</div></div>`;
    const sc = this._scope();
    const s = sc.stats;
    const g = this._model.stats;
    const story = this._selected ? null : this._story();
    const summary = {
      overview: () => (sc.title ? i18n.getMessage('{0} items in this category', fmt(s.items)) : i18n.getMessage('{0} items · {1} categories', fmt(s.items), fmt(g.populatedCategories))),
      quality: () => i18n.getMessage('{0} of {1} items fully described', fmt(s.complete), fmt(s.items)),
      lifecycle: () => i18n.getMessage('{0} active · {1} inactive', fmt(s.active), fmt(s.inactive)),
      demand: () => i18n.getMessage('{0} of {1} items requested', fmt(s.requestedItems), fmt(s.items)),
      csdm: () => i18n.getMessage('{0} service offerings on the instance', g.offerings == null ? '—' : fmt(g.offerings))
    }[this._lens]();
    const lens = LENSES.find(l => l.id === this._lens);
    return html`
      <div class="dock">
        <div class="dock-l">
          ${this._legendOpen ? this._renderSheet(sc) : nothing}
          ${this._renderLegend(sc)}
          <button class="pill glass" aria-expanded=${this._legendOpen} @click=${() => { this._legendOpen = !this._legendOpen; }}>
            <b>${lens.label()}</b>${sc.title ? html`<span class="vh">${sc.title}</span>` : nothing} ${summary} <span class="caret" aria-hidden="true">▴</span>
          </button>
        </div>
        ${story ? this._renderStory(story) : nothing}
      </div>`;
  }

  /** Compact key for the active lens, counted over the same items the dock summarises. */
  _renderLegend(sc) {
    if (this.investigate) {
      return html`<ul class="legend glass" aria-label=${i18n.getMessage('Legend')}>
        ${(this.legendItems || []).map(l => html`<li><i class="sw" style="background:${l.color}"></i>${l.label}</li>`)}
        ${this._selected ? html`<li><i class="sw sel"></i>${i18n.getMessage('Selected')}</li>` : nothing}
      </ul>`;
    }
    const s = sc.stats;
    const g = this._model.stats;
    const sw = (color, text, cls = '') => html`<li><i class="sw ${cls}" style="background:${color}"></i>${text}</li>`;
    let items;
    switch (this._lens) {
      case 'quality':
        if (this._gap) {
          const label = CRITERIA.find(c => c.key === this._gap).label();
          items = [sw(AMBER, i18n.getMessage('Missing {0} · {1}', label.toLowerCase(), fmt(s.missing[this._gap]))), sw(SOFT, i18n.getMessage('Present · {0}', fmt(s.items - s.missing[this._gap])))];
        } else {
          items = FIELD_COLORS.map((c, i) => sw(c, i18n.getMessage('{0}% complete · {1}', String(i * 25), fmt(s.byFields[i]))));
        }
        break;
      case 'lifecycle':
        items = [
          html`<li><i class="sw grad" style="background:linear-gradient(90deg,#B8C7DC,#2F6FED)"></i>${i18n.getMessage('Active, by year created {0}–{1}', String(g.minYear), String(g.maxYear))}</li>`,
          html`<li><i class="sw hollow"></i>${i18n.getMessage('Inactive · {0}', fmt(s.inactive))}</li>`
        ];
        break;
      case 'demand':
        items = [sw(REQUESTED, i18n.getMessage('Requested · {0}', fmt(s.requestedItems))), sw(NO_REQUESTS, i18n.getMessage('No requests observed · {0}', fmt(s.items - s.requestedItems))),
          html`<li class="note">${i18n.getMessage('Not an error: many items are simply not in demand')}</li>`];
        break;
      case 'csdm':
        items = [sw('#B8C7DC', i18n.getMessage('Catalog item')), html`<li class="note">${i18n.getMessage('Offerings are not linked to items natively, so nothing is marked as missing')}</li>`];
        break;
      default: {
        const types = Object.entries(s.classes).sort((a, b) => b[1] - a[1]);
        items = types.map(([c, n]) => sw(CLASS_COLORS[this._classIndex(c)], `${classLabel(c)} · ${fmt(n)}`));
      }
    }
    return html`<ul class="legend glass" aria-label=${i18n.getMessage('Legend')}>
      ${items}
      ${this._selected ? html`<li><i class="sw sel"></i>${i18n.getMessage('Selected')}</li>` : nothing}
      ${this._matchKey().length >= 2 ? html`<li><i class="sw match"></i>${i18n.getMessage('Search match')}</li>` : nothing}
    </ul>`;
  }

  _renderStory(st) {
    const active = this._lens === 'quality' && this._gap === st.key;
    return html`<div class="story glass" role="note">
      <span class="spark" aria-hidden="true"></span>
      <span>${STORY[st.key](fmt(st.miss), fmt(st.total), String(st.pct))}
        ${st.worst ? html`<small>${i18n.getMessage('Most affected category: {0} ({1} of {2} items)', st.worst.title, fmt(st.worst.m), fmt(st.worst.n))}</small>` : nothing}
        <small>${i18n.getMessage('Counted directly from catalog records.')}</small></span>
      <button class="cta" @click=${() => (active ? this._setLens('overview') : ((this._lens = 'quality'), (this._gap = st.key)))}>${active ? i18n.getMessage('Clear') : i18n.getMessage('Show where')}</button>
      ${st.key !== 'icon' ? html`<button class="cta alt" @click=${() => this._investigate(st.key === 'category' ? 'taxonomy' : 'ai-readiness')}>${i18n.getMessage('Investigate')}</button>` : nothing}
    </div>`;
  }

  _renderSheet(sc) {
    const s = sc.stats;
    const g = this._model.stats;
    const total = s.items;
    const scopeLine = sc.title ? html`<p class="scope-note">${i18n.getMessage('Showing {0} only.', sc.title)}
      ${sc.alsoIn ? i18n.getMessage('{0} items that also belong to it are drawn and counted in their primary category.', fmt(sc.alsoIn)) : nothing}</p>`
      : html`<p class="scope-note">${i18n.getMessage('Showing all categories.')}</p>`;
    let body;
    switch (this._lens) {
      case 'quality':
        body = html`<h3>${i18n.getMessage('Metadata completeness')}</h3>
          <p><span class="big">${fmt(s.complete)}</span> ${i18n.getMessage('of {0} items are 100% complete (all four fields). Select a field to highlight what is missing.', fmt(total))}</p>
          ${CRITERIA.map(c => html`<button class="row-btn" aria-pressed=${this._gap === c.key} @click=${() => { this._gap = this._gap === c.key ? null : c.key; }}>
            <span class="row"><span>${c.label()}</span><span>${i18n.getMessage('{0} missing', fmt(s.missing[c.key]))}</span></span>
            <div class="track"><div class="fill" style="width:${100 - (100 * s.missing[c.key]) / total}%"></div></div></button>`)}`;
        break;
      case 'lifecycle':
        body = html`<h3>${i18n.getMessage('Lifecycle')}</h3>
          <p><span class="big">${fmt(s.active)}</span> ${i18n.getMessage('active · {0} inactive (hollow)', fmt(s.inactive))}</p>`;
        break;
      case 'demand':
        body = html`<h3>${i18n.getMessage('Demand')}</h3>
          <p><span class="big">${fmt(s.requestedItems)}</span> ${i18n.getMessage('items requested · {0} request items in total', fmt(s.requests))}</p>
          <p>${i18n.getMessage('{0} of {1} items have no requests in the records available. That describes demand, not a defect.', fmt(total - s.requestedItems), fmt(total))}</p>`;
        break;
      case 'csdm':
        body = html`<h3>${i18n.getMessage('CSDM alignment')}</h3>
          <p><span class="big">${g.offerings == null ? '—' : fmt(g.offerings)}</span> ${i18n.getMessage('service offerings exist on this instance (instance-wide, not per category)')}</p>
          <p>${i18n.getMessage('Verified item-to-offering links: 0. Catalog items carry no native service offering reference here, so no item is marked as unaligned. Candidate matches will be proposed for review in a later milestone.')}</p>`;
        break;
      default: {
        const order = Object.entries(s.classes).sort((a, b) => b[1] - a[1]);
        body = html`<h3>${i18n.getMessage('Item types')}</h3>
          <p><span class="big">${fmt(total)}</span> ${sc.title ? i18n.getMessage('items in this category') : i18n.getMessage('items in {0} categories', fmt(g.populatedCategories))}${!sc.title && s.uncategorised ? i18n.getMessage(' · {0} not yet in a category', fmt(s.uncategorised)) : nothing}</p>
          <p>${i18n.getMessage('Item types in scope: {0}', fmt(order.length))}</p>`;
      }
    }
    return html`<section class="sheet glass" aria-label=${i18n.getMessage('Lens details')}>${body}${scopeLine}</section>`;
  }
}
