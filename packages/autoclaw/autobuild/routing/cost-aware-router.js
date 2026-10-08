/**
 * Cost-aware router — budget-driven model selection.
 * Chooses the cheapest model that meets the quality bar.
 */
const costAwareRouter = {
  /**
   * Select the best model for the task within budget constraints.
   */
  select({ task, budget, candidates }) {
    // Sort candidates by cost (ascending), then by strength (descending)
    const sorted = [...candidates].sort((a, b) => {
      const costDiff = (a.costPerMTokens || 0) - (b.costPerMTokens || 0);
      if (costDiff !== 0) return costDiff;
      return (b.strength || 0.5) - (a.strength || 0.5);
    });

    // Find first model that fits within budget and has sufficient strength
    const minStrength = this.getMinStrength(task);
    for (const candidate of sorted) {
      if (candidate.strength >= minStrength) {
        const estimatedCost = this.estimateCost(candidate, task);
        if (estimatedCost <= budget) {
          return candidate;
        }
      }
    }

    // Fall back to cheapest candidate if nothing meets criteria
    return sorted[0] || { provider: 'host-default', model: null };
  },

  getMinStrength(task) {
    switch (task && task.type) {
      case 'review': return 0.7;
      case 'judgment': return 0.6;
      case 'extract': return 0.5;
      default: return 0.4;
    }
  },

  estimateCost(candidate, task) {
    const costPerM = candidate.costPerMTokens || 10;
    const tokensEstimate = task.tokensEstimate || 4000;
    return (tokensEstimate / 1000000) * costPerM;
  },
};

export { costAwareRouter };
