import {navigate} from '@servicenow/aiux/aiux-client';
import {i18n} from '@servicenow/aiux/aiux-services';

/**
 * The context handoff between Understand, Grow and Improve.
 *
 * A handoff says: "from this investigation, for these catalog records, the person wants to do this, and
 * here is where to come back to". It holds only identifiers and display names that already exist in the
 * catalog (sys_ids, titles), the investigation id and an application-relative return path. It is kept in
 * memory and sessionStorage of this browser tab only: never in the URL, never sent anywhere, no table.
 *
 *   action   create-item | fill-gap | create-variant   (Grow)     consolidate | simplify | reclassify   (Improve)
 *   source   {investigation, lens}                      where it was discovered
 *   item     {id, name}                                 an existing catalog item
 *   group    {ids: [sys_id…]}                           look-alike items (overlap)
 *   category {id, title}                                a category
 *   service  {id, name}                                 a service offering
 *   returnTo '/explore?…'                               how to get back to what the person was looking at
 *   stage    'remediating' while an Improve action is being worked in Understand
 */
const KEY = 'cat360.handoff';

export const ACTIONS = {
  'create-item': {pillar: 'grow', label: () => i18n.getMessage('Grow: Create item')},
  'fill-gap': {pillar: 'grow', label: () => i18n.getMessage('Grow: Fill gap')},
  'create-variant': {pillar: 'grow', label: () => i18n.getMessage('Grow: Create variant')},
  consolidate: {pillar: 'improve', label: () => i18n.getMessage('Improve: Consolidate')},
  simplify: {pillar: 'improve', label: () => i18n.getMessage('Improve: Simplify')},
  reclassify: {pillar: 'improve', label: () => i18n.getMessage('Improve: Reclassify')}
};

let current = null;
try {
  const saved = typeof sessionStorage !== 'undefined' ? JSON.parse(sessionStorage.getItem(KEY) || 'null') : null;
  if (saved && ACTIONS[saved.action]) current = saved;
} catch {
  /* storage unavailable: memory only */
}

const store = () => {
  try {
    if (current) sessionStorage.setItem(KEY, JSON.stringify(current));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export const pillarOf = action => ACTIONS[action]?.pillar || null;
export const getHandoff = () => current;

export function clearHandoff() {
  current = null;
  store();
}

/** Marks a handoff as used by the page it was meant for, so a later visit starts clean. */
export function consumeHandoff() {
  if (current) {
    current = {...current, consumed: true};
    store();
  }
}

export function patchHandoff(patch) {
  if (current) {
    current = {...current, ...patch};
    store();
  }
}

/** The handoff meant for a pillar and not yet used (or, for Improve, still being worked). */
export function pendingFor(pillar) {
  if (!current || pillarOf(current.action) !== pillar) return null;
  return current.consumed && current.stage !== 'remediating' ? null : current;
}

/** Stores the context and moves to the pillar that owns the action. */
export function startHandoff(ctx) {
  if (!ACTIONS[ctx.action]) return;
  current = {...ctx, consumed: false, stage: undefined};
  store();
  navigate(pillarOf(ctx.action) === 'grow' ? '/grow' : '/improve');
}

/** One line saying where the person came from. */
export function sourceLabel(h) {
  const names = {
    'ai-readiness': i18n.getMessage('Metadata investigation'),
    'form-intelligence': i18n.getMessage('Form investigation'),
    overlap: i18n.getMessage('Overlap investigation'),
    taxonomy: i18n.getMessage('Category investigation'),
    'csdm-alignment': i18n.getMessage('Service investigation')
  };
  return names[h?.source?.investigation] || i18n.getMessage('the catalog universe');
}
