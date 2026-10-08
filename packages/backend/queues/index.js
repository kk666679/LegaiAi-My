const { Queue } = require('bullmq')

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

const queues = {
  retrieval:    new Queue('legal-retrieval',    { connection }),
  analysis:     new Queue('legal-analysis',     { connection }),
  drafting:     new Queue('legal-drafting',     { connection }),
  validation:   new Queue('legal-validation',   { connection }),
  audit:        new Queue('legal-audit',        { connection }),
  orchestrator: new Queue('legal-orchestrator', { connection }),
  copilot:      new Queue('legal-copilot',      { connection }),
  privacy:      new Queue('legal-privacy',      { connection }),
  debate:       new Queue('legal-debate',       { connection }),
  monitoring:   new Queue('legal-monitoring',   { connection }),
  indexing:     new Queue('legal-indexing',     { connection }),
  testing:      new Queue('legal-testing',      { connection }),
  aiDeveloper:  new Queue('ai-developer',       { connection }),
}

module.exports = { queues }
