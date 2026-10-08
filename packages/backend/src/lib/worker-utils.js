/**
 * Shared error classification utility for all BullMQ workers.
 *
 * Classifies errors as retryable or permanent and assigns a machine-readable
 * error code. This avoids duplicating the classification logic across 13+ workers.
 */
export function classifyError(err) {
  const message = err.message.toLowerCase();
  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('socket') ||
    message.includes('network')
  ) {
    return { retryable: true, code: 'EXTERNAL_SERVICE_TIMEOUT' };
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return { retryable: true, code: 'RATE_LIMIT' };
  }
  if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
    return { retryable: false, code: 'AUTHENTICATION_ERROR' };
  }
  if (message.includes('not found') || message.includes('invalid')) {
    return { retryable: false, code: 'NOT_FOUND' };
  }
  if (message.includes('validation')) {
    return { retryable: false, code: 'VALIDATION_ERROR' };
  }
  if (message.includes('insufficient evidence')) {
    return { retryable: false, code: 'INSUFFICIENT_EVIDENCE' };
  }
  return { retryable: false, code: 'UNKNOWN_ERROR' };
}

/**
 * Common Redis connection configuration reused across all workers.
 * Reads from environment variables with sensible defaults.
 */
export const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

/**
 * Shared worker configuration defaults.
 */
export const DEFAULT_WORKER_OPTIONS = {
  maxStalledCount: 2,
  removeOnFail: false,
  removeOnComplete: false,
};
