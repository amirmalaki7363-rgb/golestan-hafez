import Image from "next/image";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function Galleries({ content }: { content?: SiteContent["galleries"] }) {
  const c = content ?? DEFAULT_SITE_CONTENT.galleries;

  /** Stable anchor per store so header menu links can deep-link each store. */
  const storeAnchor = (name: string) =>
    name.includes("تهران")
      ? "store-tehran"
      : name.includes("اصفهان")
        ? "store-isfahan"
        : undefined;

  return (
    <section
      id="galleries"
      aria-label="شعبه‌های گلستان حافظ"
      className="bg-earth-dark py-20 md:py-24"
    >
      <SectionHeading label={c.label} title={c.title} />

      <div className="mx-auto mt-12 max-w-[860px] px-4 md:px-6">
        <div dir="ltr" className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {c.stores.map((s, i) => (
            <Reveal key={`${s.name}-${i}`} delay={i * 90}>
              <a href="#top" id={storeAnchor(s.name)} className="group block scroll-mt-24">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={s.image}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                  />
                </div>
                <p className="mt-4 text-center text-[15px] font-light text-cream/90 transition-colors group-hover:text-cream">
                  {s.name}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
