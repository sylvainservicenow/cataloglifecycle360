/* ------------------------------------------------------------------ *
 * Catalog Intelligence 360 — read-only ServiceNow catalog data layer.
 *
 * Reads native tables only (sc_cat_item, sc_category, sc_cat_item_category,
 * sc_req_item, service_offering). Nothing is created, guessed or defaulted:
 * every figure shown in the UI is derived from these records.
 * ------------------------------------------------------------------ */
import {aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const PAGE = 1000;
const UNCATEGORISED = '__none__';

const val = x => (x && typeof x === 'object' ? (x.value ?? '') : (x ?? ''));
const plain = html => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function getJson(url) {
  const r = await aiuxFetch(url, {headers: {Accept: 'application/json'}});
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const rows = (await r.json())?.result ?? [];
  const header = Number(r.headers?.get?.('X-Total-Count'));
  return {rows, total: Number.isFinite(header) && header > 0 ? header : rows.length};
}

/**
 * Fetch every row of a table (paged). ACLs can make a page shorter than the
 * limit, so paging follows the server's total count, never the page length.
 */
async function fetchAll(table, query, fields) {
  const rows = [];
  try {
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 50000) {
      const p = new URLSearchParams({
        sysparm_query: `${query}^ORDERBYsys_id`,
        sysparm_fields: fields,
        sysparm_limit: String(PAGE),
        sysparm_offset: String(offset),
        sysparm_exclude_reference_link: 'true'
      });
      const page = await getJson(`/api/now/table/${table}?${p}`);
      rows.push(...page.rows);
      total = page.total;
      if (!page.rows.length) break;
      offset += PAGE;
    }
    return {rows, error: null};
  } catch (e) {
    return {rows, error: `${table}: ${e.message}`};
  }
}

const CLASS_LABELS = {
  sc_cat_item: 'Catalog item',
  sc_cat_item_producer: 'Record producer',
  sc_cat_item_content: 'Content item',
  sc_cat_item_guide: 'Order guide',
  sc_cat_item_composite_producer: 'Composite producer',
  std_change_record_producer: 'Standard change',
  sn_cmp_bp_cat_item: 'Cloud blueprint',
  sn_cmp_rsrc_opr_cat_item: 'Cloud operation',
  sn_eam_enterprise_cat_item: 'Enterprise asset',
  pc_hardware_cat_item: 'Hardware',
  pc_software_cat_item: 'Software',
  pc_product_cat_item: 'Product'
};
export const classLabel = c => CLASS_LABELS[c] || String(c || '').replace(/^sc_|_cat_item$/g, '').replace(/_/g, ' ') || 'Other';

/** Quality criteria: each is a plain, checkable fact on the record. */
export const CRITERIA = [
  {key: 'shortDescription', label: () => i18n.getMessage('Short description')},
  {key: 'description', label: () => i18n.getMessage('Description')},
  {key: 'icon', label: () => i18n.getMessage('Icon or picture')},
  {key: 'category', label: () => i18n.getMessage('Category')}
];

let cache = null;
export function loadCatalog(force = false) {
  if (!cache || force) cache = build();
  return cache;
}

