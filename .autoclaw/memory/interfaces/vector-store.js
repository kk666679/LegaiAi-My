export class VectorStore {
  constructor() {
    this.collections = new Map();
  }

  async ensureCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    return this.collections.get(name);
  }

  async addRecords(collectionName, records = []) {
    const collection = await this.ensureCollection(collectionName);
    for (const record of records) {
      if (!collection.some((entry) => entry.id === record.id)) {
        collection.push(record);
      }
    }
    return collection;
  }
}
