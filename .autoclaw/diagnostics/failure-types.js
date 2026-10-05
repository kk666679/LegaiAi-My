export const FAILURE_TYPES = [
  'timeout',
  'resource_exhaustion',
  'network',
  'auth',
  'validation',
  'rate_limit',
  'dependency',
  'logic',
  'crash',
];

export function normalizeFailureType(value) {
  if (value && FAILURE_TYPES.includes(value)) {
    return { type: value };
  }
  return value ? { type: 'unknown_external', original: value } : { type: 'unknown_external' };
}

export function isKnownFailureType(value) {
  return typeof value === 'string' && FAILURE_TYPES.includes(value);
}

export function isRetryableFailure(type) {
  return type !== 'unknown_external';
}

export function isEscalationCandidate(type) {
  return type === 'unknown_external';
}

export function isHumanRequired(type) {
  return type !== 'unknown_external';
}
