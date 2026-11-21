"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  TicketPercent,
  Truck,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatIRT, useCartStore } from "@/lib/cart-store";
import { useAccountStore } from "@/lib/account-store";
import type { StoreSettings } from "@/lib/settings";

/** The storefront cart only consumes the delivery fee. */
type CartSettings = Pick<StoreSettings, "deliveryFee">;

const inputCls =
  "border-border bg-earth text-cream placeholder:text-muted-foreground/60";

interface AppliedCoupon {
  code: string;
  type: "PERCENT" | "AMOUNT";
  value: number;
  discount: number;
}

const DEFAULT_SETTINGS: CartSettings = {
  deliveryFee: 150000,
};

export function CartDrawer({
  initialSettings,
}: {
  /** Prefetched server-side — checkout knows the delivery fee instantly. */
  initialSettings?: CartSettings;
}) {
  const { items, open, setOpen, increment, decrement, removeItem, clear } =
    useCartStore();
  const { toast } = useToast();
  const { user, refresh } = useAccountStore();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // delivery settings (managed in admin panel) — prefetched server-side;
  // the fetch below is skipped when the homepage already provided them.
  const [settings, setSettings] = useState<CartSettings>(
    initialSettings ?? DEFAULT_SETTINGS
  );
  useEffect(() => {
    if (initialSettings) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings)
          setSettings({
            deliveryFee: Number(d.settings.deliveryFee) || 0,
          });
      })
      .catch(() => undefined);
  }, []);

  // coupon
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = settings.deliveryFee;
  const finalTotal = afterDiscount + shipping;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "کد تخفیف معتبر نیست.");
        return;
      }
      setCoupon({
        code: data.coupon.code,
        type: data.coupon.type,
        value: data.coupon.value,
        discount: data.coupon.discount,
      });
      setCouponInput("");
      toast({
        title: "کد تخفیف اعمال شد 🎉",
        description: `${data.coupon.code} — ${formatIRT(data.coupon.discount)} تخفیف`,
      });
    } catch {
      setCouponError("خطای شبکه؛ دوباره تلاش کنید.");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError("");
  };

  // Reset the checkout step whenever the cart empties.
  useEffect(() => {
    if (items.length === 0) setCheckoutOpen(false);
  }, [items.length]);

  // Re-validate the coupon when the subtotal changes (items added/removed).
  useEffect(() => {
    if (!coupon) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: coupon.code, subtotal }),
        });
        if (!res.ok && !cancelled) {
          setCoupon(null);
          toast({
            title: "کد تخفیف برداشته شد",
            description: "شرایط استفاده از کد دیگر برقرار نیست.",
          });
        }
      } catch {
        /* keep coupon — network hiccup */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal]);

  // Prefill from the logged-in account.
  useEffect(() => {
    if (checkoutOpen && user) {
      setName((v) => v || user.name);
      setPhone((v) => v || user.phone);
    }
  }, [checkoutOpen, user]);

  const startCheckout = () => {
    if (items.length === 0) return;
    setError("");
    setCheckoutOpen(true);
  };

  const submitOrder = async () => {
    setError("");
    if (!name.trim() || !phone.trim() || address.trim().length < 5) {
      setError("نام، شماره تماس و آدرس تحویل را کامل وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          address: address.trim(),
          note: note.trim(),
          couponCode: coupon?.code ?? "",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "ثبت سفارش انجام نشد؛ دوباره تلاش کنید.");
        return;
      }

      clear();
      setOpen(false);
      setCheckoutOpen(false);
      setName("");
      setPhone("");
      setAddress("");
      setNote("");
      removeCoupon();
      refresh(); // update account stats
      toast({
        title: "سفارش شما ثبت شد 🌹",
        description: `کد سفارش: ${data.order.code} — کارشناسان گلستان حافظ به‌زودی تماس می‌گیرند.${
          user ? " پیگیری در پنل کاربری." : ""
        }`,
      });
    } catch {
      setError("خطای شبکه؛ اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  const totalsBlock = useMemo(
    () => (
      <div className="space-y-1.5 text-[12.5px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">جمع سبد:</span>
          <span className="font-latin text-cream">{formatIRT(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-emerald-300">
            <span>
              تخفیف {coupon?.code && <span className="font-latin">({coupon.code})</span>}:
            </span>
            <span className="font-latin">−{formatIRT(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            <Truck className="ml-1 inline h-3.5 w-3.5" strokeWidth={1.5} />
            هزینه ارسال:
          </span>
          <span className="font-latin text-cream">{formatIRT(shipping)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <span className="text-[14px] text-cream">مبلغ نهایی:</span>
          <span className="font-latin text-[16px] text-cream">
            {formatIRT(finalTotal)}
          </span>
        </div>
      </div>
    ),
    [subtotal, discount, coupon, shipping, finalTotal]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className="flex w-full flex-col border-border bg-earth-dark text-cream sm:max-w-[420px] [&>button]:left-auto [&>button]:right-4 [&>button]:text-cream"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-right text-cream">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
            سبد خرید
            {items.length > 0 && (
              <span className="text-[13px] font-light text-muted-foreground">
                ({items.length} کالا)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" strokeWidth={1} />
            <p className="text-[14px] text-muted-foreground">
              سبد خرید شما خالی است.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="gh-link !text-[13px]"
            >
              مشاهده محصولات
            </button>
          </div>
        ) : (
          <>
            <div className="gh-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-earth">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-latin text-[13.5px] font-normal leading-snug text-cream">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`حذف ${item.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                      </button>
                    </div>
                    <p className="font-latin mt-1 text-[11px] text-muted-foreground">
                      SKU {item.sku}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => decrement(item.id)}
                          aria-label="کاهش تعداد"
                          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-earth-light"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-[13px]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => increment(item.id)}
                          aria-label="افزایش تعداد"
                          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-earth-light"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-latin text-[13.5px] text-cream">
                        {formatIRT(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-4 py-5">
              {!checkoutOpen ? (
                <>
                  {totalsBlock}
                  <button
                    onClick={startCheckout}
                    className="mt-4 w-full bg-cream py-3.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    ثبت سفارش
                  </button>
                </>
              ) : (
                <>
                  {totalsBlock}

                  {/* coupon */}
                  <div className="mt-3 rounded-lg border border-border bg-earth/40 p-2.5">
                    <p className="mb-2 flex items-center gap-1.5 text-[12px] text-cream/90">
                      <TicketPercent className="h-3.5 w-3.5 text-amber-200" strokeWidth={1.5} />
                      کد تخفیف
                    </p>
                    {coupon ? (
                      <div className="flex items-center justify-between rounded border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1.5">
                        <span className="font-latin text-[12px] text-emerald-200">
                          {coupon.code} — {formatIRT(Math.min(coupon.discount, subtotal))}
                        </span>
                        <button
                          onClick={removeCoupon}
                          aria-label="حذف کد تخفیف"
                          className="text-emerald-200/70 transition-colors hover:text-emerald-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          dir="ltr"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="GOL20"
                          className={`${inputCls} text-right font-latin text-[12.5px]`}
                          aria-label="کد تخفیف"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={couponBusy || !couponInput.trim()}
                          className="shrink-0 rounded-md border border-cream/30 px-3 text-[11.5px] text-cream transition-colors hover:bg-cream/10 disabled:opacity-40"
                        >
                          {couponBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "اعمال"
                          )}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="mt-1.5 text-[10.5px] text-red-300">{couponError}</p>
                    )}
                  </div>

                  <p className="mb-2 mt-3 text-[12.5px] text-cream/90">اطلاعات تحویل سفارش</p>
                  <div className="space-y-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="نام و نام خانوادگی"
                      className={inputCls}
                      aria-label="نام و نام خانوادگی"
                    />
                    <Input
                      dir="ltr"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className={`${inputCls} text-right font-latin`}
                      aria-label="شماره تماس"
                    />
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="آدرس دقیق تحویل — تهران / اصفهان"
                      rows={2}
                      className={inputCls}
                      aria-label="آدرس تحویل"
                    />
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="یادداشت (اختیاری): رنگ رز، ساعت تحویل..."
                      className={inputCls}
                      aria-label="یادداشت سفارش"
                    />
                  </div>

                  {error && (
                    <p className="mt-2 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11.5px] leading-5 text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={submitOrder}
                    disabled={busy}
                    className="mt-3 flex w-full items-center justify-center gap-2 bg-cream py-3.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    ثبت نهایی سفارش
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setError("");
                    }}
                    className="gh-link mt-3 block w-full text-center !text-[12.5px]"
                  >
                    بازگشت به سبد
                  </button>

                  {user ? (
                    <p className="mt-3 text-center text-[11px] font-light text-muted-foreground">
                      سفارش به حساب شما ثبت می‌شود و در پنل کاربری قابل پیگیری است.
                    </p>
                  ) : (
                    <p className="mt-3 text-center text-[11px] font-light text-muted-foreground">
                      برای پیگیری آنلاین، از آدمک هدر وارد حساب شوید.
                    </p>
                  )}
                </>
              )}
              <p className="mt-3 text-center text-[11px] font-light text-muted-foreground">
                پرداخت در محل — ارسال در تهران و اصفهان
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
