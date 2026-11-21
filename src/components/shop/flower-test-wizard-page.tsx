"use client";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Flower2,
  Gift,
  Heart,
  Loader2,
  LogIn,
  Package,
  Palette,
  Pencil,
  RotateCcw,
  Ruler,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAccountStore } from "@/lib/account-store";
import { useFlowerTestStore } from "@/lib/flower-test-store";
import {
  AGE_RANGES,
  COLOR_LABELS,
  FLOWER_LABELS,
  GENDER_OPTIONS,
  KNOWLEDGE_OPTIONS,
  PALETTE_SWATCHES,
  PACKAGING_LABELS,
  PAST_PURCHASE_OPTIONS,
  PERSONALITY_BY_KEY,
  PRESENTATION_LABELS,
  QUESTION_BANKS,
  RELATIONSHIPS,
  SIZE_LABELS,
  ALL_COLORS,
  ALL_FLOWERS,
  ALL_PRESENTATIONS,
  ALL_SIZES,
  ALL_PACKAGINGS,
  analyzeAnswers,
  applyOverrides,
  type Answer,
  type ColorKey,
  type FlowerKey,
  type PackagingKey,
  type PresentationKey,
  type Question,
  type RecipientMeta,
  type SizeKey,
  type TasteOverrides,
  type TestKind,
} from "@/lib/flower-personality";

/** Convert latin digits to Persian digits. */
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

type Step = "intro" | "recipient" | "question" | "analyzing" | "result" | "adjust" | "save-title" | "saved";

const inputCls =
  "h-10 w-full rounded-md border border-border bg-earth px-3 text-[13px] text-cream outline-none transition-colors focus:border-cream/40";
/* ------------------------------------------------------------------ */
/* Wizard page — code-split: fetched only when the test opens          */
/* ------------------------------------------------------------------ */

