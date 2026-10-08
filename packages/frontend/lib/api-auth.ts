import type { NextRequest } from "next/server";
import { BACKEND_ORIGIN } from "@/lib/backend-proxy";

/** Resolve the active backend session for private Next.js API routes. */
export async function getAuthenticatedUser(request: NextRequest): Promise<{ userId: string; tenantId: string } | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  try {
    const input = encodeURIComponent(JSON.stringify({ json: null }));
    const response = await fetch(`${BACKEND_ORIGIN}/trpc/auth.me?input=${input}`, {
      headers: { authorization },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const user = payload?.result?.data?.json;
    return typeof user?.id === "string" ? { userId: user.id, tenantId: typeof user.orgId === "string" ? user.orgId : user.id } : null;
  } catch {
    return null;
  }
}
