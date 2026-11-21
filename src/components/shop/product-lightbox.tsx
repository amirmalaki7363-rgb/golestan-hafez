"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface LightboxProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  image: string;
  stock: number;
}

interface View {
  zoom: number;
  x: number;
  y: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const CLICK_ZOOM = 2.2;
const WHEEL_FACTOR = 1.18;
const SWIPE_THRESHOLD = 48;
const HOME: View = { zoom: 1, x: 0, y: 0 };

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const iconBtn =
  "flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 bg-black/25 text-cream backdrop-blur-sm transition-colors hover:bg-cream hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40";

/**
 * Interactive image stage for one product. Keyed by product id upstream, so
 * zoom/pan/load state resets automatically when the viewer moves to another
 * product (no reset effects needed).
 *
 * - click image  → zoom in at pointer, click again → back to fit
 * - drag         → pan while zoomed, swipe prev/next while fitted
 * - wheel        → zoom at pointer (also ctrl+wheel / trackpad pinch)
 * - keyboard     → ←/→ navigate (RTL), +/- zoom, 0 reset, Esc close
 */
function LightboxStage({
  product,
  counterLabel,
  showArrows,
  onPrev,
  onNext,
  onClose,
  onAddToCart,
}: {
  product: LightboxProduct;
  counterLabel: string;
  showArrows: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onAddToCart: (product: LightboxProduct) => void;
}) {
  const [view, setView] = useState<View>(HOME);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const viewRef = useRef<View>(HOME);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    mode: "pan" | "swipe";
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const applyView = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const zoomAt = useCallback(
    (clientX: number | null, clientY: number | null, targetZoom: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const current = viewRef.current;
      const nextZoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
      if (Math.abs(nextZoom - current.zoom) < 0.001) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = clientX == null ? 0 : clientX - cx;
      const py = clientY == null ? 0 : clientY - cy;
      const ratio = nextZoom / current.zoom;
      const maxX = ((nextZoom - 1) * rect.width) / 2;
      const maxY = ((nextZoom - 1) * rect.height) / 2;
      const nx =
        nextZoom === MIN_ZOOM
          ? 0
          : clamp(px - ratio * (px - current.x), -maxX, maxX);
      const ny =
        nextZoom === MIN_ZOOM
          ? 0
          : clamp(py - ratio * (py - current.y), -maxY, maxY);
      applyView({ zoom: nextZoom, x: nx, y: ny });
    },
    [applyView]
  );

  // keyboard: navigation (RTL ← = next) + zoom controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "+" || e.key === "=") {
        zoomAt(null, null, viewRef.current.zoom * WHEEL_FACTOR);
      } else if (e.key === "-") {
        zoomAt(null, null, viewRef.current.zoom / WHEEL_FACTOR);
      } else if (e.key === "0") {
        applyView(HOME);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, zoomAt, applyView]);

  // wheel zoom around the pointer (passive: false so we can preventDefault)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(
        e.clientX,
        e.clientY,
        viewRef.current.zoom * (e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR)
      );
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const v = viewRef.current;
    pointerRef.current = {
      id: e.pointerId,
      mode: v.zoom > MIN_ZOOM ? "pan" : "swipe",
      startX: e.clientX,
      startY: e.clientY,
      baseX: v.x,
      baseY: v.y,
      moved: false,
    };
    if (v.zoom > MIN_ZOOM) setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ps = pointerRef.current;
    if (!ps || ps.id !== e.pointerId) return;
    const dx = e.clientX - ps.startX;
    const dy = e.clientY - ps.startY;
    if (!ps.moved && Math.hypot(dx, dy) > 4) ps.moved = true;
    if (ps.mode !== "pan") return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const v = viewRef.current;
    const maxX = ((v.zoom - 1) * rect.width) / 2;
    const maxY = ((v.zoom - 1) * rect.height) / 2;
    applyView({
      zoom: v.zoom,
      x: clamp(ps.baseX + dx, -maxX, maxX),
      y: clamp(ps.baseY + dy, -maxY, maxY),
    });
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const ps = pointerRef.current;
    if (!ps || ps.id !== e.pointerId) return;
    pointerRef.current = null;
    if (ps.mode === "pan") setDragging(false);
    if (ps.moved) {
      suppressClickRef.current = true;
      if (ps.mode === "swipe") {
        const dx = e.clientX - ps.startX;
        const dy = e.clientY - ps.startY;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.2) {
          if (dx < 0) onNext();
          else onPrev();
        }
      }
    }
  };

  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (viewRef.current.zoom > MIN_ZOOM) applyView(HOME);
    else zoomAt(e.clientX, e.clientY, CLICK_ZOOM);
  };

  const soldOut = product.stock === 0;
  const hasDiscount =
    product.comparePrice != null && product.comparePrice > product.price;

  return (
    <div dir="rtl" className="relative h-full w-full select-none">
      {/* image stage */}
      <div
        ref={stageRef}
        className={cn(
          "absolute inset-0 touch-none overflow-hidden",
          view.zoom > MIN_ZOOM
            ? dragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-zoom-in"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClick={onStageClick}
      >
        <div
          className={cn(
            "absolute inset-0 will-change-transform",
            !dragging && "transition-transform duration-300 ease-out"
          )}
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
          }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="100vw"
            quality={90}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={() => setLoaded(true)}
            className={cn(
              "object-contain p-5 pb-28 pt-20 transition-opacity duration-500 md:p-10 md:pb-28 md:pt-20",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 py-3 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="shrink-0 font-latin text-[12px] tracking-widest text-cream/60"
            aria-label={counterLabel}
          >
            {counterLabel}
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate text-[15px] font-normal leading-tight text-cream">
              {product.name}
            </DialogTitle>
            <p className="mt-0.5 truncate font-latin text-[10px] tracking-widest text-cream/50">
              SKU {product.sku}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => zoomAt(null, null, viewRef.current.zoom / WHEEL_FACTOR)}
            disabled={view.zoom <= MIN_ZOOM}
            aria-label="کوچک‌نمایی"
            className={iconBtn}
          >
            <Minus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span
            className="w-12 text-center font-latin text-[11px] text-cream/70"
            aria-hidden="true"
          >
            {Math.round(view.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomAt(null, null, viewRef.current.zoom * WHEEL_FACTOR)}
            disabled={view.zoom >= MAX_ZOOM}
            aria-label="بزرگ‌نمایی"
            className={iconBtn}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <a
            href={`/product/${encodeURIComponent(product.sku)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="باز کردن صفحه محصول در تب جدید"
            title="مشاهده صفحه محصول در تب جدید"
            className={iconBtn}
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <span className="mx-1 h-6 w-px bg-cream/20" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className={iconBtn}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* prev / next (RTL: prev on the right, next on the left) */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="قبلی"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-black/25 text-cream backdrop-blur-sm transition-colors hover:bg-cream hover:text-primary-foreground md:right-5"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.4} />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="بعدی"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-black/25 text-cream backdrop-blur-sm transition-colors hover:bg-cream hover:text-primary-foreground md:left-5"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.4} />
          </button>
        </>
      )}

      {/* bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-5 pt-14 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            {soldOut ? (
              <p className="text-[14px] font-light text-cream/75">ناموجود</p>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-2 text-cream">
                <span className="font-latin text-[19px]">
                  {product.price.toLocaleString("en-US")}
                </span>
                <span className="font-latin text-[10px] tracking-widest text-cream/60">
                  IRT
                </span>
                {hasDiscount && (
                  <span className="font-latin text-[12px] text-cream/50 line-through">
                    {product.comparePrice!.toLocaleString("en-US")}
                  </span>
                )}
              </p>
            )}
            <p className="mt-1.5 text-[11px] font-light text-cream/45">
              {view.zoom > MIN_ZOOM
                ? "برای جابه‌جایی تصویر را بکشید — برای بازگشت دوباره کلیک کنید"
                : "برای بزرگ‌نمایی روی تصویر کلیک کنید یا اسکرول کنید"}
            </p>
          </div>
          {!soldOut && (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-2 bg-cream px-6 py-2.5 text-[14px] text-primary-foreground transition-colors hover:bg-white"
              aria-label={`افزودن ${product.name} به سبد خرید`}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              ثبت انتخاب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen product image viewer (RTL). `index` is the position of the open
 * product inside `products`; `null` means closed.
 */
export function ProductLightbox({
  products,
  index,
  onIndexChange,
  onClose,
  onAddToCart,
}: {
  products: LightboxProduct[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onAddToCart: (product: LightboxProduct) => void;
}) {
  const open =
    index != null &&
    products.length > 0 &&
    index >= 0 &&
    index < products.length;
  const product = open && index != null ? products[index] ?? null : null;
  const activeIndex = open && index != null ? index : 0;

  // RTL convention (matches the hero carousel): next ← on the left, prev → on the right
  const goNext = useCallback(() => {
    if (index == null || products.length < 2) return;
    onIndexChange((index + 1) % products.length);
  }, [index, products.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index == null || products.length < 2) return;
    onIndexChange((index - 1 + products.length) % products.length);
  }, [index, products.length, onIndexChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 bg-black/97 backdrop-blur-xl p-0 sm:max-w-none"
      >
        {product && (
          <LightboxStage
            key={product.id}
            product={product}
            counterLabel={`${(activeIndex + 1).toLocaleString("fa-IR")} / ${products.length.toLocaleString("fa-IR")}`}
            showArrows={products.length > 1}
            onPrev={goPrev}
            onNext={goNext}
            onClose={onClose}
            onAddToCart={onAddToCart}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
