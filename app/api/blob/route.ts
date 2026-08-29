import { del, list } from "@vercel/blob"
import { NextResponse, type NextRequest } from "next/server"
import { jsonError, rateLimit, validUploadPathname } from "@/lib/security"

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited
  try {
    const { blobs } = await list({ prefix: "uploads/", mode: "folded" })
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
  try {
    const body = await request.json().catch(() => null)
    const pathname = body && typeof body === "object" && "pathname" in body ? body.pathname : null
    if (!validUploadPathname(pathname)) return jsonError("A valid upload pathname is required")

    await del(pathname)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Blob deletion failed", error)
    return NextResponse.json({ error: "Unable to delete file" }, { status: 500 })
  }
}
