import {html, css, nothing, isServer} from 'lit';
import {withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {keyed} from 'lit/directives/keyed.js';
import {applyPersisted, CRITERIA, classLabel, clearItemVariables, loadCatalog, loadItemVariables, loadTextFacts, loadVariableStats} from '../lib/catalog-data.js';
import {classBreakdown, distribution, nodeIndex, scopedIds} from '../lib/discovery.js';
import {assessVariables, buildAiReadiness, DIMENSIONS, failedCount} from '../lib/investigations/ai-readiness.js';
import {buildFormIntelligence, isInput, loadAllVariables, loadChoices, patchVariables, resetVariables} from '../lib/investigations/form-intelligence.js';
import {buildOverlap, KIND as OVERLAP_KIND} from '../lib/investigations/overlap.js';
import {buildTaxonomy, categoryCandidates, ISSUE as TAXONOMY_ISSUE} from '../lib/investigations/taxonomy.js';
import {buildCsdm, loadServiceData, offeringCandidates, offeringFallback, resetServiceData} from '../lib/investigations/csdm.js';
import {OTTO_TOOLS, ottoContext} from '../lib/otto.js';
import {setAppState, HIGHLIGHT_INVESTIGATION, HIGHLIGHT_LENS, POPULATIONS} from '../lib/app-state.js';
import './cat-universe.js';
import '../widgets/semantic-assess/index.js';
import '../widgets/catalog-transform/index.js';
import '../widgets/cat-workbench/index.js';
import './cat-toolbar.js';
import {buildOpportunities} from '../lib/opportunities.js';
import {icon} from '../lib/icons.js';
import './cat-inspector.js';

const ACCENT = '#F2812F';
const SOFT = '#D5DEEA';
const NEUTRAL = '#B8C7DC';
const fmt = n => new Intl.NumberFormat().format(n);
const TABS = ['criteria', 'evidence', 'records', 'steps'];
const INVESTIGATIONS = ['ai-readiness', 'form-intelligence', 'overlap', 'taxonomy', 'csdm-alignment'];
const LABEL = {
  'ai-readiness': () => i18n.getMessage('Metadata'),
  'form-intelligence': () => i18n.getMessage('Forms'),
  overlap: () => i18n.getMessage('Overlap'),
  taxonomy: () => i18n.getMessage('Categories'),
  'csdm-alignment': () => i18n.getMessage('Services')
};
const EYEBROW = {
  'ai-readiness': () => i18n.getMessage('Investigation · Metadata and AI readiness'),
  'form-intelligence': () => i18n.getMessage('Investigation · Form intelligence'),
  overlap: () => i18n.getMessage('Investigation · Duplicates and overlap'),
  taxonomy: () => i18n.getMessage('Investigation · Taxonomy and discoverability'),
  'csdm-alignment': () => i18n.getMessage('Investigation · Service alignment')
};
const KIND_COLOR = {exact: '#E5484D', near: '#F2812F', related: '#F2B134'};
const ACTION_D = {improve: 'ai-readiness', form: 'form-intelligence', category: 'taxonomy', service: 'csdm-alignment', compare: 'overlap'};
const WB_MODE = {'form-intelligence': 'form', overlap: 'overlap', taxonomy: 'category', 'csdm-alignment': 'service'};

/** The shared Explore workspace as a mixin: each route page extends it directly, so the build recognises it as a page. */
export const withWorkspace = Base => class Workspace extends withWidgetContext(Base) {
  static aiContext = {
    description: 'An investigation workspace showing catalog items affected by one investigation (metadata and AI readiness, form intelligence, duplicate and overlap, taxonomy, service alignment) in the catalog universe',
    bestFor: 'When the user wants to investigate catalog quality, find confusing forms, potential duplicates, poorly categorised items or service alignment, or prepare an improvement'
  };

  /* Conversational tools. The five core tools are shared with Overview and Explore (lib/otto.js) so Otto finds the same tools on every page; the ones below only move this page's view. Generating a proposal needs a click and nothing is saved without the person's confirmation. */
  static client_tools = {
    ...OTTO_TOOLS,
    focus_category: {
      description: 'Focus a catalog category in the current investigation by its title, or clear the focus when no name is given',
      arguments: [{name: 'name', description: 'Category title, partial matches allowed', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        return this._tool(() => {
          if (!name) return this._setCat(null);
          const c = this._findCategory(name);
          if (!c) throw new Error(`No category matches "${name}"`);
          this._setCat(c.id);
        });
      }
    },
    select_item: {
      description: 'Select a catalog item in the current investigation, by sys_id (preferred) or by name',
      arguments: [
        {name: 'item_id', description: 'sys_id of the catalog item', type: 'string', required: false},
        {name: 'item_name', description: 'Item name, only if the sys_id is unknown', type: 'string', required: false}
      ],
      definition: async function (args = {}) {
        return this._tool(() => {
          const n = args.item_id ? nodeIndex(this._model).get(args.item_id) : this._byName(args.item_name || '');
          if (!n) throw new Error('No such catalog item');
          this._setItem(n.id);
          return {selectedItem: {item_id: n.id, name: n.name}};
        });
      }
    },
    explain_discovery: {
      description: 'Open the explanation of the current investigation and return its summary, method and evidence',
      arguments: [],
      definition: async function () {
        return this._tool(() => {
          this._drawer = true;
          this._tab = 'criteria';
          const d = this._current();
          if (!d) throw new Error('The investigation is still loading');
          return {title: d.title, summary: d.summary, classification: d.method.classification, severity: d.severity, scopeCount: this._scopeIds().length, version: d.version};
        });
      }
    },
    prepare_action: {
      description: 'Open the review workspace of the current investigation for the selected item (improve a form, compare overlapping items, recommend a category, check service alignment or prepare wording). It only prepares proposals; saving needs the person to confirm.',
      arguments: [],
      definition: async function () {
        return this._tool(() => {
          if (!this._item) throw new Error('No item is selected. Ask the person to select an item first.');
          if (!this._active) throw new Error('No assessment is chosen. Use recommend_category, check_service_alignment, prepare_improvements, find_confusing_forms or show_duplicate_items.');
          this._openPrepare();
        });
      }
    }
  };

  static properties = {
    _model: {state: true},
    _error: {state: true},
    _readiness: {state: true},
    _readinessError: {state: true},
    _active: {state: true},
    _cat: {state: true},
    _impact: {state: true},
    _disc: {state: true},
    _discError: {state: true},
    _wb: {state: true},
    _transformFor: {state: true},
    _choices: {state: true},
    _uniKey: {state: true},
    _leftOpen: {state: true},
    _inspOpen: {state: true},
    _item: {state: true},
    _cls: {state: true},
    _drawer: {state: true},
    _tab: {state: true},
    _prepare: {state: true},
    _picked: {state: true},
    _caps: {state: true},
    _vars: {state: true},
    _allCats: {state: true},
    _proposal: {state: true},
    _hl: {state: true},
    _group: {state: true},
    _opp: {state: true},
    _lensNow: {state: true},
    _query: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      container-type: inline-size;
    }
    .page {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* three zones: intelligence (left), universe (centre), selected item (right) */
    .wrap {
      --l: minmax(300px, 34%);
      --r: minmax(250px, 300px);
      display: grid;
      grid-template-columns: var(--l) minmax(0, 1fr) var(--r);
      gap: 12px;
      height: calc(100dvh - 228px);
      min-height: 540px;
      position: relative;
    }
    .wrap.noinsp {
      grid-template-columns: var(--l) minmax(0, 1fr);
    }
    .wrap.work {
      --l: minmax(380px, 50%);
    }
    .wrap.lclosed {
      --l: 46px;
    }
    @container (max-width: 1040px) {
      .wrap {
        --l: minmax(280px, 40%);
        grid-template-columns: var(--l) minmax(0, 1fr);
      }
      .wrap.work {
        --l: minmax(340px, 58%);
      }
      .wrap.lclosed {
        --l: 46px;
      }
      /* with less room the inspector floats over the universe instead of taking a column */
      .insp {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(320px, 70%);
        z-index: 5;
      }
    }
    @container (max-width: 720px) {
      .wrap,
      .wrap.noinsp,
      .wrap.work,
      .wrap.lclosed {
        grid-template-columns: minmax(0, 1fr);
        height: auto;
      }
      .stagebox {
        height: 62vh;
        min-height: 400px;
      }
      .insp {
        position: static;
        width: auto;
        height: auto;
        max-height: 70vh;
      }
    }
    .focus {
      position: relative;
    }
    .rail {
      align-self: flex-end;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
    }
    .rail:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .focus[data-collapsed] {
      padding: 12px 6px;
      align-items: center;
      overflow: hidden;
    }
    .focus[data-collapsed] .rail {
      align-self: center;
      writing-mode: vertical-rl;
      padding: 12px 6px;
    }
    .focus-inner {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      flex: 1;
      width: 100%;
    }
    .focus-inner[hidden] {
      display: none;
    }
    .insp {
      min-width: 0;
      min-height: 0;
      height: 100%;
    }
    .workspace {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      container-type: inline-size;
    }
    .back {
      align-self: flex-start;
    }
    .focus .drawer {
      box-shadow: none;
      border-radius: 1rem;
    }
    .focus-body,
    .workspace {
      overflow-x: hidden;
    }
    .focus-body > * {
      min-width: 0;
    }
    .ctx h3 {
      margin: 10px 0 4px;
    }
    .target {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 8px;
      padding: 8px 12px;
      border-radius: 0.9rem;
      background: #eef4ff;
      color: #1d3f85;
      font-size: 0.85rem;
    }
    .workspace[hidden] {
      display: none;
    }
    .hl {
      display: grid;
      gap: 6px;
      padding: 12px;
      border-radius: 1rem;
      border: 1px solid rgba(47, 111, 237, 0.3);
      background: #f3f7ff;
    }
    .hl p {
      margin: 0;
    }
    .hl-head {
      display: flex;
      align-items: baseline;
      gap: 10px;
      color: #032d42;
    }
    .hl-n {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1d4fb8;
    }
    .hl-key {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 3px;
      font-size: 0.82rem;
    }
    .hl-key .sw {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .ih {
      display: grid;
      gap: 4px;
    }
    .ih-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ih h1 {
      margin: 0;
      font-size: 1.15rem;
      color: #032d42;
    }
    .spark {
      display: inline-grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 10px;
      color: #fff;
      background: linear-gradient(135deg, #5b2db8, #2f6fed);
    }
    .spark svg {
      width: 18px;
      height: 18px;
    }
    .ctx {
      margin: 0;
      font-size: 0.78rem;
      color: #656462;
    }
    .lead {
      margin: 4px 0 0;
      font-size: 0.9rem;
      color: #1b1b1b;
      line-height: 1.4;
    }
    .opps {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: grid;
      gap: 6px;
    }
    .opp {
      --tone: #2f6fed;
      width: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      text-align: left;
      font: inherit;
      color: #1b1b1b;
      padding: 9px 10px;
      border-radius: 0.95rem;
      border: 1px solid rgba(3, 45, 66, 0.1);
      border-left: 3px solid var(--tone);
      background: #fff;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .opp.red {
      --tone: #d6383d;
    }
    .opp.amber {
      --tone: #d9820b;
    }
    .opp.blue {
      --tone: #2f6fed;
    }
    .opp:hover {
      transform: translateY(-1px);
      box-shadow: 0 5px 16px rgba(3, 45, 66, 0.13);
      background: #fbfcff;
    }
    .opp:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .opp[aria-pressed='true'] {
      background: #eef4ff;
      box-shadow: inset 0 0 0 1px #2f6fed;
    }
    .opp.hero {
      padding: 13px 12px;
      background: linear-gradient(160deg, #f6f9ff, #ffffff 70%);
    }
    .oi {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 9px;
      color: var(--tone);
      background: color-mix(in srgb, var(--tone) 12%, #ffffff);
    }
    .oi svg,
    .vi svg,
    .ai-i svg {
      width: 17px;
      height: 17px;
    }
    .ob {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .ot {
      font-weight: 600;
      font-size: 0.88rem;
      color: #032d42;
      overflow-wrap: anywhere;
    }
    .hero .ot {
      font-size: 0.98rem;
    }
    .or {
      font-size: 0.8rem;
      color: #3b3a38;
      overflow-wrap: anywhere;
    }
    .om {
      font-size: 0.72rem;
      color: #656462;
    }
    .oa svg {
      width: 16px;
      height: 16px;
      color: var(--tone);
    }
    .views {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 6px;
    }
    .view {
      display: flex;
      align-items: center;
      gap: 7px;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      color: #032d42;
      padding: 8px 10px;
      border-radius: 0.9rem;
      border: 1px solid rgba(3, 45, 66, 0.12);
      background: #fff;
      cursor: pointer;
    }
    .view b {
      margin-left: auto;
      color: #1d4fb8;
      font-variant-numeric: tabular-nums;
    }
    .view:hover {
      background: #f1f6ff;
    }
    .view:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .vi,
    .ai-i {
      display: inline-grid;
      color: #1d4fb8;
    }
    .catctx {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 10px;
      padding: 8px 12px;
      border-radius: 0.9rem;
      background: #f1f6ff;
      color: #1d3f85;
    }
    .why {
      padding: 10px 12px;
      border-radius: 0.95rem;
      background: #fff8ec;
      border: 1px solid rgba(217, 130, 11, 0.3);
      font-size: 0.84rem;
    }
    .why p {
      margin: 2px 0 4px;
    }
    .why ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 3px;
    }
    .vtag {
      display: inline-block;
      margin-right: 6px;
      padding: 0 6px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .vtag.v {
      background: #e3f6ea;
      color: #0d4d28;
    }
    .vtag.h {
      background: #fff3d1;
      color: #7a5a00;
    }
    .at {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @media (prefers-reduced-motion: reduce) {
      .opp {
        transition: none;
      }
      .opp:hover {
        transform: none;
      }
    }
    .acts {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .act {
      display: grid;
      gap: 4px;
      padding: 10px 12px;
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 0.9rem;
      background: #fff;
    }
    .act.signal {
      border-color: #2f6fed;
      background: #f6f9ff;
    }
    .act small {
      color: #4d4c4a;
      overflow-wrap: anywhere;
    }
    .act .primary {
      justify-self: start;
    }
    .sh {
      margin: 12px 0 0;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #656462;
    }
    .resume {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 8px;
      padding: 8px 12px;
      border-radius: 0.9rem;
      background: #fff8e6;
      color: #5a4300;
      font-size: 0.85rem;
    }
    .target.empty {
      background: rgba(3, 45, 66, 0.05);
      color: #4d4c4a;
    }
    .target b {
      overflow-wrap: anywhere;
    }
    .target .tl {
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    .focus-body > * {
      min-width: 0;
    }
    .starts {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: grid;
      gap: 4px;
    }
    .starts button {
      width: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 4px 10px;
      align-items: center;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 0.8rem;
      background: #fff;
      font: inherit;
      color: #032d42;
      cursor: pointer;
    }
    .starts button:hover {
      background: #f4f7fb;
    }
    .starts button[aria-pressed='true'] {
      border-color: #2f6fed;
      background: #eef4ff;
      box-shadow: inset 3px 0 0 #2f6fed;
    }
    .starts .t {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .starts small {
      grid-column: 2;
      color: #656462;
    }
    details.fold > summary {
      cursor: pointer;
      color: #656462;
      font-size: 0.85rem;
    }
    .hint {
      margin: 0;
      font-size: 0.82rem;
      color: #656462;
    }
    .card {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(3, 45, 66, 0.1);
      border-radius: 1.5rem;
      box-shadow: 0 1px 3px rgba(3, 45, 66, 0.06);
    }
    .focus {
      padding: 18px 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }
    .focus-body {
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      flex: 1;
      padding-right: 4px;
    }
    .focus-foot {
      display: grid;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px solid rgba(3, 45, 66, 0.08);
    }
    .focus-foot .primary {
      width: 100%;
    }
    .switch {
      display: flex;
      gap: 2px;
      padding: 3px;
      background: rgba(3, 45, 66, 0.06);
      border-radius: 0.9rem;
    }
    .switch button {
      flex: 1;
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      color: #4d4c4a;
      padding: 0.4rem 0.4rem;
      border-radius: 0.7rem;
      cursor: pointer;
      transition: background 0.3s, color 0.3s;
    }
    .switch button[aria-pressed='true'] {
      background: #fff;
      color: #032d42;
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.18);
    }
    button:focus-visible,
    select:focus-visible,
    a:focus-visible,
    summary:focus-visible,
    input:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 99px;
      background: rgba(3, 45, 66, 0.07);
      color: #032d42;
    }
    .badge.det {
      background: #e6efff;
      color: #1d4fb8;
    }
    .badge.ai {
      background: #efe7ff;
      color: #5b2db8;
    }
    .badge.high {
      background: #ffe9d6;
      color: #9a4a08;
    }
    .badge.medium {
      background: #fff3d1;
      color: #7a5a00;
    }
    .badge.low,
    .badge.none {
      background: #e3f6ea;
      color: #0d6b36;
    }
    h1 {
      margin: 0;
      font-size: 1.55rem;
      line-height: 1.2;
      color: #032d42;
      overflow-wrap: anywhere;
    }
    .impact {
      margin: 0.25rem 0 0.5rem;
      padding: 0.45rem 0.7rem;
      border-radius: 0.75rem;
      background: #e3f6ea;
      color: #0d4d28;
      font-size: 0.85rem;
      font-weight: 600;
    }
    @media (prefers-reduced-motion: no-preference) {
      .impact {
        animation: impact-in 0.6s ease both;
      }
      @keyframes impact-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
    }
    .count {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .count b {
      font-size: 2.6rem;
      line-height: 1;
      color: #032d42;
    }
    .count span {
      color: #4d4c4a;
      font-size: 0.9rem;
    }
    p {
      margin: 0;
      line-height: 1.5;
      color: #3b3a38;
      font-size: 0.9rem;
    }
    .muted {
      color: #656462;
      font-size: 0.8rem;
    }
    .eyebrow {
      font-family: ui-monospace, monospace;
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1d4fb8;
    }
    .scope {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(3, 45, 66, 0.14);
      background: #fff;
      border-radius: 99px;
      padding: 0.25rem 0.7rem;
      font: inherit;
      font-size: 0.78rem;
      color: #032d42;
      cursor: pointer;
    }
    select.chip {
      appearance: auto;
      max-width: 100%;
    }
    .bars {
      display: grid;
      gap: 3px;
    }
    .bar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 2px 8px;
      border: 0;
      background: transparent;
      font: inherit;
      text-align: left;
      padding: 4px 6px;
      margin: 0 -6px;
      border-radius: 0.6rem;
      cursor: pointer;
      color: #1b1b1b;
      font-size: 0.8rem;
    }
    .bar:hover,
    .bar[aria-pressed='true'] {
      background: rgba(242, 129, 47, 0.12);
    }
    .bar span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .track {
      grid-column: 1 / -1;
      height: 5px;
      border-radius: 99px;
      background: rgba(3, 45, 66, 0.08);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: #f2812f;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .primary {
      border: 0;
      background: #032d42;
      color: #fff;
      font: inherit;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0.75rem 1.1rem;
      border-radius: 0.9rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .primary:hover:not(:disabled) {
      box-shadow: 0 6px 18px rgba(3, 45, 66, 0.25);
      transform: translateY(-1px);
    }
    .primary:disabled {
      opacity: 0.45;
      cursor: default;
    }
    .link {
      border: 0;
      background: transparent;
      color: #1d4fb8;
      font: inherit;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0.2rem 0;
      text-align: left;
    }
    .note {
      border-left: 3px solid #f2b134;
      background: #fff8e6;
      padding: 8px 10px;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      color: #5a4300;
    }
    .note.info {
      border-color: #2f6fed;
      background: #eef4ff;
      color: #1d3f85;
    }
    .note.bad {
      border-color: #e5484d;
      background: #fdebec;
      color: #7a1316;
    }

    /* ---------- stage column ---------- */
    .stagecol {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 10px;
      min-height: 0;
      min-width: 0;
    }
    .stagebox {
      position: relative;
      min-height: 0;
      min-width: 0;
    }
    .stagebox cat-universe {
      position: absolute;
      inset: 0;
      min-height: 0;
    }
    .inspector {
      background: #fff;
      position: absolute;
      top: 12px;
      right: 12px;
      bottom: 12px;
      width: min(340px, calc(100% - 24px));
      padding: 16px;
      overflow: auto;
      z-index: 5;
      animation: slide-in 0.3s ease;
      font-size: 0.85rem;
      color: #1b1b1b;
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .inspector,
      .sheet,
      .drawer-body {
        animation: none;
      }
      .fill {
        transition: none;
      }
    }
    .inspector h2 {
      margin: 0 34px 4px 0;
      font-size: 1.05rem;
      color: #032d42;
      overflow-wrap: anywhere;
    }
    .inspector h3 {
      margin: 14px 0 4px;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #656462;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 0;
      background: rgba(3, 45, 66, 0.07);
      cursor: pointer;
      color: #032d42;
    }
    .checks {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 6px;
    }
    .checks li {
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 8px;
    }
    .mark {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: #fff;
      margin-top: 1px;
    }
    .mark.pass {
      background: #12a150;
    }
    .mark.fail {
      background: #e5484d;
    }
    .mark.na,
    .mark.pending {
      background: #9aa7b7;
    }
    .checks small {
      display: block;
      color: #656462;
    }
    dl.kv {
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 12px;
    }
    dl.kv dt {
      color: #656462;
    }
    dl.kv dd {
      margin: 0;
      text-align: right;
      overflow-wrap: anywhere;
    }
    .drawer {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .drawer-head {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      flex-wrap: wrap;
    }
    .drawer-label {
      border: 0;
      background: rgba(47, 111, 237, 0.1);
      color: #1d4fb8;
      font: inherit;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.4rem 0.75rem;
      border-radius: 0.7rem;
      cursor: pointer;
    }
    .tabs {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
      flex: 1;
    }
    .tab {
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      color: #4d4c4a;
      padding: 0.4rem 0.7rem;
      border-radius: 0.7rem;
      cursor: pointer;
    }
    .tab[aria-selected='true'] {
      background: rgba(3, 45, 66, 0.08);
      color: #032d42;
    }
    .drawer-body {
      padding: 4px 16px 14px;
      max-height: min(240px, 30vh);
      overflow: auto;
      font-size: 0.85rem;
      animation: rise 0.3s ease;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    .drawer-body h3 {
      margin: 10px 0 4px;
      font-size: 0.85rem;
      color: #032d42;
    }
    .drawer-body ul {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 4px;
    }
    .rule {
      color: #656462;
    }
    .recs {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 2px;
    }
    .rec {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      padding: 4px 6px;
      border-radius: 0.6rem;
    }
    .rec:hover {
      background: rgba(3, 45, 66, 0.05);
    }
    .rec button.name {
      border: 0;
      background: transparent;
      font: inherit;
      text-align: left;
      cursor: pointer;
      color: #032d42;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .focus-body .rec button.name {
      white-space: normal;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .rec small {
      color: #656462;
    }

    /* ---------- preparation sheet ---------- */
    .scrim {
      position: absolute;
      inset: 0;
      z-index: 8;
      display: grid;
      place-items: center;
      padding: 12px;
      background: rgba(248, 247, 244, 0.7);
      backdrop-filter: blur(6px);
      border-radius: 1.5rem;
    }
    .sheet {
      width: min(760px, 100%);
      max-height: 100%;
      overflow: auto;
      padding: 22px;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 1.4rem;
      box-shadow: 0 18px 60px rgba(3, 45, 66, 0.22);
      animation: rise 0.35s ease;
      display: grid;
      gap: 14px;
    }
    .sheet.wide {
      width: min(900px, 100%);
    }
    .sheet h2 {
      margin: 0;
      color: #032d42;
      font-size: 1.3rem;
    }
    .sheet h3 {
      margin: 0;
      font-size: 0.95rem;
      color: #032d42;
    }
    .step {
      border: 1px solid rgba(3, 45, 66, 0.1);
      border-radius: 1rem;
      padding: 12px 14px;
      display: grid;
      gap: 8px;
    }
    .step ol,
    .step ul {
      margin: 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 6px;
    }
    .cmp {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @container (max-width: 700px) {
      .cmp {
        grid-template-columns: 1fr;
      }
    }
    .cmp > div {
      border-radius: 0.8rem;
      padding: 8px 10px;
      background: rgba(3, 45, 66, 0.04);
      font-size: 0.82rem;
    }
    .cmp .after {
      background: #eef4ff;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .ghost {
      border: 1px solid rgba(3, 45, 66, 0.2);
      background: #fff;
      color: #032d42;
      font: inherit;
      font-weight: 600;
      padding: 0.55rem 1rem;
      border-radius: 0.8rem;
      cursor: pointer;
    }
    .ghost:disabled {
      opacity: 0.45;
      cursor: default;
    }
    .state {
      display: grid;
      place-items: center;
      min-height: 320px;
      text-align: center;
      color: #4d4c4a;
    }
    .vh {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    this._model = null;
    this._error = '';
    this._readiness = null;
    this._readinessError = '';
    this._active = null; // null: the selected item's own intelligence; otherwise one catalog-wide view
    this._group = null; // the candidate group whose items are highlighted (chosen from an opportunity)
    this._opp = null; // the opportunity that was chosen, so the panel can say why
    this._lensNow = 'overview';
    this._query = '';
    this._oppCache = null;
    this._hl = ''; // the requested population to highlight (see lib/app-state.js), kept until cleared
    this._proposal = null; // {id, name, mode, done}: the one proposal being prepared, bound to its record
    this._lensInit = '';
    this._lensNow = '';
    this._warmed = false;
    this._cat = null;
    this._impact = null;
    this._disc = {};
    this._discError = '';
    this._wb = null;
    this._transformFor = null;
    this._choices = null;
    this._uniKey = 0;
    this._leftOpen = true;
    this._inspOpen = true;
    this._item = null;
    this._cls = '';
    this._drawer = false;
    this._tab = 'criteria';
    this._prepare = false;
    this._picked = new Set();
    this._vars = null;
    this._allCats = false;
    this._opener = null;
    this._onPop = () => this._readUrl();
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this._readUrl(true);
    window.addEventListener('popstate', this._onPop);
    this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!isServer) window.removeEventListener('popstate', this._onPop);
  }

  firstUpdated() {
    document.title = i18n.getMessage('Explore · Catalog Intelligence 360');
  }

  updated(changed) {
    if (this._model && ['_active', '_cat', '_item', '_cls', '_readiness', '_disc', '_hl', '_lensNow'].some(k => changed.has(k))) this._pushContext();
    if (changed.has('_prepare') && this._prepare) this.renderRoot.querySelector('.workspace .back')?.focus();
    if (changed.has('_prepare') && !this._prepare && changed.get('_prepare')) this._opener?.focus?.();
  }

  /* ---------- data ---------- */
  async _load() {
    try {
      this._model = await loadCatalog();
      if (this._active) await this._ensure(this._active);
      this._warm();
      if (this._hl === 'service') this._ensure('csdm-alignment');
      if (this._item) {
        this._wantText();
        this._warm();
      }
      if (this._pendingOpen && this._item && this._active && this._current()) {
        this._pendingOpen = false;
        this._openPrepare();
      }
    } catch (e) {
      this._error = e?.message || 'error';
    }
  }

  /** Each investigation is built once, on demand, from native records, then cached. Concurrent callers share one build. */
  _ensure(id) {
    if (!this._model) return Promise.resolve();
    if (id === 'ai-readiness') return this._ensureReadiness();
    const key = {'form-intelligence': 'form', overlap: 'overlap', taxonomy: 'taxonomy', 'csdm-alignment': 'csdm'}[id];
    if (!key || this._disc[key]) return Promise.resolve();
    this._building ||= {};
    if (this._building[key]) return this._building[key];
    this._discError = '';
    this._building[key] = (async () => {
      try {
        let built;
        if (key === 'form') {
          const [stats, vars] = await Promise.all([loadVariableStats(), loadAllVariables()]);
          built = buildFormIntelligence(this._model, stats, vars);
        } else if (key === 'overlap') {
          await loadTextFacts(this._model).catch(() => {});
          built = buildOverlap(this._model);
        } else if (key === 'taxonomy') built = buildTaxonomy(this._model);
        else {
          const data = await loadServiceData();
          built = {...buildCsdm(this._model, data), data};
        }
        this._disc = {...this._disc, [key]: built};
      } catch (e) {
        this._discError = e?.message || 'error';
      } finally {
        this._building[key] = null;
      }
    })();
    return this._building[key];
  }

  /** The checks that describe the selected item are built once, in the background, the first time an item is selected. Forms last: they read every question. */
  _warm() {
    if (this._warmed || !this._model) return;
    this._warmed = true;
    Promise.allSettled([this._ensure('ai-readiness'), this._ensure('overlap'), this._ensure('taxonomy'), this._ensure('csdm-alignment')]).then(() => this._ensure('form-intelligence'));
  }

  /** AI readiness needs the variable counts; they load (once, cached) the first time they are wanted. */
  _ensureReadiness() {
    if (this._readiness) return Promise.resolve();
    if (this._readinessLoading) return this._readinessLoading;
    this._readinessLoading = (async () => {
      try {
        const [stats] = await Promise.all([loadVariableStats(), loadTextFacts(this._model)]);
        this._readiness = buildAiReadiness(this._model, stats);
      } catch (e) {
        this._readinessError = e?.message || 'error';
        // Without the variable counts the form check reports "pending"; without text facts nothing is assessed.
        if (this._model.textFacts) this._readiness = buildAiReadiness(this._model, null);
      } finally {
        this._readinessLoading = null;
      }
    })();
    return this._readinessLoading;
  }

  /** Description text for the inspector; fetched on first need, then cached. */
  _wantText() {
    loadTextFacts(this._model).then(() => this.requestUpdate()).catch(() => {});
  }

  _current() {
    const d = this._disc;
    return {'ai-readiness': this._readiness, 'form-intelligence': d.form, overlap: d.overlap, taxonomy: d.taxonomy, 'csdm-alignment': d.csdm}[this._active]?.discovery || null;
  }

  _scopeIds(withCategory = true) {
    const d = this._current();
    if (!d) return [];
    return scopedIds(d, this._model, {categoryId: withCategory ? this._cat : null, cls: this._cls || null});
  }

  _byName(name) {
    const q = String(name).toLowerCase();
    const n = this._model.nodes.find(x => x.name.toLowerCase() === q) || this._model.nodes.find(x => x.name.toLowerCase().includes(q));
    if (!n) throw new Error(`No item matches "${name}"`);
    return n;
  }

  /* ---------- URL state ---------- */
  _readUrl(initial = false) {
    const q = new URLSearchParams(window.location.search);
    const d = q.get('d');
    const hl = q.get('highlight') || '';
    this._active = INVESTIGATIONS.includes(d) ? d : HIGHLIGHT_INVESTIGATION[hl] || null;
    this._hl = this._active ? '' : POPULATIONS.includes(hl) ? hl : '';
    if (initial) {
      this._lensInit = q.get('lens') || HIGHLIGHT_LENS[this._hl] || '';
      this._lensNow = this._lensInit || 'overview';
    }
    this._cat = q.get('cat') || null;
    this._item = q.get('item') || null;
    this._cls = q.get('type') || '';
    // a tool on another page asked for a workspace to open on arrival
    this._pendingOpen = initial && q.get('open') === 'workspace';
    if (!initial) this._vars = null;
  }

  _syncUrl() {
    const q = new URLSearchParams();
    if (this._active) q.set('d', this._active);
    else if (this._hl) q.set('highlight', this._hl);
    if (this._cat) q.set('cat', this._cat);
    if (this._item) q.set('item', this._item);
    if (this._cls) q.set('type', this._cls);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${q}${window.location.hash}`);
  }

  _openDiscovery(id) {
    if (!INVESTIGATIONS.includes(id)) throw new Error(`Unknown investigation "${id}". Choose one of: ${INVESTIGATIONS.join(', ')}`);
    this._active = id;
    this._hl = '';
    // a workspace belongs to the investigation that opened it
    // an unfinished proposal is hidden, not lost: it stays bound to its record and can be resumed
    this._prepare = false;
    // the selected item and category are kept so related investigations feel like one journey
    this._vars = null;
    this._choices = null;
    this._picked = new Set();
    this._syncUrl();
    this._ensure(id);
    if (this._item) this._loadVars(this._item);
  }

  _onToolbarLens = e => {
    const lens = e.detail.lens;
    if (this._active) this._goHome();
    if (this._hl && HIGHLIGHT_LENS[this._hl] !== lens) this._hl = '';
    this._lensNow = lens;
    this._lensInit = lens;
    this._syncUrl();
  };

  _focusGroup() {
    const g = this._group;
    return g && this._item && this._disc.overlap && g.ids.includes(this._item) ? g : null;
  }

  /** The Top opportunities for what is in scope (the whole catalog, a category or a highlighted population), computed from results already in memory. */
  _oppList() {
    const m = this._model;
    if (!m) return [];
    const hl = this._hlView();
    const ids = hl?.markers ? new Set(Object.keys(hl.markers)) : null;
    const e = {readiness: this._readiness, form: this._disc.form, overlap: this._disc.overlap, taxonomy: this._disc.taxonomy, csdm: this._disc.csdm};
    const key = Object.values(e);
    const f = `${this._hl}|${this._cat || ''}|${ids ? ids.size : ''}`;
    const c = this._oppCache;
    if (c && c.f === f && c.key.every((x, i) => x === key[i])) return c.list;
    const list = buildOpportunities(m, e, {ids, catId: this._cat || null});
    this._oppCache = {f, key, list};
    return list;
  }

  /** Choose an opportunity: select the real item (and its group) in the universe and open the inspector. Nothing is sent to the AI. */
  _pickOpp(o) {
    this._leftOpen = true;
    this._inspOpen = true;
    this._opp = o;
    this._group = o.group || null;
    this._prepare = false;
    this._setItem(o.itemId);
  }

  _clearHl = () => {
    this._hl = '';
    this._syncUrl();
  };

  /** The requested population, resolved from the native catalog model: markers for the universe and the words that explain it. */
  _hlView() {
    const h = this._hl;
    const m = this._model;
    if (!h || !m) return null;
    const pick = (test, color) => Object.fromEntries(m.nodes.filter(test).map(n => [n.id, color]));
    if (h === 'requested') {
      const ids = m.nodes.filter(n => n.requests > 0);
      const total = ids.reduce((a, n) => a + n.requests, 0);
      return {title: i18n.getMessage('Requested items'), count: ids.length, markers: pick(n => n.requests > 0, '#2F6FED'),
        text: i18n.getMessage('{0} catalog items have at least one request in the request items table, {1} request records in all. Every other item is subdued.', fmt(ids.length), fmt(total)),
        legend: [{color: '#2F6FED', label: i18n.getMessage('Requested at least once · {0} items', fmt(ids.length))}, {color: '#C3CEDC', label: i18n.getMessage('Never requested · {0}', fmt(m.nodes.length - ids.length))}]};
    }
    if (h === 'complete') {
      const done = n => n.fields === CRITERIA.length;
      const c = m.nodes.filter(done).length;
      return {title: i18n.getMessage('Items with complete metadata'), count: c, markers: pick(done, '#12A150'),
        text: i18n.getMessage('{0} items have all of: {1}. This is the same definition as the figure on Home.', fmt(c), CRITERIA.map(x => x.label()).join(', ')),
        legend: [{color: '#12A150', label: i18n.getMessage('Complete · {0} items', fmt(c))}, {color: '#C3CEDC', label: i18n.getMessage('At least one gap · {0}', fmt(m.nodes.length - c))}]};
    }
    if (h === 'service') {
      const c = this._disc.csdm;
      if (!c) return {title: i18n.getMessage('Service alignment'), count: null, markers: null, text: i18n.getMessage('Reading service offerings and their links…'), legend: []};
      const v = new Set(c.verifiedIds);
      return {title: i18n.getMessage('Service offering context'), count: v.size + c.candidates.size,
        markers: {...pick(n => c.candidates.has(n.id), '#7C3AED'), ...pick(n => v.has(n.id), '#0E9F8E')},
        text: i18n.getMessage('{0} items are linked to a service offering (verified) and {1} more may align with one (suggested, not verified). No link is not a gap.', fmt(v.size), fmt(c.candidates.size)),
        legend: [{color: '#0E9F8E', label: i18n.getMessage('Verified link · {0}', fmt(v.size))}, {color: '#7C3AED', label: i18n.getMessage('Suggested, not verified · {0}', fmt(c.candidates.size))}]};
    }
    if (h === 'categories') {
      const cats = m.clusters.filter(c => !c.uncategorised).sort((a, b) => b.items.length - a.items.length);
      return {title: i18n.getMessage('Categories in use'), count: cats.length, markers: null, cats,
        text: i18n.getMessage('{0} categories hold at least one item. Choose one to focus it in the universe.', fmt(cats.length)), legend: []};
    }
    return {title: i18n.getMessage('Full catalog'), count: m.nodes.length, markers: null,
      text: i18n.getMessage('All {0} catalog items, coloured by item type. Click a dot to see its findings and AI actions.', fmt(m.nodes.length)), legend: []};
  }

  _renderHighlight(hl) {
    if (!hl) return nothing;
    return html`<section class="hl" aria-label=${i18n.getMessage('Highlighted population')}>
      <div class="hl-head"><b>${hl.title}</b>${hl.count != null ? html`<span class="hl-n">${fmt(hl.count)}</span>` : nothing}</div>
      <p>${hl.text}</p>
      ${hl.legend.length ? html`<ul class="hl-key">${hl.legend.map(l => html`<li><i class="sw" style=${`background:${l.color}`} aria-hidden="true"></i>${l.label}</li>`)}</ul>` : nothing}
      ${hl.cats ? html`<ul class="starts">${hl.cats.slice(0, 40).map(c => html`<li><button aria-pressed=${this._cat === c.id} @click=${() => this._setCat(this._cat === c.id ? null : c.id)}><span class="t">${c.title}</span><small>${i18n.getMessage('{0} items', fmt(c.items.length))}</small></button></li>`)}</ul>${hl.cats.length > 40 ? html`<p class="hint">${i18n.getMessage('and {0} more. Zoom the universe to see them all.', fmt(hl.cats.length - 40))}</p>` : nothing}` : nothing}
      <p class="hint">${i18n.getMessage('Select a dot to see that item’s findings and the AI actions available for it.')}</p>
      <button class="chip" @click=${this._clearHl}>${i18n.getMessage('Clear highlight')} ✕</button>
    </section>`;
  }

  /** Back to the selected item's own intelligence. */
  _goHome() {
    this._active = null;
    this._prepare = false;
    this._syncUrl();
  }

  _setCat(id) {
    this._cat = id || null;
    this._allCats = false;
    this._syncUrl();
  }

  _setItem(id) {
    this._item = id || null;
    if (this._opp && this._opp.itemId !== this._item) this._opp = null;
    this._vars = null;
    this._choices = null;
    if (this._item) {
      const n = nodeIndex(this._model).get(this._item);
      if (n && n.cluster !== this._cat && this._cat) this._cat = n.cluster;
      this._wantText();
      this._loadVars(this._item);
      this._warm();
    }
    this._syncUrl();
  }

  _setCls(v) {
    this._cls = v;
    this._syncUrl();
  }

  async _loadVars(id) {
    if (!['ai-readiness'].includes(this._active)) return;
    this._vars = {id, loading: true};
    try {
      const vars = await loadItemVariables(id);
      if (this._item === id) this._vars = {id, vars, review: assessVariables(vars)};
    } catch (e) {
      if (this._item === id) this._vars = {id, error: e.message};
    }
  }

  _findCategory(name) {
    const q = String(name).toLowerCase();
    return this._model.clusters.find(c => c.title.toLowerCase() === q) || this._model.clusters.find(c => c.title.toLowerCase().includes(q));
  }

  async _tool(fn) {
    try {
      if (!this._model) throw new Error('The catalog is still loading');
      const r = fn();
      await this.updateComplete;
      return {success: true, ...(r && typeof r === 'object' ? r : {})};
    } catch (e) {
      return {success: false, error: e.message};
    }
  }

  _pushContext() {
    setAppState({investigation: this._active, itemId: this._item, categoryId: this._cat, highlight: this._hl, lens: this._lensNow});
    ottoContext(this, {page: 'Explore', investigation: this._active, itemId: this._item, categoryId: this._cat}).then(c => {
      const d = this._current();
      const p = this._proposal;
      const group = this._item && this._active === 'overlap' ? this._disc.overlap?.groupOf.get(this._item) : null;
      this.setAiContext?.({
        ...c,
        findings: d ? {title: d.title, classification: d.method.classification, affectedInScope: this._scopeIds().length} : null,
        overlapGroupItemIds: group ? group.ids : undefined,
        itemTypeFilter: this._cls || null,
        highlight: this._hl ? {id: this._hl, title: this._hlView()?.title, count: this._hlView()?.count} : null,
        selectedOverlapGroup: this._focusGroup() ? {group_id: `overlap:${[...this._focusGroup().ids].sort()[0]}`, item_ids: this._focusGroup().ids, kind: this._focusGroup().kind} : undefined,
        topOpportunities: this._model && !this._item ? this._oppList().slice(0, 5).map(o => ({item_id: o.itemId, name: o.title, type: o.kind, reason: o.reason})) : undefined,
        proposal: p && !p.done ? {item_id: p.id, name: p.name, kind: p.mode, open: this._prepare} : null
      });
    });
  }

  /** The item and category the person has selected, for tools that act on "this item". */
  _ottoSelection() {
    return {itemId: this._item, categoryId: this._cat};
  }

  /** Open an investigation for a tool call: select the item by sys_id, build real findings, optionally open the workspace. */
  async _ottoOpen(d, {itemId, categoryId, workspace}) {
    if (!this._model) await this._load();
    this._leftOpen = true;
    if (itemId && itemId !== this._item) this._item = itemId;
    this._openDiscovery(d);
    if (categoryId) this._setCat(categoryId);
    if (itemId) {
      this._setItem(itemId);
      this._inspOpen = true;
    }
    await this._ensure(d);
    const disc = this._current();
    if (!disc) return {success: false, error: this._discError || 'The investigation could not be built.'};
    let workspaceError = '';
    if (workspace && this._item) {
      await this._openPrepare();
      workspaceError = this._wb?.error || '';
    }
    await this.updateComplete;
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    return {
      success: true,
      investigation: disc.title,
      findingsInScope: this._scopeIds().length,
      summary: disc.summary,
      selectedItem: n ? {item_id: n.id, name: n.name} : null,
      workspaceOpen: !!(workspace && this._item && !workspaceError),
      assessmentStarted: !!(workspace && this._item && !workspaceError),
      ...(workspaceError ? {workspaceError} : {}),
      message: workspaceError
        ? `The investigation is open, but the review panel could not be prepared: ${workspaceError}`
        : workspace ? 'The review panel is open in the left panel and the AI assessment has started. The result appears there for the person to review; nothing is saved unless they confirm it.' : 'The investigation is open with real findings.'
    };
  }

  /* ---------- universe wiring ---------- */
  _markers() {
    const ids = new Set(this._scopeIds(false));
    const m = {};
    const active = this._model.nodes.filter(n => n.active && (!this._cls || n.cls === this._cls));
    const inactive = i18n.getMessage('Inactive, not assessed · {0}', fmt(this._model.nodes.filter(n => !n.active).length));
    const ramp = ['#0E9F8E', '#F2B134', '#F2812F', '#E5484D'];
    const tallyRamp = (count, labels) => {
      const tally = [0, 0, 0, 0];
      for (const n of active) {
        const k = Math.min(3, count(n));
        if (k < 0) {
          m[n.id] = NEUTRAL;
          continue;
        }
        m[n.id] = ramp[k];
        tally[k]++;
      }
      return [...labels.map((l, k) => ({color: ramp[k], label: `${l} · ${fmt(tally[k])}`})), {color: SOFT, label: inactive}];
    };
    if (this._active === 'ai-readiness' && this._readiness) {
      return {markers: m, legend: tallyRamp(n => failedCount(this._readiness, n.id), [i18n.getMessage('No gap found'), i18n.getMessage('1 gap'), i18n.getMessage('2 gaps'), i18n.getMessage('3 or more gaps')])};
    }
    if (this._active === 'form-intelligence' && this._disc.form) {
      const by = this._disc.form.byItem;
      const legend = tallyRamp(n => (by.has(n.id) ? by.get(n.id).findings.length : -1), [i18n.getMessage('No question to review'), i18n.getMessage('1 question to review'), i18n.getMessage('2 questions'), i18n.getMessage('3 or more questions')]);
      return {markers: m, legend: [...legend.slice(0, 4), {color: NEUTRAL, label: i18n.getMessage('No form · {0}', fmt(active.filter(n => !by.has(n.id)).length))}, legend[4]]};
    }
    if (this._active === 'overlap' && this._disc.overlap) {
      const g = this._disc.overlap.groupOf;
      const sel = this._item && g.get(this._item);
      const tally = {exact: 0, near: 0, related: 0};
      for (const n of this._model.nodes) {
        const grp = g.get(n.id);
        if (!grp || !n.active) continue;
        tally[grp.kind]++;
        m[n.id] = sel && sel.id !== grp.id ? SOFT : KIND_COLOR[grp.kind];
      }
      return {markers: m, legend: [...Object.keys(OVERLAP_KIND).map(k => ({color: KIND_COLOR[k], label: `${OVERLAP_KIND[k].label()} · ${fmt(tally[k])}`})), {color: SOFT, label: i18n.getMessage('Not in a candidate group')}]};
    }
    if (this._active === 'taxonomy' && this._disc.taxonomy) {
      const f = this._disc.taxonomy.findings;
      const color = {uncategorised: '#E5484D', misplaced: '#F2812F', generic: '#F2B134'};
      const tally = {uncategorised: 0, misplaced: 0, generic: 0};
      for (const n of active) {
        const first = ['uncategorised', 'misplaced', 'generic'].find(k => f.get(n.id)?.some(x => x.kind === k));
        if (first) {
          m[n.id] = color[first];
          tally[first]++;
        }
      }
      return {markers: m, legend: [...['uncategorised', 'misplaced', 'generic'].map(k => ({color: color[k], label: `${TAXONOMY_ISSUE[k]()} · ${fmt(tally[k])}`})), {color: SOFT, label: i18n.getMessage('No signal found')}]};
    }
    if (this._active === 'csdm-alignment' && this._disc.csdm) {
      const v = new Set(this._disc.csdm.verifiedIds);
      const c = this._disc.csdm.candidates;
      for (const n of this._model.nodes) {
        if (v.has(n.id)) m[n.id] = '#0E9F8E';
        else if (c.has(n.id)) m[n.id] = '#7C3AED';
      }
      return {markers: m, legend: [{color: '#0E9F8E', label: i18n.getMessage('Verified link to an offering · {0}', fmt(v.size))}, {color: '#7C3AED', label: i18n.getMessage('Suggested offering, not verified · {0}', fmt(c.size))}, {color: SOFT, label: i18n.getMessage('No link, no evidence. Normal, not a gap.')}]};
    }
    ids.forEach(id => (m[id] = ACCENT));
    return {markers: m, legend: []};
  }

  _onUniFocus = e => {
    const id = e.detail.id || null;
    if (id !== this._cat) this._setCat(id);
  };

  _onUniSelect = e => {
    const id = e.detail.id || null;
    if (id) this._inspOpen = true;
    if (id !== this._item) this._setItem(id);
  };

  /* ---------- preparation ---------- */
  /** Show how a verified change moved the current investigation's count. */
  _noteImpact(name, before, after) {
    this._impact = before == null ? null : {before, after, name};
  }

  /** An approved change was saved and read back: bring every cached view in line with the database. */
  _onApplied = async e => {
    const {itemId, persisted, verified} = e.detail;
    // Only a native read-back that matches what was approved may change what we show.
    if (!verified) return;
    if (this._proposal?.id === itemId) this._proposal = {...this._proposal, done: true};
    const countBefore = this._readiness?.discovery?.affectedIds?.length ?? null;
    applyPersisted(this._model, itemId, persisted);
    const stats = await loadVariableStats().catch(() => null);
    this._readiness = buildAiReadiness(this._model, stats);
    this._noteImpact(this._model.nodes.find(x => x.id === itemId)?.name, countBefore, this._readiness.discovery.affectedIds.length);
    this._vars = null;
    if (this._item === itemId) this._loadVars(itemId);
    this.requestUpdate();
  };

  /** A form, category or service change was saved and read back: refresh only what it affects. */
  _onWorkbenchApplied = async e => {
    const {mode, itemId, verified} = e.detail;
    if (!verified) return;
    if (this._proposal?.id === itemId) this._proposal = {...this._proposal, done: true};
    const name = this._model.nodes.find(x => x.id === itemId)?.name;
    if (mode === 'form') {
      const before = this._disc.form?.discovery.affectedIds.length ?? null;
      await patchVariables(e.detail.changed || []);
      clearItemVariables(itemId);
      const [stats, vars] = await Promise.all([loadVariableStats(), loadAllVariables()]);
      this._disc = {...this._disc, form: buildFormIntelligence(this._model, stats, vars)};
      this._noteImpact(name, before, this._disc.form.discovery.affectedIds.length);
      this._readiness = null;
      this._ensureReadiness();
    } else if (mode === 'starter') {
      // the item now has questions: forget cached variables and rebuild the form check in the background
      clearItemVariables(itemId);
      resetVariables();
      this._disc = {...this._disc, form: undefined};
      this._ensure('form-intelligence');
      this._readiness = null;
      this._ensureReadiness();
    } else if (mode === 'category') {
      const before = this._disc.taxonomy?.discovery.affectedIds.length ?? null;
      const was = this._model.nodes.find(x => x.id === itemId)?.fields ?? 0;
      this._model = await loadCatalog(true);
      const n = this._model.nodes.find(x => x.id === itemId);
      if (n && n.fields > was) n.improved = {from: was, to: n.fields, gained: ['category'], at: Date.now()};
      this._disc = {taxonomy: buildTaxonomy(this._model)};
      this._readiness = null;
      this._uniKey++;
      this._noteImpact(name, before, this._disc.taxonomy.discovery.affectedIds.length);
      this._ensureReadiness();
    } else if (mode === 'service') {
      const before = this._disc.csdm?.discovery.affectedIds.length ?? null;
      resetServiceData();
      {
        const data = await loadServiceData();
        this._disc = {...this._disc, csdm: {...buildCsdm(this._model, data), data}};
      }
      this._noteImpact(name, before, this._disc.csdm.discovery.affectedIds.length);
    }
    this.requestUpdate();
  };

  /** After an improvement: back to the universe, on the item that changed, with the completeness lens. */
  _openExplore = e => {
    const id = e.detail?.itemId || this._item;
    this._closePrepare();
    this._goHome();
    if (id) {
      this._inspOpen = true;
      this._setItem(id);
    }
    this._lensInit = this._lensInit === 'quality' ? 'quality ' : 'quality';
  };

  _closePrepare = () => {
    this._prepare = false;
    // a finished proposal is cleared; an unfinished one is kept, bound to its record, and can be resumed
    if (this._proposal?.done) {
      this._proposal = null;
      this._wb = null;
    }
  };

  _discardProposal = () => {
    this._proposal = null;
    this._wb = null;
    this._prepare = false;
  };

  /** The one shared action behind every AI button and every Otto tool: select, open the right view, prepare the real inputs and start the assessment. */
  async _runAction(kind, {itemId, categoryId} = {}) {
    const d = ACTION_D[kind];
    if (!d) throw new Error(`Unknown action "${kind}"`);
    if (categoryId) this._setCat(categoryId);
    if (itemId && itemId !== this._item) {
      this._inspOpen = true;
      this._setItem(itemId);
    }
    this._openDiscovery(d);
    await this._openPrepare();
  }

  /** Open the review panel of the current view for the selected item and start the AI assessment when its inputs are valid. */
  async _openPrepare(e) {
    if (!this._item || !this._active) return;
    this._leftOpen = true;
    this._opener = e?.currentTarget || this._opener;
    const id = this._item;
    const mode = this._active === 'ai-readiness' ? 'metadata' : WB_MODE[this._active];
    const cur = this._proposal;
    if (cur && cur.id === id && cur.mode === mode && !cur.done) {
      this._prepare = true; // resume the unfinished proposal as it was
      return;
    }
    const n = nodeIndex(this._model).get(id);
    const mine = {id, name: n.name, mode, done: false};
    this._proposal = mine;
    this._prepare = true;
    this._wb = null;
    if (mode === 'metadata') {
      this._ensureReadiness();
      return;
    }
    try {
      this._wb = {id, mode, loading: true};
      await this._ensure(this._active);
      const ctx = await this._buildContext(mode, id);
      if (this._proposal === mine) this._wb = {id, ctx, mode: ctx.starter ? 'starter' : mode, auto: true};
    } catch (err) {
      if (this._proposal === mine) this._wb = {id, mode, error: err?.message || 'error'};
    }
  }

  async _buildContext(mode, id) {
    const n = nodeIndex(this._model).get(id);
    await loadTextFacts(this._model).catch(() => {});
    const catTitles = x => x.catIds.map(c => this._model.catTitle[c]).filter(Boolean);
    const questions = async x => (await loadItemVariables(x.id).catch(() => [])).filter(v => v.label).slice(0, 8).map(v => v.label);
    const base = async x => ({id: x.id, name: x.name, cls: x.cls, short: x.shortDescription, description: x.descSnippet, categories: catTitles(x), questions: await questions(x), requests: x.requests});
    if (mode === 'form') {
      const entry = this._disc.form?.byItem.get(id);
      const setUsage = this._disc.form?.setUsage;
      const flagged = (entry?.findings || []).slice(0, 12).map(f => ({v: f.variable, issues: f.issues.map(i => i.text), shared: f.shared ? setUsage?.get(f.variable.set) || f.shared : 0}));
      // no flagged question is needed: any form with inputs can be reviewed, flagged questions first
      let rows = flagged;
      if (rows.length < 12) {
        const have = new Set(rows.map(r => r.v.id));
        const all = (await loadItemVariables(id).catch(() => [])).filter(isInput).filter(v => !have.has(v.id));
        rows = [...rows, ...all.slice(0, 12 - rows.length).map(v => ({v, issues: [], shared: 0, fromSet: !!v.fromSet}))];
      }
      if (!rows.length) {
        // no input questions is an opportunity, not a defect: the AI can suggest a starter form
        const allVars = await loadItemVariables(id).catch(() => []);
        return {starter: true, item: await base(n), existing: allVars.map(v => v.label || v.name).filter(Boolean)};
      }
      const choiceTypes = rows.filter(r => ['3', '5'].includes(String(r.v.type))).map(r => r.v.id);
      const choices = choiceTypes.length ? await loadChoices(choiceTypes).catch(() => new Map()) : new Map();
      return {item: await base(n), variables: rows.map(r => ({id: r.v.id, type: String(r.v.type), mandatory: r.v.mandatory, name: r.v.name, label: r.v.label, help: r.v.help, hint: r.v.hint, issues: r.issues, choices: (choices.get(r.v.id) || []).map(c => c.text), shared: r.shared, fromSet: !!r.fromSet}))};
    }
    if (mode === 'overlap') {
      const g = this._disc.overlap.groupOf.get(id);
      if (!g) throw new Error('No similar item was found for this item, so there is nothing to compare it with. A comparison needs at least two items.');
      const items = await Promise.all(g.ids.slice(0, 6).map(x => base(nodeIndex(this._model).get(x))));
      return {title: g.ids.length > 1 ? nodeIndex(this._model).get(g.ids[0]).name : n.name, item: {id, name: items.map(i => i.name).join(' · ')}, items, groupKind: g.kind};
    }
    if (mode === 'category') {
      const candidates = categoryCandidates(this._model, id);
      return {item: {...(await base(n)), categories: catTitles(n)}, candidates, current: [...n.catIds]};
    }
    const data = await loadServiceData();
    const cands = offeringCandidates(this._model, data, id).map(c => ({id: c.offering.id, name: c.offering.name, desc: c.offering.desc}));
    // verified offerings are always shown to the model so it can say they already match
    const existing = (data.byItem.get(id) || []).map(l => l.offering);
    existing.forEach(o => !cands.some(c => c.id === o) && data.offeringById.get(o) && cands.push({id: o, name: data.offeringById.get(o).name, desc: data.offeringById.get(o).desc}));
    if (!cands.length) offeringFallback(this._model, data, id).forEach(o => cands.push({id: o.id, name: o.name, desc: o.desc}));
    if (!cands.length) throw new Error('No service offering shares any meaningful word with this item, so there is nothing to compare it with. That is normal: not every item belongs to an offering.');
    return {item: await base(n), candidates: cands, existing};
  }

  _prepIds() {
    return this._picked.size ? [...this._picked] : this._item ? [this._item] : this._scopeIds();
  }

  _togglePick(id) {
    const s = new Set(this._picked);
    s.has(id) ? s.delete(id) : s.add(id);
    this._picked = s;
  }

  async _chooseChoices() {
    const v = this._disc.form?.byItem.get(this._item);
    if (!v) return;
    const ids = v.findings.map(f => f.variable.id).concat([]);
    const selectIds = (await loadItemVariables(this._item).catch(() => [])).filter(x => ['3', '5'].includes(x.type)).map(x => x.id);
    this._choices = {loading: true};
    try {
      this._choices = {by: await loadChoices([...new Set([...ids, ...selectIds])].slice(0, 60))};
    } catch (e) {
      this._choices = {error: e.message};
    }
  }

  _onKey(e) {
    if (e.key === 'Escape' && this._prepare) {
      e.stopPropagation();
      this._closePrepare();
    }
  }

  /* ---------- render ---------- */
  render() {
    if (this._error) {
      return html`<div class="state card" role="alert"><div><strong>${i18n.getMessage('The catalog could not be loaded')}</strong><p>${this._error}</p>
        <button class="ghost" @click=${() => { this._error = ''; this._load(); }}>${i18n.getMessage('Retry')}</button></div></div>`;
    }
    if (!this._model) {
      return html`<div class="state card" role="status">${i18n.getMessage('Mapping your catalog universe…')}</div>`;
    }
    const hl = this._hlView();
    const grp = this._focusGroup();
    const view = this._active ? this._markers() : hl ? {markers: hl.markers, legend: hl.legend} : grp ? {markers: Object.fromEntries(grp.ids.map(id => [id, KIND_COLOR[grp.kind]])), legend: []} : {markers: null, legend: null};
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    const showInsp = !!n && this._inspOpen;
    return html`
      <div class="page">
      <cat-toolbar current="explore" .lens=${this._lensNow} .model=${this._model}
        @cat-toolbar:lens=${this._onToolbarLens} @cat-toolbar:query=${e => (this._query = e.detail.q)} @cat-toolbar:pick=${e => { this._inspOpen = true; this._setItem(e.detail.id); }}></cat-toolbar>
      <div class="wrap ${this._leftOpen ? '' : 'lclosed'} ${this._prepare ? 'work' : ''} ${showInsp ? '' : 'noinsp'}" role="group" aria-label=${i18n.getMessage('Catalog workspace')} @keydown=${this._onKey}>
        ${this._renderFocus()}
        <div class="stagebox">
          ${keyed(this._uniKey, html`<cat-universe hide-detail hide-bar .externalQuery=${this._query} ?investigate=${!!this._active} .markers=${view.markers} .legendItems=${view.legend} .lens=${this._lensInit} focus-id=${this._cat ?? ''} selected-id=${this._item ?? ''}
            @cat-universe:focus=${this._onUniFocus} @cat-universe:select=${this._onUniSelect} @cat-universe:lens=${e => { this._lensNow = e.detail.lens; this._lensInit = e.detail.lens; }}
            @cat-universe:investigate=${e => this._openDiscovery(e.detail.discovery)}></cat-universe>`)}
        </div>
        ${showInsp ? html`<div class="insp"><cat-inspector .model=${this._model} item-id=${n.id} .findings=${this._inspectorFindings(n)} @cat-inspector:close=${() => (this._inspOpen = false)}></cat-inspector></div>` : nothing}
      </div>
      </div>`;
  }

  _renderFocus() {
    const d = this._current();
    const open = this._leftOpen;
    const loading = !!this._active && !d && !this._discError && !(this._active === 'ai-readiness' && this._readinessError);
    return html`<section class="focus card" aria-label=${i18n.getMessage('Intelligence')} ?data-collapsed=${!open}>
      <button class="rail" aria-expanded=${open} aria-controls="intel-body" @click=${() => (this._leftOpen = !open)}>
        <span aria-hidden="true">${open ? '‹' : '›'}</span><span>${open ? i18n.getMessage('Hide panel') : i18n.getMessage('Intelligence')}</span></button>
      <div class="focus-inner" id="intel-body" ?hidden=${!open}>
        ${this._active ? html`<div class="switch" role="group" aria-label=${i18n.getMessage('Choose an intelligence view')}>
          <button aria-pressed="false" @click=${() => this._goHome()}>← ${i18n.getMessage('Intelligence')}</button>
          ${INVESTIGATIONS.map(id => html`<button aria-pressed=${this._active === id} @click=${() => this._openDiscovery(id)}>${LABEL[id]()}</button>`)}
        </div>` : nothing}
        ${this._discError ? html`<div class="note bad" role="alert">${i18n.getMessage('This investigation could not be built ({0}).', this._discError)} <button class="link" @click=${() => { this._discError = ''; this._ensure(this._active); }}>${i18n.getMessage('Retry')}</button></div>` : nothing}
        ${this._renderWorkspace()}
        ${this._prepare ? nothing : this._renderResume()}
        ${this._prepare ? nothing
          : !this._active ? this._renderHome()
          : loading ? html`<div role="status" class="muted">${{'ai-readiness': i18n.getMessage('Reading variable counts and assessing items…'), 'form-intelligence': i18n.getMessage('Reading every form question and checking each one…'), overlap: i18n.getMessage('Looking for items that read alike…'), taxonomy: i18n.getMessage('Checking how items are categorised…'), 'csdm-alignment': i18n.getMessage('Reading service offerings and their links…')}[this._active]}</div>`
          : d ? this._renderDiscovery(d) : nothing}
      </div>
    </section>`;
  }

  _overlapGroupsInScope() {
    const ov = this._disc.overlap;
    if (!ov) return [];
    const scope = new Set(this._scopeIds());
    return ov.groups.filter(g => g.ids.some(id => scope.has(id)));
  }

  /** What the primary action will act on, so it never opens an empty or ambiguous workspace. */
  _primary(d) {
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    const label = d.recommendedAction.label;
    const need = i18n.getMessage('Select an item first: choose one from the list above or click a dot in the universe.');
    // Three separate questions: is the item flagged (a finding), can it be analysed (this), and may a change be saved (decided in the workspace).
    // Here only the second one matters: any selected item can be analysed, flagged or not.
    if (d.id === 'overlap') {
      // comparing needs at least two items, so the target is the selected item's candidate group
      const g = n ? this._disc.overlap?.groupOf.get(n.id) : null;
      return g
        ? {label: i18n.getMessage('Compare these {0} items', fmt(g.ids.length)), hint: i18n.getMessage('Compares “{0}” with {1} similar item(s) using the AI. Nothing is changed.', n.name, fmt(g.ids.length - 1))}
        : {label, disabled: true, hint: n ? i18n.getMessage('“{0}” is not in a candidate group, so there is nothing to compare it with. Choose a group from the list above.', n.name) : i18n.getMessage('Choose a candidate group from the list above, or click a coloured dot in the universe.')};
    }
    if (!n) return {label, disabled: true, hint: need};
    if (d.id === 'form-intelligence') {
      const e = this._disc.form?.byItem.get(n.id);
      return {label, hint: e?.findings.length ? i18n.getMessage('Target: “{0}”, {1} question(s) to review.', n.name, fmt(e.findings.length)) : i18n.getMessage('Target: “{0}”. No question was flagged; the AI can still suggest clearer wording for its questions.', n.name)};
    }
    return {label, hint: i18n.getMessage('Target: “{0}”.', n.name)};
  }

  /** The items to look at first, so the next step is always a click away. */
  _startItems(d, scope) {
    const by = nodeIndex(this._model);
    let ids = scope;
    if (d.id === 'form-intelligence') ids = [...scope].sort((a, b) => (this._disc.form.byItem.get(b)?.findings.length || 0) - (this._disc.form.byItem.get(a)?.findings.length || 0));
    return ids.slice(0, 6).map(id => {
      const n = by.get(id);
      let detail = '';
      if (d.id === 'form-intelligence') detail = i18n.getMessage('{0} question(s) to review', fmt(this._disc.form.byItem.get(id)?.findings.length || 0));
      else if (d.id === 'taxonomy') detail = (this._disc.taxonomy.findings.get(id) || []).map(f => TAXONOMY_ISSUE[f.kind]()).join(' · ');
      else if (d.id === 'csdm-alignment') detail = i18n.getMessage('May align with: {0}', this._disc.csdm.candidates.get(id)?.[0]?.offering.name || '');
      else if (d.id === 'ai-readiness') detail = i18n.getMessage('{0} gap(s)', fmt(failedCount(this._readiness, id)));
      return {id, name: n.name, cls: classLabel(n.cls), detail};
    });
  }

  _renderTarget() {
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    return n
      ? html`<div class="target" role="group" aria-label=${i18n.getMessage('Selected item')}><span class="tl">${i18n.getMessage('Selected item')}</span><b>${n.name}</b><span>${classLabel(n.cls)}</span>
          <button class="chip" aria-pressed=${this._inspOpen} @click=${() => (this._inspOpen = !this._inspOpen)}>${this._inspOpen ? i18n.getMessage('Hide details') : i18n.getMessage('Show details')}</button>
          <button class="chip" @click=${() => this._setItem(null)} aria-label=${i18n.getMessage('Clear the selected item')}>✕</button></div>`
      : html`<div class="target empty" role="status">${i18n.getMessage('No item selected. Pick one from the list below or click a dot in the universe.')}</div>`;
  }

  _renderDiscovery(d) {
    const scope = this._scopeIds();
    const all = this._scopeIds(false);
    const total = d.stats?.active ?? this._model.nodes.length;
    const dist = distribution(this._model, this._cls ? all : d.affectedIds);
    const topCats = this._allCats ? dist : dist.slice(0, 4);
    const maxCount = dist[0]?.count || 1;
    const types = classBreakdown(this._model, d.affectedIds);
    const by = nodeIndex(this._model);
    const groups = d.id === 'overlap' ? this._overlapGroupsInScope() : [];
    const sel = this._item && d.id === 'overlap' ? this._disc.overlap?.groupOf.get(this._item) : null;
    const primary = this._primary(d);
    return html`
      <div class="focus-body">
      <div class="badges">
        <span class="badge ${d.method.classification === 'ai' ? 'ai' : 'det'}">${d.method.classification === 'ai' ? i18n.getMessage('AI assessment') : i18n.getMessage('Deterministic check')}</span>
        <span class="badge ${d.severity.level}">${i18n.getMessage('Prevalence: {0}', this._sev(d.severity.level))}</span>
      </div>
      <div class="eyebrow">${EYEBROW[d.id]()}</div>
      <h1>${d.title}</h1>
      <div class="count"><b>${fmt(scope.length)}</b><span>${this._cat || this._cls ? i18n.getMessage('in this scope, of {0} affected', fmt(d.affectedIds.length)) : i18n.getMessage('of {0} active items', fmt(total))}</span></div>
      ${this._impact && this._impact.before !== this._impact.after ? html`<p class="impact" role="status">✓ ${i18n.getMessage('Counts updated after “{0}” was saved and verified: {1} → {2} items flagged.', this._impact.name || '', fmt(this._impact.before), fmt(this._impact.after))}</p>` : nothing}
      <p>${d.summary}</p>
      ${d.id === 'ai-readiness' && this._readinessError ? html`<div class="note" role="status">${i18n.getMessage('Variable counts could not be read ({0}). The form check is shown as pending, not as passed.', this._readinessError)}</div>` : nothing}
      ${this._renderTarget()}
      ${this._renderItemContext(d)}
      ${d.id === 'overlap' ? html`<div>
          <div class="muted" id="grp">${i18n.getMessage('Candidate groups in scope')}</div>
          <ul class="starts" aria-labelledby="grp">${groups.slice(0, 6).map(g => html`<li><button aria-pressed=${sel?.id === g.id} @click=${() => this._setItem(g.ids[0])}>
            <span class="dot" style="background:${KIND_COLOR[g.kind]}" aria-hidden="true"></span><span class="t">${by.get(g.ids[0]).name}</span>
            <small>${i18n.getMessage('{0} items', fmt(g.ids.length))} · ${OVERLAP_KIND[g.kind].label()}</small></button></li>`)}</ul>
          ${groups.length > 6 ? html`<p class="hint">${i18n.getMessage('and {0} more groups. Focus a category to narrow them.', fmt(groups.length - 6))}</p>` : nothing}</div>`
        : html`<div>
          <div class="muted" id="starts">${d.id === 'form-intelligence' ? i18n.getMessage('Forms to review first') : i18n.getMessage('Items to look at first')}</div>
          <ul class="starts" aria-labelledby="starts">${this._startItems(d, scope).map(x => html`<li><button aria-pressed=${this._item === x.id} @click=${() => this._setItem(x.id)}>
            <span class="t" style="grid-column:1 / -1">${x.name}</span><small style="grid-column:1 / -1">${x.cls}${x.detail ? ` · ${x.detail}` : ''}</small></button></li>`)}</ul>
          ${scope.length > 6 ? html`<p class="hint">${i18n.getMessage('{0} more in the Records tab below.', fmt(scope.length - 6))}</p>` : nothing}</div>`}
      ${d.id === 'taxonomy' ? this._renderTaxonomyExtras(d) : nothing}
      <details class="fold">
        <summary>${i18n.getMessage('Narrow by category or item type')}</summary>
        <div class="scope" role="group" aria-label=${i18n.getMessage('Narrow the investigation')}>
          ${this._cat ? html`<button class="chip" @click=${() => this._setCat(null)} aria-label=${i18n.getMessage('Clear category {0}', this._model.clusters.find(c => c.id === this._cat)?.title)}>${this._model.clusters.find(c => c.id === this._cat)?.title} ✕</button>` : nothing}
          <label class="vh" for="cls">${i18n.getMessage('Item type')}</label>
          <select id="cls" class="chip" .value=${this._cls} @change=${e => this._setCls(e.target.value)}>
            <option value="">${i18n.getMessage('All item types')}</option>
            ${types.map(([c, n]) => html`<option value=${c} ?selected=${this._cls === c}>${classLabel(c)} · ${fmt(n)}</option>`)}
          </select>
          ${this._picked.size ? html`<button class="chip" @click=${() => (this._picked = new Set())}>${i18n.getMessage('{0} chosen', fmt(this._picked.size))} ✕</button>` : nothing}
        </div>
        <div class="bars" role="group" aria-label=${i18n.getMessage('Where it is, by category')}>
          ${topCats.map(c => html`<button class="bar" aria-pressed=${this._cat === c.id} @click=${() => this._setCat(this._cat === c.id ? null : c.id)}>
            <span>${c.title}</span><span>${fmt(c.count)} / ${fmt(c.of)}</span><div class="track"><div class="fill" style="width:${(100 * c.count) / maxCount}%"></div></div></button>`)}
        </div>
        ${dist.length > 4 ? html`<button class="link" @click=${() => (this._allCats = !this._allCats)}>${this._allCats ? i18n.getMessage('Show fewer') : i18n.getMessage('Show all {0} categories', fmt(dist.length))}</button>` : nothing}
      </details>
      ${this._renderDrawer()}
      </div>
      <div class="focus-foot">
        <button class="primary" ?disabled=${primary.disabled} @click=${this._openPrepare}>${primary.label}</button>
        <p class="hint">${primary.hint}</p>
        <button class="link" aria-expanded=${this._drawer} @click=${() => (this._drawer = !this._drawer)}>${this._drawer ? i18n.getMessage('Hide the reasoning') : i18n.getMessage('Why this finding?')}</button>
      </div>`;
  }

  _renderTaxonomyExtras(d) {
    const o = d.stats.overlaps;
    const names = c => c.categories.map(x => x.title).join(' / ');
    return html`${d.stats.genericCategories.length ? html`<p class="muted">${i18n.getMessage('Vaguely named categories: {0}.', d.stats.genericCategories.slice(0, 5).map(c => c.title).join(', '))}</p>` : nothing}
      ${o.length ? html`<details><summary class="muted">${i18n.getMessage('{0} categories look alike', fmt(o.length))}</summary><ul>${o.slice(0, 8).map(c => html`<li>${names(c)} <span class="muted">${c.kind === 'same' ? i18n.getMessage('same name') : i18n.getMessage('very similar')}</span></li>`)}</ul></details>` : nothing}`;
  }

  _sev(l) {
    return {high: i18n.getMessage('high'), medium: i18n.getMessage('medium'), low: i18n.getMessage('low'), none: i18n.getMessage('none')}[l];
  }

  _renderDrawer() {
    const d = this._current();
    if (!d) return nothing;
    const label = {criteria: i18n.getMessage('Criteria'), evidence: i18n.getMessage('Evidence'), records: i18n.getMessage('Records'), steps: i18n.getMessage('Next steps')};
    return html`<section class="drawer card" aria-label=${i18n.getMessage('Reasoning and evidence')}>
      <div class="drawer-head">
        <button class="drawer-label" aria-expanded=${this._drawer} @click=${() => (this._drawer = !this._drawer)}>${i18n.getMessage('Reasoning and evidence')} <span aria-hidden="true">${this._drawer ? '▾' : '▸'}</span></button>
        <div class="tabs" role="tablist" aria-label=${i18n.getMessage('Reasoning and evidence')}>
          ${TABS.map(t => html`<button class="tab" role="tab" id=${`tab-${t}`} aria-selected=${this._drawer && this._tab === t} aria-controls="panel" @click=${() => { this._tab = t; this._drawer = true; }}>${label[t]}</button>`)}
        </div>
        <button class="link" aria-expanded=${this._drawer} @click=${() => (this._drawer = !this._drawer)}>${this._drawer ? i18n.getMessage('Collapse') : i18n.getMessage('Expand')}</button>
      </div>
      ${this._drawer ? html`<div class="drawer-body" id="panel" role="tabpanel" aria-labelledby=${`tab-${this._tab}`}>${this._renderTab(d)}</div>` : nothing}
    </section>`;
  }

  _renderTab(d) {
    switch (this._tab) {
      case 'criteria':
        return html`<p>${d.method.description}</p>
          ${d.id === 'ai-readiness'
            ? DIMENSIONS.map(dim => {
                const crit = d.method.criteria.filter(c => c.dimension === dim.id);
                return html`<h3>${dim.label()}${dim.scored ? nothing : html` <span class="badge">${i18n.getMessage('context only')}</span>`}</h3><p class="muted">${dim.blurb()}</p>
                  ${crit.length ? html`<ul>${crit.map(c => html`<li><b>${c.label}</b> <span class="rule">${c.rule}</span></li>`)}</ul>` : nothing}`;
              })
            : html`<ul>${d.method.criteria.map(c => html`<li><b>${c.label}</b> <span class="rule">${c.rule}</span></li>`)}</ul>`}
          ${d.id === 'ai-readiness' ? html`<h3>${i18n.getMessage('Semantic assessment')}</h3>
            <div class="note info">${i18n.getMessage('Judging whether wording is actually clear needs a language model. It is separate from the checks above and always labelled as AI. Open an item and choose “Run semantic assessment”: one model call per item, nothing is saved.')}</div>` : nothing}`;
      case 'evidence':
        return html`<h3>${i18n.getMessage('Records read')}</h3>
          <ul>${d.evidence.sources.map(s => html`<li><b>${s.table}</b> · ${s.fields.join(', ')}<br><span class="rule">${s.note}</span></li>`)}</ul>
          <h3>${i18n.getMessage('Certainty')}</h3>
          <p>${d.method.classification === 'deterministic' ? i18n.getMessage('Exact: each finding is a direct check of a record field, so there is no confidence estimate to give.') : i18n.getMessage('Model-generated: treat as a suggestion.')}</p>
          <h3>${i18n.getMessage('Prevalence')}</h3><p>${d.severity.rationale}</p>
          ${d.stats?.perCheck ? html`<h3>${i18n.getMessage('Items flagged by each check')}</h3><ul>${d.stats.perCheck.map(p => html`<li>${p.check.label()}: <b>${fmt(p.failed)}</b></li>`)}</ul>` : nothing}
          <h3>${i18n.getMessage('Assessed')}</h3><p>${new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(d.assessedAt))} · ${d.version}</p>`;
      case 'records': {
        const ids = this._scopeIds();
        const by = nodeIndex(this._model);
        if (!ids.length) return html`<p>${i18n.getMessage('No affected records in this scope.')}</p>`;
        return html`<p class="muted">${i18n.getMessage('Showing {0} of {1}. Tick items to prepare only those.', fmt(Math.min(60, ids.length)), fmt(ids.length))}</p>
          <ul class="recs">${ids.slice(0, 60).map(id => {
            const n = by.get(id);
            return html`<li class="rec"><input type="checkbox" .checked=${this._picked.has(id)} @change=${() => this._togglePick(id)} aria-label=${i18n.getMessage('Include {0}', n.name)}>
              <button class="name" @click=${() => this._setItem(id)}>${n.name}<small> · ${classLabel(n.cls)}</small></button>
              <a class="link" href=${`/sc_cat_item.do?sys_id=${id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a></li>`;
          })}</ul>`;
      }
      default:
        return html`<ol>${d.nextSteps.map(s => html`<li>${s}</li>`)}</ol>
          <div class="note info">${i18n.getMessage('Discovery only reads records. Anything that would change a record is generated as a proposal, reviewed by you, and saved only after your explicit confirmation, then read back to verify.')}</div>`;
    }
  }

  /** Deterministic findings for the inspector (compact, read-only). */
  _inspectorFindings(n) {
    const id = n.id;
    const out = [];
    if (this._active === 'ai-readiness') {
      const a = this._readiness?.assessments.get(id);
      if (a) out.push({title: i18n.getMessage('AI readiness checks'), items: a.results.filter(r => r.state !== 'na').map(r => ({state: r.state === 'pass' ? 'pass' : r.state === 'fail' ? 'fail' : 'info', text: r.check.label(), detail: r.detail || ''}))});
    } else if (this._active === 'form-intelligence') {
      const e = this._disc.form?.byItem.get(id);
      if (e) out.push({title: i18n.getMessage('Form findings'), items: e.findings.length ? e.findings.map(f => ({state: 'fail', text: f.variable.label || f.variable.name, detail: f.issues.map(i => i.text).join(' ')})) : [{state: 'pass', text: i18n.getMessage('No question needs review')}]});
    } else if (this._active === 'overlap') {
      const g = this._disc.overlap?.groupOf.get(id);
      if (this._disc.overlap) out.push({title: i18n.getMessage('Overlap'), items: [g ? {state: 'info', text: `${OVERLAP_KIND[g.kind].label()} · ${i18n.getMessage('{0} items', fmt(g.ids.length))}`} : {state: 'pass', text: i18n.getMessage('Not in a candidate group')}]});
    } else if (this._active === 'taxonomy') {
      const f = this._disc.taxonomy?.findings.get(id);
      if (this._disc.taxonomy) out.push({title: i18n.getMessage('Discoverability'), items: f?.length ? f.map(x => ({state: 'fail', text: TAXONOMY_ISSUE[x.kind](), detail: x.text})) : [{state: 'pass', text: i18n.getMessage('No signal found')}]});
    } else if (this._active === 'csdm-alignment' && this._disc.csdm) {
      const c = this._disc.csdm;
      const links = c.data.byItem.get(id) || [];
      const cands = c.candidates.get(id) || [];
      out.push({title: i18n.getMessage('Service alignment'), items: [...links.map(l => ({state: 'pass', text: c.data.offeringById.get(l.offering)?.name || l.offering, detail: i18n.getMessage('Verified link')})), ...cands.map(x => ({state: 'info', text: x.offering.name, detail: i18n.getMessage('Suggested, not verified')})), ...(!links.length && !cands.length ? [{state: 'info', text: i18n.getMessage('No link and no evidence. Normal, not a gap.')}] : [])]});
    }
    return out;
  }

  /** What this investigation says about the selected item, with the context needed to act on it. Actions are only the primary button below. */
  _renderItemContext(d) {
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    if (!n) return nothing;
    const by = nodeIndex(this._model);
    if (d.id === 'ai-readiness') {
      return html`<div class="ctx"><h3>${i18n.getMessage('Semantic assessment')}</h3><cat-semantic-assess item-id=${n.id}></cat-semantic-assess></div>`;
    }
    if (d.id === 'form-intelligence') {
      const e = this._disc.form?.byItem.get(n.id);
      const ch = this._choices;
      return html`<div class="ctx"><h3>${i18n.getMessage('Form')}</h3>
        ${e ? html`<p class="hint">${i18n.getMessage('{0} inputs, {1} required, {2} to review.', fmt(e.inputs), fmt(e.required), fmt(e.findings.length))}</p>` : html`<p class="hint">${i18n.getMessage('This item has no input questions.')}</p>`}
        ${e ? html`<p><button class="link" @click=${this._chooseChoices}>${i18n.getMessage('Check answer choices')}</button></p>` : nothing}
        ${ch?.loading ? html`<p class="hint" role="status">${i18n.getMessage('Reading choices…')}</p>` : ch?.error ? html`<div class="note bad">${ch.error}</div>` : ch?.by && e ? this._renderChoiceFindings(e, ch.by) : nothing}</div>`;
    }
    if (d.id === 'overlap') {
      const g = this._disc.overlap?.groupOf.get(n.id);
      if (!g) return html`<div class="ctx"><p class="hint">${i18n.getMessage('Not in any candidate group.')}</p></div>`;
      return html`<div class="ctx"><h3>${i18n.getMessage('Selected group')}</h3>
        <p><span class="badge" style="background:${KIND_COLOR[g.kind]};color:#fff">${OVERLAP_KIND[g.kind].label()}</span> <span class="hint">${OVERLAP_KIND[g.kind].blurb()}</span></p>
        <ul class="starts">${g.ids.map(id => {
          const m = by.get(id);
          return html`<li><button aria-pressed=${id === n.id} @click=${() => this._setItem(id)}><span class="t" style="grid-column:1 / -1">${m.name}</span>
            <small style="grid-column:1 / -1">${classLabel(m.cls)} · ${m.catIds.map(c => this._model.catTitle[c]).join(', ') || i18n.getMessage('no category')} · ${m.shortDescription || i18n.getMessage('No short description')}</small></button></li>`;
        })}</ul>
        <ul>${g.evidence.map(x => html`<li class="hint">${x.text}</li>`)}</ul>
        <p class="hint">${i18n.getMessage('A group is a candidate to compare, not proof of duplication.')}</p></div>`;
    }
    if (d.id === 'taxonomy') {
      const f = this._disc.taxonomy?.findings.get(n.id) || [];
      return html`<div class="ctx"><h3>${i18n.getMessage('Discoverability')}</h3>
        ${f.length ? html`<ul class="checks">${f.map(x => html`<li><span class="mark fail" aria-hidden="true">✕</span><span>${TAXONOMY_ISSUE[x.kind]()}<small>${x.text}</small></span></li>`)}</ul>` : html`<p class="hint">${i18n.getMessage('No signal found. You can still ask for a recommendation.')}</p>`}
        <p class="hint">${i18n.getMessage('An item can validly belong to several categories. A recommendation only adds a category; it never removes one.')}</p></div>`;
    }
    const c = this._disc.csdm;
    if (!c) return nothing;
    const links = c.data.byItem.get(n.id) || [];
    const cands = c.candidates.get(n.id) || [];
    return html`<div class="ctx"><h3>${i18n.getMessage('Service alignment')}</h3>
      ${links.length ? html`<p><span class="badge ok">${i18n.getMessage('Verified link')}</span></p><ul>${links.map(l => html`<li>${c.data.offeringById.get(l.offering)?.name || l.offering}</li>`)}</ul>` : html`<p class="hint">${i18n.getMessage('No verified link to a service offering. That is normal and not a gap.')}</p>`}
      ${cands.length ? html`<h3>${i18n.getMessage('Suggested, not verified')}</h3><ul>${cands.map(x => html`<li><b>${x.offering.name}</b><br><small class="muted">${x.contained ? i18n.getMessage('The offering’s name appears in the item’s name or summary.') : i18n.getMessage('The names share {0} meaningful words.', String(x.nameShared))}</small></li>`)}</ul>` : nothing}</div>`;
  }

  _renderChoiceFindings(e, by) {
    const label = id => e.findings.find(f => f.variable.id === id)?.variable.label || id;
    const bad = [...by.entries()].flatMap(([vid, list]) => list.filter(c => c.issues.length).map(c => ({vid, c})));
    return bad.length
      ? html`<div class="note">${i18n.getMessage('{0} answer choice(s) to review.', fmt(bad.length))}<ul>${bad.slice(0, 8).map(({vid, c}) => html`<li>${label(vid)}: “${c.text || c.value}” · ${c.issues.join(' ')}</li>`)}</ul></div>`
      : html`<p class="hint">${i18n.getMessage('No problems found in the answer choices that were read.')}</p>`;
  }

  /** An unfinished proposal stays available, tied to its own record. */
  _renderResume() {
    const p = this._proposal;
    if (!p || p.done) return nothing;
    return html`<div class="resume" role="status"><span>${i18n.getMessage('Unfinished proposal for “{0}”.', p.name)}</span>
      <button class="chip" @click=${() => (this._prepare = true)}>${i18n.getMessage('Resume')}</button>
      <button class="chip" @click=${this._discardProposal}>${i18n.getMessage('Discard')}</button></div>`;
  }

  /** All AI proposals and Apply live here, in the left panel, and return to the findings when finished. */
  _renderWorkspace() {
    const p = this._proposal;
    if (!p) return nothing;
    return html`<div class="workspace" ?hidden=${!this._prepare}>
      <button class="link back" @click=${this._closePrepare}>← ${p.done ? i18n.getMessage('Back to the item') : i18n.getMessage('Back to findings')}</button>
      <div class="target" role="group" aria-label=${i18n.getMessage('Proposal target')}><span class="tl">${i18n.getMessage('Proposal for')}</span><b>${p.name}</b></div>
      ${this._item && this._item !== p.id ? html`<div class="note info" role="status">${i18n.getMessage('You have selected a different item. This proposal applies only to “{0}” and will not change anything else.', p.name)}</div>` : nothing}
      ${p.mode === 'metadata' ? this._renderTransformBody() : this._renderWorkbenchBody()}
    </div>`;
  }

  _renderWorkbenchBody() {
    const w = this._wb;
    return !w || w.loading ? html`<h2 id="prep-title" tabindex="-1">${i18n.getMessage('Preparing')}</h2><p role="status" class="muted">${i18n.getMessage('Reading the real records for this item…')}</p>`
      : w.error ? html`<h2 id="prep-title" tabindex="-1">${i18n.getMessage('Nothing to assess')}</h2><div class="note info" role="status">${w.error}</div>`
      : html`<cat-workbench .mode=${w.mode} .context=${w.ctx} .autostart=${!!w.auto} @cat-workbench:applied=${this._onWorkbenchApplied} @cat-workbench:close=${this._closePrepare} @cat-workbench:explore=${this._openExplore}
          @cat-workbench:improve=${e => { this._inspOpen = true; this._setItem(e.detail.itemId); this._openDiscovery('ai-readiness'); this._openPrepare(); }}
          @cat-workbench:select=${e => { this._closePrepare(); this._inspOpen = true; this._setItem(e.detail.itemId); }}></cat-workbench>`;
  }

  /** One item, one proposal, one review, one decision. The target is the proposal's own record, never the current selection. */
  _renderTransformBody() {
    const id = this._proposal?.id;
    if (!id) return nothing;
    if (!this._readiness) return html`<p role="status" class="muted">${i18n.getMessage('Preparing the metadata checks…')}</p>`;
    return html`<cat-transform item-id=${id} autostart .readiness=${this._readiness} @cat-transform:applied=${this._onApplied} @cat-transform:close=${this._closePrepare} @cat-transform:explore=${this._openExplore}></cat-transform>`;
  }

  /* ---------- the selected item's own intelligence ---------- */
  /** The five AI actions for one item, with the evidence the existing engines hold for it. Evidence only reorders and explains; it never gates an action. */
  _actions(n) {
    const id = n.id;
    const m = this._model;
    const out = [];
    // metadata
    const a = this._readiness?.assessments.get(id);
    const gaps = a ? a.failed : null;
    out.push({kind: 'improve', title: i18n.getMessage('Improve descriptions'), button: i18n.getMessage('Improve descriptions'),
      signal: !!gaps?.length, evidence: !a ? [i18n.getMessage('Checking metadata…')] : gaps.length ? [i18n.getMessage('{0} metadata gap(s): {1}', fmt(gaps.length), gaps.map(g => g.check.label()).join(', '))] : [i18n.getMessage('No metadata gap found. The wording can still be reviewed.')]});
    // forms
    const fe = this._disc.form?.byItem.get(id);
    const noForm = !!this._disc.form && !fe;
    out.push({kind: 'form', title: noForm ? i18n.getMessage('Suggest questions with AI') : i18n.getMessage('Review form questions'), button: noForm ? i18n.getMessage('Suggest questions with AI') : i18n.getMessage('Review form questions'),
      signal: !!fe?.findings.length, evidence: !this._disc.form ? [i18n.getMessage('Checking form questions…')] : fe?.findings.length ? [i18n.getMessage('{0} question(s) flagged out of {1} inputs.', fmt(fe.findings.length), fmt(fe.inputs))] : fe ? [i18n.getMessage('No question flagged. The wording can still be reviewed.')] : [i18n.getMessage('No questions configured. AI can suggest a starter form from this item’s name and descriptions. An optional improvement, not a defect.')]});
    // categories
    const tf = this._disc.taxonomy?.findings.get(id) || [];
    const single = n.catIds.filter(c => m.nodes.filter(x => x.catIds.includes(c)).length === 1).map(c => m.catTitle[c] || c);
    const catEv = [...tf.map(f => `${TAXONOMY_ISSUE[f.kind]()}. ${f.text || ''}`.trim()), ...single.map(t => i18n.getMessage('“{0}” holds only this item. A single-item category is a review signal, not proof of miscategorisation.', t))];
    out.push({kind: 'category', title: single.length || tf.length ? i18n.getMessage('Review category fit') : i18n.getMessage('Suggest categories'), button: i18n.getMessage('Suggest categories'),
      signal: catEv.length > 0, evidence: !this._disc.taxonomy ? [i18n.getMessage('Checking categories…')] : catEv.length ? catEv : [n.catIds.length ? i18n.getMessage('Currently in: {0}.', n.catIds.map(c => m.catTitle[c] || c).join(', ')) : i18n.getMessage('Not in any category.')]});
    // services
    const c = this._disc.csdm;
    const links = c?.data.byItem.get(id) || [];
    const cands = c?.candidates.get(id) || [];
    out.push({kind: 'service', title: i18n.getMessage('Check service alignment'), button: i18n.getMessage('Check service alignment'),
      signal: !!cands.length && !links.length, evidence: !c ? [i18n.getMessage('Checking service offerings…')] : [...links.map(l => i18n.getMessage('Linked to “{0}” (verified).', c.data.offeringById.get(l.offering)?.name || l.offering)), ...cands.slice(0, 2).map(x => i18n.getMessage('May align with “{0}” (suggested, not verified).', x.offering.name)), ...(!links.length && !cands.length ? [i18n.getMessage('No link and no evidence. That is normal and not a gap.')] : [])]});
    // overlap
    const g = this._disc.overlap?.groupOf.get(id);
    out.push({kind: 'compare', title: i18n.getMessage('Compare similar items'), button: i18n.getMessage('Compare similar items'),
      signal: !!g, disabled: !!this._disc.overlap && !g,
      evidence: !this._disc.overlap ? [i18n.getMessage('Looking for similar items…')] : g ? [`${OVERLAP_KIND[g.kind].label()} · ${i18n.getMessage('{0} items', fmt(g.ids.length))}. ${i18n.getMessage('A group is a candidate to compare, not proof of duplication.')}`] : [i18n.getMessage('No similar item was found, so there is nothing to compare. A comparison needs at least two items.')]});
    return out;
  }

  /* ---------- the Catalog Intelligence panel ---------- */
  _pending() {
    const out = [];
    if (!this._readiness) out.push(i18n.getMessage('metadata'));
    if (!this._disc.form) out.push(i18n.getMessage('forms'));
    if (!this._disc.overlap) out.push(i18n.getMessage('duplicates'));
    if (!this._disc.taxonomy) out.push(i18n.getMessage('categories'));
    if (!this._disc.csdm) out.push(i18n.getMessage('services'));
    return this._discError ? [] : out;
  }

  _renderHeader(compact) {
    const st = this._model.stats;
    return html`<header class="ih">
      <div class="ih-top"><span class="spark">${icon('spark')}</span><h1>${i18n.getMessage('Catalog Intelligence')}</h1></div>
      <p class="ctx">${i18n.getMessage('{0} items · {1} categories · {2} requested', fmt(st.items), fmt(st.populatedCategories), fmt(st.requestedItems))}</p>
      ${compact ? nothing : this._renderLead()}
    </header>`;
  }

  _renderLead() {
    const list = this._oppList();
    const wait = this._pending();
    const where = this._cat ? this._model.clusters.find(c => c.id === this._cat)?.title : '';
    return html`<p class="lead">${list.length
        ? where ? i18n.getMessage('{0} specific opportunities in “{1}”, from your real records. Pick one to see it in the universe.', fmt(list.length), where) : i18n.getMessage('{0} specific things worth your attention, found in your real records. Pick one to see it in the universe.', fmt(list.length))
        : wait.length ? i18n.getMessage('Reading your catalog to find what deserves attention…') : i18n.getMessage('No specific opportunity was found here. Select an item to see its findings.')}</p>
      ${wait.length && list.length ? html`<p class="hint" role="status">${i18n.getMessage('Still reading: {0}.', wait.join(', '))}</p>` : nothing}`;
  }

  _oppCard(o, hero = false) {
    const tone = o.strength >= 3 ? 'red' : o.strength === 2 ? 'amber' : 'blue';
    const kind = {metadata: i18n.getMessage('Metadata'), form: i18n.getMessage('Form'), overlap: i18n.getMessage('Duplicates'), taxonomy: i18n.getMessage('Category'), service: i18n.getMessage('Service')}[o.kind];
    const verified = o.evidence.some(e => e.verified);
    return html`<li><button class="opp ${tone} ${hero ? 'hero' : ''}" aria-pressed=${this._opp?.id === o.id} @click=${() => this._pickOpp(o)}>
      <span class="oi">${icon(o.kind)}</span>
      <span class="ob"><span class="ot">${o.title}</span><span class="or">${o.reason}</span>
        <span class="om">${kind} · ${verified ? i18n.getMessage('verified fact') : i18n.getMessage('heuristic, to review')}${o.requests ? ` · ${i18n.getMessage('{0} requests', fmt(o.requests))}` : ''}</span></span>
      <span class="oa" aria-hidden="true">${icon('arrow')}</span></button></li>`;
  }

  _renderOpportunities() {
    const list = this._oppList();
    if (!list.length) return nothing;
    const [first, ...rest] = list;
    return html`<h3 class="sh">${i18n.getMessage('Best place to start')}</h3><ul class="opps">${this._oppCard(first, true)}</ul>
      ${rest.length ? html`<h3 class="sh">${i18n.getMessage('More opportunities')}</h3><ul class="opps">${rest.map(o => this._oppCard(o))}</ul>` : nothing}
      <p class="hint">${i18n.getMessage('Ranked by evidence strength, then recorded demand, then number of findings. No AI was used to build this list.')}</p>`;
  }

  _renderViews() {
    const n = (v, f) => (v ? html`<b>${fmt(f(v))}</b>` : nothing);
    const items = [
      ['ai-readiness', 'metadata', n(this._readiness, v => v.discovery.affectedIds.length)],
      ['form-intelligence', 'form', n(this._disc.form, v => v.discovery.affectedIds.length)],
      ['overlap', 'overlap', n(this._disc.overlap, v => v.discovery.stats.groups)],
      ['taxonomy', 'taxonomy', n(this._disc.taxonomy, v => v.discovery.affectedIds.length)],
      ['csdm-alignment', 'service', n(this._disc.csdm, v => v.discovery.stats.candidates)]
    ];
    return html`<h3 class="sh">${i18n.getMessage('Look across the catalog')}</h3>
      <div class="views">${items.map(([id, ic, c]) => html`<button class="view" @click=${() => this._openDiscovery(id)}><span class="vi">${icon(ic)}</span><span>${LABEL[id]()}</span>${c}</button>`)}</div>`;
  }

  _renderWhy() {
    const o = this._opp;
    if (!o || o.itemId !== this._item) return nothing;
    return html`<section class="why" aria-label=${i18n.getMessage('Why this was suggested')}>
      <b>${i18n.getMessage('Why this was suggested')}</b><p>${o.reason}</p>
      <ul>${o.evidence.map(e => html`<li><span class="vtag ${e.verified ? 'v' : 'h'}">${e.verified ? i18n.getMessage('Verified') : i18n.getMessage('Heuristic')}</span>${e.text}</li>`)}</ul>
      ${this._focusGroup() ? html`<p class="hint">${i18n.getMessage('The {0} items of this group are highlighted in the universe.', fmt(this._focusGroup().ids.length))}</p>` : nothing}
    </section>`;
  }

  _renderHome() {
    const n = this._item ? nodeIndex(this._model).get(this._item) : null;
    const hl = this._renderHighlight(this._hlView());
    if (!n) {
      const cat = this._cat ? this._model.clusters.find(c => c.id === this._cat) : null;
      return html`<div class="focus-body">${this._renderHeader(false)}${hl}
        ${cat ? html`<section class="catctx"><b>${cat.title}</b><span>${i18n.getMessage('{0} items', fmt(cat.items.length))}</span><button class="chip" @click=${() => this._setCat(null)}>${i18n.getMessage('All categories')} ✕</button></section>` : nothing}
        ${this._renderOpportunities()}
        ${this._renderViews()}</div>`;
    }
    const acts = this._actions(n);
    const hot = acts.filter(x => x.signal);
    const rest = acts.filter(x => !x.signal);
    const card = x => html`<li class="act ${x.signal ? 'signal' : ''}"><div class="at"><span class="ai-i">${icon(x.kind === 'improve' ? 'metadata' : x.kind === 'compare' ? 'overlap' : x.kind === 'category' ? 'taxonomy' : x.kind)}</span><b>${x.title}</b></div>
      ${x.evidence.map(t => html`<small>${t}</small>`)}
      <button class="primary" ?disabled=${x.disabled} @click=${() => this._runAction(x.kind)}>${x.button}</button></li>`;
    return html`<div class="focus-body">
      ${this._renderHeader(true)}
      ${hl}
      ${this._renderTarget()}
      ${this._renderWhy()}
      ${hot.length ? html`<h3 class="sh">${i18n.getMessage('Suggested next steps')}</h3><ul class="acts">${hot.map(card)}</ul>` : nothing}
      <h3 class="sh">${hot.length ? i18n.getMessage('Other AI actions') : i18n.getMessage('AI actions')}</h3>
      <ul class="acts">${rest.map(card)}</ul>
      <p class="hint">${i18n.getMessage('An action reads this item’s real records and asks the AI once. Nothing is saved until you review the result and confirm.')}</p>
    </div>`;
  }
};
