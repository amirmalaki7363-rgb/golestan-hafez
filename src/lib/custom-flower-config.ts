import { z } from "zod";

/**
 * «گل به سلیقه شما» — data-driven custom flower builder.
 * Client-safe module (no db import) so the storefront page and the admin
 * editor can share types, defaults and the zod schema.
 *
 * Defaults live in one explicit literal; the zod schema only validates
 * (zod v4 does not apply nested defaults, so we never rely on them).
 */

export const CUSTOM_FLOWER_KEY = "customFlowerConfig";

/* --------------------------------- schema --------------------------------- */

const emptyOk = (max: number) =>
  z.string().trim().max(max).optional();

export const customFlowerOptionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sub: emptyOk(80),
  hex: emptyOk(120),
  image: emptyOk(500),
});

export const customFlowerGroupSchema = z.object({
  /** Internal identifier — latin letters/digits only, unique per config. */
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "کلید باید حروف لاتین باشد."),
  label: z.string().trim().min(1).max(80),
  caption: z.string().trim().max(60),
  /** color → swatches, chip → text chips, image → photo cards (flower types). */
  kind: z.enum(["color", "chip", "image"]),
  options: z.array(customFlowerOptionSchema).min(1).max(40),
});

export const customFlowerConfigSchema = z.object({
  groups: z.array(customFlowerGroupSchema).min(1).max(16),
});

export type CustomFlowerOption = z.infer<typeof customFlowerOptionSchema>;
export type CustomFlowerGroup = z.infer<typeof customFlowerGroupSchema>;
export type CustomFlowerConfig = z.infer<typeof customFlowerConfigSchema>;
export type CustomFlowerKind = CustomFlowerGroup["kind"];

/* -------------------------------- defaults -------------------------------- */

const PASTEL_COLORS: CustomFlowerOption[] = [
  { name: "صورتی پاستلی", hex: "#f2c6cf" },
  { name: "آبی پاستلی", hex: "#b3cfe3" },
  { name: "سبز پاستلی", hex: "#c2dbb8" },
  { name: "زرد پاستلی", hex: "#f6e7ae" },
  { name: "بنفش پاستلی", hex: "#cfb9e2" },
  { name: "هلویی پاستلی", hex: "#f7d6b5" },
  { name: "یاسی", hex: "#c9a9c7" },
  { name: "نعنایی", hex: "#bfe6d2" },
];

