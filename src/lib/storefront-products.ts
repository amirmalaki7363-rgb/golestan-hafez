import { db } from "@/lib/db";
import { cached } from "@/lib/server-cache";

/**
 * Storefront product shape — mirrors what the public API returns
 * (see GET /api/products) so client components can consume either.
 */
export interface StorefrontProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  comparePrice: number | null;
  image: string;
  badge: string | null;
  stock: number;
  featured: boolean;
  category?: string;
}

/**
 * Server-side product fetch for the storefront. Called directly from the
 * homepage server component so the initial HTML already contains the
 * products — no post-hydration fetch waterfall, no skeleton flash.
 *
 * Never throws: a DB hiccup renders an empty catalog instead of a 500.
 */
export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  // Cached: the homepage server component calls this on every request.
  return cached("storefront-products", async () => {
    try {
      return await db.product.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        comparePrice: true,
        image: true,
        badge: true,
        stock: true,
        featured: true,
        category: true,
        },
      });
    } catch (error) {
      console.error("getStorefrontProducts failed:", error);
      return [];
    }
  });
}
