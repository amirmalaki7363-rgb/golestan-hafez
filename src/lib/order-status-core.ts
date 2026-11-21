/** Server-safe order status constants (no "use client" — importable from routes). */

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  CONFIRMED: "تأیید شده",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

/** Warm, velvet-friendly status colors matching the site palette. */
export const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDING: "border-amber-300/35 bg-amber-300/10 text-amber-200",
  CONFIRMED: "border-cream/30 bg-cream/10 text-cream",
  PREPARING: "border-orange-300/35 bg-orange-300/10 text-orange-200",
  SHIPPED: "border-rose-300/35 bg-rose-300/10 text-rose-200",
  DELIVERED: "border-emerald-300/35 bg-emerald-300/10 text-emerald-200",
  CANCELLED: "border-red-400/35 bg-red-400/10 text-red-300",
};
