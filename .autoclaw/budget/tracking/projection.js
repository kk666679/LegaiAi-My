export class ProjectionCalculator {
  constructor({ historicalData = [] } = {}) {
    this.data = historicalData;
  }

  project({ ceiling, windowMs = 24 * 60 * 60 * 1000 }) {
    if (this.data.length === 0) {
      return { projection: null, confidence: 0, message: 'Insufficient historical data' };
    }

    // Calculate hourly rate from recent data
    const now = Date.now();
    const recentCutoff = now - windowMs;
    const recentData = this.data.filter((e) => e.ts >= recentCutoff);

    if (recentData.length === 0) {
      return { projection: null, confidence: 0, message: 'No recent data in window' };
    }

    const totalCost = recentData.reduce((sum, e) => sum + e.cost, 0);
    const hours = windowMs / (1000 * 60 * 60);
    const hourlyRate = totalCost / hours;

    // Calculate depletion time
    const remaining = Math.max(0, ceiling - totalCost);
    const hoursUntilExhausted = hourlyRate > 0 ? remaining / hourlyRate : Infinity;

    return {
      projection: {
        hourlyRate: parseFloat(hourlyRate.toFixed(4)),
        daysUntilExhausted: parseFloat((hoursUntilExhausted / 24).toFixed(2)),
        hoursUntilExhausted: parseFloat(hoursUntilExhausted.toFixed(1)),
        estimated24h: parseFloat((hourlyRate * 24).toFixed(2)),
        estimated7d: parseFloat((hourlyRate * 24 * 7).toFixed(2)),
      },
      confidence: Math.min(1.0, recentData.length / 100),
      based_on_entries: recentData.length,
      period: `${(hours).toFixed(1)}h`,
    };
  }

  projectByAgent({ agentId, data, ceiling }) {
    const agentData = data.filter((e) => e.agentId === agentId);
    return this.project({ ceiling, historicalData: agentData });
  }
}
