import { get } from "@vercel/blob"
import { NextResponse, type NextRequest } from "next/server"
import { jsonError, rateLimit, validUploadPathname } from "@/lib/security"
import { getAuthenticatedUser } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60)
  if (limited) return limited
  const user = await getAuthenticatedUser(request)
  if (!user) return jsonError("Authentication required", 401)
  const pathname = request.nextUrl.searchParams.get("pathname")

  if (!validUploadPathname(pathname) || !(pathname.startsWith(`uploads/${user.tenantId}/`) || pathname.startsWith(`profiles/${user.userId}/`))) return jsonError("A valid pathname is required", 404)

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) return new NextResponse("Not found", { status: 404 })

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
        "Content-Disposition": result.blob.contentDisposition ?? "inline",
      },
    })
  } catch (error) {
    console.error("[v0] Blob read failed", error)
    return NextResponse.json({ error: "Unable to read file" }, { status: 500 })
  }
}
