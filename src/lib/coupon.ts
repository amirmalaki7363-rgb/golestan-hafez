/** Shared coupon math used by validation & order creation. */
export function discountFor(
  coupon: { type: string; value: number; minTotal: number },
  subtotal: number
): number {
  const raw =
    coupon.type === "PERCENT"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;
  return Math.max(0, Math.min(raw, subtotal));
}
