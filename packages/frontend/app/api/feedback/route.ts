import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ORIGIN, relayClientIpHeaders } from "@/lib/backend-proxy";

/**
 * Relay for the backend RLHF feedback endpoint (port 3001).
 * Frontend cannot reach :3001 directly in production (Caddy fronts
 * only the Next.js origin), so this route opens a fetch against the
 * backend and pipes the response back.
 */
export async function POST(req: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  relayClientIpHeaders(req, headers);

  const authorization = req.headers.get("authorization");
  if (authorization) headers["authorization"] = authorization;

  try {
    const body = await req.json();
    const upstream = await fetch(`${BACKEND_ORIGIN}/api/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Feedback service unavailable", details: String(err) },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";