import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/uploads/{id} — serves an uploaded image stored in the database.
 *
 * Uploaded images are persisted as blobs (see UploadedImage in the Prisma
 * schema), so they survive even when runtime files in public/uploads are
 * wiped between sessions. Cacheable forever: ids are unique per upload.
 *
 * Must stay dynamic: blobs can be replaced (recompressed/re-uploaded) and
 * a statically-cached handler would keep serving stale bytes forever.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.uploadedImage.findUnique({ where: { id } });

    if (!row) {
      return NextResponse.json(
        { error: "تصویر یافت نشد." },
        { status: 404 }
      );
    }

    const bytes = new Uint8Array(row.data);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
