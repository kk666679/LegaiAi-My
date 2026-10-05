import { scoreSeverity } from './types.js';

export function severityToNumeric(severity) {
  const levels = { critical: 4, high: 3, medium: 2, low: 1 };
  return levels[severity] ?? 2;
}

export function numericToSeverity(level) {
  const map = { 4: 'critical', 3: 'high', 2: 'medium', 1: 'low' };
  return map[level] ?? 'medium';
}

export function scoreFailureSeverity(failureClass, symptom) {
  return scoreSeverity(failureClass, symptom);
}
