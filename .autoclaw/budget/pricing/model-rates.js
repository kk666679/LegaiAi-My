export const MODEL_RATES = {
  // August 2026 rates (per 1M tokens)
  'claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'claude-haiku-4.5': { input: 0.80, output: 4.00 },
  'gpt-5': { input: 5.00, output: 20.00 },
  'gpt-5-mini': { input: 0.50, output: 2.00 },
  'gemini-3-pro': { input: 2.50, output: 10.00 },
  'llama-4-70b': { input: 0.30, output: 0.60 },
  'deepseek-v4': { input: 0.20, output: 0.80 },
};

export function estimateCost({ model, tokensIn = 0, tokensOut = 0 }) {
  const rate = MODEL_RATES[model];
  if (!rate) throw new Error(`Unknown model: ${model}`);
  return (tokensIn / 1_000_000) * rate.input + (tokensOut / 1_000_000) * rate.output;
}

export function estimateVideoCost({ provider, seconds }) {
  // This would be in video-rates.js
  throw new Error('Video rates not implemented yet');
}

export function estimateToolCost({ tool, duration = 1 }) {
  // This would be in tool-rates.js
  throw new Error('Tool rates not implemented yet');
}