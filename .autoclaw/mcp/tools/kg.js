'use strict';
const { toolResult, toolError } = require('../protocol');

function build({ kg } = {}) {
  return [
    {
      name: 'kg_get_node',
      description: 'Fetch one KG node by id.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
      handler: async ({ id } = {}) => {
        if (!kg) return toolError('kg unavailable');
        const n = await kg.getNode(id);
        return n ? toolResult([{ type: 'text', text: JSON.stringify(n, null, 2) }]) : toolError(`not found: ${id}`);
      }
    },
    {
      name: 'kg_search',
      description: 'Search the KG for nodes matching a query.',
      inputSchema: {
        type: 'object',
        properties: { q: { type: 'string' }, k: { type: 'number' }, type: { type: 'string' }, tag: { type: 'string' } },
        required: ['q'], additionalProperties: false
      },
      handler: async ({ q, k = 8, type, tag } = {}) => {
        if (!kg) return toolError('kg unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(await kg.search({ q, k, type, tag }), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'kg_traverse',
      description: 'Traverse the KG from a start node.',
      inputSchema: {
        type: 'object',
        properties: { start: { type: 'string' }, hops: { type: 'number' }, rels: { type: 'array', items: { type: 'string' } } },
        required: ['start'], additionalProperties: false
      },
      handler: async ({ start, hops = 2, rels = [] } = {}) => {
        if (!kg) return toolError('kg unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(await kg.traverse({ start, hops, rels }), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'kg_stats',
      description: 'Node/edge counts and per-type breakdown.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => kg ? toolResult([{ type: 'text', text: JSON.stringify(kg.stats(), null, 2) }]) : toolError('kg unavailable')
    },
    {
      name: 'kg_upsert',
      description: 'Insert or update a node (idempotent).',
      inputSchema: {
        type: 'object',
        properties: { node: { type: 'object', additionalProperties: true } },
        required: ['node'], additionalProperties: false
      },
      handler: async ({ node } = {}) => {
        if (!kg) return toolError('kg unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(await kg.upsert(node), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    }
  ];
}
module.exports = { build };
