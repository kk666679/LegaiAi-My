import { ACPProtocol } from "../acp/protocol.js";

const continueAdapter = {
  name: 'continue',
  detectSignals: [
    (env) => env.IDE === 'continue',
    (env) => env.CONTINUE === '1',
    (env) => env.TERM_PROGRAM === 'Continue',
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

export { continueAdapter };