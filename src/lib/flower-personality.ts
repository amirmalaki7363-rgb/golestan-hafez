/**
 * «شخصیت‌شناسی گل» — Golestane Hafez flower personality engine.
 *
 * A shared, pure (client + server safe) module powering BOTH tests:
 *   - SELF  : «MY FLOWER PERSONALITY» — the buyer's own taste.
 *   - OTHER : «SOMEONE'S FLOWER PERSONALITY» — taste of the recipient,
 *             predicted from the buyer's knowledge of them.
 *
 * Inspired by a few MBTI-like behavioural angles, but strictly a taste /
 * marketing classification — never presented as a scientific or
 * psychological test.
 *
 * Design principles (from the product spec):
 *   - Every answer scores several INDEPENDENT axes; the result is never a
 *     random personality picked from a majority count.
 *   - Direct questions (color / flower / presentation / size / packaging)
 *     carry much more weight than behavioural questions.
 *   - "نمی‌دانم" (unknown) options never score — the engine simply has
 *     less data and shows a lower confidence.
 *   - Direct answers always win over behavioural guesses when they conflict.
 *   - Gender / age / family relation NEVER determine taste — context only.
 *   - The output is a usable flower profile (color, flowers, presentation,
 *     size, arrangement style, packaging) — not just a title.
 *
 * Future features (occasion/season/budget recommendations, AI bouquet
 * preview, purchase history comparison) can build on these profiles.
 */

/* ---------------------------------- types --------------------------------- */

export type TestKind = "SELF" | "OTHER";

export type ColorKey = "LIGHT_NEUTRAL" | "PASTEL_PINK" | "DEEP_RED" | "VIBRANT_MIX";
export type FlowerKey =
  | "ROSE"
  | "PEONY"
  | "TULIP"
  | "ORCHID"
  | "GERBERA"
  | "LILY"
  | "HYDRANGEA"
  | "SUNFLOWER"
  | "LISIANTHUS"
  | "WILD";
export type PresentationKey = "BOUQUET" | "BOX" | "BASKET" | "SINGLE" | "ARTISTIC_MIX";
export type SizeKey = "SMALL" | "MEDIUM" | "LARGE" | "GRAND";
export type PackagingKey = "SIMPLE" | "LUXURY_WRAP" | "DESIGNER_BOX" | "NATURAL_ART";
export type AestheticKey = "MINIMAL" | "CLASSIC" | "LUXURY" | "ARTISTIC" | "NATURAL" | "VIBRANT";
export type SocialKey = "EXTRAVERT" | "INTROVERT" | "AFFECTIONATE" | "INDEPENDENT";

export type PersonalityKey =
  | "ROMANTIC_ARTIST"
  | "CALM_MINIMALIST"
  | "LUXURY_LOVER"
  | "NATURAL_SOUL"
  | "CLASSIC_ELEGANCE"
  | "COLORFUL_SPIRIT"
  | "UNIQUE_TASTE"
  | "DREAMY_SOUL";

/** Flat axis:value score keys, e.g. "color:DEEP_RED". */
export type ScoreMap = Record<string, number>;

export interface QuestionOption {
  key: string; // "A" ... "F"
  label: string;
  /** Final (already weighted) points this option adds to each axis value. */
  scores?: ScoreMap;
  /** Color-question swatch (CSS colors, rendered as elegant dots). */
  palette?: ColorKey;
  /** Flower-question photo. */
  image?: string;
  /** «نمی‌دانم» — records the answer but never scores. */
  unknown?: boolean;
}

export interface Question {
  id: number;
  text: string;
  kind: "behavioral" | "direct";
  options: QuestionOption[];
}

export interface Answer {
  q: number;
  a: string; // option key; empty string when skipped
}

export interface RecipientMeta {
  relationship?: string;
  gender?: string;
  ageRange?: string;
  knowledge?: "HIGH" | "MEDIUM" | "LOW" | "";
  pastPurchase?: "SATISFIED" | "UNSURE" | "FIRST_TIME" | "";
}

export interface TasteProfile {
  personality: PersonalityKey;
  confidence: number;
  color: ColorKey | null;
  flowers: FlowerKey[];
  presentation: PresentationKey | null;
  size: SizeKey | null;
  packaging: PackagingKey | null;
  unknownCount: number;
  directAnswered: number; // how many direct axes had a real answer (0-5)
}

/* --------------------------------- labels --------------------------------- */

export const COLOR_LABELS: Record<ColorKey, string> = {
  LIGHT_NEUTRAL: "سفید، کرم و شامپاینی",
  PASTEL_PINK: "صورتی، گلبهی و پاستلی",
  DEEP_RED: "قرمز، زرشکی و شرابی",
  VIBRANT_MIX: "رنگ‌های متنوع و پرانرژی",
};

/** Elegant CSS dots for the color-question cards + profile chips. */
export const PALETTE_SWATCHES: Record<ColorKey, string[]> = {
  LIGHT_NEUTRAL: ["#f5efe3", "#e8dcc8", "#d9c9b2", "#c2ad8c"],
  PASTEL_PINK: ["#f7d9e2", "#eec3cf", "#ddabbb", "#c387a2"],
  DEEP_RED: ["#5e1620", "#7a1f2b", "#97262f", "#a63446"],
  VIBRANT_MIX: ["#d94f70", "#e4572e", "#f3a712", "#3f8262"],
};

export const FLOWER_LABELS: Record<FlowerKey, string> = {
  ROSE: "رز هلندی",
  PEONY: "پیونی",
  TULIP: "لاله",
  ORCHID: "ارکیده",
  GERBERA: "جربرا",
  LILY: "لیلیوم",
  HYDRANGEA: "هورتنزیا",
  SUNFLOWER: "آفتابگردان",
  LISIANTHUS: "لیسیانتوس",
  WILD: "گل‌های فصلی و وحشی",
};

