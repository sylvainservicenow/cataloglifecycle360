/**
 * What the person is working on, shared by every page so navigation keeps context:
 * the last investigation, the selected item (sys_id) and the focused category.
 * Kept in memory and in sessionStorage (so a reload keeps it); never sent anywhere.
 */
const KEY = 'cat360.state';
const listeners = new Set();
let state = {investigation: 'ai-readiness', itemId: null, categoryId: null};

try {
  const saved = typeof sessionStorage !== 'undefined' ? JSON.parse(sessionStorage.getItem(KEY) || 'null') : null;
  if (saved && typeof saved === 'object') state = {...state, ...saved};
} catch {
  /* storage unavailable: memory only */
}

export const getAppState = () => state;

export function setAppState(patch) {
  const next = {...state, ...patch};
  if (JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach(fn => fn(state));
}

export function subscribeAppState(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Where each destination leads, carrying the useful context. */
export function destination(page, s = state) {
  const q = new URLSearchParams();
  if (page === 'overview') return '/overview';
  if (page === 'explore') {
    if (s.itemId) q.set('item', s.itemId);
    if (s.investigation) q.set('d', s.investigation);
    if (s.categoryId && s.categoryId !== '__none__') q.set('cat', s.categoryId);
    return `/explore${q.size ? `?${q}` : ''}`;
  }
  return destination('explore', s);
}

/**
 * The one deep-link contract between Home, Explore and Otto. Only stable, semantic identifiers
 * travel in the URL (never lists of sys_ids); Explore resolves the population from the native
 * catalog model it already holds.
 *   lens       overview | quality | lifecycle | demand | csdm
 *   highlight  all | requested | complete | categories | service
 *              metadata-gaps | form-gaps | overlap | taxonomy-gaps | service-candidates   (these open an investigation)
 *   d          an investigation id (same as the five highlights above)
 *   cat, item  a category / item sys_id
 */
export const HIGHLIGHT_INVESTIGATION = {
  'metadata-gaps': 'ai-readiness',
  'form-gaps': 'form-intelligence',
  overlap: 'overlap',
  'taxonomy-gaps': 'taxonomy',
  'service-candidates': 'csdm-alignment'
};
export const POPULATIONS = ['all', 'requested', 'complete', 'categories', 'service'];
export const HIGHLIGHT_LENS = {requested: 'demand', complete: 'quality', service: 'csdm', all: 'overview'};

export function exploreLink({lens, d, cat, item, highlight} = {}) {
  const q = new URLSearchParams();
  if (highlight) q.set('highlight', highlight);
  if (d) q.set('d', d);
  if (lens) q.set('lens', lens);
  if (cat) q.set('cat', cat);
  if (item) q.set('item', item);
  return `/explore${q.size ? `?${q}` : ''}`;
}
