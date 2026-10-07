// LAWMATE AI API GATEWAY — standalone package entry point
// Self-contained Express server with LAWMATE FIGlet branding and health endpoints.
// Delegates LLM/provenance work to the workspace backend when available.

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Shared LAWMATE FIGlet branding — single source of truth
const LAWMATE_FIGLET = 
`██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
 ██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
 ██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
 ██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
 ███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
 ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                  MCP • CLI • AI API GATEWAY`

export function getLawmateBanner() {
  return LAWMATE_FIGLET
}

export function getLawmateBannerCompact() {
  return `LAWMATE
MCP • CLI • AI API GATEWAY`
}

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lawmate-gateway', version: '1.0.0' })
})

app.get('/health/db', async (_req, res) => {
  try {
    const { prisma } = await import('../../backend/src/db/index.js')
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.json({ status: 'degraded', db: 'unavailable' })
  }
})

app.get('/health/ollama', async (_req, res) => {
  try {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434'
    const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) })
    res.json({ status: r.ok ? 'ok' : 'degraded', ollama: r.ok ? 'reachable' : 'unreachable' })
  } catch {
    res.json({ status: 'degraded', ollama: 'unreachable' })
  }
})

app.get('/health/queue', async (_req, res) => {
  try {
    const { createClient } = await import('redis')
    const c = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    await c.connect()
    await c.ping()
    await c.quit()
    res.json({ status: 'ok', queue: 'connected' })
  } catch {
    res.json({ status: 'degraded', queue: 'unavailable' })
  }
})

app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain')
  res.send('# HELP lawmate_gateway_up Gateway process up\n# TYPE lawmate_gateway_up gauge\nlawmate_gateway_up 1\n')
})

app.get('/api/ai-chat', async (req, res) => {
  const message = req.query.message || ''
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.write(`data: ${JSON.stringify({ reply: `LAWMATE gateway received: ${message}` })}\n\n`)
  res.end()
})

const server = app.listen(PORT, () => {
  if (process.env.LAWMATE_NO_BANNER !== '1') {
    const banner = getLawmateBanner()
    for (const line of banner.split('\n')) {
      process.stdout.write(line + '\n')
    }
    process.stdout.write('\n')
    process.stdout.write('LAWMATE AI API GATEWAY\n')
    process.stdout.write('Unified AI Infrastructure\n\n')
    process.stdout.write(`Environment: ${process.env.NODE_ENV || 'development'}\n`)
    process.stdout.write(`API: ready\n`)
  }

  console.log(`🚀 LAW MATE gateway listening on port ${PORT}`)
  console.log(`🏥 Health:  GET  /health | /health/db | /health/ollama | /health/queue`)
  console.log(`📊 Metrics: GET  /metrics`)
})

process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())