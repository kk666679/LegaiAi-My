import { toolResult, toolError } from '../protocol.js';

import * as sk from '../../skills/index.js';

function build() {
  let sk;

  const available = sk && typeof sk.listSkills === 'function';
  const guard = () => available ? null : toolError('skills module unavailable');

  return [
    {
      name: 'skills_list',
      description: 'List every skill folder with golden/eval/reference markers.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        const g = guard(); if (g) return g;
        const c = sk.counts();
        return toolResult([{ type: 'text', text: JSON.stringify({ count: Object.keys(c).length, skills: c }, null, 2) }]);
      }
    },
    {
      name: 'skills_show',
      description: 'Show one skill: meta, eval config, golden case ids.',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
      handler: async ({ name } = {}) => {
        const g = guard(); if (g) return g;
        try {
          const s = sk.loadSkill(name);
          return toolResult([{ type: 'text', text: JSON.stringify({
            name: s.name, meta: s.meta, eval: s.eval,
            golden: s.golden.map(x => ({ id: x.id, expect: x.expect })),
            hasReference: !!s.reference
          }, null, 2) }]);
        } catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'skills_validate',
      description: 'Validate every skill envelope (id, inputs, outputs, golden, eval, reference).',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        const g = guard(); if (g) return g;
        const r = sk.validate();
        return toolResult([{ type: 'text', text: JSON.stringify(r, null, 2) }], { isError: !r.ok });
      }
    },
    {
      name: 'skills_golden',
      description: 'Return golden cases for one skill.',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
      handler: async ({ name } = {}) => {
        const g = guard(); if (g) return g;
        try { const s = sk.loadSkill(name); return toolResult([{ type: 'text', text: JSON.stringify(s.golden, null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
