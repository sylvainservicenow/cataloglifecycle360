import {html, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';

/**
 * Legacy deep link (/investigate?d=…). Investigations now live inside Explore, so this route
 * only hands the same parameters to Explore, which opens the matching intelligence mode.
 */
// application-local: this page is only reachable through this application's own experience
const {global} = decorators;

@customElement('x-snc-catlife360-investigate-page')
@global(false)
export default class InvestigatePage extends AIUXElement {
  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    const q = new URLSearchParams(window.location.search);
    if (!q.get('d') && !q.get('highlight')) q.set('d', 'ai-readiness');
    navigate(`/explore?${q}`);
  }

  render() {
    return html`<p role="status">${i18n.getMessage('Opening Explore…')}</p>${nothing}`;
  }
}
