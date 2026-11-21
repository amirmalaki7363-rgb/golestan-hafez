import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Two-column editorial split: image on one side, right-aligned latin text on the other */
export function FeatureSplit({
  id,
  label,
  title,
  description,
  image,
  imageAlt,
  imageClassName,
}: {
  id?: string;
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageClassName?: string;
}) {
  return (
    <section id={id} aria-label={title} className="bg-earth-dark py-20 md:py-24">
      <div
        dir="ltr"
        className="mx-auto grid max-w-[1220px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-[1.05fr_1fr] md:gap-16 md:px-10"
      >
        {/* Image — visually left in ltr / start in rtl flow */}
        <Reveal className="order-1">
          <div className={cn("relative aspect-[3/4] w-full overflow-hidden md:aspect-auto md:h-[560px]", imageClassName)}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        {/* Text — right aligned latin block */}
        <Reveal delay={120} className="order-2">
          <div dir="ltr" className="text-right text-cream">
            <p className="gh-label">{label}</p>
            <h2 className="mt-4 text-[32px] md:text-[42px] font-extralight leading-tight">
              {title}
            </h2>
            <p className="mt-5 text-[14.5px] font-light text-cream/80">
              {description}
            </p>
            <a href="#best-sellers" className="gh-link mt-9">
              View Collection
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
