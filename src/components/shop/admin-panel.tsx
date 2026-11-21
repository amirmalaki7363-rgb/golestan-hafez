"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Boxes,
  Check,
  ClipboardList,
  ImagePlus,
  Clock,
  Copy,
  Flower2,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  Minus,
  Package,
  Percent,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Truck,
  UploadCloud,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAccountStore } from "@/lib/account-store";
import { ContentTab } from "@/components/shop/admin-content-tab";
import { CustomFlowerTab } from "@/components/shop/admin-custom-flower-tab";
import { CsvImportDialog } from "@/components/shop/admin-csv-import";
import { uploadImage } from "@/lib/upload-client";
import { formatIRT } from "@/lib/cart-store";
import { PRODUCT_CATEGORIES, PRODUCT_ALL_CATEGORIES, PRODUCT_OCCASIONS } from "@/lib/constants";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  StatusBadge,
  faDate,
  faDateShort,
} from "@/lib/order-status";
import {
  AdminActivityT,
  AdminProductT,
  AdminRecentOrderT,
  AdminStatsT,
  AdminUserT,
  CouponT,
  OrderT,
  SettingsT,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const inputCls =
  "border-border bg-earth text-cream placeholder:text-muted-foreground/60";
const cardCls = "rounded-lg border border-border bg-earth/40 p-4";

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

/** "4850000" → "4,850,000" while typing. */
const fmtNum = (v: string) =>
  v.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

function autoSkuFromName(name: string): string {
  const ascii = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${ascii || "GH"}-${rand}`;
}

/* --------------------------- product form dialog --------------------------- */

interface ProductFormState {
  name: string;
  sku: string;
  description: string;
  category: string;
  occasion: string;
  price: string;
  comparePrice: string;
  image: string;
  badge: string;
  stock: string;
  sortOrder: string;
  featured: boolean;
  active: boolean;
}

const emptyForm: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  category: PRODUCT_CATEGORIES[0],
  occasion: "بدون مناسبت",
  price: "",
  comparePrice: "",
  image: "",
  badge: "",
  stock: "10",
  sortOrder: "",
  featured: false,
  active: true,
};

function toFormState(p: AdminProductT): ProductFormState {
  return {
    name: p.name,
    sku: p.sku,
    description: p.description ?? "",
    category: p.category,
    occasion: p.occasion,
    price: fmtNum(String(p.price)),
    comparePrice: p.comparePrice ? fmtNum(String(p.comparePrice)) : "",
    image: p.image,
    badge: p.badge ?? "",
    stock: String(p.stock),
    sortOrder: String(p.sortOrder ?? 0),
    featured: p.featured,
    active: p.active,
  };
}

function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  existingImages,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** null → create mode */
  initial: AdminProductT | null;
  existingImages: string[];
  onSaved: (p: AdminProductT, mode: "create" | "update") => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(initial ? toFormState(initial) : emptyForm);
  }, [open, initial]);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const uploadFile = async (file: File) => {
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!okTypes.includes(file.type)) {
      toast({ title: "فرمت پذیرفته نمی‌شود", description: "فقط JPG، PNG، WebP، GIF یا AVIF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم تصویر زیاد است", description: "حداکثر ۵ مگابایت." });
      return;
    }
    setUploading(true);
    const result = await uploadImage(file);
    if (result.ok) {
      set("image", result.path);
      toast({ title: "تصویر آپلود شد", description: file.name });
    } else {
      toast({ title: "آپلود نشد", description: result.message });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const price = parseNum(form.price);
    const comparePrice = parseNum(form.comparePrice);
    if (form.name.trim().length < 2) {
      toast({ title: "نام محصول را وارد کنید." });
      return;
    }
    if (!form.image.trim()) {
      toast({
        title: "تصویر محصول را انتخاب کنید.",
        description: "فایل را آپلود کنید یا مسیر آن را دستی وارد کنید.",
      });
      return;
    }
    if (price <= 0) {
      toast({ title: "قیمت معتبر نیست." });
      return;
    }
    if (comparePrice > 0 && comparePrice <= price) {
      toast({
        title: "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد.",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      description: form.description.trim(),
      category: form.category,
      occasion: form.occasion,
      price,
      comparePrice: comparePrice > 0 ? comparePrice : null,
      image: form.image.trim(),
      badge: form.badge.trim(),
      stock: Math.max(0, parseNum(form.stock)),
      sortOrder: Math.max(0, parseNum(form.sortOrder)),
      featured: form.featured,
      active: form.active,
    };

    setBusy(true);
    try {
      const res = initial
        ? await fetch(`/api/admin/products/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      onSaved(data.product as AdminProductT, initial ? "update" : "create");
      onOpenChange(false);
      toast({
        title: initial ? "محصول به‌روزرسانی شد" : "محصول جدید اضافه شد",
        description: data.product.name,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[90vh] overflow-y-auto gh-scroll border-border bg-earth-dark text-cream sm:max-w-[520px]"
      >
        <DialogHeader className="text-right">
          <DialogTitle className="text-cream">
            {initial ? "ویرایش محصول" : "محصول جدید"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {initial
              ? "تغییرات بلافاصله در فروشگاه اعمال می‌شود."
              : "محصول بلافاصله در بخش پرفروش‌های فروشگاه نمایش داده می‌شود."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* image upload zone */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-cream/80">تصویر محصول</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
            {form.image.trim() ? (
              <div
                className="group relative h-44 w-full overflow-hidden rounded-md border border-border bg-earth"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void uploadFile(f);
                }}
              >
                <Image
                  src={form.image.trim()}
                  alt="پیش‌نمایش تصویر محصول"
                  fill
                  sizes="470px"
                  className="object-cover"
                  unoptimized={form.image.trim().startsWith("http")}
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-6 w-6 animate-spin text-cream" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/75 to-transparent p-2 opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-sm bg-cream/95 px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground transition hover:bg-cream disabled:opacity-50"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    تغییر تصویر
                  </button>
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-sm border border-red-300/40 bg-red-400/20 px-2.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-400/30 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void uploadFile(f);
                }}
                className={cn(
                  "flex h-44 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-earth/40 transition-colors",
                  dragOver
                    ? "border-amber-300/70 bg-amber-300/10"
                    : "border-border hover:border-cream/40 hover:bg-earth"
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin text-cream/70" strokeWidth={1.3} />
                    <p className="text-[12px] text-cream/80">در حال آپلود…</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-7 w-7 text-cream/60" strokeWidth={1.3} />
                    <p className="text-[12.5px] text-cream/90">
                      کلیک کنید یا تصویر را اینجا رها کنید
                    </p>
                    <p className="text-[10px] font-light text-muted-foreground">
                      JPG، PNG، WebP، GIF یا AVIF — حداکثر ۵ مگابایت
                    </p>
                  </>
                )}
              </button>
            )}
            <div className="space-y-1">
              <Label className="text-[10.5px] font-light text-muted-foreground">
                یا مسیر تصویر را دستی وارد کنید
              </Label>
              <Input
                dir="ltr"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                className={cn(inputCls, "h-8 text-right font-latin text-[11px]")}
                placeholder="/images/rose-box.jpg"
                list="gh-admin-images"
              />
              <datalist id="gh-admin-images">
                {existingImages.map((src, i) => (
                  <option key={`${src}-${i}`} value={src} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-cream/80">نام محصول</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              placeholder="One Hundred Roses Box"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">قیمت (IRT)</Label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => set("price", fmtNum(e.target.value))}
                className={cn(inputCls, "text-right font-latin")}
                placeholder="4,850,000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">قیمت قبل از تخفیف</Label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={form.comparePrice}
                onChange={(e) => set("comparePrice", fmtNum(e.target.value))}
                className={cn(inputCls, "text-right font-latin")}
                placeholder="اختیاری"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">دسته‌بندی</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)} dir="rtl">
                <SelectTrigger className={cn(inputCls, "text-[12.5px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-earth-dark text-cream">
                  {PRODUCT_ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-[12.5px] focus:bg-earth-light">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">مناسبت</Label>
              <Select value={form.occasion} onValueChange={(v) => set("occasion", v)} dir="rtl">
                <SelectTrigger className={cn(inputCls, "text-[12.5px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-earth-dark text-cream">
                  {PRODUCT_OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o} className="text-[12.5px] focus:bg-earth-light">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">موجودی</Label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))}
                className={cn(inputCls, "text-right font-latin")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-cream/80">ترتیب نمایش</Label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value.replace(/[^\d]/g, ""))}
                className={cn(inputCls, "text-right font-latin")}
                placeholder="خودکار"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-cream/80">SKU</Label>
                {!initial && (
                  <button
                    type="button"
                    onClick={() => set("sku", autoSkuFromName(form.name || "GH"))}
                    className="gh-link !text-[10.5px]"
                  >
                    تولید خودکار
                  </button>
                )}
              </div>
              <Input
                dir="ltr"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
                className={cn(inputCls, "text-right font-latin")}
                placeholder={initial ? initial.sku : "GH-ROSE-100"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-cream/80">برچسب (اختیاری)</Label>
            <Input
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              className={inputCls}
              placeholder="Best Seller"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-cream/80">توضیحات محصول</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
              rows={3}
              placeholder="باکسی از صد شاخه رز هلندی با روبان مخملی..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-earth/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Star className={cn("h-4 w-4", form.featured ? "fill-amber-300 text-amber-300" : "text-muted-foreground")} strokeWidth={1.4} />
              <div>
                <p className="text-[12.5px] text-cream">نمایش ویژه</p>
                <p className="text-[10px] font-light text-muted-foreground">در ابتدای پرفروش‌ها دیده می‌شود</p>
              </div>
            </div>
            <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-earth/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <BadgeCheck className={cn("h-4 w-4", form.active ? "text-emerald-300" : "text-muted-foreground")} strokeWidth={1.4} />
              <div>
                <p className="text-[12.5px] text-cream">فعال در فروشگاه</p>
                <p className="text-[10px] font-light text-muted-foreground">غیرفعال = مخفی از مشتری‌ها</p>
              </div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "ذخیره تغییرات" : "افزودن به فروشگاه"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ products tab ------------------------------ */

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/35 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-300">
        ناموجود
      </span>
    );
  if (stock <= 3)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-200">
        <AlertTriangle className="h-3 w-3" /> {stock.toLocaleString("en-US")} عدد
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] text-emerald-200">
      {stock.toLocaleString("en-US")} عدد
    </span>
  );
}

function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProductT[] | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductT | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/products", { cache: "no-store" });
      const d = await r.json();
      setProducts(d.products ?? []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = (p: AdminProductT, mode: "create" | "update") => {
    setProducts((prev) => {
      if (!prev) return [p];
      return mode === "create" ? [...prev, p] : prev.map((x) => (x.id === p.id ? p : x));
    });
  };

  const toggleField = async (p: AdminProductT, field: "active" | "featured", value: boolean) => {
    setProducts((prev) =>
      prev ? prev.map((x) => (x.id === p.id ? { ...x, [field]: value } : x)) : prev
    );
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      setProducts((prev) =>
        prev ? prev.map((x) => (x.id === p.id ? { ...x, [field]: !value } : x)) : prev
      );
      toast({ title: "تغییر وضعیت انجام نشد" });
    } else if (field === "active") {
      toast({
        title: value ? "محصول فعال شد" : "محصول از فروشگاه مخفی شد",
        description: p.name,
      });
    }
  };

  const duplicate = async (p: AdminProductT) => {
    setBusyId(p.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${p.name} (کپی)`,
          sku: autoSkuFromName(p.name),
          description: p.description,
          category: p.category,
          occasion: p.occasion,
          price: p.price,
          comparePrice: p.comparePrice,
          image: p.image,
          badge: p.badge,
          stock: p.stock,
          featured: false,
          active: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "کپی انجام نشد", description: data.error ?? "" });
        return;
      }
      upsert(data.product as AdminProductT, "create");
      toast({ title: "نسخه کپی ساخته شد (غیرفعال)", description: data.product.name });
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (p: AdminProductT) => {
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "حذف نشد", description: "دوباره تلاش کنید." });
      return;
    }
    setProducts((prev) => (prev ? prev.filter((x) => x.id !== p.id) : prev));
    toast({ title: "محصول حذف شد", description: p.name });
  };

  const filtered = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== "ALL" && p.category !== catFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.badge ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, catFilter]);

  if (filtered === null) return <Spinner label="در حال دریافت محصولات..." />;

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(inputCls, "pr-9 text-[12.5px]")}
            placeholder="جستجوی نام، SKU یا برچسب..."
          />
        </div>
        <button
          onClick={() => setCsvOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-cream/25 px-3.5 py-2 text-[12px] font-medium text-cream transition-colors hover:bg-cream/10"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          درون‌ریزی CSV
        </button>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-cream px-3.5 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          محصول جدید
        </button>
      </div>

      <Select value={catFilter} onValueChange={setCatFilter} dir="rtl">
        <SelectTrigger className={cn(inputCls, "h-9 text-[12px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-border bg-earth-dark text-cream">
          <SelectItem value="ALL" className="text-[12px] focus:bg-earth-light">
            همه دسته‌ها
          </SelectItem>
          {PRODUCT_ALL_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="text-[12px] focus:bg-earth-light">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-[11.5px] text-muted-foreground">
        {(products?.length ?? 0).toLocaleString("en-US")} محصول —{" "}
        {filtered.length.toLocaleString("en-US")} نمایش داده شده
      </p>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          محصولی با این مشخصات پیدا نشد.
        </p>
      ) : (
        filtered.map((p) => (
          <div key={p.id} className="rounded-lg border border-border bg-earth/40 p-3">
            <div className="flex gap-3">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-earth">
                <Image src={p.image} alt={p.name} fill sizes="56px" className="object-cover" />
                {p.comparePrice && p.comparePrice > p.price && (
                  <span className="absolute inset-x-0 bottom-0 bg-red-400/85 py-0.5 text-center text-[9px] text-white">
                    {Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}٪ تخفیف
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-latin truncate text-[13px] text-cream">{p.name}</p>
                    <p className="mt-0.5 truncate text-[10.5px] font-light text-muted-foreground">
                      {p.category} — {p.occasion}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      aria-label={`ویرایش ${p.name}`}
                      title="ویرایش"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-cream/25 text-cream/85 transition-colors hover:bg-cream/10"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label={`کپی ${p.name}`}
                      title="کپی محصول"
                      disabled={busyId === p.id}
                      onClick={() => duplicate(p)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-cream/25 text-cream/85 transition-colors hover:bg-cream/10 disabled:opacity-40"
                    >
                      {busyId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          aria-label={`حذف محصول ${p.name}`}
                          title="حذف"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-red-400/30 text-red-300 transition-colors hover:bg-red-400/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl" className="border-border bg-earth-dark text-cream">
                        <AlertDialogHeader className="text-right">
                          <AlertDialogTitle className="text-cream">حذف محصول</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            «{p.name}» از فروشگاه حذف می‌شود. سفارش‌های قبلی دست‌نخورده باقی می‌مانند.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row justify-start gap-2">
                          <AlertDialogAction
                            onClick={() => deleteProduct(p)}
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
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <p className="font-latin text-[13.5px] text-cream">
                    {p.price.toLocaleString("en-US")}
                    <span className="ml-1 text-[10px] text-muted-foreground">IRT</span>
                  </p>
                  {p.comparePrice && p.comparePrice > p.price && (
                    <p className="font-latin text-[11px] text-muted-foreground line-through">
                      {p.comparePrice.toLocaleString("en-US")}
                    </p>
                  )}
                  <span className="font-latin truncate text-[10px] text-muted-foreground">
                    SKU {p.sku}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StockBadge stock={p.stock} />
                  {p.badge && (
                    <span className="rounded-full border border-cream/25 bg-cream/10 px-2 py-0.5 text-[10px] text-cream">
                      {p.badge}
                    </span>
                  )}
                  <div className="mr-auto flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(v) => toggleField(p, "active", v)}
                        aria-label={`فعال/غیرفعال ${p.name}`}
                      />
                      فعال
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <Switch
                        checked={p.featured}
                        onCheckedChange={(v) => toggleField(p, "featured", v)}
                        aria-label={`نمایش ویژه ${p.name}`}
                      />
                      ویژه
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {p.description && (
              <p className="mt-2 line-clamp-2 border-t border-border pt-2 text-[11px] font-light leading-5 text-muted-foreground">
                {p.description}
              </p>
            )}
          </div>
        ))
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        existingImages={products?.map((p) => p.image) ?? []}
        onSaved={upsert}
      />

      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} onImported={load} />
    </div>
  );
}

/* ----------------------------- inventory tab ------------------------------ */

function InventoryTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProductT[] | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/products", { cache: "no-store" });
      const d = await r.json();
      setProducts(d.products ?? []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveStock = async (p: AdminProductT) => {
    const raw = draft[p.id];
    if (raw === undefined) return;
    const stock = Math.min(9999, Math.max(0, parseNum(raw)));
    if (stock === p.stock) {
      setDraft((d) => {
        const { [p.id]: _drop, ...rest } = d;
        return rest;
      });
      return;
    }
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ثبت موجودی انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? data.product : x)) : prev));
      setDraft((d) => {
        const { [p.id]: _drop, ...rest } = d;
        return rest;
      });
      toast({
        title: "موجودی به‌روزرسانی شد",
        description: `${p.name} — ${stock.toLocaleString("en-US")} عدد`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const bumpStock = async (p: AdminProductT, delta: number) => {
    const next = Math.min(9999, Math.max(0, p.stock + delta));
    if (next === p.stock) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ثبت موجودی انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? data.product : x)) : prev));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!products) return null;
    const list = [...products].sort((a, b) => a.stock - b.stock);
    if (filter === "LOW") return list.filter((p) => p.stock > 0 && p.stock <= 3);
    if (filter === "OUT") return list.filter((p) => p.stock === 0);
    return list;
  }, [products, filter]);

  if (filtered === null) return <Spinner label="در حال دریافت موجودی..." />;

  const outCount = (products ?? []).filter((p) => p.stock === 0).length;
  const lowCount = (products ?? []).filter((p) => p.stock > 0 && p.stock <= 3).length;
  const totalUnits = (products ?? []).reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-3">
      {/* summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className={cardCls}>
          <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <Boxes className="h-3.5 w-3.5" strokeWidth={1.4} />
            کل موجودی انبار
          </p>
          <p className="font-latin mt-1.5 text-[15px] text-cream">
            {totalUnits.toLocaleString("en-US")}
            <span className="mr-1 text-[9px] text-muted-foreground">عدد</span>
          </p>
        </div>
        <div className={cardCls}>
          <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-200" strokeWidth={1.4} />
            موجودی کم
          </p>
          <p className="font-latin mt-1.5 text-[15px] text-amber-200">
            {lowCount.toLocaleString("en-US")}
          </p>
        </div>
        <div className={cardCls}>
          <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <X className="h-3.5 w-3.5 text-red-300" strokeWidth={1.4} />
            ناموجود
          </p>
          <p className="font-latin mt-1.5 text-[15px] text-red-300">
            {outCount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* filter chips */}
      <div className="flex gap-1.5">
        {([
          { v: "ALL", l: "همه محصولات", c: (products ?? []).length },
          { v: "LOW", l: "موجودی کم", c: lowCount },
          { v: "OUT", l: "ناموجود", c: outCount },
        ] as const).map((chip) => (
          <button
            key={chip.v}
            onClick={() => setFilter(chip.v)}
            className={cn(
              "flex-1 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              filter === chip.v
                ? "border-cream bg-cream text-primary-foreground"
                : "border-border bg-earth/40 text-cream/75 hover:bg-earth-light/60"
            )}
          >
            {chip.l}
            <span className="font-latin mr-1 opacity-70">{chip.c}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          {filter === "ALL" ? "محصولی ثبت نشده است." : "موردی در این دسته پیدا نشد — عالی است!"}
        </p>
      ) : (
        filtered.map((p) => {
          const draftVal = draft[p.id] ?? String(p.stock);
          const dirty = parseNum(draftVal) !== p.stock;
          return (
            <div key={p.id} className="rounded-lg border border-border bg-earth/40 p-3">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-earth">
                  <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-latin truncate text-[12.5px] text-cream">{p.name}</p>
                  <p className="font-latin mt-0.5 truncate text-[10px] text-muted-foreground">
                    SKU {p.sku}
                  </p>
                </div>
                <div className="shrink-0">
                  <StockBadge stock={p.stock} />
                </div>
              </div>

              {/* inline stock controls */}
              <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
                <button
                  aria-label={`کاهش موجودی ${p.name}`}
                  disabled={busyId === p.id || p.stock === 0}
                  onClick={() => bumpStock(p, -1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-cream/85 transition-colors hover:bg-earth-light disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label={`افزایش موجودی ${p.name}`}
                  disabled={busyId === p.id}
                  onClick={() => bumpStock(p, +1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-cream/85 transition-colors hover:bg-earth-light disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  value={fmtNum(draftVal)}
                  onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  className={cn(
                    inputCls,
                    "h-8 flex-1 text-center font-latin text-[12.5px]",
                    dirty && "border-amber-300/50 text-amber-200"
                  )}
                  aria-label={`موجودی ${p.name}`}
                />
                <button
                  onClick={() => saveStock(p)}
                  disabled={busyId === p.id || !dirty}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-cream px-3 text-[11.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  ثبت
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------- orders tab ------------------------------- */

function OrdersTab() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderT[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/orders", { cache: "no-store" });
        const d = await r.json();
        setOrders(d.orders ?? []);
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  const changeStatus = async (o: OrderT, status: string) => {
    setBusyId(o.id);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "تغییر وضعیت انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setOrders((prev) => (prev ? prev.map((x) => (x.id === o.id ? data.order : x)) : prev));
      toast({
        title: `سفارش ${o.code}`,
        description: `وضعیت به «${ORDER_STATUS_LABELS[status]}» تغییر کرد.`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!orders) return null;
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    });
  }, [orders, statusFilter, query]);

  if (filtered === null) return <Spinner label="در حال دریافت سفارش‌ها..." />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(inputCls, "pr-9 text-[12.5px]")}
          placeholder="جستجوی کد سفارش، نام یا شماره تماس..."
        />
      </div>

      {/* status filter chips */}
      <div className="gh-scroll flex gap-1.5 overflow-x-auto pb-1">
        {[{ v: "ALL", l: "همه", c: orders?.length ?? 0 }].concat(
          ORDER_STATUSES.map((s) => ({
            v: s,
            l: ORDER_STATUS_LABELS[s],
            c: (orders ?? []).filter((o) => o.status === s).length,
          }))
        ).map((chip) => (
          <button
            key={chip.v}
            onClick={() => setStatusFilter(chip.v)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              statusFilter === chip.v
                ? "border-cream bg-cream text-primary-foreground"
                : "border-border bg-earth/40 text-cream/75 hover:bg-earth-light/60"
            )}
          >
            {chip.l}
            <span className="font-latin mr-1 opacity-70">{chip.c}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          سفارشی با این مشخصات پیدا نشد.
        </p>
      ) : (
        filtered.map((o) => (
          <div key={o.id} className="rounded-lg border border-border bg-earth/40 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p dir="ltr" className="font-latin text-right text-[13px] text-cream">{o.code}</p>
                <p className="mt-0.5 text-[10.5px] font-light text-muted-foreground">{faDate(o.createdAt)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
              <div className="min-w-0">
                <p className="truncate text-cream/90">{o.customerName}</p>
                <a
                  href={`tel:${o.customerPhone}`}
                  dir="ltr"
                  className="font-latin block text-right text-[11px] text-muted-foreground hover:text-cream"
                >
                  {o.customerPhone}
                </a>
              </div>
              <div className="shrink-0 text-left">
                <p className="font-latin text-[13px] text-cream">{formatIRT(o.total)}</p>
                {o.discount > 0 && (
                  <p className="font-latin text-[10.5px] text-emerald-300">
                    {o.couponCode} −{o.discount.toLocaleString("en-US")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Select value={o.status} onValueChange={(v) => changeStatus(o, v)} dir="rtl">
                <SelectTrigger className="h-8 flex-1 border-border bg-earth text-[12px] text-cream">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-earth-dark text-cream">
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-[12px] focus:bg-earth-light">
                      {ORDER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => setExpanded((v) => (v === o.id ? null : o.id))}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-cream/25 px-3 text-[11.5px] text-cream/85 transition-colors hover:bg-cream/10"
              >
                {expanded === o.id ? <X className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                {expanded === o.id ? "بستن" : `اقلام (${o.items.length.toLocaleString("en-US")})`}
              </button>
            </div>

            {busyId === o.id && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                در حال ثبت تغییر وضعیت...
              </p>
            )}

            {expanded === o.id && (
              <div className="mt-3 space-y-3 border-t border-border pt-3">
                <div className="space-y-2">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-earth">
                        <Image src={it.image} alt={it.name} fill sizes="36px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-latin truncate text-[12px] text-cream">{it.name}</p>
                        <p className="font-latin mt-0.5 text-[10.5px] text-muted-foreground">
                          {it.qty.toLocaleString("en-US")} × {formatIRT(it.price)} — SKU {it.sku}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-[11.5px] font-light leading-5 text-muted-foreground">
                  <p>
                    <span className="text-cream/80">آدرس: </span>
                    {o.address}
                  </p>
                  {o.note && (
                    <p>
                      <span className="text-cream/80">یادداشت مشتری: </span>
                      {o.note}
                    </p>
                  )}
                  {o.user && (
                    <p>
                      <span className="text-cream/80">حساب کاربری: </span>
                      {o.user.name}
                    </p>
                  )}
                  {o.discount > 0 && (
                    <p>
                      <span className="text-cream/80">تخفیف: </span>
                      <span className="font-latin">{formatIRT(o.discount)}</span>
                      {o.couponCode ? ` (${o.couponCode})` : ""}
                    </p>
                  )}
                  <p>
                    <span className="text-cream/80">هزینه ارسال: </span>
                    <span className="font-latin">{formatIRT(o.shipping)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------ overview tab ------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good" | "bad";
}) {
  const toneCls =
    tone === "warn"
      ? "text-amber-200"
      : tone === "good"
        ? "text-emerald-300"
        : tone === "bad"
          ? "text-red-300"
          : "text-cream";
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cream/70" strokeWidth={1.4} />
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
      <p className={cn("font-latin mt-2 truncate text-[16px]", toneCls)}>{value}</p>
      {hint && <p className="mt-0.5 text-[9.5px] font-light text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SalesChart({ series }: { series: AdminStatsT["salesSeries"] }) {
  const maxRev = Math.max(...series.map((s) => s.revenue), 1);
  const hasAny = series.some((s) => s.revenue > 0 || s.orders > 0);
  return (
    <div className={cardCls}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[12.5px] text-cream/90">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" strokeWidth={1.5} />
          فروش ۱۴ روز اخیر
        </h4>
        <span className="font-latin text-[10px] text-muted-foreground">
          max {maxRev.toLocaleString("en-US")} IRT
        </span>
      </div>
      {hasAny ? (
        <div className="flex h-24 items-end gap-1" dir="ltr">
          {series.map((d) => (
            <div
              key={d.day}
              className="group flex h-full flex-1 cursor-default flex-col justify-end gap-1"
              title={`${d.day} — ${d.orders} سفارش — ${formatIRT(d.revenue)}`}
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-cream/40 to-cream/90 transition-all group-hover:from-amber-300/60 group-hover:to-amber-200"
                style={{ height: `${Math.max((d.revenue / maxRev) * 100, 3)}%` }}
              />
              <span className="font-latin text-center text-[7.5px] text-muted-foreground">
                {d.day}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-[12px] text-muted-foreground">
          هنوز فروشی در این بازه ثبت نشده است.
        </p>
      )}
    </div>
  );
}

function OverviewTab({
  stats,
  recent,
  onGoOrders,
  onGoProducts,
  onGoInventory,
  onGoCoupons,
}: {
  stats: AdminStatsT | null;
  recent: AdminRecentOrderT[];
  onGoOrders: () => void;
  onGoProducts: () => void;
  onGoInventory: () => void;
  onGoCoupons: () => void;
}) {
  if (!stats) return <Spinner label="در حال محاسبه آمار..." />;

  const today = stats.salesSeries[stats.salesSeries.length - 1];

  return (
    <div className="space-y-4">
      {/* quick actions — like the storefront user-panel shortcuts */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: "سفارش‌ها", i: ClipboardList, go: onGoOrders, badge: stats.pending },
          { l: "محصول جدید", i: Plus, go: onGoProducts, badge: 0 },
          { l: "موجودی انبار", i: Boxes, go: onGoInventory, badge: stats.lowStock + stats.outOfStock },
          { l: "کد تخفیف", i: Percent, go: onGoCoupons, badge: 0 },
        ].map((a) => (
          <button
            key={a.l}
            onClick={a.go}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-earth/40 px-2 py-3 transition-colors hover:bg-earth-light/60"
          >
            <span className="relative">
              <a.i className="h-4 w-4 text-cream/85" strokeWidth={1.4} />
              {a.badge > 0 && (
                <span className="font-latin absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400/90 px-1 text-[8.5px] text-white">
                  {a.badge > 99 ? "۹۹+" : a.badge.toLocaleString("en-US")}
                </span>
              )}
            </span>
            <span className="text-[10.5px] text-cream/80">{a.l}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={TrendingUp}
          label="فروش امروز"
          value={formatIRT(today?.revenue ?? 0)}
          hint={`${(today?.orders ?? 0).toLocaleString("en-US")} سفارش امروز`}
        />
        <StatCard icon={Wallet} label="فروش کل" value={formatIRT(stats.revenue)} />
        <StatCard
          icon={Banknote}
          label="مجموع تخفیف‌ها"
          value={formatIRT(stats.discountsGiven)}
          tone={stats.discountsGiven > 0 ? "good" : "default"}
        />
        <StatCard icon={ClipboardList} label="کل سفارش‌ها" value={stats.orders.toLocaleString("en-US")} hint={`${stats.delivered.toLocaleString("en-US")} تحویل‌شده`} />
        <StatCard
          icon={Clock}
          label="در انتظار تأیید"
          value={stats.pending.toLocaleString("en-US")}
          tone={stats.pending > 0 ? "warn" : "default"}
        />
        <StatCard icon={UsersRound} label="کاربران" value={stats.users.toLocaleString("en-US")} />
        <StatCard icon={Package} label="محصولات" value={stats.products.toLocaleString("en-US")} />
        <StatCard
          icon={AlertTriangle}
          label="موجودی کم"
          value={stats.lowStock.toLocaleString("en-US")}
          hint={`${stats.outOfStock.toLocaleString("en-US")} ناموجود`}
          tone={stats.lowStock + stats.outOfStock > 0 ? "warn" : "default"}
        />
        <StatCard
          icon={Truck}
          label="در حال ارسال"
          value={(stats.statusCounts["SHIPPED"] ?? 0).toLocaleString("en-US")}
          hint={`${(stats.statusCounts["PREPARING"] ?? 0).toLocaleString("en-US")} آماده‌سازی`}
        />
      </div>

      <SalesChart series={stats.salesSeries} />

      {stats.topProducts.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[13px] text-cream/90">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" strokeWidth={1.4} />
            پرفروش‌ترین محصولات
          </h4>
          <div className="space-y-2">
            {stats.topProducts.map((t, i) => (
              <div
                key={t.sku}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-earth/40 px-3 py-2"
              >
                <span className="font-latin flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/10 text-[11px] text-cream">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-latin truncate text-[12px] text-cream">{t.name}</p>
                  <p className="font-latin text-[10px] text-muted-foreground">SKU {t.sku}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="font-latin text-[12px] text-cream">{t.qty.toLocaleString("en-US")} عدد</p>
                  <p className="font-latin text-[10px] text-muted-foreground">{formatIRT(t.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[13px] text-cream/90">آخرین سفارش‌ها</h4>
          <button onClick={onGoOrders} className="gh-link !text-[12px]">
            مدیریت سفارش‌ها
          </button>
        </div>
        {recent.length === 0 ? (
          <div className={cardCls}>
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              هنوز سفارشی ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((o) => (
              <button
                key={o.id}
                onClick={onGoOrders}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-earth/40 px-3 py-2.5 text-right transition-colors hover:bg-earth-light/60"
              >
                <div className="min-w-0">
                  <p dir="ltr" className="font-latin text-right text-[12.5px] text-cream">{o.code}</p>
                  <p className="mt-0.5 truncate text-[10.5px] font-light text-muted-foreground">
                    {o.customerName} — {o.itemsCount.toLocaleString("en-US")} قلم
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={o.status} />
                  <p className="font-latin text-[12px] text-cream/90">{formatIRT(o.total)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onGoProducts}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cream/25 py-3 text-[12.5px] text-cream/80 transition-colors hover:bg-cream/5"
      >
        <Plus className="h-4 w-4" />
        افزودن یا مدیریت محصولات فروشگاه
      </button>
    </div>
  );
}

/* ------------------------------- users tab -------------------------------- */

function UsersTab() {
  const { user: me } = useAccountStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserT[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/users", { cache: "no-store" });
        const d = await r.json();
        setUsers(d.users ?? []);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

  const setRole = async (u: AdminUserT, role: "USER" | "ADMIN") => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "تغییر نقش انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
      return;
    }
    setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? { ...x, role } : x)) : prev));
    toast({
      title: role === "ADMIN" ? "کاربر مدیر شد" : "مدیریت کاربر برداشته شد",
      description: u.name,
    });
  };

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.phone.includes(q)
    );
  }, [users, query]);

  if (filtered === null) return <Spinner label="در حال دریافت کاربران..." />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(inputCls, "pr-9 text-[12.5px]")}
          placeholder="جستجوی نام یا شماره تماس..."
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          {users.length === 0 ? "کاربری ثبت‌نام نکرده است." : "کاربری پیدا نشد."}
        </p>
      ) : (
        filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border bg-earth/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/90 text-[13px] font-semibold text-primary-foreground">
              {u.name.trim().charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] text-cream">{u.name}</p>
                {u.role === "ADMIN" && (
                  <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[9.5px] text-amber-200">
                    مدیر
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10.5px] font-light text-muted-foreground">
                <span dir="ltr" className="font-latin">{u.phone}</span>
                {" — "}
                {u._count.orders.toLocaleString("en-US")} سفارش — {faDateShort(u.createdAt)}
              </p>
            </div>
            {u.role === "ADMIN" ? (
              <button
                onClick={() => setRole(u, "USER")}
                disabled={u.id === me?.id}
                className="shrink-0 rounded-md border border-cream/25 px-3 py-1.5 text-[11px] text-cream/85 transition-colors hover:bg-cream/10 disabled:opacity-30"
                title={u.id === me?.id ? "تغییر نقش حساب خودتان ممکن نیست" : undefined}
              >
                سلب مدیریت
              </button>
            ) : (
              <button
                onClick={() => setRole(u, "ADMIN")}
                className="shrink-0 rounded-md border border-cream/25 px-3 py-1.5 text-[11px] text-cream/85 transition-colors hover:bg-cream/10"
              >
                تبدیل به مدیر
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------ coupons tab ------------------------------- */

function CouponValueBadge({ c }: { c: CouponT }) {
  return c.type === "PERCENT" ? (
    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10.5px] text-emerald-200">
      {c.value.toLocaleString("en-US")}٪ تخفیف
    </span>
  ) : (
    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10.5px] text-emerald-200">
      {formatIRT(c.value)} تخفیف
    </span>
  );
}

function CouponsTab() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<CouponT[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // add form
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [value, setValue] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/coupons", { cache: "no-store" });
      const d = await r.json();
      setCoupons(d.coupons ?? []);
    } catch {
      setCoupons([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCoupon = async () => {
    const val = parseNum(value);
    if (code.trim().length < 2 || val <= 0) {
      toast({ title: "کد و مقدار تخفیف را درست وارد کنید." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          type,
          value: val,
          minTotal: parseNum(minTotal),
          usageLimit: parseNum(usageLimit) > 0 ? parseNum(usageLimit) : null,
          active: true,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ثبت انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setCoupons((prev) => [data.coupon as CouponT, ...(prev ?? [])]);
      setAddOpen(false);
      setCode("");
      setValue("");
      setMinTotal("");
      setUsageLimit("");
      setExpiresAt("");
      toast({ title: "کد تخفیف ساخته شد", description: data.coupon.code });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c: CouponT, active: boolean) => {
    setCoupons((prev) =>
      prev ? prev.map((x) => (x.id === c.id ? { ...x, active } : x)) : prev
    );
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      setCoupons((prev) =>
        prev ? prev.map((x) => (x.id === c.id ? { ...x, active: !active } : x)) : prev
      );
      toast({ title: "تغییر وضعیت انجام نشد" });
    }
  };

  const remove = async (c: CouponT) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "حذف نشد", description: "دوباره تلاش کنید." });
      return;
    }
    setCoupons((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
    toast({ title: "کد تخفیف حذف شد", description: c.code });
  };

  if (coupons === null) return <Spinner label="در حال دریافت کدهای تخفیف..." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] text-muted-foreground">
          {coupons.length.toLocaleString("en-US")} کد تخفیف ثبت شده
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-cream px-3.5 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            کد تخفیف جدید
          </button>
          <DialogContent dir="rtl" className="border-border bg-earth-dark text-cream sm:max-w-[420px]">
            <DialogHeader className="text-right">
              <DialogTitle className="text-cream">کد تخفیف جدید</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                مشتری‌ها می‌توانند در مرحله ثبت سفارش این کد را وارد کنند.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-cream/80">کد</Label>
                <Input
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={cn(inputCls, "text-right font-latin")}
                  placeholder="GOL20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-cream/80">نوع تخفیف</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "PERCENT" | "AMOUNT")} dir="rtl">
                    <SelectTrigger className={cn(inputCls, "text-[12.5px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-earth-dark text-cream">
                      <SelectItem value="PERCENT" className="text-[12.5px] focus:bg-earth-light">درصدی</SelectItem>
                      <SelectItem value="AMOUNT" className="text-[12.5px] focus:bg-earth-light">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-cream/80">
                    {type === "PERCENT" ? "درصد (۱ تا ۹۰)" : "مبلغ (IRT)"}
                  </Label>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => setValue(fmtNum(e.target.value))}
                    className={cn(inputCls, "text-right font-latin")}
                    placeholder={type === "PERCENT" ? "20" : "500,000"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-cream/80">حداقل سبد (IRT)</Label>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    value={minTotal}
                    onChange={(e) => setMinTotal(fmtNum(e.target.value))}
                    className={cn(inputCls, "text-right font-latin")}
                    placeholder="بدون محدودیت"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-cream/80">سقف تعداد استفاده</Label>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value.replace(/[^\d]/g, ""))}
                    className={cn(inputCls, "text-right font-latin")}
                    placeholder="بدون محدودیت"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-cream/80">تاریخ انقضا (اختیاری)</Label>
                <Input
                  dir="ltr"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={cn(inputCls, "text-right font-latin")}
                />
              </div>
              <button
                onClick={addCoupon}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                ثبت کد تخفیف
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          هنوز کد تخفیفی ساخته نشده است.
        </p>
      ) : (
        coupons.map((c) => {
          const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
          const exhausted = c.usageLimit != null && c.usedCount >= c.usageLimit;
          return (
            <div key={c.id} className="rounded-lg border border-border bg-earth/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p dir="ltr" className="font-latin text-right text-[13.5px] text-cream">
                  {c.code}
                </p>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={c.active}
                    onCheckedChange={(v) => toggleActive(c, v)}
                    aria-label={`فعال/غیرفعال ${c.code}`}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        aria-label={`حذف ${c.code}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-red-400/30 text-red-300 transition-colors hover:bg-red-400/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl" className="border-border bg-earth-dark text-cream">
                      <AlertDialogHeader className="text-right">
                        <AlertDialogTitle className="text-cream">حذف کد تخفیف</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          کد «{c.code}» برای همیشه حذف می‌شود.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row justify-start gap-2">
                        <AlertDialogAction
                          onClick={() => remove(c)}
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
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                <CouponValueBadge c={c} />
                {c.minTotal > 0 && (
                  <span className="rounded-full border border-border bg-earth px-2 py-0.5 text-muted-foreground">
                    حداقل سبد {formatIRT(c.minTotal)}
                  </span>
                )}
                {c.usageLimit != null && (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      exhausted
                        ? "border-red-400/35 bg-red-400/10 text-red-300"
                        : "border-border bg-earth text-muted-foreground"
                    )}
                  >
                    {c.usedCount.toLocaleString("en-US")} / {c.usageLimit.toLocaleString("en-US")} استفاده
                  </span>
                )}
                {c.expiresAt && (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      expired
                        ? "border-red-400/35 bg-red-400/10 text-red-300"
                        : "border-border bg-earth text-muted-foreground"
                    )}
                  >
                    انقضا {faDateShort(c.expiresAt)}
                  </span>
                )}
                {!c.active && (
                  <span className="rounded-full border border-border bg-earth px-2 py-0.5 text-muted-foreground">
                    غیرفعال
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------ activity tab ------------------------------ */

function ActivityTab({ onGoOrders }: { onGoOrders: () => void }) {
  const [activity, setActivity] = useState<AdminActivityT | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/activity", { cache: "no-store" });
        const d = await r.json();
        setActivity(d.activity ?? null);
      } catch {
        setActivity(null);
      }
    })();
  }, []);

  if (!activity) return <Spinner label="در حال دریافت اعلان‌ها..." />;

  const empty =
    activity.recentOrders.length === 0 &&
    activity.recentUsers.length === 0 &&
    activity.stockAlerts.length === 0;

  return (
    <div className="space-y-5">
      {/* summary strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className={cardCls}>
          <p className="text-[10px] text-muted-foreground">در انتظار تأیید</p>
          <p
            className={cn(
              "font-latin mt-1 text-[15px]",
              activity.counts.pendingOrders > 0 ? "text-amber-200" : "text-cream"
            )}
          >
            {activity.counts.pendingOrders.toLocaleString("en-US")}
          </p>
        </div>
        <div className={cardCls}>
          <p className="text-[10px] text-muted-foreground">عضو جدید هفته</p>
          <p className="font-latin mt-1 text-[15px] text-cream">
            {activity.counts.newUsers7d.toLocaleString("en-US")}
          </p>
        </div>
        <div className={cardCls}>
          <p className="text-[10px] text-muted-foreground">موجودی کم</p>
          <p
            className={cn(
              "font-latin mt-1 text-[15px]",
              activity.counts.lowStock > 0 ? "text-amber-200" : "text-cream"
            )}
          >
            {activity.counts.lowStock.toLocaleString("en-US")}
          </p>
        </div>
        <div className={cardCls}>
          <p className="text-[10px] text-muted-foreground">ناموجود</p>
          <p
            className={cn(
              "font-latin mt-1 text-[15px]",
              activity.counts.outOfStock > 0 ? "text-red-300" : "text-cream"
            )}
          >
            {activity.counts.outOfStock.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {empty && (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          فعالیتی برای نمایش وجود ندارد.
        </p>
      )}

      {/* new orders */}
      {activity.recentOrders.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-[13px] text-cream/90">
              <ClipboardList className="h-3.5 w-3.5 text-emerald-300" strokeWidth={1.4} />
              سفارش‌های اخیر
            </h4>
            <button onClick={onGoOrders} className="gh-link !text-[12px]">
              مدیریت سفارش‌ها
            </button>
          </div>
          <div className="space-y-2">
            {activity.recentOrders.map((o) => (
              <button
                key={o.id}
                onClick={onGoOrders}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-earth/40 px-3 py-2.5 text-right transition-colors hover:bg-earth-light/60"
              >
                <div className="min-w-0">
                  <p dir="ltr" className="font-latin text-right text-[12.5px] text-cream">
                    {o.code}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] font-light text-muted-foreground">
                    {o.customerName} — {faDateShort(o.createdAt)} —{" "}
                    {o.itemsCount.toLocaleString("en-US")} قلم
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={o.status} />
                  <p className="font-latin text-[12px] text-cream/90">{formatIRT(o.total)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* recent sign-ups */}
      {activity.recentUsers.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[13px] text-cream/90">
            <UsersRound className="h-3.5 w-3.5 text-cream/70" strokeWidth={1.4} />
            ثبت‌نام‌های اخیر
          </h4>
          <div className="space-y-2">
            {activity.recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-earth/40 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/90 text-[12px] font-semibold text-primary-foreground">
                  {u.name.trim().charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-cream">
                    {u.name}
                    {u.role === "ADMIN" && (
                      <span className="mr-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-1.5 py-0.5 text-[9px] text-amber-200">
                        مدیر
                      </span>
                    )}
                  </p>
                  <p className="font-latin mt-0.5 text-[10.5px] text-muted-foreground" dir="ltr">
                    {u.phone}
                  </p>
                </div>
                <p className="shrink-0 text-[10px] font-light text-muted-foreground">
                  {faDateShort(u.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* stock alerts */}
      {activity.stockAlerts.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[13px] text-cream/90">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-200" strokeWidth={1.4} />
            هشدار موجودی
          </h4>
          <div className="space-y-2">
            {activity.stockAlerts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-earth/40 px-3 py-2.5"
              >
                <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-earth">
                  <Image src={p.image} alt={p.name} fill sizes="32px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-latin truncate text-[12px] text-cream">{p.name}</p>
                  <p className="font-latin mt-0.5 text-[10px] text-muted-foreground">
                    SKU {p.sku}
                  </p>
                </div>
                <div className="shrink-0">
                  <StockBadge stock={p.stock} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ settings tab ------------------------------ */

function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsT | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/settings", { cache: "no-store" });
        const d = await r.json();
        setSettings(d.settings ?? null);
      } catch {
        setSettings(null);
      }
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryFee: parseNum(String(settings.deliveryFee)),
          supportPhone: settings.supportPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setSettings(data.settings as SettingsT);
      toast({ title: "تنظیمات ذخیره شد", description: "تغییرات در فروشگاه اعمال شد." });
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <Spinner label="در حال دریافت تنظیمات..." />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-[12px] text-cream/80">
            <Truck className="h-3.5 w-3.5" />
            هزینه ارسال (IRT)
          </Label>
          <Input
            dir="ltr"
            inputMode="numeric"
            value={fmtNum(String(settings.deliveryFee))}
            onChange={(e) => setSettings({ ...settings, deliveryFee: parseNum(e.target.value) })}
            className={cn(inputCls, "text-right font-latin")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-[12px] text-cream/80">
            <Phone className="h-3.5 w-3.5" />
            شماره تماس پشتیبانی
          </Label>
          <Input
            dir="ltr"
            inputMode="tel"
            value={settings.supportPhone}
            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            className={cn(inputCls, "text-right font-latin")}
          />
        </div>
      </div>

      <p className="rounded-lg border border-border bg-earth/40 px-3 py-2.5 text-[11px] font-light leading-5 text-muted-foreground">
        هزینه ارسال در مرحله ثبت سفارش به مشتری نمایش داده می‌شود.
      </p>

      <button
        onClick={save}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        ذخیره تنظیمات
      </button>
    </div>
  );
}

/* ------------------------------ admin panel ------------------------------- */

const ADMIN_TABS = [
  { v: "overview", l: "نمای کلی", icon: LayoutDashboard },
  { v: "orders", l: "سفارش‌ها", icon: ClipboardList, badge: "pending" },
  { v: "products", l: "محصولات", icon: Package, badge: null },
  { v: "content", l: "محتوای سایت", icon: LayoutTemplate, badge: null },
  { v: "customFlower", l: "گل به سلیقه شما", icon: Flower2, badge: null },
  { v: "inventory", l: "موجودی انبار", icon: Boxes, badge: "stock" },
  { v: "users", l: "کاربران", icon: UsersRound, badge: null },
  { v: "coupons", l: "کدهای تخفیف", icon: Percent, badge: null },
  { v: "activity", l: "اعلان‌ها", icon: Bell, badge: "alerts" },
  { v: "settings", l: "تنظیمات", icon: Settings2, badge: null },
] as const;

type AdminTabValue = (typeof ADMIN_TABS)[number]["v"];

export function AdminPanel() {
  const setView = useAccountStore((s) => s.setView);
  const me = useAccountStore((s) => s.user);
  const { toast } = useToast();

  const [tab, setTab] = useState<AdminTabValue>("overview");
  const [stats, setStats] = useState<AdminStatsT | null>(null);
  const [recent, setRecent] = useState<AdminRecentOrderT[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        const d = await r.json();
        if (!r.ok) {
          toast({ title: "دسترسی به پنل مدیریت ممکن نیست", description: d.error ?? "" });
          return;
        }
        setStats(d.stats ?? null);
        setRecent(d.recentOrders ?? []);
      } catch {
        setStats(null);
      }
    })();
  }, []);

  const badgeValue = (key: string | null): number => {
    if (!stats || !key) return 0;
    if (key === "pending") return stats.pending;
    if (key === "stock") return stats.lowStock + stats.outOfStock;
    if (key === "alerts") return stats.pending + stats.lowStock + stats.outOfStock;
    return 0;
  };

  const activeLabel = ADMIN_TABS.find((t) => t.v === tab)?.l ?? "";

  return (
    <>
      <SheetHeader className="border-b border-border pb-4">
        <SheetTitle className="flex items-center gap-2 text-right text-[16px] text-cream">
          <ShieldCheck className="h-5 w-5 text-emerald-300" strokeWidth={1.4} />
          پنل مدیریت
          <span className="mr-auto text-[11px] font-light text-muted-foreground">گلستان حافظ</span>
        </SheetTitle>
      </SheetHeader>

      <div className="px-4 pt-3">
        <button
          onClick={() => setView("account")}
          className="flex items-center gap-1.5 text-[12px] text-cream/75 transition-colors hover:text-cream"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
          بازگشت به حساب کاربری
        </button>
      </div>

      {/* mobile section chips */}
      <div className="gh-scroll flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2.5 sm:hidden">
        {ADMIN_TABS.map((t) => {
          const count = badgeValue(t.badge);
          return (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                tab === t.v
                  ? "border-cream bg-cream text-primary-foreground"
                  : "border-border bg-earth/40 text-cream/75 hover:bg-earth-light/60"
              )}
            >
              <t.icon className="h-3.5 w-3.5" strokeWidth={1.4} />
              {t.l}
              {count > 0 && (
                <span className="font-latin rounded-full bg-red-400/90 px-1.5 text-[9px] text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* sidebar — right side in RTL */}
        <nav
          aria-label="بخش‌های پنل مدیریت"
          className="gh-scroll hidden w-52 shrink-0 flex-col gap-1 overflow-y-auto border-l border-border bg-earth/30 px-2.5 py-4 sm:flex"
        >
          {/* admin mini profile — like the reference panel */}
          {me && (
            <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-earth/50 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/90 text-[13px] font-semibold text-primary-foreground">
                {me.name.trim().charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] text-cream">{me.name}</p>
                <p className="font-latin mt-0.5 text-[10px] text-muted-foreground" dir="ltr">
                  {me.phone}
                </p>
              </div>
            </div>
          )}

          {ADMIN_TABS.map((t) => {
            const count = badgeValue(t.badge);
            const active = tab === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] transition-colors",
                  active
                    ? "bg-cream font-medium text-primary-foreground"
                    : "text-cream/75 hover:bg-earth-light/60"
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" strokeWidth={1.4} />
                <span className="flex-1 text-right">{t.l}</span>
                {count > 0 && (
                  <span className="font-latin flex h-5 min-w-5 items-center justify-center rounded-full bg-red-400/90 px-1.5 text-[9.5px] text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}

          <p className="mt-auto px-3 pt-4 text-[9.5px] font-light leading-4 text-muted-foreground">
            پنل مدیریت گلستان حافظ — مدیریت محصولات، سفارش‌ها، انبار، کاربران و تخفیف‌ها.
          </p>
        </nav>

        {/* content */}
        <div className="gh-scroll min-w-0 flex-1 overflow-y-auto px-4 py-4">
          <h3 className="mb-3 flex items-center gap-2 text-[13.5px] text-cream/90 sm:hidden">
            {ADMIN_TABS.find((t) => t.v === tab)?.icon &&
              (() => {
                const I = ADMIN_TABS.find((t) => t.v === tab)!.icon;
                return <I className="h-4 w-4" strokeWidth={1.4} />;
              })()}
            {activeLabel}
          </h3>

          {tab === "overview" && (
            <OverviewTab
              stats={stats}
              recent={recent}
              onGoOrders={() => setTab("orders")}
              onGoProducts={() => setTab("products")}
              onGoInventory={() => setTab("inventory")}
              onGoCoupons={() => setTab("coupons")}
            />
          )}
          {tab === "products" && <ProductsTab />}
          {tab === "content" && <ContentTab />}
          {tab === "customFlower" && <CustomFlowerTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "inventory" && <InventoryTab />}
          {tab === "users" && <UsersTab />}
          {tab === "coupons" && <CouponsTab />}
          {tab === "activity" && <ActivityTab onGoOrders={() => setTab("orders")} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </>
  );
}
