'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const agents = require('../agents');
const { Registry } = require('../registry');
const { CHAINS } = agents;

/** A private registry per runtime — `defaultRegistry` refuses re-binding impls. */
function makeRuntime(skills) {
  return agents.createRuntime({ registry: new Registry(), skills });
}

function demoSkills() {
  const prev = ctx => (ctx && ctx.prev) || {};
  const out = (ctx, skill) => (ctx && ctx.outputs && ctx.outputs[skill]) || {};
  return {
    'issue.extract': async ({ query }) => ({
      issues: String(query || '').split(/[?.!]+/).map(s => s.trim()).filter(Boolean)
    }),
    'issue.rank': async ({ issues }, ctx) => ({ issues: issues || out(ctx, 'issue.extract').issues || [] }),
    'rule.lookup': async () => ({ rules: [{ id: 'R1', text: 'x' }] }),
    'rule.synthesize': async ({ rules } = {}, ctx) => ({ rules: rules || prev(ctx).rules || [] }),
    'precedent.retrieve': async ({ citation } = {}) => ({ precedents: citation ? [{ id: citation }] : [] }),
    'precedent.compare': async ({ precedents } = {}, ctx) => ({
      precedents: precedents || prev(ctx).precedents || [],
      analysis: 'ok'
    }),
    'application.map': async ({ rules = [], issues = [] } = {}, ctx) => ({
      provisions: rules.length ? rules : (prev(ctx).rules || []),
      analysis: `${(rules.length ? rules : prev(ctx).rules || []).length}/${issues.length}`
    }),
    'conclusion.write': async ({ analysis } = {}, ctx) => ({ conclusion: analysis || prev(ctx).analysis || '' }),
    'draft.compose': async ({ docType = 'Affidavit' } = {}) => ({ document: docType }),
    'validate.consistency': async () => ({ vote: 'yes', confidence: 0.8, rationale: 'ok', findings: [] }),
    'validate.citation': async ({ proposal = '', rules = [] } = {}) => {
      const found = [...String(proposal).matchAll(/\[([A-Za-z0-9_.:-]+)\]/g)].map(m => m[1]);
      const known = new Set(rules.map(r => r.id));
      const unknown = found.filter(r => !known.has(r));
      return unknown.length
        ? { vote: 'no', confidence: 0.8, rationale: `unknown: ${unknown.join(',')}`, findings: [] }
        : { vote: 'yes', confidence: 0.85, rationale: 'ok', findings: [] };
    },
    'validate.logic': async () => ({ vote: 'yes', confidence: 0.7, rationale: 'ok', findings: [] }),
    'argument.construct': async ({ conclusion } = {}) => ({ counterarguments: [`no cause: ${conclusion || 'n/a'}`] }),
    'risk.assess': async () => ({ risks: [{ risk: 'costs' }] }),
    'risk.quantify': async ({ risks } = {}, ctx) => ({ risks: risks || prev(ctx).risks || [], exposure: 25000 }),
    'summarize.long': async ({ text = '' } = {}) => ({ summary: String(text).slice(0, 40) }),
    'translate.en-ms': async ({ text } = {}) => ({ text: String(text || '').replace(/\bthe\b/gi, 'itu'), lang: 'ms' })
  };
}

test('agents: every registry agent has a chain', () => {
  const runtime = makeRuntime({});
  const ids = runtime.list();
  assert.equal(ids.length, 11);
  for (const id of ids) assert.ok(CHAINS[id], `missing chain: ${id}`);
});

test('agents: every chain skill id is covered by the demo implementations', () => {
  const runtime = makeRuntime(demoSkills());
  for (const id of runtime.list()) {
    for (const skill of CHAINS[id].skills) {
      assert.ok(runtime.hasSkill(skill), `${id} → ${skill} has no implementation`);
    }
  }
});

test('agents: no skills wired means escalate, not success', async () => {
  const r = await makeRuntime({}).invoke('issue-spotter', { query: 'x' });
  assert.equal(r.outcome, 'escalate');
  assert.equal(r.reason, 'empty-output');
  assert.ok(r.steps.every(s => s.reason === 'no-implementation'));
});

