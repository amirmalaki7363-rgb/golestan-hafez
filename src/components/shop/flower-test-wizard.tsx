"use client";

import dynamic from "next/dynamic";
import { useFlowerTestStore } from "@/lib/flower-test-store";

// The personality test is a large module (question banks, result builder,
// profile saving …). Code-split it so visitors download it only when they
// actually open the test — not on every storefront visit.
const WizardPage = dynamic(
  () => import("./flower-test-wizard-page").then((m) => m.WizardPage),
  { ssr: false }
);

export function FlowerTestWizard() {
  const open = useFlowerTestStore((s) => s.open);
  if (!open) return null;
  return <WizardPage />;
}
