import { ACPProtocol } from "../acp/protocol.js";

const kilocodeAdapter = {
  name: 'kilocode',
  detectSignals: [
    (env) => env.IDE === 'kilocode',
    (env) => env.TERM_PROGRAM === 'KiloCode',
    (env) => env.KILOCODE_TRACE_ID !== undefined,
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

export { kilocodeAdapter };