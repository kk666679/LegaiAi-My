/**
 * @lawmate/safety — Policy engine.
 *
 * Every decision is explicit: ALLOW, DENY, REQUIRE_APPROVAL, REDACT, or ESCALATE.
 * Never trust agent-generated authorization decisions.
 */
import { randomUUID } from 'node:crypto';
import {
  PolicyEvaluationRequest,
  PolicyEvaluationResult,
  PolicyRule,
  Decision,
  LawmateError,
  ErrorCode,
} from '@lawmate/types';

export interface PolicyEngine {
  evaluate(request: PolicyEvaluationRequest): PolicyEvaluationResult;
  addRule(rule: PolicyRule): void;
  removeRule(ruleId: string): void;
  getRules(): PolicyRule[];
}

export class InMemoryPolicyEngine implements PolicyEngine {
  private rules: PolicyRule[] = [];

  evaluate(request: PolicyEvaluationRequest): PolicyEvaluationResult {
    const matched: string[] = [];
    let decision: Decision = 'ALLOW';
    let requiresApproval = false;
    const redactFields: string[] = [];
    let escalateTo: string | undefined;

    // Sort by priority descending.
    const sorted = [...this.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
      if (!rule.enabled) continue;
      if (!this.matches(rule, request)) continue;

      matched.push(rule.id);

      switch (rule.decision) {
        case 'DENY':
          decision = 'DENY';
          break;
        case 'REQUIRE_APPROVAL':
          if (decision !== 'DENY') decision = 'REQUIRE_APPROVAL';
          requiresApproval = true;
          break;
        case 'REDACT':
          if (decision !== 'DENY') decision = 'REDACT';
          if (rule.conditions?.redactFields) {
            redactFields.push(...(rule.conditions.redactFields as string[]));
          }
          break;
        case 'ESCALATE':
          if (decision !== 'DENY') decision = 'ESCALATE';
          escalateTo = rule.conditions?.escalateTo as string | undefined;
          break;
        case 'ALLOW':
          if (decision === 'ALLOW') continue;
          break;
      }

      if (decision === 'DENY') break;
    }

    return {
      decision,
      matchedRules: matched,
      requiresApproval,
      redactFields,
      escalateTo,
      reason: matched.length === 0 ? 'No matching policy; default ALLOW' : `Matched ${matched.length} rule(s)`,
    };
  }

  addRule(rule: PolicyRule): void {
    const existing = this.rules.findIndex((r) => r.id === rule.id);
    if (existing >= 0) this.rules[existing] = rule;
    else this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  getRules(): PolicyRule[] {
    return [...this.rules];
  }

  private matches(rule: PolicyRule, request: PolicyEvaluationRequest): boolean {
    if (rule.action !== '*' && rule.action !== request.action) return false;
    if (rule.subject !== '*' && rule.subject !== request.subject) return false;
    if (rule.resource !== '*' && rule.resource !== request.resource) return false;

    const conditions = rule.conditions || {};
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'redactFields' || key === 'escalateTo') continue;
      const requestValue = (request.context as Record<string, unknown>)[key];
      if (requestValue !== value) return false;
    }
    return true;
  }
}

export function createPolicyEngine(): PolicyEngine {
  return new InMemoryPolicyEngine();
}

/** Throw a policy-denied error. */
export function policyDeniedError(message: string, requestId?: string): LawmateError {
  return {
    code: 'POLICY_DENIED',
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function assertAllowed(result: PolicyEvaluationResult, requestId?: string): void {
  if (result.decision === 'DENY') {
    throw policyDeniedError(result.reason || 'Policy denied', requestId);
  }
}

export function assertApproval(result: PolicyEvaluationResult, requestId?: string): void {
  if (result.decision === 'DENY') {
    throw policyDeniedError(result.reason || 'Policy denied', requestId);
  }
  if (result.requiresApproval || result.decision === 'REQUIRE_APPROVAL') {
    throw Object.assign(new Error('REQUIRE_APPROVAL'), { code: 'REQUIRE_APPROVAL' as ErrorCode, requestId });
  }
}