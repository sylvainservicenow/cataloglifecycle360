import {html, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';

/**
 * Legacy deep link (/investigate?d=…). Investigations now live inside Explore, so this route
 * only hands the same parameters to Explore, which opens the matching intelligence mode.
 */
@customElement('x-snc-catalogintel-investigate-page')
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
