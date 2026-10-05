/**
 * .autoclaw/safety/guards/pii-guard.js
 * Detect and redact personally identifiable information
 * 7 patterns: email, phone, SSN, credit card, API key, JWT, AWS key
 */

const PII_PATTERNS = [
  {
    name: 'email',
    regex: /[\w.-]+@[\w.-]+\.\w+/g,
    sensitivity: 'high',
  },
  {
    name: 'phone',
    regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    sensitivity: 'high',
  },
  {
    name: 'ssn',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    sensitivity: 'critical',
  },
  {
    name: 'credit_card',
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    sensitivity: 'critical',
  },
  {
    name: 'api_key',
    regex: /\b(sk|pk)_[a-zA-Z0-9]{20,}\b/g,
    sensitivity: 'critical',
  },
  {
    name: 'jwt',
    regex: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
    sensitivity: 'critical',
  },
  {
    name: 'aws_key',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    sensitivity: 'critical',
  },
];

class PIIGuard {
  /**
   * @param {Object} config
   * @param {boolean} [config.redact] - Redact PII in output
   * @param {string} [config.redactionFormat] - Format like '[REDACTED:type]'
   */
  constructor({ config = {} } = {}) {
    this.redact = config.redact ?? true;
    this.redactionFormat = config.redactionFormat ?? '[REDACTED:{type}]';
  }

  /**
   * Check for PII in parameters
   * @param {Object} config
   * @param {*} config.params - Parameters to check
   * @returns {Promise<{allowed, detections, requiresApproval, redacted}>}
   */
  async check({ params }) {
    const text = this.extractText(params);
    if (!text) {
      return { allowed: true, detections: [] };
    }

    const detections = [];

    for (const { name, regex, sensitivity } of PII_PATTERNS) {
      const matches = text.match(regex);
      if (matches) {
        detections.push({
          type: name,
          count: matches.length,
          sensitivity,
        });
      }
    }

    // Critical PII requires approval
    const hasCritical = detections.some((d) => d.sensitivity === 'critical');

    return {
      allowed: true, // Not blocking, but flagged
      detections,
      requiresApproval: hasCritical,
      redacted: this.redact ? this.redactText(text) : null,
      reason: hasCritical ? 'Critical PII detected' : null,
    };
  }

  /**
   * Redact PII from text
   * @private
   * @param {string} text
   * @returns {string}
   */
  redactText(text) {
    let result = text;

    for (const { name, regex } of PII_PATTERNS) {
      const format = this.redactionFormat.replace('{type}', name);
      result = result.replace(regex, format);
    }

    return result;
  }

  /**
   * Extract text from parameters
   * @private
   * @param {*} params
   * @returns {string}
   */
  extractText(params) {
    if (!params) return '';
    if (typeof params === 'string') return params;
    return JSON.stringify(params);
  }
}

module.exports = {
  PIIGuard,
};
