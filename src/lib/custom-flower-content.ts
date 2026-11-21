import { db } from "@/lib/db";
import { cached, invalidateServerCache } from "@/lib/server-cache";
import {
  CUSTOM_FLOWER_KEY,
  DEFAULT_CUSTOM_FLOWER_CONFIG,
  customFlowerConfigSchema,
  type CustomFlowerConfig,
} from "@/lib/custom-flower-config";

/**
 * Reads the «گل به سلیقه شما» config from the Setting table (single JSON row).
 * Falls back to defaults when missing/corrupted — the storefront
 * never breaks because of a bad save.
 */
export async function getCustomFlowerConfig(): Promise<CustomFlowerConfig> {
  // Cached: homepage SSR reads this on every request.
  return cached("custom-flower-config", async () => {
    try {
      const row = await db.setting.findUnique({ where: { key: CUSTOM_FLOWER_KEY } });
      if (!row) return DEFAULT_CUSTOM_FLOWER_CONFIG;
      const parsed = customFlowerConfigSchema.safeParse(JSON.parse(row.value));
      return parsed.success ? parsed.data : DEFAULT_CUSTOM_FLOWER_CONFIG;
    } catch {
      return DEFAULT_CUSTOM_FLOWER_CONFIG;
    }
  });
}

/** Validates + persists the config; returns null when payload is invalid. */
export async function saveCustomFlowerConfig(
  payload: unknown
): Promise<CustomFlowerConfig | null> {
  const parsed = customFlowerConfigSchema.safeParse(payload);
  if (!parsed.success) return null;
  const value = JSON.stringify(parsed.data);
  await db.setting.upsert({
    where: { key: CUSTOM_FLOWER_KEY },
    update: { value },
    create: { key: CUSTOM_FLOWER_KEY, value },
  });
  invalidateServerCache();
  return parsed.data;
}
