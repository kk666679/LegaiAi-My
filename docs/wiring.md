---
title: Frontend ↔ Backend Wiring
id: wiring
order: 2
---

# LAW MATE — Frontend ↔ Backend Wiring

Single-source-of-truth document for how the Next.js frontend, Express/tRPC backend, BullMQ workers, OpenClaw gateway, and external services connect.

For procedure-level APIs see [agent-api.md](agent-api.md). For tool catalogue see [tools.md](tools.md). For queue internals see [workers-queues.md](workers-queues.md).

---

## Process map

| Process | Entry | Port | Started by |
|---------|-------|------|------------|
| Frontend (Next.js) | `next dev` / `next start` | `3000` | `npm run dev:next` |
| Backend (Express + tRPC) | `backend/src/server.ts` | `3001` | `npm run api:dev` |
| Workers (12× BullMQ) | `workers/*.js` | n/a (Redis) | `npm run workers:all` |
| OpenClaw gateway | `openclaw agent` / `openclaw gateway` | `3002` | `npm run openclaw` |
| Streaming chat route | `app/api/chat/route.ts` | `3000` | (served by Frontend) |
| Backend tRPC bridge | `app/api/trpc/[trpc]/route.ts` | `3000` | (served by Frontend) |

`npm run dev` runs Redis, all workers, the backend, and the frontend under `concurrently`.

---

## Request flow

### 1. Browser → Next.js route → backend tRPC

```
Browser
  │  (HTTPS)
  ▼
Next.js :3000
  ├── app/api/trpc/[trpc]/route.ts   ← HTTP bridge
  │     uses TRPC_BACKEND_URL ?? NEXT_PUBLIC_TRPC_URL ?? http://localhost:3001/trpc
  ▼
Express :3001  /trpc  (createExpressMiddleware)
  ▼
backend/src/trpc/routers/_app.ts  (appRouter)
  ▼
backend/src/trpc/routers/<domain>.ts  (agents, drafting, debate, ...)
  ▼
Either:
   a) synchronous logic (e.g. embeddings), or
   b) backend/src/queues/index.ts → BullMQ → workers/*.js
```

The browser talks to `app/api/trpc/...` (same origin). The route handler fans out to the backend at `:3001`. Domain routers sit in `backend/src/trpc/routers/` and may either return directly or enqueue a job.

### 2. Streaming chat (SSE)

```
Browser
  │
  ▼
POST /api/chat  →  app/api/chat/route.ts
                     uses @tanstack/ai + ollamaText adapter
                     talks to OLLAMA_URL
  ▼
SSE response back to browser
```

No tRPC or queue involvement — direct Ollama streaming. See [ai-chat.md](ai-chat.md).

### 3. OpenClaw gateway (Telegram / WhatsApp / HTTP)

```
Channel (Telegram / WhatsApp / HTTP :3002)
  │
  ▼
OpenClaw (.openclaw/index.js)
  ├── reads .openclaw/config.yml
  ├── resolves slash command via .openclaw/commands.yml
  ├── dispatches to tool via .openclaw/tools/ + .openclaw/skills/
  ▼
Either:
   a) direct Ollama call (read-only tools), or
   b) HTTP call to backend :3001/trpc → queue → worker
```

OpenClaw does **not** start workers itself. Workers must be running (`npm run workers:all`) for queue-backed tools to succeed.

---

## Shared types

The frontend imports backend types directly to keep inputs/outputs in sync:

- `clients.ts` (repo root) — `createTRPCReact<AppRouter>()` + `inferRouterInputs`/`inferRouterOutputs` aliases.
- Type source: `backend/src/trpc/routers/_app.ts`.

> **Do not** create a parallel router in `app/` or `server/`. A previous shadow scaffold was removed.

---

## Environment wiring

| Var | Frontend read? | Backend read? | Notes |
|-----|----------------|----------------|-------|
| `NEXT_PUBLIC_TRPC_URL` | yes (build-time) | no | Browser-visible; defaults `/trpc` in Docker, `http://localhost:3001/trpc` in dev |
| `TRPC_BACKEND_URL` | yes (server-side) | no | Used by `app/api/trpc/[trpc]/route.ts`; falls back to `NEXT_PUBLIC_TRPC_URL` |
| `OLLAMA_URL` | yes (`/api/chat`) | yes | Single source of truth for Ollama |
| `LLM_MODEL` / `LLM_MODEL_FALLBACK` | yes (`/api/chat`) | yes | Used everywhere Ollama is called |
| `DATABASE_URL` | no | yes | Postgres + pgVector |
| `REDIS_URL` (or `REDIS_HOST`+`REDIS_PORT`) | no | yes | BullMQ + cache + event bus |
| `SESSION_SECRET` / `NEXTAUTH_SECRET` | yes | yes | Required in production |

Full list and defaults: [environment-variables.md](environment-variables.md).

---

## Auth + session

- NextAuth.js handles browser sessions (`NEXTAUTH_SECRET`).
- tRPC context (`backend/src/trpc/context.ts`) attaches the session to every request; protected procedures use `protectedProcedure`.
- Backend `/auth` REST endpoints (see [agent-api.md](agent-api.md)) back the NextAuth credentials provider for passwordless / SSO flows.
- OpenClaw reuses the same `/auth` endpoints for Telegram/WhatsApp-bound users.

---

## Event bus

`backend/src/lib/events/bus.ts` creates a single Redis pub/sub pair. Workers publish lifecycle events; `/api/events/stream` SSE endpoint relays them to subscribed browsers. The TanStack Devtools panel consumes this stream (see [devtools.md](devtools.md)).

---

## Sandbox

`workers/legal-sandbox.js` runs untrusted tool code in an isolated container/pod, started by `backend/src/trpc/routers/sandbox.ts`. The `legal-sandbox` queue has its own concurrency (2) — see [workers-queues.md](workers-queues.md).

---

## Common wiring bugs (and fixes)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Browser tRPC 404s | `NEXT_PUBLIC_TRPC_URL` wrong at build time | Rebuild frontend after changing the URL |
| Backend tRPC works, browser doesn't | Route handler missing | Verify `app/api/trpc/[trpc]/route.ts` exists |
| `app/api/chat` returns 500 | `OLLAMA_URL` unreachable from frontend container | Set `OLLAMA_URL=http://ollama:11434` in `docker-compose.prod.yml` |
| OpenClaw tool call hangs | Workers not running | `npm run workers:all` |
| `Type 'IntersectionError'` in IDE | A backend router has a `never` type | Inspect the offending procedure's input/output Zod schema |
| Queue jobs stuck in `waiting` | Redis down or workers not started | `docker compose up -d redis && npm run workers:all` |