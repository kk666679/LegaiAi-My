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

export const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function scoreSeverity(failureClass, symptom) {
  const severityMap = {
    crash: 'critical',
    resource_exhaustion: 'critical',
    auth: 'high',
    network: 'high',
    timeout: 'high',
    rate_limit: 'medium',
    dependency: 'medium',
    validation: 'low',
    logic: 'high',
  };
  return severityMap[failureClass] ?? 'medium';
}