export function WizardPage() {
  const setOpen = useFlowerTestStore((s) => s.setOpen);
  const { user, setOpen: setAccountOpen, setView: setAccountView } = useAccountStore();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [kind, setKind] = useState<TestKind>("SELF");
  const [meta, setMeta] = useState<RecipientMeta>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [qIndex, setQIndex] = useState(0);
  const [override, setOverride] = useState<TasteOverrides>({});
  const [editedProfile, setEditedProfile] = useState<ReturnType<typeof analyzeAnswers> | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = QUESTION_BANKS[kind];
  const question: Question | null = questions[qIndex] ?? null;

  const profile = useMemo(
    () =>
      editedProfile ??
      (step === "result" || step === "adjust" || step === "save-title"
        ? analyzeAnswers(kind, toAnswerList(answers), meta)
        : null),
    [step, editedProfile, kind, answers, meta]
  );

  // Lock the background page + close on Escape.
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [setOpen]);

  const resetAll = useCallback(() => {
    setKind("SELF");
    setMeta({});
    setAnswers({});
    setQIndex(0);
    setOverride({});
    setEditedProfile(null);
    setTitle("");
    setStep("intro");
  }, []);

  const chooseKind = (k: TestKind) => {
    setKind(k);
    setOverride({});
    setEditedProfile(null);
    if (k === "SELF") {
      setTitle("سلیقه شخصی من");
      setStep("question");
      setQIndex(0);
    } else {
      setTitle("");
      setStep("recipient");
    }
  };

  const pick = (optionKey: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionKey }));
    const isLast = qIndex === questions.length - 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isLast) {
        setStep("analyzing");
        timerRef.current = setTimeout(() => setStep("result"), 1400);
      } else {
        setQIndex((i) => i + 1);
      }
    }, 280);
  };

  const goBack = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (step === "question") {
      if (qIndex === 0) setStep(kind === "OTHER" ? "recipient" : "intro");
      else setQIndex((i) => i - 1);
    } else if (step === "recipient") {
      setStep("intro");
    } else if (step === "result" || step === "adjust") {
      setStep("question");
      setQIndex(questions.length - 1);
    }
  };

  const topLabel = (): string => {
    if (step === "intro") return "شخصیت‌شناسی گل";
    if (step === "recipient") return "مشخصات دریافت‌کننده";
    if (step === "question") return `سؤال ${faDigits(String(qIndex + 1))} از ${faDigits("10")}`;
    if (step === "analyzing") return "در حال تحلیل سلیقه";
    if (step === "result" || step === "adjust") return "نتیجه تست";
    if (step === "save-title") return "ذخیره پروفایل سلیقه";
    return "پروفایل ذخیره شد";
  };

  const saveProfile = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/flower-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim() || (kind === "SELF" ? "سلیقه شخصی من" : meta.relationship || ""),
          answers: toAnswerList(answers),
          ...meta,
          overrides: override,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast({
          title: "برای ذخیره، وارد حساب کاربری شوید",
          description: "پروفایل‌های سلیقه فقط در حساب خود شما ذخیره می‌شوند.",
        });
        setSaving(false);
        return;
      }
      if (!res.ok) {
        toast({ title: "ذخیره نشد", description: d.error ?? "دوباره تلاش کنید." });
        setSaving(false);
        return;
      }
      setStep("saved");
      toast({ title: "پروفایل سلیقه ذخیره شد", description: "در خریدهای بعدی می‌توانید از آن استفاده کنید." });
    } catch {
      toast({ title: "ذخیره نشد", description: "ارتباط با سرور برقرار نشد." });
    } finally {
      setSaving(false);
    }
  };

  const openAccount = () => {
    setOpen(false);
    setAccountView("account");
    setAccountOpen(true);
  };

  const goLogin = () => {
    setOpen(false);
    setAccountView("account");
    setAccountOpen(true);
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="شخصیت‌شناسی گل — تست سلیقه"
      className="fixed inset-0 z-[70] overflow-y-auto bg-background animate-in fade-in duration-300"
    >
      <div className="flex min-h-full flex-col">
        {/* top bar */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-3">
              {(step === "question" ||
                step === "recipient" ||
                step === "result" ||
                step === "adjust") && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-[13px] text-cream/85 transition-opacity hover:opacity-70"
                  aria-label="مرحله قبل"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  قبلی
                </button>
              )}
              <p className="text-[13px] text-cream/60">{topLabel()}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="hidden font-latin text-[13px] text-cream/70 sm:block">
                <span className="font-semibold">Flower</span>{" "}
                <span className="font-light">Personality</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن تست"
                className="rounded-full border border-border p-2 text-cream/80 transition-colors hover:bg-earth-light/60"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* progress */}
          {(step === "question" || step === "analyzing" || step === "recipient") && (
            <div className="mx-auto max-w-4xl px-5 pb-3 md:px-8">
              <div className="h-1 w-full overflow-hidden rounded-full bg-earth-light">
                <div
                  className="h-full rounded-full bg-cream transition-all duration-500"
                  style={{
                    width:
                      step === "recipient"
                        ? "4%"
                        : `${Math.max(4, Math.round(((step === "analyzing" ? questions.length : qIndex + 1) / questions.length) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* body */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 md:px-8">
          {step === "intro" && <Intro kind={kind} onChoose={chooseKind} />}
          {step === "recipient" && <RecipientForm meta={meta} setMeta={setMeta} onNext={() => { setQIndex(0); setStep("question"); }} />}
          {step === "question" && question && (
            <QuestionView
              question={question}
              selected={answers[question.id] ?? null}
              onSelect={pick}
              index={qIndex}
              total={questions.length}
            />
          )}
          {step === "analyzing" && <Analyzing />}
          {step === "result" && profile && (
            <ResultView
              kind={kind}
              meta={meta}
              profile={profile}
              confidence={profile.confidence}
              onConfirm={() => {
                if (!title.trim()) {
                  setTitle(kind === "SELF" ? "سلیقه شخصی من" : meta.relationship || "شخص دیگر");
                }
                setStep("save-title");
              }}
              onAdjust={() => setStep("adjust")}
              onRetake={resetAll}
            />
          )}
          {step === "adjust" && profile && (
            <AdjustPanel
              profile={profile}
              override={override}
              setOverride={setOverride}
              onApply={() => {
                setEditedProfile(applyOverrides(analyzeAnswers(kind, toAnswerList(answers), meta), override));
                setStep("result");
                toast({ title: "اصلاحات اعمال شد", description: "پروفایل نهایی با سلیقه اصلاح‌شده ذخیره می‌شود." });
              }}
            />
          )}
          {step === "save-title" && profile && (
            <SavePanel
              kind={kind}
              meta={meta}
              title={title}
              setTitle={setTitle}
              saving={saving}
              loggedIn={Boolean(user)}
              onLogin={goLogin}
              onSave={saveProfile}
            />
          )}
          {step === "saved" && (
            <SavedScreen
              kind={kind}
              relationship={meta.relationship}
              onNewTest={resetAll}
              onOpenProfiles={() => {
                setOpen(false);
                setAccountView("account");
                setAccountOpen(true);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function toAnswerList(answers: Record<number, string>): Answer[] {
  return Object.entries(answers).map(([q, a]) => ({ q: Number(q), a }));
}

/* ------------------------------- intro ------------------------------- */

function Intro({ onChoose }: { kind: TestKind; onChoose: (k: TestKind) => void }) {
  return (
    <div className="pb-10">
      <p className="gh-label text-center text-[11px] !tracking-[0.3em] text-cream/60">
        FLOWER PERSONALITY — GOLESTANE HAFEZ
      </p>
      <h1 className="mt-4 text-center text-[22px] font-medium leading-relaxed text-cream md:text-[28px]">
        قبل از انتخاب گل، اجازه بدهید سلیقه شما را بشناسیم.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[13.5px] leading-8 text-cream/75 md:text-[14px]">
        هر فرد دنیای زیبایی‌شناختی مخصوص به خودش را دارد. ما در گلستان حافظ معتقدیم انتخاب گل باید
        متناسب با روحیه، سلیقه و شخصیت دریافت‌کننده آن باشد. به چند سؤال کوتاه پاسخ دهید تا بتوانیم
        انتخابی نزدیک‌تر به سلیقه شما یا شخص موردنظرتان پیشنهاد کنیم.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <ChoiceCard
          image="/images/personality/peony.jpg"
          title="می‌خواهم برای خودم گل انتخاب کنم."
          subtitle="MY FLOWER PERSONALITY"
          onClick={() => onChoose("SELF")}
        />
        <ChoiceCard
          image="/images/personality/wildflower.jpg"
          title="می‌خواهم برای شخص دیگری گل انتخاب کنم."
          subtitle="SOMEONE'S FLOWER PERSONALITY"
          onClick={() => onChoose("OTHER")}
        />
      </div>

      <p className="mt-8 text-center text-[11.5px] leading-6 text-muted-foreground">
        این تست یک ابزار سلیقه‌ای و بازاریابی است؛ نه یک تست رسمی MBTI یا ابزار تشخیص روان‌شناختی.
        نتایج فقط در حساب کاربری خود شما ذخیره می‌شود.
      </p>
    </div>
  );
}

function ChoiceCard({
  image,
  title,
  subtitle,
  onClick,
}: {
  image: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border text-right transition-all duration-300 hover:border-cream/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
    >
      <div className="relative h-44 w-full overflow-hidden md:h-52">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 460px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-earth-dark/90 via-earth-dark/30 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-latin text-[10.5px] tracking-[0.25em] text-cream/60">{subtitle}</p>
        <p className="mt-1.5 text-[16px] font-medium text-cream md:text-[17px]">{title}</p>
        <span className="mt-3 inline-flex items-center gap-2 bg-cream px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
          شروع تست
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

/* ----------------------------- recipient ----------------------------- */

function RecipientForm({
  meta,
  setMeta,
  onNext,
}: {
  meta: RecipientMeta;
  setMeta: (m: RecipientMeta) => void;
  onNext: () => void;
}) {
  const canNext = Boolean(meta.relationship) && Boolean(meta.knowledge) && Boolean(meta.pastPurchase);

  return (
    <div className="pb-10">
      <h2 className="text-center text-[20px] font-medium text-cream md:text-[24px]">
        گل را برای چه کسی می‌خواهید؟
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-[13px] leading-7 text-cream/70">
        در این تست باید بر اساس شناختی که از فرد موردنظر دارید پاسخ دهید؛ نه بر اساس سلیقه شخصی خودتان.
      </p>

      {/* relationship chips */}
      <div className="mt-8">
        <p className="mb-3 text-[12.5px] text-cream/80">۱. نسبت شما با دریافت‌کننده</p>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIPS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMeta({ ...meta, relationship: r })}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px] transition-colors",
                meta.relationship === r
                  ? "border-cream bg-cream font-medium text-primary-foreground"
                  : "border-border bg-earth/40 text-cream/85 hover:border-cream/40"
              )}
              aria-pressed={meta.relationship === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* gender + age (optional) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[12.5px] text-cream/80">۲. جنسیت دریافت‌کننده (اختیاری)</p>
          <select
            value={meta.gender ?? ""}
            onChange={(e) => setMeta({ ...meta, gender: e.target.value })}
            className={inputCls}
            aria-label="جنسیت دریافت‌کننده"
          >
            <option value="">— انتخاب نکنم —</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 text-[12.5px] text-cream/80">۳. سن تقریبی دریافت‌کننده (اختیاری)</p>
          <select
            value={meta.ageRange ?? ""}
            onChange={(e) => setMeta({ ...meta, ageRange: e.target.value })}
            className={inputCls}
            aria-label="سن تقریبی دریافت‌کننده"
          >
            <option value="">— انتخاب نکنم —</option>
            {AGE_RANGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* knowledge */}
      <div className="mt-6">
        <p className="mb-3 text-[12.5px] text-cream/80">۴. میزان شناخت شما از سلیقه او</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {KNOWLEDGE_OPTIONS.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setMeta({ ...meta, knowledge: k.key })}
              className={cn(
                "rounded-lg border px-4 py-3 text-[12.5px] transition-colors",
                meta.knowledge === k.key
                  ? "border-cream bg-cream font-medium text-primary-foreground"
                  : "border-border bg-earth/40 text-cream/85 hover:border-cream/40"
              )}
              aria-pressed={meta.knowledge === k.key}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* past purchase */}
      <div className="mt-6">
        <p className="mb-3 text-[12.5px] text-cream/80">۵. آیا تاکنون برای این شخص گل خریده‌اید؟</p>
        <div className="grid gap-2">
          {PAST_PURCHASE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setMeta({ ...meta, pastPurchase: o.key })}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 text-right text-[12.5px] transition-colors",
                meta.pastPurchase === o.key
                  ? "border-cream bg-cream/95 font-medium text-primary-foreground"
                  : "border-border bg-earth/40 text-cream/85 hover:border-cream/40"
              )}
              aria-pressed={meta.pastPurchase === o.key}
            >
              {o.label}
              {meta.pastPurchase === o.key && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canNext}
        onClick={onNext}
        className="mt-8 flex w-full items-center justify-center gap-2 bg-cream py-3.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        شروع سؤال‌ها
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      {!canNext && (
        <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
          برای ادامه، نسبت، میزان شناخت و سابقه خرید را انتخاب کنید.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ question ------------------------------ */

function QuestionView({
  question,
  selected,
  onSelect,
  index,
  total,
}: {
  question: Question;
  selected: string | null;
  onSelect: (key: string) => void;
  index: number;
  total: number;
}) {
  const hasImages = question.options.some((o) => o.image);
  const hasPalettes = question.options.some((o) => o.palette);

  return (
    <div className="pb-12">
      <p className="gh-label text-[10.5px] !tracking-[0.25em] text-cream/55">
        {question.kind === "direct" ? "سؤال مستقیم سلیقه" : "سؤال رفتاری"} — {faDigits(String(index + 1))}/{faDigits(String(total))}
      </p>
      <h2 className="mt-3 text-[19px] font-medium leading-relaxed text-cream md:text-[23px]">
        {question.text}
      </h2>

      {/* flower image cards */}
      {hasImages ? (
        <div className={cn("mt-7 grid gap-3", question.options.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
          {question.options.map((o) =>
            o.unknown ? (
              <UnknownCard key={o.key} option={o} selected={selected === o.key} onSelect={onSelect} />
            ) : (
              <button
                key={o.key}
                type="button"
                onClick={() => onSelect(o.key)}
                aria-pressed={selected === o.key}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-right transition-all duration-300",
                  selected === o.key
                    ? "border-cream shadow-[0_0_0_1px_rgba(239,229,214,0.5)]"
                    : "border-border hover:border-cream/40"
                )}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-earth">
                  <Image
                    src={o.image!}
                    alt={o.label}
                    fill
                    sizes="(max-width: 640px) 50vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-earth-dark/85 via-transparent to-transparent" />
                  {selected === o.key && (
                    <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-cream text-primary-foreground">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p className="absolute inset-x-0 bottom-0 px-3 pb-3 text-[13px] font-medium text-cream">
                  {o.label}
                </p>
              </button>
            )
          )}
        </div>
      ) : hasPalettes ? (
        /* palette cards */
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {question.options.map((o) =>
            o.unknown ? (
              <UnknownCard key={o.key} option={o} selected={selected === o.key} onSelect={onSelect} wide />
            ) : (
              <button
                key={o.key}
                type="button"
                onClick={() => onSelect(o.key)}
                aria-pressed={selected === o.key}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 text-right transition-all duration-300",
                  selected === o.key
                    ? "border-cream bg-cream/10"
                    : "border-border bg-earth/40 hover:border-cream/40"
                )}
              >
                <span className="flex shrink-0 -space-x-2 space-x-reverse">
                  {(PALETTE_SWATCHES[o.palette!] ?? []).map((c, i) => (
                    <span
                      key={i}
                      className="h-9 w-9 rounded-full border border-cream/30 shadow-md"
                      style={{ backgroundColor: c }}
                      aria-hidden="true"
                    />
                  ))}
                </span>
                <span className="flex-1 text-[13.5px] text-cream">{o.label}</span>
                {selected === o.key && <Check className="h-5 w-5 shrink-0 text-cream" aria-hidden="true" />}
              </button>
            )
          )}
        </div>
      ) : (
        /* plain option cards */
        <div className="mt-7 grid gap-2.5">
          {question.options.map((o) =>
            o.unknown ? (
              <UnknownCard key={o.key} option={o} selected={selected === o.key} onSelect={onSelect} wide />
            ) : (
              <button
                key={o.key}
                type="button"
                onClick={() => onSelect(o.key)}
                aria-pressed={selected === o.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3.5 text-right transition-all duration-200",
                  selected === o.key
                    ? "border-cream bg-cream/10"
                    : "border-border bg-earth/40 hover:border-cream/40 hover:bg-earth"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-latin text-[12px]",
                    selected === o.key ? "border-cream bg-cream text-primary-foreground" : "border-cream/40 text-cream/70"
                  )}
                >
                  {o.key}
                </span>
                <span className="flex-1 text-[13.5px] leading-6 text-cream">{o.label}</span>
                {selected === o.key && <Check className="h-4 w-4 shrink-0 text-cream" aria-hidden="true" />}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function UnknownCard({
  option,
  selected,
  onSelect,
  wide,
}: {
  option: { key: string; label: string };
  selected: boolean;
  onSelect: (key: string) => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.key)}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-[12.5px] transition-colors",
        wide && "col-span-full",
        selected
          ? "border-cream/70 bg-cream/10 text-cream"
          : "border-border text-cream/60 hover:border-cream/40 hover:text-cream/80"
      )}
    >
      <span className="font-latin">{option.key}.</span>
      {option.label}
    </button>
  );
}

/* ------------------------------ analyzing ------------------------------ */

function Analyzing() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative">
        <Flower2 className="h-12 w-12 animate-pulse text-cream/70" strokeWidth={1} aria-hidden="true" />
        <Sparkles className="absolute -left-3 -top-1 h-5 w-5 animate-bounce text-cream/50" strokeWidth={1.2} aria-hidden="true" />
      </div>
      <p className="mt-6 text-[16px] font-medium text-cream">در حال تحلیل سلیقه...</p>
      <p className="mt-2 text-[12px] text-cream/60">
        امتیازها در چند محور مستند بررسی می‌شوند؛ از رنگ و نوع گل تا سبک چیدمان و بسته‌بندی.
      </p>
    </div>
  );
}

/* -------------------------------- result -------------------------------- */

const recIcons = {
  flowers: Flower2,
  color: Palette,
  presentation: Gift,
  size: Ruler,
  style: Sparkles,
  packaging: Package,
};

function ResultView({
  kind,
  meta,
  profile,
  confidence,
  onConfirm,
  onAdjust,
  onRetake,
}: {
  kind: TestKind;
  meta: RecipientMeta;
  profile: ReturnType<typeof analyzeAnswers>;
  confidence: number;
  onConfirm: () => void;
  onAdjust: () => void;
  onRetake: () => void;
}) {
  const p = PERSONALITY_BY_KEY[profile.personality];
  const titleFa = kind === "SELF" ? "شخصیت گل شما" : `شخصیت گل ${meta.relationship || "او"} شما`;

  const recs: { icon: keyof typeof recIcons; label: string; value: string }[] = [
    { icon: "flowers", label: "گل پیشنهادی", value: profile.flowers.map((f) => FLOWER_LABELS[f]).join(" و ") },
    {
      icon: "color",
      label: "رنگ پیشنهادی",
      value: profile.color
        ? COLOR_LABELS[profile.color]
        : p.defaults.colors.map((c) => COLOR_LABELS[c]).join(" و "),
    },
    { icon: "presentation", label: "مدل ارائه", value: profile.presentation ? PRESENTATION_LABELS[profile.presentation] : "—" },
    { icon: "size", label: "اندازه", value: profile.size ? SIZE_LABELS[profile.size] : "—" },
    { icon: "style", label: "سبک طراحی", value: p.defaults.style },
    { icon: "packaging", label: "بسته‌بندی", value: profile.packaging ? PACKAGING_LABELS[profile.packaging] : "—" },
  ];

  return (
    <div className="pb-12">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div className="relative h-56 w-full md:h-72">
          <Image src={p.image} alt={p.fa} fill sizes="(max-width: 768px) 100vw, 896px" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-earth-dark/90 via-earth-dark/35 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="gh-label font-latin text-[10.5px] !tracking-[0.3em] text-cream/70">{p.en}</p>
          <h2 className="mt-2 text-[22px] font-medium text-cream md:text-[28px]">
            {titleFa}: <span className="text-cream-soft">{p.fa}</span>
          </h2>
          {/* confidence */}
          <div className="mt-3 flex max-w-sm items-center gap-3">
            <Star className="h-4 w-4 shrink-0 text-cream/80" aria-hidden="true" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/20">
              <div className="h-full rounded-full bg-cream transition-all duration-700" style={{ width: `${confidence}%` }} />
            </div>
            <span className="shrink-0 text-[11.5px] text-cream/75">میزان اطمینان {faDigits(String(confidence))}٪</span>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-justify text-[13.5px] leading-8 text-cream/80">
        {p.description}
      </p>

      {/* recommendations */}
      <div className="mt-8">
        <p className="mb-3 flex items-center gap-2 text-[13.5px] font-medium text-cream">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          پیشنهاد اختصاصی گلستان حافظ
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((r) => {
            const Icon = recIcons[r.icon];
            return (
              <div key={r.label} className="rounded-lg border border-border bg-earth/40 p-4">
                <p className="flex items-center gap-2 text-[11px] text-cream/60">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.4} aria-hidden="true" />
                  {r.label}
                </p>
                <p className="mt-1.5 text-[13.5px] font-medium leading-6 text-cream">{r.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* confirmation */}
      <div className="mt-10 rounded-xl border border-border bg-earth/30 p-5">
        <p className="text-center text-[15px] font-medium text-cream">
          آیا این انتخاب به سلیقه شما نزدیک است؟
        </p>
        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            بله، دقیقاً همین را دوست دارم.
          </button>
          <button
            type="button"
            onClick={onAdjust}
            className="flex items-center justify-center gap-2 rounded-md border border-border py-3 text-[13px] text-cream transition-colors hover:bg-earth-light/60"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            تقریباً، اما می‌خواهم کمی تغییرش بدهم.
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-[12.5px] text-cream/70 transition-colors hover:text-cream"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            خیر، می‌خواهم دوباره انتخاب کنم.
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- adjust -------------------------------- */

function AdjustPanel({
  profile,
  override,
  setOverride,
  onApply,
}: {
  profile: ReturnType<typeof analyzeAnswers>;
  override: TasteOverrides;
  setOverride: (o: TasteOverrides) => void;
  onApply: () => void;
}) {
  const toggleFlower = (f: FlowerKey) => {
    const cur = override.flowers ?? profile.flowers;
    setOverride({
      ...override,
      flowers: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f],
    });
  };

  const toggleDislike = (f: FlowerKey) => {
    const cur = override.dislikedFlowers ?? [];
    setOverride({
      ...override,
      dislikedFlowers: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f],
    });
  };

  return (
    <div className="pb-12">
      <h2 className="text-center text-[20px] font-medium text-cream md:text-[24px]">اصلاح سلیقه</h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-[12.5px] leading-6 text-cream/70">
        هر بخش را می‌توانید تغییر دهید؛ اصلاحات شما در پروفایل نهایی ذخیره می‌شود.
      </p>

      <div className="mt-8 space-y-5">
        {/* color */}
        <div>
          <p className="mb-2.5 flex items-center gap-2 text-[12.5px] text-cream/80">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" /> رنگ گل
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setOverride({ ...override, color: c })}
                aria-pressed={(override.color ?? profile.color) === c}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-right text-[12.5px] transition-colors",
                  (override.color ?? profile.color) === c
                    ? "border-cream bg-cream/10 text-cream"
                    : "border-border bg-earth/40 text-cream/80 hover:border-cream/40"
                )}
              >
                <span className="flex shrink-0 -space-x-2 space-x-reverse">
                  {PALETTE_SWATCHES[c].map((col, i) => (
                    <span key={i} className="h-6 w-6 rounded-full border border-cream/30" style={{ backgroundColor: col }} aria-hidden="true" />
                  ))}
                </span>
                {COLOR_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* flowers (multi) */}
        <div>
          <p className="mb-2.5 flex items-center gap-2 text-[12.5px] text-cream/80">
            <Flower2 className="h-3.5 w-3.5" aria-hidden="true" /> نوع گل (می‌توانید چند مورد انتخاب کنید)
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_FLOWERS.map((f) => {
              const active = (override.flowers ?? profile.flowers).includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFlower(f)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[12.5px] transition-colors",
                    active
                      ? "border-cream bg-cream font-medium text-primary-foreground"
                      : "border-border bg-earth/40 text-cream/80 hover:border-cream/40"
                  )}
                >
                  {FLOWER_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* disliked */}
        <div>
          <p className="mb-2.5 text-[12.5px] text-cream/80">گل‌هایی که او دوست ندارد (اختیاری)</p>
          <div className="flex flex-wrap gap-2">
            {ALL_FLOWERS.map((f) => {
              const active = (override.dislikedFlowers ?? []).includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleDislike(f)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[12.5px] transition-colors",
                    active
                      ? "border-red-300/60 bg-red-400/15 text-red-100"
                      : "border-border bg-earth/40 text-cream/70 hover:border-cream/40"
                  )}
                >
                  بدون {FLOWER_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* presentation / size / packaging */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-[12.5px] text-cream/80">
              <Gift className="h-3.5 w-3.5" aria-hidden="true" /> مدل ارائه
            </p>
            <select
              value={override.presentation ?? profile.presentation ?? ""}
              onChange={(e) => setOverride({ ...override, presentation: e.target.value as PresentationKey })}
              className={inputCls}
              aria-label="مدل ارائه"
            >
              {ALL_PRESENTATIONS.map((p) => (
                <option key={p} value={p}>
                  {PRESENTATION_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-[12.5px] text-cream/80">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> اندازه
            </p>
            <select
              value={override.size ?? profile.size ?? ""}
              onChange={(e) => setOverride({ ...override, size: e.target.value as SizeKey })}
              className={inputCls}
              aria-label="اندازه"
            >
              {ALL_SIZES.map((s) => (
                <option key={s} value={s}>
                  {SIZE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-[12.5px] text-cream/80">
              <Package className="h-3.5 w-3.5" aria-hidden="true" /> بسته‌بندی
            </p>
            <select
              value={override.packaging ?? profile.packaging ?? ""}
              onChange={(e) => setOverride({ ...override, packaging: e.target.value as PackagingKey })}
              className={inputCls}
              aria-label="بسته‌بندی"
            >
              {ALL_PACKAGINGS.map((p) => (
                <option key={p} value={p}>
                  {PACKAGING_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        className="mt-8 flex w-full items-center justify-center gap-2 bg-cream py-3.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        اعمال اصلاحات و مشاهده نتیجه
      </button>
    </div>
  );
}

/* --------------------------------- save --------------------------------- */

function SavePanel({
  kind,
  meta,
  title,
  setTitle,
  saving,
  loggedIn,
  onLogin,
  onSave,
}: {
  kind: TestKind;
  meta: RecipientMeta;
  title: string;
  setTitle: (t: string) => void;
  saving: boolean;
  loggedIn: boolean;
  onLogin: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg pb-16 pt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream/10">
        <Sparkles className="h-6 w-6 text-cream" strokeWidth={1.3} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-[20px] font-medium text-cream">نام این پروفایل را انتخاب کنید</h2>
      <p className="mt-2 text-[12.5px] leading-6 text-cream/70">
        مثلاً: «سلیقه شخصی من»، «مادر من»، «همسر من» — بعداً در خریدهای بعدی از این پروفایل استفاده می‌کنید.
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={60}
        placeholder={kind === "SELF" ? "سلیقه شخصی من" : meta.relationship || "نام پروفایل"}
        className={cn(inputCls, "mt-6 text-center")}
        aria-label="نام پروفایل"
      />
      {loggedIn ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !title.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 bg-cream py-3.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          ذخیره پروفایل سلیقه
        </button>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-earth/30 p-4">
          <p className="text-[12.5px] leading-6 text-cream/75">
            برای ذخیره این پروفایل باید وارد حساب کاربری شوید؛ اطلاعات هر فرد فقط در حساب خودش ذخیره می‌شود.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-cream py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            ورود / ثبت‌نام و ذخیره
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- saved --------------------------------- */

function SavedScreen({
  kind,
  relationship,
  onNewTest,
  onOpenProfiles,
}: {
  kind: TestKind;
  relationship?: string;
  onNewTest: () => void;
  onOpenProfiles: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg pb-16 pt-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream text-primary-foreground">
        <Check className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-[22px] font-medium text-cream">پروفایل ذخیره شد</h2>
      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-7 text-cream/70">
        {kind === "SELF"
          ? "پروفایل سلیقه شخصی شما آماده است؛ از این پس پیشنهادهای گلستان حافظ بر اساس آن شخصی‌سازی می‌شود."
          : `پروفایل «${relationship || "شخص موردنظر"}» ذخیره شد؛ دفعه بعد لازم نیست دوباره تست را انجام دهید.`}
      </p>
      <div className="mt-7 grid gap-2.5">
        <button
          type="button"
          onClick={onOpenProfiles}
          className="flex items-center justify-center gap-2 bg-cream py-3.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          مشاهده پروفایل‌های من
        </button>
        <button
          type="button"
          onClick={onNewTest}
          className="flex items-center justify-center gap-2 rounded-md border border-border py-3 text-[12.5px] text-cream transition-colors hover:bg-earth-light/60"
        >
          <Flower2 className="h-4 w-4" aria-hidden="true" />
          ساخت پروفایل جدید
        </button>
      </div>
    </div>
  );
}
