import { ACPProtocol } from "../acp/protocol.js";

const clineAdapter = {
  name: 'cline',
  detectSignals: [
    (env) => env.IDE === 'cline',
    (env) => env.CLINE === '1',
    (env) => env.TERM_PROGRAM === 'Cline',
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

export { clineAdapter };