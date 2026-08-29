import { NextRequest, NextResponse } from "next/server"

const buckets = new Map<string, { count: number; resetAt: number }>()

export function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export function rateLimit(request: NextRequest, limit = 30, windowMs = 60_000) {
  const key = clientKey(request)
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }
  current.count += 1
  if (current.count > limit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } })
  }
  return null
}

export function validUploadPathname(pathname: unknown): pathname is string {
  return typeof pathname === "string" && pathname.length <= 240 && /^uploads\/[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/.test(pathname)
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
