import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

/** GET — admin activity feed: new orders, recent sign-ups, stock alerts. */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const since = new Date(Date.now() - 7 * DAY_MS);

    const [
      recentOrders,
      recentUsers,
      stockAlerts,
      pendingOrders,
      newUsers7d,
      lowStock,
      outOfStock,
    ] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { items: { select: { id: true } } },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, phone: true, role: true, createdAt: true },
      }),
      db.product.findMany({
        where: { active: true, stock: { lte: 3 } },
        orderBy: { stock: "asc" },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true, image: true },
      }),
      db.order.count({ where: { status: "PENDING" } }),
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.product.count({ where: { stock: { gt: 0, lte: 3 } } }),
      db.product.count({ where: { stock: 0 } }),
    ]);

    return NextResponse.json({
      activity: {
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          code: o.code,
          customerName: o.customerName,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          itemsCount: o.items.length,
        })),
        recentUsers,
        stockAlerts,
        counts: {
          pendingOrders,
          newUsers7d,
          lowStock,
          outOfStock,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/activity failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
