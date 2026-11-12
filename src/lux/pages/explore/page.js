import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {withWorkspace} from '../../components/cat-workspace.js';

/** Explore: the one workspace (universe, contextual intelligence, item inspector). */
// application-local: this page is only reachable through this application's own experience
const {global} = decorators;

@customElement('x-snc-catlife360-explore-page')
@global(false)
export default class ExplorePage extends withWorkspace(AIUXElement) {}
