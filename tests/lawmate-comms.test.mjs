import { subscribe, publish, CommsEvents, topics } from '@lawmate/comms';
import assert from 'node:assert';

const received = [];
subscribe('test.topic', (msg) => {
  received.push(msg.payload);
});

await publish('test.topic', {
  id: 'msg-1',
  from: 'a',
  to: 'b',
  topic: 'test.topic',
  payload: { hello: 'world' },
  sentAt: new Date().toISOString(),
});

assert.strictEqual(received.length, 1);
assert.deepStrictEqual(received[0], { hello: 'world' });

assert.ok(Array.isArray(topics()));
assert.ok(CommsEvents.MessageSent);

console.log('PASS: comms');