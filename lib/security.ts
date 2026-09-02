import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit"

export function clientKey(request: NextRequest) {
  return clientKeyFromHeaders(request.headers)
}

export async function rateLimit(request: NextRequest, limit = 30, windowMs = 60_000) {
  const decision = await checkRateLimit({ key: clientKey(request), limit, windowMs })
  if (decision.limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(decision.retryAfterSeconds) },
    })
  }
  return null
}

export function validUploadPathname(pathname: unknown): pathname is string {
  return typeof pathname === "string" && pathname.length <= 240 && /^uploads\/[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/.test(pathname)
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
