import { z } from "zod";
import { DEFAULT_HERO_SLIDE_MOTHERS_DAY } from "./site-content-defaults";

/**
 * Site content model — every editable text/image on the storefront.
 * Client-safe module (no db import) so admin UI can reuse the schema.
 *
 * Defaults live in site-content-defaults.ts (zod-free, importable by the
 * storefront bundle); the zod schema only validates.
 * (zod v4 does not apply nested defaults, so we never rely on them.)
 */

export const SITE_CONTENT_KEY = "siteContent";

/* ---------------------------------- types ---------------------------------- */

const cardShape = {
  image: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(2000),
  title: z.string().trim().max(120),
  desc: z.string().trim().max(2000),
  fa: z.string().trim().max(120),
};

const shortStr = z.string().trim().min(1).max(80);
const textStr = z.string().trim().max(2000);
const pathStr = z.string().trim().min(1).max(500);

export const siteContentSchema = z.object({
  hero: z.object({
    /** Banner slides — auto-advancing carousel, arrow-navigable. */
    slides: z
      .array(
        z.object({
          image: pathStr,
          alt: textStr,
          /** Small Persian badge shown on the banner (e.g. «ویژه‌ی روز مادر»). */
          label: shortStr,
          /** Poetic Latin caption, bottom-left like the reference. */
          caption: textStr,
          /** Optional CTA button. ctaHref="#flower-test" opens the test wizard. */
          ctaLabel: z.string().trim().max(80).optional(),
          ctaHref: z.string().trim().max(300).optional(),
        })
      )
      .min(1)
      .max(6),
    /** Auto-advance interval in ms (clamped 3s–15s). */
    autoplayMs: z.number().int().min(3000).max(15000),
  }),
  whatsapp: z.object({
    text: z.string().trim().min(1).max(300),
    phone: z.string().trim().min(1).max(20),
  }),
  collections: z.object({
    heading: shortStr,
    roseBox: z.object(cardShape),
    occasionBouquet: z.object(cardShape),
    flowerBox: z.object(cardShape),
    bouquets: z.object(cardShape),
  }),
  autumn: z.object({
    label: shortStr,
    title: shortStr,
    description: z.string().trim().min(1).max(1000),
    image: pathStr,
    imageAlt: textStr,
    cta: shortStr,
  }),
  vip: z.object({
    label: shortStr,
    title: shortStr,
    subtitle: z.string().trim().min(1).max(300),
    image: pathStr,
    imageAlt: textStr,
    cta: shortStr,
  }),
  occasions: z.object({
    label: shortStr,
    title: shortStr,
    items: z
      .array(
        z.object({
          fa: shortStr,
          en: shortStr,
          image: pathStr,
        })
      )
      .min(1)
      .max(8),
  }),
  beyond: z.object({
    fa: shortStr,
    title: shortStr,
    description: z.string().trim().min(1).max(1000),
    image: pathStr,
    imageAlt: textStr,
    wordmark: shortStr,
  }),
  galleries: z.object({
    label: shortStr,
    title: shortStr,
    stores: z
      .array(z.object({ name: shortStr, image: pathStr }))
      .min(1)
      .max(4),
  }),
  instagram: z.object({
    label: shortStr,
    title: shortStr,
    handle: shortStr,
    url: z.string().trim().min(1).max(300),
    images: z.array(pathStr).min(1).max(8),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type HeroSlideT = SiteContent["hero"]["slides"][number];
export type CollectionCardT = SiteContent["collections"]["roseBox"];
export type OccasionItemT = SiteContent["occasions"]["items"][number];
export type StoreItemT = SiteContent["galleries"]["stores"][number];

/* ------------------------- hero migration helpers ------------------------- */

/**
 * Legacy hero was a single { image, alt, caption } object; the banner
 * carousel needs slides. Normalizes any stored payload (legacy or current)
 * into the new shape BEFORE zod validation, so existing saves never break.
 */
export function normalizeSiteContent(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  if (typeof obj.hero !== "object" || obj.hero === null) return obj;

  const h = { ...(obj.hero as Record<string, unknown>) };
  const rawSlides = Array.isArray(h.slides) ? h.slides : [];

  if (rawSlides.length === 0) {
    // Legacy single-image hero → the signature slide (kept as slide 2,
    // right after the Mother's Day banner that leads the carousel).
    const legacy = h as { image?: unknown; alt?: unknown; caption?: unknown };
    const ownSlide = {
      image:
        typeof legacy.image === "string" && legacy.image.trim()
          ? legacy.image
          : "/images/hero.jpg",
      alt: typeof legacy.alt === "string" ? legacy.alt : "",
      label: "استودیو گلستان حافظ",
      caption: typeof legacy.caption === "string" ? legacy.caption : "",
      ctaLabel: "",
      ctaHref: "",
    };
    h.slides = [DEFAULT_HERO_SLIDE_MOTHERS_DAY, ownSlide];
  } else {
    h.slides = rawSlides.slice(0, 6).map((s) => {
      const slide = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
      return {
        image:
          typeof slide.image === "string" && slide.image.trim()
            ? slide.image
            : "/images/hero.jpg",
        alt: typeof slide.alt === "string" ? slide.alt : "",
        label:
          typeof slide.label === "string" && slide.label.trim()
            ? slide.label
            : "گلستان حافظ",
        caption: typeof slide.caption === "string" ? slide.caption : "",
        ctaLabel: typeof slide.ctaLabel === "string" ? slide.ctaLabel : "",
        ctaHref: typeof slide.ctaHref === "string" ? slide.ctaHref : "",
      };
    });
  }

  const ms = typeof h.autoplayMs === "number" && Number.isFinite(h.autoplayMs)
    ? Math.round(h.autoplayMs)
    : 6000;
  h.autoplayMs = Math.min(15000, Math.max(3000, ms));

  delete h.image;
  delete h.alt;
  delete h.caption;
  obj.hero = h;
  return obj;
}

/* ------------------------------ default values ----------------------------- */

/**
 * The fully-populated default content lives in site-content-defaults.ts —
 * a zod-free module so client components can use it without shipping the
 * validator to the browser. Re-exported here for server-side convenience.
 */
export {
  DEFAULT_SITE_CONTENT,
  DEFAULT_HERO_SLIDE_MOTHERS_DAY,
  DEFAULT_HERO_SLIDE_RAFFLE,
  DEFAULT_HERO_SLIDE_FLOWER_TEST,
} from "./site-content-defaults";
