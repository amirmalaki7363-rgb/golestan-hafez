"use client";

/**
 * اطلاعات و خرید محصول — right column of the dedicated product page.
 * Price/stock/description plus the actions: add to cart, WhatsApp order
 * (pre-filled message) and copy share link.
 */

import { useRef, useState, useSyncExternalStore } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export interface ProductDetailData {
  id: string;
  sku: string;
  name: string;
  category: string;
  occasion: string;
  price: number;
  comparePrice: number | null;
  image: string;
  badge: string | null;
  stock: number;
  featured: boolean;
  description: string;
}

/** SSR-safe current page URL: empty on the server, real href after hydration. */
function usePageUrl(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => ""
  );
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ProductPurchasePanel({
  product,
  whatsappPhone,
}: {
  product: ProductDetailData;
  whatsappPhone: string;
}) {
  const p = product;
  const addItem = useCartStore((s) => s.addItem);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageUrl = usePageUrl();

  const soldOut = p.stock === 0;
  const lowStock = !soldOut && p.stock <= 3;
  const hasDiscount = p.comparePrice != null && p.comparePrice > p.price;
  const discountPct = hasDiscount
    ? Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)
    : 0;

  const addToCart = () =>
    addItem({ id: p.id, name: p.name, sku: p.sku, price: p.price, image: p.image });

  const copyLink = async () => {
    const url = window.location.href;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      } else {
        ok = fallbackCopy(url);
      }
    } catch {
      ok = fallbackCopy(url);
    }
    if (ok) {
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2200);
    }
  };

  const waText = encodeURIComponent(
    `سلام! می‌خواهم این محصول را از گلستان حافظ سفارش دهم:\n${p.name}\nSKU: ${p.sku}${pageUrl ? `\n${pageUrl}` : ""}`
  );
  const waLink = `https://wa.me/${whatsappPhone.replace(/^0/, "98")}?text=${waText}`;

  return (
    <div dir="rtl" className="flex flex-col">
      {/* meta chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-cream/25 px-3 py-1 text-[11px] text-cream/85">
          {p.category}
        </span>
        <span className="text-[11px] text-muted-foreground">{p.occasion}</span>
        {p.badge && (
          <span className="bg-cream/95 px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
            {p.badge}
          </span>
        )}
        {p.featured && (
          <span className="flex items-center gap-1 text-[10.5px] text-cream/70">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ویژه گلستان حافظ
          </span>
        )}
      </div>

      <h1 className="font-latin mt-4 text-[24px] font-normal leading-[1.35] text-cream md:text-[30px]">
        {p.name}
      </h1>
      <p className="font-latin mt-1.5 text-[11px] tracking-[0.2em] text-muted-foreground">
        SKU {p.sku}
      </p>

      {/* price */}
      {soldOut ? (
        <p className="mt-5 text-[15px] text-muted-foreground">ناموجود</p>
      ) : (
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-latin text-[26px] leading-none text-cream md:text-[30px]">
            {p.price.toLocaleString("en-US")}
          </span>
          <span className="font-latin text-[11px] tracking-widest text-muted-foreground">
            IRT
          </span>
          {hasDiscount && (
            <>
              <span className="font-latin text-[13px] text-muted-foreground line-through">
                {p.comparePrice!.toLocaleString("en-US")}
              </span>
              <span className="bg-red-400/90 px-2 py-0.5 text-[10.5px] text-white">
                {discountPct.toLocaleString("fa-IR")}٪ تخفیف
              </span>
            </>
          )}
        </div>
      )}

      {/* stock */}
      <p className="mt-3 flex items-center gap-2 text-[12.5px]">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            soldOut ? "bg-red-400/80" : lowStock ? "bg-amber-400" : "bg-emerald-400"
          }`}
        />
        {soldOut ? (
          <span className="text-muted-foreground">موجودی این محصول تمام شده است.</span>
        ) : lowStock ? (
          <span className="text-amber-300/90">
            تنها {p.stock.toLocaleString("fa-IR")} عدد باقی مانده — سریع ثبت کنید.
          </span>
        ) : (
          <span className="text-cream/75">موجود در انبار — آماده ارسال</span>
        )}
      </p>

      {/* description */}
      {p.description && (
        <p className="gh-scroll mt-6 max-h-52 overflow-y-auto border-t border-border/60 pt-4 text-[13.5px] font-light leading-7 text-cream/80 whitespace-pre-line">
          {p.description}
        </p>
      )}

      {/* actions */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {!soldOut && (
          <button
            type="button"
            onClick={addToCart}
            className="flex items-center gap-2 bg-cream px-7 py-3 text-[14px] text-primary-foreground transition-colors hover:bg-white"
            aria-label={`افزودن ${p.name} به سبد خرید`}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            ثبت انتخاب
          </button>
        )}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-[#25D366]/60 px-5 py-3 text-[13px] text-[#7ce0a3] transition-colors hover:bg-[#25D366]/10"
          aria-label={`سفارش ${p.name} در واتس‌آپ`}
        >
          سفارش در واتس‌آپ
        </a>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="flex items-center gap-1.5 border border-cream/25 px-4 py-3 text-[12.5px] text-cream/85 transition-colors hover:bg-cream/10"
          aria-label="کپی لینک این محصول"
          title="کپی لینک محصول"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              کپی شد
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              کپی لینک
            </>
          )}
        </button>
      </div>

      <p className="mt-5 flex items-center gap-2 text-[11.5px] font-light text-muted-foreground">
        <Truck className="h-4 w-4" aria-hidden="true" />
        ارسال در تهران و اصفهان — بسته‌بندی ویژه گلستان حافظ
      </p>
    </div>
  );
}
