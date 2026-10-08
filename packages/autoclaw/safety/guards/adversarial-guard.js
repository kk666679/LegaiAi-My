/**
 * .autoclaw/safety/guards/adversarial-guard.js
 * Detect prompt injection and adversarial attacks
 * 12 patterns: instruction override, encoding attacks, zero-width unicode
 */

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all instructions/i,
  /you are now/i,
  /system:\s/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /forget everything/i,
  /new instructions:/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /disregard.*prior/i,
  /as an ai language model/i,
];

const ENCODING_ATTACKS = [
  /base64/i,
  /\\x[0-9a-f]{2}/i,
  /\\u[0-9a-f]{4}/i,
  /%[0-9a-f]{2}/i,
];

class AdversarialGuard {
  /**
   * @param {Object} config
   * @param {number} [config.threshold] - Score threshold for flagging
   */
  constructor({ config = {} } = {}) {
    this.threshold = config.threshold ?? 0.5;
  }

  /**
   * Check for adversarial patterns
   * @param {Object} config
   * @param {*} config.params - Parameters to check
   * @returns {Promise<{allowed, suspected, score, signals, requiresApproval, reason}>}
   */
  async check({ params }) {
    const text = this.extractText(params);
    if (!text) {
      return { allowed: true, score: 0, signals: [] };
    }

    const signals = [];
    let score = 0;

    // Check injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        signals.push({ type: 'injection', pattern: pattern.toString() });
        score += 0.3;
      }
    }

    // Check encoding attacks
    for (const pattern of ENCODING_ATTACKS) {
      if (pattern.test(text)) {
        signals.push({ type: 'encoding', pattern: pattern.toString() });
        score += 0.1;
      }
    }

    // Length anomalies (>10KB suspicious)
    if (text.length > 10000) {
      signals.push({ type: 'length', value: text.length });
      score += 0.1;
    }

    // Zero-width unicode
    if (/[\u200B-\u200D\uFEFF]/.test(text)) {
      signals.push({ type: 'zero_width_unicode' });
      score += 0.2;
    }

    // Homoglyphs (confusable chars)
    if (/[а-яёА-ЯЁ]/.test(text)) {
      // Cyrillic mixed with Latin
      signals.push({ type: 'homoglyph_attack' });
      score += 0.15;
    }

    const suspected = score >= this.threshold;

    return {
      allowed: !suspected,
      suspected,
      score: Math.min(score, 1.0),
      signals,
      requiresApproval: suspected,
      reason: suspected ? 'Potential prompt injection detected' : null,
    };
  }

  /**
   * Extract text from various parameter types
   * @private
   * @param {*} params
   * @returns {string}
   */
  extractText(params) {
    if (!params) return '';
    if (typeof params === 'string') return params;
    if (params.prompt) return params.prompt;
    if (params.input) {
      return typeof params.input === 'string' ? params.input : JSON.stringify(params.input);
    }
    if (params.text) return params.text;
    if (params.content) return params.content;
    return JSON.stringify(params);
  }
}

;

export { AdversarialGuard };
