import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { discountFor } from "@/lib/coupon";

const schema = z.object({
  code: z.string().trim().min(1).max(24),
  subtotal: z.number().int().min(0),
});

/** POST — public: validate a coupon against the cart subtotal. */
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "کد تخفیف را وارد کنید." }, { status: 400 });
    }

    const code = parsed.data.code.toUpperCase();
    const coupon = await db.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "کد تخفیف معتبر نیست." }, { status: 404 });
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "این کد تخفیف منقضی شده است." }, { status: 400 });
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "ظرفیت استفاده از این کد تخفیف تمام شده است." },
        { status: 400 }
      );
    }
    if (parsed.data.subtotal < coupon.minTotal) {
      return NextResponse.json(
        {
          error: `این کد برای سبد بالای ${coupon.minTotal.toLocaleString("en-US")} IRT است.`,
        },
        { status: 400 }
      );
    }

    const discount = discountFor(coupon, parsed.data.subtotal);
    return NextResponse.json({
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (error) {
    console.error("POST /api/coupons/validate failed:", error);
    return NextResponse.json({ error: "بررسی کد تخفیف ممکن نشد." }, { status: 500 });
  }
}
