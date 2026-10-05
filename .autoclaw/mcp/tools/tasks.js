'use strict';
const { toolResult, toolError } = require('../protocol');

function build({ tasks } = {}) {
  return [
    {
      name: 'task_enqueue',
      description: 'Enqueue a long-running task (lom.ingest, corpus.reindex, eval.run).',
      inputSchema: {
        type: 'object',
        properties: { kind: { type: 'string' }, payload: { type: 'object', additionalProperties: true } },
        required: ['kind'], additionalProperties: true
      },
      handler: async ({ kind, payload = {} } = {}) => {
        if (!tasks) return toolError('tasks unavailable');
        try { return toolResult([{ type: 'text', text: JSON.stringify(tasks.enqueue(kind, payload), null, 2) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'task_get',
      description: 'Fetch a task by id.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
      handler: async ({ id } = {}) => {
        if (!tasks) return toolError('tasks unavailable');
        const j = tasks.get(id);
        return j ? toolResult([{ type: 'text', text: JSON.stringify(j, null, 2) }]) : toolError(`not found: ${id}`);
      }
    },
    {
      name: 'task_list',
      description: 'List running/queued/completed tasks.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => {
        if (!tasks) return toolError('tasks unavailable');
        const s = tasks.list();
        return toolResult([{ type: 'text', text: JSON.stringify({ counts: { running: s.running.length, queued: s.queued.length, completed: s.completed.length }, ...s }, null, 2) }]);
      }
    }
  ];
}
module.exports = { build };
