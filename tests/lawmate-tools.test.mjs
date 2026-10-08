import { ToolRegistry } from '@lawmate/tools';
import assert from 'node:assert';

const registry = new ToolRegistry();

registry.register({
  id: 'tool://lawmate/calculator',
  name: 'Calculator',
  version: '1.0.0',
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  permissions: ['compute'],
  risk: 'low',
  timeoutMs: 5000,
  idempotent: true,
  handler: async (input) => ({ result: input.a + input.b }),
});

const tool = registry.get('tool://lawmate/calculator');
assert.ok(tool, 'tool should be registered');

const invocation = await registry.invoke('tool://lawmate/calculator', { a: 2, b: 3 });
assert.strictEqual(invocation.status, 'completed');
assert.deepStrictEqual(invocation.output, { result: 5 });

const history = registry.history({ toolId: 'tool://lawmate/calculator' });
assert.strictEqual(history.length, 1);

console.log('PASS: tools');
