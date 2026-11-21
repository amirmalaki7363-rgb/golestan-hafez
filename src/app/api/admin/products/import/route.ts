import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { invalidateServerCache } from "@/lib/server-cache";
import { normalizeCategoryInput, validateProductRow } from "@/lib/csv";

/**
 * POST /api/admin/products/import — bulk CSV import (admin only).
 *
 * Body: {
 *   rows: { sku, name, category, image, price? }[],   // pre-parsed by the admin dialog
 *   updateExisting: boolean,                          // update products whose SKU already exists
 *   defaultPrice: number                              // applied when a row has no price
 * }
 *
 * Each row is re-validated server-side with the same shared validator used by
 * the client preview. Valid rows are created (or updated) one by one; every
 * row outcome is reported back so the UI can show a precise summary.
 */

// Intentionally lenient: malformed rows are reported per-row via the shared
// validator instead of rejecting the whole batch.
const rowSchema = z.object({
  sku: z.string().max(40),
  name: z.string().max(200),
  category: z.string().max(60).optional().default(""),
  image: z.string().max(500),
  price: z.number().int().min(-1).max(999_999_999_999).nullable().optional(),
  line: z.number().int().min(1).max(100_000).optional(),
});

const importSchema = z.object({
  rows: z
    .array(rowSchema)
    .min(1, "هیچ ردیفی برای درون‌ریزی ارسال نشده است.")
    .max(500, "حداکثر ۵۰۰ ردیف در هر بار درون‌ریزی پذیرفته می‌شود."),
  updateExisting: z.boolean().optional().default(false),
  defaultPrice: z.number().int().min(0).max(999_999_999_999).optional().default(0),
});

interface RowOutcome {
  sku: string;
  name?: string;
  line?: number;
  reason: string;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "دسترسی فقط برای مدیر." }, { status: 403 });
    }

    const parsed = importSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      console.error("import payload invalid:", parsed.error.issues[0]);
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده‌های درون‌ریزی معتبر نیست." },
        { status: 400 }
      );
    }

    const { rows, updateExisting, defaultPrice } = parsed.data;

    const maxSort = await db.product.aggregate({ _max: { sortOrder: true } });
    let nextSort = (maxSort._max.sortOrder ?? 0) + 1;

    let created = 0;
    let updated = 0;
    const skipped: RowOutcome[] = [];
    const failed: RowOutcome[] = [];

    for (const row of rows) {
      const sku = row.sku.trim().toUpperCase();
      const name = row.name.trim();
      const image = row.image.trim();
      const category = normalizeCategoryInput(row.category || "");

      // shared validator — identical rules to the client-side preview
      const errors = validateProductRow({
        sku,
        name,
        category,
        image,
        price: row.price ?? null,
      });
      if (errors.length > 0) {
        failed.push({ sku, name, line: row.line, reason: errors.join(" ") });
        continue;
      }

      try {
        const existing = await db.product.findUnique({ where: { sku } });

        if (existing) {
          if (!updateExisting) {
            skipped.push({ sku, name, line: row.line, reason: "شناسه قبلاً در فروشگاه وجود دارد." });
            continue;
          }
          await db.product.update({
            where: { sku },
            data: {
              name,
              image,
              ...(category ? { category } : {}),
              // only touch price when the CSV row actually carries one
              ...(row.price != null && row.price >= 0 ? { price: row.price } : {}),
            },
          });
          updated++;
          continue;
        }

        await db.product.create({
          data: {
            sku,
            name,
            description: "",
            category: category || "باکس گل",
            occasion: "بدون مناسبت",
            price: row.price != null && row.price >= 0 ? row.price : defaultPrice,
            image,
            stock: 10,
            active: true,
            sortOrder: nextSort++,
          },
        });
        created++;
      } catch (rowError) {
        console.error(`import row ${sku} failed:`, rowError);
        failed.push({ sku, name, line: row.line, reason: "خطای پایگاه داده در ذخیره این ردیف." });
      }
    }

    invalidateServerCache();
    return NextResponse.json({ created, updated, skipped, failed });
  } catch (error) {
    console.error("POST /api/admin/products/import failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
