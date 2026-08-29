import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true,
})

const TTL = 3600  // 1 hour default

// JIT prompt template compiler
const promptCache = new Map<string, (vars: Record<string, string>) => string>()

export function compilePrompt(template: string): (vars: Record<string, string>) => string {
  if (promptCache.has(template)) return promptCache.get(template)!
  const compiled = (vars: Record<string, string>) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
  promptCache.set(template, compiled)
  return compiled
}

export async function getCached(key: string): Promise<string | null> {
  try { return await redis.get(`cache:${key}`) } catch { return null }
}

export async function setCached(key: string, value: string, ttl = TTL): Promise<void> {
  try { await redis.setex(`cache:${key}`, ttl, value) } catch {}
}

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = TTL
): Promise<T> {
  const cached = await getCached(key)
  if (cached) return JSON.parse(cached) as T
  const result = await fetcher()
  await setCached(key, JSON.stringify(result), ttl)
  return result
}

export async function invalidate(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`cache:${pattern}`)
    if (keys.length) await redis.del(...keys)
  } catch {}
}
