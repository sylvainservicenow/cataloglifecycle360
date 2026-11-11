/* Small text utilities shared by the deterministic engines. No model is involved. */

const STOP = new Set(['a', 'an', 'the', 'of', 'for', 'to', 'and', 'or', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'is', 'my', 'your', 'new', 'existing', 'request', 'requests', 'service', 'item', 'form', 'catalog', 'please', 'need', 'get', 'order']);

export const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const stem = w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

/** Content words of a text: lower-case, stop words removed, simple plural folding. */
export const tokens = s => norm(s).split(' ').filter(w => w && !STOP.has(w)).map(stem);

export function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  A.forEach(x => B.has(x) && shared++);
  return shared / (A.size + B.size - shared);
}

export const sharedCount = (a, b) => {
  const B = new Set(b);
  return [...new Set(a)].filter(x => B.has(x)).length;
};

export const fmt = n => new Intl.NumberFormat().format(n);
