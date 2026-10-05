/**
 * .autoclaw/safety/audit/safety-audit.js
 * Immutable append-only audit log for safety decisions
 * Integrates with evidence chain for compliance
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

class SafetyAudit {
  /**
   * @param {Object} config
   * @param {string} [config.path] - Path to audit log (JSONL)
   */
  constructor({ path: auditPath = '.autoclaw/safety/audit.jsonl' } = {}) {
    this.path = auditPath;
    this.entries = [];
    this.hash = null;
  }

  /**
   * Load existing audit log
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const content = await fs.readFile(this.path, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          this.entries.push(entry);
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File doesn't exist yet
    }
  }

  /**
   * Record a safety decision
   * @param {Object} config
   * @param {string} config.action - Action name
   * @param {string} [config.target] - Target resource
   * @param {'allowed' | 'denied' | 'pending'} config.verdict
   * @param {string} [config.guard] - Which guard made decision
   * @param {*} [config.params] - Action parameters (sanitized)
   * @param {Object} [config.actor] - Who initiated
   * @param {Array} [config.results] - All guard results
   * @returns {Promise<Object>}
   */
  async record({
    action,
    target,
    verdict,
    guard,
    params,
    actor,
    results,
  }) {
    const entry = {
      id: crypto.randomUUID(),
      action,
      target,
      verdict,
      guard,
      params: this.sanitizeParams(params),
      actor: actor?.id,
      actorRole: actor?.role,
      results: results ? this.sanitizeResults(results) : [],
      timestamp: Date.now(),
      iso: new Date().toISOString(),
    };

    // Compute hash chain for immutability
    if (this.entries.length > 0) {
      const prevEntry = this.entries[this.entries.length - 1];
      entry.prevHash = this.hashEntry(prevEntry);
    }

    // Append to log
    await fs.appendFile(
      this.path,
      JSON.stringify(entry) + '\n',
    );

    this.entries.push(entry);
    this.hash = this.hashEntry(entry);

    return entry;
  }

  /**
   * Compute SHA256 hash of entry for chain integrity
   * @private
   * @param {Object} entry
   * @returns {string}
   */
  hashEntry(entry) {
    const data = JSON.stringify({
      action: entry.action,
      target: entry.target,
      verdict: entry.verdict,
      timestamp: entry.timestamp,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Query audit log
   * @param {Object} config
   * @param {string} [config.action] - Filter by action
   * @param {string} [config.verdict] - Filter by verdict ('allowed', 'denied')
   * @param {string} [config.guard] - Filter by guard name
   * @param {string} [config.actor] - Filter by actor
   * @param {number} [config.since] - Filter entries since timestamp
   * @param {number} [config.limit] - Max results
   * @returns {Array}
   */
  query({
    action,
    verdict,
    guard,
    actor,
    since,
    limit = 100,
  }) {
    let results = this.entries;

    if (action) {
      results = results.filter((e) => e.action === action);
    }

    if (verdict) {
      results = results.filter((e) => e.verdict === verdict);
    }

    if (guard) {
      results = results.filter((e) => e.guard === guard);
    }

    if (actor) {
      results = results.filter((e) => e.actor === actor);
    }

    if (since) {
      results = results.filter((e) => e.timestamp >= since);
    }

    return results.slice(-limit);
  }

  /**
   * Get recent entries
   * @param {number} [limit]
   * @returns {Array}
   */
  recent({ limit = 20 } = {}) {
    return this.entries.slice(-limit).reverse();
  }

  /**
   * Get statistics for time period
   * @param {Object} config
   * @param {number} [config.since] - Start timestamp
   * @param {number} [config.until] - End timestamp
   * @returns {Object}
   */
  statistics({ since, until } = {}) {
    let filtered = this.entries;

    if (since) {
      filtered = filtered.filter((e) => e.timestamp >= since);
    }

    if (until) {
      filtered = filtered.filter((e) => e.timestamp <= until);
    }

    const stats = {
      total: filtered.length,
      allowed: 0,
      denied: 0,
      pending: 0,
      byGuard: {},
      byAction: {},
      byActor: {},
    };

    for (const entry of filtered) {
      stats[entry.verdict] = (stats[entry.verdict] || 0) + 1;

      if (entry.guard) {
        stats.byGuard[entry.guard] = (stats.byGuard[entry.guard] || 0) + 1;
      }

      if (entry.action) {
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      }

      if (entry.actor) {
        stats.byActor[entry.actor] = (stats.byActor[entry.actor] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Export audit log as array
   * @param {Object} [config]
   * @param {number} [config.since] - Start timestamp
   * @param {number} [config.limit] - Max entries
   * @returns {Array}
   */
  export({ since, limit = 1000 } = {}) {
    let results = this.entries;

    if (since) {
      results = results.filter((e) => e.timestamp >= since);
    }

    return results.slice(-limit);
  }

  /**
   * Verify audit log integrity
   * @returns {Object}
   */
  verify() {
    let valid = true;
    const issues = [];

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      if (i > 0) {
        const prevEntry = this.entries[i - 1];
        const expectedHash = this.hashEntry(prevEntry);

        if (entry.prevHash !== expectedHash) {
          valid = false;
          issues.push({
            index: i,
            issue: 'Hash chain broken',
            expected: expectedHash,
            actual: entry.prevHash,
          });
        }
      }
    }

    return {
      valid,
      entriesChecked: this.entries.length,
      issues,
    };
  }

  /**
   * Sanitize parameters for logging
   * @private
   * @param {*} params
   * @returns {*}
   */
  sanitizeParams(params) {
    if (!params || typeof params !== 'object') return params;

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
   * Sanitize results for logging
   * @private
   * @param {Array} results
   * @returns {Array}
   */
  sanitizeResults(results) {
    return results.map((r) => ({
      ...r,
      data: r.data ? this.sanitizeParams(r.data) : undefined,
    }));
  }
}

module.exports = {
  SafetyAudit,
};
