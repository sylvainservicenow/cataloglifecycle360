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
  return {rows, total: Number(r.headers?.get?.('X-Total-Count')) || rows.length};
}

/** Fetch every row of a table (paged). A denied table resolves to {rows: [], error}. */
async function fetchAll(table, query, fields) {
  const rows = [];
  try {
    for (let offset = 0; offset < 20000; offset += PAGE) {
      const p = new URLSearchParams({
        sysparm_query: `${query}^ORDERBYsys_id`,
        sysparm_fields: fields,
        sysparm_limit: String(PAGE),
        sysparm_offset: String(offset),
        sysparm_exclude_reference_link: 'true'
      });
      const page = await getJson(`/api/now/table/${table}?${p}`);
      rows.push(...page.rows);
      if (page.rows.length < PAGE) break;
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
  const [items, cats, links, ritms, offerings] = await Promise.all([
    fetchAll('sc_cat_item', 'sys_idISNOTEMPTY', 'sys_id,name,sys_class_name,active,category,short_description,description,icon,picture,sys_created_on,sys_updated_on'),
    fetchAll('sc_category', 'sys_idISNOTEMPTY', 'sys_id,title,parent,active'),
    fetchAll('sc_cat_item_category', 'sys_idISNOTEMPTY', 'sc_cat_item,sc_category'),
    fetchAll('sc_req_item', 'sys_idISNOTEMPTY', 'cat_item,sys_created_on'),
    fetchAll('service_offering', 'sys_idISNOTEMPTY', 'sys_id,name,operational_status')
  ]);
  if (items.error) throw new Error(items.error);

  const catById = new Map(cats.rows.map(c => [c.sys_id, {id: c.sys_id, title: c.title || '(untitled)', parent: val(c.parent), active: c.active === 'true'}]));
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

  const clusters = new Map();
  for (const n of nodes) {
    if (!clusters.has(n.cluster)) {
      const c = catById.get(n.cluster);
      clusters.set(n.cluster, {id: n.cluster, title: c ? c.title : 'Uncategorised', uncategorised: !c, items: []});
    }
    clusters.get(n.cluster).items.push(n);
  }

  const classes = {};
  nodes.forEach(n => (classes[n.cls] = (classes[n.cls] || 0) + 1));
  const years = nodes.map(n => Number(n.created.slice(0, 4))).filter(Boolean);

  return {
    nodes,
    catTitle: Object.fromEntries([...catById.values()].map(c => [c.id, c.title])),
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
 * Circle packing (deterministic greedy spiral).
 * ------------------------------------------------------------------ */
export function packCircles(circles, pad = 6) {
  const placed = [];
  const sorted = [...circles].sort((a, b) => b.r - a.r);
  for (const c of sorted) {
    if (!placed.length) {
      placed.push({...c, x: 0, y: 0});
      continue;
    }
    let angle = 0;
    let dist = 0;
    for (let guard = 0; guard < 20000; guard++) {
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist * 0.82;
      if (placed.every(p => Math.hypot(p.x - x, p.y - y) >= p.r + c.r + pad)) {
        placed.push({...c, x, y});
        break;
      }
      angle += 0.5;
      dist += 0.9 * (0.5 / (2 * Math.PI)) * 18;
    }
  }
  return placed;
}

/** Phyllotaxis dots inside a cluster; returns radius and item offsets. */
export function packItems(count, dot = 4.2, gap = 1.8) {
  const step = dot * 2 + gap;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = step * 0.62 * Math.sqrt(i + 0.5);
    const a = i * 2.399963229728653;
    pts.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
  }
  const radius = count ? step * 0.62 * Math.sqrt(count + 0.5) + dot + 5 : 14;
  return {pts, radius};
}
