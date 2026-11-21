/**
 * Tiny in-memory TTL cache for hot server-side reads (homepage prefetch).
 *
 * Why: the dev server re-renders the homepage on every request and each
 * render used to hit SQLite 4+ times (products, settings, site content,
 * custom-flower config). Through the preview gateway that made the document
 * alone take 300-1400ms. With this cache, repeat renders resolve in ~1ms.
 *
 * Admin writes call `invalidateServerCache()` so edits show up immediately;
 * the 30s TTL is only a safety net for any path we forgot to invalidate.
 */

type Entry = { value: unknown; expires: number };

const globalForCache = globalThis as unknown as {
  __ghServerCache?: Map<string, Entry>;
};

const store: Map<string, Entry> =
  globalForCache.__ghServerCache ?? (globalForCache.__ghServerCache = new Map());

const DEFAULT_TTL_MS = 30_000;

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;

  const value = await fn();
  store.set(key, { value, expires: now + ttlMs });
  return value;
}

/** Drop every cached read — call from admin mutation routes. */
export function invalidateServerCache(): void {
  store.clear();
}
