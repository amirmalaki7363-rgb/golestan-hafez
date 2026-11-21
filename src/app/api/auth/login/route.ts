import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  normalizePhone,
  sessionCookieOptions,
  toSafeUser,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";

const schema = z.object({
  phone: z.string(),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
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
      return NextResponse.json({ error: "شماره موبایل معتبر نیست." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user || !verifyPassword(parsed.data.password, user.password)) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const { token, maxAge } = await createSession(user.id);
    const res = NextResponse.json({ user: toSafeUser(user) });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
    return res;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json({ error: "خطای سرور؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
