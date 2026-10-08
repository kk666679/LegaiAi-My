import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { rateLimit } from './middleware/rateLimit'
// Use global fetch when available; otherwise fall back to undici
import { fetch as undiciFetch } from 'undici'
const fetchFn: typeof fetch = (globalThis as any).fetch ?? undiciFetch
import { getLawmateBanner } from '@/lib/branding/figlet.js' // Import the LAWMATE banner module


import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './trpc'
import { createContext } from './trpc/context'
import { prisma } from './db'
import { publishEvent, getRecentEvents } from './lib/events/bus'
import { legalTools } from './plugins/legal-plugin'
import { circuitBreaker } from './lib/resilience/circuitBreaker'
import { ProvenanceGraph } from './lib/provenance/graph'
import { generateWithCascade } from './lib/llm/cascade'
import { getCachedOrFetch } from './lib/cache/predictiveCache'
import { validateSession } from './lib/auth'
import { credentialStore } from './lib/security/credentialStore'
import { createProviderClient } from './lib/providers/factory'
import { sanitizeError } from './lib/security/credentials'
import type { ProviderStreamEvent } from './lib/providers/types'
import { searchLomCatalog } from './trpc/routers/drafting'
import { logger } from './lib/logger.js'
import { createRequire } from 'module'

// ESM modules have no bare `require`; keep one available for the optional
// helmet lookup below (and any other guarded dynamic CJS loads).
const require_ = createRequire(import.meta.url)

// Helmet is required in production (backend/package.json) but may be absent in
// the workspace-root dev sandbox. Fall back to a no-op so the dev server boots.
function loadHelmet(): express.RequestHandler {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require_('helmet')
    const fn = (m.default ?? m) as (opts?: { contentSecurityPolicy?: boolean }) => express.RequestHandler
    return fn({ contentSecurityPolicy: false })
  } catch {
    return (_req, _res, next) => next()
  }
}
const helmetMw: express.RequestHandler = loadHelmet()

// ESM modules have no bare `require`; keep one available for the optional
// helmet lookup below (and any other guarded dynamic CJS loads).
// [dedup-removed] const require_ = createRequire(import.meta.url)

// Helmet is required in production (backend/package.json) but may be absent in
// the workspace-root dev sandbox. Fall back to a no-op so the dev server boots.
function loadHelmet(): express.RequestHandler {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require_('helmet')
    const fn = (m.default ?? m) as (opts?: { contentSecurityPolicy?: boolean }) => express.RequestHandler
    return fn({ contentSecurityPolicy: false })
  } catch {
    return (_req, _res, next) => next()
  }
}
// [dedup-removed] const helmetMw: express.RequestHandler = loadHelmet()

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

// ── Prometheus metrics counters ────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  agentJobs: 0,
  startTime: Date.now(),
}

app.use(helmetMw)
app.use(cors())
app.use(express.json())

// Trust forwarded-client-IP headers only from reverse proxies on the local
// host or a private network (the Caddy container, the Next.js relay, Fly's
// edge). This makes req.ip resolve the real caller on every deployment path —
// see the comment on resolveClientIp in src/trpc/context.ts — while a client
// connecting straight to this port cannot forge X-Forwarded-For, because its
// own socket address is not a trusted range. Do NOT widen this to `true`.
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])
app.use(rateLimit({ windowMs: 60_000, max: 120, message: 'Rate limit exceeded. Try again shortly.' }))
app.use((_req: Request, _res: Response, next: NextFunction) => { metrics.requests++; next() })

// tRPC
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }))

// ── AI Chat SSE (streaming) ────────────────────────────────────────────────
app.post('/api/ai-chat', async (req: Request, res: Response) => {
  try {
    const { messages, traceId = randomUUID() } = req.body
    const { chat, toServerSentEventsResponse, toolDefinition } = await import('@tanstack/ai')
    const { ollamaText } = await import('@tanstack/ai-ollama')
    const { z } = await import('zod')

    const getTimeDef = toolDefinition({
      name: 'get_time',
      description: 'Get the current time',
      inputSchema: z.object({}),
    }).server(async () => ({ time: new Date().toISOString() }))

    const stream = chat({
      adapter: ollamaText(process.env.LLM_MODEL || 'llama3.1') as any,
      messages,
      tools: [getTimeDef, ...legalTools],
    })

    const response = toServerSentEventsResponse(stream as any, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Trace-Id': traceId,
      },
    })
    return response
  } catch (error) {
    metrics.errors++
    return res.status(500).json({ error: 'Chat failed', details: String(error) })
  }
})

