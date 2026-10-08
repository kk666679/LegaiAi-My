import { del, list } from "@vercel/blob"
import { NextResponse, type NextRequest } from "next/server"
import { jsonError, rateLimit, validUploadPathname } from "@/lib/security"
import { getAuthenticatedUser } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited
  const user = await getAuthenticatedUser(request)
  if (!user) return jsonError("Authentication required", 401)
  try {
    const [{ blobs: uploads }, { blobs: photos }] = await Promise.all([
      list({ prefix: `uploads/${user.tenantId}/`, mode: "folded" }),
      list({ prefix: `profiles/${user.userId}/`, mode: "folded" }),
    ])
    const blobs = [...uploads, ...photos]
    return NextResponse.json({
      files: blobs.map(({ pathname, size, uploadedAt }) => ({ pathname, size, uploadedAt })),
    })
  } catch (error) {
    console.error("[v0] Blob listing failed", error)
    return NextResponse.json({ error: "Unable to list files" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited
  const user = await getAuthenticatedUser(request)
  if (!user) return jsonError("Authentication required", 401)
  try {
    const body = await request.json().catch(() => null)
    const pathname = body && typeof body === "object" && "pathname" in body ? body.pathname : null
    if (!validUploadPathname(pathname) || !(pathname.startsWith(`uploads/${user.tenantId}/`) || pathname.startsWith(`profiles/${user.userId}/`))) return jsonError("A valid upload pathname is required", 404)

    await del(pathname)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Blob deletion failed", error)
    return NextResponse.json({ error: "Unable to delete file" }, { status: 500 })
  }
}
