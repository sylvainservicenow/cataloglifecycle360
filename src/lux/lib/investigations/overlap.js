import {i18n} from '@servicenow/aiux/aiux-services';
import {CLASSIFICATION, makeDiscovery, severityFromShare} from '../discovery.js';
import {fmt, jaccard, sharedCount, tokens} from './tokens.js';

export const OVERLAP_VERSION = 'overlap@1.0';
const MAX_GROUP = 8;
/** A token used by more items than this says nothing about purpose (e.g. "access"), so it is not used to find candidates. */
const COMMON_TOKEN = 60;

export const KIND = {
  exact: {rank: 3, label: () => i18n.getMessage('Same name'), blurb: () => i18n.getMessage('The names are identical once case and punctuation are ignored. Often a duplicate, sometimes the same request offered in two places.')},
  near: {rank: 2, label: () => i18n.getMessage('Same words'), blurb: () => i18n.getMessage('The names use the same meaningful words in a different order or form. They may describe the same request.')},
  related: {rank: 1, label: () => i18n.getMessage('Similar names'), blurb: () => i18n.getMessage('The names share most of their meaningful words. Similar names often hide genuinely different purposes.')}
};

class Sets {
  constructor() {
    this.parent = new Map();
    this.size = new Map();
  }
  find(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.size.set(x, 1);
    }
    let r = x;
    while (this.parent.get(r) !== r) r = this.parent.get(r);
    while (this.parent.get(x) !== r) {
      const n = this.parent.get(x);
      this.parent.set(x, r);
      x = n;
    }
    return r;
  }
  /** Joins two sets only when the result stays small enough to review. */
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return true;
    if (this.size.get(ra) + this.size.get(rb) > MAX_GROUP) return false;
    this.parent.set(rb, ra);
    this.size.set(ra, this.size.get(ra) + this.size.get(rb));
    return true;
  }
}

/**
 * Candidate groups from names alone, found with an inverted index (never all pairs).
 * A group is a prompt to compare, not a finding that items are duplicates.
 */
