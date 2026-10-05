"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkflowTestCase = runWorkflowTestCase;
exports.formatWorkflowTestFailures = formatWorkflowTestFailures;
const contracts_1 = require("./contracts");
const validate_1 = require("./validate");
function runWorkflowTestCase(testCase) {
    const validation = (0, validate_1.validateWorkflow)(testCase.workflow);
    const contract = (0, contracts_1.validateWorkflowContract)(testCase.workflow, testCase.contractContext ?? {});
    const diagnostics = [
        ...validation.diagnostics,
        ...contract.diagnostics,
    ];
    const policyDecisions = [...contract.policyDecisions];
    const route = [];
    const outputsByNode = {};
    const artifacts = [];
    let failureType;
    if (validation.valid && contract.valid) {
        for (const node of executionOrder(testCase.workflow)) {
            const mock = mockForNode(node, testCase.mocks);
            const result = mock ?? defaultNodeResult(node, testCase.inputs);
            if (result.status === 'skipped') {
                continue;
            }
            route.push(node.id);
            if (result.outputs) {
                outputsByNode[node.id] = result.outputs;
            }
            artifacts.push(...(result.artifacts ?? []));
            policyDecisions.push(...(result.policyDecisions ?? []));
            if (result.failureType) {
                failureType = result.failureType;
            }
            if (result.status === 'failed') {
                break;
            }
        }
    }
    const expectationResults = testCase.expect.map((expectation) => evaluateExpectation(expectation, {
        route,
        routingProfile: testCase.workflow.policies?.routingProfile,
        outputsByNode,
        artifacts,
        failureType,
        diagnostics,
        policyDecisions,
    }));
    return {
        id: testCase.id,
        workflowId: testCase.workflowId,
        passed: validation.valid && contract.valid && expectationResults.every((result) => result.passed),
        route,
        routingProfile: testCase.workflow.policies?.routingProfile,
        outputsByNode,
        artifacts,
        failureType,
        diagnostics,
        policyDecisions,
        expectations: expectationResults,
    };
}
function formatWorkflowTestFailures(result) {
    const failures = result.expectations.filter((expectation) => !expectation.passed);
    if (result.diagnostics.length === 0 && failures.length === 0) {
        return '';
    }
    const lines = [];
    for (const diagnostic of result.diagnostics) {
        if (diagnostic.severity === 'error') {
            lines.push(`diagnostic ${diagnostic.code} at ${diagnostic.path}: ${diagnostic.message}`);
        }
    }
    for (const failure of failures) {
        lines.push(`${failure.path}: ${failure.message}; expected ${JSON.stringify(failure.expected)}, got ${JSON.stringify(failure.actual)}`);
    }
    return lines.join('\n');
}
function executionOrder(workflow) {
    const nodes = new Map(workflow.nodes.map((node) => [node.id, node]));
    const indegree = new Map();
    const outgoing = new Map();
    for (const node of workflow.nodes) {
        indegree.set(node.id, 0);
        outgoing.set(node.id, []);
    }
    for (const edge of workflow.edges) {
        if (!nodes.has(edge.from.node) || !nodes.has(edge.to.node)) {
            continue;
        }
        outgoing.get(edge.from.node).push(edge.to.node);
        indegree.set(edge.to.node, (indegree.get(edge.to.node) ?? 0) + 1);
    }
    const ready = workflow.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
    const ordered = [];
    const seen = new Set();
    while (ready.length > 0) {
        const id = ready.shift();
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        ordered.push(nodes.get(id));
        for (const next of outgoing.get(id) ?? []) {
            const nextCount = (indegree.get(next) ?? 0) - 1;
            indegree.set(next, nextCount);
            if (nextCount <= 0) {
                ready.push(next);
            }
        }
    }
    for (const node of workflow.nodes) {
        if (!seen.has(node.id)) {
            ordered.push(node);
        }
    }
    return ordered;
}
function mockForNode(node, mocks) {
    return mocks?.nodes?.[node.id] ?? mocks?.tools?.[node.id] ?? mocks?.models?.[node.id];
}
function defaultNodeResult(node, inputs) {
    if (node.type === 'input') {
        return { outputs: { ...inputs } };
    }
    if (node.type === 'gate') {
        const passed = typeof node.config.mockPass === 'boolean' ? node.config.mockPass : true;
        return {
            status: passed ? 'completed' : 'failed',
            outputs: { passed, failureType: passed ? undefined : node.config.failureTypeOnFail },
            failureType: passed ? undefined : node.config.failureTypeOnFail,
        };
    }
    if (node.type === 'artifact') {
        const path = typeof node.config.path === 'string' ? node.config.path : `${node.id}.artifact.json`;
        return { outputs: { artifact: path }, artifacts: [path] };
    }
    return { outputs: {} };
}
function evaluateExpectation(expectation, state) {
    switch (expectation.type) {
        case 'status': {
            const actual = state.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'failed' : 'passed';
            return expectationResult(expectation, actual === expectation.status, expectation.status, actual, '$.status');
        }
        case 'route_includes':
            return expectationResult(expectation, state.route.includes(expectation.nodeId), expectation.nodeId, state.route, '$.route');
        case 'route_excludes':
            return expectationResult(expectation, !state.route.includes(expectation.nodeId), `not ${expectation.nodeId}`, state.route, '$.route');
        case 'routing_profile':
            return expectationResult(expectation, state.routingProfile === expectation.profile, expectation.profile, state.routingProfile, '$.routingProfile');
        case 'failure_type':
            return expectationResult(expectation, state.failureType === expectation.failureType, expectation.failureType, state.failureType, '$.failureType');
        case 'artifact':
            return expectationResult(expectation, state.artifacts.includes(expectation.path), expectation.path, state.artifacts, '$.artifacts');
        case 'policy_decision': {
            const actual = state.policyDecisions.find((decision) => decision.policyId === expectation.policyId);
            const pass = !!actual && (expectation.allowed === undefined || actual.allowed === expectation.allowed);
            return expectationResult(expectation, pass, { policyId: expectation.policyId, allowed: expectation.allowed }, actual, '$.policyDecisions');
        }
        case 'node_output': {
            const actual = state.outputsByNode[expectation.nodeId]?.[expectation.key];
            return expectationResult(expectation, Object.is(actual, expectation.equals), expectation.equals, actual, `$.outputsByNode.${expectation.nodeId}.${expectation.key}`);
        }
    }
}
function expectationResult(expectation, passed, expected, actual, path) {
    return {
        passed,
        expectation,
        message: passed ? 'Expectation passed.' : `Expectation ${expectation.type} failed.`,
        expected,
        actual,
        path,
    };
}
//# sourceMappingURL=tests.js.map