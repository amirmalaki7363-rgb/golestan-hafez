import type { Answer } from "@/lib/flower-personality";

/** Shared row → JSON shape for FlowerProfile API responses. */
export function serializeProfile(row: {
  id: string;
  title: string;
  kind: string;
  relationship: string;
  gender: string;
  ageRange: string;
  knowledge: string;
  pastPurchase: string;
  answers: string;
  personality: string;
  confidence: number;
  colors: string;
  flowers: string;
  dislikedFlowers: string;
  presentation: string;
  size: string;
  packaging: string;
  styleNote: string;
  edits: string;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    relationship: row.relationship,
    gender: row.gender,
    ageRange: row.ageRange,
    knowledge: row.knowledge,
    pastPurchase: row.pastPurchase,
    answers: JSON.parse(row.answers) as Answer[],
    personality: row.personality,
    confidence: row.confidence,
    colors: JSON.parse(row.colors) as string[],
    flowers: JSON.parse(row.flowers) as string[],
    dislikedFlowers: JSON.parse(row.dislikedFlowers) as string[],
    presentation: row.presentation,
    size: row.size,
    packaging: row.packaging,
    styleNote: row.styleNote,
    edits: JSON.parse(row.edits) as Record<string, unknown>,
    updatedAt: row.updatedAt.toISOString(),
  };
}
