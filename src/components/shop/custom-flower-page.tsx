"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Flower2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomFlowerStore } from "@/lib/custom-flower-store";
import {
  DEFAULT_CUSTOM_FLOWER_CONFIG,
  type CustomFlowerGroup,
  type CustomFlowerOption,
} from "@/lib/custom-flower-config";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_URL = "https://wa.me/989127385527";

/** Shipped defaults used when no server config is available. */
const DEFAULT_GROUPS_FALLBACK = DEFAULT_CUSTOM_FLOWER_CONFIG.groups;

/** Convert latin digits to Persian digits. */
const faDigits = (s: string) =>
  s.replace(/\\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export function CustomFlowerPage({
  initialGroups,
}: {
  initialGroups?: CustomFlowerGroup[];
}) {
  const setOpen = useCustomFlowerStore((s) => s.setOpen);
  const { toast } = useToast();
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Admin-editable groups — server-prefetched config renders instantly;
  // falls back to the shipped defaults when unavailable.
  const [groups, setGroups] = useState<CustomFlowerGroup[]>(
    initialGroups?.length ? initialGroups : DEFAULT_GROUPS_FALLBACK
  );

  useEffect(() => {
    if (initialGroups?.length) return;
    fetch("/api/custom-flower", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.config?.groups) && d.config.groups.length > 0) {
          setGroups(d.config.groups as CustomFlowerGroup[]);
        }
      })
      .catch(() => undefined);
  }, [initialGroups]);

  // Lock the background page + close on Escape while the page is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [setOpen]);

  const pickedCount = useMemo(
    () => groups.filter((g) => selected[g.key]).length,
    [groups, selected]
  );

  const toggle = (key: string, name: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key] === name) delete next[key];
      else next[key] = name;
      return next;
    });

  const reset = () => setSelected({});

  const waHref = useMemo(() => {
    const lines = groups
      .filter((g) => selected[g.key])
      .map((g) => `• ${g.label}: ${selected[g.key]}`);
    const text = `سلام! می‌خواهم «گل به سلیقه‌ی خودم» را سفارش دهم:\n${lines.join("\n")}`;
    return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
  }, [groups, selected]);

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="گل به سلیقه شما — ساخت دسته‌گل دلخواه"
      className="fixed inset-0 z-[70] overflow-y-auto bg-background animate-in fade-in duration-300"
    >
      <div className="flex min-h-full flex-col">
        {/* Top bar — back button + brand */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 md:px-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-[13px] text-cream/85 transition-opacity hover:opacity-70"
              aria-label="بازگشت به صفحه اصلی"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              بازگشت
            </button>
            <p className="font-latin text-[13px] text-cream/70">
              <span className="font-semibold">Golestane</span>{" "}
              <span className="font-light">Hafez</span>
            </p>
          </div>
        </div>

        {/* Page body */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-32 md:px-8">
          {/* Intro */}
          <div className="pt-12 pb-10 text-center md:pt-16">
            <Flower2
              className="mx-auto h-9 w-9 text-cream/60"
              strokeWidth={1}
              aria-hidden="true"
            />
            <p className="gh-label mt-5">CUSTOM ARRANGEMENT</p>
            <h1 className="mt-4 text-3xl font-light text-cream md:text-4xl">
              گل به سلیقه شما
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[13px] leading-7 text-muted-foreground">
              در هر بخش، گزینه‌ی دلخواه خود را انتخاب کنید تا دسته‌گل یا باکس
              دقیقاً همان‌طور که می‌خواهید ساخته شود. هر بخش می‌تواند خالی بماند
              و بعداً با مشاوره‌ی گل‌فروش ما تکمیل شود.
            </p>
            <p className="mt-6 text-xs text-cream/75" aria-live="polite">
              {faDigits(String(pickedCount))} از{" "}
              {faDigits(String(groups.length))} مورد انتخاب شده
            </p>
          </div>

          {/* Option groups */}
          <div className="flex flex-col gap-6">
            {groups.map((g, i) => {
              const picked = selected[g.key];
              return (
                <section
                  key={g.key}
                  aria-label={g.label}
                  className="border border-border bg-earth/40 p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="gh-label text-cream/35">
                        {faDigits(String(i + 1).padStart(2, "0"))}
                      </span>
                      <h2 className="text-[15px] text-cream">{g.label}</h2>
                    </div>
                    {picked ? (
                      <span className="flex items-center gap-1.5 text-xs text-cream">
                        <Check
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        {picked}
                      </span>
                    ) : (
                      <span className="gh-label text-[10px] text-cream/30">
                        {g.caption}
                      </span>
                    )}
                  </div>

                  {g.kind === "color" ? (
                    <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-4 md:justify-start">
                      {g.options.map((o) => (
                        <ColorSwatch
                          key={o.name}
                          option={o}
                          groupLabel={g.label}
                          picked={picked === o.name}
                          onToggle={() => toggle(g.key, o.name)}
                        />
                      ))}
                    </div>
                  ) : g.kind === "image" ? (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {g.options.map((o) => (
                        <ImageCard
                          key={o.name}
                          option={o}
                          groupLabel={g.label}
                          picked={picked === o.name}
                          onToggle={() => toggle(g.key, o.name)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {g.options.map((o) => (
                        <ChipCard
                          key={o.name}
                          option={o}
                          groupLabel={g.label}
                          picked={picked === o.name}
                          onToggle={() => toggle(g.key, o.name)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <p className="mt-8 text-center text-[11px] leading-6 text-muted-foreground/80">
            پس از ثبت سفارش، گل‌فروش ما برای هماهنگی جزئیات، قیمت نهایی و زمان
            ارسال با شما تماس می‌گیرد. ارسال فقط در تهران و اصفهان.
          </p>
        </main>

        {/* Sticky bottom bar — summary + order CTA */}
        <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-4 md:px-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 flex-1 truncate text-xs text-cream/70">
              {pickedCount === 0
                ? "هنوز موردی انتخاب نشده است — برای شروع، از بخش‌های بالا انتخاب کنید."
                : `${faDigits(String(pickedCount))} از ${faDigits(
                    String(groups.length)
                  )} مورد انتخاب شده — سفارش شما از طریق واتساپ ثبت می‌شود.`}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              {pickedCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-cream/60 transition-colors hover:text-cream"
                  aria-label="پاک کردن همه انتخاب‌ها"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                  پاک کردن
                </button>
              )}
              {pickedCount > 0 ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cream px-6 py-3 text-center text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  ثبت سفارش در واتساپ
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: "انتخاب ناقص",
                      description:
                        "برای ثبت سفارش، حداقل یکی از گزینه‌ها را انتخاب کنید.",
                    })
                  }
                  className="bg-cream/25 px-6 py-3 text-center text-[13px] font-medium text-cream/70"
                >
                  ثبت سفارش در واتساپ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ option cards ------------------------------ */

function ColorSwatch({
  option,
  groupLabel,
  picked,
  onToggle,
}: {
  option: CustomFlowerOption;
  groupLabel: string;
  picked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      aria-label={`${groupLabel} — ${option.name}`}
      className="group flex w-14 flex-col items-center gap-2"
    >
      <span
        style={{ background: option.hex }}
        className={cn(
          "block h-10 w-10 rounded-full border transition-all duration-200",
          picked
            ? "border-cream ring-2 ring-cream/80 ring-offset-2 ring-offset-background group-hover:scale-105"
            : "border-border group-hover:border-cream/50 group-hover:scale-105"
        )}
      />
      <span
        className={cn(
          "text-[11px] transition-colors",
          picked ? "text-cream" : "text-cream/55 group-hover:text-cream/80"
        )}
      >
        {option.name}
      </span>
    </button>
  );
}

function ChipCard({
  option,
  groupLabel,
  picked,
  onToggle,
}: {
  option: CustomFlowerOption;
  groupLabel: string;
  picked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      aria-label={`${groupLabel} — ${option.name}`}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 border px-3 py-3 text-center transition-colors duration-200",
        picked
          ? "border-cream bg-cream/10 text-cream"
          : "border-border text-cream/70 hover:border-cream/40 hover:text-cream"
      )}
    >
      <span className="text-[13px]">{option.name}</span>
      {option.sub && (
        <span
          className={cn(
            "text-[10px]",
            picked ? "text-cream/70" : "text-cream/45"
          )}
        >
          {option.sub}
        </span>
      )}
    </button>
  );
}

function ImageCard({
  option,
  groupLabel,
  picked,
  onToggle,
}: {
  option: CustomFlowerOption;
  groupLabel: string;
  picked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      aria-label={`${groupLabel} — ${option.name}`}
      className={cn(
        "group flex flex-col overflow-hidden border text-center transition-colors duration-200",
        picked
          ? "border-cream bg-cream/10"
          : "border-border hover:border-cream/40"
      )}
    >
      <span className="relative block aspect-square w-full overflow-hidden bg-earth">
        {option.image ? (
          <Image
            src={option.image}
            alt={option.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Flower2
              className="h-8 w-8 text-cream/40"
              strokeWidth={1}
              aria-hidden="true"
            />
          </span>
        )}
        {picked && (
          <span className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-cream text-primary-foreground">
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="flex flex-col items-center gap-0.5 py-2.5">
        <span
          className={cn(
            "text-[12.5px] transition-colors",
            picked ? "text-cream" : "text-cream/75"
          )}
        >
          {option.name}
        </span>
        {option.sub && (
          <span
            className={cn(
              "text-[10px]",
              picked ? "text-cream/70" : "text-cream/45"
            )}
          >
            {option.sub}
          </span>
        )}
      </span>
    </button>
  );
}
