"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useCategoryFilterStore } from "@/lib/category-filter-store";
import { useAllProductsStore } from "@/lib/all-products-store";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { ProductCard, type ShopProduct } from "./product-card";
import { ProductLightbox } from "./product-lightbox";
import { Reveal } from "./reveal";

function SkeletonCard() {
  return (
    <div className="w-[210px] shrink-0 md:w-[228px]">
      <div className="aspect-[3/4] w-full animate-pulse bg-earth-light/50" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-earth-light/40" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-earth-light/30" />
    </div>
  );
}

export function BestSellers({
  initialProducts,
}: {
  /** Prefetched server-side — renders real products on first paint. */
  initialProducts?: StorefrontProduct[];
}) {
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(initialProducts == null);
  // lightbox remembers the category it was opened under; switching the filter
  // invalidates it automatically (derived, no effect needed)
  const [lightbox, setLightbox] = useState<{
    index: number;
    category: string | null;
  } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  /**
   * Once the section approaches the viewport, flip every card to «eager».
   * Lazy images outside the visible carousel strip never intersect the
   * viewport — they would only fetch on swipe, showing empty boxes to the
   * user. Preloading them while the section is entering the view keeps the
   * carousel fully populated.
   */
  const [eagerImages, setEagerImages] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const category = useCategoryFilterStore((s) => s.category);
  const setCategory = useCategoryFilterStore((s) => s.setCategory);
  const setAllProductsOpen = useAllProductsStore((s) => s.setOpen);

  const lightboxIndex =
    lightbox && lightbox.category === category ? lightbox.index : null;
  const openLightbox = (idx: number) => setLightbox({ index: idx, category });

  const visible = category
    ? products.filter((p) => p.category === category)
    : products;

  // Fallback fetch for embeddings without server data (keeps the section
  // usable standalone). When initialProducts is provided nothing runs here.
  useEffect(() => {
    if (initialProducts) return;
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
  }, [initialProducts]);

  // Preload all carousel images when the section is close to the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || eagerImages) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEagerImages(true);
          io.disconnect();
        }
      },
      // 900px margin: start loading before the user reaches the section.
      { rootMargin: "900px 0px 900px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eagerImages]);

  const scroll = (dir: "next" | "prev") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section
      id="best-sellers"
      ref={sectionRef}
      aria-label="پرفروش‌ترین‌ها"
      className="bg-[radial-gradient(ellipse_at_top,#46331f_0%,#2d1e14_72%)] py-20 md:py-24"
    >
      <div className="mx-auto max-w-[1220px] px-4 md:px-6">
        {/* header row: controls (right) — title (left), as in reference */}
        <Reveal dir="ltr" className="flex items-end justify-between">
          <h2 className="font-latin text-[22px] md:text-[24px] font-light text-cream">
            Best Sellers
          </h2>
          <div dir="rtl" className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setAllProductsOpen(true)}
              className="gh-link !pb-1 !text-[14px] after:!h-[1px] cursor-pointer"
              aria-label="مشاهده همه محصولات در صفحه جداگانه"
            >
              View all
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("next")}
                aria-label="بعدی"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:bg-cream hover:text-primary-foreground"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
              </button>
              <button
                onClick={() => scroll("prev")}
                aria-label="قبلی"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:bg-cream hover:text-primary-foreground"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </Reveal>

        {/* active category filter (set from the «گل» header menu) */}
        {category && (
          <div dir="rtl" className="mt-6 flex items-center gap-3">
            <span className="text-[13px] text-cream/80">
              دسته‌بندی: <span className="text-cream">{category}</span>
            </span>
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-label={`حذف فیلتر ${category}`}
              className="flex items-center gap-1.5 border border-cream/25 px-3 py-1.5 text-[12px] text-cream/85 transition-colors hover:bg-cream hover:text-primary-foreground"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              حذف فیلتر
            </button>
          </div>
        )}

        {/* carousel */}
        <div
          dir="ltr"
          ref={trackRef}
          className="gh-scroll mt-8 flex gap-4 overflow-x-auto scroll-smooth pb-4"
          role="list"
          aria-label="محصولات پرفروش"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : visible.length === 0
              ? (
                <p className="py-14 text-center text-[14px] font-light text-cream/70">
                  در حال حاضر محصولی در دسته‌بندی «{category}» موجود نیست —
                  به‌زودی اضافه می‌شود.
                </p>
              )
              : visible.map((p, idx) => {
                const addToCart = () =>
                  addItem({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    image: p.image,
                  });
                return (
                  <ProductCard
                    key={p.id}
                    role="listitem"
                    className="w-[210px] shrink-0 md:w-[228px]"
                    product={p}
                    loading={eagerImages ? "eager" : "lazy"}
                    onOpenImage={() => openLightbox(idx)}
                    onAddToCart={addToCart}
                  />
                );
              })}
        </div>

        {/* explore more */}
        <Reveal className="mt-10 text-center">
          <a href="#collections" className="gh-link !text-[17px]">
            Explore More
          </a>
          <p className="mt-2 text-[12px] font-light text-muted-foreground">
            The complete Golestane Hafez edit
          </p>
        </Reveal>
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
    </section>
  );
}
