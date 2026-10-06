const DEFAULT_SYSTEM = 'You are a careful legal-assistant agent. Follow the task, keep answers grounded, and ask for approval before risky actions.';

async function complete({ prompt, system = DEFAULT_SYSTEM, responseFormat = 'text', maxTokens = 512 } = {}) {
  const text = [system, '', prompt].filter(Boolean).join('\n\n');
  if (responseFormat === 'json') {
    return JSON.stringify({ ok: true, text, maxTokens, model: 'stub-llm' });
  }
  return text.slice(0, maxTokens || text.length);
}

async function chat({ prompt, system = DEFAULT_SYSTEM } = {}) {
  return complete({ prompt, system, responseFormat: 'text' });
}

const llm = { complete, chat };

export { llm, complete, chat };
export default llm;
