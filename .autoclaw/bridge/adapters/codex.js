import { ACPProtocol } from "../acp/protocol.js";

const codexAdapter = {
  name: 'codex',
  detectSignals: [
    (env) => env.IDE === 'codex',
    (env) => env.TERM_PROGRAM === 'Codex',
    (env) => env.CODEX === '1',
  ],
  async create({ agent, transport } = {}) {
    const protocol = new ACPProtocol({ transport, agent, capabilities: {
      promptCapabilities: { image: true, audio: false, embeddedContext: true },
      mcpCapabilities: { http: true, sse: false },
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
    }});
    return { protocol, agent };
  },
};

export { codexAdapter };