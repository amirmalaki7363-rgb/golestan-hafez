"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { useAccountStore } from "@/lib/account-store";
import { useCategoryFilterStore } from "@/lib/category-filter-store";
import { useCustomFlowerStore } from "@/lib/custom-flower-store";
import { useFlowerTestStore } from "@/lib/flower-test-store";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ShoppingBag,
  User,
  Phone,
  Menu,
  X,
  ChevronDown,
  ArrowLeft,
  Building2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Plain (non-dropdown) nav links, in RTL render order.
 * `custom: true` opens the full-screen «گل به سلیقه شما» page instead of
 * navigating to an anchor.
 * `test: true` opens the full-screen «شخصیت‌شناسی گل» test wizard.
 */
const NAV_TOP: { label: string; href: string; custom?: boolean; test?: boolean }[] = [
  { label: "Trending at Golestane Hafez", href: "#best-sellers" },
  { label: "گل به سلیقه شما", href: "#custom-flower", custom: true },
  { label: "شخصیت‌شناسی گل", href: "#flower-personality", test: true },
  { label: "Golestane Hafez Today", href: "#beyond" },
];

/** Open the «گل به سلیقه شما» page. */
const openCustomFlower = (e: React.MouseEvent) => {
  e.preventDefault();
  useCustomFlowerStore.getState().setOpen(true);
};

/** Open the «شخصیت‌شناسی گل» test wizard. */
const openFlowerTest = (e: React.MouseEvent) => {
  e.preventDefault();
  useFlowerTestStore.getState().setOpen(true);
};

type MenuItem = {
  label: string;
  sub?: string;
  /** Render the sub as a second line (for long notes like delivery destinations). */
  subBlock?: boolean;
  href: string;
  external?: boolean;
  onSelect?: () => void;
};
type MenuGroup = { group: string; items: MenuItem[] };

/** Submenu of «گلستان حافظ» — two groups: stores & delivery. */
const BRAND_MENU: MenuGroup[] = [
  {
    group: "استورها",
    items: [
      { label: "استور تهران", sub: "دیباجی", href: "#store-tehran" },
      { label: "استور اصفهان", sub: "شیخ صدوق", href: "#store-isfahan" },
    ],
  },
  {
    group: "ارسال و سفارش",
    items: [
      { label: "ارسال در تهران و اصفهان", href: "#beyond" },
      {
        label: "سفارش از خارج از کشور",
        href: "https://wa.me/989127385527",
        external: true,
      },
    ],
  },
];

/** Submenu of «سفارش» — remote ordering; delivery destination is Tehran & Isfahan only. */
const ORDER_MENU: MenuGroup[] = [
  {
    group: "سفارش سازمانی",
    items: [
      {
        label: "سفارش سازمانی و شرکتی",
        sub: "( گل برای رویدادها، هتل‌ها و فضاهای کاری )",
        subBlock: true,
        href: "https://wa.me/989127385527",
        external: true,
      },
    ],
  },
  {
    group: "شیوه‌های سفارش",
    items: [
      {
        label: "سفارش از هر شهری در ایران",
        sub: "( مقصد ارسال فقط تهران و اصفهان )",
        subBlock: true,
        href: "https://wa.me/989127385527",
        external: true,
      },
      {
        label: "سفارش از خارج از ایران",
        sub: "( مقصد ارسال فقط تهران و اصفهان )",
        subBlock: true,
        href: "https://wa.me/989127385527",
        external: true,
      },
    ],
  },
];

/** Submenu of «گل» — product categories; each filters the products carousel. */
const FLOWER_MENU: MenuGroup[] = [
  {
    group: "دسته‌بندی‌ها",
    items: PRODUCT_CATEGORIES.map((c) => ({
      label: c,
      href: "#best-sellers",
      onSelect: () => useCategoryFilterStore.getState().setCategory(c),
    })),
  },
];

