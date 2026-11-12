import {i18n} from '@servicenow/aiux/aiux-services';
import {TAXONOMY_LABELS} from './opportunity-text.js';

/**
 * The Top opportunities: a deterministic, explainable ranking over the results the existing
 * engines already built. No model call, no score, no invented urgency.
 *
 * Each candidate is a real item (native sys_id) or a real candidate group, and carries the
 * reason it was chosen and its evidence, each marked verified (a direct check of a record
 * field or link) or heuristic (a text-similarity rule that asks for a review).
 *
 * Ranking, in this order:
 *   1. evidence strength  (3 verified fact, 2 strong heuristic, 1 weak heuristic)
 *   2. recorded demand    (requests on the item, or on the group's items)
 *   3. number of findings (checks failed, questions flagged, ...)
 *   4. name               (a stable tie-break)
 * Diversity: the list is filled round-robin across the investigation types, never repeats an
 * item, and takes at most two items from one category.
 */
const PER_KIND = 14;
const PER_CATEGORY = 2;
export const OPP_ACTION = {metadata: 'improve', form: 'form', overlap: 'compare', taxonomy: 'category', service: 'service'};

const rank = (a, b) => b.strength - a.strength || b.requests - a.requests || b.count - a.count || a.title.localeCompare(b.title);

