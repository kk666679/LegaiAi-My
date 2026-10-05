import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync } from "fs";
import { join } from "path";

class SessionStore {
  constructor(opts = {}) {
    this.dataDir = opts.dataDir || opts.path || '.autoclaw/bridge/sessions';
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async save(sessionId, session) {
    const filePath = join(this.dataDir, `${sessionId}.json`);
    const tempPath = `${filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(session, null, 2), 'utf8');
    renameSync(tempPath, filePath);
  }

  async load(sessionId) {
    const filePath = join(this.dataDir, `${sessionId}.json`);
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

  async loadLatest(env) {
    const sessions = await this.list(env);
    if (!sessions.length) return null;
    sessions.sort((a, b) => b.createdAt - a.createdAt);
    return sessions[0];
  }

  async list(env) {
    const sessions = [];
    for (const file of listFiles(this.dataDir)) {
      if (file.endsWith('.json')) {
        try {
          const session = JSON.parse(readFileSync(join(this.dataDir, file), 'utf8'));
          sessions.push(session);
        } catch {
          // Skip invalid sessions
        }
      }
    }
    return sessions;
  }
}

function listFiles(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}

export { SessionStore };
