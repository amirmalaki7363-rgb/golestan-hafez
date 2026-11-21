"use client";

import { cn } from "@/lib/utils";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLE,
} from "@/lib/order-status-core";

// Re-export for client components (server routes must import order-status-core instead).
export { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_STYLE };
export type { OrderStatus } from "@/lib/order-status-core";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] leading-5 whitespace-nowrap",
        ORDER_STATUS_STYLE[status] ?? "border-cream/30 bg-cream/10 text-cream",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Persian (Jalali) date/time formatter. */
export function faDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Persian (Jalali) date only — no time. */
export function faDateShort(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
