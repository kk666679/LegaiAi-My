/**
 * .autoclaw/safety/guards/tool-guard.js
 * Tool allowlist enforcement - restrict which tools can be called
 */

class ToolGuard {
  /**
   * @param {Object} config
   * @param {Set|Array} [config.allowlist] - Allowed tool names
   * @param {Set|Array} [config.blocklist] - Blocked tool names
   */
  constructor({ config = {} } = {}) {
    this.allowlist = config.allowlist ? new Set(config.allowlist) : null;
    this.blocklist = config.blocklist ? new Set(config.blocklist) : new Set();
  }

  /**
   * Check if tool call is allowed
   * @param {Object} config
   * @param {string} config.action - Tool/action name
   * @param {string} [config.target] - Target resource
   * @param {*} [config.params] - Tool parameters
   * @returns {Promise<{allowed, reason}>}
   */
  async check({ action, target, params }) {
    // Check blocklist first (highest priority)
    if (this.blocklist.has(action)) {
      return {
        allowed: false,
        reason: `Tool "${action}" is blocked`,
      };
    }

    // Check allowlist if defined
    if (this.allowlist && !this.allowlist.has(action)) {
      return {
        allowed: false,
        reason: `Tool "${action}" is not in allowlist`,
      };
    }

    // Check for dangerous parameter combinations
    if (this.isDangerousCall({ action, params })) {
      return {
        allowed: false,
        reason: `Dangerous parameters detected for tool "${action}"`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check for dangerous parameter combinations
   * @private
   * @param {Object} config
   * @returns {boolean}
   */
  isDangerousCall({ action, params }) {
    if (!params) return false;

    // Detect file operations on sensitive paths
    if (/file|read|write|delete|mkdir|rmdir/.test(action)) {
      const path = params.path || params.file || '';
      if (this.isSensitivePath(path)) {
        return true;
      }
    }

    // Detect shell execution with suspicious commands
    if (/shell|exec|eval|run|execute/.test(action)) {
      const cmd = params.command || params.cmd || '';
      if (this.isSuspiciousCommand(cmd)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if path is sensitive
   * @private
   * @param {string} path
   * @returns {boolean}
   */
  isSensitivePath(path) {
    if (!path || typeof path !== 'string') return false;

    const sensitivePatterns = [
      /^\/etc\//,
      /^\/sys\//,
      /^\/proc\//,
      /^\/dev\//,
      /^C:\\Windows/i,
      /^C:\\Program Files/i,
      /\.autoclaw\/safety/,
    ];

    return sensitivePatterns.some((p) => p.test(path));
  }

  /**
   * Check for suspicious shell commands
   * @private
   * @param {string} cmd
   * @returns {boolean}
   */
  isSuspiciousCommand(cmd) {
    if (!cmd || typeof cmd !== 'string') return false;

    const suspiciousPatterns = [
      /sudo/i,
      /rm\s+-rf/,
      /dd\s+if=/,
      /nc\s+-l/, // netcat listening
      /wget\s+http.*\|.*sh/, // Download and execute
      /curl\s+http.*\|.*sh/,
    ];

    return suspiciousPatterns.some((p) => p.test(cmd));
  }

  /**
   * Add tool to allowlist
   * @param {string} toolName
   */
  addToAllowlist(toolName) {
    if (!this.allowlist) {
      this.allowlist = new Set();
    }
    this.allowlist.add(toolName);
  }

  /**
   * Remove tool from allowlist
   * @param {string} toolName
   */
  removeFromAllowlist(toolName) {
    if (this.allowlist) {
      this.allowlist.delete(toolName);
    }
  }

  /**
   * Add tool to blocklist
   * @param {string} toolName
   */
  addToBlocklist(toolName) {
    this.blocklist.add(toolName);
  }

  /**
   * Remove tool from blocklist
   * @param {string} toolName
   */
  removeFromBlocklist(toolName) {
    this.blocklist.delete(toolName);
  }

  /**
   * Get allowlist
   * @returns {Array|null}
   */
  getAllowlist() {
    return this.allowlist ? Array.from(this.allowlist) : null;
  }

  /**
   * Get blocklist
   * @returns {Array}
   */
  getBlocklist() {
    return Array.from(this.blocklist);
  }
}

module.exports = {
  ToolGuard,
};
