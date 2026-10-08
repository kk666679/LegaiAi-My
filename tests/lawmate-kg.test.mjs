import { KnowledgeGraph } from '@lawmate/kg';
import assert from 'node:assert';

const kg = new KnowledgeGraph();

const entity1 = kg.addNode({ id: 'e1', type: 'case', label: 'Case A' });
const entity2 = kg.addNode({ id: 'e2', type: 'case', label: 'Case B' });
const edge = kg.addEdge({ from: 'e1', to: 'e2', relation: 'cites' });

assert.strictEqual(entity1.label, 'Case A');
assert.strictEqual(edge.relation, 'cites');

const neighbors = kg.neighbors('e1');
assert.strictEqual(neighbors.length, 1);
assert.strictEqual(neighbors[0]?.node.label, 'Case B');

assert.strictEqual(kg.getNode('e2')?.label, 'Case B');

assert.strictEqual(kg.removeNode('e1'), true);
assert.strictEqual(kg.getNode('e1'), undefined);

console.log('PASS: kg');