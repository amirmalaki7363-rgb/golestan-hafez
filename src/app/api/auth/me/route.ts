import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, toSafeUser, verifyPassword } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const [ordersCount, activeCount, spentAgg] = await Promise.all([
      db.order.count({ where: { userId: sessionUser.id } }),
      db.order.count({
        where: {
          userId: sessionUser.id,
          status: { in: ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED"] },
        },
      }),
      db.order.aggregate({
        where: { userId: sessionUser.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      user: sessionUser,
      stats: {
        orders: ordersCount,
        active: activeCount,
        spent: spentAgg._sum.total ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

const patchSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد.").max(60).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد.").max(72).optional(),
});

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "ابتدا وارد حساب خود شوید." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات معتبر نیست." },
        { status: 400 }
      );
    }

    const data: { name?: string; password?: string } = {};

    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
    }

    if (parsed.data.newPassword !== undefined) {
      const current = parsed.data.currentPassword ?? "";
      const dbUser = await db.user.findUnique({ where: { id: sessionUser.id } });
      if (!dbUser || !verifyPassword(current, dbUser.password)) {
        return NextResponse.json({ error: "رمز عبور فعلی اشتباه است." }, { status: 400 });
      }
      data.password = hashPassword(parsed.data.newPassword);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "تغییری ارسال نشده است." }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: sessionUser.id },
      data,
    });
    return NextResponse.json({ user: toSafeUser(updated) });
  } catch (error) {
    console.error("PATCH /api/auth/me failed:", error);
    return NextResponse.json({ error: "خطای سرور؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
