export class PolicyEngine {
  constructor({ rules = [] } = {}) {
    this.rules = rules;
  }

  async check({ task, requestingAgent, context }) {
    for (const rule of this.rules) {
      const result = await this.evaluate(rule, { task, requestingAgent, context });
      if (!result.allowed) return result;
    }
    return { allowed: true };
  }

  async evaluate(rule, ctx) {
    switch (rule.type) {
      case 'capability':
        return this.checkCapability(rule, ctx);
      case 'rate':
        return { allowed: true };
      case 'time_window':
        return this.checkTimeWindow(rule, ctx);
      case 'cost':
        return this.checkCost(rule, ctx);
      case 'custom':
        return rule.evaluate(ctx);
      default:
        return { allowed: true };
    }
  }

  checkCapability(rule, { requestingAgent }) {
    if (rule.requiredCapability && !(requestingAgent?.capabilities ?? []).includes(rule.requiredCapability)) {
      return { allowed: false, reason: `Missing capability: ${rule.requiredCapability}` };
    }
    return { allowed: true };
  }

  checkTimeWindow(rule) {
    const hour = new Date().getHours();
    if (hour < rule.startHour || hour >= rule.endHour) {
      return { allowed: false, reason: `Outside allowed hours (${rule.startHour}-${rule.endHour})` };
    }
    return { allowed: true };
  }

  checkCost(rule, { task }) {
    if (rule.maxEstimatedCost && task.estimatedCost > rule.maxEstimatedCost) {
      return { allowed: false, reason: `Estimated cost ${task.estimatedCost} exceeds ${rule.maxEstimatedCost}` };
    }
    return { allowed: true };
  }
}
