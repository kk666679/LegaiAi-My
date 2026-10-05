export class QuotaManager {
  constructor() {
    this.quotas = new Map();
  }

  set(agentId, quota) {
    this.quotas.set(agentId, { ...quota, used: 0 });
  }

  consume(agentId, amount = 1) {
    const quota = this.quotas.get(agentId);
    if (!quota) return true;
    if (quota.used + amount > quota.limit) return false;
    quota.used += amount;
    return true;
  }
}
