"use client";

import dynamic from "next/dynamic";
import { useAllProductsStore } from "@/lib/all-products-store";
import type { StorefrontProduct } from "@/lib/storefront-products";

// The full-screen catalog page is code-split: its chunk is fetched only
// when a visitor opens «همه محصولات» — not on the initial storefront load.
const AllProductsPage = dynamic(
  () => import("./all-products-page").then((m) => m.AllProductsPage),
  { ssr: false }
);

/**
 * Outer gate — mounts the page fresh on every open, so the filter and
 * scroll position start clean without needing a setState-in-effect reset.
 */
export function AllProducts({
  initialProducts,
}: {
  /** Prefetched server-side — the catalog opens fully rendered. */
  initialProducts?: StorefrontProduct[];
}) {
  const open = useAllProductsStore((s) => s.open);
  if (!open) return null;
  return <AllProductsPage initialProducts={initialProducts} />;
}
