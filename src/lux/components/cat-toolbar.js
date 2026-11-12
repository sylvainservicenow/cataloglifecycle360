/* The options are rendered by a nested template inside the listbox <ul> below, which the static rule cannot see. */
/* eslint-disable @servicenow/aiux-a11y/option-requires-listbox-parent */
import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {classLabel} from '../lib/catalog-data.js';
import {LENSES} from './cat-universe.js';
import './cat-appnav.js';

/**
 * One toolbar for Explore: [Home | Explore] [lenses] [search]. It only reports what the
 * person chose (lens, query, picked item); the workspace owns the state and the universe.
 */
@customElement('cat-toolbar')
export default class CatToolbar extends AIUXElement {
  static properties = {
    current: {type: String},
    lens: {type: String},
    model: {attribute: false},
    _q: {state: true},
    _open: {state: true},
    _i: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 10px 14px;
      flex-wrap: wrap;
      padding: 3px;
    }
    cat-appnav {
      flex: none;
    }
    .lenses {
      display: inline-flex;
      align-items: stretch;
      gap: 2px;
      height: 40px;
      box-sizing: border-box;
      padding: 3px;
      border-radius: 999px;
      background: rgba(3, 45, 66, 0.06);
      overflow-x: auto;
      max-width: 100%;
      scrollbar-width: none;
    }
    .lens-btn {
      border: 0;
      background: transparent;
      color: #4d4c4a;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0 0.95rem;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.25s, color 0.25s;
    }
    .lens-btn:hover {
      background: rgba(255, 255, 255, 0.6);
      color: #032d42;
    }
    .lens-btn[aria-pressed='true'] {
      background: #fff;
      color: #032d42;
      box-shadow: 0 1px 4px rgba(3, 45, 66, 0.18);
    }
    .search {
      position: relative;
      margin-left: auto;
      flex: 0 1 280px;
      min-width: 160px;
    }
    .search input {
      width: 100%;
      height: 40px;
      box-sizing: border-box;
      border: 1px solid rgba(3, 45, 66, 0.14);
      border-radius: 999px;
      padding: 0 1rem;
      font: inherit;
      font-size: 0.85rem;
      background: #fff;
      color: #1b1b1b;
    }
    .search input:focus-visible {
      outline: 2px solid #2f6fed;
      outline-offset: -2px;
      border-color: #2f6fed;
    }
    .lens-btn:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: -2px;
    }
    .results {
      position: absolute;
      z-index: 20;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      margin: 0;
      padding: 4px;
      list-style: none;
      background: #fff;
      border: 1px solid rgba(3, 45, 66, 0.12);
      border-radius: 1rem;
      box-shadow: 0 12px 32px rgba(3, 45, 66, 0.18);
    }
    .results[hidden] {
      display: none;
    }
    .opt {
      padding: 8px 10px;
      border-radius: 0.7rem;
      cursor: pointer;
      color: #032d42;
      font-size: 0.85rem;
    }
    .opt.on {
      background: #e6efff;
      box-shadow: inset 3px 0 0 #2f6fed;
    }
    .opt small {
      display: block;
      color: #656462;
    }
    .none {
      padding: 10px;
      font-size: 0.85rem;
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
    @media (prefers-reduced-motion: reduce) {
      .lens-btn {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.current = 'explore';
    this.lens = 'overview';
    this.model = null;
    this._q = '';
    this._open = false;
    this._i = -1;
    this._matchCache = {q: '', list: []};
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {detail, bubbles: true, composed: true}));
  }

  /** Filters the catalog model that is already in memory; no request is made per keystroke. */
  _matches() {
    const q = this._q.trim().toLowerCase();
    if (q.length < 2 || !this.model) return [];
    if (this._matchCache.q === q && this._matchCache.model === this.model) return this._matchCache.list;
    const list = this.model.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 8);
    this._matchCache = {q, model: this.model, list};
    return list;
  }

  _input(e) {
    this._q = e.target.value;
    this._open = true;
    this._i = this._matches().length ? 0 : -1;
    this._emit('cat-toolbar:query', {q: this._q});
  }

  _pick(n) {
    this._open = false;
    this._i = -1;
    this._q = n.name;
    this._emit('cat-toolbar:query', {q: ''});
    this._emit('cat-toolbar:pick', {id: n.id});
  }

  _key(e) {
    const list = this._open ? this._matches() : [];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this._open) {
        this._open = true;
        this._i = this._matches().length ? 0 : -1;
        return;
      }
      if (!list.length) return;
      this._i = e.key === 'ArrowDown' ? (this._i + 1) % list.length : (this._i - 1 + list.length) % list.length;
    } else if (e.key === 'Enter') {
      if (list.length && this._i >= 0) {
        e.preventDefault();
        this._pick(list[this._i]);
      }
    } else if (e.key === 'Escape' && this._open) {
      e.stopPropagation();
      this._open = false;
      this._i = -1;
    }
  }

  updated(changed) {
    if (changed.has('_i') && this._i >= 0) this.renderRoot.querySelector(`#opt-${this._i}`)?.scrollIntoView?.({block: 'nearest'});
  }

  render() {
    const q = this._q.trim();
    const matches = this._open ? this._matches() : [];
    const empty = this._open && q.length >= 2 && !matches.length;
    const expanded = matches.length > 0 || empty;
    return html`<div class="bar">
      <cat-appnav bare current=${this.current}></cat-appnav>
      <div class="lenses" role="group" aria-label=${i18n.getMessage('Intelligence lenses')}>
        ${LENSES.map(l => html`<button class="lens-btn" aria-pressed=${this.lens === l.id} title=${l.hint()} @click=${() => this._emit('cat-toolbar:lens', {lens: l.id})}>${l.label()}</button>`)}
      </div>
      <div class="search">
        <input type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded=${expanded ? 'true' : 'false'} aria-controls="results"
          aria-activedescendant=${matches.length && this._i >= 0 ? `opt-${this._i}` : ''}
          placeholder=${i18n.getMessage('Search the catalog…')} aria-label=${i18n.getMessage('Search catalog items')} .value=${this._q}
          @input=${this._input} @keydown=${this._key} @focus=${() => { if (this._q.trim().length >= 2) this._open = true; }}
          @blur=${() => setTimeout(() => (this._open = false), 150)}>
        <ul id="results" class="results" role="listbox" tabindex="-1" aria-label=${i18n.getMessage('Matching catalog items')} ?hidden=${!expanded}>
          ${matches.map((n, k) => html`<li id=${`opt-${k}`} role="option" tabindex="-1" aria-selected=${k === this._i ? 'true' : 'false'} class="opt ${k === this._i ? 'on' : ''}"
            @mousedown=${e => e.preventDefault()} @click=${() => this._pick(n)} @mousemove=${() => (this._i = k)}>${n.name}<small>${classLabel(n.cls)}</small></li>`)}
          ${empty ? html`<li class="none" role="presentation">${i18n.getMessage('No catalog item matches “{0}”.', q)}</li>` : nothing}
        </ul>
        <span class="vh" role="status" aria-live="polite">${empty ? i18n.getMessage('No catalog item matches') : matches.length ? i18n.getMessage('{0} results. Use the arrow keys to choose.', String(matches.length)) : ''}</span>
      </div>
    </div>`;
  }
}
