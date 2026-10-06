import { isValidName, inferInputSchema } from './schema.js';


class ToolRegistry {
  constructor() { this.tools = new Map(); }

  register(tool) {
    if (!tool || !tool.name || typeof tool.handler !== 'function') {
      throw new Error('Tool must be { name, handler }');
    }
    if (!isValidName(tool.name)) throw new Error(`Invalid tool name: ${tool.name}`);
    if (this.tools.has(tool.name)) throw new Error(`Duplicate tool: ${tool.name}`);
    this.tools.set(tool.name, Object.freeze({ ...tool }));
    return this;
  }

  registerAll(list = []) { for (const t of list) this.register(t); return this; }

  get(name) { return this.tools.get(name) || null; }
  has(name) { return this.tools.has(name); }
  size() { return this.tools.size; }
  names() { return [...this.tools.keys()]; }

  list() {
    return [...this.tools.values()].map(t => ({
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema || inferInputSchema([])
    }));
  }

  async call(name, args = {}, ctx = {}) {
    const t = this.get(name);
    if (!t) return null;
    return t.handler(args || {}, ctx);
  }
}

;

export { ToolRegistry };
