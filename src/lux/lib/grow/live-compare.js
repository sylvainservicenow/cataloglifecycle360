import {jaccard, sharedCount, tokens} from '../investigations/tokens.js';

/**
 * Read-only comparison of a proposal against the REAL catalog already loaded by the app
 * (names, short descriptions, categories, service offerings). Plain text similarity, no model:
 * it is a prompt to compare, never a finding that something is a duplicate.
 */

/** Active catalog items whose names/summaries resemble the proposal, best first. */
export function similarItems(model, title, description = '', limit = 4) {
  const mine = tokens(title);
  if (!mine.length) return [];
  const withText = tokens(`${title} ${description}`);
  return model.nodes
    .filter(n => n.active)
    .map(n => {
      const nameTok = tokens(n.name);
      const shared = sharedCount(mine, nameTok);
      if (!shared) return null;
      const score = Math.max(jaccard(mine, nameTok), 0.85 * jaccard(withText, tokens(`${n.name} ${n.shortDescription}`)));
      return {id: n.id, name: n.name, shortDescription: n.shortDescription, score, shared, requests: n.requests, category: model.catTitle[n.catIds[0]] || '', categoryId: n.catIds[0] || ''};
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.requests - a.requests)
    .slice(0, limit);
}

/** Existing categories that fit the proposal, from the categories of similar items and from words in the category title. */
export function suggestCategories(model, title, matches, limit = 3) {
  const mine = tokens(title);
  const score = new Map();
  matches.forEach(m => m.categoryId && score.set(m.categoryId, (score.get(m.categoryId) || 0) + m.score + 0.2));
  model.clusters.forEach(c => {
    if (c.uncategorised) return;
    const s = jaccard(mine, tokens(c.title));
    if (s > 0) score.set(c.id, (score.get(c.id) || 0) + s);
  });
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, s]) => {
      const c = model.clusters.find(x => x.id === id);
      return {id, title: model.catTitle[id] || c?.title || '', items: c?.items.length || 0, score: Math.min(0.99, s)};
    })
    .filter(c => c.title);
}

/** Service offerings whose name shares words with the proposal. */
export function suggestOfferings(services, title, description = '', limit = 3) {
  const mine = tokens(title);
  const all = tokens(`${title} ${description}`);
  return (services?.offerings || [])
    .map(o => ({id: o.id, name: o.name, desc: o.desc, linkedItems: services.byOffering.get(o.id)?.length || 0, shared: sharedCount(mine, o.nameTok), score: jaccard(all, o.tok)}))
    .filter(o => o.shared > 0 && o.score >= 0.08)
    .sort((a, b) => b.shared - a.shared || b.score - a.score)
    .slice(0, limit);
}