async function build() {
  const [items, cats, links, ritms, offerings, catalogRows] = await Promise.all([
    fetchAll('sc_cat_item', 'sys_idISNOTEMPTY', 'sys_id,name,sys_class_name,active,category,short_description,description,icon,picture,sys_created_on,sys_updated_on'),
    fetchAll('sc_category', 'sys_idISNOTEMPTY', 'sys_id,title,parent,active,sc_catalog'),
    fetchAll('sc_cat_item_category', 'sys_idISNOTEMPTY', 'sc_cat_item,sc_category'),
    fetchAll('sc_req_item', 'sys_idISNOTEMPTY', 'cat_item,sys_created_on'),
    fetchAll('service_offering', 'sys_idISNOTEMPTY', 'sys_id,name,operational_status'),
    fetchAll('sc_catalog', 'sys_idISNOTEMPTY', 'sys_id,title')
  ]);
  if (items.error) throw new Error(items.error);

  const catById = new Map(cats.rows.map(c => [c.sys_id, {id: c.sys_id, title: c.title || '(untitled)', parent: val(c.parent), catalog: val(c.sc_catalog), active: c.active === 'true'}]));
  const catalogs = new Map(catalogRows.rows.map(c => [c.sys_id, c.title]));
  const linkByItem = new Map();
  for (const l of links.rows) {
    const i = val(l.sc_cat_item);
    if (!linkByItem.has(i)) linkByItem.set(i, []);
    linkByItem.get(i).push(val(l.sc_category));
  }
  const reqCount = new Map();
  let lastRequest = '';
  for (const r of ritms.rows) {
    const i = val(r.cat_item);
    reqCount.set(i, (reqCount.get(i) || 0) + 1);
    if (r.sys_created_on > lastRequest) lastRequest = r.sys_created_on;
  }

  const nodes = items.rows.map(r => {
    const direct = val(r.category);
    const extra = linkByItem.get(r.sys_id) || [];
    const catIds = [...new Set([direct, ...extra].filter(c => c && catById.has(c)))];
    const flags = {
      shortDescription: !!plain(r.short_description),
      description: !!plain(r.description),
      icon: !!(val(r.icon) || val(r.picture)),
      category: catIds.length > 0
    };
    return {
      id: r.sys_id,
      name: r.name || '(unnamed)',
      cls: r.sys_class_name,
      active: r.active === 'true',
      cluster: catIds[0] || UNCATEGORISED,
      catIds,
      shortDescription: plain(r.short_description),
      created: r.sys_created_on || '',
      updated: r.sys_updated_on || '',
      requests: reqCount.get(r.sys_id) || 0,
      flags,
      score: CRITERIA.filter(c => flags[c.key]).length / CRITERIA.length
    };
  });

  // Several categories share a title (e.g. "Compute"); qualify them by parent
  // or catalog so every label is unambiguous. Titles are never altered otherwise.
  const titleCount = new Map();
  catById.forEach(c => titleCount.set(c.title, (titleCount.get(c.title) || 0) + 1));
  const label = c => {
    if (titleCount.get(c.title) < 2) return c.title;
    const parent = catById.get(c.parent);
    const cat = catalogs.get(c.catalog);
    const ctx = parent ? parent.title : cat;
    return ctx ? `${c.title} (${ctx})` : c.title;
  };
  const clusters = new Map();
  for (const n of nodes) {
    if (!clusters.has(n.cluster)) {
      const c = catById.get(n.cluster);
      clusters.set(n.cluster, {id: n.cluster, title: c ? label(c) : i18n.getMessage('Not yet in a category'), uncategorised: !c, items: []});
    }
    clusters.get(n.cluster).items.push(n);
  }

  const classes = {};
  nodes.forEach(n => (classes[n.cls] = (classes[n.cls] || 0) + 1));
  const years = nodes.map(n => Number(n.created.slice(0, 4))).filter(Boolean);

  return {
    nodes,
    catTitle: Object.fromEntries([...catById.values()].map(c => [c.id, label(c)])),
    clusters: [...clusters.values()].sort((a, b) => b.items.length - a.items.length),
    stats: {
      items: nodes.length,
      active: nodes.filter(n => n.active).length,
      categories: cats.rows.length,
      populatedCategories: [...clusters.values()].filter(c => !c.uncategorised).length,
      uncategorised: nodes.filter(n => !n.flags.category).length,
      missing: Object.fromEntries(CRITERIA.map(c => [c.key, nodes.filter(n => !n.flags[c.key]).length])),
      complete: nodes.filter(n => n.score === 1).length,
      classes,
      requestedItems: reqCount.size,
      requests: ritms.rows.length,
      lastRequest,
      minYear: years.length ? Math.min(...years) : null,
      maxYear: years.length ? Math.max(...years) : null,
      offerings: offerings.error ? null : offerings.rows.length
    },
    warnings: [cats, links, ritms, offerings].map(r => r.error).filter(Boolean)
  };
}

/* ------------------------------------------------------------------ *
 * Layout helpers
 * ------------------------------------------------------------------ */

/**
 * Dense circle packing: each circle goes where it touches two placed circles
 * and sits closest to the (slightly flattened) centre. Deterministic.
 */
export function packCircles(circles, pad = 6, aspect = 0.72) {
  const placed = [];
  const score = (x, y) => Math.hypot(x * aspect, y);
  for (const c of [...circles].sort((a, b) => b.r - a.r)) {
    if (!placed.length) {
      placed.push({...c, x: 0, y: 0});
      continue;
    }
    const fits = (x, y) => placed.every(p => Math.hypot(p.x - x, p.y - y) >= p.r + c.r + pad - 0.01);
    let best = null;
    let bestScore = Infinity;
    const consider = (x, y) => {
      const sc = score(x, y);
      if (sc < bestScore && fits(x, y)) {
        best = {x, y};
        bestScore = sc;
      }
    };
    if (placed.length === 1) {
      const p = placed[0];
      consider(p.x + p.r + c.r + pad, p.y);
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const ra = a.r + c.r + pad;
        const rb = b.r + c.r + pad;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) continue;
        const l = (ra * ra - rb * rb + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, ra * ra - l * l));
        const mx = a.x + (dx * l) / d;
        const my = a.y + (dy * l) / d;
        consider(mx + (h * dy) / d, my - (h * dx) / d);
        consider(mx - (h * dy) / d, my + (h * dx) / d);
      }
    }
    if (!best) best = {x: placed.reduce((m, p) => Math.max(m, p.x + p.r), 0) + c.r + pad, y: 0};
    placed.push({...c, ...best});
  }
  return placed;
}

/** Phyllotaxis dots inside a cluster. `spread` > 1 gives the zoomed-in, roomier arrangement. */
export function packItems(count, spread = 1, dot = 4.2, gap = 1.8) {
  const step = (dot * 2 + gap) * spread;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = step * 0.62 * Math.sqrt(i + 0.5);
    const a = i * 2.399963229728653;
    pts.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
  }
  const radius = count ? step * 0.62 * Math.sqrt(count + 0.5) + dot * (spread > 1 ? 1.3 : 1) + 5 : 14;
  return {pts, radius};
}

/** Regular grid for the uncategorised band, centred on (0, 0). */
export function packGrid(count, cols, step) {
  const rows = Math.ceil(count / cols);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? count - r * cols : cols;
    pts.push({x: ((i % cols) - (inRow - 1) / 2) * step, y: (r - (rows - 1) / 2) * step});
  }
  return {pts, w: cols * step + step, h: rows * step + step};
}
