/* ------------------------------------------------------------------ *
 * Discovery: the shared shape of every investigation.
 *
 * A discovery is computed on demand from native records (nothing is stored,
 * so nothing can drift from the source). Every finding keeps the sys_ids of
 * the records it concerns, the fields it read, and how it was assessed.
 * ------------------------------------------------------------------ */

export const CLASSIFICATION = {DETERMINISTIC: 'deterministic', AI: 'ai'};

const REQUIRED = ['id', 'type', 'dimension', 'title', 'summary', 'why', 'evidence', 'method', 'affectedIds', 'severity', 'recommendedAction', 'nextSteps', 'assessedAt', 'version'];

/**
 * Create a discovery. `spec` fields:
 *  id, type, dimension      identity; dimension keeps CSDM and AI readiness apart from presentation
 *  title, summary, why      what was found, in words, and why it matters
 *  evidence                 {sources: [{table, fields, note}]} native records read
 *  method                   {classification: 'deterministic'|'ai', description, criteria: [{key,label,rule}]}
 *  affectedIds              sys_ids of sc_cat_item records
 *  severity                 {level: 'none'|'low'|'medium'|'high', rationale}
 *  recommendedAction        {id, label, summary}  (always human-approved; never applied here)
 *  nextSteps                [string]
 *  assessedAt, version      ISO timestamp, method version
 *  status                   'ready' | 'foundation' (architecture only, no findings yet)
 */
export function makeDiscovery(spec) {
  for (const k of REQUIRED) if (spec[k] == null) throw new Error(`discovery is missing "${k}"`);
  return Object.freeze({status: 'ready', ...spec, affectedSet: new Set(spec.affectedIds)});
}

/** Items of a discovery that fall within a scope ({categoryId?, classes?, ids?}). */
export function scopedIds(discovery, model, scope = {}) {
  const byId = nodeIndex(model);
  return discovery.affectedIds.filter(id => {
    const n = byId.get(id);
    if (!n) return false;
    if (scope.categoryId && n.cluster !== scope.categoryId) return false;
    if (scope.cls && n.cls !== scope.cls) return false;
    if (scope.ids && !scope.ids.has(id)) return false;
    return true;
  });
}

const indexes = new WeakMap();
export function nodeIndex(model) {
  if (!indexes.has(model)) indexes.set(model, new Map(model.nodes.map(n => [n.id, n])));
  return indexes.get(model);
}

/** How a set of items spreads across real categories (primary category, matching the universe). */
export function distribution(model, ids) {
  const byId = nodeIndex(model);
  const counts = new Map();
  for (const id of ids) {
    const n = byId.get(id);
    if (n) counts.set(n.cluster, (counts.get(n.cluster) || 0) + 1);
  }
  const titles = new Map(model.clusters.map(c => [c.id, c]));
  return [...counts.entries()]
    .map(([id, count]) => ({id, count, title: titles.get(id)?.title || id, of: titles.get(id)?.items.length || count, uncategorised: !!titles.get(id)?.uncategorised}))
    .sort((a, b) => b.count - a.count);
}

export function classBreakdown(model, ids) {
  const byId = nodeIndex(model);
  const counts = {};
  for (const id of ids) {
    const n = byId.get(id);
    if (n) counts[n.cls] = (counts[n.cls] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function severityFromShare(share, total) {
  // Prevalence, not business impact: the share of the assessed catalog affected.
  if (!total) return 'none';
  return share >= 0.5 ? 'high' : share >= 0.2 ? 'medium' : share > 0 ? 'low' : 'none';
}
