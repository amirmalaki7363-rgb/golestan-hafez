import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Shared multipart image-upload handler used by ALL upload routes:
 *   1. POST /api/admin/upload             (canonical)
 *   2. POST /api/admin/content/upload     (fallback #1)
 *   3. POST /api/admin/content?upload=1   (fallback #2, inside the durable
 *      content route — used automatically by the client)
 *
 * Contract (identical for all):
 *   - ALWAYS responds with JSON (never HTML), so the client can parse it safely.
 *   - 200 → { path: "/api/uploads/<id>" }  ← served from the DATABASE,
 *     so images survive even when runtime files in public/uploads are wiped.
 *   - 4xx/5xx → { error: "<پیام فارسی>" }
 */

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Safe extension whitelist mapped from the *verified* MIME type. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Double-check the magic bytes so a renamed .exe cannot pass as an image. */
function sniffImageKind(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  const b = bytes;
  const startsWith = (...sig: number[]) => sig.every((v, i) => b[i] === v);

  // JPEG: FF D8 FF
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  // GIF: GIF87a / GIF89a
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp";
  // AVIF: ftyp box with avif/avis brand
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
    return null;
  }
  return null;
}

/** Single POST handler shared by both upload routes. */
export async function handleUploadPost(req: Request): Promise<Response> {
  let admin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  try {
    admin = await requireAdmin();
  } catch (error) {
    console.error("upload auth check failed:", error);
    return NextResponse.json(
      { error: "بررسی دسترسی ناموفق بود — دوباره وارد شوید." },
      { status: 500 }
    );
  }
  if (!admin) {
    return NextResponse.json(
      { error: "دسترسی فقط برای مدیر. لطفاً با حساب مدیر وارد شوید." },
      { status: 403 }
    );
  }

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "درخواست نامعتبر است (فایل یافت نشد)." },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "فایلی برای آپلود ارسال نشده است." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "فایل خالی است." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "حجم تصویر بیش از ۵ مگابایت است." },
        { status: 413 }
      );
    }

    // MIME from the browser (informational) + magic-byte sniffing (authoritative)
    const declared = (file as File).type;
    if (declared && !(declared in MIME_EXT)) {
      return NextResponse.json(
        { error: "فرمت پذیرفته نمی‌شود. فقط JPG، PNG، WebP، GIF یا AVIF." },
        { status: 415 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageKind(buf);
    if (!sniffed || !(sniffed in MIME_EXT)) {
      return NextResponse.json(
        { error: "محتوای فایل یک تصویر معتبر نیست." },
        { status: 415 }
      );
    }

    // Canonical store: the database — survives file-system wipes.
    const row = await db.uploadedImage.create({
      data: { mime: sniffed, size: buf.length, data: buf },
    });

    return NextResponse.json({ path: `/api/uploads/${row.id}` });
  } catch (error) {
    console.error("upload POST failed:", error);
    return NextResponse.json(
      { error: "ذخیره‌ی فایل روی سرور ناموفق بود — دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
