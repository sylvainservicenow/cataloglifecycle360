import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {classLabel, loadCatalog, loadItemVariables, loadTextFacts, loadVariableStats} from '../../lib/catalog-data.js';
import {classBreakdown, distribution, nodeIndex, scopedIds} from '../../lib/discovery.js';
import {buildVisualEnrichment, visualBrief} from '../../lib/investigations/visual-enrichment.js';
import {assessVariables, buildAiReadiness, DIMENSIONS, failedCount} from '../../lib/investigations/ai-readiness.js';
import {buildCsdmFoundation} from '../../lib/investigations/csdm.js';
import {checkCapability} from '../../lib/capabilities.js';
import '../../components/cat-universe.js';
import '../../widgets/semantic-assess/index.js';

const ACCENT = '#F2812F';
const SOFT = '#D5DEEA';
const NEUTRAL = '#B8C7DC';
const fmt = n => new Intl.NumberFormat().format(n);
const TABS = ['criteria', 'evidence', 'records', 'steps'];

@customElement('x-snc-catalogintel-investigate-page')
export default class InvestigatePage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'An investigation workspace showing catalog items affected by one discovery (visual enrichment, AI readiness or CSDM alignment) in the catalog universe',
    bestFor: 'When the user wants to investigate catalog quality, open a discovery, focus a category or item, or prepare an improvement'
  };

  /* Conversational tools. They only move the view; nothing here reads or writes records beyond what the page already shows. */
  static client_tools = {
    open_investigation: {
      description: 'Open a discovery: visual-enrichment, ai-readiness or csdm-alignment',
      arguments: [{name: 'id', description: 'visual-enrichment, ai-readiness or csdm-alignment', type: 'string', required: true}],
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
          const n = this._model.nodes.find(x => x.name.toLowerCase() === String(name).toLowerCase()) || this._model.nodes.find(x => x.name.toLowerCase().includes(String(name).toLowerCase()));
          if (!n) throw new Error(`No item matches "${name}"`);
          this._setItem(n.id);
        });
      }
    },
    explain_discovery: {
      description: 'Open the explanation of the current discovery and return its summary, method and evidence',
      arguments: [],
      definition: async function () {
        return this._tool(() => {
          this._drawer = true;
          this._tab = 'criteria';
          const d = this._current();
          return {title: d.title, summary: d.summary, classification: d.method.classification, severity: d.severity, scopeCount: this._scopeIds().length, version: d.version};
        });
      }
    },
    prepare_action: {
      description: 'Open the preparation workspace for the current discovery. It prepares proposals for review and changes no records.',
      arguments: [],
      definition: async function () {
        return this._tool(() => this._openPrepare());
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
    this._active = 'visual-enrichment';
    this._cat = null;
    this._item = null;
    this._cls = '';
    this._drawer = false;
    this._tab = 'criteria';
    this._prepare = false;
    this._picked = new Set();
    this._caps = null;
    this._vars = null;
    this._allCats = false;
    this._visual = null;
    this._csdm = null;
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
    if (this._model && ['_active', '_cat', '_item', '_cls', '_readiness'].some(k => changed.has(k))) this._pushContext();
    if (changed.has('_prepare') && this._prepare) this.renderRoot.querySelector('.sheet h2')?.focus();
    if (changed.has('_prepare') && !this._prepare && changed.get('_prepare')) this._opener?.focus?.();
  }

  /* ---------- data ---------- */
  async _load() {
    try {
      const model = await loadCatalog();
      this._visual = buildVisualEnrichment(model);
      this._csdm = buildCsdmFoundation(model);
      this._model = model;
      // Heavier data is fetched only when the user's path needs it.
      if (this._active === 'ai-readiness') this._ensureReadiness();
      if (this._item) this._wantText();
    } catch (e) {
      this._error = e?.message || 'error';
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
    if (this._active === 'ai-readiness') return this._readiness?.discovery || null;
    if (this._active === 'csdm-alignment') return this._csdm;
    return this._visual;
  }

  _scopeIds(withCategory = true) {
    const d = this._current();
    if (!d) return [];
    return scopedIds(d, this._model, {categoryId: withCategory ? this._cat : null, cls: this._cls || null});
  }

  /* ---------- URL state ---------- */
  _readUrl(initial = false) {
    const q = new URLSearchParams(window.location.search);
    const d = q.get('d');
    if (['visual-enrichment', 'ai-readiness', 'csdm-alignment'].includes(d)) this._active = d;
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
    if (!['visual-enrichment', 'ai-readiness', 'csdm-alignment'].includes(id)) throw new Error(`Unknown investigation "${id}"`);
    this._active = id;
    this._item = null;
    this._vars = null;
    this._picked = new Set();
    this._syncUrl();
    if (id === 'ai-readiness') this._ensureReadiness();
  }

  _setCat(id) {
    this._cat = id || null;
    this._allCats = false;
    this._syncUrl();
  }

  _setItem(id) {
    this._item = id || null;
    this._vars = null;
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
    this.setAiContext?.({
      page: 'Investigate',
      discovery: d ? {id: d.id, title: d.title, classification: d.method.classification, severity: d.severity.level, affectedInScope: this._scopeIds().length} : null,
      focusedCategory: this._cat ? this._model.clusters.find(c => c.id === this._cat)?.title : null,
      itemTypeFilter: this._cls || null,
      selectedItem: item ? {id: item.id, name: item.name} : null,
      availableInvestigations: ['visual-enrichment', 'ai-readiness', 'csdm-alignment']
    });
  }

  /* ---------- universe wiring ---------- */
  _markers() {
    const ids = new Set(this._scopeIds(false));
    const m = {};
    if (this._active === 'visual-enrichment') {
      ids.forEach(id => (m[id] = ACCENT));
      return {
        markers: m,
        legend: [
          {color: ACCENT, label: i18n.getMessage('No icon or picture · {0}', fmt(ids.size))},
          {color: SOFT, label: i18n.getMessage('Has a visual, or outside the filter')}
        ]
      };
    }
    if (this._active === 'ai-readiness' && this._readiness) {
      const colors = ['#0E9F8E', '#F2B134', '#F2812F', '#E5484D'];
      const tally = [0, 0, 0, 0];
      for (const n of this._model.nodes) {
        if (!n.active) continue;
        if (this._cls && n.cls !== this._cls) continue;
        const k = Math.min(3, failedCount(this._readiness, n.id));
        m[n.id] = colors[k];
        tally[k]++;
      }
      return {
        markers: m,
        legend: [
          {color: colors[0], label: i18n.getMessage('No failed check · {0}', fmt(tally[0]))},
          {color: colors[1], label: i18n.getMessage('1 failed · {0}', fmt(tally[1]))},
          {color: colors[2], label: i18n.getMessage('2 failed · {0}', fmt(tally[2]))},
          {color: colors[3], label: i18n.getMessage('3 or more · {0}', fmt(tally[3]))},
          {color: SOFT, label: i18n.getMessage('Inactive, not assessed · {0}', fmt(this._model.nodes.filter(n => !n.active).length))}
        ]
      };
    }
    if (this._active === 'csdm-alignment') {
      this._model.nodes.forEach(n => (m[n.id] = NEUTRAL));
      return {markers: m, legend: [{color: NEUTRAL, label: i18n.getMessage('Catalog item. No native link to offerings, so nothing is marked as missing.')}]};
    }
    return {markers: null, legend: []};
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
  _openPrepare(e) {
    this._opener = e?.currentTarget || this._opener;
    this._prepare = true;
    if (this._active === 'visual-enrichment' && !this._caps) {
      checkCapability('image').then(image => (this._caps = {image}));
    }
  }

  _prepIds() {
    return this._picked.size ? [...this._picked] : this._item ? [this._item] : this._scopeIds();
  }

  _togglePick(id) {
    const s = new Set(this._picked);
    s.has(id) ? s.delete(id) : s.add(id);
    this._picked = s;
  }

  async _copyBriefs(ids) {
    const by = nodeIndex(this._model);
    const text = ids.slice(0, 200).map(id => `${by.get(id).name}\n${visualBrief(by.get(id)).prompt}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      this._copied = true;
    } catch {
      this._copied = false;
    }
    this.requestUpdate();
  }

  _onKey(e) {
    if (e.key === 'Escape' && this._prepare) {
      e.stopPropagation();
      this._prepare = false;
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
            <cat-universe investigate .markers=${markers} .legendItems=${legend} focus-id=${this._cat ?? ''} selected-id=${this._item ?? ''}
              @cat-universe:focus=${this._onUniFocus} @cat-universe:select=${this._onUniSelect}></cat-universe>
            ${this._item ? this._renderInspector() : nothing}
            ${this._prepare ? this._renderPrepare() : nothing}
          </div>
          ${this._renderDrawer()}
        </div>
      </div>`;
  }

  _renderFocus() {
    const d = this._current();
    const loadingReadiness = this._active === 'ai-readiness' && !d;
    return html`<section class="focus card" aria-label=${i18n.getMessage('Discovery')}>
      <div class="switch" role="group" aria-label=${i18n.getMessage('Choose an investigation')}>
        ${[['visual-enrichment', i18n.getMessage('Visuals')], ['ai-readiness', i18n.getMessage('AI readiness')], ['csdm-alignment', i18n.getMessage('CSDM')]].map(
          ([id, label]) => html`<button aria-pressed=${this._active === id} @click=${() => this._openDiscovery(id)}>${label}</button>`
        )}
      </div>
      ${loadingReadiness ? html`<div role="status" class="muted">${i18n.getMessage('Reading variable counts and assessing items…')}</div>` : d ? this._renderDiscovery(d) : nothing}
    </section>`;
  }

  _renderDiscovery(d) {
    const scope = this._scopeIds();
    const all = this._scopeIds(false);
    const foundation = d.status === 'foundation';
    const total = d.id === 'ai-readiness' ? d.stats.active : this._model.nodes.length;
    const dist = distribution(this._model, this._cls ? all : d.affectedIds);
    const topCats = this._allCats ? dist : dist.slice(0, 4);
    const maxCount = dist[0]?.count || 1;
    const types = classBreakdown(this._model, d.affectedIds);
    return html`
      <div class="focus-body">
      <div class="badges">
        <span class="badge ${d.method.classification === 'ai' ? 'ai' : 'det'}">${d.method.classification === 'ai' ? i18n.getMessage('AI assessment') : i18n.getMessage('Deterministic check')}</span>
        ${foundation ? html`<span class="badge">${i18n.getMessage('Foundation only')}</span>` : html`<span class="badge ${d.severity.level}">${i18n.getMessage('Severity: {0}', this._sev(d.severity.level))}</span>`}
      </div>
      <div class="eyebrow">${d.id === 'ai-readiness' ? i18n.getMessage('Discovery · AI readiness') : d.id === 'csdm-alignment' ? i18n.getMessage('Discovery · CSDM') : i18n.getMessage('Discovery · Visual enrichment')}</div>
      <h1>${d.title}</h1>
      ${foundation ? nothing : html`<div class="count"><b>${fmt(scope.length)}</b><span>${this._cat || this._cls ? i18n.getMessage('in this scope, of {0} affected', fmt(d.affectedIds.length)) : i18n.getMessage('of {0} items', fmt(total))}</span></div>`}
      <p>${d.summary}</p>
      <p class="muted">${d.why}</p>
      ${d.id === 'ai-readiness' && this._readinessError ? html`<div class="note" role="status">${i18n.getMessage('Variable counts could not be read ({0}). The form check is shown as pending, not as passed.', this._readinessError)}</div>` : nothing}
      ${foundation ? html`<div class="note info">${i18n.getMessage('Service offerings exist but items do not reference them natively. Nothing is flagged; later phases will propose candidate associations for your review.')}</div>` : html`
        <div class="scope" role="group" aria-label=${i18n.getMessage('Narrow the investigation')}>
          ${this._cat ? html`<button class="chip" @click=${() => this._setCat(null)} aria-label=${i18n.getMessage('Clear category {0}', this._model.clusters.find(c => c.id === this._cat)?.title)}>${this._model.clusters.find(c => c.id === this._cat)?.title} ✕</button>` : nothing}
          <label class="vh" for="cls">${i18n.getMessage('Item type')}</label>
          <select id="cls" class="chip" .value=${this._cls} @change=${e => this._setCls(e.target.value)}>
            <option value="">${i18n.getMessage('All item types')}</option>
            ${types.map(([c, n]) => html`<option value=${c} ?selected=${this._cls === c}>${classLabel(c)} · ${fmt(n)}</option>`)}
          </select>
          ${this._picked.size ? html`<button class="chip" @click=${() => (this._picked = new Set())}>${i18n.getMessage('{0} chosen', fmt(this._picked.size))} ✕</button>` : nothing}
        </div>
        <div>
          <div class="muted" id="dist">${i18n.getMessage('Where it is, by category')}</div>
          <div class="bars" role="group" aria-labelledby="dist">
            ${topCats.map(c => html`<button class="bar" aria-pressed=${this._cat === c.id} @click=${() => this._setCat(this._cat === c.id ? null : c.id)}>
              <span>${c.title}</span><span>${fmt(c.count)} / ${fmt(c.of)}</span><div class="track"><div class="fill" style="width:${(100 * c.count) / maxCount}%"></div></div></button>`)}
          </div>
          ${dist.length > 4 ? html`<button class="link" @click=${() => (this._allCats = !this._allCats)}>${this._allCats ? i18n.getMessage('Show fewer') : i18n.getMessage('Show all {0} categories', fmt(dist.length))}</button>` : nothing}
        </div>`}
      </div>
      <div class="focus-foot">
        <button class="primary" ?disabled=${foundation || !scope.length} @click=${this._openPrepare}>${d.recommendedAction.label}</button>
        <p class="muted">${d.recommendedAction.summary}</p>
        <button class="link" aria-expanded=${this._drawer} @click=${() => (this._drawer = !this._drawer)}>${this._drawer ? i18n.getMessage('Hide the reasoning') : i18n.getMessage('Why this finding?')}</button>
      </div>`;
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
          <h3>${i18n.getMessage('Severity')}</h3><p>${d.severity.rationale}</p>
          ${d.id === 'ai-readiness' ? html`<h3>${i18n.getMessage('Failed checks, active items')}</h3><ul>${d.stats.perCheck.map(p => html`<li>${p.check.label()}: <b>${fmt(p.failed)}</b></li>`)}</ul>` : nothing}
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
          <div class="note info">${i18n.getMessage('Every step that would change a record needs your explicit approval and is not part of this phase. This page reads records only.')}</div>`;
    }
  }

  _renderInspector() {
    const n = nodeIndex(this._model).get(this._item);
    if (!n) return nothing;
    const d = this._current();
    return html`<aside class="inspector card" aria-label=${i18n.getMessage('Item details')}>
      <button class="close" aria-label=${i18n.getMessage('Close details')} @click=${() => this._setItem(null)}>✕</button>
      <h2>${n.name}</h2>
      <div class="badges"><span class="badge">${classLabel(n.cls)}</span><span class="badge">${n.active ? i18n.getMessage('Active') : i18n.getMessage('Inactive')}</span></div>
      <h3>${i18n.getMessage('Short description')}</h3>
      <p>${n.shortDescription || html`<em>${i18n.getMessage('None')}</em>`}</p>
      <h3>${i18n.getMessage('Description')}</h3>
      <p>${n.ctx === null ? html`<em role="status">${i18n.getMessage('Loading…')}</em>` : n.descSnippet ? n.descSnippet + (n.descLen > n.descSnippet.length ? '…' : '') : html`<em>${i18n.getMessage('None')}</em>`}</p>
      ${this._active === 'ai-readiness' ? this._renderReadinessItem(n) : this._active === 'visual-enrichment' ? this._renderVisualItem(n, d) : nothing}
      <h3>${i18n.getMessage('Record')}</h3>
      <dl class="kv">
        <dt>${i18n.getMessage('Categories')}</dt><dd>${n.catIds.length ? n.catIds.map(id => this._model.catTitle[id] || id).join(', ') : i18n.getMessage('None')}</dd>
        <dt>${i18n.getMessage('Requests')}</dt><dd>${fmt(n.requests)}</dd>
      </dl>
      <p style="margin-top:8px"><a class="link" href=${`/sc_cat_item.do?sys_id=${n.id}`} target="_blank" rel="noopener noreferrer">${i18n.getMessage('Open record')} ↗<span class="vh"> ${i18n.getMessage('(opens in a new tab)')}</span></a></p>
    </aside>`;
  }

  _renderVisualItem(n) {
    const b = visualBrief(n);
    return html`<h3>${i18n.getMessage('Visual')}</h3>
      <ul class="checks"><li><span class="mark ${n.flags.icon ? 'pass' : 'fail'}" aria-hidden="true">${n.flags.icon ? '✓' : '✕'}</span><span>${i18n.getMessage('Icon or picture')} · ${n.flags.icon ? i18n.getMessage('present') : i18n.getMessage('missing')}</span></li></ul>
      ${n.flags.icon ? nothing : html`<h3>${i18n.getMessage('Visual brief')}</h3><p class="muted">${i18n.getMessage('Built from this record only (not AI output).')}</p><p>${b.prompt}</p>`}`;
  }

  _renderReadinessItem(n) {
    const a = this._readiness?.assessments.get(n.id);
    if (!a) return html`<div class="note">${n.active ? i18n.getMessage('Not assessed yet.') : i18n.getMessage('Inactive items are not offered to agents, so they are not assessed.')}</div>`;
    const v = this._vars?.id === n.id ? this._vars : null;
    return html`<h3>${i18n.getMessage('Deterministic checks')}</h3>
      <ul class="checks">${a.results.map(r => html`<li><span class="mark ${r.state}" aria-hidden="true">${r.state === 'pass' ? '✓' : r.state === 'fail' ? '✕' : '–'}</span>
        <span>${r.check.label()} <span class="vh">${r.state}</span>${r.detail ? html`<small>${r.detail}</small>` : r.state === 'na' ? html`<small>${i18n.getMessage('Does not apply to this item type.')}</small>` : nothing}</small></span></li>`)}</ul>
      <h3>${i18n.getMessage('Form')}</h3>
      ${!v || v.loading ? html`<p class="muted" role="status">${i18n.getMessage('Reading this item’s variables…')}</p>`
        : v.error ? html`<div class="note bad">${v.error}</div>`
        : html`<dl class="kv"><dt>${i18n.getMessage('Inputs')}</dt><dd>${fmt(v.review.inputs)}</dd><dt>${i18n.getMessage('Required')}</dt><dd>${fmt(v.review.required)}</dd></dl>
          ${v.review.findings.length ? html`<ul class="checks" style="margin-top:6px">${v.review.findings.slice(0, 6).map(f => html`<li><span class="mark fail" aria-hidden="true">✕</span><span>${f.variable.label || f.variable.name}<small>${f.issues.join(' ')}</small></span></li>`)}</ul>
            ${v.review.findings.length > 6 ? html`<p class="muted">${i18n.getMessage('and {0} more', fmt(v.review.findings.length - 6))}</p>` : nothing}`
            : html`<p class="muted">${v.review.inputs ? i18n.getMessage('No label or help-text gaps found in this item’s variables.') : i18n.getMessage('This item has no input variables.')}</p>`}
          ${v.review.ambiguous.length ? html`<div class="note">${i18n.getMessage('Repeated labels: {0}', v.review.ambiguous.map(x => `${x.label} (${x.count})`).join(', '))}</div>` : nothing}`}
      <h3>${i18n.getMessage('Fulfilment context')}</h3>
      <dl class="kv"><dt>${i18n.getMessage('Owner')}</dt><dd>${n.ctx.owner ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd>
        <dt>${i18n.getMessage('Group')}</dt><dd>${n.ctx.group ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd>
        <dt>${i18n.getMessage('Fulfilment reference')}</dt><dd>${n.ctx.fulfilment ? i18n.getMessage('set') : i18n.getMessage('not set')}</dd></dl>
      <p class="muted">${i18n.getMessage('Shown for context only. It does not count against the item.')}</p>
      <h3>${i18n.getMessage('CSDM')}</h3><p class="muted">${i18n.getMessage('Assessed separately; no service association is expected here.')}</p>
      <h3>${i18n.getMessage('Semantic assessment')}</h3>
      <cat-semantic-assess item-id=${n.id}></cat-semantic-assess>`;
  }

  _renderPrepare() {
    const d = this._current();
    const ids = this._prepIds();
    const by = nodeIndex(this._model);
    const isVisual = d.id === 'visual-enrichment';
    return html`<div class="scrim">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="prep-title">
        <div class="eyebrow">${i18n.getMessage('Preparation · nothing is changed')}</div>
        <h2 id="prep-title" tabindex="-1">${d.recommendedAction.label}</h2>
        <div class="note info">${i18n.getMessage('This prepares proposals for your review. No catalog record is created or modified here, and nothing is applied without a later, explicit approval.')}</div>
        <div class="step">
          <h3>1 · ${i18n.getMessage('Scope')}</h3>
          <p>${i18n.getMessage('{0} item(s) will be prepared.', fmt(ids.length))} ${this._picked.size ? i18n.getMessage('You chose these items.') : this._item ? i18n.getMessage('The selected item.') : i18n.getMessage('Everything in the current scope.')}</p>
          <ul>${ids.slice(0, 6).map(id => html`<li>${by.get(id).name}</li>`)}${ids.length > 6 ? html`<li class="muted">${i18n.getMessage('and {0} more', fmt(ids.length - 6))}</li>` : nothing}</ul>
        </div>
        ${isVisual ? this._renderPrepareVisual(ids) : this._renderPrepareReadiness(ids)}
        <div class="step">
          <h3>${isVisual ? '4' : '4'} · ${i18n.getMessage('Approval')}</h3>
          <p>${i18n.getMessage('Applying approved changes to catalog records is a later phase. It will always show you exactly what changes before anything is written.')}</p>
          <div class="actions"><button class="ghost" disabled>${i18n.getMessage('Approve and apply (not available in this phase)')}</button></div>
        </div>
        <div class="actions"><button class="primary" @click=${() => (this._prepare = false)}>${i18n.getMessage('Close')}</button></div>
      </div></div>`;
  }

  _renderPrepareVisual(ids) {
    const c = this._caps?.image;
    const by = nodeIndex(this._model);
    return html`<div class="step">
        <h3>2 · ${i18n.getMessage('Can visuals be generated?')}</h3>
        ${!c ? html`<p role="status" class="muted">${i18n.getMessage('Checking the image-generation capability…')}</p>`
          : c.state === 'no-definition' ? html`<div class="note bad">${i18n.getMessage('Not available on this instance. The “{0}” capability exists, but it has {1} executable definitions, so it cannot produce images. A test call on {2} was rejected: “{3}”.', c.name, String(c.definitions), c.verification.date, 'Plan invalid or not created')}</div>
            <p class="muted">${i18n.getMessage('To enable it, an administrator would need to configure a provider definition for this capability (or approve another image service). Nothing was changed to find this out.')}</p>`
          : c.state === 'defined' ? html`<div class="note">${i18n.getMessage('A definition exists, but it has not been verified to work, so no generation is offered yet.')}</div>`
          : html`<div class="note">${i18n.getMessage('The capability could not be checked ({0}).', c.error || c.state)}</div>`}
      </div>
      <div class="step">
        <h3>3 · ${i18n.getMessage('Proposed visuals for review')}</h3>
        <p>${i18n.getMessage('No visuals have been generated, so there is nothing to review. Each proposal will appear here with approve, reject and regenerate controls.')}</p>
        <p class="muted">${i18n.getMessage('The brief below is what a generator would receive. It is built from each record and is not AI output.')}</p>
        ${ids.slice(0, 3).map(id => html`<details><summary>${by.get(id).name}</summary><p>${visualBrief(by.get(id)).prompt}</p></details>`)}
        <div class="actions"><button class="ghost" @click=${() => this._copyBriefs(ids)}>${this._copied ? i18n.getMessage('Copied') : i18n.getMessage('Copy briefs')}</button></div>
      </div>`;
  }

  _renderPrepareReadiness(ids) {
    const by = nodeIndex(this._model);
    const items = ids.slice(0, 4);
    return html`<div class="step">
        <h3>2 · ${i18n.getMessage('What to improve, from the deterministic checks')}</h3>
        ${items.map(id => {
          const n = by.get(id);
          const a = this._readiness.assessments.get(id);
          return html`<details open><summary>${n.name}</summary>
            ${a?.failed.length ? html`<ul>${a.failed.map(f => html`<li><b>${f.check.label()}</b>: ${f.detail}</li>`)}</ul>` : html`<p class="muted">${i18n.getMessage('No failed checks.')}</p>`}
            <div class="cmp"><div><b>${i18n.getMessage('Today')}</b><br>${n.shortDescription || html`<em>${i18n.getMessage('No short description')}</em>`}</div>
              <div class="after"><b>${i18n.getMessage('Proposed wording')}</b><br><cat-semantic-assess item-id=${id}></cat-semantic-assess></div></div></details>`;
        })}
        ${ids.length > items.length ? html`<p class="muted">${i18n.getMessage('and {0} more item(s)', fmt(ids.length - items.length))}</p>` : nothing}
      </div>
      <div class="step">
        <h3>3 · ${i18n.getMessage('AI-drafted wording for review')}</h3>
        <div class="note info">${i18n.getMessage('Each item above can be sent to the language model on request (Generic Prompt, one call per item). Its suggestions are labelled as AI-generated and are never applied: approving and applying changes is a later phase.')}</div>
      </div>`;
  }
}
