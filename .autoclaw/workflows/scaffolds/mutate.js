"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutateScaffoldVariant = mutateScaffoldVariant;
exports.validateScaffoldMutationRequest = validateScaffoldMutationRequest;
const types_1 = require("./types");
const ROUTER_PROFILES = [
    'cheap',
    'balanced',
    'quality',
    'local-only',
    'air-gapped',
    'release-critical',
];
const REVIEWER_INDEPENDENCE = ['same-model', 'different-model', 'different-provider', 'human'];
const CONTEXT_MODES = ['minimal', 'balanced', 'full', 'kg-heavy'];
const LOOP_KINDS = ['retry', 'generate-verify-revise', 'retrieve-diagnose-reretrieve', 'best-of-N', 'mutation-test-strengthen'];
const MAX_TOOL_LANES = 8;
const MAX_BEST_OF_N = 5;
const MAX_ID_LENGTH = 80;
function mutateScaffoldVariant(request) {
    const diagnostics = validateScaffoldMutationRequest(request);
    if (diagnostics.some((item) => item.severity === 'error')) {
        return { ok: false, diagnostics };
    }
    const base = request.base;
    const createdAt = request.createdAt ?? new Date().toISOString();
    const child = {
        ...base,
        schema: types_1.SCAFFOLD_SCHEMA,
        id: childScaffoldId(base.id, request),
        createdAt,
        ...(request.createdBy ? { createdBy: request.createdBy } : {}),
        parentScaffoldId: base.id,
        mutation: {
            kind: request.kind,
            summary: mutationSummary(request),
            parentScaffoldId: base.id,
        },
        metadata: {
            ...(base.metadata ?? {}),
            mutationKind: request.kind,
        },
    };
    applyMutation(child, request);
    return { ok: true, diagnostics, scaffold: child };
}
function validateScaffoldMutationRequest(request) {
    const diagnostics = [];
    if (!supportedMutationKind(request.kind)) {
        diagnostics.push(error('unsupported_mutation', `unsupported scaffold mutation kind ${request.kind}`));
    }
    validateMutationPayload(request, diagnostics);
    validateScopeGuard(request, diagnostics);
    validatePolicyGuard(request, diagnostics);
    validateLocalityGuard(request, diagnostics);
    return diagnostics;
}
/**
 * Locality rank: how strongly a router profile confines execution to the local
 * machine. A mutation may tighten locality freely, but LOOSENING it (air-gapped
 * or local-only → a profile that may route to cloud providers) changes the
 * scaffold's data-boundary posture and needs a human, same as a scope widening.
 */
