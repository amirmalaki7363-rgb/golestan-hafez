import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { invalidateServerCache } from "@/lib/server-cache";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  sku: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9\-_]+$/, "SKU فقط شامل حروف لاتین، عدد و خط تیره باشد.")
    .optional(),
  description: z.string().trim().max(1200).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  occasion: z.string().trim().min(1).max(60).optional(),
  price: z.number().int().min(0).optional(),
  comparePrice: z.number().int().min(0).nullable().optional(),
  image: z.string().trim().min(1).max(300).optional(),
  badge: z.string().trim().max(40).nullable().optional(),
  stock: z.number().int().min(0).max(9999).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

/** PATCH — update product fields (admin only). */
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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات معتبر نیست." },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }

    const d = parsed.data;
    if (d.sku && d.sku.toUpperCase() !== existing.sku) {
      const skuTaken = await db.product.findUnique({
        where: { sku: d.sku.toUpperCase() },
      });
      if (skuTaken) {
        return NextResponse.json({ error: "این SKU قبلاً استفاده شده است." }, { status: 409 });
      }
    }

    const nextPrice = d.price ?? existing.price;
    const nextCompare =
      d.comparePrice !== undefined ? d.comparePrice : existing.comparePrice;
    if (nextCompare != null && nextCompare > 0 && nextCompare <= nextPrice) {
      return NextResponse.json(
        { error: "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد." },
        { status: 400 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.sku !== undefined ? { sku: d.sku.toUpperCase() } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.category !== undefined ? { category: d.category } : {}),
        ...(d.occasion !== undefined ? { occasion: d.occasion } : {}),
        ...(d.price !== undefined ? { price: d.price } : {}),
        ...(d.comparePrice !== undefined
          ? { comparePrice: d.comparePrice && d.comparePrice > 0 ? d.comparePrice : null }
          : {}),
        ...(d.image !== undefined ? { image: d.image } : {}),
        ...(d.badge !== undefined ? { badge: d.badge || null } : {}),
        ...(d.stock !== undefined ? { stock: d.stock } : {}),
        ...(d.featured !== undefined ? { featured: d.featured } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });
    invalidateServerCache();
    return NextResponse.json({ product });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** DELETE — remove a product from the catalog (admin only). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
    }

    await db.product.delete({ where: { id } });
    invalidateServerCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
