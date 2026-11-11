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
      width: 100%;
      min-width: 0;
      /* leaves room for the platform's Otto input bar below the universe */
      height: calc(100dvh - 176px);
      min-height: 480px;
    }
  `;

  firstUpdated() {
    document.title = i18n.getMessage('Explore · Catalog Intelligence 360');
  }

  render() {
    return html`
      <cat-universe class="h-full w-full"></cat-universe>
    `;
  }
}
