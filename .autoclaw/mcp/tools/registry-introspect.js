'use strict';
const { toolResult, toolError } = require('../protocol');

function build({ registry } = {}) {
  return [
    {
      name: 'registry_snapshot',
      description: 'Return counts + full catalog of agents, models, and skills.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => registry
        ? toolResult([{ type: 'text', text: JSON.stringify(registry.snapshot(), null, 2) }])
        : toolError('registry unavailable')
    },
    {
      name: 'registry_integrity',
      description: 'Cross-reference integrity check (agent.model, agent.skills).',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!registry || typeof registry.integrity !== 'function') return toolError('registry unavailable');
        const problems = registry.integrity();
        return toolResult([{ type: 'text', text: JSON.stringify({ ok: problems.length === 0, problems }, null, 2) }],
          { isError: problems.length > 0 });
      }
    }
  ];
}
module.exports = { build };
