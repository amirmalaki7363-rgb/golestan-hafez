"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadField } from "@/components/shop/image-upload-field";
import {
  DEFAULT_SITE_CONTENT,
  type HeroSlideT,
  type SiteContent,
} from "@/lib/site-content-schema";
import { cn } from "@/lib/utils";

const inputCls = "border-border bg-earth text-cream placeholder:text-muted-foreground/60";

/* ------------------------------ tiny field helpers ------------------------------ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-cream/80">{label}</Label>
      {children}
    </div>
  );
}

function TextIn({
  value,
  onChange,
  latin,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  latin?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={latin ? "ltr" : undefined}
      className={cn(inputCls, "text-[12px]", latin && "font-latin text-right")}
      placeholder={placeholder}
    />
  );
}

function AreaIn({
  value,
  onChange,
  latin,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  latin?: boolean;
  rows?: number;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={latin ? "ltr" : undefined}
      rows={rows}
      className={cn(inputCls, "text-[12px]", latin && "font-latin text-right")}
    />
  );
}

function CardBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-earth/40 p-3.5">
      <p className="flex items-center gap-2 text-[12px] font-medium text-cream">
        <span className="h-1.5 w-1.5 rounded-full bg-cream/50" />
        {title}
      </p>
      {children}
    </div>
  );
}

/* -------------------------------- main tab -------------------------------- */

