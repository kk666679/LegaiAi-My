/**
 * safety/governance.js — Policy engine for agent actions.
 *
 * Centralized policy evaluation for agent operations.
 * Supports attribute-based access control (ABAC) with policy-as-code.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class GovernanceEngine {
  constructor(config = {}) {
    this.config = config;
    this.policies = new Map();
    this.defaultDecision = config.defaultDecision ?? 'deny';
    this.loadBuiltinPolicies();
  }

  loadBuiltinPolicies() {
    // Cost ceiling policy
    this.addPolicy('cost_ceiling', {
      description: 'Enforce per-agent and per-run cost ceilings',
      evaluate: async (context) => {
        const { agentId, estimatedCost, ceiling } = context;
        if (estimatedCost > ceiling.perRun) {
          return { allow: false, reason: `Run cost ${estimatedCost} exceeds ceiling ${ceiling.perRun}` };
        }
        // Check daily ceiling
        // Would query cost ledger
        return { allow: true };
      },
    });

    // Tool permission policy
    this.addPolicy('tool_permission', {
      description: 'Check if agent can use tool',
      evaluate: async (context) => {
        const { agentId, tool, scope, permissions } = context;
        const adminTools = ['device.reboot', 'device.wipe', 'fleet.delete'];
        if (adminTools.includes(tool) && !permissions.includes('admin')) {
          return { allow: false, reason: `Tool ${tool} requires admin permission` };
        }
        return { allow: true };
      },
    });

    // Data sensitivity policy
    this.addPolicy('data_sensitivity', {
      description: 'Prevent sensitive data exposure',
      evaluate: async (context) => {
        const { output, sensitivity } = context;
        if (sensitivity === 'high' && !context.allowHighSensitivity) {
          return { allow: false, reason: 'High sensitivity output requires explicit approval' };
        }
        return { allow: true };
      },
    });

    // Rate limiting policy
    this.addPolicy('rate_limit', {
      description: 'Enforce rate limits per agent',
      evaluate: async (context) => {
        const { agentId, action, limit } = context;
        // Would check rate limiter
        return { allow: true };
      },
    });
  }

  addPolicy(name, policy) {
    this.policies.set(name, { name, ...policy, enabled: true });
  }

  removePolicy(name) {
    this.policies.delete(name);
  }

  async evaluate(context) {
    const decisions = [];
    for (const [name, policy] of this.policies) {
      if (!policy.enabled) continue;
      try {
        const decision = await policy.evaluate(context);
        decisions.push({ policy: name, ...decision });
        if (!decision.allow && this.defaultDecision === 'deny') {
          return { allow: false, decisions, finalDecision: 'deny' };
        }
      } catch (e) {
        decisions.push({ policy: name, allow: false, reason: `Policy error: ${e.message}` });
      }
    }
    return { allow: true, decisions, finalDecision: 'allow' };
  }

  getPolicy(name) {
    return this.policies.get(name);
  }

  listPolicies() {
    return [...this.policies.values()].map(p => ({ name: p.name, description: p.description, enabled: p.enabled }));
  }
}

export { GovernanceEngine as GovernanceEngine };
