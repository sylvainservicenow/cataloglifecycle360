import {i18n} from '@servicenow/aiux/aiux-services';
import {CLASSIFICATION, makeDiscovery, nodeIndex, severityFromShare} from '../discovery.js';

const fmt = n => new Intl.NumberFormat().format(n);
export const READINESS_VERSION = 'ai-readiness@1.0';

/**
 * Method thresholds, stated to the user in the evidence panel. They are
 * deliberately plain and few: the aim is to find clear, checkable gaps, not
 * to produce a score.
 */
export const THRESHOLDS = {minShortWords: 4, minDescriptionChars: 60};

/** Classes that carry a form. Content items only display information, so form checks do not apply. */
const NO_FORM = new Set(['sc_cat_item_content']);
/** Record producers create a record from their form, so an empty form makes them unusable. */
const PRODUCERS = new Set(['sc_cat_item_producer', 'sc_cat_item_composite_producer', 'std_change_record_producer']);
/** Variable types that lay out or decorate the form rather than collect an answer. */
const LAYOUT_TYPES = new Set(['11', '19', '20', '22', '24', '26']);

export const DIMENSIONS = [
  {id: 'discoverability', label: () => i18n.getMessage('Discoverability'), scored: true, blurb: () => i18n.getMessage('Can an agent tell this item apart and find it?')},
  {id: 'conversational', label: () => i18n.getMessage('Conversational understanding'), scored: true, blurb: () => i18n.getMessage('Is there enough language for an agent to know when it applies?')},
  {id: 'form', label: () => i18n.getMessage('Form usability'), scored: true, blurb: () => i18n.getMessage('Can an agent collect what the form asks for?')},
  {id: 'fulfilment', label: () => i18n.getMessage('Fulfilment context'), scored: false, blurb: () => i18n.getMessage('Shown for context. Missing fulfilment fields are never counted against an item.')},
  {id: 'csdm', label: () => i18n.getMessage('CSDM context'), scored: false, blurb: () => i18n.getMessage('A separate dimension. No item is marked down for lacking a service association.')}
];

const words = s => (s ? s.split(/\s+/).filter(Boolean).length : 0);

/**
 * Catalog-wide checks. Each one reads fields already loaded for the whole
 * catalog (plus variable counts), returns pass/fail and a plain explanation,
 * and says when it does not apply.
 */
