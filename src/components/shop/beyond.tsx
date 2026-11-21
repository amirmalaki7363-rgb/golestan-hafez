import Image from "next/image";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { Reveal } from "./reveal";

export function Beyond({ content }: { content?: SiteContent["beyond"] }) {
  const c = content ?? DEFAULT_SITE_CONTENT.beyond;

  return (
    <section
      id="beyond"
      aria-label="ارسال در تهران و اصفهان"
      className="relative h-[480px] md:h-[540px] w-full overflow-hidden"
    >
      <Image
        src={c.image}
        alt={c.imageAlt}
        fill
        sizes="100vw"
        className="object-cover object-left md:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/25 to-black/5" />

      <div className="absolute inset-0 flex items-center">
        <Reveal className="mx-auto w-full max-w-[1220px] px-6 md:px-10">
          <div dir="ltr" className="flex justify-end">
            <div className="text-cream md:mr-4 [text-shadow:0_1px_14px_rgba(0,0,0,0.55)]">
              <p dir="rtl" className="text-[26px] md:text-[32px] font-light tracking-[0.12em]">
                {c.fa}
              </p>
              <h2 className="font-latin mt-2 text-[38px] md:text-[50px] font-light leading-tight tracking-[0.04em]">
                {c.title}
              </h2>
              <p className="font-latin mt-3 max-w-[330px] text-[10px] leading-[1.9] text-cream/70">
                {c.description}
              </p>
              <p className="font-latin mt-4 text-[11px] tracking-[0.55em] text-cream/80">
                {c.wordmark}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
