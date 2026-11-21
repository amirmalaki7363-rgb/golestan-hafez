import Image from "next/image";
import { Instagram } from "lucide-react";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { Reveal } from "./reveal";

export function InstagramSection({
  content,
}: {
  content?: SiteContent["instagram"];
}) {
  const c = content ?? DEFAULT_SITE_CONTENT.instagram;

  return (
    <section
      aria-label="در اینستاگرام گلستان حافظ"
      className="bg-earth-dark pb-20 md:pb-24"
    >
      <Reveal className="text-center">
        <p className="gh-label">{c.label}</p>
        <h2 className="mt-4 text-[22px] md:text-[24px] font-extralight text-cream">
          {c.title}
        </h2>
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`صفحه اینستاگرام ${c.handle}`}
          className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-cream/25 px-6 py-2.5 text-cream/85 transition-colors hover:border-cream/60 hover:bg-cream/5 hover:text-cream"
        >
          <Instagram className="h-5 w-5" strokeWidth={1.4} />
          <span className="font-latin text-[14px] tracking-[0.08em]">{c.handle}</span>
        </a>
      </Reveal>

      <div className="mx-auto mt-10 max-w-[1010px] px-4 md:px-6">
        <div dir="ltr" className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {c.images.map((image, i) => (
            <Reveal key={`${image}-${i}`} delay={i * 70}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`صفحه اینستاگرام ${c.handle}`}
                className="group relative block aspect-square overflow-hidden"
              >
                <Image
                  src={image}
                  alt={c.handle}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover brightness-[0.7] transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-[0.9]"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                  <Instagram className="h-4 w-4 text-cream/90" strokeWidth={1.4} />
                  <span className="font-latin text-[12px] text-cream/90">{c.handle}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
