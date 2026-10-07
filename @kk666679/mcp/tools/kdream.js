import { toolResult, toolError } from '../protocol.js';
import path from 'path';

import * as kdream from '../../kdream/index.js';

function build() {
  let kdream;

  return [
    {
      name: 'kdream_run',
      description: 'Run the memory consolidation cycle (light/deep/full).',
      inputSchema: {
        type: 'object',
        properties: { mode: { type: 'string', enum: ['light', 'deep', 'full'] }, dryRun: { type: 'boolean' } },
        additionalProperties: false
      },
      handler: async ({ mode = 'light', dryRun = false } = {}) => {
        if (!kdream) return toolError('kdream unavailable');
        try {
          const d = kdream.createDreamer({ policy: { dryRun } });
          const r = await d.runCycle({ mode, reason: 'mcp' });
          return toolResult([{ type: 'text', text: JSON.stringify(r, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'kdream_read_memory',
      description: 'Return the current MEMORY.md contents.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!kdream) return toolError('kdream unavailable');
        const d = kdream.createDreamer();
        const content = d.readMemory();
        return content ? toolResult([{ type: 'text', text: content }]) : toolError('MEMORY.md not found');
      }
    },
    {
      name: 'kdream_list_insights',
      description: 'List all learnings/insight-*.md records.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!kdream) return toolError('kdream unavailable');
        try {
          const path = path;
          const dir = path.resolve(import.meta.dirname, '..', '..', 'learnings');
          const list = kdream.listInsights(dir).map(i => ({ file: i.file, title: i.title, front: i.front }));
          return toolResult([{ type: 'text', text: JSON.stringify(list, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
