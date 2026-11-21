"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import type { SiteContent } from "@/lib/site-content-schema";
import { useFlowerTestStore } from "@/lib/flower-test-store";

type HeroContent = SiteContent["hero"];

const FALLBACK_SLIDES = DEFAULT_SITE_CONTENT.hero.slides;

/**
 * Banner-style hero slideshow:
 * - full-bleed slides sliding horizontally (RTL: slide 0 rests at the right)
 * - previous/next arrows + dots
 * - auto-advance (paused on hover/focus), manual navigation re-arms the timer
 */
export function Hero({ content }: { content?: HeroContent }) {
  const slides = content?.slides?.length ? content.slides : FALLBACK_SLIDES;
  const autoplayMs = Math.max(3000, Math.min(15000, content?.autoplayMs ?? 6000));
  const openTest = useFlowerTestStore((s) => s.setOpen);
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Derived during render (no effect): keeps the active slide valid even if
  // the slide list shrinks right after a CMS save.
  const active = Math.min(index, slides.length - 1);

  // Auto-advance; re-arms on every index change so a manual navigation
  // always gets a full interval before the next automatic slide.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = window.setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      autoplayMs
    );
    return () => window.clearTimeout(t);
  }, [index, paused, autoplayMs, slides.length]);

  const go = (dir: 1 | -1) =>
    setIndex((active + dir + slides.length) % slides.length);

  /** Slide CTA: "#flower-test" opens the test wizard, "#..." scrolls, else navigates. */
  const handleCta = (slide: HeroContent["slides"][number]) => {
    const href = slide.ctaHref?.trim();
    if (!href) return;
    if (href === "#flower-test") {
      openTest(true);
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(href);
  };

  const single = slides.length < 2;

  return (
    <section
      id="top"
      aria-label="بنر اصلی گلستان حافظ"
      aria-roledescription="اسلایدشو"
      aria-live={paused ? "polite" : "off"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative h-[92vh] min-h-[540px] w-full overflow-hidden bg-earth-dark"
    >
      {/* sliding track — RTL: slide 0 rests at the right edge, next slides wait on the left */}
      <div
        dir="rtl"
        className="flex h-full transition-transform duration-1000 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${active * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={`${i}-${slide.image}`}
            role="group"
            aria-roledescription="اسلاید"
            aria-label={`${i + 1} از ${slides.length}`}
            aria-hidden={i !== active}
            className="relative h-full w-full shrink-0"
          >
            <Image
              src={slide.image}
              alt={slide.alt || "بنر گلستان حافظ"}
              fill
              priority={i === 0}
              // Hidden carousel slides must not compete for bandwidth at
              // startup — lazy-load them, they fetch when first shown.
              loading={i === 0 ? undefined : "lazy"}
              sizes="100vw"
              className={`object-cover ${i === active ? "gh-kenburns" : ""}`}
            />
          </div>
        ))}
      </div>

      {/* dark cinematic overlay + rain texture — shared across slides */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-earth-dark/70 via-transparent to-earth-dark/40" />
      <div
        className="gh-rain pointer-events-none absolute inset-0 z-[1] opacity-60"
        aria-hidden="true"
      />

      {/* per-slide banner text — Persian badge above the poetic Latin caption */}
      <div className="pointer-events-none absolute inset-0 z-[2]">
        {slides.map((slide, i) => (
          <div
            key={`copy-${i}-${slide.image}`}
            aria-hidden={i !== active}
            className={`absolute inset-0 ${
              i === active ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div
              className={`absolute bottom-14 left-6 max-w-[360px] transition-opacity duration-700 md:left-20 ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="mb-3 inline-block border border-cream/35 bg-earth-dark/25 px-4 py-2 text-[11px] font-medium text-cream/90 backdrop-blur-sm">
                {slide.label}
              </span>
              <p className="gh-label !text-cream/85 leading-[1.9] !tracking-[0.18em] text-[10.5px]">
                {slide.caption}
              </p>
              {slide.ctaLabel?.trim() && (
                <button
                  type="button"
                  onClick={() => handleCta(slide)}
                  className="mt-5 flex items-center gap-2 bg-cream px-5 py-3 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {slide.ctaLabel}
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* arrows — RTL reading flow: previous on the right, next on the left */}
      {!single && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="اسلاید قبلی"
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-earth-dark/30 text-cream/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-cream/15 hover:text-cream md:right-8"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="اسلاید بعدی"
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-earth-dark/30 text-cream/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-cream/15 hover:text-cream md:left-8"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* slide dots — thin editorial bars */}
      {!single && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`رفتن به اسلاید ${i + 1}`}
              aria-current={i === active}
              className="flex h-6 w-8 items-center justify-center"
            >
              <span
                className={`h-[2px] rounded-full transition-all duration-500 ${
                  i === active
                    ? "w-7 bg-cream"
                    : "w-3.5 bg-cream/40 hover:bg-cream/70"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
