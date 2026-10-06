import { Worker } from 'bullmq';
import ollama from 'ollama';

const worker = new Worker('ai-developer', async (job) => {
  const { task, context = '' } = job.data;
  console.log(`[AI-DEVELOPER] Processing task: ${task}`);

  const response = await ollama.chat({
    model: process.env.LLM_MODEL || 'llama3.1',
    messages: [{ role: 'user', content: `You are an AI & LLM Application Developer expert. User task: "${task}".\n\nContext: ${context}\n\nProvide production-ready advice on building AI apps (RAG, agents, vector DBs). Include code snippets if relevant.` }],
  });

  return { llm_response: response.message.content, complete: true };
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

worker.on('completed', (job, result) => console.log(`[AI-DEVELOPER] Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[AI-DEVELOPER] Job ${job.id} failed:`, err));
console.log('[AI-DEVELOPER] Worker started, waiting for jobs...');
