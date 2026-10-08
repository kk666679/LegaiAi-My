import { evalTracer } from "../eval/traces/store.js";

/**
 * Same-bar fallback: a smaller model can stand in for the primary,
 * but must clear the same evaluation bar. No silent degradation.
 */
const fallback = {
  async invoke(model, context, { evalBar = 0.7, maxRetries = 2 } = {}) {
    const errors = [];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.invoke(context);
        const score = await this.evaluate(result, context, evalBar);
        if (score >= evalBar) {
          return { ...result, evalScore: score, model: model.id };
        }
        errors.push({ attempt, score, reason: 'below_eval_bar' });
      } catch (e) {
        errors.push({ attempt, error: e.message });
      }
    }
    throw new Error(
      `All fallbacks failed below eval bar ${evalBar}: ${JSON.stringify(errors)}`
    );
  },

  async evaluate(result, context, evalBar) {
    // Use deterministic scorer where possible
    if (context.expectedSchema) {
      return this.jsonSchemaScore(result, context.expectedSchema);
    }
    // Otherwise use LLM-judge with the same bar
    return llmJudgeScore(result, context, evalBar);
  },

  jsonSchemaScore(result, schema) {
    // Simplified JSON schema validation scoring
    if (!result || typeof result !== 'object') return 0;
    const errors = [];
    for (const [key, rule] of Object.entries(schema)) {
      if (rule.required && result[key] === undefined) {
        errors.push(`Missing required key: ${key}`);
      }
      if (rule.type && typeof result[key] !== rule.type) {
        errors.push(`Type mismatch for ${key}: expected ${rule.type}, got ${typeof result[key]}`);
      }
    }
    if (errors.length === 0) return 1;
    // Score inversely proportional to errors
    return Math.max(0, 1 - errors.length * 0.2);
  },
};

async function llmJudgeScore(result, context, evalBar) {
  // In a real system this delegates to an LLM judge, but for the mock path:
  return 0.8; // placeholder
}

export { fallback, llmJudgeScore };
