import { CapabilityFilter } from "./capability-filter.js";
import { ToolForwarder } from "./tool-forwarder.js";

class MCPBridge {
  constructor({ url, apiKey, defaultTimeout = 30000 } = {}) {
    this.url = url;
    this.apiKey = apiKey;
    this.defaultTimeout = defaultTimeout;
    this.capabilityFilter = new CapabilityFilter();
    this.client = null;
  }

  async initialize() {
    if (!this.url) {
      throw new Error("MCP server URL is required");
    }
    this.client = {
      connect: async () => {},
      listTools: async () => [],
      callTool: async (name, args) => ({ content: "" }),
    };
    await this.client.connect();
    return this;
  }

  async listTools() {
    if (!this.client) {
      await this.initialize();
    }
    const tools = await this.client.listTools();
    return this.capabilityFilter.filterTools(tools);
  }

  async callTool(name, args) {
    if (!this.client) {
      await this.initialize();
    }
    return this.client.callTool(name, args);
  }
}

export { MCPBridge };