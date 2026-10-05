'use strict';

/**
 * AgentRuntime — binds the registry catalogue to skill implementations.
 *
 *   const runtime = new AgentRuntime({
 *     registry,                               // required
 *     skillRegistry,                          // preferred: { has, run, list }
 *     skills: { 'issue.extract': async fn },  // fallback: a plain map
 *     deps:   { runId, logger, metrics, tracer, kg, hitl }
 *   });
 *
 * The runtime also binds each constructed agent back into the registry, so a
 * consumer that only has the registry (`registry.getAgent(id).invoke(…)`)
 * routes through the same chain instead of failing with `NOT_IMPLEMENTED`.
 * Injected deps are never overwritten — a caller that supplies a logger keeps it.
 */

const { EventEmitter } = require('events');
const { BaseAgent } = require('./base');
const { CHAINS } = require('./chains');
const { UnknownAgentError, MissingSkillError } = require('./errors');
const { createStack } = require('../observability');

class AgentRuntime extends EventEmitter {
  constructor({ registry, skillRegistry, skills, deps = {} } = {}) {
    super();
    if (!registry) throw new Error('AgentRuntime requires { registry }');
    this.registry = registry;
    this.skillRegistry = skillRegistry || this._wrapPlain(skills || {});
    this.deps = { ...deps };

    if (!this.deps.logger || !this.deps.metrics || !this.deps.tracer) {
      const stack = createStack();
      if (!this.deps.logger) this.deps.logger = stack.logger;
      if (!this.deps.metrics) this.deps.metrics = stack.metrics;
      if (!this.deps.tracer) this.deps.tracer = stack.tracer;
    }

    this._agents = new Map();
    this._catalog = null;
    this._stats = { invocations: 0, ok: 0, failed: 0, escalated: 0 };
  }

  /** Accepts `agents` as a method, a Map, or an array — whatever the registry has. */
  _catalogEntries() {
    if (this._catalog) return this._catalog;
    const raw = this.registry.agents;
    let list = [];
    if (typeof raw === 'function') list = raw.call(this.registry) || [];
    else if (raw && typeof raw.values === 'function') list = [...raw.values()];
    else if (Array.isArray(raw)) list = raw;
    this._catalog = new Map(list.map(a => [a.id, a]));
    return this._catalog;
  }

  _wrapPlain(map) {
    const store = new Map(Object.entries(map));
    return {
      has: id => store.has(id),
      run: async (id, input, ctx) => {
        if (!store.has(id)) throw new Error(`no skill implementation for ${id}`);
        return store.get(id)(input, ctx);
      },
      list: () => [...store.keys()]
    };
  }

  hasSkill(id) {
    return !!(this.skillRegistry && typeof this.skillRegistry.has === 'function' && this.skillRegistry.has(id));
  }

  async runSkill(id, input, ctx) {
    if (!this.hasSkill(id)) throw new MissingSkillError('runtime', id);
    return this.skillRegistry.run(id, input, ctx);
  }

  get(id) {
    if (this._agents.has(id)) return this._agents.get(id);
    const meta = this._catalogEntries().get(id);
    if (!meta) throw new UnknownAgentError(id);

    const agent = new BaseAgent({ id, meta, runtime: this });
    agent.on('end', report => {
      this._stats.invocations++;
      if (report.outcome === 'ok') this._stats.ok++;
      else if (report.outcome === 'failed') this._stats.failed++;
      else if (report.outcome === 'escalate') this._stats.escalated++;
      this.emit('agent:end', report);
    });
    this._agents.set(id, agent);
    this._bindIntoRegistry(id, agent);
    return agent;
  }

  /** Best-effort: the registry may already hold an impl, and may forbid re-binding. */
  _bindIntoRegistry(id, agent) {
    const reg = this.registry;
    if (typeof reg.registerAgentImpl !== 'function') return;
    try {
      if (typeof reg.hasAgentImpl === 'function' && reg.hasAgentImpl(id)) return;
      reg.registerAgentImpl(id, payload => agent.invoke(payload));
    } catch { /* a registry that refuses re-binding keeps its own impl */ }
  }

  list() { return [...this._catalogEntries().keys()]; }

  listMeta() {
    return this.list().map(id => ({
      ...this._catalogEntries().get(id),
      skills: (CHAINS[id] || {}).skills || []
    }));
  }

  async invoke(id, input = {}, opts = {}) { return this.get(id).invoke(input, opts); }

  async invokeAll(ids, input = {}, opts = {}) {
    const out = {};
    for (const id of ids) out[id] = await this.invoke(id, input, opts);
    return out;
  }

  stats() {
    return {
      ...this._stats,
      agents: this._agents.size,
      skills: typeof this.skillRegistry.list === 'function' ? this.skillRegistry.list().length : 0
    };
  }

  snapshot() {
    return {
      agents: [...this._agents.values()].map(a => a.snapshot()),
      stats: this.stats()
    };
  }
}

module.exports = { AgentRuntime };