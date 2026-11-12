import {customElement} from 'lit/decorators.js';
import CatWorkspace from '../../components/cat-workspace.js';

/**
 * Explore is the one workspace: the universe, the selected item's intelligence and AI actions
 * on the left, and the native item inspector on the right. The implementation is the shared
 * cat-workspace component, also used by the /investigate deep link, so there is never a second
 * copy of the universe, the inspector or the review panel.
 */
@customElement('x-snc-catalogintel-explore-page')
export default class ExplorePage extends CatWorkspace {}
