import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { randomUUID } from 'crypto'
import { rateLimit } from './middleware/rateLimit'
// Use global fetch when available; otherwise fall back to undici
import { fetch as undiciFetch } from 'undici'
const fetchFn: typeof fetch = (globalThis as any).fetch ?? undiciFetch


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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { logger } = require('./lib/logger.js') as { logger: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void } }

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

// ── Prometheus metrics counters ────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  agentJobs: 0,
  startTime: Date.now(),
}

app.use(helmet({
  contentSecurityPolicy: false, // handled per-response by the Next.js frontend
}))
app.use(cors())
app.use(express.json())
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

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, '🚀 LAW MATE server started')
  logger.info(`📡 tRPC:        http://localhost:${PORT}/trpc`)
  logger.info(`🏥 Health:      GET  /health | /health/db | /health/ollama | /health/queue`)
  logger.info(`📊 Metrics:     GET  /metrics`)
  logger.info(`🔍 Audit:       GET  /audit`)
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
