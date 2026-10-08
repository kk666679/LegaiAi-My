import { TRUST_LEVELS } from './trust-presets.js';

export class ReputationScorer {
  score({ successCount, failureCount } = {}) {
    const total = (successCount ?? 0) + (failureCount ?? 0);
    if (total === 0) return TRUST_LEVELS.MEDIUM;
    return (successCount ?? 0) / total;
  }
}
