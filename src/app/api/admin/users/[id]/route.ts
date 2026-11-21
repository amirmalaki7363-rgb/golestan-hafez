import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

/** PATCH — promote/demote a user (admin only; cannot change own role). */
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
      return NextResponse.json({ error: "نقش معتبر نیست." }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: "تغییر نقش حساب خودتان ممکن نیست." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    const user = await db.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, phone: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
