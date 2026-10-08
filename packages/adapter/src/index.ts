/**
 * @lawmate/adapter — Public API.
 */
export type { AdapterContext, AdapterResult } from './context.js';
export { BaseAdapter } from './base.js';
export { AdapterRegistry, type AdapterInfo } from './registry.js';
export { HttpLlmAdapter, OllamaLlmAdapter, type LlmChatRequest, type LlmChatResponse, type LlmProviderAdapter } from './llm.js';
export { InMemoryVectorAdapter, type VectorStoreAdapter } from './vector.js';
export { InMemoryStorageAdapter, type StorageAdapter } from './storage.js';