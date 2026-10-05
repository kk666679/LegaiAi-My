import { CapabilityFilter } from "./capability-filter.js";

class MCPToolForwarder {
  constructor({ autoclawMcpUrl, token, capabilityFilter } = {}) {
    this.url = autoclawMcpUrl;
    this.token = token;
    this.filter = capabilityFilter || new CapabilityFilter();
  }

  async listTools() {
    if (!this.url) return [];
    const res = await fetch(`${this.url}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ method: 'tools/list' }),
    });
    if (!res.ok) {
      throw new Error(`Failed to list tools: ${res.status}`);
    }
    const { result } = await res.json();
    return result.tools.filter((tool) => !tool.name.startsWith('internal.'));
  }

  async callTool(name, args) {
    if (!this.url) {
      throw new Error('MCP URL is required');
    }
    const res = await fetch(`${this.url}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to call tool ${name}: ${res.status}`);
    }
    return res.json();
  }

  async registerWith(protocol) {
    try {
      const tools = await this.listTools();
      protocol.transport.send({
        jsonrpc: '2.0',
        method: 'mcp/tools/register',
        params: { tools, serverUrl: this.url },
      });
    } catch (error) {
      console.warn('Failed to register MCP tools with IDE:', error);
    }
  }
}

export { MCPToolForwarder };
