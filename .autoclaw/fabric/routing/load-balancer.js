export class LoadBalancer {
  constructor() {
    this.queues = new Map();
  }

  assign(agentId) {
    const queue = this.queues.get(agentId) ?? { depth: 0, requests: [] };
    queue.depth++;
    this.queues.set(agentId, queue);
    return agentId;
  }

  release(agentId) {
    const queue = this.queues.get(agentId);
    if (queue && queue.depth > 0) {
      queue.depth--;
    }
  }

  queueDepth(agentId) {
    return this.queues.get(agentId)?.depth ?? 0;
  }

  totalDepth() {
    return [...this.queues.values()].reduce((sum, q) => sum + q.depth, 0);
  }
}
