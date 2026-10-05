export class CostAttribution {
  constructor() {
    this.attributions = new Map();
  }

  record({ cost, agentId, taskId, model, metadata = {} }) {
    const key = `${agentId}:${taskId}:${model}`;
    if (!this.attributions.has(key)) {
      this.attributions.set(key, { cost: 0, count: 0, agentId, taskId, model, metadata });
    }
    const record = this.attributions.get(key);
    record.cost += cost;
    record.count += 1;
  }

  attributeToTask({ taskId, cost }) {
    let total = 0;
    const records = [];
    for (const [, record] of this.attributions) {
      if (record.taskId === taskId) {
        records.push(record);
        total += record.cost;
      }
    }
    return { taskId, total, breakdown: records };
  }

  attributeToAgent({ agentId, cost }) {
    let total = 0;
    const records = [];
    for (const [, record] of this.attributions) {
      if (record.agentId === agentId) {
        records.push(record);
        total += record.cost;
      }
    }
    return { agentId, total, breakdown: records };
  }

  attributeToModel({ model, cost }) {
    let total = 0;
    const records = [];
    for (const [, record] of this.attributions) {
      if (record.model === model) {
        records.push(record);
        total += record.cost;
      }
    }
    return { model, total, breakdown: records };
  }

  getTopConsumers({ limit = 10 } = {}) {
    const sorted = [...this.attributions.values()].sort((a, b) => b.cost - a.cost);
    return sorted.slice(0, limit);
  }

  getSummary() {
    const byAgent = new Map();
    const byModel = new Map();
    const byTask = new Map();

    for (const [, record] of this.attributions) {
      // By agent
      if (!byAgent.has(record.agentId)) {
        byAgent.set(record.agentId, { cost: 0, count: 0 });
      }
      const agentRecord = byAgent.get(record.agentId);
      agentRecord.cost += record.cost;
      agentRecord.count += 1;

      // By model
      if (!byModel.has(record.model)) {
        byModel.set(record.model, { cost: 0, count: 0 });
      }
      const modelRecord = byModel.get(record.model);
      modelRecord.cost += record.cost;
      modelRecord.count += 1;

      // By task
      if (!byTask.has(record.taskId)) {
        byTask.set(record.taskId, { cost: 0, count: 0 });
      }
      const taskRecord = byTask.get(record.taskId);
      taskRecord.cost += record.cost;
      taskRecord.count += 1;
    }

    return {
      byAgent: Object.fromEntries(byAgent),
      byModel: Object.fromEntries(byModel),
      byTask: Object.fromEntries(byTask),
      totalCost: [...byAgent.values()].reduce((sum, r) => sum + r.cost, 0),
      totalRecords: this.attributions.size,
    };
  }
}