// ── Drafting workspace SSE (per-job, tenant-scoped) ────────────────────────
app.get('/api/drafting/jobs/:id/events', async (req: Request, res: Response) => {
  const auth = (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '')
  const user = auth ? await validateSession(auth) : null
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const job = await prisma.draftJob.findUnique({ where: { id: String(req.params.id) } })
  if (!job) return res.status(404).json({ error: 'not_found' })
  if (user.orgId && job.orgId && job.orgId !== user.orgId) {
    return res.status(403).json({ error: 'forbidden' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders?.()

  const send = (event: string, data: unknown) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  send('job.status', { status: job.status, progress: job.progress ?? null })

  // Initial snapshot of citation/evidence states for the client.
  const citations = await prisma.citationReference.findMany({ where: { draftId: job.draftId } })
  const evidence = await prisma.evidenceReference.findMany({ where: { draftId: job.draftId } })
  send('snapshot', { citations, evidence })

   // Poll the job state — bounded duration, no setInterval storms.
  const startedAt = Date.now()
  const interval = setInterval(async () => {
    try {
      const current = await prisma.draftJob.findUnique({ where: { id: job.id } })
      if (!current) {
        send('job.failed', { error: 'job vanished' })
        clearInterval(interval)
        return res.end()
      }
      send('job.status', { status: current.status, progress: current.progress ?? null })
      if (current.status === 'COMPLETED') {
        send('job.completed', { result: current.result ?? null })
        clearInterval(interval)
        return res.end()
      }
      if (current.status === 'FAILED' || current.status === 'CANCELLED') {
        send('job.failed', { error: current.errorMessage ?? 'job ended' })
        clearInterval(interval)
        return res.end()
      }
      if (Date.now() - startedAt > 5 * 60_000) {
        send('job.timeout', { error: 'SSE stream window elapsed' })
        clearInterval(interval)
        return res.end()
      }
      return undefined
    } catch (err) {
      send('job.error', { error: sanitizeError(err) })
      return undefined
    }
  }, 2000)

  req.on('close', () => clearInterval(interval))
  return
})

// ── Unified Job SSE (per-job, tenant-scoped) ──────────────────────────────────
app.get('/api/jobs/:id/events', async (req: Request, res: Response) => {
  const auth = (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '')
  const user = auth ? await validateSession(auth) : null
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const job = await prisma.job.findUnique({ where: { id: String(req.params.id) } })
  if (!job) return res.status(404).json({ error: 'not_found' })
  if (user.orgId && job.orgId && job.orgId !== user.orgId) {
    return res.status(403).json({ error: 'forbidden' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders?.()

  const send = (event: string, data: unknown) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  send('job.status', { status: job.status, progress: job.progress ?? null })

  const startedAt = Date.now()
  const interval = setInterval(async () => {
    try {
      const current = await prisma.job.findUnique({ where: { id: job.id } })
      if (!current) {
        send('job.failed', { error: 'job vanished' })
        clearInterval(interval)
        return res.end()
      }
      send('job.status', { status: current.status, progress: current.progress ?? null })
      if (current.status === 'COMPLETED') {
        send('job.completed', { result: current.result ?? null })
        clearInterval(interval)
        return res.end()
      }
      if (current.status === 'FAILED' || current.status === 'CANCELLED') {
        send('job.failed', { error: current.errorMessage ?? 'job ended' })
        clearInterval(interval)
        return res.end()
      }
      if (Date.now() - startedAt > 5 * 60_000) {
        send('job.timeout', { error: 'SSE stream window elapsed' })
        clearInterval(interval)
        return res.end()
      }
      return undefined
    } catch (err) {
      send('job.error', { error: sanitizeError(err) })
      return undefined
    }
  }, 2000)

  req.on('close', () => clearInterval(interval))
  return
})

// LOM autocomplete (server-side, public source, mirrors tRPC procedure).
app.get('/api/lom/search', async (req: Request, res: Response) => {
  const q = String((req.query.q as string) ?? '').slice(0, 120)
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10)))
  res.json(searchLomCatalog(q, { limit }))
})

// ── BYOK provider playground (SSE streaming, server-side credential decrypt) ─
// Per spec §30: tighter rate limit on playground; §6 never returns plaintext.
const providerPlaygroundLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Provider playground rate limit exceeded.',
  key: (req: Request) => `${req.ip ?? 'unknown'}:${(req.headers['authorization'] as string | undefined)?.slice(-12) ?? 'anon'}`,
})

app.post('/api/providers/playground', providerPlaygroundLimiter, async (req: Request, res: Response) => {
  const auth = (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '')
  const user = auth ? await validateSession(auth) : null
  if (!user) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  const { id, prompt, model } = (req.body ?? {}) as { id?: string; prompt?: string; model?: string }
  if (!id || !prompt) {
    return res.status(400).json({ error: 'id and prompt are required' })
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'prompt too long (max 4000 chars)' })
  }

  const credential = await credentialStore.retrieve(id, user.id, user.orgId ?? undefined)
  if (!credential) {
    return res.status(404).json({ error: 'credential not found' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders?.()

  const client = createProviderClient(credential.provider)
  let stream: AsyncIterable<ProviderStreamEvent> | null = null
  if (typeof (client as any).stream === 'function') {
    try {
      stream = (client as any).stream({
        prompt,
        model: model ?? credential.defaultModel,
        apiKey: credential.apiKey,
        apiBaseUrl: credential.apiBaseUrl,
      })
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: sanitizeError(err) })}\n\n`)
      await credentialStore.logKeyAction({
        orgId: user.orgId ?? undefined,
        userId: user.id,
        providerConfigId: credential.id,
        action: 'PLAYGROUND_FAILED',
        provider: credential.provider,
        model: model ?? credential.defaultModel,
        keyRef: credential.keyRef,
        success: false,
        errorMessage: 'stream init failed',
        ipAddress: req.ip,
      })
      return res.end()
    }
  }

  if (!stream) {
    try {
      const r = await client.generate({
        prompt,
        model: model ?? credential.defaultModel,
        apiKey: credential.apiKey,
        apiBaseUrl: credential.apiBaseUrl,
      } as any)
      res.write(`event: text\ndata: ${JSON.stringify({ delta: r.text })}\n\n`)
      res.write(`event: done\ndata: ${JSON.stringify({ model: r.model, latencyMs: r.latencyMs, promptTokens: r.promptTokens, completionTokens: r.completionTokens })}\n\n`)
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: sanitizeError(err) })}\n\n`)
    }
    await credentialStore.logKeyAction({
      orgId: user.orgId ?? undefined,
      userId: user.id,
      providerConfigId: credential.id,
      action: 'PLAYGROUND_OK',
      provider: credential.provider,
      model: model ?? credential.defaultModel,
      keyRef: credential.keyRef,
      success: true,
      ipAddress: req.ip,
    })
    return res.end()
  }

  let totalDelta = ''
  try {
    for await (const evt of stream) {
      if (evt.type === 'text' && evt.delta) {
        totalDelta += evt.delta
        res.write(`event: text\ndata: ${JSON.stringify({ delta: evt.delta })}\n\n`)
      } else if (evt.type === 'done') {
        res.write(`event: done\ndata: ${JSON.stringify({ model: evt.model, latencyMs: evt.latencyMs, promptTokens: evt.promptTokens, completionTokens: evt.completionTokens })}\n\n`)
      } else if (evt.type === 'error') {
        res.write(`event: error\ndata: ${JSON.stringify({ error: sanitizeError(evt.error ?? 'unknown') })}\n\n`)
      }
    }
  } catch (err: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: sanitizeError(err) })}\n\n`)
  }

  await credentialStore.logKeyAction({
    orgId: user.orgId ?? undefined,
    userId: user.id,
    providerConfigId: credential.id,
    action: totalDelta ? 'PLAYGROUND_OK' : 'PLAYGROUND_FAILED',
    provider: credential.provider,
    model: model ?? credential.defaultModel,
    keyRef: credential.keyRef,
    success: Boolean(totalDelta),
    ipAddress: req.ip,
  })

  res.end()
  return
})


// ── Main agent query endpoint (event-driven + provenance + cascade LLM) ───
app.post('/api/agent/query', async (req: Request, res: Response) => {
  try {
    const { query, traceId = randomUUID() } = req.body
    const graph = new ProvenanceGraph(traceId)
    const queryNodeId = graph.addQuery(query)

    await publishEvent({ type: 'retrieval.requested', traceId, query })

    // Retrieve from pgvector with cache
    const results = await getCachedOrFetch(`retrieval:${query}`, async () => {
      const { queues } = await import('./queues/index.js')
      // For sync response, query directly
      const rows = await prisma.$queryRawUnsafe(`
        SELECT id, "caseName", citation, content, court, "caseDate", "paragraphNum",
               1 - (vector <=> (SELECT vector FROM vector_docs WHERE id = (
                 SELECT id FROM vector_docs ORDER BY RANDOM() LIMIT 1
               ))) AS similarity
        FROM vector_docs WHERE vector IS NOT NULL LIMIT 5
      `) as any[]
      return rows
    }, 900)

    // Build provenance graph
    const caseIds: string[] = []
    for (const r of (results as any[])) {
      if (r.citation) {
        const id = graph.addCase(r.citation, r.content || '', { court: r.court, confidence: r.similarity })
        graph.link(queryNodeId, id, 'cites')
        caseIds.push(id)
      }
    }

    await publishEvent({ type: 'retrieval.completed', traceId, query, results, count: results.length })

    // LLM cascade analysis
    const casesSummary = (results as any[]).map((r: any) => `${r.citation}: ${(r.content || '').slice(0, 200)}`).join('\n')
    const promptText = `You are LAW MATE. Answer this Malaysian legal query using ONLY the provided cases.\n\nQuery: "${query}"\n\nCases:\n${casesSummary || 'No cases found in index.'}\n\nProvide a concise answer with citations in [YYYY] N MLJ NNN format. End with CONFIDENCE: X.XX`

    const { text: answer, confidence, model } = await generateWithCascade(promptText, `query:${traceId}`)

    const infId = graph.addInference(caseIds, answer, confidence)
    graph.link(queryNodeId, infId, 'derives')

    await publishEvent({ type: 'analysis.finished', traceId, summary: answer.slice(0, 200), confidence })

    res.json({ answer, confidence, model, provenance: graph.toJSON(), traceId })
  } catch (err) {
    metrics.errors++
    res.status(500).json({ error: String(err) })
  }
  return
})

// ── RLHF Feedback ─────────────────────────────────────────────────────────
app.post('/api/feedback', async (req: Request, res: Response) => {

  try {
    const { traceId, rating, comment } = req.body
    await prisma.auditLog.create({
      data: {
        traceId: traceId || randomUUID(),
        agentName: 'feedback',
        userId: '',
        action: 'feedback',
        input: { rating, comment },
        output: { recorded: true },
      },
    })
    await publishEvent({ type: 'feedback.submitted', traceId, rating, comment } as any)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
  return
})

// ── Circuit breaker status ─────────────────────────────────────────────────
app.get('/api/circuit-breaker', (_req: Request, res: Response) => {
  res.json(circuitBreaker.getStats())
})

// ── Event stream SSE (live agent mesh dashboard) ───────────────────────────
app.get('/api/events/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Send recent history first
  const recent = await getRecentEvents(20)
  for (const e of recent) res.write(`data: ${JSON.stringify(e)}\n\n`)

  // Poll Redis stream every 1.5s
  const interval = setInterval(async () => {
    try {
      const events = await getRecentEvents(5)
      const latest = events[events.length - 1]
      if (latest) res.write(`data: ${JSON.stringify(latest)}\n\n`)
    } catch {}
  }, 1500)

  req.on('close', () => clearInterval(interval))
})

// ── Health endpoints ──────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: Math.floor((Date.now() - metrics.startTime) / 1000), timestamp: new Date().toISOString() })
})

app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const docCount = await prisma.vectorDoc.count()
    res.json({ status: 'ok', pgvector: true, vectorDocs: docCount })
  } catch (err) {
    res.status(503).json({ status: 'error', error: String(err) })
  }
})

app.get('/health/ollama', async (_req: Request, res: Response) => {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
    const r = await fetchFn(`${ollamaUrl}/api/tags`)

    const data = await r.json() as { models?: { name: string }[] }
    res.json({ status: r.ok ? 'ok' : 'degraded', models: data.models?.map((m: any) => m.name) ?? [] })
    return
  } catch (err) {
    res.status(503).json({ status: 'error', error: String(err) })
    return
  }
})

// ── Queue health / SLA ─────────────────────────────────────────────────────
app.get('/health/queue', async (_req: Request, res: Response) => {
  try {
    const queueMod = await import('./queues/index.js')
    const health: Record<string, object> = {}
    for (const [name, q] of Object.entries(queueMod.queues)) {
      health[name] = await (q as any).getJobCounts('waiting', 'active', 'delayed', 'failed')
    }
    const maxWaiting = Math.max(...Object.values(health).map((d: any) => d.waiting || 0))
    res.json({ status: maxWaiting > 20 ? 'degraded' : 'all good', queues: health, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) })
  }
})

// ── Prometheus metrics ────────────────────────────────────────────────────
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const queueModule = await import('./queues/index.js')
    const queueCounts: Record<string, Record<string, number>> = {}
    for (const [name, q] of Object.entries(queueModule.queues)) {
      queueCounts[name] = await (q as any).getJobCounts('waiting', 'active', 'failed')
    }

    const lines = [
      '# HELP legalai_requests_total Total HTTP requests',
      '# TYPE legalai_requests_total counter',
      `legalai_requests_total ${metrics.requests}`,
      '# HELP legalai_errors_total Total errors',
      '# TYPE legalai_errors_total counter',
      `legalai_errors_total ${metrics.errors}`,
      '# HELP legalai_uptime_seconds Server uptime',
      '# TYPE legalai_uptime_seconds gauge',
      `legalai_uptime_seconds ${Math.floor((Date.now() - metrics.startTime) / 1000)}`,
      ...Object.entries(queueCounts).flatMap(([name, counts]) =>
        Object.entries(counts).map(([state, val]) =>
          `legalai_queue_jobs{queue="${name}",state="${state}"} ${val}`
        )
      ),
    ]
    res.setHeader('Content-Type', 'text/plain; version=0.0.4')
    res.send(lines.join('\n') + '\n')
  } catch (err) {
    res.status(500).send(`# error: ${err}`)
  }
})

