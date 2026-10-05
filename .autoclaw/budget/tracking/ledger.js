import { promises as fs } from 'fs';
import { dirname } from 'path';

export class CostLedger {
  constructor({ path }) {
    this.path = path;
    this.fileHandle = null;
    this.entries = [];
  }

  async init() {
    try {
      const content = await fs.readFile(this.path, 'utf8');
      this.entries = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.entries = [];
      await this.ensureDir();
    }
  }

  async ensureDir() {
    try {
      await fs.mkdir(dirname(this.path), { recursive: true });
    } catch {
      // Already exists
    }
  }

  async append(entry) {
    if (!this.entries) await this.init();

    this.entries.push(entry);

    try {
      await this.ensureDir();
      const line = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.path, line);
    } catch (error) {
      console.error('Error writing ledger:', error);
    }
  }

  async get({ agentId = null, since = 0, limit = 1000 } = {}) {
    if (!this.entries) await this.init();

    let filtered = this.entries;

    if (since > 0) {
      filtered = filtered.filter((e) => e.ts >= since);
    }

    if (agentId && agentId !== 'all') {
      filtered = filtered.filter((e) => e.agentId === agentId);
    }

    return filtered.slice(-limit);
  }

  async clear() {
    this.entries = [];
    try {
      await fs.writeFile(this.path, '');
    } catch {
      // Ignore errors
    }
  }

  async size() {
    if (!this.entries) await this.init();
    return this.entries.length;
  }
}
