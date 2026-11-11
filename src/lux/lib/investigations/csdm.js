import {i18n} from '@servicenow/aiux/aiux-services';
import {fetchAll, plain, val} from '../catalog-data.js';
import {CLASSIFICATION, makeDiscovery} from '../discovery.js';
import {fmt, jaccard, sharedCount, tokens} from './tokens.js';

export const CSDM_VERSION = 'csdm-alignment@2.0';

let cache = null;
/**
 * Service offerings and the native item-to-offering link table
 * (sc_cat_item_subscribe_mtom: sc_cat_item ↔ service_offering). Read once, cached.
 */
export function loadServiceData(force = false) {
  if (!cache || force) {
    cache = Promise.all([
      fetchAll('service_offering', 'sys_idISNOTEMPTY', 'sys_id,name,short_description,operational_status,parent,service_classification'),
      fetchAll('sc_cat_item_subscribe_mtom', 'sys_idISNOTEMPTY', 'sys_id,sc_cat_item,service_offering')
    ])
      .then(([off, links]) => {
        if (off.error) throw new Error(off.error);
        if (links.error) throw new Error(links.error);
        const offerings = off.rows.map(o => ({id: o.sys_id, name: o.name || '', desc: plain(o.short_description), status: o.operational_status, tok: tokens(`${o.name} ${plain(o.short_description)}`), nameTok: tokens(o.name)}));
        const byItem = new Map();
        const byOffering = new Map();
        for (const l of links.rows) {
          const i = val(l.sc_cat_item);
          const o = val(l.service_offering);
          if (!i || !o) continue;
          (byItem.get(i) || byItem.set(i, []).get(i)).push({offering: o, linkId: l.sys_id});
          (byOffering.get(o) || byOffering.set(o, []).get(o)).push(i);
        }
        return {offerings, byItem, byOffering, offeringById: new Map(offerings.map(o => [o.id, o]))};
      })
      .catch(e => ((cache = null), Promise.reject(e)));
  }
  return cache;
}

export const resetServiceData = () => (cache = null);

/**
 * Offerings worth showing the AI for one item. A candidate must be anchored in the item's NAME
 * (words that appear in both names), so incidental words in a description cannot create a match.
 * `strong` marks the evidence used to list an item as an opportunity: the offering's whole name
 * is in the item's name/summary, or at least two name words are shared.
 */
export function offeringCandidates(model, data, itemId, limit = 12) {
  const n = model.nodes.find(x => x.id === itemId);
  if (!n) return [];
  const nameOnly = tokens(n.name);
  const mine = tokens(`${n.name} ${n.shortDescription}`);
  const out = [];
  for (const o of data.offerings) {
    if (!o.nameTok.length) continue;
    const nameShared = sharedCount(nameOnly, o.nameTok);
    const whole = o.nameTok.every(w => mine.includes(w));
    const contained = whole && (o.nameTok.length >= 2 || nameOnly.length <= 2) && nameShared >= 1;
    if (!nameShared && !contained) continue;
    const shared = sharedCount(mine, o.tok);
    out.push({offering: o, shared, nameShared, contained, strong: contained || nameShared >= 2, score: nameShared * 3 + shared + (contained ? 4 : 0) + jaccard(mine, o.tok) * 3});
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * When no offering name is anchored in the item's name, offer the few offerings whose
 * description shares the most words with it, so a requested check is still possible.
 * The AI may (and often will) answer "no clear match".
 */
export function offeringFallback(model, data, itemId, limit = 6) {
  const n = model.nodes.find(x => x.id === itemId);
  if (!n) return [];
  const mine = tokens(`${n.name} ${n.shortDescription}`);
  return data.offerings
    .map(o => ({o, shared: sharedCount(mine, o.tok)}))
    .filter(x => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map(x => x.o);
}

export function buildCsdm(model, data) {
  const active = model.nodes.filter(n => n.active);
  const verified = active.filter(n => data.byItem.has(n.id));
  const candidates = new Map();
  for (const n of active) {
    if (data.byItem.has(n.id)) continue;
    // a candidate needs strong evidence: the offering's whole name in the item's name, or several shared words
    const top = offeringCandidates(model, data, n.id, 3).filter(c => c.strong);
    if (top.length) candidates.set(n.id, top);
  }
  const linkedOfferings = data.byOffering.size;
  const discovery = makeDiscovery({
    id: 'csdm-alignment',
    type: 'csdm-alignment',
    dimension: 'csdm',
    title: i18n.getMessage('Items that may align with a service offering'),
    summary: i18n.getMessage('{0} items are verified as linked to a service offering through the native link table. {1} more have a likely candidate offering found from names and descriptions, for you to review. {2} of {3} offerings have a catalog item.', fmt(verified.length), fmt(candidates.size), fmt(linkedOfferings), fmt(data.offerings.length)),
    why: i18n.getMessage('Linking an item to the offering it delivers lets you reason about ownership, impact and cost. Having no link is normal and is never treated as a failure: only evidence-backed candidates are shown.'),
    evidence: {sources: [{table: 'sc_cat_item_subscribe_mtom', fields: ['sc_cat_item', 'service_offering'], note: i18n.getMessage('The native item-to-offering link. These are the verified relationships.')}, {table: 'service_offering', fields: ['name', 'short_description', 'operational_status'], note: i18n.getMessage('Offerings that candidates are drawn from.')}, {table: 'sc_cat_item', fields: ['name', 'short_description', 'category'], note: i18n.getMessage('Item names and descriptions used as evidence.')}]},
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('Verified links are read directly. Candidates are suggestions from shared words between an item and an offering. An AI comparison for one item is a separate step, labelled as AI, and may conclude that there is not enough information.'),
      criteria: [
        {key: 'verified', label: i18n.getMessage('Verified link'), rule: i18n.getMessage('A row exists in the item-to-offering link table.')},
        {key: 'candidate', label: i18n.getMessage('Suggested, not verified'), rule: i18n.getMessage('The offering’s whole name appears in the item’s name or summary, or the two names share at least two meaningful words.')}
      ]
    },
    affectedIds: [...candidates.keys()],
    severity: {level: candidates.size ? 'low' : 'none', rationale: i18n.getMessage('These are opportunities to review, not defects.')},
    recommendedAction: {id: 'align-service', label: i18n.getMessage('Check service alignment'), summary: i18n.getMessage('Compare the item with the candidate offerings, read the reasoning, and add the link you approve.')},
    nextSteps: [i18n.getMessage('Open an item to see its verified and suggested offerings.'), i18n.getMessage('Ask the AI to compare, including whether there is enough information.'), i18n.getMessage('Approve to add the link, then verify.')],
    assessedAt: new Date().toISOString(),
    version: CSDM_VERSION,
    stats: {verified: verified.length, candidates: candidates.size, offerings: data.offerings.length, linkedOfferings}
  });
  return {discovery, candidates, verifiedIds: verified.map(n => n.id)};
}
