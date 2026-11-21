import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  hashPassword,
  normalizePhone,
  sessionCookieOptions,
  toSafeUser,
  SESSION_COOKIE,
} from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد.").max(60),
  phone: z.string(),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد.").max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست. نمونه: 09123456789" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "این شماره قبلاً ثبت شده است. وارد شوید." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        phone,
        password: hashPassword(parsed.data.password),
        role: "USER",
      },
    });

    const { token, maxAge } = await createSession(user.id);
    const res = NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
    return res;
  } catch (error) {
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json({ error: "خطای سرور؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
