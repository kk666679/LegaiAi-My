/**
 * .autoclaw/safety/approval/approval-gate.js
 * Human approval workflow for high-risk actions
 */

const crypto = require('crypto');

class ApprovalGate {
  /**
   * @param {Object} config
   * @param {number} [config.defaultTimeoutMs] - Default approval timeout
   * @param {Function} [config.notifier] - Function to send approval requests
   */
  constructor({ config = {} } = {}) {
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 300000; // 5 minutes
    this.notifier = config.notifier;
    this.requests = new Map(); // requestId -> request
    this.decisions = new Map(); // requestId -> decision
  }

  /**
   * Request approval for an action
   * @param {Object} config
   * @param {string} config.action - Action name
   * @param {string} [config.target] - Target resource
   * @param {*} [config.params] - Action parameters (sanitized)
   * @param {Object} [config.actor] - Requesting actor
   * @param {number} [config.timeoutMs] - Timeout for approval
   * @returns {Promise<{allowed, requestId, decision}>}
   */
  async request({
    action,
    target,
    params,
    actor,
    timeoutMs = this.defaultTimeoutMs,
  }) {
    const requestId = crypto.randomUUID();
    const expiresAt = Date.now() + timeoutMs;

    const approval = {
      id: requestId,
      action,
      target,
      params: this.sanitizeParams(params),
      actor,
      requestedAt: Date.now(),
      expiresAt,
      status: 'pending',
    };

    this.requests.set(requestId, approval);

    // Send notification if notifier provided
    if (this.notifier) {
      try {
        await this.notifier(approval);
      } catch (error) {
        console.error('Failed to notify approval:', error);
      }
    }

    // Wait for decision
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const decision = this.decisions.get(requestId);

        if (decision) {
          clearInterval(checkInterval);
          this.requests.delete(requestId);
          this.decisions.delete(requestId);

          resolve({
            allowed: decision.allowed,
            requestId,
            decision,
          });
        } else if (Date.now() > expiresAt) {
          // Timeout
          clearInterval(checkInterval);
          this.requests.delete(requestId);

          resolve({
            allowed: false,
            requestId,
            decision: {
              allowed: false,
              reason: 'Approval request timed out',
            },
          });
        }
      }, 100);

      // Timeout fallback
      setTimeout(() => {
        clearInterval(checkInterval);
      }, timeoutMs + 1000);
    });
  }

  /**
   * Submit approval decision
   * @param {string} requestId
   * @param {Object} decision
   * @param {boolean} decision.allowed
   * @param {string} [decision.reason]
   * @param {string} [decision.reviewer] - Who approved/rejected
   * @returns {boolean} - Whether decision was recorded
   */
  submitDecision(requestId, { allowed, reason, reviewer }) {
    const request = this.requests.get(requestId);
    if (!request) {
      return false; // Request not found or expired
    }

    this.decisions.set(requestId, {
      allowed,
      reason,
      reviewer,
      decidedAt: Date.now(),
    });

    return true;
  }

  /**
   * Check if action requires approval
   * @param {Object} config
   * @param {string} config.action
   * @param {string} [config.target]
   * @param {*} [config.params]
   * @param {Object} [config.actor]
   * @returns {{required: boolean, reason?: string}}
   */
  async check({ action, target, params, actor }) {
    // Actions that always require approval
    const requiresApproval = [
      /delete|destroy|drop|purge|truncate|wipe/i,
      /kill|stop|halt|shutdown|restart/i,
      /update.*password|update.*key|update.*secret/i,
      /export.*data|backup|archive/i,
    ];

    const reason = requiresApproval
      .map((p) => p.toString())
      .find((p) => {
        try {
          const regex = new RegExp(p);
          return regex.test(action);
        } catch {
          return false;
        }
      });

    return {
      required: !!reason,
      reason: reason ? `Action "${action}" requires approval` : null,
    };
  }

  /**
   * Get pending approval requests
   * @returns {Array}
   */
  getPendingRequests() {
    return Array.from(this.requests.values());
  }

  /**
   * Get specific request
   * @param {string} requestId
   * @returns {Object|null}
   */
  getRequest(requestId) {
    return this.requests.get(requestId) || null;
  }

  /**
   * Sanitize parameters for display
   * @private
   * @param {*} params
   * @returns {*}
   */
  sanitizeParams(params) {
    if (!params) return null;
    if (typeof params !== 'object') return params;

    // Remove sensitive fields
    const sensitive = ['password', 'secret', 'token', 'key', 'credential'];
    const sanitized = { ...params };

    for (const field of sensitive) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Cancel approval request
   * @param {string} requestId
   */
  cancel(requestId) {
    this.requests.delete(requestId);
    this.decisions.delete(requestId);
  }
}

module.exports = {
  ApprovalGate,
};
