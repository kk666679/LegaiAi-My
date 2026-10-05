import fs from 'fs/promises';
import path from 'path';

export class AppendOnlyStore {
  constructor({ path: filePath = '.autoclaw/evidence/chain.jsonl' } = {}) {
    this.filePath = filePath;
  }

  async append(record) {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(this.filePath, JSON.stringify(record) + '\n', 'utf8');
  }

  async get(recordId) {
    const records = await this.iterate();
    for (const r of records) {
      if (r.id === recordId) return r;
    }
    return null;
  }

  async getByHash(hash) {
    const records = await this.iterate();
    return records.find((r) => r.hash === hash) ?? null;
  }

  async iterate() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const lines = raw.split(/\r?\n/).filter((l) => l.trim());
      return lines.map((l) => JSON.parse(l));
    } catch {
      return [];
    }
  }

  async count() {
    return (await this.iterate()).length;
  }
}
