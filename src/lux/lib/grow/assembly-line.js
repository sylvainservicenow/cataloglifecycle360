import {similarItems, suggestCategories, suggestOfferings} from './live-compare.js';
import {
  APPROVAL_STEP,
  DEMO_VARIABLES,
  EXTRACTED_REQUIREMENTS,
  GENERIC_REQUIREMENTS,
  GENERIC_VARIABLES,
  INCOMING,
  STAGES,
  STANDARD_SET,
  STANDARD_VARIABLES,
  WORKFLOW_BASE
} from './scenario.js';

/**
 * THE INTEGRATION BOUNDARY for Grow.
 *
 * The UI talks only to an object shaped like `createAssemblyLine()` returns. Today that object is a
 * simulation: the requirement analysis, draft, governance review and approval are scripted, and only the
 * comparison with the existing catalog reads real (read-only) catalog data. To connect the real AI Catalog
 * Assembly Line, implement the same methods against its services and return that object from here.
 * See docs/grow-integration.md for the mapping. Nothing in this file writes to the platform.
 */

export const STAGE_IDS = STAGES.map(s => s.id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const VERB = /^(request|order|book|report|apply|ask|get|submit|register|notify)\b/i;
const sentence = s => s.charAt(0).toUpperCase() + s.slice(1);

/** @typedef {{title:string, description:string, owner:string, type:'item'|'producer', audience:string, files:{name:string,size:number}[]}} Intake */

function buildRequirements(intake) {
  const doc = intake.files.length > 0;
  const base = doc ? EXTRACTED_REQUIREMENTS : GENERIC_REQUIREMENTS;
  const fromText = intake.description
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 30)
    .slice(0, 2)
    .map(text => ({text, source: 'Intake description', kind: 'intent'}));
  return {fromDocuments: doc, items: [...fromText, ...base]};
}

function buildDraft(intake, live) {
  const title = intake.title.trim() || 'New service';
  const demoish = /laptop|device|travel/i.test(title);
  const fields = demoish ? DEMO_VARIABLES : GENERIC_VARIABLES;
  const short = sentence(`${title.toLowerCase()} for ${intake.audience.toLowerCase()}`);
  return {
    id: `draft-${slug(title)}`,
    type: intake.type,
    name: sentence(title),
    shortDescription: short,
    description: intake.description,
    category: live.categories[0] || null,
    categoryOptions: live.categories,
    offerings: live.offerings,
    variables: fields.map(v => ({...v, include: true})),
    variableSets: [],
    workflow: WORKFLOW_BASE.map(s => ({...s})),
    owner: intake.owner,
    audience: intake.audience
  };
}

