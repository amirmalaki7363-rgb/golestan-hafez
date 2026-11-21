import type {
  HeroSlideT,
  SiteContent,
} from "@/lib/site-content-schema";

/**
 * Zod-free defaults for the storefront content.
 *
 * This module is imported at runtime by client components (hero slides,
 * collections, occasions, …). It deliberately does NOT import zod — the
 * schema lives in site-content-schema.ts and is referenced here with
 * `import type` only, so the validator (≈95KB in dev) never ships to the
 * browser just to render a few default strings.
 *
 * The schema file re-exports these constants for server-side convenience.
 */

/** Fully-populated defaults — also used when DB read fails. */
export const DEFAULT_HERO_SLIDE_MOTHERS_DAY: HeroSlideT = {
  image: "/images/hero-mothers-day.jpg",
  alt: "هدیه‌ی گل روز مادر — دسته‌گل پیونی و رز با جعبه هدیه و کارت تبریک از گلستان حافظ",
  label: "ویـــژه‌ی روز مــادر",
  caption:
    "For the first garden we ever knew — a Mother's Day gift wrapped in petals, gratitude and every soft colour of her love.",
  ctaLabel: "",
  ctaHref: "",
};

/** Raffle hero slide — every purchase enters the free-bouquet draw. */
export const DEFAULT_HERO_SLIDE_RAFFLE: HeroSlideT = {
  image: "/images/hero-raffle.jpg",
  alt: "دسته‌گل هدیه در کنار سطل طلایی قرعه‌کشی — هدیه‌ی دسته‌گل رایگان به برندگان خوش‌شانس گلستان حافظ",
  label: "قرعه‌کشــی گلســتان حافظ",
  caption:
    "Every order is a golden ticket — several lucky hearts will receive a complimentary bouquet as our gift from Golestane Hafez.",
  ctaLabel: "برای شانس بردن خرید کنید",
  ctaHref: "#collections",
};

