import { toolResult, toolError } from '../protocol.js';

function build({ kg } = {}) {
  return [
    {
      name: 'kgdream_run',
      description: 'Run a KG consolidation cycle (light/deep/rem/focused).',
      inputSchema: {
        type: 'object',
        properties: { mode: { type: 'string', enum: ['light', 'deep', 'rem', 'focused'] }, dryRun: { type: 'boolean' } },
        additionalProperties: false
      },
      handler: async ({ mode = 'light', dryRun = true } = {}) => {
        if (!kg) return toolError('kg unavailable (kgdream needs a store)');
        try {
          const { Dreamer, Policy } = require('../../kgdream');
          const dreamer = new Dreamer({ store: kg.store, policy: new Policy({ dryRun }) });
          const r = await dreamer.runCycle({ mode, reason: 'mcp' });
          return toolResult([{ type: 'text', text: JSON.stringify(r, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
