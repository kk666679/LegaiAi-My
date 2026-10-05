"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_FAILURE_TYPES = void 0;
exports.normalizeFailureType = normalizeFailureType;
exports.isKnownFailureType = isKnownFailureType;
exports.isRetryableFailure = isRetryableFailure;
exports.isEscalationCandidate = isEscalationCandidate;
exports.isHumanRequired = isHumanRequired;
exports.failureTypeFromGateResult = failureTypeFromGateResult;
exports.failureTypeFromToolError = failureTypeFromToolError;
exports.WORKFLOW_FAILURE_TYPES = [
    'context_missing',
    'context_noisy',
    'query_too_broad',
    'task_needs_decomposition',
    'artifact_invalid',
    'scope_conflict',
    'tool_format_invalid',
    'tool_action_illegal',
    'compile_error',
    'test_failure',
    'mutation_survived',
    'acceptance_failure',
    'perf_regression',
    'coordination_stale_claim',
    'coordination_dead_session',
    'budget_exhausted',
    'irreducible_or_needs_human',
];
const KNOWN = new Set(exports.WORKFLOW_FAILURE_TYPES);
const RETRYABLE_FAILURES = new Set([
    'context_missing',
    'context_noisy',
    'query_too_broad',
    'task_needs_decomposition',
    'tool_format_invalid',
    'compile_error',
    'test_failure',
    'mutation_survived',
    'acceptance_failure',
    'perf_regression',
    'coordination_stale_claim',
]);
const ESCALATION_CANDIDATES = new Set([
    'context_missing',
    'context_noisy',
    'task_needs_decomposition',
    'tool_format_invalid',
    'tool_action_illegal',
    'compile_error',
    'test_failure',
    'acceptance_failure',
    'perf_regression',
    'budget_exhausted',
]);
const HUMAN_REQUIRED_FAILURES = new Set([
    'scope_conflict',
    'coordination_dead_session',
    'budget_exhausted',
    'irreducible_or_needs_human',
]);
function normalizeFailureType(value) {
    if (value && KNOWN.has(value)) {
        return { type: value };
    }
    return value ? { type: 'unknown_external', original: value } : { type: 'unknown_external' };
}
function isKnownFailureType(value) {
    return typeof value === 'string' && KNOWN.has(value);
}
function isRetryableFailure(type) {
    return type !== 'unknown_external' && RETRYABLE_FAILURES.has(type);
}
function isEscalationCandidate(type) {
    return type === 'unknown_external' || ESCALATION_CANDIDATES.has(type);
}
function isHumanRequired(type) {
    return type !== 'unknown_external' && HUMAN_REQUIRED_FAILURES.has(type);
}
function failureTypeFromGateResult(result) {
    if (result.failureType) {
        return normalizeFailureType(result.failureType);
    }
    const haystack = [
        result.kind,
        result.type,
        result.name,
        result.check,
        result.reason,
        result.message,
    ].filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes('compile') || haystack.includes('typescript') || haystack.includes('tsc')) {
        return { type: 'compile_error' };
    }
    if (haystack.includes('test') || haystack.includes('spec') || haystack.includes('mocha')) {
        return { type: 'test_failure' };
    }
    if (haystack.includes('schema') || haystack.includes('json') || haystack.includes('format')) {
        return { type: 'tool_format_invalid' };
    }
    if (haystack.includes('budget') || haystack.includes('cost') || haystack.includes('timeout') || haystack.includes('time')) {
        return { type: 'budget_exhausted' };
    }
    if (haystack.includes('scope') || haystack.includes('lease') || haystack.includes('permission')) {
        return { type: 'scope_conflict' };
    }
    if (haystack.includes('context') || haystack.includes('retrieval') || haystack.includes('rag')) {
        return { type: 'context_missing' };
    }
    if (haystack.includes('mutation') || haystack.includes('mutant')) {
        return { type: 'mutation_survived' };
    }
    if (haystack.includes('acceptance') || haystack.includes('review')) {
        return { type: 'acceptance_failure' };
    }
    return { type: 'unknown_external', original: result.reason ?? result.message ?? result.kind ?? result.type };
}
function failureTypeFromToolError(error) {
    const haystack = [
        error.code,
        error.kind,
        error.name,
        error.message,
        error.stderr,
    ].filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes('json') || haystack.includes('schema') || haystack.includes('parse') || haystack.includes('format')) {
        return { type: 'tool_format_invalid' };
    }
    if (haystack.includes('illegal') || haystack.includes('not allowed') || haystack.includes('denied')) {
        return { type: 'tool_action_illegal' };
    }
    if (haystack.includes('compile') || haystack.includes('typescript') || haystack.includes('tsc')) {
        return { type: 'compile_error' };
    }
    if (haystack.includes('test') || haystack.includes('assert') || haystack.includes('mocha')) {
        return { type: 'test_failure' };
    }
    if (haystack.includes('scope') || haystack.includes('lease')) {
        return { type: 'scope_conflict' };
    }
    if (haystack.includes('budget') || haystack.includes('timeout') || haystack.includes('timedout') || haystack.includes('cost')) {
        return { type: 'budget_exhausted' };
    }
    if (haystack.includes('context') || haystack.includes('not found') || haystack.includes('missing')) {
        return { type: 'context_missing' };
    }
    return {
        type: 'unknown_external',
        original: error.code ?? error.kind ?? error.message ?? String(error.exitCode ?? 'unknown'),
    };
}
//# sourceMappingURL=failureTypes.js.map