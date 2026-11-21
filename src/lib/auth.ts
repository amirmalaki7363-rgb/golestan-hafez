import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "gh_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/* ---------------------------------- types --------------------------------- */

export interface SafeUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: Date;
}

/* -------------------------------- passwords ------------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  return candidate.length === target.length && timingSafeEqual(candidate, target);
}

/* ---------------------------------- phone --------------------------------- */

/** Normalizes Iranian mobile numbers to the 09xxxxxxxxx form; returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  let p = (raw || "").replace(/[\s\-()]/g, "");
  // Persian/Arabic digits → Latin
  p = p.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  p = p.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
  else if (p.startsWith("9") && p.length === 10) p = "0" + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

/* --------------------------------- sessions -------------------------------- */

export async function createSession(userId: string): Promise<{ token: string; maxAge: number }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: token, userId, expiresAt } });
  return { token, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function getSessionUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: token } }).catch(() => undefined);
    return null;
  }
  return toSafeUser(session.user);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.delete({ where: { id: token } }).catch(() => undefined);
  }
}

export async function requireAdmin(): Promise<SafeUser | null> {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}

export function toSafeUser(user: {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/** Session cookie options shared by login/register routes. */
export const sessionCookieOptions = (maxAge: number) =>
  ({
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: false, // sandbox runs over http
  }) as const;
