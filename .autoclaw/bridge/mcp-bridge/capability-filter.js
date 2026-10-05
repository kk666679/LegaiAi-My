class CapabilityFilter {
  constructor() {
    this.allowed = new Set();
    this.blocked = new Set();
  }

  allow(toolName) {
    this.allowed.add(toolName);
  }

  block(toolName) {
    this.blocked.add(toolName);
  }

  filterTools(tools) {
    return tools.filter((tool) => {
      if (this.blocked.has(tool.name)) return false;
      return this.allowed.size === 0 || this.allowed.has(tool.name);
    });
  }
}

export { CapabilityFilter };
