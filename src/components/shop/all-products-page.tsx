"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllProductsStore } from "@/lib/all-products-store";
import { useCartStore } from "@/lib/cart-store";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { ProductCard, type ShopProduct } from "./product-card";
import { ProductLightbox } from "./product-lightbox";

/** Convert latin digits to Persian digits. */
const faDigits = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);


function GridSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] w-full animate-pulse bg-earth-light/30" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-earth-light/25" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-earth-light/20" />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-colors",
        active
          ? "border-cream bg-cream text-primary-foreground"
          : "border-cream/25 text-cream/80 hover:border-cream/50 hover:text-cream"
      )}
    >
      {children}
    </button>
  );
}

export function AllProductsPage({
  initialProducts,
}: {
  initialProducts?: StorefrontProduct[];
}) {
  const setOpen = useAllProductsStore((s) => s.setOpen);
  const addItem = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts ?? []);
  // With server-prefetched data there is no skeleton phase — the grid is
  // complete on mount. A silent background refresh below keeps the catalog
  // current after CSV imports / admin edits without any loading flash.
  const [loading, setLoading] = useState(initialProducts == null);
  const [filter, setFilter] = useState<string | null>(null);
  // lightbox remembers the filter it was opened under; switching the filter
  // invalidates it automatically (derived, no effect needed)
  const [lightbox, setLightbox] = useState<{
    index: number;
    category: string | null;
  } | null>(null);

  // Lock the background page + close on Escape while the page is open.
  // The image lightbox handles its own Escape — don't close the page under it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[data-slot="dialog-content"]')) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [setOpen]);

  // Silent refresh on every open — swaps in fresh data when the catalog
  // was mutated (admin panel / CSV import) since the page was rendered.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products ?? []);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter((c): c is string => !!c))
      ),
    [products]
  );

  const visible = filter
    ? products.filter((p) => p.category === filter)
    : products;
  const lightboxIndex =
    lightbox && lightbox.category === filter ? lightbox.index : null;

  const addToCart = (p: ShopProduct) =>
    addItem({ id: p.id, name: p.name, sku: p.sku, price: p.price, image: p.image });

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="همه محصولات گلستان حافظ"
      className="fixed inset-0 z-[70] overflow-y-auto bg-background animate-in fade-in duration-300"
    >
      <div className="flex min-h-full flex-col">
        {/* Top bar — back button + brand */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex cursor-pointer items-center gap-2 text-[13px] text-cream/85 transition-opacity hover:opacity-70"
              aria-label="بازگشت به صفحه اصلی"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              بازگشت
            </button>
            <p className="font-latin text-[13px] text-cream/70">
              <span className="font-semibold">Golestane</span>{" "}
              <span className="font-light">Hafez</span>
            </p>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 md:px-8">
          {/* Intro */}
          <div className="pt-12 pb-8 text-center md:pt-16">
            <LayoutGrid
              className="mx-auto h-9 w-9 text-cream/60"
              strokeWidth={1}
              aria-hidden="true"
            />
            <p className="gh-label mt-5">THE COMPLETE EDIT</p>
            <h1 className="mt-3 text-[26px] font-light text-cream md:text-[32px]">
              همه محصولات
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[13px] font-light leading-7 text-muted-foreground">
              تمام محصولات استودیو گلستان حافظ — با فیلتر دسته‌بندی، گل مورد
              نظرتان را جداگانه ببینید. برای تماشای بزرگ هر گل، روی تصویر کلیک
              کنید.
            </p>
            {!loading && visible.length > 0 && (
              <p className="mt-4 text-[12px] font-light text-muted-foreground/80">
                {faDigits(String(visible.length))} محصول
                {filter ? ` در دسته‌بندی «${filter}»` : ""}
              </p>
            )}
          </div>

          {/* Category filter chips */}
          {!loading && categories.length > 0 && (
            <div
              role="group"
              aria-label="فیلتر دسته‌بندی محصولات"
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:justify-center md:px-0"
            >
              <FilterChip active={filter === null} onClick={() => setFilter(null)}>
                همه
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  active={filter === c}
                  onClick={() => setFilter(c)}
                >
                  {c}
                </FilterChip>
              ))}
            </div>
          )}

          {/* Products grid */}
          <div
            aria-live="polite"
            className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
          >
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <GridSkeleton key={i} />)
              : visible.map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onOpenImage={() =>
                      setLightbox({ index: idx, category: filter })
                    }
                    onAddToCart={() => addToCart(p)}
                  />
                ))}
          </div>

          {!loading && visible.length === 0 && (
            <p className="py-16 text-center text-[14px] font-light text-cream/70">
              در حال حاضر محصولی در دسته‌بندی «{filter}» موجود نیست — به‌زودی
              اضافه می‌شود.
            </p>
          )}
        </main>

        {/* Footer strip (sticks to bottom when the grid is short) */}
        <footer className="mt-auto border-t border-border/60 py-8 text-center">
          <p className="font-latin text-[10px] tracking-[0.4em] text-muted-foreground">
            GOLESTANE HAFEZ
          </p>
          <p className="mt-2 text-[11px] font-light text-muted-foreground/70">
            استودیو گل گلستان حافظ — ارسال در تهران و اصفهان
          </p>
        </footer>
      </div>

      {/* full-screen image viewer */}
      <ProductLightbox
        products={visible}
        index={lightboxIndex}
        onIndexChange={(i) =>
          setLightbox((lb) => (lb ? { ...lb, index: i } : null))
        }
        onClose={() => setLightbox(null)}
        onAddToCart={(prod) =>
          addItem({
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            price: prod.price,
            image: prod.image,
          })
        }
      />
    </div>
  );
}