/** Flower-personality-test hero slide. */
export const DEFAULT_HERO_SLIDE_FLOWER_TEST: HeroSlideT = {
  image: "/images/hero-flower-test.jpg",
  alt: "دسته‌گل‌های متفاوت با شخصیت‌های گوناگون — تست شخصیت‌شناسی گل گلستان حافظ",
  label: "تست شخصیت‌شناسی گل",
  caption:
    "Ten questions, two minutes — let the flowers that match your soul choose you.",
  ctaLabel: "شروع تست شخصیت‌شناسی",
  ctaHref: "#flower-test",
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    slides: [
      DEFAULT_HERO_SLIDE_MOTHERS_DAY,
      DEFAULT_HERO_SLIDE_RAFFLE,
      {
        image: "/images/hero.jpg",
        alt: "گل استرلیتزیا نارنجی با قطرات باران — استودیو گل گلستان حافظ",
        label: "استودیو گلستان حافظ",
        caption:
          "The flowers seem to bloom differently beneath the golden light — carrying the warmth of Hafez's verses in their petals, while embracing the gentle melancholy of shorter days.",
        ctaLabel: "",
        ctaHref: "",
      },
      DEFAULT_HERO_SLIDE_FLOWER_TEST,
    ],
    autoplayMs: 6000,
  },
  whatsapp: {
    text: "برای ثبت سفارش‌هاتون با شماره واتس‌آپ زیر در ارتباط باشید",
    phone: "09127385527",
  },
  collections: {
    heading: "Collections",
    roseBox: {
      image: "/images/rose-box.jpg",
      alt: "باکس ویژه رز — مملو از رز قرمز",
      title: "ROSE BOX",
      desc: "A signature box of the season — one hundred velvet red roses gathered in the house wrap.",
      fa: "باکس ویـــژه رز",
    },
    occasionBouquet: {
      image: "/images/occasion-bouquet-warm.jpg",
      alt: "دسته‌گل مناسبتی — دسته‌گل ویژه روز مادر",
      title: "OCCASION BOUQUET",
      desc: "A bouquet made for every occasion — tender blooms gathered with love for Mother's Day and all of life's sweetest celebrations.",
      fa: "دستــه‌گــل مناسبتی",
    },
    flowerBox: {
      image: "/images/flower-box.jpg",
      alt: "باکس گل — بانوی نیلی‌پوش با گل‌های پاییزی",
      title: "FLOWER BOX",
      desc: "A flower is a vast sub-world of joy; including wind-blown agents, the bee's odyssey, the endless hum of colours, and a strange feeling, like a thought wearing a wedding gown — to present a gift of soul and split heart hand-over, hand-over, hand-over...",
      fa: "باکــس گــل",
    },
    bouquets: {
      image: "/images/bouquets.jpg",
      alt: "دسته‌گل — بانوی کلاه‌به‌سری با دسته‌گل پاییزی",
      title: "BOUQUETS",
      desc: "A flower is a vast sub-world of joy; including wind-blown agents, the bee's odyssey, the endless hum of colours, and a strange feeling, like a thought wearing a wedding gown — to present a gift of soul and split heart.",
      fa: "دستــه گــل",
    },
  },
  autumn: {
    label: "Autumn Collection",
    title: "Golestane Hafez in Autumn",
    description: "Earthy tones, soft petals — a limited seasonal story.",
    image: "/images/autumn.jpg",
    imageAlt: "کالکشن پاییز گلستان حافظ — بانویی با یقه گلدوزی‌شده میان گل‌های پاییزی",
    cta: "View Collection",
  },
  vip: {
    label: "Golestane Hafez Royal",
    title: "VIP",
    subtitle: "Rare blooms, boxed for exceptional occasions.",
    image: "/images/vip-bg.jpg",
    imageAlt: "سالن مخملی قرمز با طاق طلایی و گل‌های رز — کالکشن VIP گلستان حافظ",
    cta: "View Collection",
  },
  occasions: {
    label: "For Every Moment",
    title: "مناسبت‌ها",
    items: [
      { fa: "عروسی", en: "Wedding Ceremony", image: "/images/occasion-wedding-warm.jpg" },
      { fa: "تولد", en: "Birthday", image: "/images/occasion-birthday-warm.jpg" },
      { fa: "جشن", en: "Celebration", image: "/images/occasion-celebration.jpg" },
      { fa: "همایش", en: "Conference", image: "/images/occasion-assembly.jpg" },
    ],
  },
  beyond: {
    fa: "ارسال در تهــران و اصفهــان",
    title: "GOLESTANE HAFEZ BEYOND",
    description:
      "A flower is a vase-like structure of joy, including wind-blown agents, the bee's odyssey, the endless hum of colours, and a strange feeling, like a thought wearing a wedding gown — across Tehran and Isfahan, from our ateliers to your door.",
    image: "/images/beyond-starry-v8.jpg",
    imageAlt: "ون سفید گلستان حافظ با نقاشی شب پرستاره ونگوگ و گل‌ها — ارسال در تهران و اصفهان",
    wordmark: "GOLESTANE HAFEZ",
  },
  galleries: {
    label: "Golestane Hafez Galleries",
    title: "شعبه‌های گلستان حافظ",
    stores: [
      { name: "شعبه اصفهان — شیخ صدوق", image: "/images/store-isfahan.jpg" },
      { name: "شعبه تهران — دیباجی", image: "/images/store-tehran.jpg" },
    ],
  },
  instagram: {
    label: "The Golestane Hafez Journals",
    title: "در اینستاگرام گلستان حافظ",
    handle: "GolestaneHafez",
    url: "https://www.instagram.com/golestanehafez",
    images: [
      "/images/ig1.jpg",
      "/images/ig2.jpg",
      "/images/journal-roses.jpg",
      "/images/journal-florist.jpg",
    ],
  },
};
