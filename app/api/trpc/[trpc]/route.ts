import { NextRequest, NextResponse } from "next/server";

const TRPC_URL = process.env.TRPC_URL || "http://localhost:3001/trpc";

async function proxy(req: NextRequest, target: string, method: string, body?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const res = await fetch(target, { method, headers, body });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ trpc: string }> }) {
  const { trpc } = await params;
  return proxy(req, `${TRPC_URL}/${trpc}${req.nextUrl.search}`, "GET");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ trpc: string }> }) {
  const { trpc } = await params;
  return proxy(req, `${TRPC_URL}/${trpc}`, "POST", await req.text());
}
