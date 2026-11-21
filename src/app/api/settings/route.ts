import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

/** GET — public store settings for the storefront (banner, delivery fee, ...). */
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}
