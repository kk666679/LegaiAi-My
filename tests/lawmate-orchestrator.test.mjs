import { TaskQueue, SprintBoard } from '@lawmate/orchestrator';
import assert from 'node:assert';

const queue = new TaskQueue();

const task = queue.enqueue({
  kind: 'research',
  payload: { query: 'Malaysian contract law' },
  priority: 1,
});
assert.ok(task.id.startsWith('t_'));
assert.strictEqual(task.status, 'queued');

const claimed = queue.claim('worker-1', 'research');
assert.ok(claimed);
assert.strictEqual(claimed.status, 'running');
assert.strictEqual(claimed.assignedTo, 'worker-1');

queue.complete(task.id, { findings: 'found' });
assert.strictEqual(queue.get(task.id)?.status, 'completed');

const board = new SprintBoard();
const columns = board.render(queue.list());
assert.ok(columns.some((c) => c.column === 'Completed'));

console.log('PASS: orchestrator');