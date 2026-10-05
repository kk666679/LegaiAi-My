/**
 * Canary router — A/B testing and gradual rollout of new models.
 */
class CanaryRouter {
  constructor(opts = {}) {
    const { primaryModel, canaryModel, canaryPercent = 10 } = opts;
    this.primaryModel = primaryModel;
    this.canaryModel = canaryModel;
    this.canaryPercent = Math.min(100, Math.max(0, canaryPercent));
    this.totalRequests = 0;
    this.canaryRequests = 0;
    this.canaryFailures = 0;
  }

  async route(task) {
    this.totalRequests++;

    // Determine if this request should go to canary
    const useCanary = this.totalRequests % 100 <= this.canaryPercent;

    if (useCanary) {
      this.canaryRequests++;
      return {
        model: this.canaryModel,
        variant: 'canary',
        isCanary: true,
      };
    }

    return {
      model: this.primaryModel,
      variant: 'primary',
      isCanary: false,
    };
  }

  recordResult(variant, success) {
    if (variant === 'canary' && !success) {
      this.canaryFailures++;
    }
  }

  getCanaryStats() {
    return {
      totalRequests: this.totalRequests,
      canaryRequests: this.canaryRequests,
      canaryFailures: this.canaryFailures,
      canaryFailureRate:
        this.canaryRequests > 0 ? this.canaryFailures / this.canaryRequests : 0,
      canaryPercent: this.canaryPercent,
    };
  }
}

export { CanaryRouter };
