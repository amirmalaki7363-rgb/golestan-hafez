import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isValidEnum,
  ALL_COLORS,
  ALL_FLOWERS,
  ALL_PRESENTATIONS,
  ALL_SIZES,
  ALL_PACKAGINGS,
} from "@/lib/flower-personality";
import { serializeProfile } from "@/lib/flower-profile-server";

type Ctx = { params: Promise<{ id: string }> };

const MAX_LIST = 6;

function enumList(raw: unknown, values: readonly string[], fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const filtered = raw
    .filter((v) => isValidEnum(v, values))
    .slice(0, MAX_LIST) as string[];
  return filtered;
}

async function ownedProfile(id: string, userId: string) {
  return db.flowerProfile.findFirst({ where: { id, userId } });
}

/** PUT — edit a profile (title, refined taste preferences, disliked flowers). */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "ابتدا وارد حساب شوید." }, { status: 401 });
    }
    const { id } = await ctx.params;
    const row = await ownedProfile(id, user.id);
    if (!row) {
      return NextResponse.json({ error: "پروفایل یافت نشد." }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
    }

    const prevColors = JSON.parse(row.colors) as string[];
    const prevFlowers = JSON.parse(row.flowers) as string[];
    const prevDisliked = JSON.parse(row.dislikedFlowers) as string[];
    const prevEdits = JSON.parse(row.edits) as Record<string, unknown>;

    const colors = enumList(body.colors, ALL_COLORS, prevColors);
    const flowers = enumList(body.flowers, ALL_FLOWERS, prevFlowers);
    const dislikedFlowers = enumList(body.dislikedFlowers, ALL_FLOWERS, prevDisliked);
    const presentation = isValidEnum(body.presentation, ALL_PRESENTATIONS)
      ? body.presentation
      : row.presentation;
    const size = isValidEnum(body.size, ALL_SIZES) ? body.size : row.size;
    const packaging = isValidEnum(body.packaging, ALL_PACKAGINGS)
      ? body.packaging
      : row.packaging;
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 60)
        : row.title;

    const updated = await db.flowerProfile.update({
      where: { id: row.id },
      data: {
        title,
        colors: JSON.stringify(colors),
        flowers: JSON.stringify(flowers),
        dislikedFlowers: JSON.stringify(dislikedFlowers),
        presentation,
        size,
        packaging,
        styleNote:
          typeof body.styleNote === "string" ? body.styleNote.slice(0, 300) : row.styleNote,
        edits: JSON.stringify({
          ...prevEdits,
          editedAt: new Date().toISOString(),
          note: typeof body.note === "string" ? body.note.slice(0, 500) : prevEdits.note ?? "",
        }),
      },
    });

    return NextResponse.json({ profile: serializeProfile(updated) });
  } catch (error) {
    console.error("PUT /api/flower-profiles/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/** DELETE — remove one of the user's own profiles. */
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "ابتدا وارد حساب شوید." }, { status: 401 });
    }
    const { id } = await ctx.params;
    const row = await ownedProfile(id, user.id);
    if (!row) {
      return NextResponse.json({ error: "پروفایل یافت نشد." }, { status: 404 });
    }
    await db.flowerProfile.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/flower-profiles/[id] failed:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
