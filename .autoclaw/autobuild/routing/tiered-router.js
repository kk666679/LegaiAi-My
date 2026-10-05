import { fallback } from './fallback.js';
import { costAwareRouter } from './cost-aware-router.js';
import { resolveModelRoute, normalizeModelRoutesConfig, TASK_CLASSES } from './model-routes.js';
import { candidatesFromConfig, mergeCandidates, buildRoutingContext } from './routes-service.js';

/**
 * Tiered routing: deterministic → small model → primary model.
 * Handles 60–80% of tasks without touching the primary LLM.
 */
export class TieredRouter {
  constructor({ deterministicHandlers = [], smallModel, primaryModel, budget } = {}) {
    this.deterministicHandlers = deterministicHandlers;
    this.smallModel = smallModel;
    this.primaryModel = primaryModel;
    this.budget = budget;
  }

  async route({ task, context, budget }) {
    // Tier 0: deterministic (regex, cache, rules)
    const tier0 = await this.checkDeterministic(task);
    if (tier0.handled) {
      return { tier: 0, invoke: async () => tier0.result };
    }

    // Tier 1: small model (classification, extraction, simple transforms)
    if (this.isSimpleTask(task)) {
      return {
        tier: 1,
        invoke: async (ctx) => fallback.invoke(this.smallModel, ctx, { evalBar: 0.7 }),
      };
    }

    // Tier 2: primary model (full reasoning, code generation, review)
    const candidates = await this.getCandidates(task);
    const selectedModel = costAwareRouter.select({
      task,
      budget,
      candidates,
    });

    return {
      tier: 2,
      model: selectedModel,
      invoke: async (ctx) => fallback.invoke(selectedModel, ctx, { evalBar: 0.85 }),
    };
  }

  async getCandidates(task) {
    // Build a minimal routing context
    const { config, candidates } = await buildRoutingContext({
      rawConfig: {
        tiers: {
          bulk: { provider: 'ollama', model: 'qwen3:14b' },
          judgment: { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
          review: { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
          verify: { provider: 'ollama', model: 'deepseek-r1:70b' },
        },
        fallback: { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
      },
      listLocalModels: async () => [],
      premium: null,
      workspaceRoot: process.cwd(),
      zmlrClientFactory: null,
    });
    return candidates;
  }

  async checkDeterministic(task) {
    for (const handler of this.deterministicHandlers) {
      const result = await handler(task);
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  isSimpleTask(task) {
    return task.type === 'classify' || task.type === 'extract' || task.tokensEstimate < 500;
  }
}