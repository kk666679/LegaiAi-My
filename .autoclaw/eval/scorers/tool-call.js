/**
 * eval/scorers/tool-call.js — Tool call presence scorer.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const toolCallScorer = {
  name: 'tool-call',
  async score({ output, expected }) {
    if (!expected?.tools || !output?.plan?.steps) {
      return { scorer: 'tool-call', value: 0, detail: 'Missing tool call data' };
    }
    const expectedTools = new Set(expected.tools);
    const actualTools = new Set(output.plan.steps.map((s) => s.tool).filter(Boolean));
    const intersection = [...expectedTools].filter((t) => actualTools.has(t));
    const value = intersection.length / expectedTools.size;
    return {
      scorer: 'tool-call',
      value,
      detail: `${intersection.length}/${expectedTools.size} expected tools called`,
    };
  }
};

export { toolCallScorer as toolCallScorer };
