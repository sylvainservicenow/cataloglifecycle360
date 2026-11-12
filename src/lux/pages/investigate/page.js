import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {withWorkspace} from '../../components/cat-workspace.js';

/** Deep link (/investigate?d=…): the same shared workspace as Explore, opened on an investigation view. */
@customElement('x-snc-catalogintel-investigate-page')
export default class InvestigatePage extends withWorkspace(AIUXElement) {}
