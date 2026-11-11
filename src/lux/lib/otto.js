import {navigate} from '@servicenow/aiux/aiux-client';
import {loadCatalog, classLabel} from './catalog-data.js';

/**
 * Otto integration, shared by every page.
 *
 * Otto only sees client tools that are registered on the page the person is looking at
 * (withWidgetContext registers them when the page connects), so every page registers the
 * same set. A tool never re-implements analysis: it resolves the record and opens the
 * existing investigation or workspace. Generating a proposal needs a click and saving
 * needs the person's confirmation, so no tool can change a record.
 */
export const APP_NAME = 'Catalog Intelligence 360';
const SYS_ID = /^[0-9a-f]{32}$/;

export const INVESTIGATION_OF = {
  'ai-readiness': 'Metadata and AI readiness',
  'form-intelligence': 'Form intelligence',
  overlap: 'Duplicates and overlap',
  taxonomy: 'Taxonomy and discoverability',
  'csdm-alignment': 'Service alignment'
};

const NEEDS_ITEM = message => ({success: false, needsItem: true, message});
const ASK = 'No catalog item is selected. Ask the person to select an item in the catalog universe, or to name it, then try again. Do not guess an item.';

export function investigateUrl({d, item, cat, open}) {
  const q = new URLSearchParams({d});
  if (cat) q.set('cat', cat);
  if (item) q.set('item', item);
  if (open) q.set('open', open);
  return `/investigate?${q}`;
}

/** The record an item-specific tool applies to: a native sys_id, else a name, else the page's own selection. */
async function resolveItem(page, args = {}) {
  const model = await loadCatalog();
  const byId = id => model.nodes.find(n => n.id === id);
  if (args.item_id) {
    if (!SYS_ID.test(String(args.item_id))) return {error: `"${args.item_id}" is not a catalog item sys_id.`};
    const n = byId(args.item_id);
    return n ? {node: n, model} : {error: `No readable catalog item has sys_id ${args.item_id}.`};
  }
  if (args.item_name) {
    const q = String(args.item_name).trim().toLowerCase();
    const exact = model.nodes.filter(n => n.name.toLowerCase() === q);
    const hits = exact.length ? exact : model.nodes.filter(n => n.name.toLowerCase().includes(q));
    if (!hits.length) return {error: `No catalog item is named like "${args.item_name}".`};
    if (hits.length > 1) {
      return {error: `${hits.length} items match "${args.item_name}". Ask the person which one, or use the selected item.`, matches: hits.slice(0, 8).map(n => ({item_id: n.id, name: n.name, class: classLabel(n.cls)}))};
    }
    return {node: hits[0], model};
  }
  const sel = page._ottoSelection?.()?.itemId;
  return {node: sel ? byId(sel) || null : null, model};
}

function categoryOf(model, args) {
  if (!args.category_name) return null;
  const q = String(args.category_name).toLowerCase();
  return model.clusters.find(c => c.title.toLowerCase() === q) || model.clusters.find(c => c.title.toLowerCase().includes(q)) || null;
}

/** Open an investigation (and optionally its review workspace), from any page. */
async function open(page, d, args, {needsItem = false, workspace = false} = {}) {
  const r = await resolveItem(page, args);
  if (r.error) return {success: false, error: r.error, matches: r.matches};
  if (needsItem && !r.node) return NEEDS_ITEM(ASK);
  const cat = categoryOf(r.model, args);
  const params = {d, item: r.node?.id, cat: cat?.id ?? (r.node ? undefined : page._ottoSelection?.()?.categoryId), open: workspace ? 'workspace' : undefined};
  if (typeof page._ottoOpen === 'function') return page._ottoOpen(d, {itemId: r.node?.id, categoryId: cat?.id, workspace});
  navigate(investigateUrl(params));
  return {success: true, navigating: true, investigation: INVESTIGATION_OF[d], selectedItem: r.node ? {item_id: r.node.id, name: r.node.name} : null, message: 'Opening the investigation in Catalog Intelligence 360.'};
}

const ITEM_ARGS = [
  {name: 'item_id', description: 'sys_id of the catalog item (32 hex characters). Preferred. Omit to use the item currently selected in the application.', type: 'string', required: false},
  {name: 'item_name', description: 'Catalog item name, only if the sys_id is unknown', type: 'string', required: false}
];
const CAT_ARG = {name: 'category_name', description: 'Optional catalog category to focus, by its title', type: 'string', required: false};
const BOUNDARY = ' This is about the actual catalog in this ServiceNow instance: do not answer from general knowledge and do not use data visualisation or knowledge workflows. It only opens a review screen; nothing is changed.';

