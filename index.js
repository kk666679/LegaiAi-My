import ollama from 'ollama'

// Original snippet (raw ollama)
async function rawOllamaChat() {
  try {
    console.log('=== Raw Ollama ===')
    const response = await ollama.chat({
      model: 'minimax-m2.7:cloud',
      messages: [{ role: 'user', content: 'Hello!' }],
    })
    console.log(response.message.content)
  } catch (error) {
    console.error('Raw Ollama error:', error.message)
    console.error('Tip: Run "ollama serve" and "ollama pull minimax-m2.7:cloud" first')
  }
}

// OpenRouter example (chat/completions)
async function openRouterChat() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.log('\n=== OpenRouter ===')
    console.warn('OPENROUTER_API_KEY is not set; skipping OpenRouter call.')
    return
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions'
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const payload1 = {
    preset: '@preset/kurnia',
    model: 'meta-llama/llama-3.2-3b-instruct',
    messages: [{ role: 'user', content: 'Hello! How are you today?' }],
  }

  const payload2 = {
    model: 'meta-llama/llama-3.2-3b-instruct@preset/kurnia',
    messages: [{ role: 'user', content: 'Hello! How are you today?' }],
  }

  try {
    console.log('\n=== OpenRouter (preset separate) ===')
    const response1 = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload1),
    })
    const data1 = await response1.json()
    console.log(data1)

    console.log('\n=== OpenRouter (preset in model) ===')
    const response2 = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload2),
    })
    const data2 = await response2.json()
    console.log(data2)
  } catch (err) {
    console.error('OpenRouter error:', err?.message ?? String(err))
  }
}

// Start tRPC server (if not running api:dev)
if (process.env.npm_lifecycle_script !== 'api:dev' && !process.env.API_DEV) {
  console.log('Starting tRPC/pgVector server...')
  await import('./src/server.js')
}

console.log('Running original Ollama snippet...')
await rawOllamaChat()

await openRouterChat()

console.log('\n✅ Original snippet ready. To test: npm start (after ollama setup)')

// AI LLM Developer Agent Demo with BullMQ
import { aiAgentQueue } from './queues/ai-agent.js'

async function demoAgentJob() {
  console.log('\n=== AI LLM Developer Agent Demo ===')
  try {
    const job = await aiAgentQueue.add('ai-developer', {
      task: 'How to build a production RAG system with vector DB and LangChain?',
    })
    console.log(`Demo job enqueued: ID ${job.id}`)
    console.log('Check worker logs for processing (ML analysis + LLM expert response).')
  } catch (error) {
    console.error('Queue error:', error.message)
    console.error('Tip: Ensure Redis running (npm run redis or docker compose up -d)')
  }
}

await demoAgentJob()

// TanStack AI-Ollama example (commented - install separately)
// import { createOllama } from '@tanstack/ai-ollama'
//
// async function tanstackOllamaChat() {
//   const adapter = createOllama('llama3')
//   const { text } = await adapter.chat({
//     messages: [{ role: 'user', content: 'Hello TanStack!' }]
//   })
//   console.log(text)
// }

