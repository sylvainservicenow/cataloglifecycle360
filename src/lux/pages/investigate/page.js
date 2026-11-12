import {customElement} from 'lit/decorators.js';
import CatWorkspace from '../../components/cat-workspace.js';

/** Deep-link route (/investigate?d=…): the same shared workspace as Explore, not a separate implementation. */
@customElement('x-snc-catalogintel-investigate-page')
export default class InvestigatePage extends CatWorkspace {}
