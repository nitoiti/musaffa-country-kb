import type { ContentSource, KBSection as DbKBSection, Country as DbCountry } from "@prisma/client";
import type {
  Country,
  KnowledgeBase,
  KBSection,
  KBSectionKey,
} from "@/types/country";
import { KB_SECTIONS } from "@/types/country";

export type ContentSourceLabel = "ai_generated" | "human_verified";

export function dbSourceToLabel(source: ContentSource): ContentSourceLabel {
  return source === "HUMAN_VERIFIED" ? "human_verified" : "ai_generated";
}

export function labelToDbSource(label: ContentSourceLabel): ContentSource {
  return label === "human_verified" ? "HUMAN_VERIFIED" : "AI_GENERATED";
}

function mapKbSection(row: DbKBSection): KBSection & {
  contentSource: ContentSourceLabel;
  updatedAt: string;
  updatedByName: string | null;
} {
  return {
    status: row.status as KBSection["status"],
    content: row.content,
    contentSource: dbSourceToLabel(row.contentSource),
    updatedAt: row.updatedAt.toISOString(),
    updatedByName: null,
  };
}

export function mapCountryRow(
  row: DbCountry & {
    kbSections: (DbKBSection & { updatedBy?: { name: string | null } | null })[];
    updatedBy?: { name: string | null } | null;
  },
): Country & {
  contentSource: ContentSourceLabel;
  updatedAt: string;
  updatedByName: string | null;
} {
  const kb = row.kbSections.length
    ? (Object.fromEntries(
        row.kbSections.map((s) => [
          s.sectionKey,
          {
            ...mapKbSection(s),
            updatedByName: s.updatedBy?.name ?? null,
          },
        ]),
      ) as KnowledgeBase & Record<string, ReturnType<typeof mapKbSection>>)
    : null;

  for (const { key } of KB_SECTIONS) {
    if (kb && !(key in kb)) {
      (kb as Record<string, KBSection>)[key] = {
        status: "draft",
        content: "",
        contentSource: "ai_generated",
        updatedAt: row.createdAt.toISOString(),
        updatedByName: null,
      };
    }
  }

  return {
    code: row.code,
    name: row.name,
    slug: row.slug,
    region: row.region,
    eligible: row.eligible,
    alpacaRiskLevel: row.alpacaRiskLevel,
    currency: row.currency,
    ineligibilityReason: row.ineligibilityReason,
    ineligibilityCategory: row.ineligibilityCategory as Country["ineligibilityCategory"],
    managedInvesting: row.managedInvesting as Country["managedInvesting"],
    userStats: row.userStats as Country["userStats"],
    fees: row.fees as Country["fees"],
    knowledgeBase: kb as KnowledgeBase | null,
    contentSource: dbSourceToLabel(row.contentSource),
    updatedAt: row.updatedAt.toISOString(),
    updatedByName: row.updatedBy?.name ?? null,
  };
}

export const KB_SECTION_KEYS = KB_SECTIONS.map((s) => s.key);
