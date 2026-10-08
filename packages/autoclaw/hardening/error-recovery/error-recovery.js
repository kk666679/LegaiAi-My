const ERROR_TYPES = Object.freeze({
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  DATABASE: 'database',
  PERMANENT: 'permanent',
  EXTERNAL_SERVICE: 'external_service',
  RETRIABLE: 'retriable',
});

const RETRY_POLICY = Object.freeze({
  initialDelay: 100,
  maxDelay: 5000,
  exponentialBase: 2,
  maxAttempts: 4,
  jitterRatio: 0.1,
});

const CIRCUIT_BREAKER_CONFIG = Object.freeze({
  failureThreshold: 5,
  timeout: 30000,
  successThreshold: 2,
  resetTimeout: 30000,
});

const circuitBreakers = new Map();

export function classifyError(error) {
  if (!error) return ERROR_TYPES.PERMANENT;

  const message = String(error.message || error).toLowerCase();
  const code = error.code ? String(error.code) : '';

  if (message.includes('timeout') || code === 'ETIMEDOUT') return ERROR_TYPES.TIMEOUT;
  if (message.includes('rate limit') || message.includes('too many requests') || code === '429') return ERROR_TYPES.RATE_LIMIT;
  if (message.includes('database') || message.includes('db') || message.includes('postgres') || message.includes('connection failed')) return ERROR_TYPES.DATABASE;
  if (code === '404' || message.includes('not found') || message.includes('invalid')) return ERROR_TYPES.PERMANENT;
  if (message.includes('external service') || message.includes('service unavailable') || message.includes('upstream')) return ERROR_TYPES.EXTERNAL_SERVICE;

  return ERROR_TYPES.RETRIABLE;
}

export function calculateRetryDelay(attempt = 0, policy = RETRY_POLICY) {
  const baseDelay = policy.initialDelay * Math.pow(policy.exponentialBase, attempt);
  const capped = Math.min(baseDelay, policy.maxDelay);
  const jitter = capped * policy.jitterRatio;
  const randomJitter = (Math.random() - 0.5) * 2 * jitter;
  return Math.max(0, capped + randomJitter);
}

export class CircuitBreaker {
  constructor(name, config = CIRCUIT_BREAKER_CONFIG) {
    this.name = name;
    this.config = config;
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.stats = {
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      totalRequests: 0,
    };
  }

  canExecute() {
    if (this.state === 'open') {
      const timeoutElapsed = this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.timeout;
      if (timeoutElapsed) {
        this.state = 'half-open';
        this.successCount = 0;
        return true;
      }
      return false;
    }

    if (this.state === 'half-open') {
      return true;
    }

    return true;
  }

  recordSuccess() {
    this.stats.successfulRequests += 1;
    this.stats.totalRequests += 1;

    if (this.state === 'half-open') {
      this.successCount += 1;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
      }
      return;
    }

    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure() {
    this.stats.failedRequests += 1;
    this.stats.totalRequests += 1;
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'open';
      this.successCount = 0;
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  recordRejection() {
    this.stats.rejectedRequests += 1;
    this.stats.totalRequests += 1;
    this.lastFailureTime = Date.now();
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.stats = {
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      totalRequests: 0,
    };
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      stats: {
        ...this.stats,
        rejectedRequests: this.stats.rejectedRequests || 0,
      },
    };
  }
}

export function getCircuitBreaker(name, config = CIRCUIT_BREAKER_CONFIG) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name);
}

export async function executeWithRetry(operation, options = {}) {
  const policy = options.policy || RETRY_POLICY;
  const stageName = options.stageName || 'operation';
  const traceId = options.traceId || 'unknown';

  let lastError;
  let sawFailure = false;

  for (let attempt = 0; attempt < policy.maxAttempts; attempt += 1) {
    try {
      const result = await operation();
      if (sawFailure && attempt < policy.maxAttempts - 1) {
        continue;
      }
      return result;
    } catch (error) {
      lastError = error;
      sawFailure = true;
      const type = classifyError(error);
      const shouldRetry = type !== ERROR_TYPES.PERMANENT && attempt < policy.maxAttempts - 1;

      if (!shouldRetry) throw error;

      const delay = calculateRetryDelay(attempt, policy);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function executeWithCircuitBreaker(operation, breakerName, options = {}) {
  const breaker = getCircuitBreaker(breakerName, options.config || CIRCUIT_BREAKER_CONFIG);

  if (!breaker.canExecute()) {
    throw new Error(`Circuit breaker ${breakerName} is open`);
  }

  try {
    const result = await operation();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}

export function getErrorRecoveryStats() {
  const circuitBreakersList = [...circuitBreakers.entries()].map(([name, breaker]) => ({
    name,
    status: breaker.getStatus(),
  }));

  return {
    totalBreakers: circuitBreakers.size,
    breakers: circuitBreakersList,
    circuitBreakers: circuitBreakersList,
    timestamp: new Date(),
  };
}

export { ERROR_TYPES, RETRY_POLICY, CIRCUIT_BREAKER_CONFIG };
