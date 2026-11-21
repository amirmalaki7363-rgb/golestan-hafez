import { db } from "@/lib/db";
import { cached, invalidateServerCache } from "@/lib/server-cache";
import {
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_KEY,
  normalizeSiteContent,
  siteContentSchema,
  type SiteContent,
} from "@/lib/site-content-schema";

/**
 * Reads site content from the Setting table (single JSON row).
 * Falls back to defaults when missing/corrupted — the storefront
 * never breaks because of a bad save.
 *
 * Stored payloads are normalized before validation, so legacy hero
 * shapes (single image) migrate to the banner slides transparently.
 */
export async function getSiteContent(): Promise<SiteContent> {
  // Cached: homepage SSR reads this on every request.
  return cached("site-content", async () => {
    try {
      const row = await db.setting.findUnique({ where: { key: SITE_CONTENT_KEY } });
      if (!row) return DEFAULT_SITE_CONTENT;
      const parsed = siteContentSchema.safeParse(normalizeSiteContent(JSON.parse(row.value)));
      return parsed.success ? parsed.data : DEFAULT_SITE_CONTENT;
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  });
}

/** Validates + persists site content; returns null when payload is invalid. */
export async function saveSiteContent(payload: unknown): Promise<SiteContent | null> {
  const parsed = siteContentSchema.safeParse(normalizeSiteContent(payload));
  if (!parsed.success) return null;
  const value = JSON.stringify(parsed.data);
  await db.setting.upsert({
    where: { key: SITE_CONTENT_KEY },
    update: { value },
    create: { key: SITE_CONTENT_KEY, value },
  });
  invalidateServerCache();
  return parsed.data;
}
