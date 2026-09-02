import { NextRequest } from 'next/server';

/**
 * Frontend SSE relay for the backend agent event bus.
 *
 * The backend publishes agent lifecycle events (retrieval.requested,
 * analysis.finished, etc.) on a Redis pub/sub bus exposed at
 * `GET /api/events/stream` (port 3001). Per docs/wiring.md the
 * TanStack Devtools panel consumes this stream from the browser.
 *
 * Browsers cannot reach port 3001 directly in production (Caddy fronts
 * only the Next.js origin), so this route opens a fetch against the
 * backend SSE endpoint and pipes the bytes back. The Authorization
 * header is forwarded so private events still get the user's session.
 */
export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_URL
    || process.env.TRPC_BACKEND_URL?.replace(/\/trpc$/, '')
    || 'http://localhost:3001';

  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers.authorization = auth;

  let upstream: Response;
  try {
    upstream = await fetch(`${backend}/api/events/stream`, { headers });
  } catch (err) {
    return new Response(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`, {
      status: 502,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'upstream unavailable', status: upstream.status })}\n\n`,
      { status: 502, headers: { 'Content-Type': 'text/event-stream' } },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';