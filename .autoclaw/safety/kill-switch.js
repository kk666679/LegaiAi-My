import EventEmitter from 'events';

/**
 * safety/kill-switch.js — Fleet-wide emergency halt.
 *
 * Provides immediate stop capability for all agents in the fleet.
 * Supports graded shutdown: pause → drain → halt.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class KillSwitch extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.state = 'normal'; // 'normal' | 'paused' | 'draining' | 'halted'
    this.triggeredBy = null;
    this.triggeredAt = null;
    this.reason = null;
    this.authorizedUsers = new Set(config.authorizedUsers ?? []);
    this.autoTriggerRules = config.autoTriggerRules ?? [];
    this.agentStates = new Map(); // agentId -> state
  }

  /**
   * Trigger kill switch
   */
  trigger({ reason, triggeredBy, mode = 'halt' } = {}) {
    if (this.state === 'halted') {
      return { alreadyHalted: true };
    }

    if (!this.isAuthorized(triggeredBy)) {
      throw new Error(`Unauthorized: ${triggeredBy} cannot trigger kill switch`);
    }

    const previousState = this.state;
    this.state = mode;
    this.triggeredBy = triggeredBy;
    this.triggeredAt = Date.now();
    this.reason = reason ?? 'Manual trigger';

    this.emit('triggered', {
      previousState,
      newState: this.state,
      triggeredBy,
      reason: this.reason,
      timestamp: this.triggeredAt,
    });

    // Notify all agents
    this.broadcastStateChange();

    return { triggered: true, state: this.state, reason: this.reason };
  }

  /**
   * Check if user is authorized
   */
  isAuthorized(userId) {
    return this.authorizedUsers.has(userId) || this.authorizedUsers.has('*');
  }

  /**
   * Add authorized user
   */
  authorize(userId) {
    this.authorizedUsers.add(userId);
  }

  /**
   * Revoke authorization
   */
  revoke(userId) {
    this.authorizedUsers.delete(userId);
  }

  /**
   * Add auto-trigger rule
   */
  addAutoTriggerRule(rule) {
    this.autoTriggerRules.push(rule);
  }

  /**
   * Check auto-trigger rules
   */
  checkAutoTriggers(metrics) {
    for (const rule of this.autoTriggerRules) {
      if (rule.condition(metrics)) {
        this.trigger({ reason: `Auto-trigger: ${rule.name}`, triggeredBy: 'system', mode: rule.mode ?? 'halt' });
        break;
      }
    }
  }

  /**
   * Register agent for state management
   */
  registerAgent(agentId) {
    this.agentStates.set(agentId, { state: 'normal', lastUpdate: Date.now() });
  }

  /**
   * Get agent state
   */
  getAgentState(agentId) {
    return this.agentStates.get(agentId) ?? { state: 'unknown' };
  }

  /**
   * Set agent state
   */
  setAgentState(agentId, state) {
    this.agentStates.set(agentId, { state, lastUpdate: Date.now() });
    this.emit('agent:state', { agentId, state });
  }

  /**
   * Broadcast state change to all agents
   */
  broadcastStateChange() {
    this.emit('state:change', {
      state: this.state,
      reason: this.reason,
      triggeredBy: this.triggeredBy,
      timestamp: this.triggeredAt,
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      triggeredBy: this.triggeredBy,
      triggeredAt: this.triggeredAt,
      reason: this.reason,
      agentCount: this.agentStates.size,
      agentsByState: this.getAgentsByState(),
    };
  }

  getAgentsByState() {
    const counts = { normal: 0, paused: 0, draining: 0, halted: 0, unknown: 0 };
    for (const agent of this.agentStates.values()) {
      counts[agent.state] = (counts[agent.state] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Reset kill switch (requires authorization)
   */
  reset(authorizedBy) {
    if (!this.isAuthorized(authorizedBy)) {
      throw new Error(`Unauthorized: ${authorizedBy} cannot reset kill switch`);
    }

    if (this.state === 'normal') {
      return { alreadyNormal: true };
    }

    const previousState = this.state;
    this.state = 'normal';
    this.triggeredBy = null;
    this.triggeredAt = null;
    this.reason = null;

    this.emit('reset', { previousState, resetBy: authorizedBy });
    this.broadcastStateChange();

    return { reset: true, previousState };
  }

  /**
   * Gradual shutdown: pause -> drain -> halt
   */
  async gracefulShutdown({ reason, triggeredBy, drainTimeout = 30000 } = {}) {
    if (!this.isAuthorized(triggeredBy)) {
      throw new Error('Unauthorized');
    }

    // Phase 1: Pause new work
    this.trigger({ reason: `${reason} (pause phase)`, triggeredBy, mode: 'paused' });
    await this.waitForAgents('paused', 5000);

    // Phase 2: Drain in-flight work
    this.trigger({ reason: `${reason} (drain phase)`, triggeredBy, mode: 'draining' });
    await this.waitForAgents('draining', drainTimeout);

    // Phase 3: Halt
    this.trigger({ reason: `${reason} (halt phase)`, triggeredBy, mode: 'halted' });

    return { completed: true };
  }

  async waitForAgents(targetState, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const allMatch = [...this.agentStates.values()].every(a => a.state === targetState);
      if (allMatch) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }
}

export { KillSwitch as KillSwitch };
