import { BaseAgent, ChainEmptyError } from './base-agent.js';
import { defaultRegistry, UnknownAgentError } from '../registry/index.js';
import { Logger, Metrics, Tracer } from '../observability/index.js';

const CHAINS = Object.freeze({
  'issue-spotter': { skills: ['issue.extract', 'issue.rank'], escalate: 'issue-reroute' },
  'rule-finder': { skills: ['rule.lookup', 'rule.synthesize'], escalate: 'rule-reroute' },
  'precedent-analyst': { skills: ['precedent.retrieve', 'precedent.compare'], escalate: 'precedent-reroute' },
  'statute-interpreter': { skills: ['application.map', 'conclusion.write'], escalate: 'statute-reroute' },
  'citation-validator': { skills: ['validate.citation', 'validate.consistency', 'validate.logic'], escalate: 'qa-reviewer' },
  'drafter': { skills: ['draft.compose'], escalate: 'human-review' },
  'devil-advocate': { skills: ['argument.construct'], escalate: 'human-review' },
  'risk-scorer': { skills: ['risk.assess', 'risk.quantify'], escalate: 'risk-review' },
  'summariser': { skills: ['summarize.long'], escalate: 'human-review' },
  'translator-ms': { skills: ['translate.en-ms'], escalate: 'human-review' },
  'qa-reviewer': { skills: ['validate.citation', 'validate.consistency', 'validate.logic'], escalate: 'human-review' },
});

const TYPE_MAP = Object.freeze({
  issue: 'issue-spotter',
  retrieve: 'rule-finder',
  draft: 'drafter',
  translate: 'translator-ms',
  validate: 'citation-validator',
});

class NoRouteError extends Error {
  constructor(details = {}) {
    super('No agent matches the provided task');
    this.name = 'NoRouteError';
    this.details = details;
  }
}

function route(input = {}) {
  const payload = input && input.input ? input.input : input;
  const explicitType = input && input.type ? input.type : payload && payload.type;
  const hint = payload && payload.hint ? payload.hint : input && input.hint;

  if (explicitType && TYPE_MAP[explicitType]) {
    const primary = hint === 'qa-reviewer' ? 'qa-reviewer' : TYPE_MAP[explicitType];
    return { primary, reason: 'type-match' };
  }

  if (payload && payload.query) return { primary: 'issue-spotter', reason: 'query' };
  if (payload && payload.rules && payload.issues) return { primary: 'statute-interpreter', reason: 'rules' };
  if (payload && (payload.q || payload.questions || payload.issues)) return { primary: 'rule-finder', reason: 'retrieval' };
  if (payload && Array.isArray(payload.hits)) return { primary: 'summariser', reason: 'hits' };
  if (payload && payload.proposal && payload.findings) return { primary: 'qa-reviewer', reason: 'qa' };
  if (payload && payload.proposal) return { primary: 'citation-validator', reason: 'proposal' };
  if (payload && payload.findings) return { primary: 'qa-reviewer', reason: 'qa' };
  if (payload && payload.text && payload.to === 'ms') return { primary: 'translator-ms', reason: 'translation' };
  if (payload && payload.text && payload.maxTokens) return { primary: 'summariser', reason: 'summary' };
  if (payload && payload.docType) return { primary: 'drafter', reason: 'draft' };
  if (payload && payload.argument) return { primary: 'devil-advocate', reason: 'argument' };
  if (payload && payload.citation) return { primary: 'precedent-analyst', reason: 'citation' };
  if (payload && payload.risks) return { primary: 'risk-scorer', reason: 'risk' };
  if (payload && payload.doc && payload.docType) return { primary: 'drafter', reason: 'document' };
  return { primary: null, reason: 'no-match' };
}

