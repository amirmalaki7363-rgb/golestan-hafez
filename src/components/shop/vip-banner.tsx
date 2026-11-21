import Image from "next/image";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { Reveal } from "./reveal";

export function VipBanner({ content }: { content?: SiteContent["vip"] }) {
  const c = content ?? DEFAULT_SITE_CONTENT.vip;

  return (
    <section id="vip" aria-label="کالکشن اختصاصی VIP" className="relative h-[560px] md:h-[640px] w-full overflow-hidden">
      <Image
        src={c.image}
        alt={c.imageAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#1c0d0d]/35" />

      <Reveal className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="gh-label !text-cream/85">{c.label}</p>
        <h2
          dir="ltr"
          className="font-latin mt-4 text-[64px] md:text-[88px] font-normal leading-none text-cream"
        >
          {c.title}
        </h2>
        <p dir="ltr" className="mt-5 text-[15px] font-light text-cream/90">
          {c.subtitle}
        </p>
        <a href="#best-sellers" className="gh-link mt-10">
          {c.cta}
        </a>
      </Reveal>
    </section>
  );
}
