---
title: BullMQ Workers & Queues
id: workers-queues
order: 9
---

# LAW MATE — BullMQ Workers & Queues

All agent work is processed asynchronously via **BullMQ** backed by Redis.

---

## Queue names and concurrency

| Queue name | Worker file | Concurrency | Description |
|------------|-------------|-------------|-------------|
| `legal-retrieval` | `workers/legal-retrieval.js` | 3 | Hybrid pgVector + BM25 search |
| `legal-analysis` | `workers/legal-analysis.js` | 2 | IRAC reasoning via Ollama |
| `legal-drafting` | `workers/legal-drafting.js` | 2 | Document generation |
| `legal-validation` | `workers/legal-validation.js` | 3 | Citation status check + Redis cache |
| `legal-debate` | `workers/legal-debate.js` | 1 | Three-agent moot court (resource-intensive) |
| `legal-privacy` | `workers/legal-privacy.js` | 4 | PII redaction (CPU-only, fast) |
| `legal-audit` | `workers/legal-audit.js` | 2 | Hash-chained audit log writes |
| `legal-orchestrator` | `workers/legal-orchestrator.js` | 1 | Pipeline fan-out coordinator |
| `legal-monitoring` | `workers/legal-monitoring.js` | 2 | Topic subscriptions + trend detection |
| `legal-indexing` | `workers/legal-indexing.js` | 2 | Embedding + pgVector upsert |
| `legal-testing` | `workers/legal-testing.js` | 1 | Gold eval + adversarial tests |

---

## Job priority

| Priority value | Use case |
|----------------|---------|
| 1 | Pro bono / urgent (`proBono: true`) |
| 5 | Interactive user requests |
| 10 | Standard background jobs |
| 20 | Batch indexing |

---

## Retry configuration

All workers use the default BullMQ retry policy:
- **Max attempts**: 3
- **Backoff**: exponential, starting at 1 000ms
- **Failed jobs**: moved to the failed set — inspect via `/health/queue`

---

## Monitoring queues

```bash
# Real-time queue depth
curl http://localhost:3001/health/queue

# Prometheus metrics
curl http://localhost:3001/metrics

# SSE live event stream
curl -N http://localhost:3001/api/events/stream
```

---

## Adding a new worker

1. Copy an existing worker: `cp workers/legal-retrieval.js workers/legal-myagent.js`
2. Change the queue name: `new Worker('legal-myagent', ...)`
3. Add the queue to `backend/queues/index.js`
4. Register the agent in `.openclaw/agents/index.ts`
5. Add the worker to `npm run workers:all` in `package.json`
