import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SESSION_SECRET ??= 'test-session-secret-do-not-use-in-prod-1234567890';

const creds = await import('../../backend/src/lib/security/credentials.ts');
const types = await import('../../backend/src/lib/providers/types.ts');

test('encryption roundtrips arbitrary plaintext', () => {
  const secret = 'sk-test-1234567890abcdef-EXAMPLE';
  const ciphertext = creds.encrypt(secret);
  assert.match(ciphertext, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/, 'AES-256-GCM ciphertext must include iv:tag:body');
  assert.equal(creds.decrypt(ciphertext), secret);
});

test('encryption uses a fresh IV per call (no IV reuse)', () => {
  const a = creds.encrypt('same-plaintext');
  const b = creds.encrypt('same-plaintext');
  assert.notEqual(a, b, 'two encryptions of the same input must differ (random IV)');
});

test('tampered ciphertext fails GCM authentication tag check', () => {
  const ciphertext = creds.encrypt('hello');
  const [iv, tag, body] = ciphertext.split(':');
  const flipped = `${iv}:${tag}:${body.replace(/.$/, (c) => (c === '0' ? '1' : '0'))}`;
  assert.throws(() => creds.decrypt(flipped));
});

test('hashKeyRef is deterministic and 16 hex chars', () => {
  const a = creds.hashKeyRef('lm_abc');
  const b = creds.hashKeyRef('lm_abc');
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{16}$/);
});

test('redactKey masks middle of API keys', () => {
  assert.equal(creds.redactKey('sk-1234567890abcdef'), 'sk-1...cdef');
  assert.equal(creds.redactKey(''), '***');
  assert.equal(creds.redactKey('short'), '***');
});

test('sanitizeError redacts leaked API keys in error messages', () => {
  const dirty = new Error('Authorization failed: Bearer sk-1234567890abcdef and sk-otherkeyXXXXXXXXXXXXXXXXXX');
  const clean = creds.sanitizeError(dirty);
  assert.match(clean, /Bearer \[REDACTED\]/);
  assert.doesNotMatch(clean, /sk-1234567890abcdef/);
});

test('sanitizeError redacts common credential patterns', () => {
  const e = new Error('Failure: apiKey: "AIzaSyA1234567890ABCDEFGHIJKLMNOPQRSTUV"');
  const cleaned = creds.sanitizeError(e);
  assert.match(cleaned, /REDACTED/);
  assert.doesNotMatch(cleaned, /AIzaSyA1234567890/);
});

test('isBlockedUrl blocks metadata endpoints and accepts public hosts', () => {
  assert.equal(types.isBlockedUrl('https://169.254.169.254/latest/meta-data/'), true);
  assert.equal(types.isBlockedUrl('https://metadata.google.internal/computeMetadata/v1/'), true);
  assert.equal(types.isBlockedUrl('https://api.openai.com/v1/models'), false);
  assert.equal(types.isBlockedUrl('not a url'), true);
});

test('generateKeyRef returns a unique opaque reference', () => {
  const refs = new Set();
  for (let i = 0; i < 10; i += 1) refs.add(creds.generateKeyRef());
  assert.equal(refs.size, 10, 'keyRefs must be unique');
  assert.match([...refs][0], /^lm_[0-9a-f]+$/);
});

// SSE wire-format parser — exercised because the BYOK playground depends on it
// to surface streamed provider output. Mirrors the parser inside the Next.js page.
function parseSseBlock(block) {
  let event = 'message';
  const dataLines = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  const payload = dataLines.join('\n');
  if (!payload) return null;
  try { return { event, data: JSON.parse(payload) }; } catch { return null; }
}

test('parseSseBlock handles text / done / error events and ignores malformed blocks', () => {
  assert.deepEqual(parseSseBlock('event: text\ndata: {"delta":"hi"}'), { event: 'text', data: { delta: 'hi' } });
  assert.deepEqual(parseSseBlock('event: done\ndata: {"model":"x","latencyMs":42}'), { event: 'done', data: { model: 'x', latencyMs: 42 } });
  assert.deepEqual(parseSseBlock('event: error\ndata: {"error":"oops"}'), { event: 'error', data: { error: 'oops' } });
  assert.equal(parseSseBlock('not an event'), null);
  assert.equal(parseSseBlock('data: {not-json'), null);
});