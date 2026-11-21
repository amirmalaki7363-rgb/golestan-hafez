"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  Clock,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Phone,
  Plus,
  Shield,
  ShoppingBag,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAccountStore } from "@/lib/account-store";
import { formatIRT } from "@/lib/cart-store";
import { StatusBadge, faDate, faDateShort } from "@/lib/order-status";
import { AddressT, OrderT } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FlowerProfilesTab } from "./flower-profiles-tab";

// The admin panel is a huge module (products, orders, users, coupons, CMS,
// CSV import …). Code-split it: visitors never download it — the chunk is
// fetched only when an ADMIN actually opens the panel.
const AdminPanel = dynamic(
  () => import("./admin-panel").then((m) => m.AdminPanel),
  {
    ssr: false,
    loading: () => <Spinner label="در حال بارگذاری پنل مدیریت..." />,
  }
);

/* ------------------------------ tiny helpers ------------------------------ */

const inputCls =
  "border-border bg-earth text-cream placeholder:text-muted-foreground/60";
const labelCls = "text-[12.5px] text-cream/80";
const cardCls = "rounded-lg border border-border bg-earth/40 p-4";

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-earth/60">
        <Icon className="h-6 w-6 text-muted-foreground/70" strokeWidth={1.3} />
      </div>
      <p className="text-[13.5px] text-cream/85">{title}</p>
      <p className="max-w-[260px] text-[12px] font-light leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------- auth view ------------------------------- */

