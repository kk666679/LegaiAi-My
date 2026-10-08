import { z } from 'zod';

export const ProviderTypeSchema = z.enum([
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'AZURE',
  'AWS_BEDROCK',
  'OLLAMA',
  'OPENROUTER',
  'CUSTOM',
]);

export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ExecutionModeSchema = z.enum(['HOSTED', 'BYOK', 'LOCAL']);

export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

export const ModelPricing: Record<string, { inputCostPer1M: number; outputCostPer1M: number }> = {
  'gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10 },
  'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
  'gpt-4-turbo': { inputCostPer1M: 10, outputCostPer1M: 30 },
  'o1-preview': { inputCostPer1M: 15, outputCostPer1M: 60 },
  'o1-mini': { inputCostPer1M: 3, outputCostPer1M: 12 },
  'claude-sonnet-4': { inputCostPer1M: 3, outputCostPer1M: 15 },
  'claude-opus-4': { inputCostPer1M: 15, outputCostPer1M: 75 },
  'claude-haiku-3-5': { inputCostPer1M: 0.8, outputCostPer1M: 4 },
  'gemini-pro-1.5': { inputCostPer1M: 1.25, outputCostPer1M: 5 },
  'gemini-flash-1.5': { inputCostPer1M: 0.075, outputCostPer1M: 0.3 },
  'openai/gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10 },
  'openai/gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
  'anthropic/claude-sonnet-4': { inputCostPer1M: 3, outputCostPer1M: 15 },
  'anthropic/claude-3.5-sonnet': { inputCostPer1M: 3, outputCostPer1M: 15 },
  'google/gemini-2.0-flash-001': { inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  'meta-llama/llama-3.3-70b-instruct': { inputCostPer1M: 0.23, outputCostPer1M: 0.4 },
};

export interface ProviderConfig {
  id: string;
  provider: ProviderType;
  name: string;
  apiKey: string;
  apiBaseUrl?: string;
  defaultModel: string;
  isActive: boolean;
  isDefault: boolean;
  executionMode: ExecutionMode;
  priority: number;
  orgId?: string;
  userId?: string;
}

export interface LLMResponse {
  text: string;
  confidence: number;
  model: string;
  provider: ProviderType;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
}

export interface LLMCallOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  provider?: ProviderType;
}

export interface ProviderStreamEvent {
  type: 'text' | 'done' | 'error';
  delta?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  error?: string;
}

export interface ProviderClient {
  provider: ProviderType;
  models: string[];
  verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean>;
  generate(options: LLMCallOptions): Promise<LLMResponse>;
  stream?(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): AsyncIterable<ProviderStreamEvent>;
  getTokenCount(text: string): number;
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = ModelPricing[model];
  if (!pricing) {
    const defaultInput = 1;
    const defaultOutput = 4;
    return ((promptTokens / 1_000_000) * defaultInput) + ((completionTokens / 1_000_000) * defaultOutput);
  }
  return ((promptTokens / 1_000_000) * pricing.inputCostPer1M) +
         ((completionTokens / 1_000_000) * pricing.outputCostPer1M);
}

export const SSRF_BLOCKED_HOSTS = [
  '169.254.169.254',
  '169.254.170.2',
  'metadata.google.internal',
  'metadata.azure.com',
  '100.100.100.200',
];

export function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SSRF_BLOCKED_HOSTS.includes(parsed.hostname);
  } catch {
    return true;
  }
}
