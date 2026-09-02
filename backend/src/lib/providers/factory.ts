import { ProviderType, ProviderClient, LLMResponse, isBlockedUrl, ProviderStreamEvent } from './types';
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

  async *stream(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): AsyncIterable<ProviderStreamEvent> {
    const start = Date.now();
    const baseUrl = (options.apiBaseUrl ?? '').replace(/\/$/, '') || 'https://api.openai.com/v1';
    if (isBlockedUrl(baseUrl)) {
      yield { type: 'error', error: 'Endpoint blocked' };
      return;
    }
    const messages: { role: 'system' | 'user'; content: string }[] = [];
    if (options.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content: options.prompt });

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiKey ?? ''}`,
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o-mini',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          stream: true,
        }),
      });
    } catch (err: any) {
      yield { type: 'error', error: 'Network failure' };
      return;
    }

    if (!res.ok || !res.body) {
      yield { type: 'error', error: `Upstream ${res.status}` };
      return;
    }

    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completionTokens = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) {
              completionTokens += 1;
              yield { type: 'text', delta };
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } finally {
      reader.releaseLock?.();
    }

    yield {
      type: 'done',
      model: options.model || 'gpt-4o-mini',
      promptTokens: Math.ceil((options.prompt.length + (options.systemPrompt?.length ?? 0)) / 4),
      completionTokens,
      latencyMs: Date.now() - start,
    };
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

  async *stream(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): AsyncIterable<ProviderStreamEvent> {
    const start = Date.now();
    const url = (options.apiBaseUrl ?? '').replace(/\/$/, '') || OLLAMA_URL;
    if (isBlockedUrl(url)) {
      yield { type: 'error', error: 'Endpoint blocked' };
      return;
    }
    let res: Response;
    try {
      res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'llama3.2:1b',
          messages: [
            ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: options.prompt },
          ],
          stream: true,
        }),
      });
    } catch {
      yield { type: 'error', error: 'Network failure' };
      return;
    }

    if (!res.ok || !res.body) {
      yield { type: 'error', error: `Upstream ${res.status}` };
      return;
    }

    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completionTokens = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const json = JSON.parse(line);
            const delta = json?.message?.content ?? '';
            if (delta) {
              completionTokens += 1;
              yield { type: 'text', delta };
            }
          } catch {
            // ignore malformed NDJSON chunk
          }
        }
      }
    } finally {
      reader.releaseLock?.();
    }

    yield {
      type: 'done',
      model: options.model || 'llama3.2:1b',
      promptTokens: Math.ceil((options.prompt.length + (options.systemPrompt?.length ?? 0)) / 4),
      completionTokens,
      latencyMs: Date.now() - start,
    };
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

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_APP_URL = process.env.OPENROUTER_APP_URL || process.env.APP_URL || '';
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME || 'LawMate';

export class OpenRouterProvider implements ProviderClient {
  provider: ProviderType = 'OPENROUTER';
  models = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3.3-70b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'mistralai/mistral-large-latest',
  ];

  private buildHeaders(apiKey: string, extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (OPENROUTER_APP_URL) headers['HTTP-Referer'] = OPENROUTER_APP_URL;
    if (OPENROUTER_APP_NAME) headers['X-Title'] = OPENROUTER_APP_NAME;
    return { ...headers, ...(extra || {}) };
  }

  async verifyCredential(apiKey: string, apiBaseUrl?: string): Promise<boolean> {
    const base = (apiBaseUrl ?? '').replace(/\/$/, '') || OPENROUTER_BASE_URL;
    if (isBlockedUrl(base)) return false;
    if (!apiKey) return false;
    try {
      const res = await fetch(`${base}/auth`, { headers: this.buildHeaders(apiKey) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): Promise<LLMResponse> {
    const start = Date.now();
    const base = (options.apiBaseUrl ?? '').replace(/\/$/, '') || OPENROUTER_BASE_URL;
    if (isBlockedUrl(base)) {
      throw new Error('Endpoint blocked');
    }
    if (!options.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (options.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content: options.prompt });

    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(options.apiKey),
      body: JSON.stringify({
        model: options.model || 'openai/gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string | null } }[];
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
    };

    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};
    return {
      text,
      confidence: 0.9,
      model: data.model || options.model || 'openai/gpt-4o-mini',
      provider: this.provider,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      costUsd: usage.cost || 0,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(options: LLMCallOptions & { apiKey?: string; apiBaseUrl?: string }): AsyncIterable<ProviderStreamEvent> {
    const start = Date.now();
    const base = (options.apiBaseUrl ?? '').replace(/\/$/, '') || OPENROUTER_BASE_URL;
    if (isBlockedUrl(base)) {
      yield { type: 'error', error: 'Endpoint blocked' };
      return;
    }
    if (!options.apiKey) {
      yield { type: 'error', error: 'OPENROUTER_API_KEY is required' };
      return;
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (options.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content: options.prompt });

    let res: Response;
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(options.apiKey),
        body: JSON.stringify({
          model: options.model || 'openai/gpt-4o-mini',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          stream: true,
        }),
      });
    } catch {
      yield { type: 'error', error: 'Network failure' };
      return;
    }

    if (!res.ok || !res.body) {
      yield { type: 'error', error: `Upstream ${res.status}` };
      return;
    }

    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completionTokens = 0;
    let model = options.model || 'openai/gpt-4o-mini';
    let promptTokens = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            if (json?.model) model = json.model;
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) {
              completionTokens += 1;
              yield { type: 'text', delta };
            }
            if (json?.usage) {
              promptTokens = json.usage.prompt_tokens || promptTokens;
              completionTokens = json.usage.completion_tokens || completionTokens;
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } finally {
      reader.releaseLock?.();
    }

    yield {
      type: 'done',
      model,
      promptTokens: promptTokens || Math.ceil((options.prompt.length + (options.systemPrompt?.length ?? 0)) / 4),
      completionTokens,
      latencyMs: Date.now() - start,
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
    case 'OPENROUTER':
      return new OpenRouterProvider();
    case 'GOOGLE':
    case 'AWS_BEDROCK':
    case 'CUSTOM':
      return new OpenAIProvider();
    default:
      return new OllamaProvider();
  }
}
