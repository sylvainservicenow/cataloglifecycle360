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
    if (s.categoryId && s.categoryId !== '__none__') q.set('cat', s.categoryId);
    return `/explore${q.size ? `?${q}` : ''}`;
  }
  q.set('d', s.investigation || 'ai-readiness');
  if (s.categoryId) q.set('cat', s.categoryId);
  if (s.itemId) q.set('item', s.itemId);
  return `/investigate?${q}`;
}
