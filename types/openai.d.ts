declare module 'openai' {
  export type ChatCompletionMessageParam = {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    name?: string
  }

  export type ChatCompletionCreateParams = {
    model: string
    messages: ChatCompletionMessageParam[]
    temperature?: number
    max_tokens?: number
  }

  export class OpenAI {
    constructor(config: { apiKey?: string; baseURL?: string })
    chat: {
      completions: {
        create(params: ChatCompletionCreateParams): Promise<{
          choices: { message: { content?: string } }[]
          usage?: { prompt_tokens?: number; completion_tokens?: number }
        }>
      }
    }
    models: {
      list(): Promise<{ data: { id: string }[] }>
    }
  }

  export default OpenAI
}