export const FLOWER_IMAGES: Record<FlowerKey, string> = {
  ROSE: "/images/personality/rose-dutch.jpg",
  PEONY: "/images/personality/peony.jpg",
  TULIP: "/images/personality/tulip.jpg",
  ORCHID: "/images/personality/orchid.png",
  GERBERA: "/images/personality/gerbera.jpg",
  LILY: "/images/personality/lily.jpg",
  HYDRANGEA: "/images/personality/hydrangea.jpg",
  SUNFLOWER: "/images/personality/sunflower.jpg",
  LISIANTHUS: "/images/personality/lisianthus.jpg",
  WILD: "/images/personality/wildflower.jpg",
};

export const PRESENTATION_LABELS: Record<PresentationKey, string> = {
  BOUQUET: "دسته‌گل",
  BOX: "باکس گل",
  BASKET: "سبد گل",
  SINGLE: "تک‌شاخه خاص",
  ARTISTIC_MIX: "ترکیب هنری و خلاقانه",
};

export const SIZE_LABELS: Record<SizeKey, string> = {
  SMALL: "کوچک، ظریف و مینیمال",
  MEDIUM: "متوسط و متعادل",
  LARGE: "بزرگ و چشمگیر",
  GRAND: "بسیار بزرگ، باشکوه و مجلل",
};

export const PACKAGING_LABELS: Record<PackagingKey, string> = {
  SIMPLE: "کاغذ ساده، ظریف و شیک",
  LUXURY_WRAP: "بسته‌بندی لوکس و چندلایه",
  DESIGNER_BOX: "جعبه خاص و طراحی‌شده",
  NATURAL_ART: "بسته‌بندی طبیعی و هنری",
};

export const AESTHETIC_LABELS: Record<AestheticKey, string> = {
  MINIMAL: "مینیمال",
  CLASSIC: "کلاسیک",
  LUXURY: "لوکس",
  ARTISTIC: "هنری",
  NATURAL: "طبیعی",
  VIBRANT: "پرانرژی",
};

/* ------------------------------ recipient meta ----------------------------- */

export const RELATIONSHIPS = [
  "مادر",
  "پدر",
  "همسر",
  "نامزد",
  "دوست دختر",
  "دوست پسر",
  "خواهر",
  "برادر",
  "دوست",
  "معلم",
  "همکار",
  "یکی از اعضای خانواده",
  "شخص دیگر",
] as const;

export const GENDER_OPTIONS = ["زن", "مرد", "نامشخص"] as const;

export const AGE_RANGES = ["زیر ۱۸", "۱۸ تا ۲۵", "۲۵ تا ۳۵", "۳۵ تا ۵۰", "بالای ۵۰"] as const;

export const KNOWLEDGE_OPTIONS: { key: NonNullable<RecipientMeta["knowledge"]>; label: string }[] = [
  { key: "HIGH", label: "شناخت بسیار زیاد" },
  { key: "MEDIUM", label: "شناخت متوسط" },
  { key: "LOW", label: "شناخت محدود" },
];

export const PAST_PURCHASE_OPTIONS: {
  key: NonNullable<RecipientMeta["pastPurchase"]>;
  label: string;
}[] = [
  { key: "SATISFIED", label: "بله، و از انتخابم راضی بوده‌ام" },
  { key: "UNSURE", label: "بله، اما از سلیقه‌اش مطمئن نیستم" },
  { key: "FIRST_TIME", label: "خیر، اولین بار است" },
];

/* -------------------------------- questions ------------------------------- */

