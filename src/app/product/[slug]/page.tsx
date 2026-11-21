import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { AccountDrawer } from "@/components/shop/account-drawer";
import { ProductPurchasePanel } from "@/components/shop/product-detail";
import { RelatedProducts } from "@/components/shop/related-products";
import { db } from "@/lib/db";
import { getSiteContent } from "@/lib/site-content";

/**
 * صفحه اختصاصی هر محصول — /product/{sku}
 * Shareable standalone page: full site chrome (header/footer/drawers),
 * big product image, purchase panel and same-category related products.
 * Opened in a new tab from product cards and the image lightbox.
 */

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return db.product.findFirst({
    where: {
      active: true,
      OR: [{ sku: slug.toUpperCase() }, { id: slug }],
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "محصول پیدا نشد | گلستان حافظ" };
  }
  const title = `${product.name} | گلستان حافظ`;
  const description =
    product.description ||
    `${product.name} از مجموعه «${product.category}» — سفارش آنلاین با ارسال در تهران و اصفهان از استودیو گل گلستان حافظ.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [product.image] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const content = await getSiteContent();
  const related = await db.product.findMany({
    where: {
      active: true,
      category: product.category,
      id: { not: product.id },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: 8,
  });

  const soldOut = product.stock === 0;
  const hasDiscount =
    product.comparePrice != null && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100
      )
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <CartDrawer />
      <AccountDrawer />

      <main className="flex-1">
        {/* breadcrumb — clears the fixed header */}
        <nav
          aria-label="مسیر صفحه"
          className="mx-auto w-full max-w-[1220px] px-4 pt-24 md:px-6 md:pt-28"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-cream"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            بازگشت به فروشگاه
          </Link>
        </nav>

        {/* product hero */}
        <section className="mx-auto grid max-w-[1220px] gap-8 px-4 pb-14 pt-6 md:grid-cols-2 md:gap-12 md:px-6 md:pb-20">
          {/* image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-earth">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 560px, 100vw"
              quality={90}
              className={`object-cover ${soldOut ? "opacity-60 grayscale-[40%]" : ""}`}
            />
            {(product.badge || product.featured) && !soldOut && (
              <span className="pointer-events-none absolute right-3 top-3 bg-cream/95 px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
                {product.badge || "ویژه"}
              </span>
            )}
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
          </div>

          {/* info & purchase */}
          <ProductPurchasePanel
            product={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              category: product.category,
              occasion: product.occasion,
              price: product.price,
              comparePrice: product.comparePrice,
              image: product.image,
              badge: product.badge,
              stock: product.stock,
              featured: product.featured,
              description: product.description,
            }}
            whatsappPhone={content.whatsapp.phone}
          />
        </section>

        <RelatedProducts
          products={related.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image,
            badge: p.badge,
            stock: p.stock,
            featured: p.featured,
            category: p.category,
          }))}
        />
      </main>

      <Footer />
    </div>
  );
}
