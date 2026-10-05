'use strict';

/**
 * agents — the runtime that binds the registry catalogue to skill chains.
 *
 *   const { createRuntime, dispatch } = require('./agents');
 *   const runtime = createRuntime({ skills: { 'issue.extract': async fn } });
 *   await dispatch(runtime, { input: { query: 'unfair dismissal?' } });
 */

const { AgentRuntime } = require('./runtime');
const { BaseAgent } = require('./base');
const { CHAINS } = require('./chains');
const { buildContext } = require('./context');
const router = require('./router');
const { AGENT_STATE, AGENT_PHASE, AGENT_OUTCOME } = require('./constants');
const errors = require('./errors');

/** One-call setup against the default registry unless another is passed. */
function createRuntime(opts = {}) {
  const registry = opts.registry || require('../registry').defaultRegistry;
  return new AgentRuntime({ ...opts, registry });
}

module.exports = {
  AgentRuntime,
  BaseAgent,
  CHAINS,
  buildContext,
  createRuntime,
  route: router.route,
  dispatch: router.dispatch,
  dispatchStrict: router.dispatchStrict,
  TYPE_MAP: router.TYPE_MAP,
  HINTS: router.HINTS,
  SHAPE_RULES: router.SHAPE_RULES,
  AGENT_STATE,
  AGENT_PHASE,
  AGENT_OUTCOME,
  ...errors
};