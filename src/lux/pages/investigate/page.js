import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';
import {keyed} from 'lit/directives/keyed.js';
import {applyPersisted, classLabel, clearItemVariables, loadCatalog, loadItemVariables, loadTextFacts, loadVariableStats} from '../../lib/catalog-data.js';
import {classBreakdown, distribution, nodeIndex, scopedIds} from '../../lib/discovery.js';
import {assessVariables, buildAiReadiness, DIMENSIONS, failedCount} from '../../lib/investigations/ai-readiness.js';
import {buildFormIntelligence, loadAllVariables, loadChoices, patchVariables} from '../../lib/investigations/form-intelligence.js';
import {buildOverlap, KIND as OVERLAP_KIND} from '../../lib/investigations/overlap.js';
import {buildTaxonomy, categoryCandidates, ISSUE as TAXONOMY_ISSUE} from '../../lib/investigations/taxonomy.js';
import {buildCsdm, loadServiceData, offeringCandidates, resetServiceData} from '../../lib/investigations/csdm.js';
import '../../components/cat-universe.js';
import '../../widgets/semantic-assess/index.js';
import '../../widgets/catalog-transform/index.js';
import '../../widgets/cat-workbench/index.js';

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
const WB_MODE = {'form-intelligence': 'form', overlap: 'overlap', taxonomy: 'category', 'csdm-alignment': 'service'};

