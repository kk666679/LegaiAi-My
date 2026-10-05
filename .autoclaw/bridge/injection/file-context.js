class FileContextInjector {
  constructor(opts = {}) {
    this.agent = agent;
  }

  async injectFileContext(sessionId, filePath) {
    const content = await this.agent.readFile(filePath);
    const context = `File: ${filePath}\n\`\`\`\n${content}\n\`\`\``;
    return this.agent.inject(sessionId, context);
  }

  async injectMultiple(sessionId, files) {
    const contexts = [];
    for (const file of files) {
      const content = await this.agent.readFile(file);
      contexts.push({
        file,
        content,
        truncated: content.length > 2000 ? content.slice(0, 2000) + '...' : content,
      });
    }
    return this.agent.inject(sessionId, contexts);
  }
}

export { FileContextInjector };
