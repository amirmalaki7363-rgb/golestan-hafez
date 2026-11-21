"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { useCategoryFilterStore } from "@/lib/category-filter-store";
import { Reveal } from "./reveal";

function Card({
  href,
  image,
  alt,
  className,
  children,
  position = "top",
  category,
}: {
  href: string;
  image: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
  position?: "top" | "center";
  /** Product category applied to the Best Sellers filter when the card is clicked. */
  category?: string;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        // Filter the Best Sellers carousel to this collection's products…
        useCategoryFilterStore.getState().setCategory(category ?? null);
        // …and scroll there ourselves. Bypassing the router's hash
        // navigation guarantees the filter + scroll always happen together.
        e.preventDefault();
        document
          .getElementById("best-sellers")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={cn(
        "group relative block overflow-hidden bg-earth",
        className
      )}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/25 transition-opacity duration-700 group-hover:opacity-80" />
      <div
        className={cn(
          "absolute inset-0 p-5 md:p-7",
          position === "center" && "flex items-center"
        )}
      >
        {children}
      </div>
    </Link>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      dir="ltr"
      className={cn(
        "font-latin block text-[9px] tracking-[0.5em] text-white/75",
        className
      )}
    >
      GOLESTANE HAFEZ
    </span>
  );
}

const miniText =
  "font-latin mt-2 max-w-[210px] text-[8.5px] leading-[1.8] text-white/70";

export function Collections({
  content,
}: {
  content?: SiteContent["collections"];
}) {
  const c = content ?? DEFAULT_SITE_CONTENT.collections;

  return (
    <section id="collections" aria-label="کالکشن‌های گلستان حافظ" className="bg-earth-dark pb-24">
      <Reveal>
        <h2 className="gh-label text-center">{c.heading}</h2>
      </Reveal>

      <div className="mx-auto mt-12 max-w-[1010px] px-4 md:px-6">
        {/* Rose Box + Teddy | Flower Box */}
        <div dir="ltr" className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Reveal>
              <Card
                href="#best-sellers"
                category="باکس ویژه رز"
                image={c.roseBox.image}
                alt={c.roseBox.alt}
                className="h-[280px] md:h-[298px]"
              >
                <div dir="ltr" className="flex h-full flex-col items-end text-white">
                  <h3 className="font-latin text-[24px] md:text-[28px] font-light tracking-[0.06em]">
                    {c.roseBox.title}
                  </h3>
                  <p className={miniText}>{c.roseBox.desc}</p>
                  <span dir="rtl" className="mt-2 text-[18px] font-light tracking-[0.25em] text-white/90">
                    {c.roseBox.fa}
                  </span>
                  <Wordmark className="mt-1" />
                </div>
              </Card>
            </Reveal>
            <Reveal delay={80}>
              <Card
                href="#best-sellers"
                category="دسته گل مناسبتی"
                image={c.occasionBouquet.image}
                alt={c.occasionBouquet.alt}
                className="h-[280px] md:h-[298px]"
              >
                <div dir="ltr" className="flex h-full flex-col items-start text-white">
                  <h3 className="font-latin text-[24px] md:text-[28px] font-light leading-tight tracking-[0.06em]">
                    {c.occasionBouquet.title}
                  </h3>
                  <p className={miniText}>{c.occasionBouquet.desc}</p>
                  <span dir="rtl" className="mt-2 text-[18px] font-light tracking-[0.25em] text-white/90">
                    {c.occasionBouquet.fa}
                  </span>
                  <Wordmark className="mt-1" />
                </div>
              </Card>
            </Reveal>
          </div>

          <Reveal delay={120} className="h-full">
            <Card
              href="#best-sellers"
              category="باکس گل"
              image={c.flowerBox.image}
              alt={c.flowerBox.alt}
              className="h-[420px] md:h-full md:min-h-[604px]"
            >
              <div dir="ltr" className="flex h-full flex-col items-end text-white">
                <h3 className="font-latin text-[34px] md:text-[44px] font-light tracking-[0.08em]">
                  {c.flowerBox.title}
                </h3>
                <p className={miniText + " max-w-[250px]"}>{c.flowerBox.desc}</p>
                <span dir="rtl" className="mt-2 text-[20px] font-light tracking-[0.3em] text-white/90">
                  {c.flowerBox.fa}
                </span>
                <Wordmark className="mt-1" />
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Bouquets — full width */}
        <Reveal className="mt-2">
          <Card
            href="#best-sellers"
            category="دسته گل"
            image={c.bouquets.image}
            alt={c.bouquets.alt}
            className="h-[280px] md:h-[300px]"
            position="center"
          >
            <div dir="rtl" className="flex h-full items-center justify-end">
              <div className="text-white">
                <p className="text-[20px] font-light tracking-[0.3em] text-white/95">
                  {c.bouquets.fa}
                </p>
                <h3
                  dir="ltr"
                  className="font-latin mt-1 text-right text-[38px] md:text-[52px] font-light tracking-[0.06em]"
                >
                  {c.bouquets.title}
                </h3>
                <p className="font-latin mt-1 max-w-[300px] text-left text-[8.5px] leading-[1.8] text-white/70" dir="ltr">
                  {c.bouquets.desc}
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
