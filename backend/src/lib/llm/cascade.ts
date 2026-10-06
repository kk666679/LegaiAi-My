import ollama from 'ollama';
import { circuitBreaker } from '../resilience/circuitBreaker';
import { getCachedOrFetch } from '../cache/predictiveCache';
import { credentialStore } from '../security/credentialStore';
import { createProviderClient } from '../providers/factory';
import type { ProviderType, LLMResponse } from '../providers/types';
import { prisma } from '../../db';

const SMALL_MODEL = process.env.LLM_MODEL_FALLBACK || 'llama3.2:1b';
const LARGE_MODEL = process.env.LLM_MODEL || 'minimax-m2.7:cloud';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

async function callOllama(model: string, prompt: string): Promise<string> {
  const res = await ollama.chat({ model, messages: [{ role: 'user', content: prompt }] });
  return res.message.content;
}

function estimateConfidence(answer: string, prompt: string): number {
  const hasHedge = /\b(unclear|uncertain|may|might|possibly|I think|not sure)\b/i.test(answer);
  const hasLegalTerms = /\b(held|ratio|court|judgment|section|article|act)\b/i.test(answer);
  const lengthScore = Math.min(answer.length / 500, 1);
  return parseFloat(((hasLegalTerms ? 0.4 : 0.1) + (hasHedge ? 0 : 0.3) + lengthScore * 0.3).toFixed(3));
}

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  cacheKey?: string;
  orgId?: string;
  userId?: string;
  provider?: ProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  credentialId?: string;
}

export async function generateWithCascade(
  prompt: string,
  cacheKey?: string
): Promise<{ text: string; confidence: number; model: string }> {
  const fetchFn = async () => {
    const smallAnswer = await circuitBreaker.call(
      'llm',
      () => callOllama(SMALL_MODEL, prompt),
      async () => ''
    );

    if (smallAnswer) {
      const conf = estimateConfidence(smallAnswer, prompt);
      if (conf >= 0.8) return { text: smallAnswer, confidence: conf, model: SMALL_MODEL };
    }

    const largeAnswer = await circuitBreaker.call(
      'llm',
      () => callOllama(LARGE_MODEL, prompt),
      async () => 'LLM unavailable — please try again later.'
    );
    return { text: largeAnswer, confidence: estimateConfidence(largeAnswer, prompt), model: LARGE_MODEL };
  };

  if (cacheKey) return getCachedOrFetch(cacheKey, fetchFn, 1800);
  return fetchFn();
}

export async function generateWithProvider(options: GenerateOptions): Promise<LLMResponse> {
  const { prompt, systemPrompt, orgId, userId, provider, model, temperature, maxTokens, credentialId } = options;

  if (credentialId) {
    const credential = await credentialStore.retrieve(credentialId, userId, orgId);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const client = createProviderClient(credential.provider);
    const response = await client.generate({
      prompt,
      systemPrompt,
      model: model || credential.defaultModel,
      temperature,
      maxTokens,
    });

    return response;
  }

  if (provider) {
    const client = createProviderClient(provider);
    const response = await client.generate({
      prompt,
      systemPrompt,
      model,
      temperature,
      maxTokens,
    });

    return response;
  }

  const credentials = await credentialStore.list(orgId, userId);
  const defaultCred = credentials.find((c) => c.isDefault) || credentials.find((c) => c.isActive);

  if (defaultCred) {
    const credential = await credentialStore.retrieve(defaultCred.id, userId, orgId);
    if (credential) {
      const client = createProviderClient(credential.provider);
      return client.generate({ prompt, systemPrompt, model: model || credential.defaultModel, temperature, maxTokens });
    }
  }

  return generateLocal(prompt, systemPrompt, model);
}

export async function generateLocal(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<LLMResponse> {
  const start = Date.now();
  const modelName = model || SMALL_MODEL;

  const response = await ollama.chat({
    model: modelName,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ],
  });

  const text = response.message.content;
  const latencyMs = Date.now() - start;
  const promptTokens = Math.ceil((systemPrompt || '').length / 4) + Math.ceil(prompt.length / 4);
  const completionTokens = Math.ceil(text.length / 4);

  return {
    text,
    confidence: estimateConfidence(text, prompt),
    model: modelName,
    provider: 'OLLAMA' as ProviderType,
    promptTokens,
    completionTokens,
    costUsd: 0,
    latencyMs,
  };
}

export async function generateWithRouting(
  options: GenerateOptions & { taskType?: 'CLASSIFICATION' | 'RETRIEVAL' | 'ANALYSIS' | 'DRAFTING' | 'REASONING' }
): Promise<LLMResponse> {
  const { taskType, orgId, userId } = options;

  if (taskType) {
    const configs = await prisma.modelRoutingConfig.findMany({
      where: { orgId: orgId || undefined, taskType, isActive: true },
      orderBy: { priority: 'desc' },
    });

    if (configs.length > 0) {
      const config = configs[0]!
      if (config.provider && config.model) {
        const credentials = await credentialStore.list(orgId, userId);
        const cred = credentials.find((c) => c.provider === config.provider && c.isActive);
        if (cred) {
          const credential = await credentialStore.retrieve(cred.id, userId, orgId);
          if (credential) {
            const client = createProviderClient(credential.provider);
            return client.generate({
              prompt: options.prompt,
              systemPrompt: options.systemPrompt,
              model: config.model,
              temperature: options.temperature,
              maxTokens: options.maxTokens,
            });
          }
        }
      }
    }
  }

  return generateWithProvider(options);
}
