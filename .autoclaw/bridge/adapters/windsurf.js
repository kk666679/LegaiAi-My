import { ACPProtocol } from "../acp/protocol.js";

const windsurfAdapter = {
  name: 'windsurf',
  detectSignals: [
    (env) => env.IDE === 'windsurf',
    (env) => env.TERM_PROGRAM === 'Windsurf',
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

export { windsurfAdapter };