
export let WORKFLOW_PLAYBOOK_SCHEMA = exports.SCAFFOLD_SCORE_SCHEMA = exports.PROMPT_HARNESS_SCHEMA = exports.SCAFFOLD_SCHEMA = void 0;

export let SCAFFOLD_SCHEMA = 'autoclaw.scaffold.v1';
export let PROMPT_HARNESS_SCHEMA = 'autoclaw.promptHarness.v1';
export let SCAFFOLD_SCORE_SCHEMA = 'autoclaw.scaffoldScore.v1';
WORKFLOW_PLAYBOOK_SCHEMA = exports.SCAFFOLD_SCHEMA;
function parseScaffoldVariant(input) {
    const value = parseRecord(input, 'Scaffold variant');
    requireSchema(value, exports.SCAFFOLD_SCHEMA, 'Scaffold variant');
    requireString(value, 'id', 'Scaffold variant');
    requireString(value, 'workflowId', 'Scaffold variant');
    requireString(value, 'taskIntent', 'Scaffold variant');
    requireString(value, 'routerProfile', 'Scaffold variant');
    requireStringArray(value, 'toolLaneIds', 'Scaffold variant');
    requireString(value, 'createdAt', 'Scaffold variant');
    return value;
}
function parseWorkflowPlaybook(input) {
    return parseScaffoldVariant(input);
}
function parsePromptHarnessContract(input) {
    const value = parseRecord(input, 'Prompt harness contract');
    requireSchema(value, exports.PROMPT_HARNESS_SCHEMA, 'Prompt harness contract');
    requireString(value, 'id', 'Prompt harness contract');
    requireString(value, 'roleFormat', 'Prompt harness contract');
    requireString(value, 'toolCallFormat', 'Prompt harness contract');
    requireString(value, 'toolResponseFormat', 'Prompt harness contract');
    requireString(value, 'reasoningFormat', 'Prompt harness contract');
    if (typeof value.supportsVisionInSystem !== 'boolean') {
        throw new Error('Prompt harness contract supportsVisionInSystem must be a boolean');
    }
    return value;
}
function parseScaffoldScore(input) {
    const value = parseRecord(input, 'Scaffold score');
    requireSchema(value, exports.SCAFFOLD_SCORE_SCHEMA, 'Scaffold score');
    requireString(value, 'scaffoldId', 'Scaffold score');
    requireString(value, 'runId', 'Scaffold score');
    requireString(value, 'workflowId', 'Scaffold score');
    requireString(value, 'taskIntent', 'Scaffold score');
    requireString(value, 'createdAt', 'Scaffold score');
    requireBoolean(value, 'pass', 'Scaffold score');
    requireBoolean(value, 'verifierPass', 'Scaffold score');
    requireBoolean(value, 'judgeVeto', 'Scaffold score');
    requireBoolean(value, 'scopeViolation', 'Scaffold score');
    requireNumber(value, 'reward', 'Scaffold score');
    requireNumber(value, 'costCents', 'Scaffold score');
    requireNumber(value, 'durationMs', 'Scaffold score');
    requireNumber(value, 'retryCount', 'Scaffold score');
    requireNumber(value, 'reworkCount', 'Scaffold score');
    return value;
}
function parseRecord(input, label) {
    const value = typeof input === 'string' ? JSON.parse(input) : input;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
    return value;
}
function requireSchema(value, schema, label) {
    if (value.schema !== schema) {
        throw new Error(`${label} schema must be ${schema}`);
    }
}
function requireString(value, key, label) {
    if (typeof value[key] !== 'string' || value[key] === '') {
        throw new Error(`${label} ${key} must be a non-empty string`);
    }
}
function requireStringArray(value, key, label) {
    if (!Array.isArray(value[key]) || !value[key].every((item) => typeof item === 'string')) {
        throw new Error(`${label} ${key} must be a string array`);
    }
}
function requireBoolean(value, key, label) {
    if (typeof value[key] !== 'boolean') {
        throw new Error(`${label} ${key} must be a boolean`);
    }
}
function requireNumber(value, key, label) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key])) {
        throw new Error(`${label} ${key} must be a finite number`);
    }
}
//# sourceMappingURL=types.js.map

export { parseScaffoldVariant as parseScaffoldVariant, parseWorkflowPlaybook as parseWorkflowPlaybook, parsePromptHarnessContract as parsePromptHarnessContract, parseScaffoldScore as parseScaffoldScore };
