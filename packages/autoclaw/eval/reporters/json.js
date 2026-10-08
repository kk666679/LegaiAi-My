import fs from 'fs/promises';
import path from 'path';

/**
 * eval/reporters/json.js — JSON reporter.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const jsonReporter = {
  async report(summary) {
    const file = `.autoclaw/eval/reports/${summary.suite}-${Date.now()}.json`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(summary, null, 2));
  },
};

export { jsonReporter as jsonReporter };
