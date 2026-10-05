"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePremiumEscalation = evaluatePremiumEscalation;
const types_1 = require("./types");
function evaluatePremiumEscalation(input) {
    const policy = input.policy;
    if (!policy) {
        return deny('policy_missing', 'Premium escalation requires an explicit policy.');
    }
    const minAttempts = policy.minAttemptsBeforeEscalation ?? 1;
    if (input.attempts < minAttempts) {
        return deny('threshold_not_met', `Escalation requires ${minAttempts} attempt(s) before premium routing.`);
    }
    const allowedTriggers = policy.allowedFailureTriggers ?? [];
    const matchedTrigger = input.previousFailures.find((failure) => allowedTriggers.includes(failure));
    if (allowedTriggers.length > 0 && !matchedTrigger) {
        return deny('failure_trigger_not_allowed', 'Previous failures do not match premium escalation triggers.');
    }
    const allowedProviders = policy.allowedProviders ?? [];
    if (allowedProviders.length > 0 && !allowedProviders.includes(input.candidate.providerId)) {
        return deny('provider_not_allowed', `Provider ${input.candidate.providerId} is not allowed for premium escalation.`);
    }
    // Fail closed on unknown cost: a budget-gated policy cannot verify a
    // candidate that reports no costCents, so treating it as 0c would let any
    // cost-silent premium model bypass the entire budget gate (the WL-2.4
    // request_changes). Unknown cost is acceptable only when the policy carries
    // no budget constraint at all.
    const candidateCost = input.candidate.costCents;
    const policyBudget = policy.maxCostCents;
    const budgetGated = policyBudget !== undefined || input.budgetRemainingCents !== undefined;
    if (budgetGated && candidateCost === undefined) {
        return deny('cost_unknown', `Candidate ${input.candidate.providerId}:${input.candidate.model} reports no costCents; ` +
            'a budget-gated policy denies unverifiable cost. Provide the candidate cost or remove the budget gate deliberately.');
    }
    if (policyBudget !== undefined && candidateCost !== undefined && candidateCost > policyBudget) {
        return deny('budget_exhausted', `Candidate cost ${candidateCost}c exceeds policy max ${policyBudget}c.`);
    }
    if (input.budgetRemainingCents !== undefined && candidateCost !== undefined && candidateCost > input.budgetRemainingCents) {
        return deny('budget_exhausted', `Candidate cost ${candidateCost}c exceeds remaining budget ${input.budgetRemainingCents}c.`);
    }
    if ((input.releaseCritical || input.securitySensitive) && !input.humanApproved) {
        return deny('release_or_security_override_requires_human', 'Release-critical or security-sensitive premium escalation requires human approval.');
    }
    if (policy.requiresHumanApproval && !input.humanApproved) {
        return deny('human_approval_required', 'Premium escalation requires human approval.');
    }
    const failureReason = matchedTrigger ?? input.previousFailures[input.previousFailures.length - 1] ?? 'unknown_external';
    return {
        allowed: true,
        reason: 'allowed',
        selected: input.candidate,
        runEvent: {
            schema: types_1.WORKFLOW_RUN_EVENT_SCHEMA,
            runId: input.runId,
            nodeId: input.nodeId,
            event: 'escalated',
            timestamp: input.timestamp,
            failureType: failureReason,
            model: {
                provider: input.candidate.providerId,
                model: input.candidate.model,
                locality: input.candidate.locality,
                selectionReason: `premium escalation allowed after ${input.attempts} attempt(s): ${failureReason}`,
            },
            // Only record a cost when the candidate reported one — a fabricated 0c
            // in the run ledger would be the same lie the gate above now rejects.
            ...(candidateCost !== undefined ? { tokens: { costCents: candidateCost } } : {}),
            retryCount: input.attempts,
            summary: `Premium escalation to ${input.candidate.providerId}:${input.candidate.model} allowed after ${input.attempts} attempt(s).`,
            policyDecision: {
                allowed: true,
                policyId: 'premium-model-escalation',
                reason: `Allowed by premium model policy after ${input.attempts} attempt(s).`,
                evidence: input.previousFailures,
            },
        },
    };
}
function deny(reason, remediation) {
    return {
        allowed: false,
        reason,
        remediation,
    };
}
//# sourceMappingURL=escalationPolicy.js.map