import { Queue, QueueEvents } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: (times: number) => Math.min(times * 500, 10_000),
}

function makeQueue(name: string) {
  const q = new Queue(name, { connection })
  q.on('error', () => {}) // suppress unhandled Redis retry noise
  return q
}

export const queues = {
  retrieval:    makeQueue('legal-retrieval'),
  analysis:     makeQueue('legal-analysis'),
  drafting:     makeQueue('legal-drafting'),
  validation:   makeQueue('legal-validation'),
  audit:        makeQueue('legal-audit'),
  orchestrator: makeQueue('legal-orchestrator'),
  copilot:      makeQueue('legal-copilot'),
  privacy:      makeQueue('legal-privacy'),
  debate:       makeQueue('legal-debate'),
  monitoring:   makeQueue('legal-monitoring'),
  indexing:     makeQueue('legal-indexing'),
testing:     makeQueue('legal-testing'),
  aiDeveloper:  makeQueue('ai-developer'),
  sandbox:      makeQueue('legal-sandbox'),
}