export const CHECKS = [
  {
    id: 'name-readable', dimension: 'discoverability',
    label: () => i18n.getMessage('Name reads as a service'),
    rule: () => i18n.getMessage('Fails if the name has underscores, is a single long run-on word with no spaces, or is shorter than 4 characters.'),
    test: n => {
      const bad = /_/.test(n.name) || (!/\s/.test(n.name) && n.name.length > 14) || n.name.trim().length < 4;
      return bad ? {pass: false, detail: i18n.getMessage('"{0}" looks like an identifier rather than a service name.', n.name)} : {pass: true};
    }
  },
  {
    id: 'name-unique', dimension: 'discoverability',
    label: () => i18n.getMessage('Name distinguishes the item'),
    rule: () => i18n.getMessage('Fails if another active item has the same name once punctuation and case are ignored.'),
    test: (n, ctx) => {
      const others = (ctx.nameCount.get(n.nameKey) || 0) - 1;
      return others > 0 ? {pass: false, detail: i18n.getMessage('{0} other active item(s) share this name, so an agent cannot tell them apart by name.', String(others))} : {pass: true};
    }
  },
  {
    id: 'short-present', dimension: 'discoverability',
    label: () => i18n.getMessage('Short description present'),
    rule: () => i18n.getMessage('Fails if the short description is empty.'),
    test: n => (n.flags.shortDescription ? {pass: true} : {pass: false, detail: i18n.getMessage('No short description is recorded.')})
  },
  {
    id: 'short-informative', dimension: 'discoverability',
    label: () => i18n.getMessage('Short description adds information'),
    rule: () => i18n.getMessage('Fails if it repeats the name, or has fewer than {0} words.', String(THRESHOLDS.minShortWords)),
    applies: n => n.flags.shortDescription,
    test: n => {
      const same = n.shortDescription.toLowerCase() === n.name.toLowerCase();
      if (same) return {pass: false, detail: i18n.getMessage('The short description only repeats the name.')};
      return words(n.shortDescription) < THRESHOLDS.minShortWords ? {pass: false, detail: i18n.getMessage('Only {0} word(s): too little to say when the item applies.', String(words(n.shortDescription)))} : {pass: true};
    }
  },
  {
    id: 'desc-present', dimension: 'conversational',
    label: () => i18n.getMessage('Description present'),
    rule: () => i18n.getMessage('Fails if the description is empty.'),
    test: n => (n.flags.description ? {pass: true} : {pass: false, detail: i18n.getMessage('No description is recorded.')})
  },
  {
    id: 'desc-substantive', dimension: 'conversational',
    label: () => i18n.getMessage('Description explains the service'),
    rule: () => i18n.getMessage('Fails if the plain-text description is shorter than {0} characters.', String(THRESHOLDS.minDescriptionChars)),
    applies: n => n.flags.description,
    test: n => (n.descLen < THRESHOLDS.minDescriptionChars ? {pass: false, detail: i18n.getMessage('{0} characters: too brief to explain the service.', String(n.descLen))} : {pass: true})
  },
  {
    id: 'form-present', dimension: 'form',
    label: () => i18n.getMessage('Record producer has a form'),
    rule: () => i18n.getMessage('Applies to record producers only. Fails if no active variable is reachable directly or through a variable set. Other item types may legitimately have no form.'),
    applies: n => PRODUCERS.has(n.cls),
    test: (n, ctx) => {
      if (!ctx.variables) return {pass: null, detail: i18n.getMessage('Variable counts are not loaded.')};
      return (ctx.variables.get(n.id)?.total || 0) === 0 ? {pass: false, detail: i18n.getMessage('This record producer has no active variables, so an agent has nothing to collect.')} : {pass: true};
    }
  }
];

const applicable = (check, n) => (check.dimension === 'form' && NO_FORM.has(n.cls) ? false : check.applies ? check.applies(n) : true);

/** Run every check for one item. `variables` is the Map from loadVariableStats(), or null. */
export function assessItem(n, ctx) {
  const results = CHECKS.map(c => {
    if (!applicable(c, n)) return {check: c, state: 'na'};
    const r = c.test(n, ctx);
    return {check: c, state: r.pass === null ? 'pending' : r.pass ? 'pass' : 'fail', detail: r.detail};
  });
  return {id: n.id, results, failed: results.filter(r => r.state === 'fail')};
}

/**
 * Item-level checks on the variables themselves. Loaded on demand for one
 * item, because the catalog holds thousands of variables.
 */
export function assessVariables(vars) {
  const inputs = vars.filter(v => !LAYOUT_TYPES.has(String(v.type)));
  const findings = [];
  for (const v of inputs) {
    const issues = [];
    if (!v.label) issues.push(i18n.getMessage('No label: an agent sees only the technical name "{0}".', v.name));
    else if (v.label.toLowerCase() === v.name.toLowerCase() || /^[a-z0-9]+(_[a-z0-9]+)+$/.test(v.label)) issues.push(i18n.getMessage('The label looks like a technical name.'));
    else if (v.label.length < 3) issues.push(i18n.getMessage('The label is too short to be meaningful.'));
    if (v.mandatory && !v.help && !v.hint) issues.push(i18n.getMessage('Required input with no help text or hint.'));
    if (issues.length) findings.push({variable: v, issues});
  }
  const dupes = new Map();
  inputs.forEach(v => v.label && dupes.set(v.label.toLowerCase(), (dupes.get(v.label.toLowerCase()) || 0) + 1));
  const ambiguous = [...dupes.entries()].filter(([, c]) => c > 1).map(([label, count]) => ({label, count}));
  return {inputs: inputs.length, required: inputs.filter(v => v.mandatory).length, findings, ambiguous};
}