export function buildOpportunities(model, engines, {limit = 10, ids = null, catId = null} = {}) {
  const by = new Map(model.nodes.map(n => [n.id, n]));
  const allow = n => !!n && n.active && (!ids || ids.has(n.id)) && (!catId || n.cluster === catId || n.catIds.includes(catId));
  const lists = {metadata: [], form: [], overlap: [], taxonomy: [], service: []};
  const req = n => (n.requests ? [{text: i18n.getMessage('{0} request(s) recorded', String(n.requests)), verified: true}] : []);

  const {readiness, form, overlap, taxonomy, csdm} = engines;

  if (readiness) {
    for (const [id, a] of readiness.assessments) {
      const n = by.get(id);
      if (!allow(n) || !a.failed.length) continue;
      lists.metadata.push({kind: 'metadata', itemId: id, title: n.name, strength: 3, count: a.failed.length, requests: n.requests,
        reason: i18n.getMessage('{0} metadata gap(s): {1}', String(a.failed.length), a.failed.slice(0, 3).map(f => f.check.label()).join(', ')),
        evidence: [...a.failed.slice(0, 4).map(f => ({text: f.check.label(), verified: true})), ...req(n)]});
    }
  }
  if (form) {
    for (const [id, e] of form.byItem) {
      const n = by.get(id);
      if (!allow(n) || !e.findings.length) continue;
      lists.form.push({kind: 'form', itemId: id, title: n.name, strength: 2, count: e.findings.length, requests: n.requests,
        reason: i18n.getMessage('{0} form question(s) worth reviewing out of {1}', String(e.findings.length), String(e.inputs)),
        evidence: [...e.findings.slice(0, 3).map(f => ({text: `${f.variable.label || f.variable.name}: ${f.issues.map(x => x.text).join(' ')}`, verified: false})), ...req(n)]});
    }
  }
  if (overlap) {
    for (const g of overlap.groups) {
      const members = g.ids.map(i => by.get(i)).filter(Boolean);
      const inScope = members.filter(allow);
      if (!inScope.length || members.length < 2) continue;
      const lead = [...inScope].sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name))[0];
      lists.overlap.push({kind: 'overlap', itemId: lead.id, groupId: `overlap:${[...g.ids].sort()[0]}`, group: g, title: members.slice(0, 2).map(m => m.name).join(' · '), strength: g.kind === 'exact' ? 3 : g.kind === 'near' ? 2 : 1,
        count: members.length, requests: members.reduce((s, m) => s + m.requests, 0),
        reason: i18n.getMessage('{0} items read alike ({1}).', String(members.length), g.kind === 'exact' ? i18n.getMessage('identical names') : g.kind === 'near' ? i18n.getMessage('the same meaningful words') : i18n.getMessage('most words in common')),
        evidence: [...g.evidence.slice(0, 3).map(x => ({text: x.text, verified: g.kind === 'exact' && x.id === 'name'})), ...(g.requests ? [{text: i18n.getMessage('{0} request(s) recorded across the group', String(g.requests)), verified: true}] : [])]});
    }
  }
  if (taxonomy) {
    const sizes = new Map();
    for (const n of model.nodes) for (const c of n.catIds) sizes.set(c, (sizes.get(c) || 0) + 1);
    for (const n of model.nodes) {
      if (!allow(n)) continue;
      const f = taxonomy.findings.get(n.id) || [];
      const ev = [];
      let strength = 0;
      for (const x of f) {
        const verified = x.kind === 'uncategorised';
        ev.push({text: `${TAXONOMY_LABELS[x.kind]()}${x.text ? `. ${x.text}` : ''}`, verified});
        strength = Math.max(strength, x.kind === 'uncategorised' ? 3 : x.kind === 'misplaced' ? 2 : 1);
      }
      const lonely = n.catIds.filter(c => sizes.get(c) === 1).map(c => model.catTitle[c] || c);
      if (lonely.length) {
        ev.push({text: i18n.getMessage('“{0}” holds only this item. A single-item category is a review signal, not proof of miscategorisation.', lonely[0]), verified: false});
        strength = Math.max(strength, 1);
      }
      if (!ev.length) continue;
      lists.taxonomy.push({kind: 'taxonomy', itemId: n.id, title: n.name, strength, count: ev.length, requests: n.requests,
        reason: f.some(x => x.kind === 'uncategorised') ? i18n.getMessage('In no category, so browsing cannot reach it') : f.some(x => x.kind === 'misplaced') ? i18n.getMessage('Its name fits another category better') : lonely.length ? i18n.getMessage('Alone in “{0}”: review the category fit', lonely[0]) : i18n.getMessage('Sits in a vaguely named category'),
        evidence: [...ev.slice(0, 3), ...req(n)]});
    }
  }
  if (csdm) {
    for (const [id, c] of csdm.candidates) {
      const n = by.get(id);
      if (!allow(n) || !c.length || csdm.data.byItem.get(id)?.length) continue;
      const top = c[0];
      lists.service.push({kind: 'service', itemId: id, title: n.name, strength: top.contained ? 2 : 1, count: c.length, requests: n.requests,
        reason: i18n.getMessage('May align with the “{0}” service offering', top.offering.name),
        evidence: [{text: top.contained ? i18n.getMessage('The offering’s name appears in the item’s name or summary.') : i18n.getMessage('The names share {0} meaningful words.', String(top.nameShared)), verified: false}, {text: i18n.getMessage('Not yet linked to any offering'), verified: true}, ...req(n)]});
    }
  }

  for (const k of Object.keys(lists)) lists[k] = lists[k].sort(rank).slice(0, PER_KIND);
  const out = [];
  const seen = new Set();
  const perCat = new Map();
  const take = o => {
    if (seen.has(o.itemId)) return false;
    const cat = by.get(o.itemId)?.cluster;
    if ((perCat.get(cat) || 0) >= PER_CATEGORY) return false;
    seen.add(o.itemId);
    perCat.set(cat, (perCat.get(cat) || 0) + 1);
    out.push({...o, id: o.groupId || `${o.kind}:${o.itemId}`, action: OPP_ACTION[o.kind], catId: by.get(o.itemId)?.cluster || null});
    return true;
  };
  // round-robin: the best remaining candidate of each type, types ordered by how strong that candidate is
  while (out.length < limit) {
    const heads = Object.values(lists).filter(l => l.length).sort((a, b) => rank(a[0], b[0]));
    if (!heads.length) break;
    for (const l of heads) {
      while (l.length && !take(l.shift()));
      if (out.length >= limit) break;
    }
  }
  return out;
}
