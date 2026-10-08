export class EvidenceIndexer {
  constructor({ store } = {}) {
    this.store = store;
    this.index = new Map();
  }

  async indexRecords() {
    const records = await this.store.iterate();
    for (const record of records) {
      this.index.set(record.id, record);
    }
  }

  query(predicate) {
    return [...this.index.values()].filter(predicate);
  }
}
