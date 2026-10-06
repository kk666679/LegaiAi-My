import * as protocol from './protocol.js';
import { EventEmitter } from 'events';
import { buildCapabilities } from './capabilities.js';
import { ToolRegistry, buildDefaultTools } from './tools/index.js';
import { ResourceRegistry, buildDefaultResources } from './resources.js';
import { PromptRegistry, buildDefaultPrompts } from './prompts.js';



class McpServer extends EventEmitter {
  constructor(deps = {}) {
    super();
    this.deps = deps;
    this.state = 'created';
    this.clientInfo = null;
    this.protocolVersion = protocol.MCP_VERSION;
    this.logLevel = 'info';

    this.tools = deps.tools instanceof ToolRegistry ? deps.tools : buildDefaultTools(deps);
    this.resources = deps.resources instanceof ResourceRegistry ? deps.resources : buildDefaultResources(deps);
    this.prompts = deps.prompts instanceof PromptRegistry ? deps.prompts : buildDefaultPrompts(deps);
    this.capabilities = buildCapabilities({ tools: this.tools, resources: this.resources, prompts: this.prompts });

    this._methods = {
      'initialize':        this._initialize.bind(this),
      'ping':              async () => ({}),
      'tools/list':        async () => ({ tools: this.tools.list() }),
      'tools/call':        this._toolsCall.bind(this),
      'resources/list':    async () => ({ resources: this.resources.list() }),
      'resources/read':    this._resourcesRead.bind(this),
      'prompts/list':      async () => ({ prompts: this.prompts.list() }),
      'prompts/get':       this._promptsGet.bind(this),
      'logging/setLevel':  this._setLevel.bind(this),
      'shutdown':          this._shutdown.bind(this)
    };
  }

  async handleMessage(msg) {
    const id = msg && Object.prototype.hasOwnProperty.call(msg, 'id') ? msg.id : undefined;
    const isNotification = id === undefined || id === null;

    try {
      if (!msg || msg.jsonrpc !== protocol.JSONRPC_VERSION) {
        return isNotification ? null : protocol.errorResponse(id, protocol.ERROR_CODES.INVALID_REQUEST, 'Invalid JSON-RPC version');
      }
      if (typeof msg.method !== 'string') {
        return isNotification ? null : protocol.errorResponse(id, protocol.ERROR_CODES.INVALID_REQUEST, 'Missing method');
      }
      if (isNotification) {
        if (msg.method === 'notifications/initialized') { this.state = 'ready'; this.emit('ready'); }
        else if (msg.method === 'exit') { this.state = 'closed'; this.emit('close'); }
        return null;
      }
      const handler = this._methods[msg.method];
      if (!handler) return protocol.errorResponse(id, protocol.ERROR_CODES.METHOD_NOT_FOUND, `Method not found: ${msg.method}`);
      return protocol.successResponse(id, await handler(msg.params || {}));
    } catch (err) {
      if (isNotification) return null;
      const code = err && err.mcpCode ? err.mcpCode : protocol.ERROR_CODES.INTERNAL_ERROR;
      return protocol.errorResponse(id, code, err.message || String(err), err.data);
    }
  }

  async _initialize(params) {
    this.clientInfo = params && params.clientInfo || null;
    this.protocolVersion = (params && params.protocolVersion) || protocol.MCP_VERSION;
    this.state = 'initialized';
    this.emit('initialized', { clientInfo: this.clientInfo });
    return {
      protocolVersion: this.protocolVersion,
      capabilities: this.capabilities,
      serverInfo: { name: protocol.SERVER_NAME, version: protocol.SERVER_VERSION },
      instructions: 'Autoclaw MCP server — 11 agents, 17 skills, KG + memory + HITL + consensus.'
    };
  }

  async _toolsCall(params) {
    const { name, arguments: args = {} } = params || {};
    if (!name) throw protocol.mcpError(protocol.ERROR_CODES.INVALID_PARAMS, 'tools/call requires { name }');
    const tool = this.tools.get(name);
    if (!tool) throw protocol.mcpError(protocol.ERROR_CODES.TOOL_NOT_FOUND, `Unknown tool: ${name}`);
    try { return await this.tools.call(name, args, { server: this, deps: this.deps }); }
    catch (e) { return protocol.toolError(`Tool error: ${e.message}`); }
  }

  async _resourcesRead(params) {
    const { uri } = params || {};
    if (!uri) throw protocol.mcpError(protocol.ERROR_CODES.INVALID_PARAMS, 'resources/read requires { uri }');
    const out = await this.resources.read(uri);
    if (!out) throw protocol.mcpError(protocol.ERROR_CODES.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`);
    return out;
  }

  async _promptsGet(params) {
    const { name, arguments: args = {} } = params || {};
    if (!name) throw protocol.mcpError(protocol.ERROR_CODES.INVALID_PARAMS, 'prompts/get requires { name }');
    const out = await this.prompts.get(name, args);
    if (!out) throw protocol.mcpError(protocol.ERROR_CODES.PROMPT_NOT_FOUND, `Unknown prompt: ${name}`);
    return out;
  }

  async _setLevel(params) {
    const lvl = params && params.level;
    // MCP defines `warning`; `warn` is accepted as a common shorthand alias.
    const valid = ['debug','info','notice','warning','warn','error','critical','alert','emergency'];
    if (!valid.includes(lvl)) throw protocol.mcpError(protocol.ERROR_CODES.INVALID_PARAMS, `Invalid log level: ${lvl}`);
    this.logLevel = lvl;
    return {};
  }

  async _shutdown() { this.state = 'closed'; this.emit('close'); return {}; }

  bind(transport) {
    this._transport = transport;
    transport.on('message', async msg => { const r = await this.handleMessage(msg); if (r) transport.send(r); });
    transport.on('close', () => { this.state = 'closed'; this.emit('close'); });
    return this;
  }
}

;

export { McpServer };
