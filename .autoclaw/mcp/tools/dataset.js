'use strict';
const { toolResult, toolError } = require('../protocol');

function build() {
  let ds;
  try { ds = require('../../dataset'); } catch (_) { ds = null; }

  return [
    {
      name: 'dataset_list',
      description: 'List every fixture group with record counts.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => ds ? toolResult([{ type: 'text', text: JSON.stringify(ds.counts(), null, 2) }]) : toolError('dataset unavailable')
    },
    {
      name: 'dataset_validate',
      description: 'Validate every fixture group.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!ds) return toolError('dataset unavailable');
        const r = ds.validate();
        return toolResult([{ type: 'text', text: JSON.stringify(r, null, 2) }], { isError: !r.ok });
      }
    },
    {
      name: 'dataset_show',
      description: 'Load a fixture group by name.',
      inputSchema: { type: 'object', properties: { group: { type: 'string' } }, required: ['group'], additionalProperties: false },
      handler: async ({ group } = {}) => {
        if (!ds) return toolError('dataset unavailable');
        const all = ds.loadAll();
        if (!all[group]) return toolError(`unknown group: ${group}`);
        return toolResult([{ type: 'text', text: JSON.stringify(all[group], null, 2) }]);
      }
    }
  ];
}
module.exports = { build };
