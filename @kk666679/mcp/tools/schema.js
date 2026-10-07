const MCP_TOOL_NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function fromSkillId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}
function isValidName(name) {
  return typeof name === 'string' && MCP_TOOL_NAME_RE.test(name);
}

/** Minimal string/number/array/object inference from parameter names. */
const ARRAY_HINT  = /\[\]$/;
const OBJECT_HINTS = new Set(['context', 'payload', 'filters', 'opts', 'meta', 'vars', 'args', 'input', 'task', 'item', 'roles']);
const NUMBER_HINTS = new Set(['k', 'maxTokens', 'hops', 'limit', 'maxWords', 'ratio', 'budget', 'maxParallel']);
const REQUIRED_SCALARS = new Set([
  'query', 'q', 'text', 'proposal', 'analysis', 'conclusion',
  'issues', 'rules', 'items', 'docs', 'cases', 'hits',
  'id', 'uri', 'name', 'kind', 'workflow', 'mode', 'type', 'objective', 'sprint'
]);

function schemaForName(name) {
  if (ARRAY_HINT.test(name))    return { type: 'array', items: { type: 'object', additionalProperties: true } };
  if (OBJECT_HINTS.has(name))   return { type: 'object', additionalProperties: true };
  if (NUMBER_HINTS.has(name))   return { type: 'number' };
  return { type: 'string' };
}

function inferInputSchema(inputs = []) {
  const properties = {};
  const required = [];
  for (const raw of inputs) {
    const isArray = ARRAY_HINT.test(raw);
    const name = isArray ? raw.slice(0, -2) : raw;
    properties[name] = schemaForName(raw);
    if (REQUIRED_SCALARS.has(name)) required.push(name);
  }
  return { type: 'object', properties, required, additionalProperties: true };
}

;

export { MCP_TOOL_NAME_RE, fromSkillId, isValidName, inferInputSchema, schemaForName };
