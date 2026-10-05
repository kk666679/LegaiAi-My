import { SessionStore } from "./store.js";

class SessionRecovery {
  constructor(opts = {}) {
    this.store = store;
  }

  async recover(env, adapter) {
    const latest = await this.store.loadLatest(env);
    if (!latest) {
      return null;
    }

    try {
      const session = await adapter.create({ agent: latest.agent, transport: latest.transport });
      return {
        ...session,
        recovered: true,
        recoveredAt: Date.now(),
        previousSessionId: latest.id,
      };
    } catch (error) {
      return {
        recovered: false,
        error: error.message,
        previousSessionId: latest.id,
      };
    }
  }
}

export { SessionRecovery };