/** Test 1 — «MY FLOWER PERSONALITY» (the buyer's own taste). */
export const SELF_QUESTIONS: Question[] = [
  {
    id: 1,
    kind: "behavioral",
    text: "وقتی وارد یک محیط جدید می‌شوید، معمولاً چه چیزی بیشتر توجه شما را جلب می‌کند؟",
    options: [
      { key: "A", label: "آدم‌ها و ارتباطاتشان", scores: { "social:AFFECTIONATE": 2 } },
      { key: "B", label: "جزئیات، رنگ‌ها و زیبایی محیط", scores: { "aesthetic:ARTISTIC": 1, "aesthetic:CLASSIC": 1 } },
      { key: "C", label: "فضای کلی و حس‌وحال محیط", scores: { "social:INTROVERT": 1, "aesthetic:NATURAL": 1 } },
      { key: "D", label: "نظم، هماهنگی و چیدمان محیط", scores: { "aesthetic:CLASSIC": 2 } },
    ],
  },
  {
    id: 2,
    kind: "behavioral",
    text: "اگر بخواهید برای خودتان هدیه‌ای بخرید، کدام را انتخاب می‌کنید؟",
    options: [
      { key: "A", label: "چیزی خاص و متفاوت که کمتر کسی داشته باشد", scores: { "aesthetic:ARTISTIC": 2 } },
      { key: "B", label: "چیزی کلاسیک، اصیل و شیک", scores: { "aesthetic:CLASSIC": 2 } },
      { key: "C", label: "چیزی پر از رنگ و انرژی", scores: { "aesthetic:VIBRANT": 2, "color:VIBRANT_MIX": 1 } },
      { key: "D", label: "چیزی ساده، ظریف و مینیمال", scores: { "aesthetic:MINIMAL": 2 } },
    ],
  },
  {
    id: 3,
    kind: "behavioral",
    text: "در انتخاب یک هدیه، چه چیزی برای شما مهم‌تر است؟",
    options: [
      { key: "A", label: "احساسی که به گیرنده منتقل می‌کند", scores: { "social:AFFECTIONATE": 2 } },
      { key: "B", label: "زیبایی و ظاهر هدیه", scores: { "aesthetic:LUXURY": 1, "aesthetic:ARTISTIC": 1 } },
      { key: "C", label: "خاص و منحصربه‌فرد بودن آن", scores: { "aesthetic:ARTISTIC": 2 } },
      { key: "D", label: "ارزش، کیفیت و ماندگاری آن", scores: { "aesthetic:CLASSIC": 1, "aesthetic:LUXURY": 1 } },
    ],
  },
  {
    id: 4,
    kind: "behavioral",
    text: "کدام فضای بصری بیشتر به سلیقه شما نزدیک است؟",
    options: [
      { key: "A", label: "باغی پر از گل‌های رنگارنگ", scores: { "aesthetic:NATURAL": 1, "aesthetic:VIBRANT": 1, "color:VIBRANT_MIX": 1 } },
      { key: "B", label: "فضای مدرن با طراحی مینیمال", scores: { "aesthetic:MINIMAL": 2 } },
      { key: "C", label: "خانه‌ای کلاسیک، گرم و لوکس", scores: { "aesthetic:LUXURY": 2, "aesthetic:CLASSIC": 1 } },
      { key: "D", label: "فضای هنری، خلاقانه و متفاوت", scores: { "aesthetic:ARTISTIC": 2 } },
    ],
  },
  {
    id: 5,
    kind: "direct",
    text: "کدام ترکیب رنگی را بیشتر می‌پسندید؟",
    options: [
      { key: "A", label: COLOR_LABELS.LIGHT_NEUTRAL, palette: "LIGHT_NEUTRAL", scores: { "color:LIGHT_NEUTRAL": 3 } },
      { key: "B", label: COLOR_LABELS.PASTEL_PINK, palette: "PASTEL_PINK", scores: { "color:PASTEL_PINK": 3 } },
      { key: "C", label: COLOR_LABELS.DEEP_RED, palette: "DEEP_RED", scores: { "color:DEEP_RED": 3 } },
      { key: "D", label: COLOR_LABELS.VIBRANT_MIX, palette: "VIBRANT_MIX", scores: { "color:VIBRANT_MIX": 3 } },
    ],
  },
  {
    id: 6,
    kind: "direct",
    text: "کدام گل بیشتر شما را جذب می‌کند؟",
    options: [
      { key: "A", label: FLOWER_LABELS.ROSE, image: FLOWER_IMAGES.ROSE, scores: { "flower:ROSE": 3 } },
      { key: "B", label: FLOWER_LABELS.PEONY, image: FLOWER_IMAGES.PEONY, scores: { "flower:PEONY": 3 } },
      { key: "C", label: FLOWER_LABELS.TULIP, image: FLOWER_IMAGES.TULIP, scores: { "flower:TULIP": 3 } },
      { key: "D", label: FLOWER_LABELS.ORCHID, image: FLOWER_IMAGES.ORCHID, scores: { "flower:ORCHID": 3 } },
      { key: "E", label: FLOWER_LABELS.GERBERA, image: FLOWER_IMAGES.GERBERA, scores: { "flower:GERBERA": 3 } },
      { key: "F", label: FLOWER_LABELS.LILY, image: FLOWER_IMAGES.LILY, scores: { "flower:LILY": 3 } },
      { key: "G", label: FLOWER_LABELS.HYDRANGEA, image: FLOWER_IMAGES.HYDRANGEA, scores: { "flower:HYDRANGEA": 3 } },
      { key: "H", label: FLOWER_LABELS.SUNFLOWER, image: FLOWER_IMAGES.SUNFLOWER, scores: { "flower:SUNFLOWER": 3 } },
      { key: "I", label: FLOWER_LABELS.LISIANTHUS, image: FLOWER_IMAGES.LISIANTHUS, scores: { "flower:LISIANTHUS": 3 } },
      { key: "J", label: FLOWER_LABELS.WILD, image: FLOWER_IMAGES.WILD, scores: { "flower:WILD": 3 } },
    ],
  },
  {
    id: 7,
    kind: "direct",
    text: "کدام نوع ارائه گل را ترجیح می‌دهید؟",
    options: [
      { key: "A", label: "دسته‌گل", scores: { "presentation:BOUQUET": 2.5 } },
      { key: "B", label: "باکس گل", scores: { "presentation:BOX": 2.5 } },
      { key: "C", label: "سبد گل", scores: { "presentation:BASKET": 2.5 } },
      { key: "D", label: "یک شاخه گل خاص و متفاوت", scores: { "presentation:SINGLE": 2.5 } },
    ],
  },
  {
    id: 8,
    kind: "direct",
    text: "چه اندازه‌ای از گل را بیشتر می‌پسندید؟",
    options: [
      { key: "A", label: "کوچک، ظریف و مینیمال", scores: { "size:SMALL": 2.5 } },
      { key: "B", label: "متوسط و متعادل", scores: { "size:MEDIUM": 2.5 } },
      { key: "C", label: "بزرگ و چشمگیر", scores: { "size:LARGE": 2.5 } },
      { key: "D", label: "بسیار بزرگ، باشکوه و مجلل", scores: { "size:GRAND": 2.5 } },
    ],
  },
  {
    id: 9,
    kind: "behavioral",
    text: "اگر کسی بخواهد شما را با گل غافلگیر کند، کدام ترکیب را بیشتر دوست دارید؟",
    options: [
      { key: "A", label: "گل‌های یک‌رنگ و هماهنگ", scores: { "aesthetic:CLASSIC": 2 } },
      { key: "B", label: "چند رنگ مکمل و زیبا", scores: { "aesthetic:VIBRANT": 1, "color:VIBRANT_MIX": 1 } },
      { key: "C", label: "گل‌های خاص و کمیاب", scores: { "aesthetic:ARTISTIC": 2, "flower:WILD": 1 } },
      { key: "D", label: "ترکیب طبیعی، آزاد و نامتقارن", scores: { "aesthetic:NATURAL": 2 } },
    ],
  },
  {
    id: 10,
    kind: "direct",
    text: "کدام نوع بسته‌بندی را بیشتر می‌پسندید؟",
    options: [
      { key: "A", label: "کاغذ ساده، ظریف و شیک", scores: { "packaging:SIMPLE": 2.5 } },
      { key: "B", label: "بسته‌بندی لوکس و چندلایه", scores: { "packaging:LUXURY_WRAP": 2.5 } },
      { key: "C", label: "جعبه خاص و طراحی‌شده", scores: { "packaging:DESIGNER_BOX": 2.5 } },
      { key: "D", label: "بسته‌بندی طبیعی و هنری", scores: { "packaging:NATURAL_ART": 2.5 } },
    ],
  },
];

