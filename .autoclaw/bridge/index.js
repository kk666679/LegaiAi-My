import { AdapterRegistry } from './adapters/index.js';
import { SessionStore } from './session/store.js';
import { BridgeTracer } from './telemetry/tracer.js';
import { MCPToolForwarder } from './mcp-bridge/tool-forwarder.js';

class AutoClawBridge {
  constructor({ agent, mcpUrl, mcpToken, config = {} } = {}) {
    this.agent = agent;
    this.adapters = new AdapterRegistry();
    this.sessions = new SessionStore(config.sessionPath || '.autoclaw/bridge/sessions');
    this.forwarder = new MCPToolForwarder({
      autoclawMcpUrl: mcpUrl,
      token: mcpToken,
      capabilityFilter: (tool) => !tool.name.startsWith('internal.'),
    });
    this.tracer = new BridgeTracer();
  }

  async connect(env, transport) {
    const adapter = await this.adapters.create(env, { agent: this.agent, transport });
    this.tracer.record('connected', { adapter: adapter.name });
    await this.forwarder.registerWith(adapter.protocol).catch(() => {});
    return adapter;
  }

  async recoverSession(env) {
    const stored = await this.sessions.loadLatest(env);
    if (!stored) return null;
    return this.connect(env, { replay: stored });
  }
}

export { AutoClawBridge, AdapterRegistry, MCPToolForwarder, SessionStore, BridgeTracer };