/** Governance Knowledge Base driven checks (SIMULATED): each finding can carry a one-click fix. */
function buildGovernance(draft, duplicates) {
  const findings = [];
  if (!VERB.test(draft.name)) {
    findings.push({
      id: 'g-naming',
      severity: 'medium',
      rule: 'Naming standard',
      kb: 'KB0010421 §1',
      message: 'Catalog items start with a verb so requesters can scan the portal (“Request …”, “Book …”).',
      fix: {type: 'rename', label: 'Rename', value: `Request a ${draft.name.charAt(0).toLowerCase()}${draft.name.slice(1)}`}
    });
  }
  if (draft.shortDescription.length < 60) {
    findings.push({
      id: 'g-short',
      severity: 'low',
      rule: 'Short description',
      kb: 'KB0010421 §2',
      message: `The short description is ${draft.shortDescription.length} characters. Standard is 60 to 160, saying who it is for and what they get.`,
      fix: {type: 'shortDescription', label: 'Use suggestion', value: `${draft.name.replace(/^Request an? /i, 'Request ')}: a ready-to-use solution for ${draft.audience.toLowerCase()}, approved by the manager and tracked from request to return.`}
    });
  }
  findings.push({
    id: 'g-set',
    severity: 'high',
    blocking: true,
    rule: 'Mandatory variable set',
    kb: 'KB0010421 §4',
    message: `Every item must include the shared “${STANDARD_SET.name}” set so requester data is captured the same way everywhere.`,
    fix: {type: 'variableSet', label: 'Add variable set', value: STANDARD_SET.name}
  });
  findings.push({
    id: 'g-approval',
    severity: 'high',
    blocking: true,
    rule: 'Approval policy',
    kb: 'KB0010188 §7',
    message: 'Requests that issue company equipment need a manager approval before fulfilment.',
    fix: {type: 'approval', label: 'Add approval step', value: APPROVAL_STEP.id}
  });
  const top = duplicates[0];
  if (top && top.score >= 0.3) {
    findings.push({
      id: 'g-overlap',
      severity: 'medium',
      rule: 'Avoid duplicate items',
      kb: 'KB0010188 §2',
      message: `“${top.name}” already exists and reads ${Math.round(top.score * 100)}% alike. Confirm this is a distinct service or extend the existing item.`,
      fix: {type: 'acknowledge', label: 'Keep separate', value: top.id}
    });
  }
  findings.push({
    id: 'g-icon',
    severity: 'info',
    rule: 'Portal presentation',
    kb: 'KB0010421 §6',
    message: 'No icon or picture is proposed yet. An icon helps the item stand out in the portal.',
    fix: {type: 'acknowledge', label: 'Add later', value: 'icon'}
  });
  return findings;
}

/**
 * @param {{model:object, services:object|null}} env  live, read-only catalog context already loaded by the app
 */
export function createAssemblyLine(env) {
  return {
    mode: 'simulation',
    /** The intake queue. The real line would read service owner intake requests. */
    listRequests: async () => INCOMING.map(r => ({...r, intake: {...r.intake, files: r.intake.files.map(f => ({...f}))}})),

    /**
     * Runs the five stages. `onStage(stageId, 'running' | 'done' | 'attention')` is called as each moves.
     * The real line would stream these from its pipeline (Content Understanding, duplicate detection,
     * Catalog Builder + Now Assist, governance KB, review task).
     */
    async analyse(/** @type {Intake} */ intake, onStage = () => {}) {
      const step = async (id, ms, fn) => {
        onStage(id, 'running');
        await wait(ms);
        const out = fn ? fn() : undefined;
        return out;
      };
      const requirements = await step('requirements', 1100, () => buildRequirements(intake));
      onStage('requirements', 'done');

      // LIVE: compares with the real catalog, read only
      const matches = await step('duplicates', 1000, () => similarItems(env.model, intake.title, intake.description));
      const strong = matches[0]?.score >= 0.3;
      onStage('duplicates', strong ? 'attention' : 'done');

      const live = {matches, categories: suggestCategories(env.model, intake.title, matches), offerings: suggestOfferings(env.services, intake.title, intake.description)};
      const draft = await step('draft', 1300, () => buildDraft(intake, live));
      onStage('draft', 'done');

      const findings = await step('governance', 1000, () => buildGovernance(draft, matches));
      onStage('governance', findings.some(f => f.blocking) ? 'attention' : 'done');

      await step('review', 500);
      onStage('review', 'attention');
      return {
        id: `PRP-${Math.floor(1000 + Math.random() * 8000)}`,
        simulated: true,
        intake,
        requirements,
        duplicates: {live: true, matches, verdict: !matches.length ? 'none' : strong ? 'overlap' : 'related'},
        draft,
        governance: {kb: 'Catalog Governance Standard (simulated)', findings}
      };
    },

    /** The real line would complete or reject the human review task and, on approval, hand over to Catalog Builder. */
    async submitDecision(proposal, decision) {
      await wait(450);
      return {
        simulated: true,
        decision: decision.outcome,
        at: new Date(),
        note: decision.outcome === 'approved' ? 'No catalog record was created. The real line would now create a draft item through Catalog Builder.' : 'No catalog record was created or changed.'
      };
    }
  };
}

export {STANDARD_VARIABLES, APPROVAL_STEP, STANDARD_SET};
