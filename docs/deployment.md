---
title: Deployment Guide
id: deployment
order: 8
---

# LAW MATE — Deployment Guide

---

## Development (local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, REDIS_HOST, OLLAMA_URL

# 3. Start infrastructure
docker compose up -d

# 4. Sync database schema
npx prisma db push

# 5. Pull Ollama models (first run ~2GB download)
ollama pull mxbai-embed-large
ollama pull llama3.1

# 6. Seed the vector index
node scripts/seed_vector_index.mjs

# 7. Start full stack
npm run dev
```

Access points after startup:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| LAW MATE Chat | http://localhost:3000/legalai |
| tRPC API | http://localhost:3001/trpc |
| tRPC Playground | http://localhost:3001/trpc/playground |
| OpenClaw Gateway | http://localhost:3002 |
| Ollama | http://localhost:11434 |

---

## Docker Compose services

```bash
docker compose up -d          # Start all services
docker compose logs postgres  # Check DB logs
docker compose logs redis     # Check Redis logs
docker compose logs ollama    # Check Ollama logs
docker compose down           # Stop all services
```

Services defined in `docker-compose.yml`:

| Service | Image | Port |
|---------|-------|------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 |
| `redis` | `redis:7-alpine` | 6379 |
| `ollama` | `ollama/ollama` | 11434 |
| `backend` | local build | 3001 |

---

## Production (`docker-compose.prod.yml`)

```bash
docker compose -f docker-compose.prod.yml up -d
```

Production differences:
- `LOG_LEVEL=warn`
- No volume mounts for source code
- Health checks on all services
- Restart policy: `unless-stopped`

---

## Workers

Start all 12 BullMQ workers (full list in `workers-queues.md`):

```bash
npm run workers:all
```

Or start any single worker via the matching `npm run worker:<name>` script in `package.json`.

---

## Database operations

```bash
npx prisma db push          # Sync schema (dev)
npx prisma migrate dev      # Create migration (dev)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma studio           # Visual DB browser
npx prisma generate         # Regenerate Prisma client
```

---

## Seeding the vector index

```bash
# Seed all datasets into their respective collections
node scripts/seed_vector_index.mjs

# Seed a specific collection only
node scripts/seed_vector_index.mjs --collection=constitutional_law --pattern=constitutional

# Seed with paralegal approval gate
node scripts/seed_vector_index.mjs --requireApproval --collection=federal-court
```

---

## Health checks

```bash
curl http://localhost:3001/health           # System status
curl http://localhost:3001/health/db        # Database connectivity
curl http://localhost:3001/health/queue     # Queue job counts
curl http://localhost:3001/health/ollama    # Ollama model list
```

---

## Troubleshooting

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| `DATABASE_URL` connection refused | PostgreSQL not running | `docker compose up -d postgres` |
| Queue jobs stuck in `waiting` | Workers not started | `npm run workers:all` |
| Ollama models missing | Models not pulled | `ollama pull mxbai-embed-large && ollama pull llama3.1` |
| Slow first indexing run | NER + embedding models downloading (~1.2GB) | Wait; check `docker compose logs` |
| `vector` column type error | pgVector extension not installed | `CREATE EXTENSION IF NOT EXISTS vector;` in psql |
| tRPC 404 | Backend not running | `npm --prefix backend run start:dev` |
| Credibility score below 90 | LLM model changed or index stale | Run `/eval` then re-seed if needed |
