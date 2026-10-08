
parseWorkflow = exports.WORKFLOW_RUN_EVENT_SCHEMA = exports.WORKFLOW_SCHEMA = void 0;

export let WORKFLOW_SCHEMA = 'autoclaw.workflow.v1';
export let WORKFLOW_RUN_EVENT_SCHEMA = 'autoclaw.workflowRunEvent.v1';
const parseWorkflow = (input) => parseWorkflowDefinition(input);

function parseWorkflowDefinition(input) {
    const value = typeof input === 'string' ? JSON.parse(input) : input;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Workflow definition must be an object');
    }
    return value;
}
function parseWorkflowRunEvent(input) {
    const value = typeof input === 'string' ? JSON.parse(input) : input;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Workflow run event must be an object');
    }
    return value;
}
function stringifyWorkflowDefinition(workflow) {
    return JSON.stringify(workflow, null, 2);
}
//# sourceMappingURL=types.js.map

export { parseWorkflowDefinition as parseWorkflowDefinition, parseWorkflowRunEvent as parseWorkflowRunEvent, stringifyWorkflowDefinition as stringifyWorkflowDefinition, parseWorkflow as parseWorkflow };
