import type { NextRequest } from "next/server";

/**
 * Origin of the Express backend, for server-side relays only.
 *
 * Deliberately does NOT fall back to NEXT_PUBLIC_TRPC_URL: that variable is the
 * *browser-facing* URL. With the Fly topology it is "/api/trpc", which would
 * resolve to a relative, unfetchable target from inside a route handler.
 */
export const BACKEND_ORIGIN = (
  process.env.BACKEND_URL
  || process.env.TRPC_BACKEND_URL?.replace(/\/trpc\/?$/, "")
  || "http://localhost:3001"
).replace(/\/$/, "");

/**
 * Header relay for the Next.js -> Express hops.
 *
 * The browser always reaches the backend through one of these route handlers
 * (or through Caddy, which sets the header itself). Node's fetch does not add
 * X-Forwarded-For, so without an explicit relay the backend sees this app's own
 * socket address as the client IP — which collapses per-IP rate limiting into a
 * single bucket shared by every user.
 *
 * Only the client-IP headers are relayed. Hop-by-hop headers, cookies and
 * arbitrary browser headers are deliberately not forwarded.
 */
const RELAYED_IP_HEADERS = ["x-forwarded-for", "fly-client-ip", "x-real-ip"] as const;

export function relayClientIpHeaders(
  req: NextRequest,
  into: Record<string, string> = {},
): Record<string, string> {
  for (const name of RELAYED_IP_HEADERS) {
    const value = req.headers.get(name);
    if (value) into[name] = value;
  }
  return into;
}

/** The Authorization header, when the caller supplied one. */
export function relayAuthorization(req: NextRequest): Record<string, string> {
  const authorization = req.headers.get("authorization");
  return authorization ? { authorization } : {};
}