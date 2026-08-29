---
title: Environment Variables
id: environment-variables
order: 5
---

# LAW MATE — Environment Variables

Copy `.env.example` to `.env` at the repo root before starting any service.

```bash
cp .env.example .env
```

---

## Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://legalai:legalai123@localhost:5432/legalai?schema=public` | PostgreSQL connection string with pgVector extension |
| `REDIS_HOST` | `localhost` | Redis host for BullMQ queues |
| `REDIS_PORT` | `6379` | Redis port |

---

## Strongly recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama inference server URL |
| `LLM_MODEL` | `minimax-m2.7:cloud` | Primary LLM model name |
| `EMBED_MODEL` | `mxbai-embed-large` | Embedding model for pgVector indexing |
| `SESSION_SECRET` | *(must set)* | Min 32-char secret for session signing |
| `NEXTAUTH_SECRET` | *(must set)* | NextAuth.js secret |

---

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend HTTP port |
| `LOG_LEVEL` | `info` | Pino log level: `trace` / `debug` / `info` / `warn` / `error` |
| `TRPC_URL` | `http://localhost:3001/trpc` | tRPC base URL used by the frontend |
| `CONFIDENCE_THRESHOLD` | `0.6` | Minimum retrieval confidence score to include a case |
| `ALERT_DELAY_HOURS` | `4` | Deduplication window for `legal_monitor` alerts |
| `REDIS_URL` | `redis://localhost:6379` | Full Redis URL (alternative to HOST+PORT) |

---

## Messaging channels (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token from @BotFather |
| `TELEGRAM_ENABLED` | `false` | Enable Telegram channel |
| `WHATSAPP_ENABLED` | `false` | Enable WhatsApp channel via Baileys |

---

## Production checklist

- [ ] `SESSION_SECRET` is at least 32 random characters
- [ ] `NEXTAUTH_SECRET` is set and not the dev default
- [ ] `DATABASE_URL` points to a production PostgreSQL instance with pgVector installed
- [ ] `OLLAMA_URL` is reachable from the backend container
- [ ] `REDIS_HOST` / `REDIS_URL` points to a persistent Redis instance
- [ ] `LOG_LEVEL` is set to `warn` or `error` in production
- [ ] `TELEGRAM_BOT_TOKEN` is set only if Telegram channel is enabled
