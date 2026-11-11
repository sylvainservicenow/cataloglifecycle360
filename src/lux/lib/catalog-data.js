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
/** Diagnostics for the last catalog load (read from the console: window.__catalogTiming). */
export const timing = {};
const UNCATEGORISED = '__none__';

export const val = x => (x && typeof x === 'object' ? (x.value ?? '') : (x ?? ''));
export const plain = html => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export async function getJson(url) {
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
export async function fetchAll(table, query, fields, parallel = 1) {
  const t0 = performance.now();
  const r = await fetchAllRaw(table, query, fields, parallel);
  (timing.tables ??= {})[table] = {ms: Math.round(performance.now() - t0), rows: r.rows.length};
  return r;
}

async function fetchAllRaw(table, query, fields, parallel) {
  const rows = [];
  const pageUrl = offset => {
    const p = new URLSearchParams({
      sysparm_query: `${query}^ORDERBYsys_id`,
      sysparm_fields: fields,
      sysparm_limit: String(PAGE),
      sysparm_offset: String(offset),
      sysparm_exclude_reference_link: 'true'
    });
    return `/api/now/table/${table}?${p}`;
  };
  try {
    let offset = 0;
    let total = Infinity;
    if (parallel > 1) {
      // Large tables: request the first pages together instead of one round trip after another.
      const first = await Promise.all(Array.from({length: parallel}, (_, i) => getJson(pageUrl(i * PAGE))));
      first.forEach(pg => rows.push(...pg.rows));
      total = first[0].total;
      offset = parallel * PAGE;
    }
    while (offset < total && offset < 50000) {
      const page = await getJson(pageUrl(offset));
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

/**
 * Item classification is the record's own table (sys_class_name), shown with
 * the platform's label for that table. These are the labels sys_db_object
 * holds on this instance; they are the fallback if that table cannot be read,
 * and the live labels replace them when it can. A category name is never used.
 */
const CLASS_LABELS = {
  sc_cat_item: 'Catalog Item',
  sc_cat_item_producer: 'Record Producer',
  sc_cat_item_content: 'Content Item',
  sc_cat_item_guide: 'Order guide',
  sc_cat_item_composite_producer: 'Composite Record Producer',
  std_change_record_producer: 'Standard Change Template',
  sn_cmp_bp_cat_item: 'Cloud Catalog Item',
  sn_cmp_rsrc_opr_cat_item: 'Resource Operation Catalog Item',
  sn_eam_enterprise_cat_item: 'Enterprise Catalog',
  pc_hardware_cat_item: 'Hardware Catalog',
  pc_software_cat_item: 'Software Catalog',
  pc_product_cat_item: 'Product Catalog Item'
};
const liveClassLabels = {};
export const classLabel = c => liveClassLabels[c] || CLASS_LABELS[c] || String(c || '').replace(/_/g, ' ').trim() || 'Other';

/** Quality criteria: each is a plain, checkable fact on the record. */
export const CRITERIA = [
  {key: 'shortDescription', label: () => i18n.getMessage('Short description')},
  {key: 'description', label: () => i18n.getMessage('Description')},
  {key: 'icon', label: () => i18n.getMessage('Icon or picture')},
  {key: 'category', label: () => i18n.getMessage('Category')}
];

/**
 * Metrics for any set of items (all of them, or one category's). Every figure
 * is a plain count over the given nodes, so scoped and global numbers share
 * one definition.
 */
export function scopeStats(nodes) {
  const missing = Object.fromEntries(CRITERIA.map(c => [c.key, 0]));
  const byFields = [0, 0, 0, 0, 0]; // items having 0..4 of the four fields
  const classes = {};
  let active = 0;
  let requestedItems = 0;
  let requests = 0;
  for (const n of nodes) {
    if (n.active) active++;
    if (n.requests) requestedItems++;
    requests += n.requests;
    classes[n.cls] = (classes[n.cls] || 0) + 1;
    let have = 0;
    for (const c of CRITERIA) n.flags[c.key] ? have++ : missing[c.key]++;
    byFields[have]++;
  }
  return {
    items: nodes.length,
    active,
    inactive: nodes.length - active,
    requestedItems,
    requests,
    missing,
    byFields,
    complete: byFields[CRITERIA.length],
    uncategorised: missing.category,
    classes
  };
}

let cache = null;
export function loadCatalog(force = false) {
  if (!cache || force) cache = build();
  return cache;
}

async function build() {
  const t0 = performance.now();
  const [items, withDescription, cats, links, ritms, offerings, catalogRows, tableLabels] = await Promise.all([
    fetchAll('sc_cat_item', 'sys_idISNOTEMPTY', 'sys_id,name,sys_class_name,active,category,short_description,icon,picture,sys_created_on,sys_updated_on'),
    // Descriptions are bulky; the first paint only needs to know which items have one.
    fetchAll('sc_cat_item', 'descriptionISNOTEMPTY', 'sys_id'),
    fetchAll('sc_category', 'sys_idISNOTEMPTY', 'sys_id,title,parent,active,sc_catalog'),
    fetchAll('sc_cat_item_category', 'sys_idISNOTEMPTY', 'sc_cat_item,sc_category'),
    fetchAll('sc_req_item', 'sys_idISNOTEMPTY', 'cat_item,sys_created_on'),
    fetchAll('service_offering', 'sys_idISNOTEMPTY', 'sys_id,name,operational_status'),
    fetchAll('sc_catalog', 'sys_idISNOTEMPTY', 'sys_id,title'),
    fetchAll('sys_db_object', `nameIN${Object.keys(CLASS_LABELS).join(',')}`, 'name,label')
  ]);
  tableLabels.rows.forEach(r => r.label && (liveClassLabels[r.name] = r.label));
  timing.totalMs = Math.round(performance.now() - t0);
  if (typeof window !== 'undefined') window.__catalogTiming = timing;
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

  const hasDescription = new Set(withDescription.rows.map(r => r.sys_id));
  const nodes = items.rows.map(r => {
    const direct = val(r.category);
    const extra = linkByItem.get(r.sys_id) || [];
    const catIds = [...new Set([direct, ...extra].filter(c => c && catById.has(c)))];
    const flags = {
      shortDescription: !!plain(r.short_description),
      description: hasDescription.has(r.sys_id),
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
      // filled by loadTextFacts() when an investigation needs them
      descLen: 0,
      descWords: 0,
      descSnippet: '',
      ctx: null,
      nameKey: String(r.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      created: r.sys_created_on || '',
      updated: r.sys_updated_on || '',
      requests: reqCount.get(r.sys_id) || 0,
      flags,
      fields: CRITERIA.filter(c => flags[c.key]).length,
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

  const years = nodes.map(n => Number(n.created.slice(0, 4))).filter(Boolean);

  return {
    nodes,
    catTitle: Object.fromEntries([...catById.values()].map(c => [c.id, label(c)])),
    clusters: [...clusters.values()].sort((a, b) => b.items.length - a.items.length),
    // Global metrics are the same function applied to every item, so a scoped
    // view (one category) can never disagree with the global one in method.
    stats: {
      ...scopeStats(nodes),
      categories: cats.rows.length,
      populatedCategories: [...clusters.values()].filter(c => !c.uncategorised).length,
      lastRequest,
      minYear: years.length ? Math.min(...years) : null,
      maxYear: years.length ? Math.max(...years) : null,
      offerings: offerings.error ? null : offerings.rows.length
    },
    warnings: [cats, links, ritms, offerings, withDescription].map(r => r.error).filter(Boolean)
  };
}

/**
 * Text and ownership facts the investigations read: description text and the
 * owner / group / fulfilment references. Loaded once, on demand, then cached.
 * Also confirms the "has a description" flag from the actual text, so a
 * description holding only markup is not counted as present.
 */
export function loadTextFacts(model) {
  if (!model.textFacts) {
    model.textFacts = fetchAll('sc_cat_item', 'sys_idISNOTEMPTY', 'sys_id,description,owner,group,flow_designer_flow,workflow,delivery_plan').then(r => {
      if (r.error) {
        model.textFacts = null;
        throw new Error(r.error);
      }
      const byId = new Map(model.nodes.map(n => [n.id, n]));
      for (const row of r.rows) {
        const n = byId.get(row.sys_id);
        if (!n) continue;
        const desc = plain(row.description);
        n.descLen = desc.length;
        n.descWords = desc ? desc.split(' ').length : 0;
        n.descSnippet = desc.slice(0, 320);
        n.ctx = {owner: !!val(row.owner), group: !!val(row.group), fulfilment: !!(val(row.flow_designer_flow) || val(row.workflow) || val(row.delivery_plan))};
        n.flags.description = !!desc;
        n.fields = CRITERIA.filter(c => n.flags[c.key]).length;
        n.score = n.fields / CRITERIA.length;
      }
      return true;
    });
  }
  return model.textFacts;
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

/* ------------------------------------------------------------------ *
 * Variables: loaded on demand (the catalog holds ~11k of them), never with the catalog itself
 * ------------------------------------------------------------------ */

const VAR_FIELDS = 'sys_id,name,question_text,type,mandatory,help_text,hint,cat_item,variable_set,order,active';
let varStatsCache = null;

/** Item → how many active variables it owns directly and through variable sets. One cached aggregate pass. */
export function loadVariableStats(force = false) {
  if (!varStatsCache || force) varStatsCache = buildVariableStats().catch(e => ((varStatsCache = null), Promise.reject(e)));
  return varStatsCache;
}

async function stat(table, groupBy, query) {
  const p = new URLSearchParams({sysparm_count: 'true', sysparm_group_by: groupBy, sysparm_query: query});
  const r = await aiuxFetch(`/api/now/stats/${table}?${p}`, {headers: {Accept: 'application/json'}});
  if (!r.ok) throw new Error(`${table} stats: HTTP ${r.status}`);
  const out = new Map();
  for (const g of (await r.json())?.result ?? []) {
    const k = g.groupby_fields?.find(f => f.field === groupBy)?.value;
    if (k) out.set(k, Number(g.stats?.count) || 0);
  }
  return out;
}

async function buildVariableStats() {
  const t0 = performance.now();
  const [direct, perSet, links] = await Promise.all([
    stat('item_option_new', 'cat_item', 'active=true^cat_itemISNOTEMPTY'),
    stat('item_option_new', 'variable_set', 'active=true^cat_itemISEMPTY^variable_setISNOTEMPTY'),
    fetchAll('io_set_item', 'sys_idISNOTEMPTY', 'sc_cat_item,variable_set')
  ]);
  if (links.error) throw new Error(links.error);
  const setsOfItem = new Map();
  for (const l of links.rows) {
    const i = val(l.sc_cat_item);
    if (!setsOfItem.has(i)) setsOfItem.set(i, new Set());
    setsOfItem.get(i).add(val(l.variable_set));
  }
  const items = new Map();
  const ids = new Set([...direct.keys(), ...setsOfItem.keys()]);
  for (const id of ids) {
    const sets = [...(setsOfItem.get(id) || [])];
    const viaSets = sets.reduce((n, s) => n + (perSet.get(s) || 0), 0);
    items.set(id, {direct: direct.get(id) || 0, viaSets, sets: sets.length, total: (direct.get(id) || 0) + viaSets});
  }
  return {items, setsOfItem, ms: Math.round(performance.now() - t0)};
}

const varCache = new Map();
/** Forget one item's cached variables after a verified change to them. */
export function clearItemVariables(itemId) {
  varCache.delete(itemId);
}
/** The actual variables behind one catalog item (its own plus those from its variable sets). */
export function loadItemVariables(itemId) {
  if (!varCache.has(itemId)) {
    varCache.set(itemId, buildItemVariables(itemId).catch(e => (varCache.delete(itemId), Promise.reject(e))));
  }
  return varCache.get(itemId);
}

async function buildItemVariables(itemId) {
  const stats = await loadVariableStats();
  const sets = [...(stats.setsOfItem.get(itemId) || [])];
  const q = sets.length ? `active=true^cat_item=${itemId}^ORvariable_setIN${sets.join(',')}` : `active=true^cat_item=${itemId}`;
  const r = await fetchAll('item_option_new', q, VAR_FIELDS);
  if (r.error) throw new Error(r.error);
  return r.rows
    .map(v => ({
      id: v.sys_id,
      name: v.name || '',
      label: plain(v.question_text),
      type: v.type,
      mandatory: v.mandatory === 'true',
      help: plain(v.help_text),
      hint: plain(v.hint),
      order: Number(v.order) || 0,
      fromSet: !val(v.cat_item) && !!val(v.variable_set)
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * After an item was updated and re-read from the database, bring the in-memory
 * model in line with what was actually persisted, so every view agrees.
 */
export function applyPersisted(model, itemId, persisted) {
  const n = model.nodes.find(x => x.id === itemId);
  if (!n) return null;
  const short = plain(persisted.short);
  const desc = plain(persisted.description);
  const before = {fields: n.fields, flags: {...n.flags}};
  n.shortDescription = short;
  n.descLen = desc.length;
  n.descWords = desc ? desc.split(' ').length : 0;
  n.descSnippet = desc.slice(0, 320);
  n.updated = persisted.updated ? persisted.updated : n.updated;
  n.flags.shortDescription = !!short;
  n.flags.description = !!desc;
  n.fields = CRITERIA.filter(c => n.flags[c.key]).length;
  n.score = n.fields / CRITERIA.length;
  // Remember a genuine improvement so Explore can show it (kept for this session only).
  if (n.fields > before.fields) {
    n.improved = {from: before.fields, to: n.fields, gained: CRITERIA.filter(c => n.flags[c.key] && !before.flags[c.key]).map(c => c.key), at: Date.now()};
  }
  Object.assign(model.stats, scopeStats(model.nodes), {populatedCategories: model.stats.populatedCategories, categories: model.stats.categories, offerings: model.stats.offerings, minYear: model.stats.minYear, maxYear: model.stats.maxYear, lastRequest: model.stats.lastRequest});
  return n;
}
