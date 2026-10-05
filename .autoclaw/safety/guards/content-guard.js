/**
 * .autoclaw/safety/guards/content-guard.js
 * Content moderation - detect harmful, illegal, or policy-violating content
 */

class ContentGuard {
  /**
   * @param {Object} config
   * @param {boolean} [config.enabled] - Enable content moderation
   */
  constructor({ config = {} } = {}) {
    this.enabled = config.enabled ?? true;
  }

  /**
   * Check content against policies
   * @param {Object} config
   * @param {*} config.params - Parameters to check
   * @returns {Promise<{allowed, flagged, categories, requiresApproval, reason}>}
   */
  async check({ params }) {
    if (!this.enabled) {
      return { allowed: true, flagged: false, categories: [] };
    }

    const text = this.extractText(params);
    if (!text) {
      return { allowed: true, flagged: false, categories: [] };
    }

    const categories = [];

    // Violence/threats detection
    if (this.hasViolenceKeywords(text)) {
      categories.push({
        category: 'violence',
        severity: 'high',
      });
    }

    // Illegal activity detection
    if (this.hasIllegalKeywords(text)) {
      categories.push({
        category: 'illegal_activity',
        severity: 'critical',
      });
    }

    // Hate speech detection (simplified)
    if (this.hasHateSpeechKeywords(text)) {
      categories.push({
        category: 'hate_speech',
        severity: 'high',
      });
    }

    // Sexual content detection
    if (this.hasSexualContent(text)) {
      categories.push({
        category: 'sexual_content',
        severity: 'medium',
      });
    }

    const flagged = categories.length > 0;
    const hasCritical = categories.some((c) => c.severity === 'critical');

    return {
      allowed: !hasCritical, // Allow high/medium, block critical
      flagged,
      categories,
      requiresApproval: flagged,
      reason: flagged ? `Content moderation flagged: ${categories.map((c) => c.category).join(', ')}` : null,
    };
  }

  /**
   * Check for violence keywords
   * @private
   * @param {string} text
   * @returns {boolean}
   */
  hasViolenceKeywords(text) {
    const patterns = [/kill|murder|violence|hurt|shoot|stab|bomb/i];
    return patterns.some((p) => p.test(text));
  }

  /**
   * Check for illegal activity keywords
   * @private
   * @param {string} text
   * @returns {boolean}
   */
  hasIllegalKeywords(text) {
    const patterns = [
      /drug manufacturing|human trafficking|money laundering|fraud|hacking/i,
    ];
    return patterns.some((p) => p.test(text));
  }

  /**
   * Check for hate speech keywords
   * @private
   * @param {string} text
   * @returns {boolean}
   */
  hasHateSpeechKeywords(text) {
    const patterns = [/discriminate|racism|sexism|homophobic/i];
    return patterns.some((p) => p.test(text));
  }

  /**
   * Check for sexual content
   * @private
   * @param {string} text
   * @returns {boolean}
   */
  hasSexualContent(text) {
    const patterns = [/explicit sexual|pornography|adult content/i];
    return patterns.some((p) => p.test(text));
  }

  /**
   * Extract text
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
  ContentGuard,
};
