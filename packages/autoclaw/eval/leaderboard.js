import fs from 'fs/promises';

/**
 * eval/leaderboard.js — Rank agents and skills by eval scores.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class Leaderboard {
  constructor({ path }) {
    this.path = path;
    this.entries = [];
  }

  async load() {
    try {
      this.entries = JSON.parse(await fs.readFile(this.path, 'utf8'));
    } catch {
      this.entries = [];
    }
  }

  async record({ suite, target, score, timestamp = Date.now() }) {
    this.entries.push({ suite, target, score, timestamp });
    await this.save();
  }

  async save() {
    await fs.writeFile(this.path, JSON.stringify(this.entries, null, 2));
  }

  rankBy({ suite, metric = 'score', limit = 10 }) {
    return this.entries
      .filter((e) => !suite || e.suite === suite)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }
}

export { Leaderboard as Leaderboard };
