import Link from "next/link";
import { Flower2 } from "lucide-react";

/** صفحه ۴۰۴ محصول — friendly Persian fallback for unknown/hidden products. */
export default function ProductNotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/25 bg-earth/60">
        <Flower2 className="h-7 w-7 text-cream/70" aria-hidden="true" />
      </span>
      <h1 className="font-latin mt-6 text-[22px] font-light text-cream md:text-[26px]">
        محصولی که دنبالش بودید پیدا نشد
      </h1>
      <p className="mt-3 max-w-md text-[13px] font-light leading-6 text-muted-foreground">
        ممکن است این محصول حذف شده، ناموجود شده یا آدرس اشتباه باشد. از فروشگاه
        گلستان حافظ دیدن کنید تا مجموعه‌های تازه را ببینید.
      </p>
      <Link
        href="/"
        className="mt-7 bg-cream px-6 py-2.5 text-[13px] text-primary-foreground transition-opacity hover:opacity-90"
      >
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
