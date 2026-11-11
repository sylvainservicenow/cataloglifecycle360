import {i18n} from '@servicenow/aiux/aiux-services';
import {CLASSIFICATION, makeDiscovery, severityFromShare} from '../discovery.js';
import {fmt, jaccard, tokens} from './tokens.js';

export const TAXONOMY_VERSION = 'taxonomy@1.0';
const GENERIC_CATEGORY = new Set(['general', 'other', 'others', 'misc', 'miscellaneous', 'various', 'default', 'common', 'services', 'requests', 'catalog', 'standard', 'uncategorized', 'uncategorised']);

export const ISSUE = {
  uncategorised: () => i18n.getMessage('Not in any category'),
  generic: () => i18n.getMessage('In a vaguely named category'),
  misplaced: () => i18n.getMessage('Name fits another category better')
};

/**
 * Taxonomy and discoverability, from real categories and links only.
 * "Name fits another category better" compares an item's words with the words of the
 * items in each category. It is a weak, objective signal that asks for review, and the
 * AI is only asked for a recommendation when you choose an item.
 */
export function buildTaxonomy(model) {
  const active = model.nodes.filter(n => n.active);
  const byCluster = new Map(model.clusters.map(c => [c.id, c]));
  const catTitles = Object.entries(model.catTitle).map(([id, title]) => ({id, title}));
  const findings = new Map(); // item id -> [{kind, text, suggest?}]
  const add = (id, f) => (findings.get(id) || findings.set(id, []).get(id)).push(f);

  // 1. uncategorised
  for (const n of active) if (!n.catIds.length) add(n.id, {kind: 'uncategorised', text: i18n.getMessage('This item is not linked to any category, so it cannot be found by browsing.')});

  // 2. generic category names
  const genericCats = catTitles.filter(c => GENERIC_CATEGORY.has(c.title.toLowerCase().replace(/\s*\(.*\)$/, '').trim()));
  const genericIds = new Set(genericCats.map(c => c.id));
  for (const n of active) {
    const hit = n.catIds.find(id => genericIds.has(id));
    if (hit) add(n.id, {kind: 'generic', text: i18n.getMessage('The category “{0}” does not say what is inside it.', model.catTitle[hit])});
  }

  // 3. items whose name fits a different category's items better (single-category items only)
  const df = new Map(); // token -> Map(cluster -> items containing it)
  const itemTok = new Map();
  for (const n of active) {
    if (n.cluster === 'uncategorised' || byCluster.get(n.cluster)?.uncategorised) continue;
    const t = [...new Set(tokens(n.name))];
    itemTok.set(n.id, t);
    for (const w of t) {
      if (!df.has(w)) df.set(w, new Map());
      df.get(w).set(n.cluster, (df.get(w).get(n.cluster) || 0) + 1);
    }
  }
  const size = c => byCluster.get(c)?.items.filter(x => x.active).length || 0;
  for (const n of active) {
    const t = itemTok.get(n.id);
    if (!t || t.length < 2 || n.catIds.length !== 1 || size(n.cluster) < 4) continue;
    const scores = new Map();
    let own = 0;
    for (const w of t) {
      const m = df.get(w);
      if (!m) continue;
      own += ((m.get(n.cluster) || 1) - 1) / Math.max(1, size(n.cluster) - 1);
      for (const [c, k] of m) if (c !== n.cluster && size(c) >= 4) scores.set(c, (scores.get(c) || 0) + k / size(c));
    }
    own /= t.length;
    let best = null;
    for (const [c, s] of scores) if (!best || s > best.s) best = {c, s: s / t.length};
    if (best && own === 0 && best.s >= 0.3) add(n.id, {kind: 'misplaced', suggest: best.c, text: i18n.getMessage('No other item in “{0}” shares its words, while many in “{1}” do.', byCluster.get(n.cluster)?.title || '', byCluster.get(best.c)?.title || '')});
  }

  // 4. categories that look like each other (display only)
  const ct = catTitles.map(c => ({...c, t: tokens(c.title.replace(/\s*\(.*\)$/, ''))})).filter(c => c.t.length);
  const overlaps = [];
  const byTitle = new Map();
  ct.forEach(c => (byTitle.get(c.t.join(' ')) || byTitle.set(c.t.join(' '), []).get(c.t.join(' '))).push(c));
  byTitle.forEach(list => list.length > 1 && overlaps.push({kind: 'same', categories: list.map(({id, title}) => ({id, title}))}));
  const tokIndex = new Map();
  ct.forEach(c => c.t.forEach(w => (tokIndex.get(w) || tokIndex.set(w, []).get(w)).push(c)));
  const pairSeen = new Set();
  for (const c of ct) {
    for (const w of c.t) {
      const list = tokIndex.get(w);
      if (list.length > 25) continue;
      for (const o of list) {
        if (o.id <= c.id || o.t.join(' ') === c.t.join(' ')) continue;
        const key = c.id + o.id;
        if (pairSeen.has(key)) continue;
        pairSeen.add(key);
        if (c.t.length > 1 && jaccard(c.t, o.t) >= 0.8) overlaps.push({kind: 'similar', categories: [c, o].map(({id, title}) => ({id, title}))});
      }
    }
  }

  const affected = active.filter(n => findings.has(n.id));
  const share = active.length ? affected.length / active.length : 0;
  const count = k => affected.filter(n => findings.get(n.id).some(f => f.kind === k)).length;
  const stats = {active: active.length, uncategorised: count('uncategorised'), generic: count('generic'), misplaced: count('misplaced'), genericCategories: genericCats, overlaps};
  const discovery = makeDiscovery({
    id: 'taxonomy',
    type: 'taxonomy',
    dimension: 'taxonomy',
    title: i18n.getMessage('Items that may be hard to find'),
    summary: i18n.getMessage('{0} of {1} active items have a discoverability signal: {2} in no category, {3} in a vaguely named category and {4} whose name fits another category better.', fmt(affected.length), fmt(active.length), fmt(stats.uncategorised), fmt(stats.generic), fmt(stats.misplaced)),
    why: i18n.getMessage('People browse the catalog by category and agents use it as context. An item in no category, or in a category that says nothing, is easy to miss. “Fits another category better” is a weak signal about the words in names, not a verdict on where an item belongs: items can validly sit in several categories.'),
    evidence: {sources: [{table: 'sc_cat_item', fields: ['name', 'category', 'active'], note: i18n.getMessage('Active items.')}, {table: 'sc_cat_item_category', fields: ['sc_cat_item', 'sc_category'], note: i18n.getMessage('All category assignments.')}, {table: 'sc_category', fields: ['title', 'parent', 'sc_catalog'], note: i18n.getMessage('Category names, for ambiguity and overlap.')}]},
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('Objective checks on real categories and links. The category recommendation for one item is a separate AI step, shown as such, and only ever chooses among existing categories.'),
      criteria: [
        {key: 'uncategorised', label: ISSUE.uncategorised(), rule: i18n.getMessage('No link to any category.')},
        {key: 'generic', label: ISSUE.generic(), rule: i18n.getMessage('The category title is on a short list such as “general”, “other” or “services”.')},
        {key: 'misplaced', label: ISSUE.misplaced(), rule: i18n.getMessage('A single-category item shares no words with its category’s other items, but shares many with another category.')}
      ]
    },
    affectedIds: affected.map(n => n.id),
    severity: {level: severityFromShare(share, active.length), rationale: i18n.getMessage('Prevalence is the share of active items with at least one signal.')},
    recommendedAction: {id: 'recommend-category', label: i18n.getMessage('Recommend a category'), summary: i18n.getMessage('Ask the AI which existing categories suit the selected item, review them, and add the one you approve.')},
    nextSteps: [i18n.getMessage('Open an item to see its signal.'), i18n.getMessage('Ask for a category recommendation.'), i18n.getMessage('Approve to add the category link, then verify.')],
    assessedAt: new Date().toISOString(),
    version: TAXONOMY_VERSION,
    stats
  });
  return {discovery, findings};
}

/**
 * A short list of REAL categories to offer the AI for one item: those whose title or
 * items share words with it. The AI never sees (or invents) a category outside this list.
 */
export function categoryCandidates(model, itemId, limit = 20) {
  const n = model.nodes.find(x => x.id === itemId);
  if (!n) return [];
  const mine = new Set(tokens(`${n.name} ${n.shortDescription}`));
  const scored = [];
  for (const c of model.clusters) {
    if (c.uncategorised) continue;
    let score = 0;
    const titleTokens = tokens(c.title.replace(/\s*\(.*\)$/, ''));
    titleTokens.forEach(w => mine.has(w) && (score += 3));
    const peers = c.items.filter(x => x.id !== itemId);
    let peerHits = 0;
    for (const p of peers.slice(0, 200)) tokens(p.name).forEach(w => mine.has(w) && peerHits++);
    score += Math.min(6, peerHits / Math.max(3, peers.length / 4));
    scored.push({id: c.id, title: c.title, count: c.items.length, score, sample: peers.slice(0, 3).map(x => x.name)});
  }
  return scored.sort((a, b) => b.score - a.score || b.count - a.count).slice(0, limit);
}
