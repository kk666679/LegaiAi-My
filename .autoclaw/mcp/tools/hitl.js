'use strict';
const { toolResult, toolError } = require('../protocol');

function build({ hitl } = {}) {
  return [
    {
      name: 'hitl_queue_list',
      description: 'List review items (pending, claimed, resolved).',
      inputSchema: { type: 'object', properties: { status: { type: 'string' } }, additionalProperties: false },
      handler: async ({ status } = {}) => {
        if (!hitl) return toolError('hitl unavailable');
        return toolResult([{ type: 'text', text: JSON.stringify(hitl.queue.list(status ? { status } : {}), null, 2) }]);
      }
    },
    {
      name: 'hitl_queue_stats',
      description: 'Queue statistics (by status, active count).',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => hitl
        ? toolResult([{ type: 'text', text: JSON.stringify(hitl.queue.stats(), null, 2) }])
        : toolError('hitl unavailable')
    },
    {
      name: 'hitl_resolve',
      description: 'Resolve a review item with a decision.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          decision: { type: 'string', enum: ['approved', 'rejected', 'modified', 'deferred'] },
          by: { type: 'string' },
          rationale: { type: 'string' }
        },
        required: ['id', 'decision'], additionalProperties: false
      },
      handler: async ({ id, decision, by = 'mcp', rationale = '' } = {}) => {
        if (!hitl) return toolError('hitl unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(hitl.queue.resolve(id, { decision, by, rationale }), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'hitl_policy_evaluate',
      description: 'Preview what the HITL policy would decide for a proposal.',
      inputSchema: {
        type: 'object',
        properties: { proposal: { type: 'object', additionalProperties: true }, confidence: { type: 'number' }, outcome: { type: 'string' } },
        additionalProperties: true
      },
      handler: async (args = {}) => {
        if (!hitl) return toolError('hitl unavailable');
        const v = hitl.policy.evaluate(args);
        return toolResult([{ type: 'text', text: JSON.stringify(v, null, 2) }]);
      }
    }
  ];
}
module.exports = { build };
