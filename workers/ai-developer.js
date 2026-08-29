import { Worker } from 'bullmq';
import ollama from 'ollama';
import { pipeline } from '@xenova/transformers';
import * as tf from '@tensorflow/tfjs-node';
import { aiAgentQueue } from '../queues/ai-agent.js';

const worker = new Worker('ai-developer', async (job) => {
  const { task, context = '' } = job.data;

  console.log(`[AI-DEVELOPER] Processing task: ${task}`);

  // Step 1: Transformers.js - Analyze sentiment/task type
  const sentiment = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  const analysis = await sentiment(task);
  console.log('[ML] Analysis:', analysis);

  // Step 2: TF.js - Simple tensor op example (e.g., normalize dummy embedding)
  const dummyEmbedding = tf.tensor1d([0.1, 0.8, 0.3]);
  const normalized = dummyEmbedding.div(dummyEmbedding.max()).arraySync();
  console.log('[TF.js] Normalized embedding:', normalized);

  // Step 3: Ollama LLM as AI LLM Developer expert
  const prompt = `You are an AI & LLM Application Developer expert. User task: "${task}".

Context/analysis: ${JSON.stringify(analysis)}

Provide production-ready advice on building AI apps (OpenAI, LangChain, RAG, agents, vector DBs).

Include code snippets if relevant.`;

  const response = await ollama.chat({
    model: process.env.LLM_MODEL || 'minimax-m2.7:cloud',
    messages: [{ role: 'user', content: prompt }],
    
  });

  const llmResponse = response.message.content;

  console.log('[LLM] Response:', llmResponse);

  // Optional: Enqueue follow-up if complex
  // if (needsFollowup) aiAgentQueue.add('followup', { task: nextTask });

  return {
    analysis,
    normalized_embedding: normalized,
    llm_response: llmResponse,
    complete: true,
  };
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

worker.on('completed', (job, result) => {
  console.log(`[AI-DEVELOPER] Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[AI-DEVELOPER] Job ${job.id} failed:`, err);
});

console.log('[AI-DEVELOPER] Worker started, waiting for jobs...');
