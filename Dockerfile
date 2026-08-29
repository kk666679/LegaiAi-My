# syntax=docker/dockerfile:1

# ── Stage 1: build the Next.js frontend ──────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Build-time public var (inlined by Next.js — must be set here, not only at runtime)
ARG NEXT_PUBLIC_TRPC_URL=http://localhost:3001/trpc
ENV NEXT_PUBLIC_TRPC_URL=$NEXT_PUBLIC_TRPC_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: minimal runtime image ───────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Next.js standalone server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