function createRuntime({
  registry = defaultRegistry,
  skills = {},
  deps = {},
} = {}) {
  const logger = deps.logger || new Logger({ level: 'silent' });
  const tracer = deps.tracer || new Tracer();
  const metrics = deps.metrics || new Metrics();
  const stack = { logger, tracer, metrics };

  const counters = { invocations: 0, ok: 0, failed: 0, escalate: 0, agents: 0 };
  const seenAgents = new Set();

  function makeChainImpl(agentId) {
    return async function runChain(payload = {}) {
      const info = CHAINS[agentId] || { skills: [] };
      let current = { ...(payload || {}) };
      const steps = [];
      const output = {};
      for (const skillName of info.skills) {
        const impl = skills[skillName];
        if (!impl || typeof impl !== 'function') {
          steps.push({ skill: skillName, ok: false, reason: 'no-implementation' });
          continue;
        }
        try {
          const ctx = {
            prev: output,
            outputs: { ...output, ...steps.reduce((acc, step) => Object.assign(acc, step.output || {}), {}) },
            input: payload,
          };
          const result = await impl(current, ctx);
          current = { ...current, ...(result || {}) };
          Object.assign(output, result || {});
          if (result && typeof result.vote !== 'undefined') {
            const votes = steps
              .filter((step) => step && step.ok && step.output && typeof step.output.vote !== 'undefined')
              .map((step) => ({ vote: step.output.vote, confidence: Number(step.output.confidence ?? 0.5) }));
            votes.push({ vote: result.vote, confidence: Number(result.confidence ?? 0.5) });
            const anyNo = votes.some((vote) => vote.vote === 'no');
            const anyAbstain = votes.some((vote) => vote.vote === 'abstain');
            const chosen = anyNo ? 'no' : anyAbstain ? 'abstain' : 'yes';
            const confidence = chosen === 'no'
              ? Math.min(...votes.map((vote) => vote.confidence))
              : chosen === 'abstain'
                ? Math.max(...votes.map((vote) => vote.confidence))
                : Math.max(...votes.map((vote) => vote.confidence));
            output.vote = chosen;
            output.confidence = Number(confidence);
          }
          steps.push({ skill: skillName, ok: true, output: result });
        } catch (error) {
          steps.push({ skill: skillName, ok: false, reason: error.message, error: error.message });
          return { agent: agentId, outcome: 'failed', reason: error.message, output, steps };
        }
      }
      if (steps.some((step) => step.reason === 'no-implementation')) {
        return { agent: agentId, outcome: 'escalate', reason: 'empty-output', output, steps };
      }
      return { agent: agentId, outcome: 'ok', output, steps };
    };
  }

  const runtime = {
    registry,
    skills: { ...skills },
    deps: stack,
    counters,

    list() {
      return this.registry.agents().map((agent) => agent.id);
    },

    listMeta() {
      return this.registry.agents().map((agent) => ({
        id: agent.id,
        role: agent.role,
        model: agent.model,
        hitlLevel: agent.hitlLevel,
        skills: CHAINS[agent.id]?.skills || [],
      }));
    },

    hasSkill(skill) {
      return typeof this.skills[skill] === 'function';
    },

    get(id) {
      if (!this.registry._agents || !this.registry._agents.has(id)) {
        throw new UnknownAgentError(id);
      }
      const def = this.registry.getAgent(id);
      if (!this.registry.hasAgentImpl(id)) {
        this.registry.registerAgentImpl(id, makeChainImpl(id));
      }
      return new BaseAgent({
        id: def.id,
        role: def.role,
        capabilities: def.capabilities,
        skills: CHAINS[id]?.skills || [],
        meta: def,
        runtime: this,
        chain: CHAINS[id] || { skills: [] },
      });
    },

    async invoke(id, input = {}) {
      const agentDef = this.registry.getAgent(id);
      if (!agentDef) {
        throw new UnknownAgentError(id);
      }
      if (!this.registry.hasAgentImpl(id)) {
        this.registry.registerAgentImpl(id, makeChainImpl(id));
      }
      if (!seenAgents.has(id)) {
        seenAgents.add(id);
        counters.agents += 1;
      }
      counters.invocations += 1;
      const span = this.deps.tracer.startSpan('agent.invoke', { agentId: id, type: 'runtime' });
      const invocationId = `inv_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      const runId = `run_${Math.random().toString(36).slice(2, 10)}`;
      try {
        const out = await this.registry.getAgent(id).invoke(input);
        const outcome = out && out.outcome ? out.outcome : 'ok';
        span.end({ status: outcome === 'ok' ? 'ok' : outcome === 'escalate' ? 'escalate' : 'error' });
        if (outcome === 'ok') counters.ok += 1;
        else if (outcome === 'escalate') counters.escalate += 1;
        else counters.failed += 1;
        return {
          ...out,
          invocationId,
          runId,
          agent: id,
          output: out && out.output ? out.output : out,
          outcome,
        };
      } catch (error) {
        span.end({ status: 'error', error: error.message });
        counters.failed += 1;
        return {
          agent: id,
          outcome: 'failed',
          reason: error.message,
          steps: [{ skill: 'runtime', ok: false, reason: error.message }],
          invocationId,
          runId,
          output: {},
        };
      }
    },

    async invokeAll(ids, input = {}) {
      const results = {};
      for (const id of ids) results[id] = await this.invoke(id, input);
      return results;
    },

    stats() {
      return { ...counters };
    },
  };

  return runtime;
}

async function dispatch(runtime, input = {}) {
  const picked = route(input);
  if (!picked.primary) {
    throw new NoRouteError(picked);
  }
  const result = await runtime.invoke(picked.primary, input.input || input);
  return { ...picked, result };
}

async function dispatchStrict(runtime, input = {}) {
  const picked = route(input);
  if (!picked.primary) {
    throw new NoRouteError(picked);
  }
  return dispatch(runtime, input);
}

export {
  BaseAgent,
  CHAINS,
  ChainEmptyError,
  NoRouteError,
  TYPE_MAP,
  createRuntime,
  dispatch,
  dispatchStrict,
  route,
};
