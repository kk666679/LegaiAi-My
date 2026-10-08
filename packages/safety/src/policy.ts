export type Decision = 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' | 'REDACT' | 'ESCALATE';

export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  action: string;
  subject: string;
  resource: string;
  conditions?: Record<string, unknown>;
  decision: Decision;
  priority: number;
  enabled: boolean;
}

export interface EvaluationRequest {
  actor: string;
  subject?: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
  capabilities?: string[];
  dataClass?: string;
  riskLevel?: string;
}

export interface EvaluationResult {
  decision: Decision;
  matchedRules: string[];
  reason?: string;
  requiresApproval: boolean;
}

export class PolicyEngine {
  private rules = new Map<string, PolicyRule>();

  add(rule: PolicyRule): void { this.rules.set(rule.id, rule); }
  remove(id: string): boolean { return this.rules.delete(id); }

  private matches(rule: PolicyRule, req: EvaluationRequest): boolean {
    if (!rule.enabled) return false;
    if (rule.action !== '*' && rule.action !== req.action) return false;
    const subject = req.subject ?? req.actor;
    if (rule.subject !== '*' && rule.subject !== subject) return false;
    if (rule.resource !== '*' && rule.resource !== req.resource) return false;
    for (const [k, v] of Object.entries(rule.conditions ?? {})) {
      if ((req.context ?? {})[k] !== v) return false;
    }
    return true;
  }

  evaluate(req: EvaluationRequest): EvaluationResult {
    const active = Array.from(this.rules.values())
      .filter((r) => this.matches(r, req))
      .sort((a, b) => b.priority - a.priority);

    if (active.length === 0) {
      return {
        decision: 'ALLOW',
        matchedRules: [],
        requiresApproval: false,
        reason: 'no matching rules (default allow)',
      };
    }

    const top = active[0]!;
    return {
      decision: top.decision,
      matchedRules: active.map((r) => r.id),
      reason: `matched rule: ${top.name}`,
      requiresApproval: top.decision === 'REQUIRE_APPROVAL',
    };
  }

  list(): PolicyRule[] { return Array.from(this.rules.values()); }
  clear(): void { this.rules.clear(); }
}
