// app/api/webhook/route.ts
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

// Must be dynamic — webhooks can't be cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // needs crypto + raw body

function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(raw)
    .digest('hex');

  // Length check first — timingSafeEqual throws on mismatched lengths
  if (header.length !== expected.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(header),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] GITHUB_WEBHOOK_SECRET is not set');
    return new Response('server misconfigured', { status: 500 });
  }

  // CRITICAL: read raw body, not req.json()
  const raw = await req.text();
  const sig = req.headers.get('x-hub-signature-256');

  if (!verifySignature(raw, sig, secret)) {
    console.warn('[webhook] invalid signature');
    return new Response('invalid signature', { status: 401 });
  }

  const event = req.headers.get('x-github-event') ?? 'unknown';
  const delivery = req.headers.get('x-github-delivery') ?? 'unknown';

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  console.log(`[webhook] ${event} (${delivery})`);

  switch (event) {
    case 'ping':
      console.log('[webhook] ping zen:', (payload as { zen?: string }).zen);
      break;
    case 'push':
      // handle push
      break;
    case 'pull_request':
      // handle PR
      break;
    case 'installation':
    case 'installation_repositories':
      // handle app install / repo changes
      break;
    default:
      console.log(`[webhook] unhandled event: ${event}`);
  }

  return new Response('ok', { status: 200 });
}

// Optional: respond to GET so browsers/curl checks don't 404
export async function GET() {
  return new Response('webhook endpoint — POST only', { status: 405 });
}