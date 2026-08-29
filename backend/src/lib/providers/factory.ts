import { ProviderType, ProviderClient, LLMResponse, isBlockedUrl } from './types';
import { LLMCallOptions } from './types';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export class OpenAIProvider implements ProviderClient {
  provider: ProviderType = 'OPENAI';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'];

  async verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean> {
    try {
      if (apiBaseUrl && isBlockedUrl(apiBaseUrl)) {
        return false;
      }
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey, baseURL: apiBaseUrl });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async generate(options: LLMCallOptions & { apiKey?: string }): Promise<LLMResponse> {
    const start = Date.now();
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: options.apiKey || 'dummy',
      baseURL: (options as any).apiBaseUrl,
    });

    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });

    const text = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    const latencyMs = Date.now() - start;

    return {
      text,
      confidence: 0.9,
      model: options.model || 'gpt-4o',
      provider: this.provider,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      costUsd: 0,
      latencyMs,
    };
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export class AnthropicProvider implements ProviderClient {
  provider: ProviderType = 'ANTHROPIC';
  models = ['claude-sonnet-4', 'claude-opus-4', 'claude-haiku-3-5'];

  async verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean> {
    try {
      if (apiBaseUrl && isBlockedUrl(apiBaseUrl)) {
        return false;
      }
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey, baseURL: apiBaseUrl });
      await client.messages.create({
        model: 'claude-haiku-3-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async generate(options: LLMCallOptions & { apiKey?: string }): Promise<LLMResponse> {
    const start = Date.now();
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: options.apiKey || '' });

    const response = await client.messages.create({
      model: options.model || 'claude-sonnet-4',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const latencyMs = Date.now() - start;
    const usage = response.usage;

    return {
      text,
      confidence: 0.9,
      model: options.model || 'claude-sonnet-4',
      provider: this.provider,
      promptTokens: usage.input_tokens || 0,
      completionTokens: usage.output_tokens || 0,
      costUsd: 0,
      latencyMs,
    };
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export class OllamaProvider implements ProviderClient {
  provider: ProviderType = 'OLLAMA';
  models = ['llama3.2:1b', 'llama3.1', 'mixtral', 'mistral'];

  async verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean> {
    try {
      const url = apiBaseUrl || OLLAMA_URL;
      const response = await fetch(`${url}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(options: LLMCallOptions): Promise<LLMResponse> {
    const start = Date.now();
    const url = OLLAMA_URL;

    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'llama3.2:1b',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: options.prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    const text = data.message?.content || '';
    const latencyMs = Date.now() - start;

    const promptTokens = Math.ceil(((options.systemPrompt || '') + options.prompt).length / 4);
    const completionTokens = Math.ceil(text.length / 4);

    return {
      text,
      confidence: 0.8,
      model: options.model || 'llama3.2:1b',
      provider: this.provider,
      promptTokens,
      completionTokens,
      costUsd: 0,
      latencyMs,
    };
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export class AzureProvider implements ProviderClient {
  provider: ProviderType = 'AZURE';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

  async verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean> {
    if (!apiBaseUrl) return false;
    if (isBlockedUrl(apiBaseUrl)) return false;
    try {
      const response = await fetch(`${apiBaseUrl}/openai/deployments?api-version=2024-02-01`, {
        headers: { 'api-key': apiKey },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): Promise<LLMResponse> {
    const start = Date.now();
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: options.apiKey || '', baseURL: options.apiBaseUrl });

    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
    });

    const text = response.choices[0]?.message?.content || '';
    const latencyMs = Date.now() - start;

    return {
      text,
      confidence: 0.9,
      model: options.model || 'gpt-4o',
      provider: this.provider,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      costUsd: 0,
      latencyMs,
    };
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export function createProviderClient(type: ProviderType): ProviderClient {
  switch (type) {
    case 'OPENAI':
      return new OpenAIProvider();
    case 'ANTHROPIC':
      return new AnthropicProvider();
    case 'OLLAMA':
      return new OllamaProvider();
    case 'AZURE':
      return new AzureProvider();
    case 'GOOGLE':
    case 'AWS_BEDROCK':
    case 'OPENROUTER':
    case 'CUSTOM':
      return new OpenAIProvider();
    default:
      return new OllamaProvider();
  }
}
