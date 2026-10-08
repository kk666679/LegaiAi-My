export class Replayer {
  constructor({ store } = {}) {
    this.store = store;
  }

  async replay({ fromTs = 0, toTs = Date.now() } = {}) {
    const records = await this.store.iterate();
    return records.filter((r) => r.timestamp >= fromTs && r.timestamp <= toTs);
  }
}
