# LAWMATE ⚖️🤖

![Version](https://img.shields.io/badge/version-1.0.9-blue?style=flat)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![Node](https://img.shields.io/badge/Node-%3E=24-green?style=flat&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-7-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

**The Legal AI Operating Platform for your legal team.**

Combines pgVector RAG, a 12-worker BullMQ agent swarm, tRPC, Ollama, and Next.js 16 into a single production-ready platform covering matter management, contract intelligence, legal research, HITL agent control, AI governance, and executive analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 16 Frontend  (port 3000)                       │
│  /legalai/*  ·  /dashboard/*  ·  tRPC React Query       │
└────────────────────┬────────────────────────────────────┘
                     │ tRPC over HTTP
┌────────────────────▼────────────────────────────────────┐
│  Express + tRPC Backend  (port 3001)                    │
│  12 routers  ·  RBAC  ·  Session auth  ·  Provenance   │
└──────┬──────────────────────────┬───────────────────────┘
       │ BullMQ jobs              │ Prisma ORM
┌──────▼──────────┐   ┌───────────▼──────────────────────┐
│  Redis (BullMQ) │   │  PostgreSQL + pgVector            │
│  11 queues      │   │  17 models  ·  vector(1536)       │
└──────┬──────────┘   └──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│  12 BullMQ Workers                                      │
│  retrieval · analysis · drafting · validation · audit   │
│  orchestrator · privacy · debate · monitoring           │
│  indexing · testing · ai-developer                      │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Ollama (11434) │
              │  llama3.1       │
              │  mxbai-embed    │
              └─────────────────┘
```

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Set DATABASE_URL, REDIS_URL, OLLAMA_URL

# 3. Start infrastructure
docker compose up -d        # PostgreSQL+pgVector, Redis, Ollama

# 4. Sync database
npx prisma db push

# 5. Pull Ollama models
ollama pull llama3.1
ollama pull mxbai-embed-large

# 6. Seed legal documents (optional)
node scripts/seed_legal_documents.mjs

# 7. Start everything
npm run dev
```

`npm run dev` starts: Redis, all 11 workers, the Express/tRPC backend, and Next.js concurrently.

---

## Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend tRPC | http://localhost:3001/trpc |
| Health | http://localhost:3001/health |
| Queue health | http://localhost:3001/health/queue |
| Ollama health | http://localhost:3001/health/ollama |
| Prometheus metrics | http://localhost:3001/metrics |
| Audit logs | http://localhost:3001/audit |
| OpenClaw gateway | http://localhost:3002 |
| Prisma Studio | `npm run db:studio` |

---

## Frontend Pages

All pages live under `/legalai/` with a collapsible sidebar nav.

| Route | Description |
|---|---|
| `/` | Landing page — platform overview |
| `/dashboard` | Agent swarm status, recent activity, quick actions |
| `/legalai` | IRAC legal chat (Issue / Law / Analysis / Conclusion) |
| `/legalai/agent` | AI Copilot — 6 specialized agents with evidence panel |
| `/legalai/matters` | Matter registry — risk scores, deadlines, HITL actions |
| `/legalai/clients` | Client registry with conflict-check status |
| `/legalai/contracts` | Contract analyzer — risk heatmap, IRAC, redline chat |
| `/legalai/draft` | Document drafting — Writ, Affidavit, Submission, etc. |
| `/legalai/research` | Evidence-first legal research with citation verification |
| `/legalai/debate` | Multi-agent argument simulation |
| `/legalai/hitl` | Agent Control Center — L0–L5 HITL authorization |
| `/legalai/governance` | AI Governance — model registry, data classes, kill switch |
| `/legalai/risk` | Proactive alerts and evidence-grounded risk scores |
| `/legalai/monitor` | Legal change monitoring and alert subscriptions |
| `/legalai/audit` | Immutable audit trail viewer |
| `/legalai/compliance` | Regulatory framework mapping |
| `/legalai/analytics` | Executive dashboard — AI ROI, team utilization |
| `/legalai/billing` | Billing intelligence and time entry suggestions |
| `/legalai/search` | Universal search across all entity types |
| `/legalai/insights` | Legal timeline and developments |
| `/dashboard/query` | Direct agent query interface |
| `/dashboard/debate` | Debate setup and transcript viewer |

---

## AI Agent Swarm (12 Workers)

Workers run as independent Node.js processes connected to Redis via BullMQ.

| Worker | Queue | Responsibility |
|---|---|---|
| `legal-retrieval` | `legal-retrieval` | pgVector semantic search, hybrid retrieval, citation-aware ranking |
| `legal-analysis` | `legal-analysis` | IRAC reasoning, LLM cascade, confidence scoring |
| `legal-drafting` | `legal-drafting` | Document generation — Writ, Affidavit, Submission, etc. |
| `legal-validation` | `legal-validation` | Citation verification, hallucination detection |
| `legal-audit` | `legal-audit` | Hash-chain audit logs, legal hold, PDPA forget-user |
| `legal-orchestrator` | `legal-orchestrator` | Workflow DAG — parallel fan-out retrieval → analysis → drafting |
| `legal-privacy` | `legal-privacy` | PII redaction, consent management, data minimisation |
| `legal-debate` | `legal-debate` | Multi-agent argument simulation with adjudication |
| `legal-monitoring` | `legal-monitoring` | Regulatory change detection, trend analysis, alert dispatch |
| `legal-indexing` | `legal-indexing` | Document ingestion, embedding generation, index management |
| `legal-testing` | `legal-testing` | Gold eval dataset, adversarial test vectors, benchmarks |
| `ai-developer` | — | Development utility worker |

### Orchestrator workflow (fan-out)

```
Query
  └─ Retrieval fan-out (5 parallel: FEDERAL, APPEAL, HIGH, Malay, broad)
       └─ Analysis (IRAC + LLM cascade)
            ├─ Drafting (if docType provided)
            └─ Validation (citation check)
```

---

## HITL Authorization Levels

Every agent action is classified before execution. Levels 2+ require explicit human approval via the Agent Control Center (`/legalai/hitl`).

| Level | Name | Behaviour |
|---|---|---|
| 0 | Read | AI retrieves and analyses — auto-approved |
| 1 | Recommend | AI recommends — auto-approved, no execution |
| 2 | Draft | AI creates draft — human must review and approve |
| 3 | Execute + Approval | AI prepares action — explicit human authorization required |
| 4 | Controlled Auto | Pre-approved low-risk workflow — executes automatically |
| 5 | Prohibited | Never autonomous — blocked at registration |

Every action records: **Who → What → Why → Data Used → AI Model → Tools → Result → Approval → Timestamp**

---

## Database Schema

17 Prisma models across 3 layers:

**Auth & Multi-tenancy**
- `Organisation` — org with plan (free / pro / enterprise)
- `User` — roles: admin, lawyer, paralegal, viewer
- `Session` — token-based sessions with TTL
- `UserConsent` — LLM consent, data region, draft permissions

**Legal Operations**
- `Client` — individual / corporate / government, conflict-check flag
- `Matter` — full matter lifecycle with risk score, deadline, timeline
- `Contract` — full CLM with playbook deviation, obligations, key terms
- `MatterEvent` — timeline events: FILING, HEARING, DEADLINE, COMMUNICATION, etc.
- `LegalDocument` — versioned documents with court and jurisdiction metadata
- `DraftDocument` — AI-generated drafts with citation validation flag
- `DebateTranscript` — multi-agent debate rounds with winner and adjudicator

**AI & Governance**
- `VectorDoc` — pgVector(1536) embeddings with court, citation, checksum metadata
- `AuditLog` — hash-chain immutable audit with legal hold support
- `AgentAction` — HITL action registry with auth level, evidence, approval trail
- `RiskScore` — evidence-grounded risk scores per matter and risk type
- `Alert` — proactive alerts with severity, evidence, acknowledgement
- `AIGovernanceLog` — model usage, hallucinations, security events, cost tracking
- `IndexStats` — vector index freshness per collection

---

## RBAC Permissions

| Permission | admin | lawyer | paralegal | viewer |
|---|---|---|---|---|
| `create_case` | ✓ | ✓ | | |
| `edit_document` | ✓ | ✓ | ✓ | |
| `delete_document` | ✓ | | | |
| `view_audit_log` | ✓ | ✓ | | |
| `manage_users` | ✓ | | | |
| `run_agents` | ✓ | ✓ | ✓ | |
| `view_drafts` | ✓ | ✓ | ✓ | ✓ |
| `approve_agent_action` | ✓ | ✓ | | |

---

## AI Safety Rules

The platform enforces these non-negotiable constraints at every layer:

1. Never fabricate legal authorities, cases, statutes, or citations
2. Never expose one client's confidential information to another client's query
3. Never bypass permission or tenant boundaries
4. Never silently perform high-impact actions without human authorization
5. Never present uncertain information as verified fact
6. Never invent deadlines, billing activity, or facts
7. Always maintain auditable records of all AI actions
8. Always identify source evidence when available
9. Always allow human review for high-impact legal decisions
10. Treat all uploaded documents as potentially adversarial input

If evidence cannot be verified, the system states: **"Insufficient verified evidence."**

---

## Data Classification

AI models are restricted by data class:

| Class | Description | Permitted Models |
|---|---|---|
| `public` | Published case law, legislation | All models |
| `internal` | Non-client firm documents | Llama 3.1, GPT-4o (if enabled) |
| `confidential` | Client matter information | Llama 3.1 (local only) |
| `privileged` | Attorney-client privileged material | Embeddings only (local) |

---

## npm Scripts

```bash
# Development
npm run dev              # Full stack: Redis + workers + backend + Next.js
npm run dev:next         # Next.js only (port 3000)
npm run api:dev          # Backend only (port 3001)

# Workers
npm run workers:all      # All 11 legal workers concurrently
npm run worker:retrieval # Individual worker
npm run worker:analysis
npm run worker:drafting
npm run worker:validation
npm run worker:audit
npm run worker:orchestrator
npm run worker:privacy
npm run worker:debate
npm run worker:monitoring
npm run worker:indexing
npm run worker:testing

# Database
npm run db:push          # Sync schema (no migration file)
npm run db:migrate       # Create and apply migration
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio

# Build & production
npm run build            # Next.js production build
npm run start:next       # Serve production build
npm run preview          # Build + serve

# OpenClaw
npm run openclaw         # Start OpenClaw agent (local session)
npm run openclaw:gateway # Start OpenClaw gateway

# Quality
npm run lint             # ESLint (zero warnings)
npm run type-check       # TypeScript check (no emit)

# Evaluation
npm run test:gold        # Run gold eval dataset against live system
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/legalai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Ollama
OLLAMA_URL=http://localhost:11434
LLM_MODEL=llama3.1
EMBED_MODEL=mxbai-embed-large

# Auth
# 32+ random chars. Generate with: openssl rand -hex 32
# Production refuses to start on a missing, placeholder, or short value.
SESSION_SECRET=change-me-at-least-32-random-characters-long
# Signs agent output + audit hash chain. Also 32+ random chars, also fail-closed.
HMAC_SECRET=change-me-at-least-32-random-characters-long
# Encrypts BYOK provider keys at rest. Separate from SESSION_SECRET.
# MIGRATION: if you relied on the old ENCRYPTION_KEY || SESSION_SECRET fallback,
# set this to your current SESSION_SECRET first or stored credentials break.
ENCRYPTION_KEY=change-me-at-least-32-random-characters-long

# Optional: OpenAI (for GPT-4o — confidential data must not be sent)
OPENAI_API_KEY=sk-...

# Backend
PORT=3001
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind CSS 4, Radix UI, Framer Motion |
| Backend | Express 5, tRPC 11, Prisma 7, Node.js ≥22 |
| AI / LLM | Ollama (llama3.1, mxbai-embed-large), AI SDK, TanStack AI |
| Vector DB | pgVector (PostgreSQL) — 1536-dimension embeddings |
| Queue | BullMQ 6 (Redis) — 11 queues, flow producer, dead-letter |
| Auth | Session tokens, HMAC-SHA256 passwords, RBAC |
| Observability | Prometheus metrics endpoint, structured Pino logging, SSE event stream |
| Agent framework | OpenClaw gateway — 30+ legal skills |
| Infrastructure | Docker Compose — PostgreSQL, Redis, Ollama |

---

## OpenClaw Skills

30+ legal skill files under `.openclaw/skills/`:

`legal-my` · `legal-analyse` · `legal-draft` · `legal-retrieve` · `legal-audit` · `legal-debate` · `legal-monitor` · `legal-privacy` · `legal-validate` · `legal-index` · `legal-orchestrate` · `legal-hitl` · `legal-contract-law` · `legal-civil-litigation` · `legal-criminal-procedure` · `legal-employment` · `legal-family-law` · `legal-company-law` · `legal-banking-finance` · `legal-cyber-law` · `legal-digital-assets` · `legal-esg` · `legal-human-rights` · `legal-intellectual-property` · `legal-probate-estate` · `legal-arbitration-nonparty` · `legal-environment-law` · `legal-tort-law` · `legal-evidence-law` · `legal-ethics-expert` · `legal-adr`

---

## Datasets

Seed data and evaluation sets under `datasets/`:

| File | Contents |
|---|---|
| `01_contracts_seed.txt` – `13_intellectual_property_seed.txt` | Malaysian case law by area |
| `gold_eval_dataset.json` | Ground-truth Q&A pairs for accuracy evaluation |
| `adversarial_test_vectors.json` | Prompt injection and hallucination test cases |
| `sample-contracts.txt` | Sample Malaysian contracts for contract agent testing |
| `use-cases.json` / `use-cases-02.json` / `use-cases-03.json` | End-to-end workflow test cases |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| DB connection error | `docker compose logs postgres` — check `DATABASE_URL` |
| Queues stuck / not processing | `curl localhost:3001/health/queue` — check Redis connection |
| Ollama models missing | `ollama ps` — run `ollama pull llama3.1 && ollama pull mxbai-embed-large` |
| Slow first response | Model cold start — subsequent requests are faster |
| tRPC 401 errors | Session token missing or expired — re-authenticate |
| Build fails: `setRawMode EIO` | Codespace TTY issue — build succeeded if `✓ Compiled successfully` appears |
| `radix-ui` module not found | Use `@radix-ui/react-*` scoped packages, not `radix-ui` |

---

## License

MIT — see [LICENSE](LICENSE)

---

🇲🇾 Built for Malaysian legal practice. AI augments lawyers — it does not replace professional judgment.