const LOCALITY_RANK = {
    'air-gapped': 2,
    'local-only': 1,
    cheap: 0,
    balanced: 0,
    quality: 0,
    'release-critical': 0,
};
function validateLocalityGuard(request, diagnostics) {
    if (request.humanApproved || request.kind !== 'router_profile' || !request.routerProfile) {
        return;
    }
    const from = request.base?.routerProfile;
    if (!from || !(from in LOCALITY_RANK)) {
        return;
    }
    if (LOCALITY_RANK[request.routerProfile] < LOCALITY_RANK[from]) {
        diagnostics.push(error('locality_downgrade_requires_human', `mutation moves routerProfile ${from} -> ${request.routerProfile}, loosening the local-execution boundary`));
    }
}
function validateMutationPayload(request, diagnostics) {
    switch (request.kind) {
        case 'context_mode':
            if (!request.contextMode || !CONTEXT_MODES.includes(request.contextMode)) {
                diagnostics.push(error('invalid_context_mode', 'context_mode mutation requires a supported contextMode'));
            }
            if (request.contextPlanId !== undefined && !validId(request.contextPlanId)) {
                diagnostics.push(error('invalid_context_mode', 'contextPlanId must be a bounded non-empty id'));
            }
            break;
        case 'loop_policy':
            if (!validLoopPolicy(request.loopPolicy)) {
                diagnostics.push(error('invalid_loop_policy', 'loop_policy mutation must stay within bounded loop limits'));
            }
            break;
        case 'router_profile':
            if (!request.routerProfile || !ROUTER_PROFILES.includes(request.routerProfile)) {
                diagnostics.push(error('invalid_router_profile', 'router_profile mutation requires a supported routerProfile'));
            }
            break;
        case 'best_of_n':
            if (typeof request.bestOfN !== 'number'
                || !Number.isInteger(request.bestOfN)
                || request.bestOfN < 1
                || request.bestOfN > MAX_BEST_OF_N) {
                diagnostics.push(error('invalid_best_of_n', `best_of_n must be an integer from 1 to ${MAX_BEST_OF_N}`));
            }
            break;
        case 'tool_lane':
            if (!validToolLaneIds(request.toolLaneIds)) {
                diagnostics.push(error('invalid_tool_lane', `tool_lane requires 1-${MAX_TOOL_LANES} bounded lane ids`));
            }
            break;
        case 'reviewer_independence':
            if (!request.reviewerIndependence || !REVIEWER_INDEPENDENCE.includes(request.reviewerIndependence)) {
                diagnostics.push(error('invalid_reviewer_independence', 'reviewer_independence mutation requires a supported value'));
            }
            break;
        default:
            break;
    }
}
function validateScopeGuard(request, diagnostics) {
    if (request.humanApproved) {
        return;
    }
    const current = new Set(request.currentScopeGlobs ?? []);
    const proposed = request.proposedScopeGlobs ?? [];
    const widened = proposed.filter((glob) => !current.has(glob));
    if (widened.length > 0) {
        diagnostics.push(error('scope_widening_requires_human', `mutation proposes new scope globs: ${widened.join(', ')}`));
    }
}
function validatePolicyGuard(request, diagnostics) {
    if (request.humanApproved || !request.proposedPolicies) {
        return;
    }
    const current = request.currentPolicies ?? {};
    const proposed = request.proposedPolicies;
    const bypasses = [];
    if (current.allowWrites !== true && proposed.allowWrites === true)
        bypasses.push('allowWrites');
    if (current.allowNetwork !== true && proposed.allowNetwork === true)
        bypasses.push('allowNetwork');
    if (current.requireHumanApproval === true && proposed.requireHumanApproval === false)
        bypasses.push('requireHumanApproval');
    if (current.premiumModelPolicy?.requiresHumanApproval === true && proposed.premiumModelPolicy?.requiresHumanApproval === false) {
        bypasses.push('premiumModelPolicy.requiresHumanApproval');
    }
    if (limitIncreased(current.maxIterations, proposed.maxIterations))
        bypasses.push('maxIterations');
    if (limitIncreased(current.maxDepth, proposed.maxDepth))
        bypasses.push('maxDepth');
    if (limitIncreased(current.maxWallTimeSeconds, proposed.maxWallTimeSeconds))
        bypasses.push('maxWallTimeSeconds');
    if (limitIncreased(current.budget?.maxCostCents, proposed.budget?.maxCostCents))
        bypasses.push('budget.maxCostCents');
    if (limitIncreased(current.budget?.maxTokens, proposed.budget?.maxTokens))
        bypasses.push('budget.maxTokens');
    if (limitIncreased(current.budget?.maxWallTimeSeconds, proposed.budget?.maxWallTimeSeconds))
        bypasses.push('budget.maxWallTimeSeconds');
    if (limitIncreased(current.budget?.maxIterations, proposed.budget?.maxIterations))
        bypasses.push('budget.maxIterations');
    if (limitIncreased(current.premiumModelPolicy?.maxCostCents, proposed.premiumModelPolicy?.maxCostCents)) {
        bypasses.push('premiumModelPolicy.maxCostCents');
    }
    if (providerListWidened(current.premiumModelPolicy?.allowedProviders, proposed.premiumModelPolicy?.allowedProviders)) {
        bypasses.push('premiumModelPolicy.allowedProviders');
    }
    if (bypasses.length > 0) {
        diagnostics.push(error('policy_bypass_requires_human', `mutation relaxes policy controls: ${bypasses.join(', ')}`));
    }
}
/**
 * A premium provider allowlist widens when a proposed list adds providers the
 * current list doesn't allow. No current list = unrestricted, so any proposed
 * list only narrows; a current list with no proposed list is left alone here
 * (merge semantics belong to the applier, and mutations never apply policies).
 */
