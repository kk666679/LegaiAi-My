import { ACPProtocol } from "../acp/protocol.js";

const claudeCodeAdapter = {
  name: 'claude-code',
  detectSignals: [
    (env) => env.IDE === 'claude-code',
    (env) => env.CLAUDE_CODE === '1',
    (env) => env.TERM_PROGRAM === 'ClaudeCode',
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

export { claudeCodeAdapter };