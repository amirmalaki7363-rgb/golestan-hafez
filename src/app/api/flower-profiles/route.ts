import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeProfile } from "@/lib/flower-profile-server";
import {
  analyzeAnswers,
  applyOverrides,
  isValidEnum,
  ALL_COLORS,
  ALL_FLOWERS,
  ALL_PRESENTATIONS,
  ALL_SIZES,
  ALL_PACKAGINGS,
  type Answer,
  type RecipientMeta,
  type TestKind,
  type TasteOverrides,
} from "@/lib/flower-personality";

const MAX_ANSWERS_BYTES = 20 * 1024;

function parseAnswerArray(raw: unknown): Answer[] {
  if (!Array.isArray(raw)) return [];
  const out: Answer[] = [];
  for (const item of raw.slice(0, 20)) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { q?: unknown }).q === "number" &&
      typeof (item as { a?: unknown }).a === "string"
    ) {
      out.push({ q: (item as { q: number }).q, a: (item as { a: string }).a.slice(0, 2) });
    }
  }
  return out;
}

function parseEnumList<T extends string>(raw: unknown, values: readonly T[]): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v) => isValidEnum(v, values)).slice(0, 6) as T[];
}

function parseMeta(raw: unknown): RecipientMeta {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    relationship: typeof m.relationship === "string" ? m.relationship.slice(0, 60) : "",
    gender: typeof m.gender === "string" ? m.gender.slice(0, 20) : "",
    ageRange: typeof m.ageRange === "string" ? m.ageRange.slice(0, 20) : "",
    knowledge: isValidEnum(m.knowledge, ["HIGH", "MEDIUM", "LOW"] as const) ? m.knowledge : "",
    pastPurchase: isValidEnum(m.pastPurchase, ["SATISFIED", "UNSURE", "FIRST_TIME"] as const)
      ? m.pastPurchase
      : "",
  };
}

function parseOverrides(raw: unknown): TasteOverrides {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    color: isValidEnum(o.color, ALL_COLORS) ? o.color : null,
    flowers: Array.isArray(o.flowers) ? parseEnumList(o.flowers, ALL_FLOWERS) : null,
    dislikedFlowers: Array.isArray(o.dislikedFlowers)
      ? parseEnumList(o.dislikedFlowers, ALL_FLOWERS)
      : null,
    presentation: isValidEnum(o.presentation, ALL_PRESENTATIONS) ? o.presentation : null,
    size: isValidEnum(o.size, ALL_SIZES) ? o.size : null,
    packaging: isValidEnum(o.packaging, ALL_PACKAGINGS) ? o.packaging : null,
  };
}

/** GET — the signed-in user's saved flower taste profiles. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "برای مشاهده پروفایل‌ها وارد حساب شوید." }, { status: 401 });
    }
    const rows = await db.flowerProfile.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ profiles: rows.map(serializeProfile) });
  } catch (error) {
    console.error("GET /api/flower-profiles failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * POST — persist a completed test as a taste profile.
 * The server re-runs the shared analysis engine on the raw answers so the
 * stored profile is always canonical; manual corrections (overrides) are
 * applied afterwards and recorded in `edits`.
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "برای ذخیره پروفایل باید وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
    }

    const kind: TestKind = body.kind === "OTHER" ? "OTHER" : "SELF";
    const answers = parseAnswerArray(body.answers);
    if (answers.length === 0) {
      return NextResponse.json({ error: "پاسخ‌های تست یافت نشد." }, { status: 400 });
    }
    if (JSON.stringify(answers).length > MAX_ANSWERS_BYTES) {
      return NextResponse.json({ error: "حجم پاسخ‌ها بیش از حد مجاز است." }, { status: 413 });
    }

    const meta = parseMeta(body);
    if (kind === "OTHER" && !meta.relationship) {
      return NextResponse.json({ error: "نسبت دریافت‌کننده مشخص نشده است." }, { status: 400 });
    }

    // Canonical analysis + the customer's manual refinements.
    const analysed = analyzeAnswers(kind, answers, meta);
    const overrides = parseOverrides(body.overrides);
    const final = applyOverrides(analysed, overrides);
    const hadEdits = Object.values(overrides).some((v) => v !== null && v !== undefined);

    const titleRaw = typeof body.title === "string" ? body.title.trim() : "";
    const title =
      titleRaw || (kind === "SELF" ? "سلیقه شخصی من" : meta.relationship || "شخص دیگر");

    const row = await db.flowerProfile.create({
      data: {
        userId: user.id,
        title: title.slice(0, 60),
        kind,
        relationship: meta.relationship,
        gender: meta.gender,
        ageRange: meta.ageRange,
        knowledge: meta.knowledge,
        pastPurchase: meta.pastPurchase,
        answers: JSON.stringify(answers),
        personality: final.personality,
        confidence: final.confidence,
        colors: JSON.stringify(final.color ? [final.color] : []),
        flowers: JSON.stringify(final.flowers),
        dislikedFlowers: JSON.stringify(overrides.dislikedFlowers ?? []),
        presentation: final.presentation ?? "",
        size: final.size ?? "",
        packaging: final.packaging ?? "",
        styleNote: "",
        edits: JSON.stringify(
          hadEdits ? { ...overrides, editedAt: new Date().toISOString() } : {}
        ),
      },
    });

    return NextResponse.json({ profile: serializeProfile(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/flower-profiles failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
