# LAW MATE — Backend

Express 5 + tRPC 11 API server with BullMQ agent workers, pgVector RAG, RBAC, HITL controls, and AI governance.

---

## Quick Start

```bash
# From repo root
npm run api:dev          # Backend only — http://localhost:3001

# Or from this directory
npm run start:dev        # tsx watch src/server.ts
```

Requires PostgreSQL+pgVector and Redis running (see root `docker compose up -d`).

---

## Endpoints

### Health & Observability

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Uptime, timestamp |
| GET | `/health/db` | PostgreSQL connectivity, vector doc count |
| GET | `/health/ollama` | Ollama reachability, loaded models |
| GET | `/health/queue` | BullMQ queue depths — `healthy` / `degraded` |
| GET | `/metrics` | Prometheus text format — requests, errors, uptime, queue states |
| GET | `/index/stats` | Vector index freshness per collection |

### AI & Agent APIs

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai-chat` | Streaming SSE chat via TanStack AI + Ollama |
| POST | `/api/agent/query` | Full RAG query — retrieval → LLM cascade → provenance graph |
| POST | `/api/feedback` | RLHF feedback — stores rating/comment in audit log |
| GET | `/api/events/stream` | SSE live event stream from Redis (agent mesh dashboard) |
| GET | `/api/circuit-breaker` | Circuit breaker state and stats |

### Data APIs

| Method | Path | Description |
|---|---|---|
| GET | `/audit` | Audit logs — filterable by `traceId`, `agentName`, `limit` |
| GET | `/api/debates` | Debate transcripts list |
| GET | `/api/debates/:id` | Single debate transcript with full rounds |
| GET | `/api/drafts` | Draft documents list — filterable by `userId` |
| GET | `/api/drafts/:id` | Single draft document with full content |

### tRPC

All tRPC procedures are available at `/trpc` via the standard tRPC Express adapter.

---

## tRPC Routers

### `auth`
Session-based authentication.

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `auth.register` | mutation | public | Create user account |
| `auth.login` | mutation | public | Authenticate, return session token |
| `auth.logout` | mutation | protected | Invalidate session |
| `auth.me` | query | protected | Current user profile |

### `agents`
BullMQ job dispatch for all 12 agents.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `agents.retrieve` | mutation | `run_agents` | Enqueue pgVector semantic search |
| `agents.analyse` | mutation | `run_agents` | Enqueue IRAC analysis |
| `agents.draft` | mutation | `edit_document` | Enqueue document drafting |
| `agents.validate` | mutation | `run_agents` | Enqueue citation validation |
| `agents.auditAction` | mutation | `view_audit_log` | Enqueue audit action (legal hold, forget-user) |
| `agents.orchestrate` | mutation | `run_agents` | Enqueue full workflow (retrieval → analysis → drafting) |
| `agents.privacy` | mutation | `run_agents` | Enqueue PII redaction / consent management |
| `agents.debate` | mutation | `run_agents` | Enqueue multi-agent debate |
| `agents.monitor` | mutation | protected | Enqueue monitoring action (subscribe, trend, alert) |
| `agents.index` | mutation | `create_case` | Enqueue document indexing |
| `agents.runGoldEval` | mutation | `manage_users` | Run gold evaluation dataset |
| `agents.runAdversarial` | mutation | `manage_users` | Run adversarial test vectors |
| `agents.runBenchmark` | mutation | `manage_users` | Run performance benchmark |
| `agents.getAuditLogs` | query | `view_audit_log` | Fetch audit logs with filters |
| `agents.indexStats` | query | public | Vector index stats |
| `agents.queueHealth` | query | public | BullMQ queue depths |

### `matters`
Full matter lifecycle management.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `matters.list` | query | protected | Paginated matter list with filters |
| `matters.getById` | query | protected | Matter with client, contracts, actions, alerts, timeline |
| `matters.create` | mutation | `create_case` | Create matter with auto-generated matter number |
| `matters.update` | mutation | `edit_document` | Update status, priority, risk, deadline |
| `matters.addEvent` | mutation | protected | Add timeline event, updates `lastActivityAt` |
| `matters.getTimeline` | query | protected | Timeline events with date range and type filters |
| `matters.getAlerts` | query | protected | Proactive alerts — filterable by severity |
| `matters.acknowledgeAlert` | mutation | protected | Mark alert acknowledged |
| `matters.getRiskScores` | query | protected | Risk scores for a matter |
| `matters.getAttentionRequired` | query | protected | Matters with deadlines ≤8d, stale ≥21d, critical alerts |
| `matters.stats` | query | protected | Counts by status, type, priority |

### `clients`
Client registry with conflict checking.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `clients.list` | query | protected | Paginated client list with search |
| `clients.getById` | query | protected | Client with matters and contracts |
| `clients.create` | mutation | `create_case` | Create client with conflict-check flag |
| `clients.update` | mutation | `edit_document` | Update client details |
| `clients.search` | query | protected | Full-text search across name, email, company |

### `contracts`
Contract lifecycle management.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `contracts.list` | query | protected | Paginated contracts with expiry filter |
| `contracts.getById` | query | protected | Contract with matter and client |
| `contracts.create` | mutation | `edit_document` | Create contract |
| `contracts.update` | mutation | `edit_document` | Update status, risk, obligations |
| `contracts.getExpiring` | query | protected | Contracts expiring within N days |

### `hitl`
Human-in-the-loop agent action authorization.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `hitl.listPending` | query | protected | Pending actions requiring approval (authLevel ≥ 2) |
| `hitl.listAll` | query | protected | All actions with cursor pagination |
| `hitl.getById` | query | protected | Single action with full evidence |
| `hitl.approve` | mutation | `approve_agent_action` | Approve action — blocked for level 5 |
| `hitl.reject` | mutation | `approve_agent_action` | Reject action with mandatory reason |
| `hitl.register` | mutation | protected | Register new agent action (called by agents) |
| `hitl.stats` | query | protected | Counts by status, agent, auth level |

### `governance`
AI governance, kill switch, cost analytics.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `governance.getKillSwitchStatus` | query | protected | Kill switch state, activated by/at |
| `governance.activateKillSwitch` | mutation | `manage_users` | Disable all autonomous operations |
| `governance.deactivateKillSwitch` | mutation | `manage_users` | Re-enable autonomous operations |
| `governance.getLogs` | query | `view_audit_log` | Governance event log with filters |
| `governance.logEvent` | mutation | protected | Log MODEL_USED, HALLUCINATION, SECURITY, etc. |
| `governance.getCostAnalytics` | query | `view_audit_log` | Token usage and cost by model/user/matter |
| `governance.getDashboard` | query | `view_audit_log` | Summary: pending approvals, hallucinations, security events, cost |

### `vectors`
pgVector document management.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `vectors.search` | query | protected | Semantic search with court/date/language filters |
| `vectors.upsert` | mutation | `create_case` | Insert or update vector document |
| `vectors.delete` | mutation | `delete_document` | Remove vector document |
| `vectors.collections` | query | protected | List all collections with counts |

### `embeddings`
Embedding generation.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `embeddings.generate` | mutation | `run_agents` | Generate embedding via Ollama mxbai-embed-large |
| `embeddings.batchGenerate` | mutation | `run_agents` | Batch embedding generation |

### `documents`
Legal document CRUD.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `documents.list` | query | protected | Paginated documents with type/status filters |
| `documents.getById` | query | protected | Single document |
| `documents.create` | mutation | `edit_document` | Create legal document |
| `documents.update` | mutation | `edit_document` | Update content, status, version |
| `documents.delete` | mutation | `delete_document` | Soft delete |

### `debate`
Debate transcript management.

| Procedure | Type | Permission | Description |
|---|---|---|---|
| `debate.list` | query | protected | Recent debate transcripts |
| `debate.getById` | query | protected | Full transcript with rounds |
| `debate.create` | mutation | `run_agents` | Create debate record |

---

## Authentication

Token-based sessions. All protected procedures require `Authorization: Bearer <token>`.

```
POST /trpc/auth.login
→ { token: "abc123..." }

