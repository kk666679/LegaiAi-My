/**
 * .autoclaw/safety/index.js
 * Public API for safety subsystem (August 2026 standards)
 * Policy engine, adversarial guards, PII redaction, approval gates, kill switch, cost ceiling
 */

const { AdversarialGuard } = require('./guards/adversarial-guard.js');
const { PIIGuard } = require('./guards/pii-guard.js');
const { ContentGuard } = require('./guards/content-guard.js');
const { ToolGuard } = require('./guards/tool-guard.js');
const { KillSwitch } = require('./kill-switch/kill-switch.js');
const { CostCeiling } = require('./cost/cost-ceiling.js');
const { ApprovalGate } = require('./approval/approval-gate.js');
const { SafetyAudit } = require('./audit/safety-audit.js');
const { safetyTracer } = require('./observability/tracer.js');
const { safetyMetrics } = require('./observability/metrics.js');
const fs = require('fs').promises;
const path = require('path');

// Safety modes
const MODES = {
  normal: {
    name: 'normal',
    description: 'Default mode: approvals required for destructive',
    allowDestructive: true,
    allowWrites: true,
    allowExternalCalls: true,
    allowCodeExecution: true,
  },
  cautious: {
    name: 'cautious',
    description: 'Approvals required for all writes',
    allowDestructive: false,
    allowWrites: true,
    allowExternalCalls: true,
    allowCodeExecution: true,
  },
  readonly: {
    name: 'readonly',
    description: 'No mutations allowed',
    allowDestructive: false,
    allowWrites: false,
    allowExternalCalls: true,
    allowCodeExecution: false,
  },
  lockdown: {
    name: 'lockdown',
    description: 'Emergency mode: no external calls or execution',
    allowDestructive: false,
    allowWrites: false,
    allowExternalCalls: false,
    allowCodeExecution: false,
  },
};

class Safety {
  /**
   * @param {Object} config
   * @param {string} [config.modePath] - Path to safety mode file
   * @param {string} [config.auditPath] - Path to audit log
   * @param {string} [config.killSwitchPath] - Path to kill switch state
   * @param {Object} [config.guards] - Guard configurations
   */
  constructor({
    modePath = '.autoclaw/safety/mode.json',
    auditPath = '.autoclaw/safety/audit.jsonl',
    killSwitchPath = '.autoclaw/safety/kill-switch.json',
    guards = {},
  } = {}) {
    this.mode = 'normal';
    this.modePath = modePath;
    this.modeChangedAt = null;
    this.modeChangedBy = null;

    // Guards
    this.adversarial = new AdversarialGuard({ config: guards.adversarial });
    this.pii = new PIIGuard({ config: guards.pii });
    this.content = new ContentGuard({ config: guards.content });
    this.tools = new ToolGuard({ config: guards.tool });

    // Controls
    this.killSwitch = new KillSwitch({ path: killSwitchPath });
    this.cost = new CostCeiling(guards.cost);
    this.approval = new ApprovalGate({ config: guards.approval });
    this.audit = new SafetyAudit({ path: auditPath });
  }

  /**
   * Initialize safety subsystem
   * @returns {Promise<Object>}
   */
  async initialize() {
    return safetyTracer.startSpan('safety.initialize', async (span) => {
      await this.loadMode();
      await this.killSwitch.load();
      await this.audit.load();

      span.setAttribute('safety.mode', this.mode);
      span.setAttribute('kill_switch.active', this.killSwitch.active);

      return {
        mode: this.mode,
        killSwitch: this.killSwitch.status(),
      };
    });
  }

  /**
   * Check action against all safety guards
   *
   * Orchestration flow:
   * 1. Kill switch
   * 2. Safety mode
   * 3. Cost ceiling
   * 4. Tool guard
   * 5. Content/PII/adversarial (non-blocking)
   * 6. Approval gate if flagged
   *
   * @param {Object} config
   * @param {string} config.action - Action to perform
   * @param {string} [config.target] - Target resource
   * @param {*} [config.params] - Action parameters
   * @param {Object} [config.actor] - Actor performing action
   * @param {Object} [config.context] - Additional context
   * @returns {Promise<{allowed, reason, guard, results}>}
   */
  async check({
    action,
    target,
    params,
    actor,
    context = {},
  }) {
    return safetyTracer.startSpan('safety.check', async (span) => {
      span.setAttribute('action', action);
      span.setAttribute('target', target);
      span.setAttribute('actor.id', actor?.id);

      const results = [];

      try {
        // 1. Kill switch (highest priority)
        const killCheck = await this.killSwitch.check({ action, target });
        results.push({ guard: 'kill_switch', ...killCheck });
        if (!killCheck.allowed) {
          return this.deny(span, results, 'kill_switch');
        }

        // 2. Safety mode
        const modeCheck = this.checkMode({ action, target });
        results.push({ guard: 'safety_mode', ...modeCheck });
        if (!modeCheck.allowed) {
          return this.deny(span, results, 'safety_mode');
        }

        // 3. Cost ceiling
        const costCheck = await this.cost.check({ action, params, actor, estimatedCost: context.estimatedCost });
        results.push({ guard: 'cost_ceiling', ...costCheck });
        if (!costCheck.allowed) {
          return this.deny(span, results, 'cost_ceiling');
        }

        // 4. Tool guard
        const toolCheck = await this.tools.check({ action, target, params });
        results.push({ guard: 'tool_guard', ...toolCheck });
        if (!toolCheck.allowed) {
          return this.deny(span, results, 'tool_guard');
        }

        // 5. Content/PII/adversarial guards (non-blocking, flagged)
        const [adversarialCheck, piiCheck, contentCheck] = await Promise.all([
          this.adversarial.check({ params }),
          this.pii.check({ params }),
          this.content.check({ params }),
        ]);

        results.push(
          { guard: 'adversarial', ...adversarialCheck },
          { guard: 'pii', ...piiCheck },
          { guard: 'content', ...contentCheck },
        );

        // 6. Approval gate if flagged
        const requiresApproval = results.some((r) => r.requiresApproval);

        if (requiresApproval) {
          const { required } = await this.approval.check({ action, target, params, actor });

          if (required) {
            const approval = await this.approval.request({
              action,
              target,
              params,
              actor,
              timeoutMs: context.approvalTimeoutMs,
            });

            results.push({ guard: 'approval', ...approval });

            if (!approval.allowed) {
              return this.deny(span, results, 'approval');
            }
          }
        }

        // 7. Audit
        await this.audit.record({
          action,
          target,
          params,
          actor,
          results,
          verdict: 'allowed',
        });

        safetyMetrics.increment('safety.check.allowed', { action });
        span.setAttribute('verdict', 'allowed');

        return {
          allowed: true,
          results,
        };
      } catch (error) {
        span.recordException(error);
        safetyMetrics.increment('safety.check.error', { action });

        return {
          allowed: false,
          reason: error.message,
          error: true,
        };
      }
    });
  }

