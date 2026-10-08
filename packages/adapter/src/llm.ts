/**
 * @lawmate/adapter — LLM provider adapter.
 *
 * Adapts external LLM providers to the LAWMATE adapter contract.
 */
import { BaseAdapter } from './base.js';
import type { AdapterContext, AdapterResult } from './context.js';

export interface LlmChatRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LlmChatResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface LlmProviderAdapter {
  chat(request: LlmChatRequest, ctx: AdapterContext): Promise<AdapterResult<LlmChatResponse>>;
  embed(text: string, ctx: AdapterContext): Promise<AdapterResult<number[]>>;
  listModels(ctx: AdapterContext): Promise<AdapterResult<string[]>>;
}

export class HttpLlmAdapter extends BaseAdapter implements LlmProviderAdapter {
  readonly name = 'http-llm';
  readonly kind = 'llm';
  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string
  ) {
    super();
  }

  async chat(request: LlmChatRequest, ctx: AdapterContext): Promise<AdapterResult<LlmChatResponse>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          stream: request.stream ?? false,
        }),
        signal: ctx.signal,
      });
      if (!res.ok) throw new Error(`LLM provider returned ${res.status}`);
      const json = await res.json() as { choices: Array<{ message: { content: string } }>; model: string; usage?: { prompt_tokens: number; completion_tokens: number } };
      return {
        content: json.choices[0]?.message.content ?? '',
        model: json.model,
        usage: json.usage ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens } : undefined,
      };
    }, ctx);
  }

  async embed(text: string, ctx: AdapterContext): Promise<AdapterResult<number[]>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ model: 'embed', input: text }),
        signal: ctx.signal,
      });
      if (!res.ok) throw new Error(`Embedding provider returned ${res.status}`);
      const json = await res.json() as { data: Array<{ embedding: number[] }> };
      return json.data[0]?.embedding ?? [];
    }, ctx);
  }

  async listModels(ctx: AdapterContext): Promise<AdapterResult<string[]>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/v1/models`, {
        headers: this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {},
        signal: ctx.signal,
      });
      if (!res.ok) throw new Error(`Model listing returned ${res.status}`);
      const json = await res.json() as { data: Array<{ id: string }> };
      return json.data.map((m) => m.id);
    }, ctx);
  }
}

export class OllamaLlmAdapter extends BaseAdapter implements LlmProviderAdapter {
  readonly name = 'ollama-llm';
  readonly kind = 'llm';
  constructor(private readonly endpoint = 'http://localhost:11434') {
    super();
  }

  async chat(request: LlmChatRequest, ctx: AdapterContext): Promise<AdapterResult<LlmChatResponse>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
          },
          stream: request.stream ?? false,
        }),
        signal: ctx.signal,
      });
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const json = await res.json() as { message: { content: string }; model: string };
      return { content: json.message.content, model: json.model };
    }, ctx);
  }

  async embed(text: string, ctx: AdapterContext): Promise<AdapterResult<number[]>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'mxbai-embed-large', prompt: text }),
        signal: ctx.signal,
      });
      if (!res.ok) throw new Error(`Ollama embed returned ${res.status}`);
      const json = await res.json() as { embedding: number[] };
      return json.embedding;
    }, ctx);
  }

  async listModels(ctx: AdapterContext): Promise<AdapterResult<string[]>> {
    return this.run(async () => {
      const res = await fetch(`${this.endpoint}/api/tags`, { signal: ctx.signal });
      if (!res.ok) throw new Error(`Ollama tags returned ${res.status}`);
      const json = await res.json() as { models: Array<{ name: string }> };
      return json.models.map((m) => m.name);
    }, ctx);
  }
}