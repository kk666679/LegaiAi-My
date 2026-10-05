"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeWorkflowIntent = routeWorkflowIntent;
const select_1 = require("./scaffolds/select");
function routeWorkflowIntent(request) {
    const rejected = [];
    const requiredCapabilities = capabilitiesForIntent(request.intent, request.requirements?.capabilities ?? []);
    const allowedLocalities = localityPolicy(request.profile, request.requirements);
    const escalationActive = shouldEscalate(request);
    const scaffoldDecision = routeScaffold(request);
    const eligible = request.candidates.filter((candidate) => {
        const rejection = rejectionReason(candidate, request, requiredCapabilities, allowedLocalities, escalationActive);
        if (rejection) {
            rejected.push({ providerId: candidate.providerId, model: candidate.model, reason: rejection });
            return false;
        }
        return true;
    });
    const recommendation = request.recommendModel?.(request);
    if (recommendation) {
        const selected = eligible.find((candidate) => candidate.providerId === recommendation.providerId && candidate.model === recommendation.model);
        if (selected) {
            return {
                selected,
                selectedScaffold: scaffoldDecision?.selected,
                scaffoldDecision,
                rejected,
                usedRecommendation: true,
                ...(recommendation.harnessId ? { recommendedHarnessId: recommendation.harnessId } : {}),
                reason: withScaffoldReason(recommendation.reason ?? `ZippyMesh recommended ${selected.providerId}:${selected.model}.`, scaffoldDecision, recommendation.harnessId),
            };
        }
    }
    const fallbackEligible = eligible.length > 0
        ? eligible
        : request.requirements?.allowFallbackWithoutCapabilities
            ? request.candidates.filter((candidate) => candidate.healthy && allowedLocalities.includes(candidate.locality))
            : [];
    if (fallbackEligible.length === 0) {
        return {
            rejected,
            usedRecommendation: false,
            selectedScaffold: scaffoldDecision?.selected,
            scaffoldDecision,
            reason: withScaffoldReason('No eligible model satisfied health, locality, budget, context, and capability requirements.', scaffoldDecision),
        };
    }
    const ranked = [...fallbackEligible].sort((a, b) => scoreCandidate(b, request, escalationActive) - scoreCandidate(a, request, escalationActive));
    const selected = ranked[0];
    return {
        selected,
        selectedScaffold: scaffoldDecision?.selected,
        scaffoldDecision,
        rejected,
        usedRecommendation: false,
        reason: withScaffoldReason(selectionReason(selected, request, escalationActive, eligible.length === 0), scaffoldDecision),
    };
}
function routeScaffold(request) {
    if (!request.scaffoldSelection) {
        return undefined;
    }
    return (0, select_1.selectScaffoldVariant)({
        intent: request.intent,
        profile: request.profile,
        variants: request.scaffoldSelection.variants,
        scores: request.scaffoldSelection.scores,
        promptHarnesses: request.scaffoldSelection.promptHarnesses,
        constraints: request.scaffoldSelection.constraints,
        previousFailureType: request.previousFailures?.[0],
    });
}
function withScaffoldReason(reason, scaffoldDecision, harnessId) {
    const parts = [];
    if (!scaffoldDecision?.selected) {
        if (harnessId) {
            parts.push(`harness=${harnessId}`);
        }
    }
    else {
        parts.push(`scaffold=${scaffoldDecision.selected.id}`);
        if (harnessId) {
            parts.push(`harness=${harnessId}`);
        }
    }
    return parts.length ? `${reason}; ${parts.join('; ')}` : reason;
}
function rejectionReason(candidate, request, requiredCapabilities, allowedLocalities, escalationActive) {
    if (!candidate.healthy) {
        return 'provider unhealthy';
    }
    if (!allowedLocalities.includes(candidate.locality)) {
        return `locality ${candidate.locality} denied by profile/policy`;
    }
    if (request.requirements?.maxCostCents !== undefined && (candidate.costCents ?? 0) > request.requirements.maxCostCents) {
        return 'candidate exceeds cost ceiling';
    }
    if (request.requirements?.minContextWindow !== undefined && (candidate.contextWindow ?? 0) < request.requirements.minContextWindow) {
        return 'context window too small';
    }
    if (!escalationActive && candidate.locality === 'cloud' && request.profile !== 'quality' && request.profile !== 'release-critical') {
        return 'cloud candidate reserved until escalation or release-critical profile';
    }
    for (const capability of requiredCapabilities) {
        if (!candidate.capabilities.includes(capability)) {
            return `missing capability ${capability}`;
        }
    }
    return undefined;
}
function capabilitiesForIntent(intent, explicit) {
    const capabilities = new Set(explicit);
    if (intent === 'tool-use' || intent === 'code' || intent === 'debug' || intent === 'test') {
        capabilities.add('tools');
        capabilities.add('json');
    }
    if (intent === 'long-context' || intent === 'review' || intent === 'release') {
        capabilities.add('long-context');
    }
    if (intent === 'vision') {
        capabilities.add('vision');
    }
    return [...capabilities];
}
function localityPolicy(profile, requirements) {
    if (profile === 'local-only' || profile === 'air-gapped') {
        return ['local'];
    }
    if (requirements?.allowedLocalities?.length) {
        return requirements.allowedLocalities;
    }
    if (requirements?.privacyLocality?.length) {
        return requirements.privacyLocality;
    }
    return ['local', 'lan', 'cloud'];
}
function shouldEscalate(request) {
    const hint = request.escalation;
    if (!hint) {
        return false;
    }
    if ((request.attempts ?? 0) < hint.minAttemptsBeforeEscalation) {
        return false;
    }
    return (request.previousFailures ?? []).some((failure) => hint.failureTriggers.includes(failure));
}
function scoreCandidate(candidate, request, escalationActive) {
    let score = 0;
    score += (candidate.benchmarkScore ?? 0) * 5;
    score += (candidate.reputationScore ?? 0) * 3;
    score += Math.min(candidate.contextWindow ?? 0, 200000) / 10000;
    score -= (candidate.latencyMs ?? 0) / 1000;
    if (request.profile === 'cheap') {
        score -= candidate.costCents ?? 0;
        if (candidate.locality === 'local')
            score += 10;
    }
    if (request.profile === 'balanced') {
        score -= (candidate.costCents ?? 0) * 0.5;
        if (candidate.locality !== 'cloud')
            score += 5;
    }
    if (request.profile === 'quality' || request.profile === 'release-critical') {
        score += (candidate.benchmarkScore ?? 0) * 10;
        if (candidate.locality === 'cloud' && escalationActive)
            score += 10;
    }
    return score;
}
function selectionReason(candidate, request, escalationActive, fallback) {
    const parts = [
        `Selected ${candidate.providerId}:${candidate.model} for ${request.intent}.`,
        `profile=${request.profile}`,
        `locality=${candidate.locality}`,
    ];
    if (escalationActive) {
        parts.push('escalation trigger matched previous failures');
    }
    if (fallback) {
        parts.push('fallback used because no candidate satisfied all requested capabilities');
    }
    return parts.join('; ');
}
//# sourceMappingURL=intentRouter.js.map