class SelectionContextInjector {
  constructor(opts = {}) {
    this.agent = agent;
  }

  async injectSelection(sessionId, selection) {
    const context = `Selection (${selection.start.line + 1}:${selection.start.character} to ${selection.end.line + 1}:${selection.end.character}):\n\n${selection.text}`;
    return this.agent.inject(sessionId, context);
  }

  async injectWithFile(sessionId, selection, filePath) {
    const selectionContext = await this.injectSelection(sessionId, selection);
    const fileContent = await this.agent.readFile(filePath);
    const fullContext = `
File: ${filePath}
Selection: (${selection.start.line + 1}:${selection.start.character} to ${selection.end.line + 1}:${selection.end.character})

${selection.text}

--- File Content (truncated if needed) ---
${fileContent.length > 2000 ? fileContent.slice(0, 2000) + '...' : fileContent}
`;
    return this.agent.inject(sessionId, fullContext);
  }
}

export { SelectionContextInjector };
