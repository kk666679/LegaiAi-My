import path from 'path';
import fs from 'fs';

/**
 * .autoclaw/safety/kill-switch/kill-switch.js
 * Emergency halt mechanism with scoped shutdowns
 * Scopes: global, agent:id, tool:name
 */

const fs = fs.promises;

class KillSwitch {
  /**
   * @param {Object} config
   * @param {string} [config.path] - Path to kill-switch state file
   */
  constructor({ path: killSwitchPath = '.autoclaw/safety/kill-switch.json' } = {}) {
    this.path = killSwitchPath;
    this.active = false;
    this.scope = null; // 'global', 'agent:id', 'tool:name'
    this.reason = null;
    this.activatedAt = null;
    this.activatedBy = null;
    this.activationHistory = [];
  }

  /**
   * Load kill switch state
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const content = await fs.readFile(this.path, 'utf8');
      const data = JSON.parse(content);
      Object.assign(this, data);
    } catch {
      // File doesn't exist yet
    }
  }

  /**
   * Activate kill switch
   * @param {Object} config
   * @param {string} [config.scope] - 'global' | 'agent:ID' | 'tool:NAME'
   * @param {string} config.reason - Why activated
   * @param {Object} [config.actor] - Who activated
   * @returns {Promise<Object>}
   */
  async activate({ scope = 'global', reason, actor } = {}) {
    this.active = true;
    this.scope = scope;
    this.reason = reason;
    this.activatedAt = Date.now();
    this.activatedBy = actor?.id;

    this.activationHistory.push({
      scope,
      reason,
      activatedAt: this.activatedAt,
      activatedBy: actor?.id,
    });

    await this.persist();
    await this.broadcast('kill_switch_activated', { scope, reason, actor: actor?.id });

    return this.status();
  }

  /**
   * Deactivate kill switch
   * @param {Object} [config]
   * @param {Object} [config.actor] - Who deactivated
   * @returns {Promise<Object>}
   */
  async deactivate({ actor } = {}) {
    const wasActive = this.active;
    const prevScope = this.scope;

    this.active = false;
    this.scope = null;
    this.reason = null;
    this.activatedAt = null;
    this.activatedBy = null;

    await this.persist();

    if (wasActive) {
      await this.broadcast('kill_switch_deactivated', { prevScope, actor: actor?.id });
    }

    return this.status();
  }

  /**
   * Check if action is blocked
   * @param {Object} config
   * @param {string} [config.action] - Action/tool name
   * @param {string} [config.agentId] - Agent ID
   * @returns {boolean}
   */
  isBlocked({ action, agentId } = {}) {
    if (!this.active) return false;

    // Global kill switch blocks everything
    if (this.scope === 'global') return true;

    // Agent-scoped kill switch
    if (this.scope?.startsWith('agent:')) {
      const targetAgent = this.scope.slice(6);
      return agentId === targetAgent;
    }

    // Tool-scoped kill switch
    if (this.scope?.startsWith('tool:')) {
      const targetTool = this.scope.slice(5);
      return action === targetTool;
    }

    return false;
  }

  /**
   * Check action against kill switch
   * @param {string} action
   * @param {string} [target] - Target (agent ID or tool name)
   * @returns {{allowed: boolean, reason?: string}}
   */
  async check({ action, target }) {
    if (!this.active) {
      return { allowed: true };
    }

    // Global kill switch
    if (this.scope === 'global') {
      return {
        allowed: false,
        reason: `Kill switch active: ${this.reason}`,
      };
    }

    // Agent-scoped kill switch
    if (this.scope.startsWith('agent:') && target === this.scope.slice(6)) {
      return {
        allowed: false,
        reason: `Kill switch active for agent ${target}: ${this.reason}`,
      };
    }

    // Tool-scoped kill switch
    if (this.scope.startsWith('tool:') && action === this.scope.slice(5)) {
      return {
        allowed: false,
        reason: `Kill switch active for tool ${action}: ${this.reason}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get current status
   * @returns {Object}
   */
  status() {
    return {
      active: this.active,
      scope: this.scope,
      reason: this.reason,
      activatedAt: this.activatedAt,
      activatedBy: this.activatedBy,
    };
  }

  /**
   * Get activation history
   * @returns {Array}
   */
  getHistory() {
    return this.activationHistory;
  }

  /**
   * Save state to disk
   * @private
   * @returns {Promise<void>}
   */
  async persist() {
    const dir = path.dirname(this.path);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    await fs.writeFile(
      this.path,
      JSON.stringify(
        {
          active: this.active,
          scope: this.scope,
          reason: this.reason,
          activatedAt: this.activatedAt,
          activatedBy: this.activatedBy,
          activationHistory: this.activationHistory,
        },
        null,
        2,
      ),
    );
  }

  /**
   * Broadcast kill switch event
   * @private
   * @param {string} event
   * @param {Object} payload
   */
  async broadcast(event, payload) {
    try {
      const { hooks } = require('../../hooks/index.js');
      if (hooks && hooks.emit) {
        await hooks.emit(event, payload);
      }
    } catch {
      // Hooks not available, continue
    }
  }
}

;

export { KillSwitch };
