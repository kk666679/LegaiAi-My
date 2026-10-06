/**
 * safety/adversarial-guard.js — Prompt injection and adversarial input detection.
 *
 * Detects:
 * - Prompt injection attempts
 * - Jailbreak attempts
 * - Data exfiltration attempts
 * - Tool misuse patterns
 * - Chain-of-thought manipulation
 */
Object.defineProperty(exports, "__esModule", { value: true });

class AdversarialGuard {
  constructor(config = {}) {
    this.config = config;
    this.patterns = this.loadPatterns();
    this.enabled = config.enabled ?? true;
    this.mode = config.mode ?? 'block'; // 'block' | 'warn' | 'log'
  }

  loadPatterns() {
    return {
      // Prompt injection
      injection: [
        /ignore\s+(previous|prior|all)\s+instructions?/i,
        /disregard\s+(previous|prior|all)\s+instructions?/i,
        /forget\s+(everything|all|previous)/i,
        /you\s+are\s+now\s+(a|an)\s+\w+/i,
        /system\s+prompt/i,
        /new\s+instructions?:/i,
        /override\s+(system|previous)/i,
        /pretend\s+(to\s+be|you\s+are)/i,
        /roleplay\s+as/i,
        /act\s+as\s+if/i,
      ],

      // Jailbreak
      jailbreak: [
        /DAN\s+mode/i,
        /developer\s+mode/i,
        /unrestricted\s+mode/i,
        /no\s+restrictions/i,
        /bypass\s+(safety|filter|guard)/i,
        /uncensored/i,
        /free\s+mode/i,
      ],

      // Data exfiltration
      exfiltration: [
        /output\s+(system|internal|hidden)\s+(prompt|instructions?)/i,
        /show\s+me\s+(your|the)\s+(system|hidden)\s+prompt/i,
        /what\s+is\s+your\s+(system|initial)\s+prompt/i,
        /repeat\s+(your|the)\s+(system|instructions?)/i,
        /print\s+(your|the)\s+(prompt|instructions?)/i,
        /reveal\s+(your|the)\s+(prompt|instructions?|secrets?)/i,
      ],

      // Tool misuse
      toolMisuse: [
        /delete\s+(all|everything|database)/i,
        /drop\s+(table|database)/i,
        /rm\s+-rf\s+/i,
        /format\s+(disk|drive)/i,
        /shutdown|reboot|halt/i,
        /disable\s+(security|firewall|antivirus)/i,
      ],

      // Chain of thought manipulation
      cotManipulation: [
        /think\s+step\s+by\s+step/i,
        /show\s+your\s+(reasoning|thinking|work)/i,
        /explain\s+your\s+(reasoning|thinking)/i,
        /let\s+me\s+see\s+your\s+(thoughts|reasoning)/i,
        /output\s+your\s+(internal|hidden)\s+(thoughts|reasoning)/i,
      ],
    };
  }

  /**
   * Scan text for adversarial patterns
   */
  scan(text, options = {}) {
    if (!this.enabled) return { safe: true, findings: [] };

    const findings = [];
    const lowerText = text.toLowerCase();

    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          findings.push({
            category,
            pattern: pattern.toString(),
            match: text.match(pattern)?.[0],
            severity: this.getSeverity(category),
          });
        }
      }
    }

    // Additional heuristic checks
    const heuristicFindings = this.heuristicChecks(text);
    findings.push(...heuristicFindings);

    const safe = findings.length === 0 || findings.every(f => f.severity === 'low');

    return {
      safe,
      findings,
      action: !safe && this.mode === 'block' ? 'block' : this.mode === 'warn' ? 'warn' : 'log',
    };
  }

  heuristicChecks(text) {
    const findings = [];

    // Excessive repetition (potential DoS)
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (words.length > 100 && uniqueWords.size / words.length < 0.3) {
      findings.push({ category: 'repetition', severity: 'medium', detail: 'High repetition ratio' });
    }

    // Very long input (potential context stuffing)
    if (text.length > 50000) {
      findings.push({ category: 'length', severity: 'medium', detail: `Input length ${text.length} chars` });
    }

    // Encoded content (base64, etc)
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(text.trim()) && text.length > 100) {
      findings.push({ category: 'encoding', severity: 'high', detail: 'Possible base64 encoded payload' });
    }

    return findings;
  }

  getSeverity(category) {
    const severities = {
      injection: 'high',
      jailbreak: 'high',
      exfiltration: 'critical',
      toolMisuse: 'critical',
      cotManipulation: 'medium',
    };
    return severities[category] ?? 'medium';
  }

  /**
   * Sanitize text by removing/masking adversarial content
   */
  sanitize(text) {
    let result = text;
    for (const patterns of Object.values(this.patterns)) {
      for (const pattern of patterns) {
        result = result.replace(pattern, '[FILTERED]');
      }
    }
    return result;
  }

  /**
   * Check if input is safe for LLM
   */
  checkForLLM(text) {
    const result = this.scan(text);
    return {
      allowed: result.safe || this.mode !== 'block',
      findings: result.findings,
      sanitized: this.sanitize(text),
    };
  }
}

export { AdversarialGuard as AdversarialGuard };