# Subsequent requests:
Authorization: Bearer abc123...
X-Trace-Id: <uuid>   # optional — auto-generated if absent
```

Session TTL: 7 days. Passwords: HMAC-SHA256 with random salt.

---

## RBAC

Four roles with granular permissions:

```
admin      → all permissions
lawyer     → create_case, edit_document, view_audit_log, run_agents, view_drafts, approve_agent_action
paralegal  → edit_document, run_agents, view_drafts
viewer     → view_drafts
```

---

## BullMQ Queues

11 queues, all connecting to Redis at `REDIS_HOST:REDIS_PORT`.

```
legal-retrieval    legal-analysis    legal-drafting
legal-validation   legal-audit       legal-orchestrator
legal-privacy      legal-debate      legal-monitoring
legal-indexing     legal-testing
```

Queue health is exposed at `GET /health/queue` and `GET /metrics`.

The orchestrator uses `FlowProducer` for DAG-based workflows with parallel fan-out across 5 retrieval filters (FEDERAL, APPEAL, HIGH courts + Malay language + broad).

---

## LLM Cascade

`src/lib/llm/cascade.ts` — tries models in priority order with circuit breaker protection:

1. Ollama `llama3.1` (primary — local, no data leaves the server)
2. Fallback model if configured

Confidence is extracted from the model output (`CONFIDENCE: X.XX` pattern).

---

## Provenance Graph

Every `/api/agent/query` response includes a provenance graph:

```json
{
  "nodes": [
    { "id": "q1", "type": "query", "label": "..." },
    { "id": "c1", "type": "case", "label": "[2024] 1 MLJ 100", "court": "FEDERAL" },
    { "id": "i1", "type": "inference", "confidence": 0.91 }
  ],
  "edges": [
    { "from": "q1", "to": "c1", "relation": "cites" },
    { "from": "q1", "to": "i1", "relation": "derives" }
  ]
}
```

---

## Event Bus

Redis Streams-based event bus (`src/lib/events/bus.ts`). Events are published by agents and consumed by the SSE endpoint at `GET /api/events/stream`.

Key event types:
```
retrieval.requested    retrieval.completed
analysis.finished      feedback.submitted
kill_switch.activated  kill_switch.deactivated
```

---

## Circuit Breaker

`src/lib/resilience/circuitBreaker.ts` — protects LLM calls from cascading failures.

States: `closed` (normal) → `open` (failing, reject fast) → `half-open` (probe).

Status: `GET /api/circuit-breaker`

---

## Predictive Cache

`src/lib/cache/predictiveCache.ts` — Redis-backed cache for retrieval results. Default TTL: 900 seconds. Cache key: `retrieval:<query>`.

---

## Audit Log

Hash-chain integrity: each `AuditLog` record stores `prevHash` and `hash = SHA-256(prevHash + payload)`. Supports `legalHold = true` to prevent deletion. PDPA forget-user action zeroes PII fields while preserving the hash chain.

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/legalai
REDIS_HOST=localhost
REDIS_PORT=6379
OLLAMA_URL=http://localhost:11434
SESSION_SECRET=change-me-in-production

# Optional
PORT=3001                          # default: 3001
LLM_MODEL=llama3.1                 # default: llama3.1
EMBED_MODEL=mxbai-embed-large
OPENAI_API_KEY=sk-...              # only for public/internal data classes
```

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # 17 models
├── src/
│   ├── db/                    # Prisma client singleton
│   ├── lib/
│   │   ├── auth.ts            # HMAC passwords, sessions, RBAC
│   │   ├── audit.js           # writeAuditLog helper
│   │   ├── logger.js          # Pino structured logger
│   │   ├── cache/             # Redis predictive cache
│   │   ├── events/            # Redis Streams event bus
│   │   ├── llm/               # LLM cascade with circuit breaker
│   │   ├── provenance/        # Provenance graph builder
│   │   └── resilience/        # Circuit breaker
│   ├── plugins/
│   │   └── legal-plugin.ts    # TanStack AI tool definitions
│   ├── queues/
│   │   └── index.ts           # BullMQ queue instances
│   ├── trpc/
│   │   ├── context.ts         # Request context (user, orgId, traceId)
│   │   ├── trpc.ts            # Procedure factories + RBAC middleware
│   │   └── routers/           # 12 routers
│   │       ├── _app.ts        # Root router
│   │       ├── agents.ts
│   │       ├── auth.ts
│   │       ├── clients.ts
│   │       ├── contracts.ts
│   │       ├── debate.ts
│   │       ├── documents.ts
│   │       ├── embeddings.ts
│   │       ├── governance.ts
│   │       ├── hitl.ts
│   │       ├── matters.ts
│   │       └── vectors.ts
│   └── server.ts              # Express app, all REST endpoints
└── package.json
```

---

## Scripts

```bash
npm run start:dev      # tsx watch src/server.ts (hot reload)
npm run start:prod     # node dist/src/server.js
npm run build          # nest build
npm run db:push        # prisma db push (no migration file)
npm run prisma:migrate # prisma migrate dev
npm run prisma:studio  # Prisma Studio UI
```
