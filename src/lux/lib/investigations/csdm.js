import {i18n} from '@servicenow/aiux/aiux-services';
import {CLASSIFICATION, makeDiscovery} from '../discovery.js';

/**
 * CSDM alignment: the architecture is in place, the findings are not.
 *
 * This instance has service offerings but no native item-to-offering link, so
 * "no association" is the normal state and never a compliance failure. Later
 * recommendations plug in here as additional discoveries with
 * dimension "csdm":
 *   - candidate service-offering associations (AI-assisted, reviewed)
 *   - questionable existing mappings
 *   - ownership gaps (items whose owner / group fields are empty)
 *   - catalog-to-service alignment opportunities
 * Nothing here creates or changes a CSDM record.
 */
export function buildCsdmFoundation(model) {
  const offerings = model.stats.offerings;
  return makeDiscovery({
    id: 'csdm-alignment',
    type: 'csdm-alignment',
    dimension: 'csdm',
    status: 'foundation',
    title: i18n.getMessage('Alignment with the service model'),
    summary: offerings == null
      ? i18n.getMessage('Service offerings could not be read, so no alignment can be shown.')
      : i18n.getMessage('{0} service offerings exist. Catalog items do not reference them natively, so there is nothing to assess yet.', new Intl.NumberFormat().format(offerings)),
    why: i18n.getMessage('Connecting items to the services they deliver would let you reason about ownership and impact. No item is treated as non-compliant for lacking a link.'),
    evidence: {sources: [{table: 'service_offering', fields: ['sys_id', 'name'], note: i18n.getMessage('Inventory only.')}]},
    method: {classification: CLASSIFICATION.DETERMINISTIC, description: i18n.getMessage('No assessment is run in this phase.'), criteria: []},
    affectedIds: [],
    severity: {level: 'none', rationale: i18n.getMessage('No findings are produced in this phase.')},
    recommendedAction: {id: 'none', label: i18n.getMessage('Not available yet'), summary: i18n.getMessage('Candidate associations will be proposed for review in a later phase.')},
    nextSteps: [i18n.getMessage('Propose candidate offerings for review.'), i18n.getMessage('Flag questionable mappings.'), i18n.getMessage('Surface ownership gaps.')],
    assessedAt: new Date().toISOString(),
    version: 'csdm-foundation@1.0'
  });
}
