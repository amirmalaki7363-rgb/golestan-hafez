"use client";

import Image from "next/image";
import { ExternalLink, Plus, ZoomIn } from "lucide-react";

export interface ShopProduct {
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
 * Shared product card — used by the Best Sellers carousel and the
 * full-screen catalog page. The parent controls width via `className`.
 */
export function ProductCard({
  product,
  onOpenImage,
  onAddToCart,
  className,
  role,
  sizes = "228px",
  loading = "lazy",
}: {
  product: ShopProduct;
  onOpenImage: () => void;
  onAddToCart: () => void;
  className?: string;
  role?: string;
  sizes?: string;
  /**
   * «lazy» (default) suits vertical grids. Horizontal carousels must pass
   * «eager» once the section is near the viewport: lazy images that sit
   * beyond the visible carousel strip never intersect the viewport, so
   * they would only start loading when the user swipes — appearing as
   * empty boxes exactly when the user is looking at them.
   */
  loading?: "lazy" | "eager";
}) {
  const p = product;
  const soldOut = p.stock === 0;
  const hasDiscount = p.comparePrice != null && p.comparePrice > p.price;
  const discountPct = hasDiscount
    ? Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)
    : 0;

  return (
    <article role={role} className={`group ${className ?? ""}`}>
      <div
        className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-earth"
        onClick={onOpenImage}
      >
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes={sizes}
          loading={loading}
          className={`object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05] ${
            soldOut ? "opacity-60 grayscale-[40%]" : ""
          }`}
        />
        {/* badge (top-right in LTR flow) */}
        {(p.badge || p.featured) && !soldOut && (
          <span className="pointer-events-none absolute right-3 top-3 bg-cream/95 px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
            {p.badge || "ویژه"}
          </span>
        )}
        {/* discount (top-left) */}
        {hasDiscount && !soldOut && (
          <span className="pointer-events-none absolute left-3 top-3 bg-red-400/90 px-2 py-1 text-[10px] text-white">
            {discountPct.toLocaleString("fa-IR")}٪ تخفیف
          </span>
        )}
        {soldOut && (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-earth-dark/80 py-2 text-center text-[12px] text-cream/90">
            ناموجود
          </span>
        )}
        {/* zoom-in entry point (keyboard + touch) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImage();
          }}
          aria-label={`مشاهده بزرگ تصویر ${p.name}`}
          title="مشاهده بزرگ تصویر"
          className="absolute right-3 top-12 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-primary-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:bg-cream"
        >
          <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {/* dedicated product page — opens in a new tab */}
        <a
          href={`/product/${encodeURIComponent(p.sku)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`باز کردن صفحه ${p.name} در تب جدید`}
          title="مشاهده صفحه محصول در تب جدید"
          className="absolute right-3 top-[92px] flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-primary-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:bg-cream"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
        </a>
        {!soldOut && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 bg-cream/95 py-2.5 text-[13px] text-primary-foreground opacity-0 transition-all duration-300 hover:bg-cream group-hover:translate-y-0 group-hover:opacity-100 md:pointer-events-auto"
            aria-label={`ثبت انتخاب ${p.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
            ثبت انتخاب
          </button>
        )}
      </div>
      <h3 className="font-latin mt-3 line-clamp-2 min-h-[2.6em] text-[15px] font-normal leading-[1.3]">
        <a
          href={`/product/${encodeURIComponent(p.sku)}`}
          className="text-cream transition-opacity hover:opacity-75"
          aria-label={`مشاهده صفحه محصول ${p.name}`}
        >
          {p.name}
        </a>
      </h3>
      <p className="font-latin mt-1 text-[11px] tracking-wider text-muted-foreground">
        SKU {p.sku}
      </p>
      {soldOut ? (
        <p className="mt-2 text-[13px] text-muted-foreground">ناموجود</p>
      ) : (
        <button
          type="button"
          onClick={onAddToCart}
          className="mt-2 flex cursor-pointer items-baseline gap-2 text-cream transition-opacity hover:opacity-75"
          aria-label={`افزودن ${p.name} به سبد خرید`}
        >
          <span className="font-latin text-[15px]">
            {p.price.toLocaleString("en-US")}
          </span>
          <span className="font-latin text-[10px] tracking-wider text-muted-foreground">
            IRT
          </span>
          {hasDiscount && (
            <span className="font-latin text-[11px] text-muted-foreground line-through">
              {p.comparePrice!.toLocaleString("en-US")}
            </span>
          )}
        </button>
      )}
    </article>
  );
}
