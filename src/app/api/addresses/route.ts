import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد حساب خود شوید." }, { status: 401 });
  }
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ addresses });
}

const createSchema = z.object({
  title: z.string().trim().min(1, "عنوان آدرس را وارد کنید.").max(40),
  city: z.string().trim().min(1, "شهر را انتخاب کنید.").max(30),
  detail: z.string().trim().min(5, "آدرس کامل را وارد کنید.").max(400),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "ابتدا وارد حساب خود شوید." }, { status: 401 });
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات معتبر نیست." },
        { status: 400 }
      );
    }

    const address = await db.address.create({
      data: { ...parsed.data, userId: user.id },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("POST /api/addresses failed:", error);
    return NextResponse.json({ error: "خطای سرور؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
