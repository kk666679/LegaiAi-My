import { SessionStore } from "./store.js";

class SessionMigration {
  constructor(opts = {}) {
    this.store = store;
  }

  async migrate(sessionId, fromVersion, toVersion) {
    const session = await this.store.load(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (fromVersion === '1.0' && toVersion === '2.0') {
      return this.migrateV1ToV2(session);
    }

    return session;
  }

  migrateV1ToV2(session) {
    return {
      ...session,
      version: '2.0',
      capabilities: {
        promptCapabilities: { image: true, audio: false, embeddedContext: true },
        mcpCapabilities: { http: true, sse: false },
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
    };
  }
}

export { SessionMigration };
