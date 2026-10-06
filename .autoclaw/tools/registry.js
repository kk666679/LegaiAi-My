const tools = new Map();

function register(name, tool) {
  if (!name || typeof name !== 'string') {
    throw new Error('toolRegistry.register requires a string name');
  }
  if (!tool || typeof tool.handler !== 'function') {
    throw new Error(`tool "${name}" must provide a handler(input, deps) function`);
  }
  tools.set(name, { name, ...tool });
  return tools.get(name);
}

function get(name) {
  return tools.get(name);
}

function has(name) {
  return tools.has(name);
}

function list() {
  return [...tools.keys()];
}

export const toolRegistry = { register, get, has, list };
