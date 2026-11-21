"use client";

/**
 * درون‌ریزی محصولات از فایل CSV — admin bulk import dialog.
 *
 * Flow: pick/drop a CSV file → client-side parse & validation preview
 * (shared logic in src/lib/csv.ts) → POST valid rows to
 * /api/admin/products/import → per-row outcome summary.
 */

import { useRef, useState } from "react";
import {
  Check,
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  buildSampleCsv,
  parseProductsCsv,
  type CsvParseResult,
  type CsvProductRow,
} from "@/lib/csv";
import { cn } from "@/lib/utils";

const inputCls = "border-border bg-earth text-cream placeholder:text-muted-foreground/60";

const fmtNum = (v: string) => v.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

const MAX_ROWS = 500;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface ImportOutcomeItem {
  sku: string;
  name?: string;
  line?: number;
  reason: string;
}

interface ImportResponse {
  created: number;
  updated: number;
  skipped: ImportOutcomeItem[];
  failed: ImportOutcomeItem[];
}

function OutcomeList({ title, items, tone }: { title: string; items: ImportOutcomeItem[]; tone: "muted" | "danger" }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className={cn("text-[11.5px] font-medium", tone === "danger" ? "text-red-300" : "text-cream/80")}>
        {title} ({items.length.toLocaleString("en-US")})
      </p>
      <div className="gh-scroll max-h-28 space-y-1 overflow-y-auto rounded-md border border-border bg-earth/60 p-2">
        {items.map((item, i) => (
          <p key={`${item.sku}-${i}`} className="text-[10.5px] leading-4 text-muted-foreground">
            <span className="font-latin text-cream/85">{item.sku}</span>
            {item.name ? ` — ${item.name}` : ""}
            {item.line ? ` (ردیف ${item.line.toLocaleString("en-US")})` : ""}: {item.reason}
          </p>
        ))}
      </div>
    </div>
  );
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called after a successful import so the products list can reload. */
  onImported: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [defaultPrice, setDefaultPrice] = useState("0");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validRows = parsed ? parsed.rows.filter((r) => r.errors.length === 0) : [];
  const invalidCount = parsed ? parsed.rows.length - validRows.length : 0;
  const overLimit = validRows.length > MAX_ROWS;

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setResult(null);
    setDefaultPrice("0");
    setUpdateExisting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const readFile = async (file: File) => {
    const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
    if (!isCsv) {
      toast({
        title: "فرمت پذیرفته نمی‌شود",
        description: "فقط فایل CSV. اگر فایل اکسل دارید، آن را با فرمت CSV ذخیره کنید.",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "حجم فایل زیاد است", description: "حداکثر ۲ مگابایت." });
      return;
    }
    setParsing(true);
    setResult(null);
    try {
      const text = await file.text();
      const parsedResult = parseProductsCsv(text);
      setParsed(parsedResult);
      setFileName(file.name);
      if (parsedResult.missingColumns.length > 0) {
        toast({
          title: "ستون‌های الزامی پیدا نشد",
          description: `ستون‌های ${parsedResult.missingColumns.join("، ")} در سطر عنوان فایل نیست.`,
        });
      }
    } catch {
      toast({ title: "خواندن فایل ناموفق بود", description: "دوباره تلاش کنید." });
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadSample = () => {
    const blob = new Blob([buildSampleCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "نمونه-محصولات.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (validRows.length === 0 || overLimit) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map(({ line, sku, name, category, image, price }) => ({
            line,
            sku,
            name,
            category,
            image,
            price,
          })),
          updateExisting,
          defaultPrice: parseNum(defaultPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "درون‌ریزی انجام نشد", description: data.error ?? "دوباره تلاش کنید." });
        return;
      }
      setResult(data as ImportResponse);
      onImported();
      const r = data as ImportResponse;
      toast({
        title: "درون‌ریزی کامل شد",
        description: `${r.created.toLocaleString("en-US")} محصول جدید، ${r.updated.toLocaleString("en-US")} به‌روزرسانی، ${r.skipped.length.toLocaleString("en-US")} رد شد.`,
      });
    } finally {
      setImporting(false);
    }
  };

  const previewRows: CsvProductRow[] = parsed ? parsed.rows.slice(0, 8) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent
        dir="rtl"
        className="gh-scroll max-h-[90vh] overflow-y-auto border-border bg-earth-dark text-cream sm:max-w-[560px]"
      >
        <DialogHeader className="text-right">
          <DialogTitle className="text-cream">درون‌ریزی محصولات با CSV</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            فایل CSV را با ستون‌های «شناسه محصول، عنوان محصول، دسته‌بندی محصول، آدرس تصویر» بارگذاری کنید. ستون «قیمت» اختیاری است.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* ------------------------- result summary ------------------------- */
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3">
                <p className="font-latin text-xl text-emerald-300">{result.created.toLocaleString("en-US")}</p>
                <p className="text-[11px] text-muted-foreground">محصول جدید</p>
              </div>
              <div className="rounded-md border border-cream/25 bg-cream/5 p-3">
                <p className="font-latin text-xl text-cream">{result.updated.toLocaleString("en-US")}</p>
                <p className="text-[11px] text-muted-foreground">به‌روزرسانی</p>
              </div>
              <div className="rounded-md border border-cream/25 bg-cream/5 p-3">
                <p className="font-latin text-xl text-cream">{result.skipped.length.toLocaleString("en-US")}</p>
                <p className="text-[11px] text-muted-foreground">رد شده (تکراری)</p>
              </div>
            </div>

            <OutcomeList title="ردیف‌های ناموفق" items={result.failed} tone="danger" />
            <OutcomeList title="رد شده" items={result.skipped} tone="muted" />

            <div className="flex justify-start pt-1">
              <button
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                className="rounded-md bg-cream px-4 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          /* --------------------------- import flow --------------------------- */
          <div className="space-y-3">
            {/* sample download */}
            <button
              onClick={downloadSample}
              className="flex items-center gap-1.5 text-[11.5px] text-cream/80 underline-offset-4 transition-colors hover:text-cream hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              دریافت فایل نمونه CSV
            </button>

            {/* drop zone */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
              }}
            />
            {fileName ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-earth/60 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-cream/70" />
                  <span className="truncate text-[12px] text-cream">{fileName}</span>
                </div>
                <button
                  aria-label="حذف فایل"
                  onClick={reset}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cream/25 text-cream/85 transition-colors hover:bg-cream/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void readFile(f);
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                  dragOver ? "border-cream bg-cream/10" : "border-cream/30 bg-earth/40 hover:bg-earth/70"
                )}
              >
                {parsing ? (
                  <Loader2 className="h-6 w-6 animate-spin text-cream/70" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-cream/70" />
                )}
                <span className="text-[12.5px] text-cream">
                  {parsing ? "در حال خواندن فایل..." : "فایل CSV را اینجا رها کنید یا کلیک کنید"}
                </span>
                <span className="text-[10.5px] text-muted-foreground">حداکثر ۲ مگابایت — انکودینگ UTF-8</span>
              </button>
            )}

            {/* parse summary + preview */}
            {parsed && (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                  <span className="text-muted-foreground">
                    {(parsed.totalDataRows ?? 0).toLocaleString("en-US")} ردیف خوانده شد
                  </span>
                  <span className="text-emerald-300">
                    {validRows.length.toLocaleString("en-US")} آماده درون‌ریزی
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-300">{invalidCount.toLocaleString("en-US")} ردیف نامعتبر</span>
                  )}
                  {parsed.missingColumns.length > 0 && (
                    <span className="text-red-300">
                      ستون‌های یافت‌نشده: {parsed.missingColumns.join("، ")}
                    </span>
                  )}
                  {overLimit && (
                    <span className="text-red-300">
                      حداکثر {MAX_ROWS.toLocaleString("en-US")} ردیف در هر بار درون‌ریزی — فایل را به بخش‌های کوچک‌تر تقسیم کنید.
                    </span>
                  )}
                </div>

                {previewRows.length > 0 && (
                  <div className="gh-scroll max-h-56 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-[11px]" dir="rtl">
                      <thead className="sticky top-0 bg-earth text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1.5 text-right font-medium">#</th>
                          <th className="px-2 py-1.5 text-right font-medium">شناسه</th>
                          <th className="px-2 py-1.5 text-right font-medium">عنوان</th>
                          <th className="px-2 py-1.5 text-right font-medium">دسته‌بندی</th>
                          <th className="px-2 py-1.5 text-right font-medium">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row) => (
                          <tr key={row.line} className="border-t border-border/60">
                            <td className="font-latin px-2 py-1.5 text-muted-foreground">
                              {row.line.toLocaleString("en-US")}
                            </td>
                            <td className="font-latin max-w-[100px] truncate px-2 py-1.5 text-cream" title={row.sku}>
                              {row.sku || "—"}
                            </td>
                            <td className="max-w-[150px] truncate px-2 py-1.5 text-cream" title={row.name}>
                              {row.name || "—"}
                            </td>
                            <td className="max-w-[100px] truncate px-2 py-1.5 text-muted-foreground" title={row.category}>
                              {row.category || "—"}
                            </td>
                            <td className="px-2 py-1.5">
                              {row.errors.length === 0 ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" aria-label="معتبر" />
                              ) : (
                                <span title={row.errors.join(" ")} className="flex items-center gap-1 text-red-300">
                                  <X className="h-3.5 w-3.5" />
                                  <span className="max-w-[140px] truncate">{row.errors[0]}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsed.rows.length > previewRows.length && (
                      <p className="border-t border-border/60 bg-earth px-2 py-1.5 text-[10px] text-muted-foreground">
                        نمایش {previewRows.length.toLocaleString("en-US")} ردیف از {parsed.rows.length.toLocaleString("en-US")}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* import options */}
            <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-earth/40 p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-cream/80">قیمت پیش‌فرض (IRT)</Label>
                <Input
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(fmtNum(e.target.value))}
                  inputMode="numeric"
                  dir="ltr"
                  className={cn(inputCls, "font-latin text-left text-[12.5px]")}
                  placeholder="0"
                />
                <p className="text-[10px] leading-4 text-muted-foreground">
                  برای ردیف‌هایی که ستون قیمت ندارند یا خالی است استفاده می‌شود.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-1.5">
                <Label className="text-[12px] text-cream/80">محصولات موجود</Label>
                <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-muted-foreground">
                  <Switch
                    checked={updateExisting}
                    onCheckedChange={setUpdateExisting}
                    aria-label="به‌روزرسانی محصولات موجود"
                  />
                  به‌روزرسانی محصولات با شناسه تکراری
                </label>
                <p className="text-[10px] leading-4 text-muted-foreground">
                  خاموش: ردیف‌های تکراری نادیده گرفته می‌شوند.
                </p>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center justify-start gap-2 pt-1">
              <button
                onClick={() => void runImport()}
                disabled={validRows.length === 0 || overLimit || importing || parsing}
                className="flex items-center gap-1.5 rounded-md bg-cream px-4 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5" />
                )}
                درون‌ریزی {validRows.length > 0 ? `${validRows.length.toLocaleString("en-US")} محصول` : ""}
              </button>
              {parsed && (
                <button
                  onClick={reset}
                  disabled={importing}
                  className="rounded-md border border-cream/25 px-4 py-2 text-[12px] text-cream transition-colors hover:bg-cream/10 disabled:opacity-40"
                >
                  فایل دیگر
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
