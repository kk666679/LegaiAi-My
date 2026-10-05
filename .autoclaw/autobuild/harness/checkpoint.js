import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { renameSync } from "fs";
import crypto from "crypto";

/**
 * CheckpointStore — persistent state storage across restarts.
 * Uses JSON files on disk for reliability and sharing across processes.
 */
class CheckpointStore {
  constructor({ dataDir = '.autoclaw/autobuild/checkpoints' } = {}) {
    this.dataDir = dataDir;
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async save(runId, state) {
    const filePath = join(this.dataDir, `${runId}.json`);
    const tempPath = `${filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
    renameSync(tempPath, filePath);
  }

  async load(runId) {
    const filePath = join(this.dataDir, `${runId}.json`);
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      const content = readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

export { CheckpointStore };