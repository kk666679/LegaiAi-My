'use strict';

let _invocation = 0;

/** Monotonic, process-scoped. Collides only across processes, never within one. */
function nextInvocationId() {
  return `inv_${++_invocation}_${Date.now().toString(36)}`;
}

/**
 * The ctx bag handed to every skill invocation:
 *   invocationId — unique per invoke()
 *   runId        — shared by every invoke() under the same runtime
 *   agent        — { id, role, model }
 *   logger       — child logger tagged with agent/run/invocation, or null
 *   span         — tracer span for the whole invocation, or null
 *   report       — progress callback
 *   deps         — whatever the caller injected on the runtime
 */
function buildContext({ agent, deps = {}, parentSpan, report } = {}) {
  const invocationId = nextInvocationId();
  const runId = deps.runId || `run_${Date.now().toString(36)}`;
  const meta = { agent: agent.id, role: agent.role, runId, invocationId };
  const logger = deps.logger && typeof deps.logger.child === 'function'
    ? deps.logger.child(meta)
    : (deps.logger || null);
  const span = parentSpan
    || (deps.tracer && typeof deps.tracer.startSpan === 'function'
      ? deps.tracer.startSpan(`agent.${agent.id}`, { runId, invocationId, role: agent.role })
      : null);

  return {
    invocationId,
    runId,
    agent: { id: agent.id, role: agent.role, model: agent.model },
    logger,
    span,
    report: report || (() => {}),
    deps,
    // Filled in by BaseAgent as the chain runs: `prev` is the last step's
    // output, `outputs` is every step's output keyed by skill id.
    prev: null,
    outputs: {}
  };
}

module.exports = { buildContext, nextInvocationId };