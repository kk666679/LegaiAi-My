import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET ??= 'test-session-secret-do-not-use-in-prod-1234567890';

const pw = await import('../../backend/src/lib/security/password.ts');
const throttle = await import('../../backend/src/lib/security/authThrottle.ts');
const secrets = await import('../../backend/src/lib/security/secrets.ts');

const PASSWORD = 'correct horse battery staple';

// Matches the pre-scrypt format that shipped before this hardening pass.
const legacyHash = (password, secret = process.env.SESSION_SECRET) => {
  const salt = 'a'.repeat(32);
  return `${salt}:${createHmac('sha256', secret).update(salt + password).digest('hex')}`;
};

test('hashPassword stores a self-describing scrypt string, not a bare MAC', async () => {
  const hash = await pw.hashPassword(PASSWORD);
  assert.match(hash, /^scrypt\$65536\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!hash.includes(':'), 'must not use the legacy salt:hmac layout');
  // And the legacy layout is genuinely a different, still-accepted shape.
  assert.match(legacyHash(PASSWORD), /^[0-9a-f]+:[0-9a-f]+$/);
});

test('hashes are salted: two hashes of one password differ', async () => {
  assert.notEqual(await pw.hashPassword(PASSWORD), await pw.hashPassword(PASSWORD));
});

test('verifyPassword accepts the correct password', async () => {
  assert.equal(await pw.verifyPassword(PASSWORD, await pw.hashPassword(PASSWORD)), true);
});

test('verifyPassword rejects a wrong password', async () => {
  assert.equal(await pw.verifyPassword('wrong password', await pw.hashPassword(PASSWORD)), false);
});

test('verifyPassword is case sensitive', async () => {
  const hash = await pw.hashPassword(PASSWORD);
  assert.equal(await pw.verifyPassword(PASSWORD.toUpperCase(), hash), false);
});

test('unicode passwords round-trip through NFKC normalisation', async () => {
  const password = 'pässwörd—①②③';
  const hash = await pw.hashPassword(password);
  assert.equal(await pw.verifyPassword(password, hash), true);
});

test('legacy salt:hmac hashes still authenticate so existing users are not locked out', async () => {
  assert.equal(await pw.verifyPassword(PASSWORD, legacyHash(PASSWORD)), true);
  assert.equal(await pw.verifyPassword('not it', legacyHash(PASSWORD)), false);
});

test('a legacy hash is flagged for upgrade and survives the rehash round-trip', async () => {
  assert.equal(pw.needsRehash(legacyHash(PASSWORD)), true);
  const upgraded = await pw.hashPassword(PASSWORD);
  assert.equal(pw.needsRehash(upgraded), false);
  assert.equal(await pw.verifyPassword(PASSWORD, upgraded), true);
});

test('a hash made under a different secret does not verify', async () => {
  assert.equal(await pw.verifyPassword(PASSWORD, legacyHash(PASSWORD, 'a-completely-different-secret')), false);
});

test('weaker scrypt parameters are flagged for upgrade', () => {
  assert.equal(pw.needsRehash(`scrypt$16384$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`), true);
});

test('stronger scrypt parameters are left alone', () => {
  assert.equal(pw.needsRehash(`scrypt$131072$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`), false);
});

test('a malformed stored hash fails closed instead of throwing', async () => {
  const malformed = [
    '',
    'deadbeef',
    `${'a'.repeat(32)}:`,
    'scrypt$65536$8$1$ab',
    `scrypt$abc$def$ghi$${'b'.repeat(32)}$${'c'.repeat(128)}`,
    `scrypt$-1$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`,
    `scrypt$1000$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`,
    `scrypt$262144$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`,
    `scrypt$1048576$32$16$${'b'.repeat(32)}$${'c'.repeat(128)}`,
    `scrypt$65536$8$1$ab$${'c'.repeat(128)}`,
    `scrypt$65536$8$1$${'b'.repeat(32)}$aabb`,
    'not-a-hash-at-all',
  ];
  for (const value of malformed) {
    assert.equal(await pw.verifyPassword(PASSWORD, value), false, `verify must be false for ${JSON.stringify(value)}`);
    assert.equal(pw.needsRehash(value), true, `needsRehash must be true for ${JSON.stringify(value)}`);
  }
});