function DropdownPanel({
  groups,
  onNavigate,
  variant,
}: {
  groups: MenuGroup[];
  onNavigate: () => void;
  variant: "desktop" | "mobile";
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-top-2 duration-300",
        variant === "desktop" ? "flex flex-col gap-5" : ""
      )}
    >
      {groups.map((g) => (
        <div key={g.group} className="mt-3 first:mt-0">
          <p className="gh-label text-[10px] text-cream/45">{g.group}</p>
          <ul
            className={cn(
              "mt-2 flex flex-col",
              variant === "desktop" ? "gap-0.5" : "gap-2"
            )}
          >
            {g.items.map((it) => (
              <li key={it.label}>
                <a
                  href={it.href}
                  {...(it.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() => {
                    it.onSelect?.();
                    onNavigate();
                  }}
                  aria-label={it.sub ? `${it.label} — ${it.sub}` : it.label}
                  className={cn(
                    "group flex items-center justify-between gap-3 transition-colors",
                    variant === "desktop"
                      ? "px-2 py-2.5 text-[13px] hover:bg-cream/5"
                      : ""
                  )}
                >
                  <span
                    className={
                      variant === "desktop"
                        ? "text-cream/85 group-hover:text-cream"
                        : "text-cream/80 hover:text-cream"
                    }
                  >
                    {it.label}
                    {it.sub && (
                      <span
                        className={cn(
                          "text-[11px] text-cream/50",
                          it.subBlock ? "mt-1 block" : "mr-2"
                        )}
                      >
                        {it.sub}
                      </span>
                    )}
                  </span>
                  <ArrowLeft
                    className="h-3.5 w-3.5 shrink-0 text-cream/40 transition-all group-hover:-translate-x-0.5 group-hover:text-cream"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NavDropdownLi({
  label,
  menu,
  open,
  onToggle,
  onClose,
  panelWidth,
  ariaLabel,
  liRef,
}: {
  label: string;
  menu: MenuGroup[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  panelWidth: number;
  ariaLabel: string;
  liRef: React.RefObject<HTMLLIElement | null>;
}) {
  return (
    <li ref={liRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] text-cream/90 transition-opacity hover:opacity-70"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            open && "rotate-180"
          )}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          style={{ width: panelWidth }}
          className="absolute top-full right-0 mt-4 animate-in fade-in slide-in-from-top-2 border border-border bg-earth-dark/95 p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] backdrop-blur-sm duration-300"
        >
          <DropdownPanel
            groups={menu}
            variant="desktop"
            onNavigate={onClose}
          />
        </div>
      )}
    </li>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<
    "flower" | "brand" | "order" | null
  >(null);
  const [mobileFlowerOpen, setMobileFlowerOpen] = useState(false);
  const [mobileBrandOpen, setMobileBrandOpen] = useState(false);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [query, setQuery] = useState("");
  const flowerRef = useRef<HTMLLIElement>(null);
  const brandRef = useRef<HTMLLIElement>(null);
  const orderRef = useRef<HTMLLIElement>(null);
  const { items, setOpen } = useCartStore();
  const { toast } = useToast();
  const { user, setOpen: setAccountOpen } = useAccountStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Resolve the current session once, so the icon reflects the logged-in state.
  useEffect(() => {
    useAccountStore.getState().refresh();
  }, []);

  // Close any open submenu on outside click / Escape.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        flowerRef.current?.contains(t) ||
        brandRef.current?.contains(t) ||
        orderRef.current?.contains(t)
      )
        return;
      setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    toast({
      title: "جستجو",
      description: `در حال جستجوی «${query}» در گلستان حافظ...`,
    });
    setQuery("");
    setSearchOpen(false);
  };

  const navLinkClass = (label: string) =>
    cn(
      "whitespace-nowrap text-[12.5px] transition-opacity hover:opacity-70",
      /[a-zA-Z]/.test(label) ? "font-latin text-cream/90" : "text-cream/90"
    );

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-500",
        scrolled ? "bg-background/95 backdrop-blur-sm" : "bg-transparent"
      )}
    >
      {/* Utility strip — «سفارش سازمانی» corporate-orders CTA (all widths) */}
      <div
        className={cn(
          "border-b transition-colors duration-500",
          scrolled
            ? "border-border bg-background/95 backdrop-blur-sm"
            : "border-cream/10 bg-earth-dark/50 backdrop-blur-[2px]"
        )}
      >
        <div
          dir="rtl"
          className="mx-auto flex h-8 max-w-[1440px] items-center justify-between px-5 md:px-10"
        >
          <a
            href="https://wa.me/989127385527"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="سفارش سازمانی — ارتباط در واتساپ"
            className="flex items-center gap-1.5 text-[11.5px] text-cream/85 transition-opacity hover:opacity-70"
          >
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            سفارش سازمانی
          </a>
          <p className="hidden gh-label text-[10px] text-cream/50 sm:block">
            ارسال به تهران و اصفهان
          </p>
        </div>
      </div>

      <div
        dir="ltr"
        className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:px-10"
      >
        {/* Logo — visually on the left */}
        <a
          href="#top"
          className="font-latin text-lg tracking-wide text-cream"
          aria-label="Golestane Hafez — صفحه اصلی"
        >
          <span className="font-semibold">Golestane</span>{" "}
          <span className="font-light text-cream/90">Hafez</span>
        </a>

        {/* Desktop nav — rtl flow (first item renders rightmost) */}
        <nav
          dir="rtl"
          aria-label="منوی اصلی"
          className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <ul className="flex items-center gap-5 xl:gap-6">
            {NAV_TOP.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={navLinkClass(item.label)}
                  onClick={item.custom ? openCustomFlower : item.test ? openFlowerTest : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {/* «گل» — click opens the categories submenu */}
            <NavDropdownLi
              label="گل"
              menu={FLOWER_MENU}
              open={openMenu === "flower"}
              onToggle={() =>
                setOpenMenu(openMenu === "flower" ? null : "flower")
              }
              onClose={() => setOpenMenu(null)}
              panelWidth={260}
              ariaLabel="گل — دسته‌بندی‌های محصولات"
              liRef={flowerRef}
            />
            <li>
              <a href="#occasions" className={navLinkClass("مناسبت")}>
                مناسبت
              </a>
            </li>
            {/* «گلستان حافظ» — click opens stores & delivery submenu */}
            <NavDropdownLi
              label="گلستان حافظ"
              menu={BRAND_MENU}
              open={openMenu === "brand"}
              onToggle={() =>
                setOpenMenu(openMenu === "brand" ? null : "brand")
              }
              onClose={() => setOpenMenu(null)}
              panelWidth={300}
              ariaLabel="گلستان حافظ — استورها و ارسال"
              liRef={brandRef}
            />
            {/* «سفارش» — click opens the remote-ordering submenu */}
            <NavDropdownLi
              label="سفارش"
              menu={ORDER_MENU}
              open={openMenu === "order"}
              onToggle={() =>
                setOpenMenu(openMenu === "order" ? null : "order")
              }
              onClose={() => setOpenMenu(null)}
              panelWidth={340}
              ariaLabel="سفارش — شیوه‌های سفارش و مقصد ارسال"
              liRef={orderRef}
            />
          </ul>
        </nav>

        {/* Actions — visually on the right */}
        <div className="flex items-center gap-3 md:gap-5 text-cream">
          {/* User — opens the account / admin panel */}
          <button
            aria-label={user ? "حساب کاربری" : "ورود / ثبت‌نام"}
            onClick={() => setAccountOpen(true)}
            className="relative transition-opacity hover:opacity-70"
          >
            <User className="h-5 w-5" strokeWidth={1.4} />
            {user && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -left-1 h-2 w-2 rounded-full bg-emerald-400"
              />
            )}
          </button>

          {/* Cart */}
          <button
            aria-label={`سبد خرید، ${cartCount} کالا`}
            onClick={() => setOpen(true)}
            className="relative transition-opacity hover:opacity-70"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -left-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cream px-1 text-[10px] font-medium text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>

          {/* Search */}
          <button
            aria-label="جستجو"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="transition-opacity hover:opacity-70"
          >
            {searchOpen ? (
              <X className="h-5 w-5" strokeWidth={1.4} />
            ) : (
              <Search className="h-5 w-5" strokeWidth={1.4} />
            )}
          </button>

          {/* Phone */}
          <a
            href="tel:09127385527"
            aria-label="تماس"
            className="hidden sm:block transition-opacity hover:opacity-70"
          >
            <Phone className="h-5 w-5" strokeWidth={1.4} />
          </a>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button aria-label="باز کردن منو" className="transition-opacity hover:opacity-70">
                  <Menu className="h-6 w-6" strokeWidth={1.4} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                aria-describedby={undefined}
                className="bg-earth-dark border-border w-[300px] [&>button]:left-4 [&>button]:right-auto [&>button]:text-cream"
              >
                <SheetHeader className="border-b border-border pb-4">
                  <SheetTitle className="font-latin text-cream text-right">
                    <span className="font-semibold">Golestane</span>{" "}
                    <span className="font-light">Hafez</span>
                  </SheetTitle>
                </SheetHeader>
                <nav dir="rtl" aria-label="منوی موبایل" className="mt-4 px-4">
                  <ul className="flex flex-col gap-5">
                    {NAV_TOP.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          onClick={(e) => {
                            setMobileOpen(false);
                            if (item.custom) openCustomFlower(e);
                            if (item.test) openFlowerTest(e);
                          }}
                          className="text-[15px] text-cream/90 hover:text-cream"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                    {/* «سفارش سازمانی» — corporate orders via WhatsApp */}
                    <li>
                      <a
                        href="https://wa.me/989127385527"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="text-[15px] text-cream/90 hover:text-cream"
                      >
                        سفارش سازمانی
                      </a>
                    </li>
                    {/* «گل» — expandable categories in the mobile menu */}
                    <li>
                      <button
                        type="button"
                        onClick={() => setMobileFlowerOpen((v) => !v)}
                        aria-expanded={mobileFlowerOpen}
                        className="flex w-full items-center justify-between text-[15px] text-cream/90 hover:text-cream"
                      >
                        گل
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            mobileFlowerOpen && "rotate-180"
                          )}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </button>
                      {mobileFlowerOpen && (
                        <div className="mt-4 border-r border-border/70 pr-4">
                          <DropdownPanel
                            groups={FLOWER_MENU}
                            variant="mobile"
                            onNavigate={() => setMobileOpen(false)}
                          />
                        </div>
                      )}
                    </li>
                    <li>
                      <a
                        href="#occasions"
                        onClick={() => setMobileOpen(false)}
                        className="text-[15px] text-cream/90 hover:text-cream"
                      >
                        مناسبت
                      </a>
                    </li>
                    {/* «گلستان حافظ» — expandable group in the mobile menu */}
                    <li>
                      <button
                        type="button"
                        onClick={() => setMobileBrandOpen((v) => !v)}
                        aria-expanded={mobileBrandOpen}
                        className="flex w-full items-center justify-between text-[15px] text-cream/90 hover:text-cream"
                      >
                        گلستان حافظ
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            mobileBrandOpen && "rotate-180"
                          )}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </button>
                      {mobileBrandOpen && (
                        <div className="mt-4 border-r border-border/70 pr-4">
                          <DropdownPanel
                            groups={BRAND_MENU}
                            variant="mobile"
                            onNavigate={() => setMobileOpen(false)}
                          />
                        </div>
                      )}
                    </li>
                    {/* «سفارش» — expandable remote-ordering group in the mobile menu */}
                    <li>
                      <button
                        type="button"
                        onClick={() => setMobileOrderOpen((v) => !v)}
                        aria-expanded={mobileOrderOpen}
                        className="flex w-full items-center justify-between text-[15px] text-cream/90 hover:text-cream"
                      >
                        سفارش
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            mobileOrderOpen && "rotate-180"
                          )}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </button>
                      {mobileOrderOpen && (
                        <div className="mt-4 border-r border-border/70 pr-4">
                          <DropdownPanel
                            groups={ORDER_MENU}
                            variant="mobile"
                            onNavigate={() => setMobileOpen(false)}
                          />
                        </div>
                      )}
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-24 border-t border-border bg-background/95 backdrop-blur-sm">
          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-6"
            role="search"
          >
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              placeholder="دنبال چه چیزی می‌گردید؟ دسته‌گل، باکس گل..."
              className="w-full bg-transparent text-[15px] text-cream placeholder:text-muted-foreground/70 outline-none"
              aria-label="جستجوی محصولات"
            />
            <button
              type="submit"
              className="gh-label shrink-0 hover:text-cream transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
