"use client";

import { useEffect, useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadField } from "@/components/shop/image-upload-field";
import {
  DEFAULT_CUSTOM_FLOWER_CONFIG,
  type CustomFlowerConfig,
  type CustomFlowerGroup,
  type CustomFlowerKind,
  type CustomFlowerOption,
} from "@/lib/custom-flower-config";
import { cn } from "@/lib/utils";

const inputCls =
  "border-border bg-earth text-cream placeholder:text-muted-foreground/60";

const KIND_LABELS: Record<CustomFlowerKind, string> = {
  color: "رنگی (دایره رنگ)",
  chip: "متنی (چیپ)",
  image: "تصویری (کارت عکس‌دار)",
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

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

/* -------------------------------- main tab -------------------------------- */

export function CustomFlowerTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<CustomFlowerConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/custom-flower", { cache: "no-store" });
        const d = await r.json();
        if (r.ok && d.config) {
          setConfig(d.config as CustomFlowerConfig);
        } else {
          setConfig(DEFAULT_CUSTOM_FLOWER_CONFIG);
          if (!r.ok)
            toast({ title: "دریافت تنظیمات ممکن نیست", description: d.error ?? "" });
        }
      } catch {
        setConfig(DEFAULT_CUSTOM_FLOWER_CONFIG);
      }
    })();
  }, [toast]);

  if (!config)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-cream/70" />
      </div>
    );

  /* ------------------------------ mutations ------------------------------ */

  const setGroups = (fn: (g: CustomFlowerGroup[]) => CustomFlowerGroup[]) =>
    setConfig((c) => (c ? { groups: fn([...c.groups]) } : c));

  const updateGroup = (gi: number, patch: Partial<CustomFlowerGroup>) =>
    setGroups((gs) =>
      gs.map((g, i) => (i === gi ? { ...g, ...patch } : g))
    );

  const updateOption = (gi: number, oi: number, patch: Partial<CustomFlowerOption>) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === oi ? { ...o, ...patch } : o
              ),
            }
          : g
      )
    );

  const addOption = (gi: number) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi
          ? { ...g, options: [...g.options, { name: "گزینه جدید" }] }
          : g
      )
    );

  const removeOption = (gi: number, oi: number) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi && g.options.length > 1
          ? { ...g, options: g.options.filter((_, j) => j !== oi) }
          : g
      )
    );

  const addGroup = () =>
    setGroups((gs) => [
      ...gs,
      {
        key: `group${Date.now().toString(36)}`,
        label: "بخش جدید",
        caption: "NEW SECTION",
        kind: "chip",
        options: [{ name: "گزینه جدید" }],
      },
    ]);

  const removeGroup = (gi: number) =>
    setGroups((gs) => gs.filter((_, i) => i !== gi));

  /* -------------------------------- save -------------------------------- */

  const save = async (payload: CustomFlowerConfig, successMsg: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/custom-flower", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({
          title: "ذخیره نشد",
          description: `${d.error ?? ""} ${d.detail ?? ""}`.trim() || "دوباره تلاش کنید.",
        });
        return;
      }
      setConfig(d.config as CustomFlowerConfig);
      toast({ title: successMsg });
    } catch {
      toast({ title: "ذخیره نشد", description: "خطای شبکه — دوباره تلاش کنید." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-earth/40 px-3 py-2.5 text-[11px] font-light leading-5 text-muted-foreground">
        بخش‌های صفحه‌ی «گل به سلیقه شما» را همین‌جا ویرایش کنید: نام بخش، نوع
        نمایش، گزینه‌ها و عکس هر گل. پس از ذخیره، صفحه‌ی فروشگاه بلافاصله به‌روز
        می‌شود.
      </p>

      <Accordion
        type="multiple"
        defaultValue={[config.groups[0]?.key ?? ""]}
        className="flex flex-col gap-2"
      >
        {config.groups.map((g, gi) => (
          <AccordionItem
            key={g.key}
            value={g.key}
            className="rounded-lg border border-border bg-earth/40 px-3.5"
          >
            <AccordionTrigger className="gap-2 py-3 text-[12.5px] text-cream hover:no-underline">
              <span className="flex items-center gap-2">
                <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">
                  {g.kind}
                </span>
                {g.label}
                <span className="text-[10px] font-light text-muted-foreground">
                  ({g.options.length} گزینه)
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {/* group settings */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="عنوان بخش">
                  <Input
                    value={g.label}
                    onChange={(e) => updateGroup(gi, { label: e.target.value })}
                    className={cn(inputCls, "text-[12px]")}
                  />
                </Field>
                <Field label="زیرنویس لاتین">
                  <Input
                    value={g.caption}
                    onChange={(e) => updateGroup(gi, { caption: e.target.value })}
                    dir="ltr"
                    className={cn(inputCls, "font-latin text-right text-[12px]")}
                  />
                </Field>
                <Field label="نوع نمایش">
                  <Select
                    value={g.kind}
                    onValueChange={(v) =>
                      updateGroup(gi, { kind: v as CustomFlowerKind })
                    }
                  >
                    <SelectTrigger className={cn(inputCls, "text-[12px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_LABELS) as CustomFlowerKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* options */}
              <div className="mt-4 flex flex-col gap-2.5">
                {g.options.map((o, oi) => (
                  <div
                    key={`${g.key}-opt-${oi}`}
                    className="rounded-md border border-border bg-earth/60 p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={o.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          className={cn(inputCls, "text-[12px]")}
                          placeholder="نام گزینه"
                          aria-label="نام گزینه"
                        />

                        {g.kind === "color" && (
                          <div className="flex items-center gap-2">
                            {HEX_RE.test(o.hex ?? "") && (
                              <input
                                type="color"
                                value={o.hex}
                                onChange={(e) => updateOption(gi, oi, { hex: e.target.value })}
                                aria-label="انتخاب رنگ"
                                className="h-8 w-10 shrink-0 cursor-pointer border border-border bg-earth p-0.5"
                              />
                            )}
                            <Input
                              value={o.hex ?? ""}
                              onChange={(e) => updateOption(gi, oi, { hex: e.target.value })}
                              dir="ltr"
                              className={cn(inputCls, "font-latin text-right text-[11px]")}
                              placeholder="#rrggbb یا گرادینت css"
                            />
                          </div>
                        )}

                        {(g.kind === "chip" || g.kind === "image") && (
                          <Input
                            value={o.sub ?? ""}
                            onChange={(e) => updateOption(gi, oi, { sub: e.target.value })}
                            className={cn(inputCls, "text-[11px]")}
                            placeholder="توضیح کوتاه (اختیاری)"
                          />
                        )}

                        {g.kind === "image" && (
                          <ImageUploadField
                            value={o.image ?? ""}
                            onChange={(v) => updateOption(gi, oi, { image: v })}
                            label="عکس گزینه"
                            height="h-24"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(gi, oi)}
                        disabled={g.options.length <= 1}
                        aria-label={`حذف گزینه ${o.name}`}
                        className="mt-1 shrink-0 rounded-sm p-2 text-red-300/70 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(gi)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2.5 text-[11.5px] text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  افزودن گزینه
                </button>
              </div>

              {/* delete group */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-3 flex items-center gap-1.5 text-[11px] text-red-300/70 transition-colors hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    حذف این بخش
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف بخش «{g.label}»؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      این بخش و گزینه‌هایش از صفحه‌ی «گل به سلیقه شما» حذف می‌شود.
                      تا وقتی «ذخیره» نزنید تغییر در سایت اعمال نمی‌شود.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeGroup(gi)}>
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <button
        type="button"
        onClick={addGroup}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-3 text-[12px] text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        افزودن بخش جدید
      </button>

      {/* actions */}
      <div className="flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row-reverse">
        <button
          onClick={() => save(config, "تغییرات ذخیره شد")}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          ذخیره تغییرات
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={busy}
              className="flex items-center justify-center gap-2 border border-border px-4 py-3 text-[12px] text-cream/75 transition-colors hover:text-cream disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              بازگردانی پیش‌فرض
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>بازگردانی به حالت پیش‌فرض؟</AlertDialogTitle>
              <AlertDialogDescription>
                همه‌ی بخش‌ها و گزینه‌ها به تنظیمات اولیه برمی‌گردند. با زدن
                «بازگردانی»، تغییر فقط در فرم اعمال می‌شود؛ برای اعمال در سایت
                باید «ذخیره تغییرات» را بزنید.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfig(DEFAULT_CUSTOM_FLOWER_CONFIG);
                  toast({ title: "فرم به حالت پیش‌فرض برگشت", description: "برای اعمال، ذخیره کنید." });
                }}
              >
                بازگردانی
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
