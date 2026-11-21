import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { invalidateServerCache } from "@/lib/server-cache";
import { SETTING_DEFAULTS, SETTING_KEYS } from "@/lib/settings";

/** GET — current settings (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const rows = await db.setting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      settings: {
        deliveryFee: Number(map.get("deliveryFee") ?? SETTING_DEFAULTS.deliveryFee),
        supportPhone: map.get("supportPhone") ?? SETTING_DEFAULTS.supportPhone,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const patchSchema = z.object({
  deliveryFee: z.number().int().min(0).max(100000000).optional(),
  supportPhone: z.string().trim().max(20).optional(),
});

/** PATCH — upsert settings (admin only). */
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات معتبر نیست." }, { status: 400 });
    }

    const updates = Object.entries(parsed.data).filter(
      ([, v]) => v !== undefined && v !== null
    ) as [string, string | number][];

    for (const [key, value] of updates) {
      if (!SETTING_KEYS.includes(key as (typeof SETTING_KEYS)[number])) continue;
      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    const rows = await db.setting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    invalidateServerCache();
    return NextResponse.json({
      settings: {
        deliveryFee: Number(map.get("deliveryFee") ?? SETTING_DEFAULTS.deliveryFee),
        supportPhone: map.get("supportPhone") ?? SETTING_DEFAULTS.supportPhone,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
