import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES),
});

/** PATCH — change order status (admin only). */
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
      return NextResponse.json({ error: "وضعیت معتبر نیست." }, { status: 400 });
    }

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
    }

    const order = await db.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { items: true },
    });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