test('a missing hash burns a derivation so unknown-email and wrong-password cost the same', async () => {
  assert.equal(await pw.verifyPassword(PASSWORD, null), false);
  assert.equal(await pw.verifyPassword(PASSWORD, undefined), false);
  assert.equal(pw.needsRehash(null), true);
  assert.equal(pw.needsRehash(undefined), true);
});

test('scrypt cost is high enough to matter', async () => {
  const started = Date.now();
  await pw.verifyPassword(PASSWORD, await pw.hashPassword(PASSWORD));
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 5000, `verification took ${elapsed}ms`);
});

test('the login account bucket locks out on the 5th failure, not before', () => {
  const key = throttle.loginAccountKey('Someone@Example.com');
  for (let i = 0; i < 4; i++) throttle.recordThrottleFailure(key, throttle.LOGIN_POLICY);
  assert.equal(throttle.isThrottled(key, throttle.LOGIN_POLICY), false, 'must not lock before the 5th failure');
  throttle.recordThrottleFailure(key, throttle.LOGIN_POLICY);
  assert.equal(throttle.isThrottled(key, throttle.LOGIN_POLICY), true, 'must lock on the 5th failure');
  assert.ok(throttle.throttleRetryAfterMs(key, throttle.LOGIN_POLICY) > 0);
  throttle.clearThrottleFailures([key]);
  assert.equal(throttle.isThrottled(key, throttle.LOGIN_POLICY), false);
});

test('the account bucket is address-independent, so rotating source IPs cannot buy fresh attempts', () => {
  // This is the property the old `ip|email` key lacked.
  const fromA = throttle.loginAccountKey('victim@example.com');
  const fromB = throttle.loginAccountKey(' VICTIM@Example.com ');
  assert.equal(fromA, fromB, 'account key must not vary with the caller address');
  assert.notEqual(
    throttle.loginAddressKey('10.0.0.1', 'victim@example.com'),
    throttle.loginAddressKey('10.0.0.2', 'victim@example.com'),
    'the address bucket must still vary by IP',
  );
});

test('onboarding procedures use separate buckets so one cannot lock out the others', () => {
  const keys = [
    throttle.signupKey('10.0.0.5'),
    throttle.registerKey('10.0.0.5'),
    throttle.orgKey('10.0.0.5', 'acme-law'),
  ];
  assert.equal(new Set(keys).size, keys.length, 'each procedure needs a distinct key');

  // Exhaust signup only; register and createOrg must be unaffected.
  for (let i = 0; i < throttle.SIGNUP_POLICY.limit; i++) {
    throttle.recordThrottleFailure(throttle.signupKey('10.0.0.5'), throttle.SIGNUP_POLICY);
  }
  assert.equal(throttle.isThrottled(throttle.signupKey('10.0.0.5'), throttle.SIGNUP_POLICY), true);
  assert.equal(throttle.isThrottled(throttle.registerKey('10.0.0.5'), throttle.SIGNUP_POLICY), false);
  assert.equal(throttle.isThrottled(throttle.orgKey('10.0.0.5', 'acme-law'), throttle.SIGNUP_POLICY), false);
});

test('createOrg buckets by slug so slug probing cannot exhaust a shared counter', () => {
  const a = throttle.orgKey('10.0.0.6', 'acme-law');
  const b = throttle.orgKey('10.0.0.6', 'other-law');
  assert.notEqual(a, b);
  for (let i = 0; i < throttle.SIGNUP_POLICY.limit; i++) {
    throttle.recordThrottleFailure(a, throttle.SIGNUP_POLICY);
  }
  assert.equal(throttle.isThrottled(a, throttle.SIGNUP_POLICY), true);
  assert.equal(throttle.isThrottled(b, throttle.SIGNUP_POLICY), false);
});

