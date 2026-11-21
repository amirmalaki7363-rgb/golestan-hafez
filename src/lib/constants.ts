/** Shared product taxonomy for the storefront & admin panel. */
export const PRODUCT_CATEGORIES = [
  "دسته گل",
  "باکس گل",
  "گلدان ارکیده",
  "دسته گل عروس",
  "ماشین عروس",
  "مراسم ها",
] as const;

/**
 * Full taxonomy including the finer collection categories mapped from the
 * Collections grid («باکس ویژه رز», «دسته گل مناسبتی»). Used by the admin
 * product form so finer-tagged products can be created; the «گل» header menu
 * keeps showing only the six top-level categories above.
 */
export const PRODUCT_ALL_CATEGORIES = [
  ...PRODUCT_CATEGORIES,
  "باکس ویژه رز",
  "دسته گل مناسبتی",
] as const;

export const PRODUCT_OCCASIONS = [
  "تولد",
  "سالگرد ازدواج",
  "عروسی",
  "همایش",
  "قدردانی",
  "تسلیت",
  "بدون مناسبت",
] as const;
