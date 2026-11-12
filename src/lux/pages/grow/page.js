import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, withWidgetContext, decorators} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {OTTO_TOOLS, ottoContext} from '../../lib/otto.js';
import '../../components/cat-appnav.js';
import '../../components/cat-grow.js';

// application-local: this page is only reachable through this application's own experience
const {global} = decorators;

/** Grow: the AI Catalog Assembly Line experience (simulated until the real line is connected). */
@customElement('x-snc-catlife360-grow-page')
@global(false)
export default class GrowPage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'The Grow area of Catalog Lifecycle 360: a simulated AI Catalog Assembly Line that turns a service owner intake into a governed draft catalog item for human review. It creates no catalog records.',
    bestFor: 'When the user wants to propose or create a new catalog item or record producer, or see how a proposal is checked against the existing catalog'
  };

  static client_tools = OTTO_TOOLS;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      padding-bottom: 72px;
      container-type: inline-size;
    }
  `;

  firstUpdated() {
    document.title = i18n.getMessage('Grow');
    ottoContext(this, {page: 'Grow'}).then(c => this.setAiContext(c));
  }

  render() {
    return html`<div class="mx-auto flex max-w-7xl flex-col gap-4">
      <cat-appnav current="grow"></cat-appnav>
      <cat-grow></cat-grow>
    </div>`;
  }
}