export function buildOverlap(model) {
  const active = model.nodes.filter(n => n.active);
  const tok = new Map(active.map(n => [n.id, tokens(n.name)]));
  const edges = []; // {a, b, kind}
  const byKey = new Map();
  const bySig = new Map();
  active.forEach(n => {
    if (n.nameKey) (byKey.get(n.nameKey) || byKey.set(n.nameKey, []).get(n.nameKey)).push(n.id);
    const sig = [...new Set(tok.get(n.id))].sort().join(' ');
    if (sig) (bySig.get(sig) || bySig.set(sig, []).get(sig)).push(n.id);
  });
  const chain = (ids, kind) => ids.slice(1).forEach(id => edges.push({a: ids[0], b: id, kind}));
  byKey.forEach(ids => ids.length > 1 && chain(ids, 'exact'));
  bySig.forEach(ids => {
    if (ids.length < 2) return;
    // identical word sets that are not already identical names
    const keys = new Set(ids.map(id => model.nodes.find(n => n.id === id)?.nameKey));
    if (keys.size > 1) chain(ids, 'near');
  });
  // related: share a rare content word, then require most of the words in common
  const index = new Map();
  active.forEach(n => new Set(tok.get(n.id)).forEach(t => (index.get(t) || index.set(t, []).get(t)).push(n.id)));
  const seen = new Set();
  for (const n of active) {
    const mine = tok.get(n.id);
    if (mine.length < 2) continue;
    const candidates = new Set();
    for (const t of new Set(mine)) {
      const list = index.get(t);
      if (list.length > COMMON_TOKEN) continue;
      list.forEach(id => id > n.id && candidates.add(id));
    }
    for (const id of candidates) {
      const key = `${n.id}|${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const other = tok.get(id);
      if (other.length < 2) continue;
      if (sharedCount(mine, other) >= 2 && jaccard(mine, other) >= 0.67) edges.push({a: n.id, b: id, kind: 'related'});
    }
  }

  const sets = new Sets();
  const used = [];
  // strongest evidence joins first
  edges.sort((x, y) => KIND[y.kind].rank - KIND[x.kind].rank);
  for (const e of edges) if (sets.union(e.a, e.b)) used.push(e);
  const members = new Map();
  const kindOf = new Map();
  for (const e of used) {
    const r = sets.find(e.a);
    if (!members.has(r)) members.set(r, new Set());
    members.get(r).add(e.a).add(e.b);
    if (!kindOf.has(r) || KIND[e.kind].rank > KIND[kindOf.get(r)].rank) kindOf.set(r, e.kind);
  }
  const byId = new Map(model.nodes.map(n => [n.id, n]));
  const groups = [...members.entries()].map(([root, ids], i) => {
    const list = [...ids].map(id => byId.get(id)).sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name));
    const kind = kindOf.get(root);
    const shorts = list.map(n => n.shortDescription.toLowerCase()).filter(Boolean);
    const evidence = [
      {id: 'name', text: kind === 'exact' ? i18n.getMessage('The names are identical ignoring case and punctuation.') : kind === 'near' ? i18n.getMessage('The names use the same meaningful words.') : i18n.getMessage('The names share most of their meaningful words.')},
      new Set(list.map(n => n.cls)).size === 1 ? {id: 'class', text: i18n.getMessage('All are the same item type: {0}.', list[0].cls)} : {id: 'class', text: i18n.getMessage('They are different item types, which can mean different fulfilment.'), differs: true},
      new Set(list.map(n => n.cluster)).size === 1 ? {id: 'cat', text: i18n.getMessage('All are in the same category.')} : {id: 'cat', text: i18n.getMessage('They sit in different categories.'), differs: true},
      shorts.length > 1 && new Set(shorts).size < shorts.length ? {id: 'short', text: i18n.getMessage('At least two share the same short description.')} : null,
      list.filter(n => !n.shortDescription).length ? {id: 'nodesc', text: i18n.getMessage('{0} of {1} have no short description, so their purpose cannot be told apart from the record.', String(list.filter(n => !n.shortDescription).length), String(list.length))} : null
    ].filter(Boolean);
    return {id: `g${i}`, kind, ids: list.map(n => n.id), evidence, requests: list.reduce((s, n) => s + n.requests, 0)};
  });
  groups.sort((a, b) => KIND[b.kind].rank - KIND[a.kind].rank || b.ids.length - a.ids.length);
  groups.forEach((g, i) => (g.id = `g${i}`));
  const groupOf = new Map();
  groups.forEach(g => g.ids.forEach(id => groupOf.set(id, g)));
  const affected = [...groupOf.keys()];
  const share = active.length ? affected.length / active.length : 0;
  const perKind = Object.fromEntries(Object.keys(KIND).map(k => [k, groups.filter(g => g.kind === k).length]));
  const discovery = makeDiscovery({
    id: 'overlap',
    type: 'overlap',
    dimension: 'overlap',
    title: i18n.getMessage('Items that may overlap'),
    summary: i18n.getMessage('{0} candidate groups contain {1} of {2} active items: {3} with the same name, {4} with the same words, {5} with similar names.', fmt(groups.length), fmt(affected.length), fmt(active.length), fmt(perKind.exact), fmt(perKind.near), fmt(perKind.related)),
    why: i18n.getMessage('When two items look alike, people and AI agents cannot tell which to pick, and fulfilment teams receive the same request through two doors. A group is a candidate to compare, not proof of duplication: similar names often hide different purposes.'),
    evidence: {sources: [{table: 'sc_cat_item', fields: ['name', 'short_description', 'sys_class_name', 'category', 'active'], note: i18n.getMessage('Active items, compared by name through a word index. No all-pairs comparison.')}, {table: 'sc_cat_item_category', fields: ['sc_cat_item', 'sc_category'], note: i18n.getMessage('Category context.')}]},
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('Candidates are found from names only: identical names, identical word sets, and names sharing most words. Meaning is compared by the AI only for a group you choose, and is always labelled as such.'),
      criteria: Object.entries(KIND).map(([k, v]) => ({key: k, label: v.label(), rule: v.blurb()}))
    },
    affectedIds: affected,
    severity: {level: severityFromShare(share, active.length), rationale: i18n.getMessage('Prevalence is the share of active items that sit in at least one candidate group.')},
    recommendedAction: {id: 'review-overlap', label: i18n.getMessage('Compare this group'), summary: i18n.getMessage('Ask the AI to compare the items in a group, read the evidence, then choose a next step. Nothing is merged, deactivated or deleted.')},
    nextSteps: [i18n.getMessage('Pick a candidate group.'), i18n.getMessage('Read the differences and similarities.'), i18n.getMessage('Improve names or descriptions through Transform, or keep the items separate on purpose.')],
    assessedAt: new Date().toISOString(),
    version: OVERLAP_VERSION,
    stats: {active: active.length, groups: groups.length, perKind}
  });
  return {discovery, groups, groupOf};
}
