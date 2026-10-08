import { EvidenceChain } from '@lawmate/evidence';
import assert from 'node:assert';

const chain = new EvidenceChain();

chain.append('claim-created', { statement: 'The contract is valid' });
chain.append('evidence-added', { source: 'doc-1', excerpt: 'Signed by both parties' });
chain.append('verified', { verified: true });

assert.strictEqual(chain.size(), 3);

const verification = chain.verify();
assert.strictEqual(verification.valid, true, 'chain should be valid');

// Tamper detection
const entries = chain.export();
const tamperedEntry = entries[1];
if (!tamperedEntry) throw new Error('expected entry');
tamperedEntry.payload = Object.assign({}, tamperedEntry.payload, { tampered: true });
const tampered = EvidenceChain.import(entries);
const result = tampered.verify();
assert.strictEqual(result.valid, false, 'tampered chain should be invalid');

console.log('PASS: evidence');
