import Image from "next/image";
import { Heart, Gift, PartyPopper, Users, type LucideIcon } from "lucide-react";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const ICONS: LucideIcon[] = [Heart, Gift, PartyPopper, Users];

export function Occasions({ content }: { content?: SiteContent["occasions"] }) {
  const c = content ?? DEFAULT_SITE_CONTENT.occasions;

  return (
    <section id="occasions" aria-label="مناسبت‌ها" className="bg-earth-dark py-20 md:py-24">
      <SectionHeading label={c.label} title={c.title} />

      <div className="mx-auto mt-12 max-w-[1010px] px-4 md:px-6">
        <div dir="ltr" className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {c.items.map((o, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={`${o.fa}-${i}`} delay={i * 80}>
                <a
                  href="#best-sellers"
                  className="group relative block h-[190px] overflow-hidden md:h-[200px]"
                >
                  <Image
                    src={o.image}
                    alt={`${o.fa} — ${o.en}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover brightness-[0.55] transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-[0.75]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/60 transition-colors group-hover:bg-cream/10">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.2} />
                    </span>
                    <span className="text-[16px] font-light">{o.fa}</span>
                    <span className="font-latin text-[12.5px] font-light text-cream/80">
                      {o.en}
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
