"use client";

/**
 * محصولات مرتبط — same-category products on the dedicated product page.
 * Grid of shared ProductCards + the full-screen lightbox, mirroring the
 * Best Sellers wiring (cart + lightbox state kept local).
 */

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { ProductCard, type ShopProduct } from "./product-card";
import { ProductLightbox } from "./product-lightbox";
import { Reveal } from "./reveal";

export function RelatedProducts({ products }: { products: ShopProduct[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  if (products.length === 0) return null;

  return (
    <section
      aria-label="محصولات مرتبط"
      className="bg-[radial-gradient(ellipse_at_top,#46331f_0%,#2d1e14_72%)] py-16 md:py-20"
    >
      <div className="mx-auto max-w-[1220px] px-4 md:px-6">
        <Reveal dir="ltr" className="flex items-end justify-between">
          <h2 className="font-latin text-[22px] font-light text-cream md:text-[24px]">
            You May Also Like
          </h2>
          <p dir="rtl" className="text-[12px] font-light text-cream/60">
            از همین مجموعه
          </p>
        </Reveal>

        <div
          dir="ltr"
          className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4"
          role="list"
          aria-label="محصولات مرتبط"
        >
          {products.map((p, idx) => {
            return (
              <ProductCard
                key={p.id}
                role="listitem"
                product={p}
                onOpenImage={() => setLightboxIndex(idx)}
                onAddToCart={() =>
                  addItem({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    image: p.image,
                  })
                }
              />
            );
          })}
        </div>
      </div>

      <ProductLightbox
        products={products}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
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
