import {i18n} from '@servicenow/aiux/aiux-services';
import {CLASSIFICATION, makeDiscovery, severityFromShare} from '../discovery.js';

const fmt = n => new Intl.NumberFormat().format(n);
export const VISUAL_VERSION = 'visual-enrichment@1.0';

/** Items with neither an icon nor a picture: both fields are read on sc_cat_item and both must be empty. */
export function buildVisualEnrichment(model) {
  const affected = model.nodes.filter(n => !n.flags.icon);
  const total = model.nodes.length;
  const active = affected.filter(n => n.active).length;
  const requested = affected.filter(n => n.requests > 0).length;
  const share = total ? affected.length / total : 0;
  const level = severityFromShare(share, total);
  return makeDiscovery({
    id: 'visual-enrichment',
    type: 'visual-enrichment',
    dimension: 'presentation',
    title: i18n.getMessage('Catalog items without a visual'),
    summary: i18n.getMessage('{0} of {1} catalog items have neither an icon nor a picture.', fmt(affected.length), fmt(total)),
    why: i18n.getMessage('Items without a visual are harder to recognise in the catalog, in search results and on cards, and they make the catalog feel unfinished. {0} of the affected items are active, and {1} have already been requested.', fmt(active), fmt(requested)),
    evidence: {
      sources: [
        {table: 'sc_cat_item', fields: ['icon', 'picture', 'active', 'name', 'short_description', 'sys_class_name'], note: i18n.getMessage('Counted live from every readable catalog item.')},
        {table: 'sc_req_item', fields: ['cat_item'], note: i18n.getMessage('Used only to show which affected items have been requested.')}
      ]
    },
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('A direct check of two fields on each record. No model is involved and nothing is estimated.'),
      criteria: [
        {key: 'icon', label: i18n.getMessage('Icon is empty'), rule: 'sc_cat_item.icon is empty'},
        {key: 'picture', label: i18n.getMessage('Picture is empty'), rule: 'sc_cat_item.picture is empty'}
      ]
    },
    affectedIds: affected.map(n => n.id),
    severity: {
      level,
      rationale: i18n.getMessage('Rated from the share of the catalog affected: 50% or more is high, 20% or more is medium, anything less is low. This is a presentation rule, not a measure of business impact.')
    },
    recommendedAction: {
      id: 'prepare-visual-enrichment',
      label: i18n.getMessage('Prepare Visual Enrichment'),
      summary: i18n.getMessage('Choose items, review a visual brief for each, and prepare proposals for human approval. Nothing is written to catalog records.')
    },
    nextSteps: [
      i18n.getMessage('Narrow to a category or choose individual items.'),
      i18n.getMessage('Check whether an image-generation capability is available.'),
      i18n.getMessage('Review proposed visuals item by item.'),
      i18n.getMessage('Approve, then apply to catalog records in a later phase.')
    ],
    assessedAt: new Date().toISOString(),
    version: VISUAL_VERSION,
    stats: {total, active, requested}
  });
}

/**
 * A deterministic brief per item, built only from the item's own fields. It
 * is the input a generator would receive; it is not an AI output.
 */
export function visualBrief(node) {
  const about = node.shortDescription || i18n.getMessage('No short description is recorded for this item.');
  return {
    subject: node.name,
    about,
    prompt: i18n.getMessage('A simple, flat, friendly icon representing the service "{0}". Context: {1} Square, plain background, no text.', node.name, about)
  };
}