@customElement('x-snc-catalogintel-investigate-page')
export default class InvestigatePage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'An investigation workspace showing catalog items affected by one investigation (metadata and AI readiness, form intelligence, duplicate and overlap, taxonomy, service alignment) in the catalog universe',
    bestFor: 'When the user wants to investigate catalog quality, find confusing forms, potential duplicates, poorly categorised items or service alignment, or prepare an improvement'
  };

  /* Conversational tools. They move the view and open review workspaces. Generating a proposal needs a click and nothing is saved without the person's confirmation. */
  static client_tools = {
    open_investigation: {
      description: 'Open an investigation: ai-readiness (metadata), form-intelligence, overlap (duplicates), taxonomy (categories) or csdm-alignment (service offerings)',
      arguments: [{name: 'id', description: 'ai-readiness, form-intelligence, overlap, taxonomy or csdm-alignment', type: 'string', required: true}],
      definition: async function ({id}) {
        return this._tool(() => this._openDiscovery(id));
      }
    },
    focus_category: {
      description: 'Focus a catalog category by its name (or empty to show all categories)',
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
      description: 'Select a catalog item by name in the current investigation',
      arguments: [{name: 'name', description: 'Item name, partial matches allowed', type: 'string', required: true}],
      definition: async function ({name}) {
        return this._tool(() => {
          this._setItem(this._byName(name).id);
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
    show_overlap_group: {
      description: 'Open the duplicate and overlap investigation and select an item (by name) to show its candidate group, or the first group in the focused category',
      arguments: [{name: 'name', description: 'Item name, partial matches allowed; omit to use the first group in scope', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        this._openDiscovery('overlap');
        await this._ensure('overlap');
        return this._tool(() => {
          const ids = this._scopeIds();
          const id = name ? this._byName(name).id : ids[0];
          if (!id) throw new Error('No candidate group in this scope');
          this._setItem(id);
          const g = this._disc.overlap?.groupOf.get(id);
          return g ? {group: g.ids.map(x => nodeIndex(this._model).get(x)?.name), kind: g.kind} : {note: 'The item is not in a candidate group'};
        });
      }
    },
    open_transform: {
      description: 'Open the Transform workspace for a catalog item (by name) to generate and review wording improvements. Nothing is changed until the user approves it.',
      arguments: [{name: 'name', description: 'Item name; omit to use the selected item', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        return this._tool(() => {
          if (name) {
            this._openDiscovery('ai-readiness');
            this._setItem(this._byName(name).id);
          }
          if (!this._item) throw new Error('Select an item first');
          this._active = 'ai-readiness';
          this._openPrepare();
        });
      }
    },
    prepare_action: {
      description: 'Open the review workspace for the current investigation and selected item: improve a form, compare overlapping items, recommend a category or check service alignment. It only prepares proposals; saving needs the person to confirm.',
      arguments: [{name: 'name', description: 'Item name; omit to use the selected item', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        return this._tool(() => {
          if (name) this._setItem(this._byName(name).id);
          this._openPrepare();
        });
      }
    },
    recommend_category: {
      description: 'Open the category recommendation workspace for an item (by name). The AI only chooses among existing categories and nothing is saved until the person confirms.',
      arguments: [{name: 'name', description: 'Item name; omit to use the selected item', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        this._openDiscovery('taxonomy');
        await this._ensure('taxonomy');
        return this._tool(() => {
          if (name) this._setItem(this._byName(name).id);
          if (!this._item) throw new Error('Select an item first');
          this._openPrepare();
        });
      }
    },
    check_service_alignment: {
      description: 'Open the service alignment workspace for an item (by name) to compare it with candidate service offerings. Nothing is saved until the person confirms.',
      arguments: [{name: 'name', description: 'Item name; omit to use the selected item', type: 'string', required: false}],
      definition: async function ({name} = {}) {
        this._openDiscovery('csdm-alignment');
        await this._ensure('csdm-alignment');
        return this._tool(() => {
          if (name) this._setItem(this._byName(name).id);
          if (!this._item) throw new Error('Select an item first');
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
    _item: {state: true},
    _cls: {state: true},
    _drawer: {state: true},
    _tab: {state: true},
    _prepare: {state: true},
    _picked: {state: true},
    _caps: {state: true},
    _vars: {state: true},
    _allCats: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      container-type: inline-size;
    }
    .wrap {
      display: grid;
      grid-template-columns: minmax(300px, 400px) minmax(0, 1fr);
      gap: 14px;
      height: calc(100dvh - 176px);
      min-height: 560px;
    }
    @container (max-width: 880px) {
      .wrap {
        grid-template-columns: minmax(0, 1fr);
        height: auto;
      }
      .stagecol {
        height: 70vh;
        min-height: 460px;
      }
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
    this._active = 'ai-readiness';
    this._cat = null;
    this._impact = null;
    this._disc = {};
    this._discError = '';
    this._wb = null;
    this._transformFor = null;
    this._choices = null;
    this._uniKey = 0;
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
    document.title = i18n.getMessage('Investigate · Catalog Intelligence 360');
  }

  updated(changed) {
    if (this._model && ['_active', '_cat', '_item', '_cls', '_readiness', '_disc'].some(k => changed.has(k))) this._pushContext();
    if (changed.has('_prepare') && this._prepare) this.renderRoot.querySelector('.sheet h2')?.focus();
    if (changed.has('_prepare') && !this._prepare && changed.get('_prepare')) this._opener?.focus?.();
  }

  /* ---------- data ---------- */
  async _load() {
    try {
      this._model = await loadCatalog();
      this._ensure(this._active);
      if (this._item) this._wantText();
    } catch (e) {
      this._error = e?.message || 'error';
    }
  }

  /** Each investigation is built once, on demand, from native records, then cached. */
  async _ensure(id) {
    if (!this._model) return;
    if (id === 'ai-readiness') return this._ensureReadiness();
    const key = {'form-intelligence': 'form', overlap: 'overlap', taxonomy: 'taxonomy', 'csdm-alignment': 'csdm'}[id];
    if (!key || this._disc[key] || this._loading?.[key]) return;
    (this._loading ||= {})[key] = true;
    this._discError = '';
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
      this._loading[key] = false;
    }
  }

  /** AI readiness needs the variable counts; they load (once, cached) the first time they are wanted. */
  async _ensureReadiness() {
    if (this._readiness || this._readinessLoading) return;
    this._readinessLoading = true;
    try {
      const [stats] = await Promise.all([loadVariableStats(), loadTextFacts(this._model)]);
      this._readiness = buildAiReadiness(this._model, stats);
    } catch (e) {
      this._readinessError = e?.message || 'error';
      // Without the variable counts the form check reports "pending"; without text facts nothing is assessed.
      if (this._model.textFacts) this._readiness = buildAiReadiness(this._model, null);
    } finally {
      this._readinessLoading = false;
    }
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
    if (INVESTIGATIONS.includes(d)) this._active = d;
    this._cat = q.get('cat') || null;
    this._item = q.get('item') || null;
    this._cls = q.get('type') || '';
    if (!initial) this._vars = null;
  }

  _syncUrl() {
    const q = new URLSearchParams();
    q.set('d', this._active);
    if (this._cat) q.set('cat', this._cat);
    if (this._item) q.set('item', this._item);
    if (this._cls) q.set('type', this._cls);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${q}${window.location.hash}`);
  }

  _openDiscovery(id) {
    if (!INVESTIGATIONS.includes(id)) throw new Error(`Unknown investigation "${id}". Choose one of: ${INVESTIGATIONS.join(', ')}`);
    this._active = id;
    // the selected item and category are kept so related investigations feel like one journey
    this._vars = null;
    this._choices = null;
    this._picked = new Set();
    this._syncUrl();
    this._ensure(id);
    if (this._item) this._loadVars(this._item);
  }

  _setCat(id) {
    this._cat = id || null;
    this._allCats = false;
    this._syncUrl();
  }

  _setItem(id) {
    this._item = id || null;
    this._vars = null;
    this._choices = null;
    if (this._item) {
      const n = nodeIndex(this._model).get(this._item);
      if (n && n.cluster !== this._cat && this._cat) this._cat = n.cluster;
      this._wantText();
      this._loadVars(this._item);
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
    const d = this._current();
    const item = this._item ? nodeIndex(this._model).get(this._item) : null;
    const group = item && this._active === 'overlap' ? this._disc.overlap?.groupOf.get(item.id) : null;
    this.setAiContext?.({
      page: 'Investigate',
      investigation: d ? {id: d.id, title: d.title, classification: d.method.classification, severity: d.severity.level, affectedInScope: this._scopeIds().length} : null,
      focusedCategory: this._cat ? this._model.clusters.find(c => c.id === this._cat)?.title : null,
      itemTypeFilter: this._cls || null,
      selectedItem: item ? {id: item.id, name: item.name, overlapGroup: group ? group.ids.map(id => nodeIndex(this._model).get(id)?.name) : undefined} : null,
      availableInvestigations: INVESTIGATIONS
    });
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

  /** Carry the item, its category and the completeness lens into Explore. */
  _openExplore = e => {
    const id = e.detail?.itemId || this._item;
    const n = this._model?.nodes.find(x => x.id === id);
    const q = new URLSearchParams({item: id, lens: 'quality'});
    if (n?.cluster) q.set('cat', n.cluster);
    navigate(`/explore?${q}`);
  };

  _closePrepare = () => {
    this._prepare = false;
    this._transformFor = null;
    this._wb = null;
  };

  /** Open the review workspace of the current investigation, with real grounding data. */
  async _openPrepare(e) {
    this._opener = e?.currentTarget || this._opener;
    this._prepare = true;
    this._wb = null;
    const mode = WB_MODE[this._active];
    if (!mode) {
      this._ensureReadiness();
      return;
    }
    if (!this._item) return;
    const id = this._item;
    try {
      this._wb = {id, loading: true};
      const ctx = await this._buildContext(mode, id);
      if (this._item === id && this._prepare) this._wb = {id, ctx, mode};
    } catch (err) {
      this._wb = {id, error: err?.message || 'error'};
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
      const flagged = (entry?.findings || []).slice(0, 12);
      const choiceTypes = flagged.filter(f => ['3', '5'].includes(f.variable.type)).map(f => f.variable.id);
      const choices = choiceTypes.length ? await loadChoices(choiceTypes).catch(() => new Map()) : new Map();
      return {item: await base(n), variables: flagged.map(f => ({id: f.variable.id, type: f.variable.type, mandatory: f.variable.mandatory, name: f.variable.name, label: f.variable.label, help: f.variable.help, hint: f.variable.hint, issues: f.issues.map(i => i.text), choices: (choices.get(f.variable.id) || []).map(c => c.text), shared: f.shared ? setUsage?.get(f.variable.set) || f.shared : 0}))};
    }
    if (mode === 'overlap') {
      const g = this._disc.overlap.groupOf.get(id);
      if (!g) throw new Error('This item is not in a candidate group.');
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
    if (!cands.length) throw new Error('No offering shares enough words with this item to be a candidate. That is normal: not every item belongs to an offering.');
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
    const {markers, legend} = this._markers();
    return html`
      <div class="wrap" role="group" aria-label=${i18n.getMessage('Investigation workspace')} @keydown=${this._onKey}>
        ${this._renderFocus()}
        <div class="stagecol">
          <div class="stagebox">
            ${keyed(this._uniKey, html`<cat-universe investigate .markers=${markers} .legendItems=${legend} focus-id=${this._cat ?? ''} selected-id=${this._item ?? ''}
              @cat-universe:focus=${this._onUniFocus} @cat-universe:select=${this._onUniSelect}></cat-universe>`)}
            ${this._item ? this._renderInspector() : nothing}
            ${this._prepare ? this._renderPrepare() : nothing}
          </div>
          ${this._renderDrawer()}
        </div>
      </div>`;
  }

  _renderFocus() {
    const d = this._current();
    const loading = !d && !this._discError && !(this._active === 'ai-readiness' && this._readinessError);
    return html`<section class="focus card" aria-label=${i18n.getMessage('Investigation')}>
      <div class="switch" role="group" aria-label=${i18n.getMessage('Choose an investigation')}>
        ${INVESTIGATIONS.map(id => html`<button aria-pressed=${this._active === id} @click=${() => this._openDiscovery(id)}>${LABEL[id]()}</button>`)}
      </div>
      ${this._discError ? html`<div class="note bad" role="alert">${i18n.getMessage('This investigation could not be built ({0}).', this._discError)} <button class="link" @click=${() => { this._discError = ''; this._ensure(this._active); }}>${i18n.getMessage('Retry')}</button></div>` : nothing}
      ${loading ? html`<div role="status" class="muted">${{'ai-readiness': i18n.getMessage('Reading variable counts and assessing items…'), 'form-intelligence': i18n.getMessage('Reading every form question and checking each one…'), overlap: i18n.getMessage('Looking for items that read alike…'), taxonomy: i18n.getMessage('Checking how items are categorised…'), 'csdm-alignment': i18n.getMessage('Reading service offerings and their links…')}[this._active]}</div>` : d ? this._renderDiscovery(d) : nothing}
    </section>`;
  }

  _overlapGroupsInScope() {
    const ov = this._disc.overlap;
    if (!ov) return [];
    const scope = new Set(this._scopeIds());
    return ov.groups.filter(g => g.ids.some(id => scope.has(id)));
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
      <p class="muted">${d.why}</p>
      ${d.id === 'ai-readiness' && this._readinessError ? html`<div class="note" role="status">${i18n.getMessage('Variable counts could not be read ({0}). The form check is shown as pending, not as passed.', this._readinessError)}</div>` : nothing}
      <div class="scope" role="group" aria-label=${i18n.getMessage('Narrow the investigation')}>
        ${this._cat ? html`<button class="chip" @click=${() => this._setCat(null)} aria-label=${i18n.getMessage('Clear category {0}', this._model.clusters.find(c => c.id === this._cat)?.title)}>${this._model.clusters.find(c => c.id === this._cat)?.title} ✕</button>` : nothing}
        <label class="vh" for="cls">${i18n.getMessage('Item type')}</label>
        <select id="cls" class="chip" .value=${this._cls} @change=${e => this._setCls(e.target.value)}>
          <option value="">${i18n.getMessage('All item types')}</option>
          ${types.map(([c, n]) => html`<option value=${c} ?selected=${this._cls === c}>${classLabel(c)} · ${fmt(n)}</option>`)}
        </select>
        ${this._picked.size ? html`<button class="chip" @click=${() => (this._picked = new Set())}>${i18n.getMessage('{0} chosen', fmt(this._picked.size))} ✕</button>` : nothing}
      </div>
      ${d.id === 'overlap' ? html`<div>
          <div class="muted" id="grp">${i18n.getMessage('Candidate groups in scope')}</div>
          <ul class="recs" aria-labelledby="grp">${groups.slice(0, 6).map(g => html`<li class="rec"><span class="dot" style="background:${KIND_COLOR[g.kind]}" aria-hidden="true"></span>
            <button class="name" aria-pressed=${g.ids.includes(this._item)} @click=${() => this._setItem(g.ids[0])}>${by.get(g.ids[0]).name}<small> · ${i18n.getMessage('{0} items', fmt(g.ids.length))} · ${OVERLAP_KIND[g.kind].label()}</small></button><span></span></li>`)}</ul>
          ${groups.length > 6 ? html`<p class="muted">${i18n.getMessage('and {0} more groups. Focus a category to narrow them.', fmt(groups.length - 6))}</p>` : nothing}</div>` : nothing}
      ${d.id === 'taxonomy' ? this._renderTaxonomyExtras(d) : nothing}
      <div>
        <div class="muted" id="dist">${i18n.getMessage('Where it is, by category')}</div>
        <div class="bars" role="group" aria-labelledby="dist">
          ${topCats.map(c => html`<button class="bar" aria-pressed=${this._cat === c.id} @click=${() => this._setCat(this._cat === c.id ? null : c.id)}>
            <span>${c.title}</span><span>${fmt(c.count)} / ${fmt(c.of)}</span><div class="track"><div class="fill" style="width:${(100 * c.count) / maxCount}%"></div></div></button>`)}
        </div>
        ${dist.length > 4 ? html`<button class="link" @click=${() => (this._allCats = !this._allCats)}>${this._allCats ? i18n.getMessage('Show fewer') : i18n.getMessage('Show all {0} categories', fmt(dist.length))}</button>` : nothing}
      </div>
      </div>
      <div class="focus-foot">
        <button class="primary" ?disabled=${!scope.length} @click=${this._openPrepare}>${d.recommendedAction.label}</button>
        <p class="muted">${d.recommendedAction.summary}</p>
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

  _renderInspector() {
    const n = nodeIndex(this._model).get(this._item);
    if (!n) return nothing;
    return html`<aside class="inspector card" aria-label=${i18n.getMessage('Item details')}>
      <button class="close" aria-label=${i18n.getMessage('Close details')} @click=${() => this._setItem(null)}>✕</button>
      <h2>${n.name}</h2>
      <div class="badges"><span class="badge">${classLabel(n.cls)}</span><span class="badge">${n.active ? i18n.getMessage('Active') : i18n.getMessage('Inactive')}</span></div>
      <h3>${i18n.getMessage('Short description')}</h3>
      <p>${n.shortDescription || html`<em>${i18n.getMessage('None')}</em>`}</p>
      <h3>${i18n.getMessage('Description')}</h3>
      <p>${n.ctx === null ? html`<em role="status">${i18n.getMessage('Loading…')}</em>` : n.descSnippet ? n.descSnippet + (n.descLen > n.descSnippet.length ? '…' : '') : html`<em>${i18n.getMessage('None')}</em>`}</p>
      ${{'ai-readiness': () => this._renderReadinessItem(n), 'form-intelligence': () => this._renderFormItem(n), overlap: () => this._renderOverlapItem(n), taxonomy: () => this._renderTaxonomyItem(n), 'csdm-alignment': () => this._renderCsdmItem(n)}[this._active]()}
      <h3>${i18n.getMessage('Record')}</h3>
      <dl class="kv">
        <dt>${i18n.getMessage('Categories')}</dt><dd>${n.catIds.length ? n.catIds.map(id => this._model.catTitle[id] || id).join(', ') : i18n.getMessage('None')}</dd>
        <dt>${i18n.getMessage('Requests')}</dt><dd>${fmt(n.requests)}</dd>
      </dl>
      <p class="links"><a class="link" href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a></p>
    </aside>`;
  }

  _action(label) {
    return html`<div class="actions"><button class="primary" @click=${this._openPrepare}>${label}</button></div>`;
  }

  _renderFormItem(n) {
    const f = this._disc.form;
    if (!f) return html`<p class="muted" role="status">${i18n.getMessage('Reading form questions…')}</p>`;
    const e = f.byItem.get(n.id);
    if (!e) return html`<h3>${i18n.getMessage('Form')}</h3><p class="muted">${n.active ? i18n.getMessage('This item has no input questions.') : i18n.getMessage('Inactive items are not assessed.')}</p>`;
    const ch = this._choices;
    return html`<h3>${i18n.getMessage('Form')}</h3>
      <dl class="kv"><dt>${i18n.getMessage('Inputs')}</dt><dd>${fmt(e.inputs)}</dd><dt>${i18n.getMessage('Required')}</dt><dd>${fmt(e.required)}</dd><dt>${i18n.getMessage('To review')}</dt><dd>${fmt(e.findings.length)}</dd></dl>
      ${e.findings.length ? html`<h3>${i18n.getMessage('Questions worth reviewing')}</h3>
        <ul class="checks">${e.findings.slice(0, 12).map(x => html`<li><span class="mark fail" aria-hidden="true">✕</span><span><details><summary>${x.variable.label || x.variable.name}${x.shared ? html` <span class="badge">${i18n.getMessage('shared by {0} items', fmt(x.shared))}</span>` : nothing}</summary>
          <ul>${x.issues.map(i => html`<li>${i.text}</li>`)}</ul>
          <dl class="kv"><dt>${i18n.getMessage('Variable name')}</dt><dd>${x.variable.name}</dd><dt>${i18n.getMessage('Type')}</dt><dd>${x.variable.type}</dd><dt>${i18n.getMessage('Required')}</dt><dd>${x.variable.mandatory ? i18n.getMessage('yes') : i18n.getMessage('no')}</dd>
          <dt>${i18n.getMessage('Help text')}</dt><dd>${x.variable.help || x.variable.hint || i18n.getMessage('none')}</dd></dl></details></span></li>`)}</ul>
        ${e.findings.length > 12 ? html`<p class="muted">${i18n.getMessage('and {0} more', fmt(e.findings.length - 12))}</p>` : nothing}`
        : html`<p class="muted">${i18n.getMessage('No question needs review.')}</p>`}
      <p><button class="link" @click=${this._chooseChoices}>${i18n.getMessage('Check answer choices')}</button></p>
      ${ch?.loading ? html`<p class="muted" role="status">${i18n.getMessage('Reading choices…')}</p>` : ch?.error ? html`<div class="note bad">${ch.error}</div>` : ch?.by ? this._renderChoiceFindings(e, ch.by) : nothing}
      ${e.findings.length ? this._action(i18n.getMessage('Improve this form')) : nothing}`;
  }

  _renderChoiceFindings(e, by) {
    const label = id => e.findings.find(f => f.variable.id === id)?.variable.label || id;
    const bad = [...by.entries()].flatMap(([vid, list]) => list.filter(c => c.issues.length).map(c => ({vid, c})));
    return bad.length
      ? html`<div class="note">${i18n.getMessage('{0} answer choice(s) to review.', fmt(bad.length))}<ul>${bad.slice(0, 8).map(({vid, c}) => html`<li>${label(vid)}: “${c.text || c.value}” · ${c.issues.join(' ')}</li>`)}</ul></div>`
      : html`<p class="muted">${i18n.getMessage('No problems found in the answer choices that were read.')}</p>`;
  }

  _renderOverlapItem(n) {
    const o = this._disc.overlap;
    if (!o) return html`<p class="muted" role="status">${i18n.getMessage('Looking for similar items…')}</p>`;
    const g = o.groupOf.get(n.id);
    if (!g) return html`<h3>${i18n.getMessage('Overlap')}</h3><p class="muted">${n.active ? i18n.getMessage('Not in any candidate group.') : i18n.getMessage('Inactive items are not assessed.')}</p>`;
    const by = nodeIndex(this._model);
    return html`<h3>${i18n.getMessage('Candidate group')}</h3>
      <p><span class="badge" style="background:${KIND_COLOR[g.kind]};color:#fff">${OVERLAP_KIND[g.kind].label()}</span> <span class="muted">${OVERLAP_KIND[g.kind].blurb()}</span></p>
      <ul class="checks">${g.ids.map(id => {
        const m = by.get(id);
        return html`<li><span class="mark ${id === n.id ? 'pass' : 'na'}" aria-hidden="true">${id === n.id ? '●' : '○'}</span><span><button class="name" @click=${() => this._setItem(id)}>${m.name}</button>
          <small>${classLabel(m.cls)} · ${m.catIds.map(c => this._model.catTitle[c]).join(', ') || i18n.getMessage('no category')} · ${i18n.getMessage('{0} requests', fmt(m.requests))}</small>
          <small>${m.shortDescription || i18n.getMessage('No short description')}</small></span></li>`;
      })}</ul>
      <h3>${i18n.getMessage('Evidence')}</h3>
      <ul>${g.evidence.map(x => html`<li>${x.text}</li>`)}</ul>
      <p class="muted">${i18n.getMessage('A group is a candidate to compare, not proof of duplication.')}</p>
      ${this._action(i18n.getMessage('Compare this group'))}`;
  }

  _renderTaxonomyItem(n) {
    const t = this._disc.taxonomy;
    if (!t) return html`<p class="muted" role="status">${i18n.getMessage('Checking categories…')}</p>`;
    const f = t.findings.get(n.id) || [];
    return html`<h3>${i18n.getMessage('Discoverability')}</h3>
      ${f.length ? html`<ul class="checks">${f.map(x => html`<li><span class="mark fail" aria-hidden="true">✕</span><span>${TAXONOMY_ISSUE[x.kind]()}<small>${x.text}</small></span></li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('No signal found for this item. You can still ask for a recommendation.')}</p>`}
      <p class="muted">${i18n.getMessage('An item can validly belong to several categories. A recommendation only adds a category; it never removes one.')}</p>
      ${this._action(i18n.getMessage('Recommend a category'))}`;
  }

  _renderCsdmItem(n) {
    const c = this._disc.csdm;
    if (!c) return html`<p class="muted" role="status">${i18n.getMessage('Reading service links…')}</p>`;
    const data = c.data;
    const links = data.byItem.get(n.id) || [];
    const cands = c.candidates.get(n.id) || [];
    return html`<h3>${i18n.getMessage('Service alignment')}</h3>
      ${links.length ? html`<p><span class="badge ok">${i18n.getMessage('Verified link')}</span></p><ul>${links.map(l => html`<li>${data.offeringById.get(l.offering)?.name || l.offering}</li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('No verified link to a service offering. That is normal and not a gap.')}</p>`}
      ${cands.length ? html`<h3>${i18n.getMessage('Suggested, not verified')}</h3><ul>${cands.map(x => html`<li><b>${x.offering.name}</b><br><small class="muted">${x.contained ? i18n.getMessage('The offering’s name appears in the item’s name or summary.') : i18n.getMessage('The names share {0} meaningful words.', String(x.nameShared))}</small></li>`)}</ul>` : nothing}
      ${this._action(i18n.getMessage('Check service alignment'))}`;
  }

  _renderReadinessItem(n) {
    const a = this._readiness?.assessments.get(n.id);
    if (!a) return html`<div class="note">${n.active ? i18n.getMessage('Not assessed yet.') : i18n.getMessage('Inactive items are not offered to agents, so they are not assessed.')}</div>`;
    const v = this._vars?.id === n.id ? this._vars : null;
    return html`<h3>${i18n.getMessage('Deterministic checks')}</h3>
      <ul class="checks">${a.results.map(r => html`<li><span class="mark ${r.state}" aria-hidden="true">${r.state === 'pass' ? '✓' : r.state === 'fail' ? '✕' : '–'}</span>
        <span>${r.check.label()} <span class="vh">${{pass: i18n.getMessage('no gap found'), fail: i18n.getMessage('gap found'), na: i18n.getMessage('not applicable'), pending: i18n.getMessage('pending')}[r.state]}</span>${r.detail ? html`<small>${r.detail}</small>` : r.state === 'na' ? html`<small>${i18n.getMessage('Does not apply to this item type.')}</small>` : nothing}</small></span></li>`)}</ul>
      <h3>${i18n.getMessage('Form')}</h3>
      ${!v || v.loading ? html`<p class="muted" role="status">${i18n.getMessage('Reading this item’s variables…')}</p>`
        : v.error ? html`<div class="note bad">${v.error}</div>`
        : html`<dl class="kv"><dt>${i18n.getMessage('Inputs')}</dt><dd>${fmt(v.review.inputs)}</dd><dt>${i18n.getMessage('Required')}</dt><dd>${fmt(v.review.required)}</dd></dl>
          <p class="muted">${i18n.getMessage('Open the Forms investigation for a full review of this item’s questions.')} <button class="link" @click=${() => this._openDiscovery('form-intelligence')}>${i18n.getMessage('Open Forms')}</button></p>`}
      <h3>${i18n.getMessage('Fulfilment context')}</h3>
      <dl class="kv"><dt>${i18n.getMessage('Owner')}</dt><dd>${n.ctx?.owner ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd>
        <dt>${i18n.getMessage('Group')}</dt><dd>${n.ctx?.group ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd>
        <dt>${i18n.getMessage('Fulfilment reference')}</dt><dd>${n.ctx?.fulfilment ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd></dl>
      <p class="muted">${i18n.getMessage('Shown for context only. It does not count against the item.')}</p>
      <h3>${i18n.getMessage('Semantic assessment')}</h3>
      <cat-semantic-assess item-id=${n.id}></cat-semantic-assess>
      ${this._action(i18n.getMessage('Prepare AI Readiness Improvements'))}`;
  }

  _renderPrepare() {
    if (this._transformFor || this._active === 'ai-readiness') return this._renderTransform();
    if (!this._item) return this._renderChooser();
    return this._renderWorkbench();
  }

  _renderChooser() {
    const by = nodeIndex(this._model);
    const choices = this._scopeIds().slice(0, 12);
    return html`<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="prep-title">
      <div class="eyebrow">${i18n.getMessage('Review workspace')}</div>
      <h2 id="prep-title" tabindex="-1">${i18n.getMessage('Choose an item')}</h2>
      <p class="muted">${i18n.getMessage('This works on one item at a time. Pick one that was flagged.')}</p>
      <ul class="recs">${choices.map(id => html`<li class="rec"><span></span><button class="name" @click=${() => { this._setItem(id); this._openPrepare(); }}>${by.get(id).name}<small> · ${classLabel(by.get(id).cls)}</small></button><span></span></li>`)}</ul>
      <div class="actions"><button class="ghost" @click=${this._closePrepare}>${i18n.getMessage('Close')}</button></div>
    </div></div>`;
  }

  _renderWorkbench() {
    const w = this._wb;
    return html`<div class="scrim"><div class="sheet wide" role="dialog" aria-modal="true" aria-label=${i18n.getMessage('Review workspace')}>
      ${!w || w.loading ? html`<h2 id="prep-title" tabindex="-1">${i18n.getMessage('Preparing')}</h2><p role="status" class="muted">${i18n.getMessage('Reading the real records for this item…')}</p>`
        : w.error ? html`<h2 id="prep-title" tabindex="-1">${i18n.getMessage('Nothing to prepare')}</h2><div class="note info" role="status">${w.error}</div>`
        : html`<cat-workbench .mode=${w.mode} .context=${w.ctx} @cat-workbench:applied=${this._onWorkbenchApplied} @cat-workbench:close=${this._closePrepare} @cat-workbench:explore=${this._openExplore}
            @cat-workbench:improve=${e => { this._setItem(e.detail.itemId); this._transformFor = e.detail.itemId; this._wb = null; this._ensureReadiness(); }}
            @cat-workbench:select=${e => { this._closePrepare(); this._setItem(e.detail.itemId); }}></cat-workbench>`}
      <div class="actions"><button class="ghost" @click=${this._closePrepare}>${i18n.getMessage('Close workspace')}</button></div>
    </div></div>`;
  }

  /** One item, one proposal, one review, one decision. */
  _renderTransform() {
    if (!this._item) return this._renderChooser();
    if (!this._readiness) {
      return html`<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label=${i18n.getMessage('Transform workspace')}><p role="status" class="muted">${i18n.getMessage('Preparing the metadata checks…')}</p>
        <div class="actions"><button class="ghost" @click=${this._closePrepare}>${i18n.getMessage('Close')}</button></div></div></div>`;
    }
    return html`<div class="scrim"><div class="sheet wide" role="dialog" aria-modal="true" aria-label=${i18n.getMessage('Transform workspace')}>
      <cat-transform item-id=${this._item} .readiness=${this._readiness} @cat-transform:applied=${this._onApplied} @cat-transform:close=${this._closePrepare} @cat-transform:explore=${this._openExplore}></cat-transform>
      <div class="actions"><button class="ghost" @click=${this._closePrepare}>${i18n.getMessage('Close workspace')}</button></div>
    </div></div>`;
  }
}
