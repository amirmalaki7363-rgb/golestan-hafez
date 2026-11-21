"use client";

/**
 * Shared, bulletproof upload helper for admin image pickers.
 *
 * Why this exists: the old inline fetch showed «خطای شبکه» for ANY failure
 * (including 404/500 HTML responses) because it called res.json() before
 * checking res.ok. This helper:
 *   1. aborts after a timeout so the UI never hangs,
 *   2. checks res.ok FIRST,
 *   3. parses JSON defensively (HTML error pages cannot crash it),
 *   4. retries automatically on fallback endpoints if the canonical one
 *      is unavailable, so missing route files can never break uploads,
 *   5. reports the real HTTP status + a Persian message.
 *
 * Uploads are stored in the DATABASE and served from /api/uploads/{id},
 * so they survive even when runtime files in public/uploads are wiped.
 */

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; message: string };

const UPLOAD_TIMEOUT_MS = 60_000; // 60s per attempt — generous for slow connections

const ENDPOINTS = [
  "/api/admin/upload",
  "/api/admin/content/upload",
  "/api/admin/content?upload=1",
];

function statusMessage(status: number, serverError?: string): string {
  if (serverError) return serverError;
  switch (status) {
    case 401:
    case 403:
      return "دسترسی ندارید — با حساب مدیر وارد شوید.";
    case 413:
      return "حجم تصویر بیش از حد مجاز است (حداکثر ۵ مگابایت).";
    case 415:
      return "فرمت فایل پذیرفته نمی‌شود (JPG، PNG، WebP، GIF یا AVIF).";
    case 429:
      return "تعداد درخواست‌ها زیاد است — کمی بعد تلاش کنید.";
    case 500:
    case 502:
    case 503:
      return "خطای سرور — دوباره تلاش کنید.";
    default:
      return `آپلود ناموفق بود (کد ${status}).`;
  }
}

interface AttemptOutcome {
  kind: "ok" | "failed" | "unavailable";
  path?: string;
  message?: string;
  status?: number;
}

/** Single attempt against one endpoint. */
async function attempt(file: File, endpoint: string): Promise<AttemptOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(endpoint, {
      method: "POST",
      body: fd,
      signal: controller.signal,
      // no Content-Type header — browser sets the multipart boundary itself
    });

    // Read the body as text first; parse JSON defensively.
    const raw = await res.text();
    let data: { path?: unknown; error?: unknown } | null = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null; // HTML/empty body → fall through to status-based handling
    }

    if (!res.ok) {
      const serverError =
        typeof data?.error === "string" ? data.error : undefined;
      // 404 / network-level: this endpoint is unavailable → caller may retry
      // the fallback. Other codes (403/413/415/500…) are real answers.
      if (res.status === 404) return { kind: "unavailable", status: 404 };
      return {
        kind: "failed",
        message: statusMessage(res.status, serverError),
        status: res.status,
      };
    }

    if (!data || typeof data.path !== "string" ||
        !(data.path.startsWith("/api/uploads/") || data.path.startsWith("/uploads/"))) {
      return { kind: "failed", message: "پاسخ سرور ناقص بود — دوباره تلاش کنید." };
    }

    return { kind: "ok", path: data.path };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        kind: "failed",
        message: "زمان آپلود تمام شد — اینترنت را بررسی و دوباره تلاش کنید.",
      };
    }
    // Network-level failure → endpoint unreachable → caller may retry fallback.
    return { kind: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  let lastUnavailable = true;

  for (const endpoint of ENDPOINTS) {
    const out = await attempt(file, endpoint);
    if (out.kind === "ok") return { ok: true, path: out.path! };
    if (out.kind === "failed") return { ok: false, message: out.message! };
    // "unavailable" → try the next (fallback) endpoint
    lastUnavailable = true;
  }

  return {
    ok: false,
    message: "سرویس آپلود در دسترس نیست — صفحه را یک‌بار رفرش کنید.",
  };
}
