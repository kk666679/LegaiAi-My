import { put } from "@vercel/blob"
import { NextResponse, type NextRequest } from "next/server"
import { jsonError, rateLimit } from "@/lib/security"

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set(["application/pdf", "text/plain", "text/csv", "application/json", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited
  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > MAX_FILE_SIZE + 1024 * 1024) return jsonError("Upload is too large", 413)
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 })
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return jsonError("File must be between 1 byte and 25 MB")
    }
    if (!ALLOWED_TYPES.has(file.type)) return jsonError("Unsupported file type")

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-180)
    const pathname = `uploads/${crypto.randomUUID()}-${safeName || "file"}`
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: false })

    return NextResponse.json({ pathname: blob.pathname, size: file.size, contentType: file.type })
  } catch (error) {
    console.error("[v0] Blob upload failed", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
