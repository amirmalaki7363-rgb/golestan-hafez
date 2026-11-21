import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/** GET — list all coupons (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "کد تخفیف را وارد کنید.")
    .max(24)
    .regex(/^[A-Za-z0-9\-_]+$/, "کد تخفیف فقط شامل حروف لاتین، عدد، خط تیره و زیرخط باشد."),
  type: z.enum(["PERCENT", "AMOUNT"]),
  value: z.number().int().min(1, "مقدار تخفیف معتبر نیست."),
  minTotal: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).max(9999).nullable().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional().or(z.literal("")),
});

/** POST — create a coupon (admin only). */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات کد تخفیف معتبر نیست." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    if (d.type === "PERCENT" && (d.value < 1 || d.value > 90)) {
      return NextResponse.json(
        { error: "درصد تخفیف باید بین ۱ تا ۹۰ باشد." },
        { status: 400 }
      );
    }
    if (d.type === "AMOUNT" && d.value < 1000) {
      return NextResponse.json(
        { error: "مبلغ تخفیف باید حداقل ۱۰۰۰ IRT باشد." },
        { status: 400 }
      );
    }

    const code = d.code.toUpperCase();
    const exists = await db.coupon.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: "این کد تخفیف قبلاً ثبت شده است." }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type: d.type,
        value: d.value,
        minTotal: d.minTotal ?? 0,
        usageLimit: d.usageLimit ?? null,
        active: d.active ?? true,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/coupons failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
