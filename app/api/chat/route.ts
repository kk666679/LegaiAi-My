import { NextRequest } from 'next/server';
import { z } from 'zod';
import { BACKEND_ORIGIN, relayClientIpHeaders } from '@/lib/backend-proxy';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().trim().min(1).max(12000),
}).strict();
const requestSchema = z.object({ messages: z.array(messageSchema).min(1).max(40) }).strict();

/**
 * Frontend streaming chat route.
 *
 * Per docs/wiring.md the streaming chat path is `app/api/chat/route.ts`,
 * talks directly to Ollama via the `@tanstack/ai` `ollamaText` adapter,
 * and serves an SSE response back to the browser.
 *
 * The `useChat` consumer in components/ai/legal/chat.tsx reads the
 * Vercel AI SDK Data Stream Protocol (`x-vercel-ai-data-stream: v1`),
 * so this route forwards to the backend `/api/ai-chat` SSE endpoint
 * (which already runs `@tanstack/ai` + `ollamaText`) and re-emits the
 * stream verbatim. That keeps Ollama invocation in exactly one place —
 * the backend — and lets the browser keep using `@ai-sdk/react`.
 */
export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid chat request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const traceId = req.headers.get('x-trace-id') ?? crypto.randomUUID();

  const upstream = await fetch(`${BACKEND_ORIGIN}/api/ai-chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-trace-id': traceId,
      ...(req.headers.get('authorization') ? { authorization: req.headers.get('authorization')! } : {}),
      ...relayClientIpHeaders(req),
    },
    body: JSON.stringify({ messages: parsed.data.messages, traceId }),
    // @ts-expect-error duplex is required for streaming bodies in undici
    duplex: 'half',
  }).catch((err) => {
    return new Response(JSON.stringify({ error: 'Chat upstream unreachable', details: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  if (!(upstream instanceof Response)) return upstream;
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new Response(text || JSON.stringify({ error: 'Chat upstream failed' }), {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Trace-Id': traceId,
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';