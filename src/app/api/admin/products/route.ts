import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { invalidateServerCache } from "@/lib/server-cache";
import { PRODUCT_CATEGORIES, PRODUCT_OCCASIONS } from "@/lib/constants";

/** GET — all products including inactive (admin only). */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const products = await db.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const categoryEnum = z.enum(PRODUCT_CATEGORIES).or(z.string().trim().min(1).max(60));

const createSchema = z.object({
  name: z.string().trim().min(2, "نام محصول را وارد کنید.").max(120),
  sku: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9\-_]*$/, "SKU فقط شامل حروف لاتین، عدد و خط تیره باشد.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(1200).optional().or(z.literal("")),
  category: categoryEnum.optional(),
  occasion: z.string().trim().max(60).optional(),
  price: z.number().int().min(0, "قیمت معتبر نیست."),
  comparePrice: z.number().int().min(0).nullable().optional(),
  image: z.string().trim().min(1, "مسیر تصویر را وارد کنید. نمونه: /images/rose-box.jpg"),
  badge: z.string().trim().max(40).optional().or(z.literal("")),
  stock: z.number().int().min(0).max(9999).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

function autoSku(name: string): string {
  const ascii = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${ascii || "GH"}-${rand}`;
}

/** POST — create a product (admin only). */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات محصول معتبر نیست." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const sku = (d.sku || autoSku(d.name)).toUpperCase();
    const exists = await db.product.findUnique({ where: { sku } });
    if (exists) {
      return NextResponse.json({ error: "این SKU قبلاً استفاده شده است." }, { status: 409 });
    }

    if (d.comparePrice != null && d.comparePrice > 0 && d.comparePrice <= d.price) {
      return NextResponse.json(
        { error: "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد." },
        { status: 400 }
      );
    }

    const maxSort = await db.product.aggregate({ _max: { sortOrder: true } });
    const product = await db.product.create({
      data: {
        name: d.name,
        sku,
        description: d.description || "",
        category: d.category || "باکس گل",
        occasion: d.occasion || "بدون مناسبت",
        price: d.price,
        comparePrice: d.comparePrice && d.comparePrice > 0 ? d.comparePrice : null,
        image: d.image,
        badge: d.badge || null,
        stock: d.stock ?? 10,
        featured: d.featured ?? false,
        active: d.active ?? true,
        sortOrder: d.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    invalidateServerCache();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
