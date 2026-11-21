import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSiteContent, saveSiteContent } from "@/lib/site-content";
import { siteContentSchema } from "@/lib/site-content-schema";
import { handleUploadPost } from "@/lib/upload-server";

/** POST — image upload fallback: POST /api/admin/content?upload=1 (multipart).
 * Lives inside this durable route so image upload keeps working even if the
 * dedicated upload route files ever go missing. */
export async function POST(req: Request) {
  return handleUploadPost(req);
}

/** GET — full editable site content (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    return NextResponse.json({ content: await getSiteContent() });
  } catch (error) {
    console.error("GET /api/admin/content failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** PUT — replace site content with a validated payload (admin only). */
export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const check = siteContentSchema.safeParse(body);
    if (!check.success) {
      return NextResponse.json(
        {
          error: "اطلاعات محتوا معتبر نیست.",
          detail:
            check.error.issues[0]?.path.join(".") +
            ": " +
            (check.error.issues[0]?.message ?? ""),
        },
        { status: 400 }
      );
    }

    const saved = await saveSiteContent(check.data);
    if (!saved) {
      return NextResponse.json({ error: "ذخیره محتوا انجام نشد." }, { status: 500 });
    }
    // Bust any cached render of the storefront so edits show up immediately.
    revalidatePath("/");
    return NextResponse.json({ content: saved });
  } catch (error) {
    console.error("PUT /api/admin/content failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
