import { db } from "@/lib/db";
import { cached } from "@/lib/server-cache";

/** Store-level settings managed from the admin panel (key-value rows in DB). */
export interface StoreSettings {
  deliveryFee: number;
  supportPhone: string;
}

export const SETTING_DEFAULTS: StoreSettings = {
  deliveryFee: 150000,
  supportPhone: "09127385527",
};

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as (keyof StoreSettings)[];

export async function getSettings(): Promise<StoreSettings> {
  // Cached: homepage + cart drawer settings are read on every request.
  return cached("store-settings", async () => {
    try {
      const rows = await db.setting.findMany();
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return {
        deliveryFee: toInt(map.get("deliveryFee"), SETTING_DEFAULTS.deliveryFee),
        supportPhone: map.get("supportPhone") ?? SETTING_DEFAULTS.supportPhone,
      };
    } catch {
      return SETTING_DEFAULTS;
    }
  });
}

function toInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}