/**
 * Build the AI Readiness discovery. `variableStats` may be null while it
 * loads; checks that need it then report "pending" instead of guessing.
 */
export function buildAiReadiness(model, variableStats) {
  const active = model.nodes.filter(n => n.active);
  const nameCount = new Map();
  active.forEach(n => nameCount.set(n.nameKey, (nameCount.get(n.nameKey) || 0) + 1));
  const ctx = {nameCount, variables: variableStats?.items || null};
  const assessments = new Map();
  active.forEach(n => assessments.set(n.id, assessItem(n, ctx)));
  const attention = active.filter(n => assessments.get(n.id).failed.length > 0);
  const share = active.length ? attention.length / active.length : 0;
  const perCheck = CHECKS.map(c => ({check: c, failed: active.filter(n => assessments.get(n.id).results.find(r => r.check === c)?.state === 'fail').length}));
  const d = makeDiscovery({
    id: 'ai-readiness',
    type: 'ai-readiness',
    dimension: 'ai-readiness',
    title: i18n.getMessage('Items a conversational agent may struggle with'),
    summary: i18n.getMessage('{0} of {1} active items fail at least one deterministic readiness check.', fmt(attention.length), fmt(active.length)),
    why: i18n.getMessage('An agent picks and fills in catalog items from their names, descriptions and forms. Vague, duplicated or missing text makes it choose the wrong item or ask the user needless questions.'),
    evidence: {
      sources: [
        {table: 'sc_cat_item', fields: ['name', 'short_description', 'description', 'sys_class_name', 'active'], note: i18n.getMessage('Every readable item, active items assessed.')},
        {table: 'item_option_new', fields: ['cat_item', 'variable_set', 'active'], note: i18n.getMessage('Counted by aggregate. Individual variables are read only when you open an item.')},
        {table: 'io_set_item', fields: ['sc_cat_item', 'variable_set'], note: i18n.getMessage('Links items to variable sets.')}
      ]
    },
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('Objective checks on native fields. They find clear gaps; they do not judge whether the wording is good. That needs the semantic assessment, which is separate and labelled as such.'),
      criteria: CHECKS.map(c => ({key: c.id, dimension: c.dimension, label: c.label(), rule: c.rule()}))
    },
    affectedIds: attention.map(n => n.id),
    severity: {
      level: severityFromShare(share, active.length),
      rationale: i18n.getMessage('Rated from the share of active items with at least one failed check: 50% or more is high, 20% or more is medium, anything less is low. Each check counts once and none is weighted; this is not a readiness score.')
    },
    recommendedAction: {
      id: 'prepare-ai-readiness-improvements',
      label: i18n.getMessage('Prepare AI Readiness Improvements'),
      summary: i18n.getMessage('Review the issues for chosen items and prepare better wording as proposals for human approval. Nothing is written to catalog records.')
    },
    nextSteps: [
      i18n.getMessage('Open an item to see which checks it fails and why.'),
      i18n.getMessage('Run the semantic assessment for wording clarity (needs the AI capability).'),
      i18n.getMessage('Review proposed wording item by item.'),
      i18n.getMessage('Approve, then apply to catalog records in a later phase.')
    ],
    assessedAt: new Date().toISOString(),
    version: READINESS_VERSION,
    stats: {active: active.length, inactive: model.nodes.length - active.length, perCheck, pending: !variableStats}
  });
  return {discovery: d, assessments, ctx};
}

export function itemAssessment(model, readiness, id) {
  const n = nodeIndex(model).get(id);
  return n ? readiness.assessments.get(id) || assessItem(n, readiness.ctx) : null;
}

/** Items that count towards a marker colour: number of failed checks, no weighting. */
export const failedCount = (readiness, id) => readiness.assessments.get(id)?.failed.length ?? 0;
