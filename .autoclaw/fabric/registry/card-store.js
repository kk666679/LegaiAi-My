import fs from 'fs/promises';
import path from 'path';

export class CardStore {
  constructor({ path: basePath = '.autoclaw/fabric/cards' } = {}) {
    this.basePath = basePath;
  }

  async save(agentCard) {
    const file = path.join(this.basePath, `${agentCard.id}.json`);
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.writeFile(file, JSON.stringify(agentCard, null, 2), 'utf8');
  }

  async get(agentId) {
    const file = path.join(this.basePath, `${agentId}.json`);
    try {
      const raw = await fs.readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async remove(agentId) {
    const file = path.join(this.basePath, `${agentId}.json`);
    await fs.unlink(file).catch(() => {});
  }

  async list() {
    const files = await fs.readdir(this.basePath).catch(() => []);
    const cards = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(this.basePath, file), 'utf8');
        cards.push(JSON.parse(raw));
      } catch { /* skip */ }
    }
    return cards;
  }

  async count() {
    return (await this.list()).length;
  }
}
