import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/** GET — every order with customer info (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const orders = await db.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
