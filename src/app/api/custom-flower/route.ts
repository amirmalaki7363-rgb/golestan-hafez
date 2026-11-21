import { NextResponse } from "next/server";
import {
  DEFAULT_CUSTOM_FLOWER_CONFIG,
  type CustomFlowerConfig,
} from "@/lib/custom-flower-config";
import { getCustomFlowerConfig } from "@/lib/custom-flower-content";

/** GET — public config for the «گل به سلیقه شما» page. Never fails. */
export async function GET() {
  try {
    const config = await getCustomFlowerConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("GET /api/custom-flower failed:", error);
    return NextResponse.json({
      config: DEFAULT_CUSTOM_FLOWER_CONFIG as CustomFlowerConfig,
    });
  }
}
