import {loadTextFacts, loadVariableStats} from './catalog-data.js';
import {buildAiReadiness} from './investigations/ai-readiness.js';
import {buildFormIntelligence, loadAllVariables} from './investigations/form-intelligence.js';
import {buildOverlap} from './investigations/overlap.js';
import {buildTaxonomy} from './investigations/taxonomy.js';
import {buildCsdm, loadServiceData} from './investigations/csdm.js';

/**
 * The five improvement opportunities, each computed from real records by the existing investigation
 * engines. Every one is reported through `onUpdate` as soon as it is ready, so nothing waits for the rest.
 * Shared by Home and Improve so both always show the same numbers.
 */
export function loadOpportunities(m, onUpdate) {
  let opps = {};
  onUpdate(opps);
  const put = (key, fn) =>
    Promise.resolve()
      .then(fn)
      .then(v => onUpdate((opps = {...opps, [key]: v})))
      .catch(() => onUpdate((opps = {...opps, [key]: {error: true}})));
  put('taxonomy', () => {
    const d = buildTaxonomy(m).discovery;
    return {n: d.affectedIds.length, of: d.stats.active, uncategorised: d.stats.uncategorised};
  });
  put('overlap', () =>
    loadTextFacts(m)
      .catch(() => {})
      .then(() => {
        const d = buildOverlap(m).discovery;
        return {n: d.stats.groups, items: d.affectedIds.length, of: d.stats.active};
      })
  );
  put('meta', () =>
    Promise.all([loadVariableStats(), loadTextFacts(m)]).then(([v]) => {
      const d = buildAiReadiness(m, v).discovery;
      return {n: d.affectedIds.length, of: d.stats.active};
    })
  );
  put('form', () =>
    Promise.all([loadVariableStats(), loadAllVariables()]).then(([v, vars]) => {
      const d = buildFormIntelligence(m, v, vars).discovery;
      return {n: d.affectedIds.length, of: d.stats.withForm};
    })
  );
  put('csdm', () =>
    loadServiceData().then(data => {
      const d = buildCsdm(m, data).discovery;
      return {verified: d.stats.verified, candidates: d.stats.candidates, offerings: d.stats.offerings};
    })
  );
}