export function ContentTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  // Source of truth, kept in sync synchronously so image auto-save never
  // sends a stale snapshot (state effects lag one render behind).
  const contentRef = useRef<SiteContent | null>(null);

  const apply = (next: SiteContent | null) => {
    contentRef.current = next;
    setContent(next);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/content", { cache: "no-store" });
        const d = await r.json();
        apply(d.content ?? null);
        if (!r.ok) toast({ title: "دریافت محتوا ممکن نیست", description: d.error ?? "" });
      } catch {
        apply(null);
      }
    })();
  }, []);

  if (!content) return <Spinner label="در حال دریافت محتوای سایت..." />;

  const set = <S extends keyof SiteContent>(section: S, patch: Partial<SiteContent[S]>) => {
    const c = contentRef.current;
    if (!c) return;
    apply({ ...c, [section]: { ...(c[section] as object), ...patch } as SiteContent[S] });
  };

  /** PUTs a content snapshot; returns the server-validated content or null. */
  const putContent = async (next: SiteContent): Promise<SiteContent | null> => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: d.detail ?? d.error ?? "دوباره تلاش کنید." });
        return null;
      }
      return d.content as SiteContent;
    } catch {
      toast({ title: "ذخیره نشد", description: "ارتباط با سرور برقرار نشد." });
      return null;
    }
  };

  /** Image uploads apply instantly: save + refresh the storefront behind the panel. */
  const setImg = <S extends keyof SiteContent>(section: S, patch: Partial<SiteContent[S]>) => {
    set(section, patch);
    const next = contentRef.current;
    if (!next) return;
    setBusy(true);
    void (async () => {
      const saved = await putContent(next);
      setBusy(false);
      if (saved) {
        toast({
          title: "تصویر روی سایت اعمال شد",
          description: "تصویر جدید ذخیره شد و بلافاصله در صفحه اصلی نمایش داده می‌شود.",
        });
        router.refresh();
      }
    })();
  };

  const save = async () => {
    const c = contentRef.current;
    if (!c) return;
    const emptySlide = c.hero.slides.findIndex((s) => !s.image.trim());
    if (emptySlide !== -1) {
      toast({ title: `تصویر اسلاید ${emptySlide + 1} هیرو را انتخاب کنید.` });
      return;
    }
    setBusy(true);
    try {
      const saved = await putContent(c);
      if (!saved) return;
      apply(saved);
      toast({
        title: "محتوای سایت ذخیره شد",
        description: "تغییرات بلافاصله در صفحه اصلی اعمال می‌شود.",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    apply(DEFAULT_SITE_CONTENT);
    toast({ title: "به حالت پیش‌فرض برگشت", description: "برای اعمال، ذخیره را بزنید." });
  };

  /* --------------------------- hero slide helpers --------------------------- */

  const setSlides = (slides: SiteContent["hero"]["slides"]) => set("hero", { slides });

  const setSlide = (i: number, patch: Partial<HeroSlideT>) => {
    const c = contentRef.current;
    if (!c) return;
    setSlides(c.hero.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  /** Image uploads apply instantly: save + refresh the storefront behind the panel. */
  const setSlideImg = (i: number, patch: Partial<HeroSlideT>) => {
    const c = contentRef.current;
    if (!c) return;
    setImg("hero", {
      slides: c.hero.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  };

  const addSlide = () => {
    const c = contentRef.current;
    if (!c) return;
    setSlides([
      ...c.hero.slides,
      {
        image: "/images/hero.jpg",
        alt: "",
        label: "اسلاید جدید",
        caption: "",
        ctaLabel: "",
        ctaHref: "",
      },
    ]);
    toast({ title: "اسلاید اضافه شد", description: "تصویر و متنش را تنظیم کنید و ذخیره بزنید." });
  };

  const removeSlide = (i: number) => {
    const c = contentRef.current;
    if (!c) return;
    if (c.hero.slides.length <= 1) return;
    setSlides(c.hero.slides.filter((_, idx) => idx !== i));
    toast({ title: "اسلاید حذف شد", description: "برای اعمال، ذخیره را بزنید." });
  };

  return (
    <div className="space-y-3">
      <Accordion
        type="multiple"
        defaultValue={["hero", "whatsapp"]}
        className="space-y-2"
      >
        {/* ------------------------------- hero ------------------------------- */}
        <AccordionItem value="hero" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            هیرو — بنر اسلایدری بالای سایت
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            {content.hero.slides.map((slide, i) => (
              <CardBox key={i} title={`اسلاید ${i + 1}`}>
                <ImageUploadField
                  label="تصویر اسلاید"
                  value={slide.image}
                  onChange={(v) => setSlide(i, { image: v })}
                  onUploaded={(p) => setSlideImg(i, { image: p })}
                  height="h-36"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="برچسب فارسی روی بنر">
                    <TextIn
                      value={slide.label}
                      onChange={(v) => setSlide(i, { label: v })}
                    />
                  </Field>
                  <Field label="متن جایگزین تصویر (Alt)">
                    <TextIn
                      value={slide.alt}
                      onChange={(v) => setSlide(i, { alt: v })}
                    />
                  </Field>
                </div>
                <Field label="کپشن شاعرانه (پایین تصویر، انگلیسی)">
                  <AreaIn
                    latin
                    rows={2}
                    value={slide.caption}
                    onChange={(v) => setSlide(i, { caption: v })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="متن دکمه (اختیاری)">
                    <TextIn
                      value={slide.ctaLabel ?? ""}
                      onChange={(v) => setSlide(i, { ctaLabel: v })}
                      placeholder="مثلاً: شروع تست"
                    />
                  </Field>
                  <Field label="مقصد دکمه">
                    <TextIn
                      latin
                      value={slide.ctaHref ?? ""}
                      onChange={(v) => setSlide(i, { ctaHref: v })}
                      placeholder="#flower-test یا #autumn"
                    />
                  </Field>
                </div>
                <p className="text-[10.5px] leading-5 text-cream/50">
                  <span dir="ltr" className="font-latin">#flower-test</span> باز شدن تست
                  شخصیت‌شناسی، <span dir="ltr" className="font-latin">#autumn</span> اسکرول به
                  بخش پاییز، لینک کامل برای رفتن به صفحه دیگر.
                </p>
                {content.hero.slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlide(i)}
                    className="flex items-center gap-1.5 text-[11px] text-red-400/90 transition-colors hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف این اسلاید
                  </button>
                )}
              </CardBox>
            ))}

            <button
              type="button"
              onClick={addSlide}
              disabled={content.hero.slides.length >= 6}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-[12px] text-cream/70 transition-colors hover:bg-earth-light/40 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              افزودن اسلاید جدید
            </button>

            <Field label="فاصله‌ی تغییر خودکار اسلایدها (میلی‌ثانیه، بین ۳۰۰۰ تا ۱۵۰۰۰)">
              <Input
                type="number"
                dir="ltr"
                min={3000}
                max={15000}
                step={500}
                value={String(content.hero.autoplayMs)}
                onChange={(e) => {
                  const n = Math.round(Number(e.target.value));
                  if (Number.isFinite(n) && n > 0) {
                    set("hero", { autoplayMs: Math.min(15000, Math.max(3000, n)) });
                  }
                }}
                className={cn(inputCls, "text-[12px]")}
              />
            </Field>
          </AccordionContent>
        </AccordionItem>

        {/* ----------------------------- whatsapp ------------------------------ */}
        <AccordionItem value="whatsapp" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            نوار واتس‌اپ
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <Field label="متن راهنما">
              <TextIn
                value={content.whatsapp.text}
                onChange={(v) => set("whatsapp", { text: v })}
              />
            </Field>
            <Field label="شماره واتس‌اپ">
              <TextIn
                latin
                value={content.whatsapp.phone}
                onChange={(v) => set("whatsapp", { phone: v })}
              />
            </Field>
          </AccordionContent>
        </AccordionItem>

        {/* ---------------------------- collections ---------------------------- */}
        <AccordionItem value="collections" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            کالکشن‌ها (۴ کارت اصلی)
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <Field label="تیتر بالای بخش">
              <TextIn
                latin
                value={content.collections.heading}
                onChange={(v) => set("collections", { heading: v })}
              />
            </Field>

            {(
              [
                ["roseBox", "کارت ۱ — باکس ویژه رز"],
                ["occasionBouquet", "کارت ۲ — دسته‌گل مناسبتی"],
                ["flowerBox", "کارت ۳ — باکس گل (بلند)"],
                ["bouquets", "کارت ۴ — دسته گل (تمام عرض)"],
              ] as const
            ).map(([key, title]) => {
              const card = content.collections[key];
              return (
                <CardBox key={key} title={title}>
                  <ImageUploadField
                    value={card.image}
                    onChange={(v) => set("collections", { [key]: { ...card, image: v } } as Partial<SiteContent["collections"]>)}
                    onUploaded={(p) => setImg("collections", { [key]: { ...card, image: p } } as Partial<SiteContent["collections"]>)}
                    height="h-28"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="تیتر لاتین">
                      <TextIn
                        latin
                        value={card.title}
                        onChange={(v) => set("collections", { [key]: { ...card, title: v } } as Partial<SiteContent["collections"]>)}
                      />
                    </Field>
                    <Field label="عنوان فارسی">
                      <TextIn
                        value={card.fa}
                        onChange={(v) => set("collections", { [key]: { ...card, fa: v } } as Partial<SiteContent["collections"]>)}
                      />
                    </Field>
                  </div>
                  <Field label="متن توضیح (لاتین)">
                    <AreaIn
                      latin
                      rows={2}
                      value={card.desc}
                      onChange={(v) => set("collections", { [key]: { ...card, desc: v } } as Partial<SiteContent["collections"]>)}
                    />
                  </Field>
                  <Field label="متن جایگزین تصویر">
                    <TextIn
                      value={card.alt}
                      onChange={(v) => set("collections", { [key]: { ...card, alt: v } } as Partial<SiteContent["collections"]>)}
                    />
                  </Field>
                </CardBox>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {/* ------------------------------- autumn ------------------------------ */}
        <AccordionItem value="autumn" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            بخش کالکشن پاییز
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Field label="لیبل کوچک">
                <TextIn latin value={content.autumn.label} onChange={(v) => set("autumn", { label: v })} />
              </Field>
              <Field label="متن دکمه">
                <TextIn latin value={content.autumn.cta} onChange={(v) => set("autumn", { cta: v })} />
              </Field>
            </div>
            <Field label="تیتر">
              <TextIn latin value={content.autumn.title} onChange={(v) => set("autumn", { title: v })} />
            </Field>
            <Field label="توضیحات">
              <AreaIn latin rows={2} value={content.autumn.description} onChange={(v) => set("autumn", { description: v })} />
            </Field>
            <ImageUploadField
              label="تصویر بخش پاییز"
              value={content.autumn.image}
              onChange={(v) => set("autumn", { image: v })}
              onUploaded={(p) => setImg("autumn", { image: p })}
              height="h-32"
            />
            <Field label="متن جایگزین تصویر">
              <TextIn value={content.autumn.imageAlt} onChange={(v) => set("autumn", { imageAlt: v })} />
            </Field>
          </AccordionContent>
        </AccordionItem>

        {/* --------------------------------- vip -------------------------------- */}
        <AccordionItem value="vip" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            بنر VIP
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Field label="لیبل کوچک">
                <TextIn latin value={content.vip.label} onChange={(v) => set("vip", { label: v })} />
              </Field>
              <Field label="تیتر بزرگ">
                <TextIn latin value={content.vip.title} onChange={(v) => set("vip", { title: v })} />
              </Field>
            </div>
            <Field label="زیرتیتر">
              <TextIn latin value={content.vip.subtitle} onChange={(v) => set("vip", { subtitle: v })} />
            </Field>
            <Field label="متن دکمه">
              <TextIn latin value={content.vip.cta} onChange={(v) => set("vip", { cta: v })} />
            </Field>
            <ImageUploadField
              label="تصویر پس‌زمینه"
              value={content.vip.image}
              onChange={(v) => set("vip", { image: v })}
              onUploaded={(p) => setImg("vip", { image: p })}
              height="h-32"
            />
            <Field label="متن جایگزین تصویر">
              <TextIn value={content.vip.imageAlt} onChange={(v) => set("vip", { imageAlt: v })} />
            </Field>
          </AccordionContent>
        </AccordionItem>

        {/* ------------------------------ occasions ----------------------------- */}
        <AccordionItem value="occasions" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            مناسبت‌ها (۴ کارت)
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Field label="لیبل کوچک">
                <TextIn latin value={content.occasions.label} onChange={(v) => set("occasions", { label: v })} />
              </Field>
              <Field label="تیتر فارسی">
                <TextIn value={content.occasions.title} onChange={(v) => set("occasions", { title: v })} />
              </Field>
            </div>
            {content.occasions.items.map((item, i) => (
              <CardBox key={i} title={`مناسبت ${i + 1}`}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="نام فارسی">
                    <TextIn
                      value={item.fa}
                      onChange={(v) => {
                        const items = [...content.occasions.items];
                        items[i] = { ...item, fa: v };
                        set("occasions", { items });
                      }}
                    />
                  </Field>
                  <Field label="نام لاتین">
                    <TextIn
                      latin
                      value={item.en}
                      onChange={(v) => {
                        const items = [...content.occasions.items];
                        items[i] = { ...item, en: v };
                        set("occasions", { items });
                      }}
                    />
                  </Field>
                </div>
                <ImageUploadField
                  value={item.image}
                  onChange={(v) => {
                    const items = [...content.occasions.items];
                    items[i] = { ...item, image: v };
                    set("occasions", { items });
                  }}
                  onUploaded={(p) => {
                    const items = [...content.occasions.items];
                    items[i] = { ...item, image: p };
                    setImg("occasions", { items });
                  }}
                  height="h-24"
                />
              </CardBox>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* ------------------------------- beyond ------------------------------- */}
        <AccordionItem value="beyond" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            بخش ارسال (تهران و اصفهان)
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <Field label="تیتر فارسی">
              <TextIn value={content.beyond.fa} onChange={(v) => set("beyond", { fa: v })} />
            </Field>
            <Field label="تیتر لاتین">
              <TextIn latin value={content.beyond.title} onChange={(v) => set("beyond", { title: v })} />
            </Field>
            <Field label="توضیحات (لاتین)">
              <AreaIn latin rows={3} value={content.beyond.description} onChange={(v) => set("beyond", { description: v })} />
            </Field>
            <Field label="امضای پایین (واردمارک)">
              <TextIn latin value={content.beyond.wordmark} onChange={(v) => set("beyond", { wordmark: v })} />
            </Field>
            <ImageUploadField
              label="تصویر پس‌زمینه"
              value={content.beyond.image}
              onChange={(v) => set("beyond", { image: v })}
              onUploaded={(p) => setImg("beyond", { image: p })}
              height="h-32"
            />
            <Field label="متن جایگزین تصویر">
              <TextIn value={content.beyond.imageAlt} onChange={(v) => set("beyond", { imageAlt: v })} />
            </Field>
          </AccordionContent>
        </AccordionItem>

        {/* ------------------------------ galleries ----------------------------- */}
        <AccordionItem value="galleries" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            شعبه‌های فروشگاه
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Field label="لیبل کوچک">
                <TextIn latin value={content.galleries.label} onChange={(v) => set("galleries", { label: v })} />
              </Field>
              <Field label="تیتر فارسی">
                <TextIn value={content.galleries.title} onChange={(v) => set("galleries", { title: v })} />
              </Field>
            </div>
            {content.galleries.stores.map((store, i) => (
              <CardBox key={i} title={`شعبه ${i + 1}`}>
                <Field label="نام شعبه">
                  <TextIn
                    value={store.name}
                    onChange={(v) => {
                      const stores = [...content.galleries.stores];
                      stores[i] = { ...store, name: v };
                      set("galleries", { stores });
                    }}
                  />
                </Field>
                <ImageUploadField
                  value={store.image}
                  onChange={(v) => {
                    const stores = [...content.galleries.stores];
                    stores[i] = { ...store, image: v };
                    set("galleries", { stores });
                  }}
                  onUploaded={(p) => {
                    const stores = [...content.galleries.stores];
                    stores[i] = { ...store, image: p };
                    setImg("galleries", { stores });
                  }}
                  height="h-24"
                />
              </CardBox>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* ------------------------------ instagram ----------------------------- */}
        <AccordionItem value="instagram" className="rounded-lg border border-border bg-earth/30 px-4">
          <AccordionTrigger className="text-[13px] text-cream hover:no-underline">
            اینستاگرام (ژورنال‌ها)
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Field label="لیبل کوچک">
                <TextIn latin value={content.instagram.label} onChange={(v) => set("instagram", { label: v })} />
              </Field>
              <Field label="تیتر فارسی">
                <TextIn value={content.instagram.title} onChange={(v) => set("instagram", { title: v })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="آیدی پیج">
                <TextIn latin value={content.instagram.handle} onChange={(v) => set("instagram", { handle: v })} />
              </Field>
              <Field label="آدرس لینک">
                <TextIn latin value={content.instagram.url} onChange={(v) => set("instagram", { url: v })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {content.instagram.images.map((image, i) => (
                <ImageUploadField
                  key={i}
                  label={`تصویر ${i + 1}`}
                  value={image}
                  onChange={(v) => {
                    const images = [...content.instagram.images];
                    images[i] = v;
                    set("instagram", { images });
                  }}
                  onUploaded={(p) => {
                    const images = [...content.instagram.images];
                    images[i] = p;
                    setImg("instagram", { images });
                  }}
                  height="h-24"
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* sticky-style save bar */}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-earth-dark/95 px-4 py-3 backdrop-blur">
        <button
          onClick={save}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          ذخیره همه تغییرات
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-md border border-border px-4 text-[12px] text-cream/80 transition-colors hover:bg-earth-light/60 disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          پیش‌فرض
        </button>
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
