"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Flower2,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAccountStore } from "@/lib/account-store";
import { useFlowerTestStore } from "@/lib/flower-test-store";
import {
  COLOR_LABELS,
  FLOWER_IMAGES,
  FLOWER_LABELS,
  PACKAGING_LABELS,
  PALETTE_SWATCHES,
  PERSONALITY_BY_KEY,
  PRESENTATION_LABELS,
  SIZE_LABELS,
  ALL_COLORS,
  ALL_FLOWERS,
  ALL_PACKAGINGS,
  ALL_PRESENTATIONS,
  ALL_SIZES,
  type PersonalityKey,
} from "@/lib/flower-personality";

/** Serialized FlowerProfile row (matches /api/flower-profiles responses). */
interface FlowerProfileT {
  id: string;
  title: string;
  kind: string;
  relationship: string;
  personality: string;
  confidence: number;
  colors: string[];
  flowers: string[];
  dislikedFlowers: string[];
  presentation: string;
  size: string;
  packaging: string;
  updatedAt: string;
}

/** Convert latin digits to Persian digits. */
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const faDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
};

const selectCls =
  "h-9 w-full rounded-md border border-border bg-earth px-2.5 text-[12px] text-cream outline-none transition-colors focus:border-cream/40";

/** «پروفایل گل» — saved taste profiles inside the account drawer. */
export function FlowerProfilesTab() {
  const { toast } = useToast();
  const { setOpen: setAccountOpen, setView: setAccountView } = useAccountStore();
  const setOpenTest = useFlowerTestStore((s) => s.setOpen);

  const [profiles, setProfiles] = useState<FlowerProfileT[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<FlowerProfileT> & { title?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/flower-profiles", { cache: "no-store" });
      const d = await r.json();
      setProfiles(d.profiles ?? []);
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startTest = () => {
    setAccountOpen(false);
    setAccountView("account");
    setOpenTest(true);
  };

  const beginEdit = (p: FlowerProfileT) => {
    setEditingId(p.id);
    setConfirmDelete(null);
    setDraft({
      title: p.title,
      colors: p.colors,
      flowers: p.flowers,
      dislikedFlowers: p.dislikedFlowers,
      presentation: p.presentation,
      size: p.size,
      packaging: p.packaging,
    });
  };

  const saveEdit = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/flower-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: d.error ?? "دوباره تلاش کنید." });
        return;
      }
      toast({ title: "پروفایل به‌روزرسانی شد" });
      setEditingId(null);
      await load();
    } catch {
      toast({ title: "ذخیره نشد", description: "ارتباط با سرور برقرار نشد." });
    } finally {
      setBusy(false);
    }
  };

  const removeProfile = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/flower-profiles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "حذف نشد", description: "دوباره تلاش کنید." });
        return;
      }
      toast({ title: "پروفایل حذف شد" });
      setConfirmDelete(null);
      await load();
    } catch {
      toast({ title: "حذف نشد", description: "ارتباط با سرور برقرار نشد." });
    } finally {
      setBusy(false);
    }
  };

  if (profiles === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[12.5px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        در حال دریافت پروفایل‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startTest}
        className="flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        تست جدید شخصیت‌شناسی گل
      </button>

      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-earth/30 px-4 py-10 text-center">
          <Flower2 className="mx-auto h-8 w-8 text-cream/40" strokeWidth={1.2} aria-hidden="true" />
          <p className="mt-3 text-[13px] text-cream/75">هنوز هیچ پروفایلی نساخته‌اید.</p>
          <p className="mx-auto mt-1.5 max-w-[260px] text-[11.5px] leading-6 text-muted-foreground">
            با تست کوتاه شخصیت‌شناسی گل، سلیقه خودتان یا عزیزانتان را ثبت کنید تا انتخاب گل راحت‌تر شود.
          </p>
        </div>
      ) : (
        profiles.map((p) => {
          const def = PERSONALITY_BY_KEY[p.personality as PersonalityKey];
          const editing = editingId === p.id;
          return (
            <div key={p.id} className="rounded-lg border border-border bg-earth/40">
              {/* card head */}
              <button
                type="button"
                onClick={() => (editing ? setEditingId(null) : beginEdit(p))}
                className="flex w-full items-center gap-3 p-3 text-right"
                aria-expanded={editing}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                  <Image
                    src={def?.image ?? "/images/personality/dreamy-soul.jpg"}
                    alt={def?.fa ?? p.personality}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-cream">{p.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-cream/65">
                    {def?.fa ?? "—"}
                    {p.kind === "OTHER" && p.relationship ? ` · ${p.relationship}` : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    اطمینان {faDigits(String(p.confidence))}٪
                    {faDate(p.updatedAt) && ` · ${faDate(p.updatedAt)}`}
                  </p>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-cream/60 transition-transform", editing && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {/* expanded editor / summary */}
              {editing ? (
                <div className="space-y-3 border-t border-border px-3 py-3">
                  <div>
                    <p className="mb-1.5 text-[11px] text-cream/75">نام پروفایل</p>
                    <input
                      value={draft.title ?? ""}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      maxLength={60}
                      className={selectCls}
                      aria-label="نام پروفایل"
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] text-cream/75">رنگ مورد علاقه</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ALL_COLORS.map((c) => {
                        const active = (draft.colors ?? []).includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                colors: active
                                  ? (draft.colors ?? []).filter((x) => x !== c)
                                  : [...(draft.colors ?? []), c],
                              })
                            }
                            aria-pressed={active}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-2.5 py-2 text-[11px] transition-colors",
                              active ? "border-cream bg-cream/10 text-cream" : "border-border text-cream/70"
                            )}
                          >
                            <span className="flex shrink-0 -space-x-1.5 space-x-reverse">
                              {PALETTE_SWATCHES[c].slice(0, 3).map((col, i) => (
                                <span
                                  key={i}
                                  className="h-4 w-4 rounded-full border border-cream/30"
                                  style={{ backgroundColor: col }}
                                  aria-hidden="true"
                                />
                              ))}
                            </span>
                            <span className="truncate">{COLOR_LABELS[c]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] text-cream/75">گل‌های مورد علاقه</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_FLOWERS.map((f) => {
                        const active = (draft.flowers ?? []).includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                flowers: active
                                  ? (draft.flowers ?? []).filter((x) => x !== f)
                                  : [...(draft.flowers ?? []), f],
                              })
                            }
                            aria-pressed={active}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                              active ? "border-cream bg-cream text-primary-foreground" : "border-border text-cream/70"
                            )}
                          >
                            {FLOWER_LABELS[f]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] text-cream/75">گل‌های نامطلوب</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_FLOWERS.map((f) => {
                        const active = (draft.dislikedFlowers ?? []).includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                dislikedFlowers: active
                                  ? (draft.dislikedFlowers ?? []).filter((x) => x !== f)
                                  : [...(draft.dislikedFlowers ?? []), f],
                              })
                            }
                            aria-pressed={active}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                              active ? "border-red-300/60 bg-red-400/15 text-red-100" : "border-border text-cream/60"
                            )}
                          >
                            بدون {FLOWER_LABELS[f]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <p className="mb-1.5 text-[11px] text-cream/75">ارائه</p>
                      <select
                        value={draft.presentation ?? ""}
                        onChange={(e) => setDraft({ ...draft, presentation: e.target.value })}
                        className={selectCls}
                        aria-label="مدل ارائه"
                      >
                        {ALL_PRESENTATIONS.map((o) => (
                          <option key={o} value={o}>
                            {PRESENTATION_LABELS[o]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] text-cream/75">اندازه</p>
                      <select
                        value={draft.size ?? ""}
                        onChange={(e) => setDraft({ ...draft, size: e.target.value })}
                        className={selectCls}
                        aria-label="اندازه"
                      >
                        {ALL_SIZES.map((o) => (
                          <option key={o} value={o}>
                            {SIZE_LABELS[o]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] text-cream/75">بسته‌بندی</p>
                      <select
                        value={draft.packaging ?? ""}
                        onChange={(e) => setDraft({ ...draft, packaging: e.target.value })}
                        className={selectCls}
                        aria-label="بسته‌بندی"
                      >
                        {ALL_PACKAGINGS.map((o) => (
                          <option key={o} value={o}>
                            {PACKAGING_LABELS[o]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy || !(draft.title ?? "").trim()}
                      onClick={() => saveEdit(p.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 bg-cream py-2.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      ذخیره تغییرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 text-[11.5px] text-cream/75 transition-colors hover:bg-earth-light/60"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {p.colors.slice(0, 1).map((c) => (
                      <span key={c} className="rounded-full bg-cream/10 px-2.5 py-1 text-[10.5px] text-cream/80">
                        {COLOR_LABELS[c as keyof typeof COLOR_LABELS]}
                      </span>
                    ))}
                    {p.flowers.map((f) => (
                      <span key={f} className="rounded-full bg-cream/10 px-2.5 py-1 text-[10.5px] text-cream/80">
                        {FLOWER_LABELS[f as keyof typeof FLOWER_LABELS]}
                      </span>
                    ))}
                    {p.presentation && (
                      <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[10.5px] text-cream/80">
                        {PRESENTATION_LABELS[p.presentation as keyof typeof PRESENTATION_LABELS]}
                      </span>
                    )}
                    {p.size && (
                      <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[10.5px] text-cream/80">
                        {SIZE_LABELS[p.size as keyof typeof SIZE_LABELS]}
                      </span>
                    )}
                    {p.packaging && (
                      <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[10.5px] text-cream/80">
                        {PACKAGING_LABELS[p.packaging as keyof typeof PACKAGING_LABELS]}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(p)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-2 text-[11.5px] text-cream/85 transition-colors hover:bg-earth-light/60"
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      ویرایش
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeProfile(p.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[11.5px] transition-colors disabled:opacity-50",
                        confirmDelete === p.id
                          ? "border-red-300/60 bg-red-400/20 text-red-100"
                          : "border-border text-cream/70 hover:bg-earth-light/60"
                      )}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      {confirmDelete === p.id ? "تأیید حذف؟" : "حذف"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <p className="flex items-start gap-2 pt-1 text-[10.5px] leading-5 text-muted-foreground">
        <Users className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        پروفایل‌ها فقط در حساب خود شما ذخیره می‌شوند و در خریدهای بعدی برای انتخاب دقیق‌تر گل استفاده می‌شوند.
      </p>
    </div>
  );
}
