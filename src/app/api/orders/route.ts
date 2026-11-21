import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, normalizePhone } from "@/lib/auth";
import { discountFor } from "@/lib/coupon";
import { getSettings } from "@/lib/settings";

/** GET — current user's own orders (newest first). */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "ابتدا وارد حساب خود شوید." }, { status: 401 });
    }
    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json({ error: "خطا در دریافت سفارش‌ها" }, { status: 500 });
  }
}

const createSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1, "سبد خرید خالی است."),
  customerName: z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید.").max(60),
  customerPhone: z.string(),
  address: z.string().trim().min(5, "آدرس تحویل را وارد کنید.").max(400),
  note: z.string().trim().max(400).optional().or(z.literal("")),
  couponCode: z.string().trim().max(24).optional().or(z.literal("")),
});

function generateOrderCode(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GH-${ymd}-${rand}`;
}

/** POST — place a real order from the cart (guest checkout allowed, prices re-checked server-side). */
export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات سفارش معتبر نیست." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.customerPhone);
    if (!phone) {
      return NextResponse.json(
        { error: "شماره تماس معتبر نیست. نمونه: 09123456789" },
        { status: 400 }
      );
    }

    // Re-read products from DB — never trust client prices.
    const ids = parsed.data.items.map((i) => i.id);
    const products = await db.product.findMany({ where: { id: { in: ids }, active: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems: {
      productId: string;
      name: string;
      sku: string;
      price: number;
      qty: number;
      image: string;
    }[] = [];

    for (const item of parsed.data.items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json(
          { error: "یکی از محصولات سبد دیگر موجود نیست. سبد را به‌روز کنید." },
          { status: 400 }
        );
      }
      if (product.stock > 0 && product.stock < item.qty) {
        return NextResponse.json(
          { error: `موجودی «${product.name}» کافی نیست (${product.stock} عدد).` },
          { status: 400 }
        );
      }
      orderItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        qty: item.qty,
        image: product.image,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Coupon — validated server-side again.
    let discount = 0;
    let appliedCouponCode: string | null = null;
    const rawCode = parsed.data.couponCode?.trim();
    if (rawCode) {
      const code = rawCode.toUpperCase();
      const coupon = await db.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: "کد تخفیف معتبر نیست." }, { status: 400 });
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
      if (subtotal < coupon.minTotal) {
        return NextResponse.json(
          { error: `این کد برای سبد بالای ${coupon.minTotal.toLocaleString("en-US")} IRT است.` },
          { status: 400 }
        );
      }
      discount = discountFor(coupon, subtotal);
      appliedCouponCode = coupon.code;
      await db.coupon.update({
        where: { code },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Math.max(0, subtotal - discount);

    // Shipping fee from store settings.
    const settings = await getSettings();
    const shipping = settings.deliveryFee;

    const finalTotal = total + shipping;
    const user = await getSessionUser();

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: user?.id ?? null,
          customerName: parsed.data.customerName,
          customerPhone: phone,
          address: parsed.data.address,
          note: parsed.data.note || null,
          total: finalTotal,
          discount,
          shipping,
          couponCode: appliedCouponCode,
          status: "PENDING",
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Decrement stock for tracked products.
      for (const it of orderItems) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: Math.min(it.qty, 9999) } },
        });
      }
      // Floor at zero (products with stock=0 mean untracked/unlimited).
      await tx.product.updateMany({
        where: { id: { in: orderItems.map((i) => i.productId) }, stock: { lt: 0 } },
        data: { stock: 0 },
      });

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ error: "ثبت سفارش انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