test('agents: issue-spotter runs its two-step chain', async () => {
  const r = await makeRuntime(demoSkills()).invoke('issue-spotter', { query: 'Is this unfair dismissal? Also breach?' });
  assert.equal(r.outcome, 'ok');
  assert.ok(r.output.issues.length >= 2);
  assert.equal(r.steps.length, 2);
  assert.ok(r.steps.every(s => s.ok));
  assert.equal(r.agent, 'issue-spotter');
  assert.match(r.invocationId, /^inv_\d+_/);
  assert.match(r.runId, /^run_\w+/);
});

test('agents: a skill error is captured, never thrown', async () => {
  const runtime = makeRuntime({ 'issue.extract': async () => { throw new Error('boom'); } });
  const r = await runtime.invoke('issue-spotter', { query: 'x' });
  assert.equal(r.outcome, 'failed');
  assert.match(r.reason, /boom/);
  assert.equal(r.steps.length, 1, 'the chain stops at the failure');
  assert.equal(r.steps[0].skill, 'issue.extract');
});

test('agents: validator agents never escalate on an abstain vote', async () => {
  const runtime = makeRuntime(demoSkills());
  const r = await runtime.invoke('citation-validator', { proposal: 'See [R9].', rules: [{ id: 'R1' }] });
  assert.equal(r.outcome, 'ok');
  assert.equal(r.output.vote, 'no');
  assert.ok(r.output.confidence > 0);
});

test('agents: qa-reviewer is minority-veto across three validators', async () => {
  const runtime = makeRuntime({
    ...demoSkills(),
    'validate.citation': async () => ({ vote: 'no', confidence: 0.4, rationale: 'missing authority' })
  });
  const r = await runtime.invoke('qa-reviewer', { proposal: 'See [R9].' });
  assert.equal(r.outcome, 'ok');
  assert.equal(r.output.vote, 'no');
  assert.equal(r.output.confidence, 0.4, 'the weakest reviewer sets the bar');
  assert.equal(r.steps.length, 3);
});

test('agents: risk-scorer surfaces exposure and risks', async () => {
  const r = await makeRuntime(demoSkills()).invoke('risk-scorer', {});
  assert.equal(r.outcome, 'ok');
  assert.equal(r.output.exposure, 25000);
  assert.ok(Array.isArray(r.output.risks));
});

test('agents: unknown agent throws UnknownAgentError', () => {
  assert.throws(() => makeRuntime({}).get('nope'), /Unknown agent/);
});

test('agents: an agent with no chain throws ChainEmptyError', async () => {
  const runtime = makeRuntime({});
  const orphan = new agents.BaseAgent({ id: 'orphan', meta: {}, runtime });
  await assert.rejects(() => orphan.invoke({}), /has no chain/);
});

test('agents: router maps explicit types', () => {
  assert.equal(agents.route({ type: 'issue' }).primary, 'issue-spotter');
  assert.equal(agents.route({ type: 'retrieve' }).primary, 'rule-finder');
  assert.equal(agents.route({ type: 'draft' }).primary, 'drafter');
  assert.equal(agents.route({ type: 'translate' }).primary, 'translator-ms');
  assert.equal(agents.route({ type: 'validate' }).primary, 'citation-validator');
  assert.equal(agents.route({ type: 'validate', hint: 'qa-reviewer' }).primary, 'qa-reviewer');
  assert.equal(agents.route({ type: 'validate', hint: 'nonsense' }).primary, 'citation-validator', 'unknown hints are ignored');
});

