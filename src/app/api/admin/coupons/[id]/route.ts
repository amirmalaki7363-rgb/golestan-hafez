import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  type: z.enum(["PERCENT", "AMOUNT"]).optional(),
  value: z.number().int().min(1).optional(),
  minTotal: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).max(9999).nullable().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

/** PATCH — update a coupon (admin only). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const { id } = await params;

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات معتبر نیست." }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کد تخفیف یافت نشد." }, { status: 404 });
    }

    const d = parsed.data;
    if ((d.type ?? existing.type) === "PERCENT" && (d.value ?? existing.value) > 90) {
      return NextResponse.json({ error: "درصد تخفیف باید بین ۱ تا ۹۰ باشد." }, { status: 400 });
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(d.value !== undefined ? { value: d.value } : {}),
        ...(d.minTotal !== undefined ? { minTotal: d.minTotal } : {}),
        ...(d.usageLimit !== undefined ? { usageLimit: d.usageLimit } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.expiresAt !== undefined ? { expiresAt: d.expiresAt ? new Date(d.expiresAt) : null } : {}),
      },
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("PATCH /api/admin/coupons/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** DELETE — remove a coupon (admin only). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const { id } = await params;

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کد تخفیف یافت نشد." }, { status: 404 });
    }

    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
