import { ACPProtocol } from "../acp/protocol.js";

const kiroAdapter = {
  name: 'kiro',
  detectSignals: [
    (env) => env.IDE === 'kiro',
    (env) => env.TERM_PROGRAM === 'Kiro',
  ],
  async create({ agent, transport } = {}) {
    const protocol = new ACPProtocol({ transport, agent, capabilities: {
      promptCapabilities: { image: true, audio: true, embeddedContext: true },
      mcpCapabilities: { http: true, sse: true },
      fs: { readTextFile: true, writeTextFile: true, search: true },
      terminal: true,
    }});
    return { protocol, agent };
  },
};

export { kiroAdapter };