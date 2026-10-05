const ACP_METHODS = {
  INITIALIZE: 'initialize',
  SESSION_NEW: 'session/new',
  SESSION_PROMPT: 'session/prompt',
  SESSION_CANCEL: 'session/cancel',
  SESSION_LOAD: 'session/load',
  SESSION_UPDATE: 'session/update',
  PERMISSION_REQUEST: 'session/request_permission',
  FS_READ: 'fs/read_text_file',
  FS_WRITE: 'fs/write_text_file',
  TERMINAL_CREATE: 'terminal/create',
  TERMINAL_OUTPUT: 'terminal/output',
};

class ACPProtocol {
  constructor({ transport, agent, capabilities } = {}) {
    this.transport = transport;
    this.agent = agent;
    this.capabilities = capabilities;
    this.sessions = new Map();
  }

  async handle(message) {
    const { method, params, id } = message;
    try {
      const result = await this.dispatch(method, params);
      this.transport.send({ jsonrpc: '2.0', id, result });
    } catch (error) {
      this.transport.send({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: error.message },
      });
    }
  }

  async dispatch(method, params) {
    switch (method) {
      case ACP_METHODS.INITIALIZE:
        return this.initialize(params);
      case ACP_METHODS.SESSION_NEW:
        return this.newSession(params);
      case ACP_METHODS.SESSION_PROMPT:
        return this.prompt(params);
      case ACP_METHODS.SESSION_CANCEL:
        return this.cancel(params);
      case ACP_METHODS.SESSION_LOAD:
        return this.loadSession(params);
      default:
        throw new Error(`Unsupported ACP method: ${method}`);
    }
  }

  async initialize({ clientCapabilities, protocolVersion }) {
    this.clientCaps = clientCapabilities;
    return {
      protocolVersion: '1.0',
      serverCapabilities: this.capabilities,
      serverInfo: { name: 'autoclaw-bridge', version: '2.0.0' },
    };
  }

  async newSession({ cwd, mcpServers = [] }) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      cwd,
      mcpServers,
      history: [],
      createdAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return { sessionId };
  }

  async prompt({ sessionId, prompt }) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const stream = await this.agent.stream(prompt, { session });
    for await (const chunk of stream) {
      this.transport.send({
        jsonrpc: '2.0',
        method: ACP_METHODS.SESSION_UPDATE,
        params: { sessionId, update: chunk },
      });
    }
    return { stopReason: 'end_turn' };
  }

  async cancel({ sessionId }) {
    const session = this.sessions.get(sessionId);
    if (session && session.controller) session.controller.abort();
    return { cancelled: true };
  }

  async loadSession({ sessionId }) {
    const session = this.sessions.get(sessionId);
    return session ? { session } : { error: 'not_found' };
  }
}

export { ACPProtocol };
export { ACP_METHODS };
