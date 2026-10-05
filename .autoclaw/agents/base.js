'use strict';

/**
 * BaseAgent — one agent, one chain, one turn.
 *
 * `invoke()` returns the same report shape for every agent and never throws
 * for a skill failure: the step is recorded with its reason and the outcome
 * becomes `failed`. Programmer errors (no chain declared) still throw.
 */

const { EventEmitter } = require('events');
const { AGENT_STATE, AGENT_OUTCOME } = require('./constants');
const { CHAINS } = require('./chains');
const { buildContext } = require('./context');
const { ChainEmptyError } = require('./errors');

class BaseAgent extends EventEmitter {
  constructor({ id, meta = {}, runtime } = {}) {
    super();
    if (!id) throw new Error('BaseAgent requires { id }');
    this.id = id;
    this.meta = meta;
    this.runtime = runtime;
    this.chain = CHAINS[id] || null;
    this.state = AGENT_STATE.IDLE;
    this.invocations = 0;
  }

  get role() { return this.meta.role || 'utility'; }
  get model() { return this.meta.model || null; }
  get skills() { return this.chain ? this.chain.skills : []; }

  /**
   * @returns {Promise<{agent,role,outcome,reason,steps,output,ms,invocationId,runId}>}
   */
  async invoke(input = {}, opts = {}) {
    if (!this.chain) throw new ChainEmptyError(this.id);
    const t0 = Date.now();
    this.state = AGENT_STATE.RUNNING;
    this.invocations++;
    this.emit('start', { id: this.id, input });

    const ctx = buildContext({ agent: this, deps: this.runtime.deps, parentSpan: opts.span, report: opts.report });
    ctx.report({ phase: 'execute', agent: this.id, steps: this.skills.length });

    const outputs = {};
    const steps = [];
    let failure = null;

    // Every step receives the same `input` plus, on ctx, the results of the
    // steps that already ran: `ctx.prev` is the immediately preceding output,
    // `ctx.outputs` is the whole map so far. Chaining happens through ctx, not
    // by rewriting input — each skill keeps its own declared input contract.
    ctx.outputs = outputs;

    for (const skillId of this.skills) {
      const stepT0 = Date.now();
      if (!this.runtime.hasSkill(skillId)) {
        steps.push({ skill: skillId, ok: false, reason: 'no-implementation', ms: Date.now() - stepT0 });
        continue;
      }
      try {
        outputs[skillId] = await this.runtime.runSkill(skillId, input, ctx);
        ctx.prev = outputs[skillId];
        steps.push({ skill: skillId, ok: true, ms: Date.now() - stepT0 });
      } catch (err) {
        failure = { skill: skillId, message: err.message };
        steps.push({ skill: skillId, ok: false, reason: err.message, ms: Date.now() - stepT0 });
        this.emit('step:error', { skill: skillId, error: err.message });
        break;
      }
    }

    const merged = this.chain.merge(outputs) || {};
    // A failed step is the reason; emptiness only explains a run that completed.
    const escalateReason = failure ? null : this._shouldEscalate(merged);
    const outcome = failure
      ? AGENT_OUTCOME.FAILED
      : (escalateReason ? AGENT_OUTCOME.ESCALATE : AGENT_OUTCOME.OK);

    this.state = outcome === AGENT_OUTCOME.FAILED ? AGENT_STATE.ERROR
      : outcome === AGENT_OUTCOME.ESCALATE ? AGENT_STATE.ESCALATED
        : AGENT_STATE.DONE;

    if (ctx.span) {
      try { ctx.span.set('outcome', outcome).end({ status: outcome === AGENT_OUTCOME.FAILED ? 'error' : 'ok' }); }
      catch { /* a tracer that cannot close a span must not fail the turn */ }
    }

    const report = {
      agent: this.id,
      role: this.role,
      outcome,
      reason: (failure && failure.message) || escalateReason || null,
      steps,
      output: merged,
      ms: Date.now() - t0,
      invocationId: ctx.invocationId,
      runId: ctx.runId
    };

    if (ctx.logger && typeof ctx.logger.info === 'function') {
      ctx.logger.info('agent.invoke', { agent: this.id, outcome, ms: report.ms, steps: steps.length });
    }
    this.emit('end', report);
    return report;
  }

  /** `'never'` → no escalation; `'empty'` → nothing usable came back; fn → its verdict. */
  _shouldEscalate(output) {
    const rule = this.chain.escalate;
    if (rule == null || rule === 'never') return null;
    if (rule === 'empty') {
      const hasArray = Object.values(output).some(v => Array.isArray(v) && v.length > 0);
      const hasText = Object.values(output).some(v => typeof v === 'string' && v.trim().length > 0);
      const hasNumber = Object.values(output).some(v => typeof v === 'number' && Number.isFinite(v));
      return (!hasArray && !hasText && !hasNumber) ? 'empty-output' : null;
    }
    if (typeof rule === 'function') return rule(output) || null;
    return null;
  }

  snapshot() {
    return {
      id: this.id,
      role: this.role,
      model: this.model,
      skills: this.skills,
      state: this.state,
      invocations: this.invocations
    };
  }
}

module.exports = { BaseAgent };