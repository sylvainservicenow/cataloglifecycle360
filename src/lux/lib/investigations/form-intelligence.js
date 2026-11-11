import {i18n} from '@servicenow/aiux/aiux-services';
import {fetchAll, plain, val} from '../catalog-data.js';
import {CLASSIFICATION, makeDiscovery, severityFromShare} from '../discovery.js';
import {fmt} from './tokens.js';

export const FORM_VERSION = 'form-intelligence@1.0';

/** Variable types that lay out the form rather than ask a question (label, break, containers, macros, HTML). */
const NON_INPUT = new Set(['11', '12', '14', '15', '17', '19', '20', '23', '24']);
/** Inputs whose purpose is rarely obvious from a short label alone. */
const NEEDS_GUIDANCE = new Set(['2', '21']);
const GENERIC = new Set(['details', 'detail', 'info', 'information', 'other', 'misc', 'value', 'field', 'text', 'input', 'data', 'select', 'choose', 'item', 'type', 'option', 'reason']);

export const isInput = v => !NON_INPUT.has(String(v.type));

/** Underscores, camelCase / PascalCase run together, field prefixes and template tokens. A label that merely matches the variable name ("Name") is fine. */
const looksTechnical = label => !!label && !/\s/.test(label) && (/[a-z0-9]+_[a-z0-9_]+/i.test(label) || /[a-z][A-Z]/.test(label) || /^(u_|sys_|x_)/.test(label)) || /\$\{|\{\{/.test(label || '');

/**
 * Objective findings for ONE variable. Help text is only expected where it plausibly
 * helps: a required, non-obvious input. A missing help text on a clear optional
 * question is not a defect.
 */
export function assessVariable(v) {
  if (!isInput(v)) return [];
  const issues = [];
  const label = v.label;
  const words = label ? label.split(/\s+/).filter(Boolean) : [];
  if (!label) issues.push({id: 'missing-label', level: 'high', text: i18n.getMessage('No question label: an agent and a requester see only the technical name “{0}”.', v.name)});
  else {
    if (looksTechnical(label)) issues.push({id: 'technical-label', level: 'high', text: i18n.getMessage('The label looks like a technical identifier (“{0}”).', label)});
    else if (label.length < 3) issues.push({id: 'short-label', level: 'medium', text: i18n.getMessage('The label is too short to be meaningful.')});
    else if (words.length <= 2 && words.every(w => GENERIC.has(w.toLowerCase().replace(/[^a-z]/g, '')))) issues.push({id: 'generic-label', level: 'medium', text: i18n.getMessage('The label “{0}” is generic: it does not say what is being asked.', label)});
  }
  const unguided = !v.help && !v.hint && !v.instructions;
  // Guidance matters for free text and list inputs with a terse label; a clearly labelled reference or choice is self-explanatory.
  const nonObvious = NEEDS_GUIDANCE.has(String(v.type)) && words.length <= 3;
  if (v.mandatory && unguided && nonObvious && label) {
    issues.push({id: 'unguided-required', level: 'medium', text: i18n.getMessage('A required input with a non-obvious purpose has no help text or hint.')});
  }
  return issues;
}

let allCache = null;
/** Every active variable, once (about eleven thousand rows on a large catalog), then cached. */
export function loadAllVariables(force = false) {
  if (!allCache || force) {
    allCache = fetchAll('item_option_new', 'active=true^cat_itemISNOTEMPTY^ORvariable_setISNOTEMPTY', 'sys_id,name,question_text,type,mandatory,help_text,hint,instructions,cat_item,variable_set,order', 8)
      .then(r => {
        if (r.error) throw new Error(r.error);
        return r.rows.map(v => ({
          id: v.sys_id,
          name: v.name || '',
          label: plain(v.question_text),
          type: String(v.type ?? ''),
          mandatory: v.mandatory === 'true',
          help: plain(v.help_text),
          hint: plain(v.hint),
          instructions: plain(v.instructions),
          item: val(v.cat_item),
          set: val(v.variable_set),
          order: Number(v.order) || 0
        }));
      })
      .catch(e => ((allCache = null), Promise.reject(e)));
  }
  return allCache;
}

export const resetVariables = () => (allCache = null);

/** After a verified change, update the cached variable with the value read back from the database (no re-fetch of every variable). */
export async function patchVariables(changes) {
  if (!allCache) return;
  const vars = await allCache;
  for (const c of changes) {
    const v = vars.find(x => x.id === c.id);
    if (!v) continue;
    if (c.field === 'label') v.label = c.value;
    else if (c.field === 'help') v.help = c.value;
  }
}

const CHECKS = () => [
  {id: 'missing-label', label: i18n.getMessage('Missing question label'), rule: i18n.getMessage('An input variable with an empty label.')},
  {id: 'technical-label', label: i18n.getMessage('Technical identifier shown to users'), rule: i18n.getMessage('The label contains underscores, camelCase, a field prefix or simply repeats the variable name.')},
  {id: 'short-label', label: i18n.getMessage('Label too short'), rule: i18n.getMessage('Fewer than three characters.')},
  {id: 'generic-label', label: i18n.getMessage('Generic label'), rule: i18n.getMessage('One or two words that all come from a short list such as “details”, “info”, “other” or “type”.')},
  {id: 'unguided-required', label: i18n.getMessage('Required, non-obvious input without guidance'), rule: i18n.getMessage('A required multi-line or list input with a short label (three words or fewer) and no help text, hint or instructions. Clear labels, optional questions and ordinary choices are not flagged.')},
  {id: 'duplicate-label', label: i18n.getMessage('Repeated question label'), rule: i18n.getMessage('The same label appears on more than one input of one item.')}
];

/**
 * Build the Form Intelligence discovery. `stats` links items to variable sets so a
 * variable from a shared set is assessed once and counted for every item using it.
 */
export function buildFormIntelligence(model, stats, vars) {
  const issuesByVar = new Map();
  const byItem = new Map();
  const bySet = new Map();
  const direct = new Map();
  for (const v of vars) {
    const issues = assessVariable(v);
    if (issues.length) issuesByVar.set(v.id, issues);
    if (v.set && !v.item) (bySet.get(v.set) || bySet.set(v.set, []).get(v.set)).push(v);
    else if (v.item) (direct.get(v.item) || direct.set(v.item, []).get(v.item)).push(v);
  }
  const setUsage = new Map();
  for (const sets of stats.setsOfItem.values()) sets.forEach(s => setUsage.set(s, (setUsage.get(s) || 0) + 1));

  const active = model.nodes.filter(n => n.active);
  const perCheck = new Map();
  for (const n of active) {
    const own = direct.get(n.id) || [];
    const viaSets = [...(stats.setsOfItem.get(n.id) || [])].flatMap(s => bySet.get(s) || []);
    const all = [...own, ...viaSets].sort((a, b) => a.order - b.order);
    const inputs = all.filter(isInput);
    const findings = [];
    const labelCount = new Map();
    inputs.forEach(v => v.label && labelCount.set(v.label.toLowerCase(), (labelCount.get(v.label.toLowerCase()) || 0) + 1));
    for (const v of inputs) {
      const issues = [...(issuesByVar.get(v.id) || [])];
      if (v.label && labelCount.get(v.label.toLowerCase()) > 1) issues.push({id: 'duplicate-label', level: 'low', text: i18n.getMessage('The label “{0}” is used by {1} inputs on this item.', v.label, String(labelCount.get(v.label.toLowerCase())))});
      if (issues.length) findings.push({variable: v, issues, shared: v.set && !v.item ? setUsage.get(v.set) || 1 : 0});
    }
    if (inputs.length) byItem.set(n.id, {inputs: inputs.length, required: inputs.filter(v => v.mandatory).length, findings});
    new Set(findings.flatMap(f => f.issues.map(i => i.id))).forEach(id => perCheck.set(id, (perCheck.get(id) || 0) + 1));
  }
  const attention = active.filter(n => (byItem.get(n.id)?.findings.length || 0) > 0);
  const withForm = active.filter(n => byItem.has(n.id));
  const share = withForm.length ? attention.length / withForm.length : 0;
  const discovery = makeDiscovery({
    id: 'form-intelligence',
    type: 'form-intelligence',
    dimension: 'form',
    title: i18n.getMessage('Items with potentially confusing forms'),
    summary: i18n.getMessage('{0} of {1} active items with a form have at least one question worth reviewing.', fmt(attention.length), fmt(withForm.length)),
    why: i18n.getMessage('People and AI agents fill in a form by reading its questions. A missing or technical label, or no guidance on a hard question, leads to wrong answers and avoidable follow-ups. A finding is a reason to review a question, not proof the form is broken.'),
    evidence: {
      sources: [
        {table: 'item_option_new', fields: ['question_text', 'help_text', 'hint', 'instructions', 'type', 'mandatory', 'cat_item', 'variable_set'], note: i18n.getMessage('Every active variable, read once.')},
        {table: 'io_set_item', fields: ['sc_cat_item', 'variable_set'], note: i18n.getMessage('Links items to shared variable sets.')}
      ]
    },
    method: {
      classification: CLASSIFICATION.DETERMINISTIC,
      description: i18n.getMessage('Objective checks on each variable, with context: help text is only expected on required, non-obvious inputs. Wording quality is judged separately by the AI, on request.'),
      criteria: CHECKS().map(c => ({key: c.id, label: c.label, rule: c.rule}))
    },
    affectedIds: attention.map(n => n.id),
    severity: {
      level: severityFromShare(share, withForm.length),
      rationale: i18n.getMessage('Prevalence is the share of active items with a form that have at least one finding. Not a quality score.')
    },
    recommendedAction: {
      id: 'improve-forms',
      label: i18n.getMessage('Improve this form'),
      summary: i18n.getMessage('Generate clearer question labels and help text for the flagged questions, review and edit them, then apply only what you approve.')
    },
    nextSteps: [
      i18n.getMessage('Open an item to see its questions and what was found.'),
      i18n.getMessage('Generate wording for the flagged questions.'),
      i18n.getMessage('Review, edit and approve each change.'),
      i18n.getMessage('Apply, then verify the saved values.')
    ],
    assessedAt: new Date().toISOString(),
    version: FORM_VERSION,
    stats: {active: active.length, withForm: withForm.length, perCheck: CHECKS().map(c => ({check: c, failed: perCheck.get(c.id) || 0}))}
  });
  return {discovery, byItem, issuesByVar, setUsage};
}

/** Choices of the given select-type variables (one query), with objective problems flagged. */
export async function loadChoices(variableIds) {
  if (!variableIds.length) return new Map();
  const r = await fetchAll('question_choice', `questionIN${variableIds.join(',')}^inactive=false`, 'sys_id,question,text,value,order');
  if (r.error) throw new Error(r.error);
  const by = new Map();
  for (const c of r.rows) {
    const q = val(c.question);
    if (!by.has(q)) by.set(q, []);
    by.get(q).push({id: c.sys_id, text: plain(c.text), value: c.value || '', order: Number(c.order) || 0});
  }
  for (const [q, list] of by) {
    list.sort((a, b) => a.order - b.order);
    const seen = new Map();
    list.forEach(c => seen.set(c.text.toLowerCase(), (seen.get(c.text.toLowerCase()) || 0) + 1));
    list.forEach(c => {
      c.issues = [];
      if (!c.text) c.issues.push(i18n.getMessage('Empty choice label.'));
      else if (looksTechnical(c.text) && c.text === c.value) c.issues.push(i18n.getMessage('The choice label is the technical value.'));
      if (c.text && seen.get(c.text.toLowerCase()) > 1) c.issues.push(i18n.getMessage('Another choice has the same label.'));
    });
    by.set(q, list);
  }
  return by;
}
