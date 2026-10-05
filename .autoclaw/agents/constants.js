'use strict';

/** Lifecycle state of a BaseAgent instance. */
const AGENT_STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  DONE: 'done',
  ERROR: 'error',
  ESCALATED: 'escalated'
});

/** Steps of one turn. Every agent follows the same four, in order. */
const AGENT_PHASE = Object.freeze({
  PLAN: 'plan',
  EXECUTE: 'execute',
  VALIDATE: 'validate',
  REPORT: 'report'
});

/** Terminal outcome of an invocation. `escalate` is a result, not a failure. */
const AGENT_OUTCOME = Object.freeze({
  OK: 'ok',
  FAILED: 'failed',
  ESCALATE: 'escalate',
  SKIPPED: 'skipped'
});

module.exports = { AGENT_STATE, AGENT_PHASE, AGENT_OUTCOME };