function AuthView() {
  const { refresh, setOpen } = useAccountStore();
  const { toast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [lPhone, setLPhone] = useState("");
  const [lPass, setLPass] = useState("");
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rPass, setRPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (mode: "login" | "register") => {
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { phone: lPhone, password: lPass }
          : { name: rName, phone: rPhone, password: rPass };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "عملیات انجام نشد؛ دوباره تلاش کنید.");
        return;
      }

      await refresh();
      toast({
        title: mode === "login" ? "خوش آمدید 🌹" : "حساب شما ساخته شد 🌹",
        description: `${data.user.name} عزیز، به گلستان حافظ خوش آمدید.`,
      });
    } catch {
      setError("خطای شبکه؛ اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SheetHeader className="border-b border-border pb-4">
        <SheetTitle className="text-right text-[16px] text-cream">
          ورود / ثبت‌نام
          <span className="mr-2 text-[12px] font-light text-muted-foreground">
            گلستان حافظ
          </span>
        </SheetTitle>
      </SheetHeader>

      <div className="gh-scroll flex-1 overflow-y-auto px-4 py-5">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "register"); setError(""); }}>
          <TabsList className="grid w-full grid-cols-2 border border-border bg-earth">
            <TabsTrigger
              value="login"
              className="text-[13px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              ورود
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-[13px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              ثبت‌نام
            </TabsTrigger>
          </TabsList>

          {error && (
            <p className="mt-4 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] leading-5 text-red-300">
              {error}
            </p>
          )}

          {/* Login */}
          <TabsContent value="login" className="mt-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit("login");
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className={labelCls} htmlFor="l-phone">شماره موبایل</Label>
                <Input
                  id="l-phone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09123456789"
                  value={lPhone}
                  onChange={(e) => setLPhone(e.target.value)}
                  className={cn(inputCls, "text-right font-latin")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls} htmlFor="l-pass">رمز عبور</Label>
                <Input
                  id="l-pass"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={lPass}
                  onChange={(e) => setLPass(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                ورود به حساب
              </button>
              <p className="text-center text-[11.5px] font-light leading-5 text-muted-foreground">
                حساب ندارید؟{' '}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-cream/90 underline underline-offset-4 hover:text-cream"
                >
                  ثبت‌نام کنید
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="mt-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit("register");
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className={labelCls} htmlFor="r-name">نام و نام خانوادگی</Label>
                <Input
                  id="r-name"
                  placeholder="مثلاً سارا محمدی"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls} htmlFor="r-phone">شماره موبایل</Label>
                <Input
                  id="r-phone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09123456789"
                  value={rPhone}
                  onChange={(e) => setRPhone(e.target.value)}
                  className={cn(inputCls, "text-right font-latin")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls} htmlFor="r-pass">رمز عبور</Label>
                <Input
                  id="r-pass"
                  type="password"
                  autoComplete="new-password"
                  placeholder="حداقل ۶ کاراکتر"
                  value={rPass}
                  onChange={(e) => setRPass(e.target.value)}
                  className={inputCls}
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                ساخت حساب
              </button>
              <p className="text-center text-[11.5px] font-light leading-5 text-muted-foreground">
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-cream/90 underline underline-offset-4 hover:text-cream"
                >
                  وارد شوید
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>

        {/* Perks */}
        <div className="mt-8 space-y-3 rounded-lg border border-border bg-earth/40 p-4">
          {[
            { icon: Package, text: "پیگیری لحظه‌ای وضعیت سفارش‌ها" },
            { icon: MapPin, text: "ذخیره آدرس‌ها برای ثبت سفارش سریع‌تر" },
            { icon: Phone, text: "اولویت تماس کارشناسان گلستان حافظ" },
          ].map((p) => (
            <div key={p.text} className="flex items-center gap-3">
              <p.icon className="h-4 w-4 shrink-0 text-cream/70" strokeWidth={1.4} />
              <p className="text-[12.5px] font-light text-cream/80">{p.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpen(false)}
          className="gh-link mx-auto mt-6 block !text-[13px]"
        >
          ادامه بدون ورود
        </button>
      </div>
    </>
  );
}

/* ------------------------------- user panel ------------------------------- */

function UserDashboard() {
  const { user, stats, refresh, logout, setOpen } = useAccountStore();
  const { toast } = useToast();

  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState<OrderT[] | null>(null);
  const [addresses, setAddresses] = useState<AddressT[] | null>(null);

  const userId = user?.id;

  // Inline async IIFE keeps lint happy and avoids setState directly in the effect body.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/orders", { cache: "no-store" });
        const d = await r.json();
        setOrders(d.orders ?? []);
      } catch {
        setOrders([]);
      }
      try {
        const r = await fetch("/api/addresses", { cache: "no-store" });
        const d = await r.json();
        setAddresses(d.addresses ?? []);
      } catch {
        setAddresses([]);
      }
    })();
  }, [userId]);

  const reloadAddresses = useCallback(async () => {
    try {
      const r = await fetch("/api/addresses", { cache: "no-store" });
      const d = await r.json();
      setAddresses(d.addresses ?? []);
    } catch {
      setAddresses([]);
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <SheetHeader className="border-b border-border pb-4">
        <SheetTitle className="text-right text-[16px] text-cream">حساب کاربری</SheetTitle>
      </SheetHeader>

      <div className="gh-scroll flex-1 overflow-y-auto px-4 py-4">
        {/* Profile card */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-earth/50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-[18px] font-semibold text-primary-foreground">
            {user.name.trim().charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[14px] font-medium text-cream">{user.name}</p>
              {user.role === "ADMIN" && (
                <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-200">
                  مدیر
                </span>
              )}
            </div>
            <p dir="ltr" className="font-latin mt-0.5 text-right text-[12px] text-muted-foreground">
              {user.phone}
            </p>
            <p className="mt-0.5 text-[10.5px] font-light text-muted-foreground">
              عضو گلستان حافظ از {faDateShort(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Admin CTA */}
        {user.role === "ADMIN" && (
          <button
            onClick={() => useAccountStore.getState().setView("admin")}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Shield className="h-4 w-4" />
            پنل مدیریت سایت
          </button>
        )}

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 border border-border bg-earth">
            <TabsTrigger
              value="overview"
              className="text-[11.5px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              پیشخوان
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="text-[11.5px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              سفارش‌ها
            </TabsTrigger>
            <TabsTrigger
              value="flowers"
              className="text-[11.5px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              پروفایل گل
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="text-[11.5px] text-cream/70 data-[state=active]:bg-cream data-[state=active]:text-primary-foreground"
            >
              حساب کاربری
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className={cn(cardCls, "px-3 text-center")}>
                <Package className="mx-auto h-4 w-4 text-cream/70" strokeWidth={1.4} />
                <p className="font-latin mt-1.5 text-[17px] text-cream">
                  {stats ? stats.orders.toLocaleString("en-US") : "—"}
                </p>
                <p className="text-[10.5px] font-light text-muted-foreground">سفارش</p>
              </div>
              <div className={cn(cardCls, "px-3 text-center")}>
                <Wallet className="mx-auto h-4 w-4 text-cream/70" strokeWidth={1.4} />
                <p className="font-latin mt-1.5 truncate text-[13px] leading-6 text-cream">
                  {stats ? formatIRT(stats.spent) : "—"}
                </p>
                <p className="text-[10.5px] font-light text-muted-foreground">مجموع خرید</p>
              </div>
              <div className={cn(cardCls, "px-3 text-center")}>
                <Clock className="mx-auto h-4 w-4 text-cream/70" strokeWidth={1.4} />
                <p className="font-latin mt-1.5 text-[17px] text-cream">
                  {stats ? stats.active.toLocaleString("en-US") : "—"}
                </p>
                <p className="text-[10.5px] font-light text-muted-foreground">در جریان</p>
              </div>
            </div>

            {/* Recent orders */}
            <h4 className="mb-2 mt-5 text-[13px] text-cream/90">آخرین سفارش‌ها</h4>
            {orders === null ? (
              <Spinner label="در حال دریافت سفارش‌ها..." />
            ) : orders.length === 0 ? (
              <div className={cardCls}>
                <EmptyState
                  icon={ShoppingBag}
                  title="هنوز سفارشی ثبت نکرده‌اید"
                  description="از کالکشن پرفروش‌های گلستان حافظ شروع کنید؛ سفارش شما به‌سرعت آماده و ارسال می‌شود."
                />
              </div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 3).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setTab("orders")}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-earth/40 px-3 py-2.5 text-right transition-colors hover:bg-earth-light/60"
                  >
                    <div className="min-w-0">
                      <p dir="ltr" className="font-latin text-right text-[12.5px] text-cream">
                        {o.code}
                      </p>
                      <p className="mt-0.5 text-[10.5px] font-light text-muted-foreground">
                        {faDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={o.status} />
                      <p className="font-latin text-[12px] text-cream/90">{formatIRT(o.total)}</p>
                    </div>
                  </button>
                ))}
                {orders.length > 3 && (
                  <button onClick={() => setTab("orders")} className="gh-link mx-auto block !text-[12.5px]">
                    مشاهده همه سفارش‌ها
                  </button>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href="#best-sellers"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-earth/40 py-3 text-[12.5px] text-cream/90 transition-colors hover:bg-earth-light/60"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.4} />
                مشاهده محصولات
              </a>
              <a
                href="tel:09127385527"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-earth/40 py-3 text-[12.5px] text-cream/90 transition-colors hover:bg-earth-light/60"
              >
                <Phone className="h-4 w-4" strokeWidth={1.4} />
                تماس با اپراتور
              </a>
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="mt-4">
            {orders === null ? (
              <Spinner label="در حال دریافت سفارش‌ها..." />
            ) : orders.length === 0 ? (
              <div className={cardCls}>
                <EmptyState
                  icon={Package}
                  title="سفارشی یافت نشد"
                  description="پس از ثبت اولین سفارش، جزئیات و وضعیت آن را اینجا می‌بینید."
                />
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {orders.map((o) => (
                  <AccordionItem key={o.id} value={o.id} className="border-border">
                    <AccordionTrigger className="gap-2 py-3 text-[13px] text-cream hover:no-underline">
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 text-right">
                          <p dir="ltr" className="font-latin text-[12.5px]">{o.code}</p>
                          <p className="mt-0.5 text-[10.5px] font-light text-muted-foreground">
                            {faDate(o.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={o.status} />
                          <p className="font-latin text-[12px] text-cream/90">{formatIRT(o.total)}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-[12.5px] text-cream/85">
                      <div className="space-y-2.5">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex items-center gap-3">
                            <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-earth">
                              <Image src={it.image} alt={it.name} fill sizes="44px" className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-latin truncate text-[12px] text-cream">{it.name}</p>
                              <p className="font-latin mt-0.5 text-[10.5px] text-muted-foreground">
                                {it.qty.toLocaleString("en-US")} × {formatIRT(it.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5 border-t border-border pt-2.5 text-[11.5px] font-light leading-5 text-muted-foreground">
                        <p>
                          <span className="text-cream/80">تحویل به: </span>
                          {o.customerName} — <span dir="ltr" className="font-latin">{o.customerPhone}</span>
                        </p>
                        <p>
                          <span className="text-cream/80">آدرس: </span>
                          {o.address}
                        </p>
                        {o.note && (
                          <p>
                            <span className="text-cream/80">یادداشت: </span>
                            {o.note}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          {/* Flower taste profiles — «شخصیت‌شناسی گل» */}
          <TabsContent value="flowers" className="mt-4">
            <FlowerProfilesTab />
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <ProfileSection
              addresses={addresses}
              reloadAddresses={reloadAddresses}
              reloadUser={refresh}
            />
          </TabsContent>
        </Tabs>

        <button
          onClick={async () => {
            await logout();
            toast({ title: "از حساب خارج شدید", description: "به امید دیدار دوباره 🌹" });
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 py-3 text-[13px] text-red-300 transition-colors hover:bg-red-400/20"
        >
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </button>
      </div>
    </>
  );
}

/* ----------------------------- profile section ---------------------------- */

function ProfileSection({
  addresses,
  reloadAddresses,
  reloadUser,
}: {
  addresses: AddressT[] | null;
  reloadAddresses: () => Promise<void>;
  reloadUser: () => Promise<unknown>;
}) {
  const { user } = useAccountStore();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [passBusy, setPassBusy] = useState(false);

  const [aTitle, setATitle] = useState("");
  const [aCity, setACity] = useState("");
  const [aDetail, setADetail] = useState("");
  const [aBusy, setABusy] = useState(false);

  if (!user) return null;

  const saveName = async () => {
    if (name.trim().length < 2) {
      toast({ title: "نام معتبر نیست", description: "نام باید حداقل ۲ حرف باشد." });
      return;
    }
    setNameBusy(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "ثبت نشد", description: d.error ?? "دوباره تلاش کنید." });
        return;
      }
      await reloadUser();
      toast({ title: "ذخیره شد", description: "نام حساب شما به‌روزرسانی شد." });
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async () => {
    if (newPass.length < 6) {
      toast({ title: "رمز کوتاه است", description: "رمز جدید باید حداقل ۶ کاراکتر باشد." });
      return;
    }
    if (newPass !== newPass2) {
      toast({ title: "تکرار رمز مطابقت ندارد" });
      return;
    }
    setPassBusy(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "تغییر رمز انجام نشد", description: d.error ?? "دوباره تلاش کنید." });
        return;
      }
      setCurPass("");
      setNewPass("");
      setNewPass2("");
      toast({ title: "رمز عبور تغییر کرد", description: "از این پس با رمز جدید وارد شوید." });
    } finally {
      setPassBusy(false);
    }
  };

  const addAddress = async () => {
    if (!aTitle.trim() || !aCity || aDetail.trim().length < 5) {
      toast({ title: "اطلاعات آدرس کامل نیست", description: "عنوان، شهر و آدرس کامل را وارد کنید." });
      return;
    }
    setABusy(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: aTitle.trim(), city: aCity, detail: aDetail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: d.error ?? "دوباره تلاش کنید." });
        return;
      }
      setATitle("");
      setACity("");
      setADetail("");
      await reloadAddresses();
      toast({ title: "آدرس ذخیره شد", description: "آدرس جدید به حساب شما اضافه شد." });
    } finally {
      setABusy(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "حذف نشد", description: "دوباره تلاش کنید." });
        return;
      }
      await reloadAddresses();
      toast({ title: "آدرس حذف شد" });
    } catch {
      toast({ title: "حذف نشد", description: "خطای شبکه." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <section className={cardCls}>
        <h4 className="mb-3 flex items-center gap-2 text-[13px] text-cream/90">
          <UserRound className="h-4 w-4" strokeWidth={1.4} />
          ویرایش نام
        </h4>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام و نام خانوادگی"
            className={cn(inputCls, "flex-1")}
          />
          <button
            onClick={saveName}
            disabled={nameBusy}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-cream px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {nameBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            ذخیره
          </button>
        </div>
      </section>

      {/* Password */}
      <section className={cardCls}>
        <h4 className="mb-3 flex items-center gap-2 text-[13px] text-cream/90">
          <KeyRound className="h-4 w-4" strokeWidth={1.4} />
          تغییر رمز عبور
        </h4>
        <div className="space-y-2.5">
          <Input
            type="password"
            placeholder="رمز عبور فعلی"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            className={inputCls}
            autoComplete="current-password"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="password"
              placeholder="رمز جدید"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="تکرار رمز جدید"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <button
            onClick={savePassword}
            disabled={passBusy || !curPass || !newPass}
            className="w-full rounded-md border border-cream/30 bg-transparent py-2.5 text-[12.5px] text-cream transition-colors hover:bg-cream/10 disabled:opacity-50"
          >
            {passBusy ? "در حال ثبت..." : "تغییر رمز عبور"}
          </button>
        </div>
      </section>

      {/* Addresses */}
      <section className={cardCls}>
        <h4 className="mb-3 flex items-center gap-2 text-[13px] text-cream/90">
          <MapPin className="h-4 w-4" strokeWidth={1.4} />
          آدرس‌های من
        </h4>

        {addresses === null ? (
          <Spinner label="در حال دریافت آدرس‌ها..." />
        ) : (
          <>
            {addresses.length > 0 && (
              <div className="mb-4 space-y-2">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-border bg-earth/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] text-cream">
                        {a.title} <span className="text-[10.5px] text-muted-foreground">— {a.city}</span>
                      </p>
                      <p className="mt-1 text-[11px] font-light leading-5 text-muted-foreground">
                        {a.detail}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          aria-label={`حذف آدرس ${a.title}`}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-earth-dark text-cream">
                        <AlertDialogHeader className="text-right">
                          <AlertDialogTitle className="text-cream">حذف آدرس</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            «{a.title}» برای همیشه حذف می‌شود. مطمئنید؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row justify-start gap-2">
                          <AlertDialogAction
                            onClick={() => deleteAddress(a.id)}
                            className="bg-red-400/90 text-white hover:bg-red-400"
                          >
                            حذف
                          </AlertDialogAction>
                          <AlertDialogCancel className="border-border bg-transparent text-cream hover:bg-earth-light">
                            انصراف
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}

            {/* Add address form */}
            <div className="space-y-2.5 rounded-md border border-dashed border-border p-3">
              <p className="flex items-center gap-1.5 text-[12px] text-cream/80">
                <Plus className="h-3.5 w-3.5" />
                افزودن آدرس جدید
              </p>
              <Input
                value={aTitle}
                onChange={(e) => setATitle(e.target.value)}
                placeholder="عنوان (خانه، محل کار...)"
                className={inputCls}
              />
              <Select value={aCity} onValueChange={setACity} dir="rtl">
                <SelectTrigger className={cn(inputCls, "w-full text-[13px]")}>
                  <SelectValue placeholder="شهر" />
                </SelectTrigger>
                <SelectContent className="border-border bg-earth-dark text-cream">
                  <SelectItem value="تهران" className="focus:bg-earth-light">تهران</SelectItem>
                  <SelectItem value="اصفهان" className="focus:bg-earth-light">اصفهان</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={aDetail}
                onChange={(e) => setADetail(e.target.value)}
                placeholder="آدرس کامل: خیابان، کوچه، پلاک، واحد..."
                rows={2}
                className={inputCls}
              />
              <button
                onClick={addAddress}
                disabled={aBusy}
                className="w-full rounded-md border border-cream/30 py-2.5 text-[12.5px] text-cream transition-colors hover:bg-cream/10 disabled:opacity-50"
              >
                {aBusy ? "در حال ذخیره..." : "افزودن به آدرس‌ها"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- the drawer ------------------------------- */

export function AccountDrawer() {
  const { open, setOpen, user, checked, view } = useAccountStore();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        dir="rtl"
        className={cn(
          "flex w-full flex-col border-border bg-earth-dark text-cream transition-[max-width] duration-300 [&>button]:left-auto [&>button]:right-4 [&>button]:text-cream",
          view === "admin" && user?.role === "ADMIN" ? "sm:max-w-[880px]" : "sm:max-w-[440px]"
        )}
      >
        {!checked ? (
          <Spinner label="در حال بررسی حساب..." />
        ) : view === "admin" && user?.role === "ADMIN" ? (
          <AdminPanel />
        ) : user ? (
          <UserDashboard />
        ) : (
          <AuthView />
        )}
      </SheetContent>
    </Sheet>
  );
}
