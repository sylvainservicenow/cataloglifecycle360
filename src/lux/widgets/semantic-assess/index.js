import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const {discoverable, name, description, bestFor, server} = decorators;

/** Assessments already generated this session, so the Transform workspace can show them without another AI call. */
export const assessmentCache = new Map();

@customElement('cat-semantic-assess')
@discoverable(false)
@name('Semantic assessment')
@description('Asks a language model whether one catalog item reads clearly to a conversational agent. Read-only.')
@bestFor('Judging the clarity of a catalog item name and description')
@server('./server.js')
export default class SemanticAssess extends AIUXWidgetElement {
  static properties = {
    itemId: {type: String, attribute: 'item-id'},
    _state: {state: true},
    _result: {state: true},
    _error: {state: true}
  };

  static styles = css`
    :host {
      display: block;
      font-size: 0.85rem;
    }
    .box {
      border: 1px solid rgba(91, 45, 184, 0.3);
      background: #f7f3ff;
      border-radius: 0.9rem;
      padding: 10px 12px;
      display: grid;
      gap: 6px;
    }
    .tag {
      justify-self: start;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
      background: #efe7ff;
      color: #5b2db8;
    }
    button {
      justify-self: start;
      border: 1px solid #5b2db8;
      background: #fff;
      color: #5b2db8;
      font: inherit;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      border-radius: 0.7rem;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 3px solid #2f6fed;
      outline-offset: 2px;
    }
    p,
    ul {
      margin: 0;
    }
    ul {
      padding-left: 1.1rem;
    }
    .err {
      color: #7a1316;
    }
    .muted {
      color: #656462;
      font-size: 0.78rem;
    }
  `;

  constructor() {
    super();
    this.itemId = '';
    this._state = 'idle';
    this._result = null;
    this._error = '';
  }

  willUpdate(changed) {
    if (changed.has('itemId')) {
      this._state = 'idle';
      this._result = null;
      this._error = '';
      const cached = assessmentCache.get(this.itemId);
      if (cached) {
        this._result = cached;
        this._state = 'done';
      }
    }
  }

  async _run() {
    this._state = 'loading';
    try {
      const r = await this.server.get({action: 'assess', itemId: this.itemId});
      if (r?.isError || !r?.assessment) {
        this._error = r?.errorMessage || i18n.getMessage('No result was returned.');
        this._state = 'error';
      } else {
        this._result = r;
        assessmentCache.set(this.itemId, r);
        this._state = 'done';
      }
    } catch (e) {
      this._error = e?.message || i18n.getMessage('The assessment could not be reached from here.');
      this._state = 'error';
    }
  }

  render() {
    const r = this._result;
    return html`<div class="box" aria-live="polite">
      <span class="tag">${i18n.getMessage('AI-generated · needs your judgement')}</span>
      ${this._state === 'idle' ? html`<p>${i18n.getMessage('Ask a language model whether this item reads clearly to a conversational agent. Nothing is saved.')}</p>
          <button @click=${this._run}>${i18n.getMessage('Run semantic assessment')}</button>` : nothing}
      ${this._state === 'loading' ? html`<p role="status">${i18n.getMessage('Asking the model… about 5 seconds.')}</p>` : nothing}
      ${this._state === 'error' ? html`<p class="err" role="alert">${this._error}</p><p class="muted">${i18n.getMessage('The deterministic checks above remain the assessment.')}</p>
          <button @click=${this._run}>${i18n.getMessage('Try again')}</button>` : nothing}
      ${this._state === 'done' && r
        ? html`<p><b>${i18n.getMessage('Clarity')}:</b> ${r.assessment.clarity}</p>
            <p><b>${i18n.getMessage('Intent the model understood')}:</b> ${r.assessment.intent}</p>
            ${r.assessment.issues.length ? html`<ul>${r.assessment.issues.map(x => html`<li>${x}</li>`)}</ul>` : html`<p>${i18n.getMessage('No wording issues reported.')}</p>`}
            ${r.assessment.suggestion ? html`<p><b>${i18n.getMessage('Suggested short description (not applied)')}:</b> ${r.assessment.suggestion}</p>` : nothing}
            <p class="muted">${r.provider} ${r.model} · ${Math.round(r.latencyMs / 100) / 10}s</p>`
        : nothing}
    </div>`;
  }
}