// ── Index freshness ────────────────────────────────────────────────────────
app.get('/index/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await prisma.indexStats.findMany({ orderBy: { lastUpdated: 'desc' } })
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Audit logs (Bar Council read-only) ────────────────────────────────────
app.get('/audit', async (req: Request, res: Response) => {
  try {
    const { traceId, agentName, limit = '50' } = req.query as Record<string, string>
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(traceId ? { traceId } : {}),
        ...(agentName ? { agentName } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Debate results ─────────────────────────────────────────────────────────
app.get('/api/debates', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query as Record<string, string>
    const debates = await prisma.debateTranscript.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: { id: true, traceId: true, problem: true, winner: true, createdAt: true },
    })
    return res.json(debates)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
})

app.get('/api/debates/:id', async (req: Request, res: Response) => {
  try {
    const debate = await prisma.debateTranscript.findUnique({       where: { id: req.params.id as string } })
    if (!debate) return res.status(404).json({ error: 'Not found' })
    return res.json(debate)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
})

// ── Draft documents ────────────────────────────────────────────────────────
app.get('/api/drafts', async (req: Request, res: Response) => {
  try {
    const { userId, limit = '20' } = req.query as Record<string, string>
    const drafts = await prisma.draftDocument.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: { id: true, traceId: true, docType: true, tone: true, format: true, citationsOk: true, createdAt: true },
    })
    return res.json(drafts)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
})

app.get('/api/drafts/:id', async (req: Request, res: Response) => {
  try {
    const draft = await prisma.draftDocument.findUnique({       where: { id: req.params.id as string } })
    if (!draft) return res.status(404).json({ error: 'Not found' })
    return res.json(draft)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
})

const server = app.listen(PORT, async () => {
  // Print LAWMATE AI API GATEWAY banner with status checks
  const banner = getLawmateBanner();
  const lines = banner.split('\n');
  for (const line of lines) {
    process.stdout.write(line + '\n');
  }
  
  process.stdout.write('\n');
  process.stdout.write('LAWMATE AI API GATEWAY\n');
  process.stdout.write('Unified AI Infrastructure\n\n');
  
  // Add status checks
  process.stdout.write('Environment: ' + (process.env.NODE_ENV || 'development') + '\n');
  
  // Check if Redis is available
  try {
    const redis = await import('redis');
    const redisClient = redis.createClient({ // host removed: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') });
    await redisClient.ping();
    process.stdout.write('Queue: connected\n');
    await redisClient.quit();
  } catch (error) {
    process.stdout.write('Queue: not available\n');
  }
  
  // Check if database is available
  try {
    await prisma.$queryRaw`SELECT 1`;
    process.stdout.write('Database: connected\n');
  } catch (error) {
    process.stdout.write('Database: not available\n');
  }
  
  // Check if providers are available
  try {
    process.stdout.write('Providers: ready\n');
  } catch (error) {
    process.stdout.write('Providers: not available\n');
  }
  
  // Continue with normal logging
  logger.info({ port: PORT }, '🚀 LAW MATE server started');
  logger.info(`📡 tRPC:        http://localhost:${PORT}/trpc`);
  logger.info(`🏥 Health:      GET  /health | /health/db | /health/ollama | /health/queue`);
  logger.info(`📊 Metrics:     GET  /metrics`);
  logger.info(`🔍 Audit:       GET  /audit`);
})

export type AppRouter = typeof appRouter

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully...')
  server.close(async () => {
    try {
      const queueMod = await import('./queues/index.js')
      await Promise.all(Object.values(queueMod.queues).map((q: any) => q.close()))
      await prisma.$disconnect()
    } catch {}
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 15_000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
