import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/order-status-core";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const since = new Date(Date.now() - 13 * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const [
      ordersCount,
      pendingCount,
      usersCount,
      productsCount,
      lowStock,
      outOfStock,
      deliveredCount,
      cancelledCount,
      revenueAgg,
      discountsAgg,
      recentOrders,
      recentWindowOrders,
      allItems,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.user.count(),
      db.product.count(),
      db.product.count({ where: { stock: { gt: 0, lte: 3 } } }),
      db.product.count({ where: { stock: 0 } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { discount: true },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { select: { id: true } } },
      }),
      db.order.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, total: true, status: true },
      }),
      db.orderItem.findMany({
        where: { order: { status: { not: "CANCELLED" } } },
        select: { name: true, sku: true, qty: true, price: true },
      }),
    ]);

    // 14-day sales series (oldest → newest).
    const series: { day: string; orders: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(Date.now() - i * DAY_MS);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const dayOrders = recentWindowOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      const valid = dayOrders.filter((o) => o.status !== "CANCELLED");
      series.push({
        day: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        orders: dayOrders.length,
        revenue: valid.reduce((s, o) => s + o.total, 0),
      });
    }

    const statusCounts: Record<string, number> = {};
    for (const s of ORDER_STATUSES) {
      statusCounts[s] =
        s === "PENDING"
          ? pendingCount
          : s === "DELIVERED"
            ? deliveredCount
            : s === "CANCELLED"
              ? cancelledCount
              : 0;
    }
    const grouped = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
    for (const g of grouped) statusCounts[g.status] = g._count._all;

    // Top-5 best-selling products (by sold qty), aggregated in JS for correct revenue.
    const bySku = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    for (const it of allItems) {
      const cur = bySku.get(it.sku) ?? { name: it.name, sku: it.sku, qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.qty * it.price;
      bySku.set(it.sku, cur);
    }
    const topProducts = [...bySku.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    return NextResponse.json({
      stats: {
        revenue: revenueAgg._sum.total ?? 0,
        orders: ordersCount,
        pending: pendingCount,
        users: usersCount,
        products: productsCount,
        lowStock,
        outOfStock,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        discountsGiven: discountsAgg._sum.discount ?? 0,
        statusCounts,
        salesSeries: series,
        topProducts,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        code: o.code,
        customerName: o.customerName,
        total: o.total,
        discount: o.discount,
        status: o.status,
        createdAt: o.createdAt,
        itemsCount: o.items.length,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
