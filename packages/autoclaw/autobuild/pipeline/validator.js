/**
 * Validator — validates step outputs against requirements.
 */
class Validator {
  constructor(opts = {}) {
    this.rules = validatorRules;
  }

  async validate(stepResult, requirements) {
    const errors = [];

    // Check required outputs
    for (const req of requirements.outputs || []) {
      if (!stepResult.artifact[req.field]) {
        errors.push(`Missing required output: ${req.field}`);
      }
    }

    // Check constraints
    for (const constraint of requirements.constraints || []) {
      if (constraint.type === 'maxTime' && stepResult.timeEstimate > constraint.value) {
        errors.push(`Exceeds max time: ${stepResult.timeEstimate} > ${constraint.value}`);
      }
      if (constraint.type === 'maxCost' && stepResult.cost > constraint.value) {
        errors.push(`Exceeds max cost: $${stepResult.cost} > $${constraint.value}`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      score: Math.max(0, 1 - errors.length * 0.1),
    };
  }
}

export { Validator };