test('onboarding limit is more generous than login', () => {
  assert.ok(
    throttle.SIGNUP_POLICY.limit > throttle.LOGIN_POLICY.limit,
    'shared-office egress must not be punished as hard as credential guessing',
  );
});

test('a successful attempt clears the buckets it should forgive', () => {
  const keys = [throttle.loginAccountKey('ok@example.com'), throttle.loginAddressKey('10.0.0.9', 'ok@example.com')];
  for (const key of keys) throttle.recordThrottleFailure(key, throttle.LOGIN_POLICY);
  throttle.clearThrottleFailures(keys);
  for (const key of keys) assert.equal(throttle.isThrottled(key, throttle.LOGIN_POLICY), false);
});

test('a missing address falls back to a stable bucket key', () => {
  assert.equal(throttle.loginAddressKey(undefined, 'a@b.com'), 'login|unknown|a@b.com');
  assert.equal(throttle.signupKey(undefined), 'signup|unknown');
});

test('every verifyPassword outcome costs one full scrypt derivation', async () => {
  // Guards the account-enumeration oracle: a legacy row used to answer in
  // microseconds while an unknown email took a full derivation.
  const time = async (stored) => {
    const started = process.hrtime.bigint();
    await pw.verifyPassword(PASSWORD, stored);
    return Number(process.hrtime.bigint() - started) / 1e6;
  };
  const current = await pw.hashPassword(PASSWORD);
  const unknown = await time(null);
  const legacy = await time(legacyHash(PASSWORD));
  const unparseable = await time('scrypt$garbage');
  for (const [name, ms] of [['unknown', unknown], ['legacy', legacy], ['unparseable', unparseable]]) {
    assert.ok(ms > 20, `${name} path returned in ${ms.toFixed(1)}ms — timing oracle`);
  }
});

test('the most expensive accepted cost is verifiable, not silently unverifyable', () => {
  // Regression: the memory ceiling once sat a few KB below what the highest
  // accepted N needed, so such rows failed to verify while needsRehash
  // reported them as current — a permanent silent lockout.
  const atMaxN = `scrypt$${1 << 17}$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`;
  assert.equal(pw.needsRehash(atMaxN), false);
});

test('a cost above the accepted range is flagged for rehash rather than ignored', () => {
  const tooCostly = `scrypt$${1 << 18}$8$1$${'b'.repeat(32)}$${'c'.repeat(128)}`;
  assert.equal(pw.needsRehash(tooCostly), true);
});

test('secrets: outside production a missing value falls back', () => {
  const backup = { ...process.env };
  try {
    delete process.env.SESSION_SECRET;
    process.env.NODE_ENV = 'development';
    assert.equal(
      secrets.requireSecret('SESSION_SECRET', { devFallback: 'change-me-in-production' }),
      'change-me-in-production',
    );
  } finally {
    process.env = backup;
  }
});

test('secrets: production fails closed on a missing secret', () => {
  const backup = { ...process.env };
  try {
    delete process.env.SESSION_SECRET;
    process.env.NODE_ENV = 'production';
    assert.throws(
      () => secrets.requireSecret('SESSION_SECRET', { devFallback: 'x' }),
      /must be configured in production/,
    );
  } finally {
    process.env = backup;
  }
});

test('secrets: production rejects the placeholder shipped in .env.example', () => {
  const backup = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'change-me-in-production';
    assert.throws(() => secrets.requireSecret('SESSION_SECRET'), /placeholder/);
  } finally {
    process.env = backup;
  }
});

test('secrets: production rejects a secret shorter than 32 characters', () => {
  const backup = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'tooshort';
    assert.throws(() => secrets.requireSecret('SESSION_SECRET'), /at least 32 characters/);
  } finally {
    process.env = backup;
  }
});

test('secrets: production accepts a strong secret', () => {
  const backup = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'k'.repeat(64);
    assert.equal(secrets.requireSecret('SESSION_SECRET'), 'k'.repeat(64));
  } finally {
    process.env = backup;
  }
});