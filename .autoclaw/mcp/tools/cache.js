'use strict';
const { toolResult, toolError } = require('../protocol');

function build({ cache } = {}) {
  return [
    {
      name: 'cache_stats',
      description: 'LRU statistics for response + embedding tiers.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => cache ? toolResult([{ type: 'text', text: JSON.stringify(cache.stats(), null, 2) }]) : toolError('cache unavailable')
    },
    {
      name: 'cache_clear',
      description: 'Clear both cache tiers.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!cache || typeof cache.clear !== 'function') return toolError('cache.clear unavailable');
        cache.clear();
        return toolResult([{ type: 'text', text: JSON.stringify({ ok: true }) }]);
      }
    }
  ];
}
module.exports = { build };
