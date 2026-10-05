export class ReputationStore {
  constructor({ path = '.autoclaw/fabric/reputation' } = {}) {
    this.path = path;
    this.scores = new Map();
  }

  async record({ agentId, outcome }) {
    const current = this.scores.get(agentId) ?? { success: 0, failure: 0, score: 0.5 };
    if (outcome === 'success') current.success++;
    else current.failure++;
    const total = current.success + current.failure;
    current.score = total > 0 ? current.success / total : 0.5;
    this.scores.set(agentId, current);
    return current;
  }

  async score(agentId) {
    return this.scores.get(agentId)?.score ?? 0.5;
  }

  async average() {
    const scores = [...this.scores.values()].map((s) => s.score);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
}
