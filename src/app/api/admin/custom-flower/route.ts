import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getCustomFlowerConfig,
  saveCustomFlowerConfig,
} from "@/lib/custom-flower-content";
import { customFlowerConfigSchema } from "@/lib/custom-flower-config";

/** GET — full editable «گل به سلیقه شما» config (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    return NextResponse.json({ config: await getCustomFlowerConfig() });
  } catch (error) {
    console.error("GET /api/admin/custom-flower failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** PUT — replace the config with a validated payload (admin only). */
export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const check = customFlowerConfigSchema.safeParse(body);
    if (!check.success) {
      return NextResponse.json(
        {
          error: "اطلاعات بخش «گل به سلیقه شما» معتبر نیست.",
          detail:
            check.error.issues[0]?.path.join(".") +
            ": " +
            (check.error.issues[0]?.message ?? ""),
        },
        { status: 400 }
      );
    }

    const saved = await saveCustomFlowerConfig(check.data);
    if (!saved) {
      return NextResponse.json({ error: "ذخیره انجام نشد." }, { status: 500 });
    }
    return NextResponse.json({ config: saved });
  } catch (error) {
    console.error("PUT /api/admin/custom-flower failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
