import { openai } from '@ai-sdk/openai';
import { deepinfra } from '@ai-sdk/deepinfra';

export const MODEL = process.env.LLM_MODEL ?? process.env.AI_MODEL ?? 'gpt-4o-mini';

export function getModel() {
  const id = MODEL.toLowerCase();
  if (id.startsWith('meta-llama/') || id.startsWith('mistralai/') || id.startsWith('deepseek-ai/')) {
    return deepinfra(MODEL);
  }
  return openai(MODEL);
}

export { openai, deepinfra };
