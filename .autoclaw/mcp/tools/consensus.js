import { toolResult, toolError } from '../protocol.js';

function build({ consensus } = {}) {
  return [
    {
      name: 'consensus_vote',
      description: 'Run a multi-agent vote on a proposal.',
      inputSchema: {
        type: 'object',
        properties: {
          proposal: { type: 'object', additionalProperties: true },
          voters: { type: 'array', items: { type: 'string' } },
          payload: { type: 'object', additionalProperties: true }
        },
        required: ['proposal'], additionalProperties: true
      },
      handler: async ({ proposal, voters, payload = {} } = {}) => {
        if (!consensus) return toolError('consensus unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(await consensus.vote({ proposal, voters, payload }), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'consensus_strategies',
      description: 'List available consensus strategies.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        try { const { listStrategies } = require('../../consensus'); return toolResult([{ type: 'text', text: JSON.stringify({ strategies: listStrategies() }, null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
