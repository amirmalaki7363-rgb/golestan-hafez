"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

/**
 * Reusable image picker for the admin content editor:
 * click / drag & drop upload → preview → change or remove,
 * with a manual-path fallback input.
 *
 * `onUploaded` fires only after a successful upload (not on manual
 * path typing), letting parents auto-commit the new path server-side.
 */
export function ImageUploadField({
  value,
  onChange,
  onUploaded,
  label,
  className,
  height = "h-32",
}: {
  value: string;
  onChange: (v: string) => void;
  onUploaded?: (path: string) => void;
  label?: string;
  className?: string;
  height?: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      onChange(result.path);
      onUploaded?.(result.path);
      toast({ title: "تصویر آپلود شد", description: file.name });
    } else {
      toast({ title: "آپلود نشد", description: result.message });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void uploadFile(f);
    },
  };

  return (
    <div className={cn("space-y-1.5", className)}>
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
      {label && <p className="text-[11px] text-cream/75">{label}</p>}

      {value.trim() ? (
        <div
          {...dropHandlers}
          className={cn(
            "relative w-full overflow-hidden rounded-md border border-border bg-earth",
            height
          )}
        >
          <Image
            src={value.trim()}
            alt="پیش‌نمایش"
            fill
            sizes="470px"
            className="object-cover"
            unoptimized={value.trim().startsWith("http")}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-5 w-5 animate-spin text-cream" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/75 to-transparent p-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-sm bg-cream/95 px-2.5 py-1.5 text-[10.5px] font-medium text-primary-foreground transition hover:bg-cream disabled:opacity-50"
            >
              تغییر
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="rounded-sm border border-red-300/40 bg-red-400/20 px-2.5 py-1.5 text-[10.5px] font-medium text-red-200 transition hover:bg-red-400/30 disabled:opacity-50"
            >
              حذف
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          {...dropHandlers}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-earth/40 transition-colors",
            height,
            dragOver
              ? "border-amber-300/70 bg-amber-300/10"
              : "border-border hover:border-cream/40 hover:bg-earth"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-cream/70" strokeWidth={1.3} />
              <span className="text-[11px] text-cream/80">در حال آپلود…</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5 text-cream/60" strokeWidth={1.3} />
              <span className="text-[11px] text-cream/85">آپلود تصویر</span>
              <span className="text-[9px] font-light text-muted-foreground">
                JPG، PNG، WebP — حداکثر ۵MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-earth px-2.5 text-right font-latin text-[10.5px] text-cream placeholder:text-muted-foreground/60"
        placeholder="/images/... یا /api/uploads/..."
      />
    </div>
  );
}
