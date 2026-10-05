import { ACPProtocol } from "../acp/protocol.js";

const antigravityAdapter = {
  name: 'antigravity',
  detectSignals: [
    (env) => env.IDE === 'antigravity',
    (env) => env.TERM_PROGRAM === 'Antigravity',
  ],
  async create({ agent, transport } = {}) {
    const protocol = new ACPProtocol({ transport, agent, capabilities: {
      promptCapabilities: { image: true, audio: true, embeddedContext: true },
      mcpCapabilities: { http: true, sse: true },
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
    }});
    return { protocol, agent };
  },
};

export { antigravityAdapter };