  /**
   * Check action against safety mode
   * @private
   * @param {string} action
   * @param {string} [target]
   * @returns {Object}
   */
  checkMode({ action, target }) {
    const mode = MODES[this.mode];
    if (!mode) {
      return { allowed: false, reason: `Invalid safety mode: ${this.mode}` };
    }

    const isWrite = /write|create|update|mutate|apply/i.test(action);
    if (!mode.allowWrites && isWrite) {
      return {
        allowed: false,
        reason: `Safety mode "${this.mode}" disallows writes`,
      };
    }

    const isDestructive = /delete|destroy|drop|purge|truncate|wipe|rm/i.test(action);
    if (!mode.allowDestructive && isDestructive) {
      return {
        allowed: false,
        reason: `Safety mode "${this.mode}" disallows destructive actions`,
      };
    }

    const isExternal = /webhook|fetch|http|curl|slack|jira|email/i.test(action);
    if (!mode.allowExternalCalls && isExternal) {
      return {
        allowed: false,
        reason: `Safety mode "${this.mode}" disallows external calls`,
      };
    }

    const isExecution = /exec|shell|eval|run|invoke|spawn/i.test(action);
    if (!mode.allowCodeExecution && isExecution) {
      return {
        allowed: false,
        reason: `Safety mode "${this.mode}" disallows code execution`,
      };
    }

    return { allowed: true };
  }

  /**
   * Deny action and record
   * @private
   * @param {Object} span
   * @param {Array} results
   * @param {string} guard
   * @returns {Object}
   */
  async deny(span, results, guard) {
    const failure = results.find((r) => r.guard === guard);
    span.setAttribute('safety.denied', guard);
    safetyMetrics.increment('safety.check.denied', { guard });

    await this.audit.record({
      action: results[0]?.action,
      verdict: 'denied',
      guard,
      results,
    });

    return {
      allowed: false,
      reason: failure?.reason,
      guard,
      results,
    };
  }

  /**
   * Change safety mode
   * @param {string} mode
   * @param {Object} [actor]
   * @returns {Promise<Object>}
   */
  async setMode(mode, actor = null) {
    if (!MODES[mode]) {
      throw new Error(`Invalid safety mode: ${mode}`);
    }

    this.mode = mode;
    this.modeChangedAt = Date.now();
    this.modeChangedBy = actor?.id;

    await this.persistMode();
    safetyMetrics.increment('safety.mode.changed', { mode });

    return MODES[mode];
  }

  /**
   * Activate kill switch
   * @param {Object} config
   * @returns {Promise<Object>}
   */
  async activateKillSwitch({ scope = 'global', reason, actor } = {}) {
    const result = await this.killSwitch.activate({ scope, reason, actor });
    safetyMetrics.increment('safety.kill_switch.activated', { scope });
    return result;
  }

  /**
   * Deactivate kill switch
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async deactivateKillSwitch({ actor } = {}) {
    const result = await this.killSwitch.deactivate({ actor });
    safetyMetrics.increment('safety.kill_switch.deactivated');
    return result;
  }

  /**
   * Record cost
   * @param {Object} config
   */
  recordCost({ action, actor, cost }) {
    this.cost.record({ action, actor, cost });
  }

  /**
   * Get comprehensive safety status
   * @returns {Promise<Object>}
   */
  async status() {
    return {
      mode: {
        current: this.mode,
        ...MODES[this.mode],
        changedAt: this.modeChangedAt,
        changedBy: this.modeChangedBy,
      },
      killSwitch: this.killSwitch.status(),
      cost: this.cost.status(),
      audit: {
        entriesCount: this.audit.entries.length,
        recent: this.audit.recent({ limit: 10 }),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Load safety mode
   * @private
   * @returns {Promise<void>}
   */
  async loadMode() {
    try {
      const content = await fs.readFile(this.modePath, 'utf8');
      const data = JSON.parse(content);
      this.mode = data.mode || 'normal';
      this.modeChangedAt = data.changedAt;
      this.modeChangedBy = data.changedBy;
    } catch {
      // File doesn't exist, use defaults
    }
  }

  /**
   * Save safety mode
   * @private
   * @returns {Promise<void>}
   */
  async persistMode() {
    const dir = path.dirname(this.modePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    await fs.writeFile(
      this.modePath,
      JSON.stringify(
        {
          mode: this.mode,
          changedAt: this.modeChangedAt,
          changedBy: this.modeChangedBy,
        },
        null,
        2,
      ),
    );
  }
}

module.exports = {
  Safety,
  MODES,
};
