import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import '../../components/cat-universe.js';

@customElement('x-snc-catalogintel-explore-page')
export default class ExplorePage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: calc(100dvh - 90px);
      min-height: 480px;
    }
  `;

  firstUpdated() {
    document.title = i18n.getMessage('Explore · Catalog Intelligence 360');
  }

  render() {
    return html`
      <h1 class="sr-only">${i18n.getMessage('Explore the catalog universe')}</h1>
      <cat-universe class="block h-full w-full overflow-hidden rounded-2xl border border-base-300"></cat-universe>
    `;
  }
}
