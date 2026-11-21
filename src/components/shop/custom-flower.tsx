"use client";

import dynamic from "next/dynamic";
import { useCustomFlowerStore } from "@/lib/custom-flower-store";
import type { CustomFlowerConfig } from "@/lib/custom-flower-config";

// The «گل به سلیقه شما» builder is code-split: its chunk is fetched only
// when a visitor opens the page — not on the initial storefront load.
const CustomFlowerPage = dynamic(
  () => import("./custom-flower-page").then((m) => m.CustomFlowerPage),
  { ssr: false }
);

/**
 * Outer gate — mounts the page fresh on every open, so all selections
 * start empty without needing a setState-in-effect reset.
 */
export function CustomFlower({
  initialConfig,
}: {
  /** Prefetched server-side — the builder opens with the live config. */
  initialConfig?: CustomFlowerConfig;
}) {
  const open = useCustomFlowerStore((s) => s.open);
  if (!open) return null;
  return <CustomFlowerPage initialGroups={initialConfig?.groups} />;
}
