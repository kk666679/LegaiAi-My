import { FAILURE_TYPES } from '../failure-types.js';
import { scoreSeverity } from './types.js';

export class Classifier {
  constructor({ llmFallbackThreshold = 0.6 } = {}) {
    this.llmFallbackThreshold = llmFallbackThreshold;
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    return [
      { class: 'timeout', patterns: [/timeout/i, /ETIMEDOUT/, /deadline exceeded/i] },
      { class: 'resource_exhaustion', patterns: [/OOM/i, /out of memory/i, /disk full/i, /ENOSPC/] },
      { class: 'network', patterns: [/ECONNREFUSED/, /ECONNRESET/, /DNS/, /socket hang up/] },
      { class: 'auth', patterns: [/401/, /403/, /unauthorized/i, /forbidden/i] },
      { class: 'validation', patterns: [/validation failed/i, /schema/i, /zod/i] },
      { class: 'rate_limit', patterns: [/429/, /rate limit/i, /throttl/i] },
      { class: 'dependency', patterns: [/module not found/i, /import.*error/i, /cannot find/i] },
      { class: 'logic', patterns: [/assertion failed/i, /invariant/i, /unexpected state/i] },
      { class: 'crash', patterns: [/segfault/i, /SIGSEGV/i, /SIGKILL/i, /core dumped/i] },
    ];
  }

  async classify(symptom, context = {}) {
    const text = `${symptom.message ?? ''} ${symptom.stack ?? ''} ${JSON.stringify(context)}`;

    for (const { class: cls, patterns } of this.patterns) {
      if (patterns.some((p) => p.test(text))) {
        return {
          class: cls,
          confidence: 0.9,
          severity: scoreSeverity(cls, symptom),
          method: 'rule',
          matchedPattern: patterns.find((p) => p.test(text)).toString(),
        };
      }
    }

    return this.llmClassify(symptom, context);
  }

  async llmClassify(symptom, context) {
    const prompt = `Classify the following failure into one of: ${FAILURE_TYPES.join(', ')}.
Return JSON: {"class":"...","confidence":0-1,"reasoning":"..."}

Failure:
${symptom.message}
Stack:
${symptom.stack ?? '(none)'}

Context:
${JSON.stringify(context, null, 2)}`.trim();

    try {
      const { complete } = await import('../../llm/complete.js');
      const result = await complete({ prompt, responseFormat: 'json', maxTokens: 300 });
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;

      return {
        class: parsed.class,
        confidence: parsed.confidence,
        severity: scoreSeverity(parsed.class, symptom),
        method: 'llm',
        reasoning: parsed.reasoning,
      };
    } catch {
      return {
        class: 'unknown',
        confidence: 0.3,
        severity: 'medium',
        method: 'fallback',
        reasoning: 'LLM classification failed',
      };
    }
  }
}