test('agents: router infers from input shape', () => {
  assert.equal(agents.route({ input: { query: 'x' } }).primary, 'issue-spotter');
  assert.equal(agents.route({ input: { q: 'unfair dismissal' } }).primary, 'rule-finder');
  assert.equal(agents.route({ input: { issues: [] } }).primary, 'rule-finder');
  assert.equal(agents.route({ input: { rules: [], issues: [] } }).primary, 'statute-interpreter');
  assert.equal(agents.route({ input: { hits: [] } }).primary, 'summariser');
  assert.equal(agents.route({ input: { proposal: 'See [R1]' } }).primary, 'citation-validator');
  assert.equal(agents.route({ input: { proposal: 'x', findings: [] } }).primary, 'qa-reviewer');
  assert.equal(agents.route({ input: { text: 'x', to: 'ms' } }).primary, 'translator-ms');
  assert.equal(agents.route({ input: { text: 'x', maxTokens: 100 } }).primary, 'summariser');
  assert.equal(agents.route({ input: { docType: 'Writ' } }).primary, 'drafter');
  assert.equal(agents.route({ input: { argument: [] } }).primary, 'devil-advocate');
  assert.equal(agents.route({ input: { citation: '[2021] XYZ 1' } }).primary, 'precedent-analyst');
  assert.equal(agents.route({ input: { risks: [] } }).primary, 'risk-scorer');
});

test('agents: router reports no-match rather than guessing', () => {
  const r = agents.route({ input: { nothing: true } });
  assert.equal(r.primary, null);
  assert.equal(r.reason, 'no-match');
});

test('agents: dispatch routes and invokes', async () => {
  const out = await agents.dispatch(makeRuntime(demoSkills()), { input: { q: 'unfair dismissal' } });
  assert.equal(out.primary, 'rule-finder');
  assert.equal(out.result.outcome, 'ok');
  assert.equal(out.result.output.rules.length, 1);
});

test('agents: dispatchStrict throws NoRouteError', async () => {
  await assert.rejects(() => agents.dispatchStrict(makeRuntime(demoSkills()), { input: {} }), /No agent matches/);
});

test('agents: invokeAll batches several agents', async () => {
  const out = await makeRuntime(demoSkills()).invokeAll(['issue-spotter', 'translator-ms'], { query: 'x', text: 'the court' });
  assert.equal(out['issue-spotter'].outcome, 'ok');
  assert.equal(out['translator-ms'].output.text, 'itu court');
  assert.equal(out['translator-ms'].output.lang, 'ms');
});

test('agents: runtime stats accumulate per outcome', async () => {
  const runtime = makeRuntime(demoSkills());
  await runtime.invoke('issue-spotter', { query: 'x' });
  await runtime.invoke('retriever-missing', { q: 'x' }).catch(() => {});
  const ok = runtime.stats();
  assert.equal(ok.invocations, 1);
  assert.equal(ok.ok, 1);
  assert.equal(ok.agents, 1);
});

test('agents: injected deps are never overwritten', () => {
  const logger = { child: () => logger, info() {}, warn() {}, error() {} };
  const runtime = agents.createRuntime({ registry: new Registry(), skills: {}, deps: { logger } });
  assert.equal(runtime.deps.logger, logger);
  assert.ok(runtime.deps.tracer, 'the missing ones are filled from observability');
});

test('agents: observability stack records a span per invocation', async () => {
  const runtime = makeRuntime(demoSkills());
  await runtime.invoke('issue-spotter', { query: 'x' });
  const traces = runtime.deps.tracer.listTraces();
  assert.equal(traces.length, 1);
  assert.equal(traces[0].failed, 0);
  assert.ok(runtime.deps.metrics, 'metrics are wired by default');
});

test('agents: registry consumers reach the runtime through getAgent(id).invoke', async () => {
  const registry = new Registry();
  const runtime = agents.createRuntime({ registry, skills: demoSkills() });
  runtime.get('issue-spotter');

  assert.equal(registry.hasAgentImpl('issue-spotter'), true);
  const viaRegistry = await registry.getAgent('issue-spotter').invoke({ query: 'unfair dismissal? breach too?' });
  assert.equal(viaRegistry.outcome, 'ok');
  assert.ok(viaRegistry.output.issues.length >= 2);
});

test('agents: listMeta reports catalogue metadata plus the chain', () => {
  const rows = makeRuntime({}).listMeta();
  const spotter = rows.find(r => r.id === 'issue-spotter');
  assert.equal(spotter.role, 'analyst');
  assert.equal(spotter.model, 'legal-reasoner-v1');
  assert.equal(spotter.hitlLevel, 0);
  assert.deepEqual(spotter.skills, ['issue.extract', 'issue.rank']);
});