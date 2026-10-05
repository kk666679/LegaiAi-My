'use strict';

const { NoRouteError } = require('./errors');

/**
 * Task → agent routing.
 *
 * Two ways in, in this order:
 *   1. an explicit `task.type` (with an optional `task.hint` to pick a
 *      specific reviewer), or
 *   2. shape inference over `task.input` — the first matching rule wins.
 *
 * Routing never guesses past the evidence: with no type and no matching shape
 * the answer is `{ primary: null, reason: 'no-match' }`. `dispatchStrict`
 * turns that into a `NoRouteError`; `dispatch` returns it.
 */

/** Explicit task.type → agent id. */
const TYPE_MAP = Object.freeze({
  issue: 'issue-spotter',
  rule: 'rule-finder',
  retrieve: 'rule-finder',
  precedent: 'precedent-analyst',
  statute: 'statute-interpreter',
  validate: 'citation-validator',
  draft: 'drafter',
  argue: 'devil-advocate',
  risk: 'risk-scorer',
  summarize: 'summariser',
  synthesize: 'summariser',
  translate: 'translator-ms',
  review: 'qa-reviewer'
});

/** Valid `hint` values for the reviewer types. Anything else is ignored. */
const HINTS = Object.freeze({
  validate: ['citation-validator', 'qa-reviewer'],
  review: ['qa-reviewer'],
  argue: ['devil-advocate']
});

const SHAPE_RULES = Object.freeze([
  { agent: 'translator-ms', match: i => typeof i.text === 'string' && !!(i.to || i.from) },
  { agent: 'summariser', match: i => typeof i.text === 'string' && i.maxTokens != null },
  { agent: 'summariser', match: i => Array.isArray(i.hits) },
  { agent: 'qa-reviewer', match: i => i.proposal != null && Array.isArray(i.findings) },
  { agent: 'citation-validator', match: i => i.proposal != null },
  { agent: 'drafter', match: i => i.docType != null || i.document != null },
  { agent: 'devil-advocate', match: i => Array.isArray(i.argument) },
  { agent: 'precedent-analyst', match: i => i.citation != null || Array.isArray(i.precedents) },
  { agent: 'statute-interpreter', match: i => Array.isArray(i.rules) && Array.isArray(i.issues) },
  { agent: 'rule-finder', match: i => Array.isArray(i.issues) || typeof i.q === 'string' },
  { agent: 'risk-scorer', match: i => Array.isArray(i.risks) || i.exposure != null },
  { agent: 'issue-spotter', match: i => typeof i.query === 'string' }
]);

function _hint(task) {
  const allowed = HINTS[task.type];
  return allowed && task.hint && allowed.includes(task.hint) ? task.hint : null;
}

/**
 * @param {{type?:string, hint?:string, input?:object}} task
 * @returns {{primary:string|null, candidates:string[], reason:string}}
 */
function route(task = {}) {
  const hint = _hint(task);
  if (task.type && TYPE_MAP[task.type]) {
    const primary = hint || TYPE_MAP[task.type];
    return { primary, candidates: [primary], reason: hint ? `type:${task.type}+hint` : `type:${task.type}` };
  }

  const input = task.input || {};
  for (const rule of SHAPE_RULES) {
    if (rule.match(input)) {
      const primary = hint || rule.agent;
      return { primary, candidates: [primary], reason: `shape:${rule.agent}` };
    }
  }
  return { primary: null, candidates: [], reason: 'no-match' };
}

async function dispatch(runtime, task = {}, opts = {}) {
  const r = route(task);
  if (!r.primary) return { ...r, result: null };
  const result = await runtime.invoke(r.primary, task.input || {}, opts);
  return { ...r, result };
}

async function dispatchStrict(runtime, task = {}, opts = {}) {
  const r = await dispatch(runtime, task, opts);
  if (!r.primary) throw new NoRouteError(task);
  return r;
}

module.exports = { route, dispatch, dispatchStrict, TYPE_MAP, HINTS, SHAPE_RULES };