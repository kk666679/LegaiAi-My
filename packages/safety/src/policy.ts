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
    if (!this.matchResource(rule.resource, req.resource)) return false;
    for (const [k, v] of Object.entries(rule.conditions ?? {})) {
      if ((req.context ?? {})[k] !== v) return false;
    }
    return true;
  }

  private matchResource(pattern: string, value: string): boolean {
    if (pattern === '*') return true;
    if (pattern === value) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return value.startsWith(prefix);
    }
    return false;
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

    // Accumulate decisions across all matched rules. DENY always wins.
    // REQUIRE_APPROVAL wins over ALLOW/REDACT. ESCALATE wins over ALLOW/REDACT.
    let decision: Decision = 'ALLOW';
    let requiresApproval = false;
    let denied = false;
    for (const rule of active) {
      if (rule.decision === 'DENY') {
        decision = 'DENY';
        denied = true;
        break;
      }
      if (rule.decision === 'REQUIRE_APPROVAL') {
        decision = 'REQUIRE_APPROVAL';
        requiresApproval = true;
      } else if (rule.decision === 'ESCALATE') {
        if (decision !== 'REQUIRE_APPROVAL') decision = 'ESCALATE';
      } else if (rule.decision === 'REDACT') {
        if (decision === 'ALLOW') decision = 'REDACT';
      }
    }

    const top = active[0]!;
    return {
      decision,
      matchedRules: active.map((r) => r.id),
      reason: `matched ${active.length} rule(s); top: ${top.name}`,
      requiresApproval: denied ? false : requiresApproval,
    };
  }

  list(): PolicyRule[] { return Array.from(this.rules.values()); }
  clear(): void { this.rules.clear(); }
}