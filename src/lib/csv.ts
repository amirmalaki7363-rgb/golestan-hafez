/**
 * CSV درون‌ریزی محصولات — shared between the admin import dialog (client)
 * and the import API route (server) so validation rules stay identical.
 *
 * Expected columns (Persian or English headers, order-insensitive):
 *   شناسه محصول | شناسه | کد محصول | id | sku
 *   عنوان محصول | عنوان | نام محصول | title | name
 *   دسته‌بندی محصول | دسته بندی | دسته | category
 *   آدرس تصویر | تصویر | عکس | image | url
 * Optional:
 *   قیمت | price          (Toman; if absent the dialog's default price is used)
 */

import { PRODUCT_ALL_CATEGORIES } from "@/lib/constants";

/* ------------------------------ basic parsing ----------------------------- */

/** Converts Persian/Arabic digits to Latin digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalizes a header cell: strips BOM/ZWNJ/marks, collapses spaces, lowercases. */
function normalizeHeader(h: string): string {
  return toLatinDigits(h)
    .replace(/[\u200b-\u200f\uFEFF\u064B-\u0652]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Normalizes free Persian text for fuzzy comparisons. */
function normalizeText(value: string): string {
  return normalizeHeader(value);
}

/**
 * RFC4180-style parser: quoted fields, "" escapes, embedded commas/newlines,
 * CRLF and BOM tolerant. Returns rows of raw cells (no trimming).
 */
export function parseCsvTable(rawText: string): string[][] {
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let sawAnyChar = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    sawAnyChar = true;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRow();
      sawAnyChar = false;
    } else {
      field += ch;
    }
  }
  if (sawAnyChar || field !== "" || row.length > 0) pushRow();

  // drop fully-empty rows (e.g. trailing blank lines)
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/* --------------------------- column identification ------------------------ */

const SKU_ALIASES = [
  "شناسه محصول", "شناسه", "کد محصول", "کد", "id", "sku", "product id", "code",
];
const NAME_ALIASES = [
  "عنوان محصول", "عنوان", "نام محصول", "نام", "title", "name", "product name", "product title",
];
const CATEGORY_ALIASES = [
  "دستهبندی محصول", "دسته بندی محصول", "دستهبندی", "دسته بندی", "دسته", "category",
];
const IMAGE_ALIASES = [
  "آدرس تصویر", "ادرس تصویر", "آدرس عکس", "تصویر", "عکس", "لینک تصویر",
  "image", "image url", "img", "url", "photo",
];
const PRICE_ALIASES = [
  "قیمت", "قیمت تومان", "قیمت (تومان)", "price", "amount",
];

const REQUIRED_COLUMNS: { key: RowKey; label: string; aliases: string[] }[] = [
  { key: "sku", label: "شناسه محصول", aliases: SKU_ALIASES },
  { key: "name", label: "عنوان محصول", aliases: NAME_ALIASES },
  { key: "category", label: "دسته‌بندی محصول", aliases: CATEGORY_ALIASES },
  { key: "image", label: "آدرس تصویر", aliases: IMAGE_ALIASES },
];

export type RowKey = "sku" | "name" | "category" | "image" | "price";

function locateColumns(headerCells: string[]): Partial<Record<RowKey, number>> {
  const normalized = headerCells.map(normalizeHeader);
  const found: Partial<Record<RowKey, number>> = {};
  const all = [...REQUIRED_COLUMNS, { key: "price" as RowKey, label: "قیمت", aliases: PRICE_ALIASES }];
  for (const col of all) {
    if (found[col.key] !== undefined) continue;
    // exact match first, then a safe contains-fallback
    let idx = normalized.findIndex((h) => h !== "" && col.aliases.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(
        (h) =>
          h !== "" &&
          col.aliases.some((a) => (a.length >= 4 && h.includes(a)) || (h.length >= 4 && a.includes(h)))
      );
    }
    if (idx !== -1) found[col.key] = idx;
  }
  return found;
}

/* -------------------------------- row model ------------------------------- */

export interface CsvProductRow {
  /** 1-based line number in the source file (header = 1, first data row = 2). */
  line: number;
  sku: string;
  name: string;
  category: string;
  image: string;
  /** Row price in IRT when a price column exists, otherwise null. */
  price: number | null;
  /** Persian validation messages; empty array = valid row. */
  errors: string[];
}

export interface CsvParseResult {
  rows: CsvProductRow[];
  /** Persian labels of required columns that were not found in the header. */
  missingColumns: string[];
  totalDataRows: number;
}

const SKU_REGEX = /^[A-Za-z0-9_-]+$/;

/** Fuzzy-matches the raw category text to the shop taxonomy; falls back to the raw value. */
export function normalizeCategoryInput(raw: string): string {
  const t = normalizeText(raw);
  if (!t) return "باکس گل";
  for (const c of PRODUCT_ALL_CATEGORIES) {
    if (normalizeText(c) === t) return c;
  }
  return raw.trim().slice(0, 60);
}

/**
 * Validates a single mapped row. Mutates nothing; returns the error list.
 * Shared by the client preview and the server import route.
 */
export function validateProductRow(row: {
  sku: string;
  name: string;
  category: string;
  image: string;
  price: number | null;
}): string[] {
  const errors: string[] = [];
  const sku = row.sku.trim();
  const name = row.name.trim();
  const image = row.image.trim();

  if (!sku) errors.push("شناسه محصول خالی است.");
  else if (!SKU_REGEX.test(sku))
    errors.push("شناسه فقط می‌تواند شامل حروف لاتین، عدد، خط تیره و زیرخط باشد.");
  else if (sku.length > 40) errors.push("شناسه حداکثر ۴۰ کاراکتر است.");

  if (!name) errors.push("عنوان محصول خالی است.");
  else if (name.length < 2) errors.push("عنوان محصول باید حداقل ۲ کاراکتر باشد.");
  else if (name.length > 120) errors.push("عنوان محصول حداکثر ۱۲۰ کاراکتر است.");

  if (!image) errors.push("آدرس تصویر خالی است.");
  else if (image.length > 500) errors.push("آدرس تصویر حداکثر ۵۰۰ کاراکتر است.");
  else if (!/^(\/|https?:\/\/|data:image\/)/i.test(image))
    errors.push("آدرس تصویر باید با «/» یا «http(s)://» شروع شود.");

  if (row.category.trim().length > 60) errors.push("نام دسته‌بندی حداکثر ۶۰ کاراکتر است.");

  // price === -1 marks an unparsable cell (see parseProductsCsv)
  if (row.price != null && (!Number.isInteger(row.price) || row.price < 0))
    errors.push("قیمت باید عددی صحیح و نامنفی باشد (تومان).");
  else if (row.price != null && row.price > 999_999_999_999)
    errors.push("قیمت بیش از حد مجاز است.");

  return errors;
}

/**
 * Parses a products CSV file:
 * locates columns by header aliases, maps and validates every data row.
 */
export function parseProductsCsv(rawText: string): CsvParseResult {
  const table = parseCsvTable(rawText);
  if (table.length === 0) {
    return { rows: [], missingColumns: REQUIRED_COLUMNS.map((c) => c.label), totalDataRows: 0 };
  }

  const cols = locateColumns(table[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => cols[c.key] === undefined).map((c) => c.label);
  const priceCol = cols.price;
  const dataRows = table.slice(1);

  const rows: CsvProductRow[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i];
    const line = i + 2;
    const cell = (key: RowKey): string => {
      const idx = cols[key];
      return idx === undefined ? "" : (cells[idx] ?? "").trim();
    };
    const rawPrice = priceCol === undefined ? "" : toLatinDigits((cells[priceCol] ?? "").trim());
    // strip ASCII comma, Arabic comma (،), Arabic thousands separator (٬) and spaces
    const parsed = rawPrice === "" ? null : Number(rawPrice.replace(/[,،٬\s]/g, ""));
    // -1 marks an unparsable price cell so validation fails on both client and server
    const price = parsed !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : parsed === null ? null : -1;

    const row: CsvProductRow = {
      line,
      sku: cell("sku"),
      name: cell("name"),
      category: normalizeCategoryInput(cell("category")),
      image: cell("image"),
      price,
      errors: [],
    };
    row.errors = validateProductRow(row);
    rows.push(row);
  }

  return { rows, missingColumns, totalDataRows: dataRows.length };
}

/* ------------------------------ sample export ----------------------------- */

/** Builds a downloadable sample CSV (with BOM so Excel opens Persian correctly). */
export function buildSampleCsv(): string {
  const header = "شناسه محصول,عنوان محصول,دسته‌بندی محصول,آدرس تصویر,قیمت";
  const samples = [
    ["GH-1001", "باکس گل رز هلندی", "باکس گل", "/images/p1.jpg", "35800000"],
    ["GH-1002", "دسته گل لاله سفید", "دسته گل", "/images/p2.jpg", "41200000"],
  ];
  const body = samples
    .map((r) => r.map((c) => (c.includes(",") ? `"${c}"` : c)).join(","))
    .join("\r\n");
  return "\uFEFF" + header + "\r\n" + body + "\r\n";
}
