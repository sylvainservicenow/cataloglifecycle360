import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {withWorkspace} from '../../components/cat-workspace.js';

/** Explore: the one workspace (universe, contextual intelligence, item inspector). */
@customElement('x-snc-catalogintel-explore-page')
export default class ExplorePage extends withWorkspace(AIUXElement) {}
