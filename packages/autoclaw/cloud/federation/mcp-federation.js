export class MCPFederation {
  constructor({ relay, auth }) {
    this.relay = relay;
    this.auth = auth;
    this.remoteServers = new Map();
    this.tools = new Map();
  }

  async register(servers) {
    for (const [name, url] of Object.entries(servers)) {
      try {
        const token = await this.auth.ensureFreshToken();
        const res = await this.relay.forward({
          target: url,
          message: { method: 'server/discover' },
          headers: { Authorization: `Bearer ${token}` },
        });

        this.remoteServers.set(name, {
          url,
          capabilities: res.capabilities ?? {},
          discovered_at: new Date().toISOString(),
        });

        // Cache tools from this server
        const toolsRes = await this.relay.forward({
          target: url,
          message: { method: 'tools/list' },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (toolsRes.tools) {
          for (const tool of toolsRes.tools) {
            this.tools.set(`${name}.${tool.name}`, { server: name, ...tool });
          }
        }

        console.log(`[cloud] Registered MCP server: ${name}`);
      } catch (error) {
        console.error(`[cloud] Failed to register ${name}:`, error.message);
      }
    }
  }

  async listTools() {
    const all = [];
    for (const [fqn, tool] of this.tools) {
      all.push({
        fullyQualifiedName: fqn,
        ...tool,
      });
    }
    return all;
  }

  async invoke(fullyQualifiedName, args) {
    const tool = this.tools.get(fullyQualifiedName);
    if (!tool) {
      throw new Error(`Unknown tool: ${fullyQualifiedName}`);
    }

    const serverInfo = this.remoteServers.get(tool.server);
    if (!serverInfo) {
      throw new Error(`Unknown server: ${tool.server}`);
    }

    const token = await this.auth.ensureFreshToken();
    return this.relay.forward({
      target: serverInfo.url,
      message: {
        method: 'tools/call',
        params: { name: tool.name, arguments: args },
      },
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getRemoteServers() {
    return Object.fromEntries(this.remoteServers);
  }

  getStatus() {
    return {
      servers: this.remoteServers.size,
      tools: this.tools.size,
      remoteServers: this.getRemoteServers(),
    };
  }
}
