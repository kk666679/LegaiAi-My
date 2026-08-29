import Redis from 'ioredis'
import { AgentEvent, AgentEventSchema } from './types'

const STREAM_KEY = 'agent_events'
const GROUP = 'agents'

let pub: Redis | null = null
let sub: Redis | null = null

function getRedis() {
  if (!pub) pub = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379'), lazyConnect: true })
  return pub
}

export async function publishEvent(event: AgentEvent) {
  const r = getRedis()
  await r.xadd(STREAM_KEY, '*', 'data', JSON.stringify(event))
}

export async function ensureConsumerGroup() {
  const r = getRedis()
  try {
    await r.xgroup('CREATE', STREAM_KEY, GROUP, '$', 'MKSTREAM')
  } catch (e: any) {
    if (!e.message?.includes('BUSYGROUP')) throw e
  }
}

export async function subscribeToEvents(
  consumerId: string,
  handler: (event: AgentEvent) => Promise<void>,
  signal?: AbortSignal
) {
  sub = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') })
  await ensureConsumerGroup()
  let lastId = '>'

  while (!signal?.aborted) {
    const results = await sub.xreadgroup('GROUP', GROUP, consumerId, 'COUNT', 10, 'BLOCK', 2000, 'STREAMS', STREAM_KEY, lastId) as any
    if (!results) continue
    for (const [, messages] of results) {
      for (const [id, fields] of messages) {
        try {
          const raw = JSON.parse(fields[1])
          const parsed = AgentEventSchema.safeParse(raw)
          if (parsed.success) await handler(parsed.data)
          await sub.xack(STREAM_KEY, GROUP, id)
        } catch {}
      }
    }
  }
}

/** Get recent events from the stream (for dashboard SSE) */
export async function getRecentEvents(count = 50): Promise<AgentEvent[]> {
  const r = getRedis()
  const results = await r.xrevrange(STREAM_KEY, '+', '-', 'COUNT', count) as any[]
  return results
    .map(([, fields]) => { try { return JSON.parse(fields[1]) } catch { return null } })
    .filter(Boolean)
    .reverse()
}
