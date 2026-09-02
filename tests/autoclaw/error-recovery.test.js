/**
 * Phase 7-T1: Error Recovery & Retry Logic Tests
 * 
 * Verifies:
 * - Exponential backoff calculation
 * - Circuit breaker state transitions
 * - Error classification
 * - Retry with error recovery
 */

import test from 'node:test';
import assert from 'node:assert';
import {
  classifyError,
  calculateRetryDelay,
  CircuitBreaker,
  CIRCUIT_BREAKER_CONFIG,
  RETRY_POLICY,
  ERROR_TYPES,
  executeWithRetry,
  executeWithCircuitBreaker,
  getCircuitBreaker,
  getErrorRecoveryStats,
} from '../../.autoclaw/hardening/error-recovery/error-recovery.js';

test('Phase 7-T1: Error Recovery & Retry', async (t) => {

  await t.test('Classifies timeout errors', () => {
    const error = new Error('Connection timeout');
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.TIMEOUT);
  });

  await t.test('Classifies rate limit errors', () => {
    const error = new Error('Too many requests - rate limit exceeded');
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.RATE_LIMIT);
  });

  await t.test('Classifies database errors', () => {
    const error = new Error('Database connection failed');
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.DATABASE);
  });

  await t.test('Classifies permanent errors (404)', () => {
    const error = new Error('Not found');
    error.code = '404';
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.PERMANENT);
  });

  await t.test('Classifies external service errors', () => {
    const error = new Error('External service unavailable');
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.EXTERNAL_SERVICE);
  });

  await t.test('Defaults to retriable for unknown errors', () => {
    const error = new Error('Something went wrong');
    const type = classifyError(error);
    assert.strictEqual(type, ERROR_TYPES.RETRIABLE);
  });

  await t.test('Handles null error', () => {
    const type = classifyError(null);
    assert.strictEqual(type, ERROR_TYPES.PERMANENT);
  });

  await t.test('Calculates exponential backoff for retry 0', () => {
    const delay = calculateRetryDelay(0);
    const minDelay = RETRY_POLICY.initialDelay * 0.9; // Allow 10% jitter
    const maxDelay = RETRY_POLICY.initialDelay * 1.1; // Allow 10% jitter
    assert.ok(delay >= minDelay && delay <= maxDelay);
  });

  await t.test('Calculates exponential backoff for retry 1', () => {
    const delay = calculateRetryDelay(1);
    const expectedBase = RETRY_POLICY.initialDelay * Math.pow(RETRY_POLICY.exponentialBase, 1);
    const minDelay = expectedBase * 0.9;
    const maxDelay = expectedBase * 1.1;
    assert.ok(delay >= minDelay && delay <= maxDelay);
  });

  await t.test('Caps maximum retry delay', () => {
    const delay = calculateRetryDelay(10); // Very high attempt number
    assert.ok(delay <= RETRY_POLICY.maxDelay * 1.1); // Allow jitter
  });

  await t.test('Circuit breaker starts in closed state', () => {
    const breaker = new CircuitBreaker('test-1');
    const status = breaker.getStatus();
    assert.strictEqual(status.state, 'closed');
  });

  await t.test('Circuit breaker allows requests when closed', () => {
    const breaker = new CircuitBreaker('test-2');
    assert.strictEqual(breaker.canExecute(), true);
  });

  await t.test('Circuit breaker records successful requests', () => {
    const breaker = new CircuitBreaker('test-3');
    breaker.recordSuccess();
    const status = breaker.getStatus();
    assert.strictEqual(status.state, 'closed');
    assert.strictEqual(status.failureCount, 0);
    assert.strictEqual(status.stats.successfulRequests, 1);
  });

  await t.test('Circuit breaker opens after threshold failures', () => {
    const breaker = new CircuitBreaker('test-4');

    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }

    const status = breaker.getStatus();
    assert.strictEqual(status.state, 'open');
  });

  await t.test('Circuit breaker rejects requests when open', () => {
    const breaker = new CircuitBreaker('test-5');

    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }

    assert.strictEqual(breaker.canExecute(), false);
  });

  await t.test('Circuit breaker moves to half-open after timeout', async () => {
    const breaker = new CircuitBreaker('test-6');

    // Fail enough times to open
    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }

    assert.strictEqual(breaker.getStatus().state, 'open');

    // Artificially advance time by setting lastFailureTime to past
    breaker.lastFailureTime = Date.now() - CIRCUIT_BREAKER_CONFIG.timeout - 1000;

    // Now it should be half-open
    const canExecute = breaker.canExecute();
    assert.strictEqual(canExecute, true);
    assert.strictEqual(breaker.getStatus().state, 'half-open');
  });

  await t.test('Circuit breaker closes after successful requests in half-open', async () => {
    const breaker = new CircuitBreaker('test-7');

    // Open the breaker
    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }

    // Simulate timeout passing
    breaker.lastFailureTime = Date.now() - CIRCUIT_BREAKER_CONFIG.timeout - 1000;

    // Transition to half-open by allowing execution
    breaker.canExecute();
    assert.strictEqual(breaker.getStatus().state, 'half-open');

    // Record successful requests until threshold
    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.successThreshold; i++) {
      breaker.recordSuccess();
    }

    assert.strictEqual(breaker.getStatus().state, 'closed');
  });

  await t.test('Circuit breaker re-opens if failure during half-open', () => {
    const breaker = new CircuitBreaker('test-8');

    // Open -> half-open
    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }
    breaker.lastFailureTime = Date.now() - CIRCUIT_BREAKER_CONFIG.timeout - 1000;
    breaker.canExecute(); // Transition to half-open

    // Now record a failure while half-open
    breaker.recordFailure();

    assert.strictEqual(breaker.getStatus().state, 'open');
  });

  await t.test('Can reset circuit breaker', () => {
    const breaker = new CircuitBreaker('test-9');

    for (let i = 0; i < CIRCUIT_BREAKER_CONFIG.failureThreshold; i++) {
      breaker.recordFailure();
    }

    assert.strictEqual(breaker.getStatus().state, 'open');

    breaker.reset();

    const status = breaker.getStatus();
    assert.strictEqual(status.state, 'closed');
    assert.strictEqual(status.failureCount, 0);
  });

  await t.test('Execute with retry succeeds on first attempt', async () => {
    let attempts = 0;

    const result = await executeWithRetry(async () => {
      attempts++;
      return 'success';
    }, { stageName: 'test-stage', traceId: 'test-001' });

    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 1);
  });

  await t.test('Execute with retry retries on retriable errors', async () => {
    let attempts = 0;

    try {
      await executeWithRetry(async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Database connection failed');
          throw error;
        }
        return 'success';
      }, { stageName: 'test-stage', traceId: 'test-002' });
    } catch (error) {
      // Will fail because we hit max retries before succeeding
    }

    // Should have attempted (max retries) times
    assert.strictEqual(attempts, RETRY_POLICY.maxAttempts);
  });

  await t.test('Execute with retry gives up on permanent errors', async () => {
    let attempts = 0;

    try {
      await executeWithRetry(async () => {
        attempts++;
        const error = new Error('Invalid input - 404 not found');
        error.code = '404';
        throw error;
      }, { stageName: 'test-stage', traceId: 'test-003' });
    } catch (error) {
      assert.strictEqual(error.message, 'Invalid input - 404 not found');
    }

    // Should only attempt once for permanent errors
    assert.strictEqual(attempts, 1);
  });

  await t.test('Get circuit breaker creates new one on first access', () => {
    const breaker1 = getCircuitBreaker('new-worker-123');
    const breaker2 = getCircuitBreaker('new-worker-123');

    assert.strictEqual(breaker1, breaker2);
  });

  await t.test('Get error recovery stats includes all breakers', () => {
    getCircuitBreaker('worker-stats-1');
    getCircuitBreaker('worker-stats-2');

    const stats = getErrorRecoveryStats();
    assert.ok(stats.circuitBreakers.length >= 2);
    assert.strictEqual(typeof stats.timestamp, 'object');
  });

  await t.test('Circuit breaker tracks stats correctly', () => {
    const breaker = new CircuitBreaker('test-stats');

    breaker.recordSuccess();
    breaker.recordSuccess();
    breaker.recordFailure();
    breaker.recordRejection();

    const status = breaker.getStatus();
    assert.strictEqual(status.stats.totalRequests, 4);
    assert.strictEqual(status.stats.successfulRequests, 2);
    assert.strictEqual(status.stats.failedRequests, 1);
    assert.strictEqual(status.stats.rejectedRequests, 1);
  });

});