/** Test 2 — «SOMEONE'S FLOWER PERSONALITY» (the recipient, as the buyer knows them). */
export const OTHER_QUESTIONS: Question[] = [
  {
    id: 1,
    kind: "behavioral",
    text: "این شخص در جمع‌های دوستانه معمولاً چگونه رفتار می‌کند؟",
    options: [
      { key: "A", label: "اجتماعی، پرانرژی و اهل ارتباط است", scores: { "social:EXTRAVERT": 2 } },
      { key: "B", label: "آرام، کم‌حرف و بیشتر مشاهده‌گر است", scores: { "social:INTROVERT": 2 } },
      { key: "C", label: "صمیمی، عاطفی و توجه‌کننده به دیگران است", scores: { "social:AFFECTIONATE": 2 } },
      { key: "D", label: "مستقل، متفاوت و دارای سبک شخصی خودش است", scores: { "social:INDEPENDENT": 2 } },
    ],
  },
  {
    id: 2,
    kind: "behavioral",
    text: "در انتخاب لباس و وسایل شخصی، بیشتر چه سبکی دارد؟",
    options: [
      { key: "A", label: "رنگارنگ، جسورانه و متفاوت", scores: { "aesthetic:VIBRANT": 2, "color:VIBRANT_MIX": 1 } },
      { key: "B", label: "ساده، مینیمال و بدون جزئیات اضافه", scores: { "aesthetic:MINIMAL": 2 } },
      { key: "C", label: "کلاسیک، مرتب و هماهنگ", scores: { "aesthetic:CLASSIC": 2 } },
      { key: "D", label: "خاص، هنری و غیرمعمول", scores: { "aesthetic:ARTISTIC": 2 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 3,
    kind: "behavioral",
    text: "اگر به خانه یا محل کار او توجه کنید، کدام توصیف مناسب‌تر است؟",
    options: [
      { key: "A", label: "محیطی رنگارنگ و پرانرژی", scores: { "aesthetic:VIBRANT": 2 } },
      { key: "B", label: "محیطی ساده، خلوت و منظم", scores: { "aesthetic:MINIMAL": 2 } },
      { key: "C", label: "محیطی گرم، صمیمی و پر از جزئیات", scores: { "social:AFFECTIONATE": 1, "aesthetic:CLASSIC": 1 } },
      { key: "D", label: "محیطی شیک، لوکس و چشمگیر", scores: { "aesthetic:LUXURY": 2 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 4,
    kind: "behavioral",
    text: "به نظر شما این شخص بیشتر چه چیزی را در هدیه ارزشمند می‌داند؟",
    options: [
      { key: "A", label: "احساس و محبتی که پشت هدیه است", scores: { "social:AFFECTIONATE": 2 } },
      { key: "B", label: "زیبایی و ظاهر هدیه", scores: { "aesthetic:LUXURY": 1, "aesthetic:ARTISTIC": 1 } },
      { key: "C", label: "خاص بودن و متفاوت بودن هدیه", scores: { "aesthetic:ARTISTIC": 2 } },
      { key: "D", label: "کیفیت، ارزش و اصالت هدیه", scores: { "aesthetic:CLASSIC": 1, "aesthetic:LUXURY": 1 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 5,
    kind: "direct",
    text: "کدام ترکیب رنگی احتمالاً بیشتر مورد علاقه اوست؟",
    options: [
      { key: "A", label: COLOR_LABELS.LIGHT_NEUTRAL, palette: "LIGHT_NEUTRAL", scores: { "color:LIGHT_NEUTRAL": 3 } },
      { key: "B", label: COLOR_LABELS.PASTEL_PINK, palette: "PASTEL_PINK", scores: { "color:PASTEL_PINK": 3 } },
      { key: "C", label: COLOR_LABELS.DEEP_RED, palette: "DEEP_RED", scores: { "color:DEEP_RED": 3 } },
      { key: "D", label: COLOR_LABELS.VIBRANT_MIX, palette: "VIBRANT_MIX", scores: { "color:VIBRANT_MIX": 3 } },
      { key: "E", label: "مطمئن نیستم", unknown: true },
    ],
  },
  {
    id: 6,
    kind: "direct",
    text: "اگر بخواهید حدس بزنید، کدام گل را بیشتر دوست دارد؟",
    options: [
      { key: "A", label: FLOWER_LABELS.ROSE, image: FLOWER_IMAGES.ROSE, scores: { "flower:ROSE": 3 } },
      { key: "B", label: FLOWER_LABELS.PEONY, image: FLOWER_IMAGES.PEONY, scores: { "flower:PEONY": 3 } },
      { key: "C", label: FLOWER_LABELS.TULIP, image: FLOWER_IMAGES.TULIP, scores: { "flower:TULIP": 3 } },
      { key: "D", label: FLOWER_LABELS.ORCHID, image: FLOWER_IMAGES.ORCHID, scores: { "flower:ORCHID": 3 } },
      { key: "E", label: FLOWER_LABELS.GERBERA, image: FLOWER_IMAGES.GERBERA, scores: { "flower:GERBERA": 3 } },
      { key: "F", label: FLOWER_LABELS.LILY, image: FLOWER_IMAGES.LILY, scores: { "flower:LILY": 3 } },
      { key: "G", label: FLOWER_LABELS.HYDRANGEA, image: FLOWER_IMAGES.HYDRANGEA, scores: { "flower:HYDRANGEA": 3 } },
      { key: "H", label: FLOWER_LABELS.SUNFLOWER, image: FLOWER_IMAGES.SUNFLOWER, scores: { "flower:SUNFLOWER": 3 } },
      { key: "I", label: FLOWER_LABELS.LISIANTHUS, image: FLOWER_IMAGES.LISIANTHUS, scores: { "flower:LISIANTHUS": 3 } },
      { key: "J", label: FLOWER_LABELS.WILD, image: FLOWER_IMAGES.WILD, scores: { "flower:WILD": 3 } },
      { key: "K", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 7,
    kind: "direct",
    text: "به نظر شما کدام نوع هدیه گل برای او جذاب‌تر است؟",
    options: [
      { key: "A", label: "دسته‌گل کلاسیک", scores: { "presentation:BOUQUET": 2.5 } },
      { key: "B", label: "باکس گل لوکس", scores: { "presentation:BOX": 2.5 } },
      { key: "C", label: "سبد گل", scores: { "presentation:BASKET": 2.5 } },
      { key: "D", label: "یک شاخه گل خاص و ظریف", scores: { "presentation:SINGLE": 2.5 } },
      { key: "E", label: "ترکیب خلاقانه و هنری", scores: { "presentation:ARTISTIC_MIX": 2.5 } },
      { key: "F", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 8,
    kind: "direct",
    text: "چه حجمی از گل با شخصیت و سبک زندگی او هماهنگ‌تر است؟",
    options: [
      { key: "A", label: "گل کوچک و ظریف", scores: { "size:SMALL": 2.5 } },
      { key: "B", label: "گل متوسط و متعادل", scores: { "size:MEDIUM": 2.5 } },
      { key: "C", label: "گل بزرگ و چشمگیر", scores: { "size:LARGE": 2.5 } },
      { key: "D", label: "گل بسیار بزرگ و مجلل", scores: { "size:GRAND": 2.5 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 9,
    kind: "behavioral",
    text: "اگر بخواهید او را غافلگیر کنید، کدام مدل چیدمان را انتخاب می‌کنید؟",
    options: [
      { key: "A", label: "یکدست، مرتب و متقارن", scores: { "aesthetic:CLASSIC": 2 } },
      { key: "B", label: "طبیعی، آزاد و نامتقارن", scores: { "aesthetic:NATURAL": 2 } },
      { key: "C", label: "متنوع، رنگارنگ و پرجزئیات", scores: { "aesthetic:VIBRANT": 2 } },
      { key: "D", label: "مینیمال، ظریف و هنری", scores: { "aesthetic:MINIMAL": 1, "aesthetic:ARTISTIC": 1 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
  {
    id: 10,
    kind: "direct",
    text: "به نظر شما کدام نوع بسته‌بندی بیشتر او را خوشحال می‌کند؟",
    options: [
      { key: "A", label: "بسته‌بندی ساده و شیک", scores: { "packaging:SIMPLE": 2.5 } },
      { key: "B", label: "بسته‌بندی لوکس و باشکوه", scores: { "packaging:LUXURY_WRAP": 2.5 } },
      { key: "C", label: "جعبه خاص و طراحی‌شده", scores: { "packaging:DESIGNER_BOX": 2.5 } },
      { key: "D", label: "بسته‌بندی طبیعی و هنری", scores: { "packaging:NATURAL_ART": 2.5 } },
      { key: "E", label: "نمی‌دانم", unknown: true },
    ],
  },
];

export const QUESTION_BANKS: Record<TestKind, Question[]> = {
  SELF: SELF_QUESTIONS,
  OTHER: OTHER_QUESTIONS,
};

/* ------------------------------- personalities ------------------------------ */

export interface PersonalityDef {
  key: PersonalityKey;
  fa: string;
  en: string;
  image: string;
  description: string;
  /** Affinity of this personality toward axis values — used by the matcher. */
  affinity: ScoreMap;
  /** Fallback recommendation when a direct axis has no answer. */
  defaults: {
    colors: ColorKey[];
    flowers: FlowerKey[];
    presentation: PresentationKey;
    size: SizeKey;
    packaging: PackagingKey;
    style: string;
  };
}

export const PERSONALITIES: PersonalityDef[] = [
  {
    key: "ROMANTIC_ARTIST",
    fa: "رمانتیک هنرمند",
    en: "Romantic Artist",
    image: "/images/personality/romantic-artist.jpg",
    description:
      "شما به زیبایی‌های ظریف، ترکیب‌های هماهنگ و جزئیاتی علاقه دارید که احساس خاصی منتقل می‌کنند. برایتان مهم است که یک دسته‌گل حرف بزند؛ لهجه‌ای از احساس، امضایی هنری و رنگی که ماندگار شود. گل‌های لطیف با چیدمانی رمانتیک و امضای هنری دنیای شما را به‌خوبی روایت می‌کنند.",
    affinity: {
      "aesthetic:ARTISTIC": 3,
      "aesthetic:VIBRANT": 1,
      "social:AFFECTIONATE": 2,
      "color:PASTEL_PINK": 2,
      "color:DEEP_RED": 1,
      "flower:PEONY": 3,
      "flower:ROSE": 2,
      "flower:LISIANTHUS": 2,
      "size:MEDIUM": 1,
      "size:LARGE": 1,
      "packaging:LUXURY_WRAP": 1,
    },
    defaults: {
      colors: ["PASTEL_PINK"],
      flowers: ["PEONY", "ROSE"],
      presentation: "BOUQUET",
      size: "MEDIUM",
      packaging: "LUXURY_WRAP",
      style: "رمانتیک و هنری",
    },
  },
  {
    key: "CALM_MINIMALIST",
    fa: "مینیمالیست آرام",
    en: "Calm Minimalist",
    image: "/images/personality/calm-minimalist.jpg",
    description:
      "شما زیبایی را در سادگی می‌بینید؛ بدون شلوغی، بدون اجبار. چند شاخه‌ی درست، یک رنگ آرام و ظرافتی بی‌صدا برایتان از هر ترکیب پرجزئیات گران‌بهاتر است. انتخاب‌هایتان تمیز، مدرن و آرامش‌بخش است.",
    affinity: {
      "aesthetic:MINIMAL": 4,
      "social:INTROVERT": 1,
      "color:LIGHT_NEUTRAL": 3,
      "flower:TULIP": 2,
      "flower:ORCHID": 1,
      "flower:LILY": 1,
      "presentation:SINGLE": 1,
      "presentation:BOUQUET": 1,
      "size:SMALL": 2,
      "packaging:SIMPLE": 2,
    },
    defaults: {
      colors: ["LIGHT_NEUTRAL"],
      flowers: ["TULIP"],
      presentation: "BOUQUET",
      size: "SMALL",
      packaging: "SIMPLE",
      style: "مینیمال و مدرن",
    },
  },
  {
    key: "LUXURY_LOVER",
    fa: "عاشق تجمل",
    en: "Luxury Lover",
    image: "/images/personality/luxury-lover.jpg",
    description:
      "برای شما گل فقط یک هدیه نیست؛ یک تجربه‌ی باشکوه است. کیفیت، اصالت و جلوه‌ی چشمگیر چیزی است که نظر شما را جلب می‌کند. باکس‌های پر از گل‌های کمیاب، رنگ‌های عمیق و بسته‌بندی‌های چندلایه، سلیقه‌ی شما را به تصویر می‌کشند.",
    affinity: {
      "aesthetic:LUXURY": 4,
      "aesthetic:CLASSIC": 1,
      "color:DEEP_RED": 2,
      "color:LIGHT_NEUTRAL": 1,
      "flower:ORCHID": 2,
      "flower:ROSE": 2,
      "flower:HYDRANGEA": 2,
      "flower:LILY": 1,
      "presentation:BOX": 2,
      "size:GRAND": 2,
      "size:LARGE": 1,
      "packaging:LUXURY_WRAP": 2,
      "packaging:DESIGNER_BOX": 1,
    },
    defaults: {
      colors: ["DEEP_RED"],
      flowers: ["ROSE", "ORCHID"],
      presentation: "BOX",
      size: "GRAND",
      packaging: "LUXURY_WRAP",
      style: "لوکس و باشکوه",
    },
  },
  {
    key: "NATURAL_SOUL",
    fa: "طبیعت‌گرای آزاد",
    en: "Natural Soul",
    image: "/images/personality/natural-soul.jpg",
    description:
      "شما عاشق حس طبیعی و آزاد گل‌ها هستید؛ چیدمانی که مثل باغ به نظر برسد، نه یک دسته‌ی رسمی. گل‌های فصلی، سبزی برگ‌ها و ترکیب‌های نامتقارن و زنده، دقیقاً همان دنیایی است که به آن تعلق دارید.",
    affinity: {
      "aesthetic:NATURAL": 4,
      "color:VIBRANT_MIX": 1,
      "color:LIGHT_NEUTRAL": 1,
      "flower:WILD": 4,
      "flower:SUNFLOWER": 2,
      "presentation:BOUQUET": 1,
      "presentation:BASKET": 1,
      "packaging:NATURAL_ART": 3,
    },
    defaults: {
      colors: ["VIBRANT_MIX"],
      flowers: ["WILD"],
      presentation: "BOUQUET",
      size: "MEDIUM",
      packaging: "NATURAL_ART",
      style: "طبیعی و آزاد",
    },
  },
  {
    key: "CLASSIC_ELEGANCE",
    fa: "کلاسیک و اصیل",
    en: "Classic Elegance",
    image: "/images/personality/classic-elegance.jpg",
    description:
      "سلیقه‌ی شما جاودانه است؛ همان چیزی که هرگز از مد نمی‌افتد. تعادل، هماهنگی و اصالت برایتان مهم‌تر از تازگی‌های زودگذر است. دسته‌گل‌های متقارن با گل‌های شناخته‌شده و رنگ‌های آراسته، امضای شما هستند.",
    affinity: {
      "aesthetic:CLASSIC": 4,
      "color:LIGHT_NEUTRAL": 2,
      "color:DEEP_RED": 1,
      "flower:ROSE": 3,
      "flower:TULIP": 1,
      "flower:LILY": 2,
      "presentation:BOUQUET": 1,
      "presentation:BOX": 1,
      "size:MEDIUM": 1,
      "packaging:SIMPLE": 1,
      "packaging:LUXURY_WRAP": 1,
    },
    defaults: {
      colors: ["LIGHT_NEUTRAL"],
      flowers: ["ROSE"],
      presentation: "BOUQUET",
      size: "MEDIUM",
      packaging: "SIMPLE",
      style: "کلاسیک و شیک",
    },
  },
  {
    key: "COLORFUL_SPIRIT",
    fa: "پرانرژی و رنگارنگ",
    en: "Colorful Spirit",
    image: "/images/personality/colorful-spirit.jpg",
    description:
      "دنیای شما پر از رنگ و انرژی است! ترکیب‌های شاد، گل‌های متنوع و دسته‌هایی که آدم را خندان می‌کنند، دقیقاً سلیقه‌ی شماست. برایتان گل یعنی جشن؛ یعنی حس زندگی و سرزندگی.",
    affinity: {
      "aesthetic:VIBRANT": 4,
      "color:VIBRANT_MIX": 4,
      "flower:WILD": 1,
      "flower:TULIP": 1,
      "flower:GERBERA": 3,
      "flower:SUNFLOWER": 2,
      "presentation:BOUQUET": 1,
      "presentation:BASKET": 1,
      "size:LARGE": 1,
    },
    defaults: {
      colors: ["VIBRANT_MIX"],
      flowers: ["TULIP", "WILD"],
      presentation: "BOUQUET",
      size: "LARGE",
      packaging: "NATURAL_ART",
      style: "شاد و پرانرژی",
    },
  },
  {
    key: "UNIQUE_TASTE",
    fa: "خاص‌پسند و متفاوت",
    en: "Unique Taste",
    image: "/images/personality/unique-taste.jpg",
    description:
      "شما دنبال چیزی هستید که «همه» نداشته باشند. گل‌های کمیاب، فرم‌های متفاوت و ترکیب‌هایی که ذهن را درگیر می‌کنند، سلیقه‌ی هنری و مستقل شما را راضی می‌کنند. برایتان امضای شخصی مهم‌تر از رسم و رسمیت است.",
    affinity: {
      "aesthetic:ARTISTIC": 4,
      "social:INDEPENDENT": 2,
      "flower:WILD": 2,
      "flower:ORCHID": 1,
      "presentation:SINGLE": 2,
      "presentation:ARTISTIC_MIX": 2,
      "size:MEDIUM": 1,
      "packaging:DESIGNER_BOX": 2,
      "packaging:NATURAL_ART": 1,
    },
    defaults: {
      colors: ["DEEP_RED"],
      flowers: ["ORCHID", "WILD"],
      presentation: "ARTISTIC_MIX",
      size: "MEDIUM",
      packaging: "DESIGNER_BOX",
      style: "هنری و متفاوت",
    },
  },
  {
    key: "DREAMY_SOUL",
    fa: "لطیف و رؤیایی",
    en: "Dreamy Soul",
    image: "/images/personality/dreamy-soul.jpg",
    description:
      "شما عاشق دنیای لطیف و رؤیایی هستید؛ رنگ‌های پاستلی، گل‌های مخملی و حسِ صبحِ آرام بهاری. ظرافت برایتان یک زبان است و دسته‌گلِ شما باید مثل یک شعر نرم و آرامش‌بخش باشد.",
    affinity: {
      "aesthetic:NATURAL": 1,
      "aesthetic:ARTISTIC": 1,
      "aesthetic:MINIMAL": 1,
      "social:AFFECTIONATE": 2,
      "color:PASTEL_PINK": 4,
      "flower:PEONY": 3,
      "flower:LISIANTHUS": 2,
      "flower:HYDRANGEA": 1,
      "presentation:BOUQUET": 1,
      "presentation:BASKET": 1,
      "size:SMALL": 1,
      "size:MEDIUM": 1,
      "packaging:NATURAL_ART": 1,
      "packaging:SIMPLE": 1,
    },
    defaults: {
      colors: ["PASTEL_PINK"],
      flowers: ["PEONY"],
      presentation: "BOUQUET",
      size: "MEDIUM",
      packaging: "NATURAL_ART",
      style: "لطیف و رؤیایی",
    },
  },
];

/** Preferred order when affinity scores tie. */
const PERSONALITY_PRIORITY: PersonalityKey[] = [
  "ROMANTIC_ARTIST",
  "LUXURY_LOVER",
  "CALM_MINIMALIST",
  "NATURAL_SOUL",
  "CLASSIC_ELEGANCE",
  "COLORFUL_SPIRIT",
  "UNIQUE_TASTE",
  "DREAMY_SOUL",
];

export const PERSONALITY_BY_KEY: Record<PersonalityKey, PersonalityDef> = PERSONALITIES.reduce(
  (acc, p) => {
    acc[p.key] = p;
    return acc;
  },
  {} as Record<PersonalityKey, PersonalityDef>
);

/* --------------------------------- engine ---------------------------------- */

function topEntries(scores: ScoreMap): { key: string; value: number; total: number; share: number }[] {
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  if (total <= 0) return [];
  return Object.entries(scores)
    .map(([key, value]) => ({ key, value, total, share: value / total }))
    .sort((a, b) => b.value - a.value);
}

function axisScores(scores: ScoreMap, axis: string): ScoreMap {
  const out: ScoreMap = {};
  for (const [k, v] of Object.entries(scores)) {
    if (k.startsWith(axis + ":")) out[k.slice(axis.length + 1)] = v;
  }
  return out;
}

/**
 * Aggregates answers into axis scores, matches one of the eight
 * Golestane Hafez taste personalities and computes confidence.
 * Unknown («نمی‌دانم») answers contribute nothing — only lower confidence.
 */
export function analyzeAnswers(
  kind: TestKind,
  answers: Answer[],
  meta?: RecipientMeta
): TasteProfile {
  const questions = QUESTION_BANKS[kind];
  const byId = new Map(questions.map((q) => [q.id, q]));

  const scores: ScoreMap = {};
  let unknownCount = 0;

  for (const ans of answers) {
    const q = byId.get(ans.q);
    if (!q || !ans.a) continue;
    const opt = q.options.find((o) => o.key === ans.a);
    if (!opt) continue;
    if (opt.unknown) {
      unknownCount++;
      continue;
    }
    for (const [k, v] of Object.entries(opt.scores ?? {})) {
      scores[k] = (scores[k] ?? 0) + v;
    }
  }

  // --- winners per axis (direct answers only, by construction of the banks) ---
  const colorTop = topEntries(axisScores(scores, "color"))[0]?.key as ColorKey | undefined;
  const flowerTop = topEntries(axisScores(scores, "flower")).map(
    (e) => e.key
  ) as FlowerKey[];
  const presentationTop = topEntries(axisScores(scores, "presentation"))[0]?.key as
    | PresentationKey
    | undefined;
  const sizeTop = topEntries(axisScores(scores, "size"))[0]?.key as SizeKey | undefined;
  const packagingTop = topEntries(axisScores(scores, "packaging"))[0]?.key as
    | PackagingKey
    | undefined;
  const aestheticTop = topEntries(axisScores(scores, "aesthetic"))[0]?.key as
    | AestheticKey
    | undefined;
  const socialTop = topEntries(axisScores(scores, "social"))[0]?.key as SocialKey | undefined;

  const directAnswered = [colorTop, presentationTop, sizeTop, packagingTop].filter(
    Boolean
  ).length + (flowerTop.length > 0 ? 1 : 0);

  // --- personality matching: affinity over NORMALIZED axis shares ---
  // Behavioural/indirect axes get lower importance than direct ones, so a
  // personality is chosen mainly by aesthetic/color/flower signals.
  const axisImportance: Record<string, number> = {
    aesthetic: 2.2,
    color: 1.6,
    flower: 1.6,
    presentation: 0.8,
    size: 0.7,
    packaging: 0.8,
    social: 0.9,
  };

  let best: PersonalityDef | null = null;
  let bestScore = -1;

  for (const p of PERSONALITIES) {
    let s = 0;
    for (const [key, weight] of Object.entries(p.affinity)) {
      const [axis, value] = key.split(":");
      const entries = topEntries(axisScores(scores, axis));
      const entry = entries.find((e) => e.key === value);
      if (entry) s += entry.share * weight;
    }
    // Nudge behavioural-only agreement slightly (social axis).
    if (socialTop && p.affinity["social:" + socialTop]) {
      s += 0.1;
    }
    if (s > bestScore + 1e-9 || (Math.abs(s - bestScore) < 1e-9 && best && PERSONALITY_PRIORITY.indexOf(p.key) < PERSONALITY_PRIORITY.indexOf(best.key))) {
      bestScore = s;
      best = p;
    }
  }

  const personality = best?.key ?? "CLASSIC_ELEGANCE";
  const pDef = PERSONALITY_BY_KEY[personality];

  // --- merge: direct winners first, personality defaults as fallback ---
  const colors: ColorKey[] = colorTop ? [colorTop, ...pDef.defaults.colors.filter((c) => c !== colorTop)] : pDef.defaults.colors;
  const flowers: FlowerKey[] = flowerTop.length > 0
    ? [...new Set([...flowerTop.slice(0, 2), ...pDef.defaults.flowers])].slice(0, 3)
    : pDef.defaults.flowers;
  const presentation = presentationTop ?? pDef.defaults.presentation;
  const size = sizeTop ?? pDef.defaults.size;
  const packaging = packagingTop ?? pDef.defaults.packaging;

  // --- confidence ---
  let confidence = 50;
  confidence += Math.min(directAnswered, 5) * 6; // up to +30
  const aestheticEntries = topEntries(axisScores(scores, "aesthetic"));
  if (aestheticEntries.length > 0) confidence += Math.round(aestheticEntries[0].share * 20);
  const colorEntries = topEntries(axisScores(scores, "color"));
  if (colorEntries.length > 0) confidence += Math.round(colorEntries[0].share * 10);
  if (kind === "OTHER") {
    if (meta?.knowledge === "HIGH") confidence += 10;
    else if (meta?.knowledge === "MEDIUM") confidence += 4;
    confidence -= unknownCount * 4; // honest uncertainty penalty
  }
  if (directAnswered === 0) confidence = Math.min(confidence, 40); // nothing direct → low
  confidence = Math.max(30, Math.min(95, Math.round(confidence)));

  return {
    personality,
    confidence,
    color: colorTop ?? null,
    flowers,
    presentation,
    size,
    packaging,
    unknownCount,
    directAnswered,
  };
}

/* ------------------------------ overrides / edit ----------------------------- */

export interface TasteOverrides {
  color?: ColorKey | null;
  flowers?: FlowerKey[] | null;
  dislikedFlowers?: FlowerKey[] | null;
  presentation?: PresentationKey | null;
  size?: SizeKey | null;
  packaging?: PackagingKey | null;
}

/** Applies the customer's manual corrections on top of the analysed profile. */
export function applyOverrides(profile: TasteProfile, o: TasteOverrides): TasteProfile {
  return {
    ...profile,
    color: o.color ?? profile.color,
    flowers: o.flowers && o.flowers.length > 0 ? o.flowers : profile.flowers,
    presentation: o.presentation ?? profile.presentation,
    size: o.size ?? profile.size,
    packaging: o.packaging ?? profile.packaging,
  };
}

export function isValidEnum<T extends string>(v: unknown, values: readonly T[]): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

export const ALL_COLORS: ColorKey[] = ["LIGHT_NEUTRAL", "PASTEL_PINK", "DEEP_RED", "VIBRANT_MIX"];
export const ALL_FLOWERS: FlowerKey[] = [
  "ROSE",
  "PEONY",
  "TULIP",
  "ORCHID",
  "GERBERA",
  "LILY",
  "HYDRANGEA",
  "SUNFLOWER",
  "LISIANTHUS",
  "WILD",
];
export const ALL_PRESENTATIONS: PresentationKey[] = ["BOUQUET", "BOX", "BASKET", "SINGLE", "ARTISTIC_MIX"];
export const ALL_SIZES: SizeKey[] = ["SMALL", "MEDIUM", "LARGE", "GRAND"];
export const ALL_PACKAGINGS: PackagingKey[] = ["SIMPLE", "LUXURY_WRAP", "DESIGNER_BOX", "NATURAL_ART"];

/* --------------------------------- summary --------------------------------- */

/** One-line Persian summary used in profiles and (future) orders. */
export function profileSummaryFa(p: {
  personality: PersonalityKey;
  flowers: FlowerKey[];
  color: ColorKey | null;
  presentation: PresentationKey | null;
  size: SizeKey | null;
  packaging: PackagingKey | null;
}): string {
  const parts = [
    PERSONALITY_BY_KEY[p.personality].fa,
    p.flowers.map((f) => FLOWER_LABELS[f]).join(" و "),
    p.color ? COLOR_LABELS[p.color] : "",
    p.presentation ? PRESENTATION_LABELS[p.presentation] : "",
    p.size ? SIZE_LABELS[p.size] : "",
    p.packaging ? PACKAGING_LABELS[p.packaging] : "",
  ].filter(Boolean);
  return parts.join(" | ");
}
