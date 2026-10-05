'use strict';
const { toolResult, toolError } = require('../protocol');

function build() {
  return [
    {
      name: 'export_format',
      description: 'Format a pipeline result as irac / memo / html / json / citations.',
      inputSchema: {
        type: 'object',
        properties: {
          result: { type: 'object', additionalProperties: true },
          kind: { type: 'string', enum: ['irac', 'memo', 'html', 'json', 'citations'] },
          opts: { type: 'object', additionalProperties: true }
        },
        required: ['result'], additionalProperties: true
      },
      handler: async ({ result, kind = 'irac', opts = {} } = {}) => {
        try {
          const { format } = require('../../export');
          const text = format(result, kind, opts);
          return toolResult([{ type: 'text', text: typeof text === 'string' ? text : JSON.stringify(text, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'export_render_all',
      description: 'Render a result in every registered format.',
      inputSchema: {
        type: 'object',
        properties: { result: { type: 'object', additionalProperties: true }, opts: { type: 'object', additionalProperties: true } },
        required: ['result'], additionalProperties: true
      },
      handler: async ({ result, opts = {} } = {}) => {
        try {
          const { renderAll } = require('../../export');
          const all = renderAll(result, opts);
          const summary = {};
          for (const [name, { mime, text }] of Object.entries(all)) summary[name] = { mime, bytes: text.length };
          return toolResult([{ type: 'text', text: JSON.stringify(summary, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    }
  ];
}
module.exports = { build };