export const OTTO_TOOLS = {
  show_duplicate_items: {
    description: `Show potentially duplicate or overlapping catalog items. Opens the Duplicates and overlap investigation of Catalog Intelligence 360 with the real candidate groups detected from catalog item names. Use for requests like "show duplicate catalog items", "which items overlap" or "similar requests".${BOUNDARY}`,
    arguments: [...ITEM_ARGS, CAT_ARG],
    definition: async function (args = {}) {
      return open(this, 'overlap', args);
    }
  },
  find_confusing_forms: {
    description: `Find catalog items with confusing or unclear forms: missing or technical question labels, generic labels, required hard questions without guidance. Opens the Form intelligence investigation of Catalog Intelligence 360 with findings read from the real catalog variables. Use for "find items with confusing forms" or "which forms are unclear".${BOUNDARY}`,
    arguments: [...ITEM_ARGS, CAT_ARG],
    definition: async function (args = {}) {
      return open(this, 'form-intelligence', args);
    }
  },
  recommend_category: {
    description: `Recommend a better category for ONE specific catalog item, chosen only among the real existing categories. Opens the category recommendation workspace for that item in Catalog Intelligence 360. Requires an item: pass its sys_id, or omit it to use the item currently selected. If no item is selected the tool says so; then ask the person to select one. Never recommend categories from general knowledge or from spend or procurement taxonomies.${BOUNDARY}`,
    arguments: ITEM_ARGS,
    definition: async function (args = {}) {
      return open(this, 'taxonomy', args, {needsItem: true, workspace: true});
    }
  },
  check_service_alignment: {
    description: `Check whether ONE specific catalog item aligns with an existing ServiceNow service offering, using the native item-to-offering link table and real service offerings. Opens the Service alignment workspace for that item in Catalog Intelligence 360. Requires an item: pass its sys_id, or omit it to use the selected item. If none is selected the tool says so; then ask the person to select one.${BOUNDARY}`,
    arguments: ITEM_ARGS,
    definition: async function (args = {}) {
      return open(this, 'csdm-alignment', args, {needsItem: true, workspace: true});
    }
  },
  prepare_improvements: {
    description: `Prepare improvements for ONE specific catalog item: opens the Transform workspace of Catalog Intelligence 360, where an AI proposal for its short description and description is generated on request, reviewed and edited by the person, and saved only after explicit confirmation. Requires an item: pass its sys_id, or omit it to use the selected item.${BOUNDARY}`,
    arguments: ITEM_ARGS,
    definition: async function (args = {}) {
      return open(this, 'ai-readiness', args, {needsItem: true, workspace: true});
    }
  },
  open_investigation: {
    description: `Open one of the Catalog Intelligence 360 investigations by id: ai-readiness (metadata quality), form-intelligence, overlap (duplicates), taxonomy (categories) or csdm-alignment (service offerings).${BOUNDARY}`,
    arguments: [{name: 'id', description: 'ai-readiness, form-intelligence, overlap, taxonomy or csdm-alignment', type: 'string', required: true}, ...ITEM_ARGS.slice(0, 1), CAT_ARG],
    definition: async function (args = {}) {
      if (!INVESTIGATION_OF[args.id]) return {success: false, error: `Unknown investigation "${args.id}". Use one of: ${Object.keys(INVESTIGATION_OF).join(', ')}.`};
      return open(this, args.id, args);
    }
  }
};

/** What Otto should know about where the person is. Identifiers are native sys_ids; no record contents are sent. */
export async function ottoContext(page, state = {}) {
  const sel = state.itemId ? (await loadCatalog().catch(() => null))?.nodes.find(n => n.id === state.itemId) : null;
  const cat = state.categoryId ? (await loadCatalog().catch(() => null))?.clusters.find(c => c.id === state.categoryId) : null;
  return {
    application: APP_NAME,
    page: state.page,
    investigation: state.investigation ? {id: state.investigation, title: INVESTIGATION_OF[state.investigation]} : null,
    lens: state.lens || null,
    selectedItem: sel ? {item_id: sel.id, name: sel.name, class: sel.cls, class_label: classLabel(sel.cls)} : null,
    category: cat && !cat.uncategorised ? {category_id: cat.id, title: cat.title} : null,
    availableInvestigations: Object.keys(INVESTIGATION_OF),
    guidance: 'Questions about duplicate items, confusing forms, categories, service alignment or improving a catalog item are answered by this application’s tools, from the real catalog. Do not use generic workflows for them.'
  };
}
