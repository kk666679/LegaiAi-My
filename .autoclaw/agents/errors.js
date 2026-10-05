'use strict';

/**
 * errors — the agent runtime's error surface.
 *
 * Programmer errors (unknown agent, empty chain, missing skill implementation)
 * throw. Skill failures do not: they are reported in `steps` and turn the
 * outcome into `failed`, so one broken step never hides the ones that ran.
 */

class AgentError extends Error {
  constructor(m, meta = {}) { super(m); this.name = 'AgentError'; this.code = 'AGENT_ERROR'; this.meta = meta; }
}

class UnknownAgentError extends AgentError {
  constructor(id) { super(`Unknown agent: ${id}`, { id }); this.code = 'UNKNOWN_AGENT'; }
}

class MissingSkillError extends AgentError {
  constructor(agentId, skillId) {
    super(`Agent ${agentId} references unknown skill ${skillId}`, { agentId, skillId });
    this.code = 'MISSING_SKILL';
  }
}

class SkillRunError extends AgentError {
  constructor(agentId, skillId, msg) {
    super(`Skill ${skillId} failed in agent ${agentId}: ${msg}`, { agentId, skillId, msg });
    this.code = 'SKILL_RUN';
  }
}

class ChainEmptyError extends AgentError {
  constructor(agentId) { super(`Agent ${agentId} has no chain`, { agentId }); this.code = 'CHAIN_EMPTY'; }
}

class NoRouteError extends AgentError {
  constructor(task) { super('No agent matches task', { task }); this.code = 'NO_ROUTE'; }
}

module.exports = {
  AgentError,
  UnknownAgentError,
  MissingSkillError,
  SkillRunError,
  ChainEmptyError,
  NoRouteError
};