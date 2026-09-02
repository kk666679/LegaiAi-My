---
title: Infrastructure & Deployment
id: infrastructure
order: 11
---

# LAW MATE — Infrastructure & Deployment

This page covers the deployment surface beyond the local docker-compose setup documented in [deployment.md](deployment.md): Fly.io, the Caddy reverse proxy, and the npm/pnpm dual-lockfile reality.

---

## Fly.io

Two Fly apps are configured:

| App | Config | Image | Purpose |
|-----|--------|-------|---------|
| Frontend | `fly.toml` | Built from repo root (`Dockerfile`) | Next.js app + edge |
| Backend | `fly.backend.toml` | Built from `Dockerfile.backend` | Express + tRPC + workers |

### Deploy

The CI workflow `.github/workflows/ci.yml` deploys the backend to Fly.io on every push to `main`. To deploy manually:

```bash
# Frontend
flyctl deploy --remote-only

# Backend (separate app)
flyctl deploy --remote-only -c fly.backend.toml
```

### Required secrets

Set these on the backend Fly app:

```bash
flyctl secrets set -c fly.backend.toml \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  OLLAMA_URL="http://..." \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  NEXTAUTH_SECRET="$(openssl rand -hex 32)"
```

See [environment-variables.md](environment-variables.md) for the full key list and the production checklist.

---

## Caddy

`Caddyfile` at the repo root configures the local reverse proxy:

- Terminates TLS for `localhost` (dev) and any configured domain (prod)
- Routes `/trpc/*` and `/api/*` to the backend (`:3001`)
- Routes everything else to the frontend (`:3000`)
- Optional `reverse_proxy /sandbox/*` to the `legal-sandbox` worker container

Reload after editing:

```bash
docker compose restart caddy
```

---

## Package manager

The repo currently ships both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm), plus `pnpm-workspace.yaml`. **npm is the canonical package manager** — CI, Dockerfiles, and the `postinstall` hook assume npm.

Use one of:

```bash
npm ci            # canonical — matches package-lock.json
# or, if you must use pnpm:
pnpm install --frozen-lockfile
```

> Do not mix the two in the same checkout: stray node_modules from the wrong lockfile will cause `prisma generate` and `tsx` resolution to fail. Delete `node_modules` and the non-canonical lockfile before switching.

---

## `@tanstack/intent` workflow

`@tanstack/intent` keeps generated route/loader metadata in sync. Scripts:

```bash
npm run intent:list      # Show registered intents
npm run intent:install   # Materialise missing intent scaffolding
npm run intent:validate  # Validate current metadata
npm run intent:stale     # List stale intents
```

Run `intent:validate` before opening a PR that touches `app/` routes.