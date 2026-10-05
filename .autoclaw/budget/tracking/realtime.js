export class RealtimeTracker {
  constructor({ maxWindow = 7 * 24 * 60 * 60 * 1000 } = {}) {
    this.maxWindow = maxWindow;
    this.entries = [];
    this.startTime = Date.now();
  }

  record(entry) {
    this.entries.push({ ...entry, recordedAt: Date.now() });
    this.prune();
  }

  prune() {
    const cutoff = Date.now() - this.maxWindow;
    this.entries = this.entries.filter((e) => e.ts >= cutoff);
  }

  summary(window = '24h') {
    const windowMs = this.parseWindow(window);
    const cutoff = Date.now() - windowMs;
    const filtered = this.entries.filter((e) => e.ts >= cutoff);

    const totalCost = filtered.reduce((sum, e) => sum + e.cost, 0);
    const totalTokens = filtered.reduce((sum, e) => sum + (e.tokensIn ?? 0) + (e.tokensOut ?? 0), 0);

    return {
      window,
      timespan: { start: new Date(cutoff), end: new Date() },
      entries: filtered.length,
      totalCost: totalCost.toFixed(4),
      totalTokens,
      averageCost: filtered.length > 0 ? (totalCost / filtered.length).toFixed(6) : '0',
    };
  }

  getEntries({ limit = 100, offset = 0 } = {}) {
    return this.entries.slice(offset, offset + limit);
  }

  parseWindow(window) {
    const match = /^(\d+)([dhms])$/.exec(window);
    if (!match) return 24 * 60 * 60 * 1000;
    const [, num, unit] = match;
    const n = parseInt(num, 10);
    switch (unit) {
      case 'd': return n * 24 * 60 * 60 * 1000;
      case 'h': return n * 60 * 60 * 1000;
      case 'm': return n * 60 * 1000;
      case 's': return n * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}
