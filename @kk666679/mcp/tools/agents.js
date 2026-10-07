import { createRequire } from 'node:module';
import { toolResult, toolError } from '../protocol.js';

const require = createRequire(import.meta.url);

function build({ agents } = {}) {
  return [
    {
      name: 'agents_list',
      description: 'List all registered agents with role, model, and skill chain.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!agents) return toolError('agents runtime unavailable');
        const ids = agents.list();
        const out = ids.map(id => {
          const a = agents.get(id);
          return { id, role: a.role, model: a.model, skills: a.skills };
        });
        return toolResult([{ type: 'text', text: JSON.stringify(out, null, 2) }]);
      }
    },
    {
      name: 'agents_show',
      description: 'Show one agent — meta + chain + current state.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
      handler: async ({ id } = {}) => {
        if (!agents) return toolError('agents runtime unavailable');
        try {
          const a = agents.get(id);
          return toolResult([{ type: 'text', text: JSON.stringify({ meta: a.meta, chain: { skills: a.skills, escalate: a.chain.escalate }, state: a.state }, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'agents_invoke',
      description: 'Invoke an agent with an input payload.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' }, input: { type: 'object', additionalProperties: true } },
        required: ['id'], additionalProperties: true
      },
      handler: async ({ id, input = {} } = {}) => {
        if (!agents) return toolError('agents runtime unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(await agents.invoke(id, input), null, 2) }]); }
        catch (e) { return toolError(`agent error: ${e.message}`); }
      }
    },
    {
      name: 'agents_route',
      description: 'Route a task to the most appropriate agent (no invocation).',
      inputSchema: { type: 'object', properties: { task: { type: 'object', additionalProperties: true } }, required: ['task'], additionalProperties: true },
      handler: async ({ task } = {}) => {
        try { const { route } = require('../../agents'); return toolResult([{ type: 'text', text: JSON.stringify(route(task), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