function providerListWidened(current, proposed) {
    if (!Array.isArray(current) || !Array.isArray(proposed)) {
        return false;
    }
    const allowed = new Set(current);
    return proposed.some((p) => !allowed.has(p));
}
function applyMutation(scaffold, request) {
    switch (request.kind) {
        case 'context_mode':
            scaffold.contextPlanId = request.contextPlanId ?? `context:${request.contextMode}`;
            scaffold.metadata = {
                ...(scaffold.metadata ?? {}),
                contextMode: request.contextMode,
            };
            break;
        case 'loop_policy': {
            const policy = normalizeLoopPolicy(request.loopPolicy);
            scaffold.loopPolicyId = loopPolicyId(policy);
            scaffold.metadata = {
                ...(scaffold.metadata ?? {}),
                loopPolicy: policy,
            };
            break;
        }
        case 'router_profile':
            scaffold.routerProfile = request.routerProfile;
            break;
        case 'best_of_n':
            scaffold.metadata = {
                ...(scaffold.metadata ?? {}),
                bestOfN: request.bestOfN,
            };
            break;
        case 'tool_lane':
            scaffold.toolLaneIds = uniqueStrings(request.toolLaneIds);
            break;
        case 'reviewer_independence':
            scaffold.review = {
                ...(scaffold.review ?? { tier: 'tier1-local', gatesFirst: true }),
                reviewerIndependence: request.reviewerIndependence,
            };
            if (request.reviewerIndependence === 'human') {
                scaffold.review.tier = 'human';
            }
            break;
        default:
            break;
    }
}
function supportedMutationKind(kind) {
    return kind === 'context_mode'
        || kind === 'loop_policy'
        || kind === 'router_profile'
        || kind === 'best_of_n'
        || kind === 'tool_lane'
        || kind === 'reviewer_independence';
}
function validLoopPolicy(policy) {
    if (!policy)
        return false;
    const normalized = normalizeLoopPolicy(policy);
    return normalized.maxIterations >= 1
        && normalized.maxIterations <= 8
        && normalized.maxDepth >= 1
        && normalized.maxDepth <= 3
        && normalized.noProgressAfter >= 1
        && normalized.noProgressAfter <= 5
        && (!normalized.kind || LOOP_KINDS.includes(normalized.kind));
}
function normalizeLoopPolicy(policy) {
    return {
        ...(policy?.kind ? { kind: policy.kind } : {}),
        maxIterations: policy?.maxIterations ?? 3,
        maxDepth: policy?.maxDepth ?? 1,
        noProgressAfter: policy?.noProgressAfter ?? 2,
        ...(typeof policy?.escalateOnFailure === 'boolean' ? { escalateOnFailure: policy.escalateOnFailure } : {}),
    };
}
function validToolLaneIds(ids) {
    return Array.isArray(ids)
        && ids.length > 0
        && ids.length <= MAX_TOOL_LANES
        && uniqueStrings(ids).length === ids.length
        && ids.every(validId);
}
function validId(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH && !/\s/.test(value);
}
function uniqueStrings(values) {
    return [...new Set(values)];
}
function limitIncreased(current, proposed) {
    return typeof proposed === 'number' && (typeof current !== 'number' || proposed > current);
}
function childScaffoldId(parentId, request) {
    const basis = [
        request.kind,
        request.contextMode,
        request.contextPlanId,
        request.routerProfile,
        request.bestOfN,
        request.toolLaneIds?.join(','),
        request.reviewerIndependence,
        JSON.stringify(request.loopPolicy ?? {}),
    ].filter((part) => part !== undefined).join('|');
    return `${parentId}--mut-${sanitizeId(request.kind)}-${hashString(basis)}`;
}
function loopPolicyId(policy) {
    return `loop:${policy.kind ?? 'retry'}:${policy.maxIterations}:${policy.maxDepth}:${policy.noProgressAfter}`;
}
function mutationSummary(request) {
    switch (request.kind) {
        case 'context_mode': return `Set context mode to ${request.contextMode}`;
        case 'loop_policy': return `Set loop policy to ${loopPolicyId(normalizeLoopPolicy(request.loopPolicy))}`;
        case 'router_profile': return `Set router profile to ${request.routerProfile}`;
        case 'best_of_n': return `Set best-of-N count to ${request.bestOfN}`;
        case 'tool_lane': return `Set tool lanes to ${request.toolLaneIds?.join(', ')}`;
        case 'reviewer_independence': return `Set reviewer independence to ${request.reviewerIndependence}`;
        default: return `Apply ${request.kind} mutation`;
    }
}
function sanitizeId(value) {
    return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'mutation';
}
function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}
function error(code, reason) {
    return { code, severity: 'error', reason };
}
//# sourceMappingURL=mutate.js.map