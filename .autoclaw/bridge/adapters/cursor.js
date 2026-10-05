import { ACPProtocol } from "../acp/protocol.js";

const cursorAdapter = {
  name: 'cursor',
  detectSignals: [
    (env) => env.IDE === 'cursor',
    (env) => env.CURSOR_TRACE_ID !== undefined,
    (env) => env.TERM_PROGRAM === 'Cursor',
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

export { cursorAdapter };