export const DEFAULT_CUSTOM_FLOWER_CONFIG: CustomFlowerConfig = {
  groups: [
    {
      key: "ribbon",
      label: "رنگ ربان",
      caption: "RIBBON COLOR",
      kind: "color",
      options: [
        { name: "قرمز", hex: "#a63d33" },
        { name: "سفید", hex: "#f2ece0" },
        { name: "صورتی", hex: "#df9aab" },
        { name: "سرخابی", hex: "#a4255b" },
        { name: "بنفش", hex: "#6e4a8e" },
        { name: "زرد", hex: "#d9b04c" },
        { name: "سبز", hex: "#5e7d54" },
        { name: "مشکی", hex: "#171310" },
        { name: "طلایی", hex: "#bd9740" },
        { name: "بژ", hex: "#cbb391" },
        ...PASTEL_COLORS,
      ],
    },
    {
      key: "boxColor",
      label: "رنگ باکس گل",
      caption: "BOX COLOR",
      kind: "color",
      options: [
        { name: "سفید", hex: "#f2ece0" },
        { name: "کرم", hex: "#d9c9b2" },
        { name: "مشکی", hex: "#1c1611" },
        { name: "قهوه‌ای", hex: "#4a3423" },
        { name: "قرمز", hex: "#8e2f28" },
        { name: "صورتی", hex: "#d88ea5" },
        { name: "طلایی", hex: "#b58f3a" },
        { name: "نقره‌ای", hex: "#b9b3ab" },
        ...PASTEL_COLORS,
      ],
    },
    {
      key: "paperColor",
      label: "رنگ کاغذ گل",
      caption: "PAPER COLOR",
      kind: "color",
      options: [
        { name: "سفید", hex: "#f2ece0" },
        { name: "شیری", hex: "#f7f1e3" },
        { name: "کرم", hex: "#d9c9b2" },
        { name: "کرافت", hex: "#a97c5f" },
        { name: "مشکی", hex: "#1c1611" },
        { name: "قرمز", hex: "#8e2f28" },
        { name: "صورتی", hex: "#d88ea5" },
        { name: "طوسی", hex: "#a89f94" },
        { name: "طلایی", hex: "#b58f3a" },
        { name: "نقره‌ای", hex: "#b9b3ab" },
        ...PASTEL_COLORS,
      ],
    },
    {
      key: "boxSize",
      label: "اندازه باکس گل",
      caption: "BOX SIZE",
      kind: "chip",
      options: [
        { name: "کوچک", sub: "۲۰ × ۲۰ سانت" },
        { name: "متوسط", sub: "۲۵ × ۲۵ سانت" },
        { name: "بزرگ", sub: "۳۰ × ۳۰ سانت" },
        { name: "ویژه", sub: "۴۰ × ۴۰ سانت" },
      ],
    },
    {
      key: "jarSize",
      label: "اندازه جار گل",
      caption: "JAR SIZE",
      kind: "chip",
      options: [
        { name: "کوچک", sub: "ارتفاع ۲۰ سانت" },
        { name: "متوسط", sub: "ارتفاع ۳۰ سانت" },
        { name: "بزرگ", sub: "ارتفاع ۴۰ سانت" },
        { name: "بلند", sub: "ارتفاع ۵۰ سانت" },
      ],
    },
    {
      key: "flowerType",
      label: "انتخاب نوع گل",
      caption: "FLOWER TYPE",
      kind: "image",
      options: [
        { name: "رز هلندی", image: "/uploads/custom-flowers/rose-dutch.jpg" },
        { name: "رز اکوادور", image: "/uploads/custom-flowers/rose-ecuador.jpg" },
        { name: "ژربرا", image: "/uploads/custom-flowers/gerbera.jpg" },
        { name: "لیلیوم", image: "/uploads/custom-flowers/lily.jpg" },
        { name: "تولیپ", image: "/uploads/custom-flowers/tulip.jpg" },
        { name: "آفتابگردان", image: "/uploads/custom-flowers/sunflower.jpg" },
        {
          name: "ارکیده فالانوپسیس",
          image: "/uploads/custom-flowers/phalaenopsis.png",
        },
        { name: "میخک", image: "/uploads/custom-flowers/carnation.jpg" },
      ],
    },
    {
      key: "flowerColor",
      label: "انتخاب رنگ گل",
      caption: "FLOWER COLOR",
      kind: "color",
      options: [
        { name: "قرمز", hex: "#a93226" },
        { name: "سفید", hex: "#f2ece0" },
        { name: "صورتی", hex: "#df9aab" },
        { name: "زرد", hex: "#d9b04c" },
        { name: "بنفش", hex: "#6e4a8e" },
        { name: "هلویی", hex: "#e0b18d" },
        { name: "سبز", hex: "#5e7d54" },
        {
          name: "دورنگی",
          hex: "linear-gradient(135deg, #df9aab 0%, #df9aab 50%, #f2ece0 50%, #f2ece0 100%)",
        },
        ...PASTEL_COLORS,
      ],
    },
    {
      key: "volume",
      label: "انتخاب حجم نهایی گل",
      caption: "FINAL VOLUME",
      kind: "chip",
      options: [
        { name: "مینی", sub: "حدود ۱۵ شاخه" },
        { name: "استاندارد", sub: "حدود ۲۵ شاخه" },
        { name: "پر", sub: "حدود ۵۰ شاخه" },
        { name: "لاکچری", sub: "حدود ۱۰۰ شاخه" },
      ],
    },
  ],
};
