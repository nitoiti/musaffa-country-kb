import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient, ContentSource } from "@prisma/client";
import type { Country, KnowledgeBase, KBSectionKey } from "../src/types/country";
import { KB_SECTIONS } from "../src/types/country";

const prisma = new PrismaClient();

const KB_KEYS = KB_SECTIONS.map((s) => s.key);

async function main() {
  const path = join(process.cwd(), "data", "countries.json");
  const countries = JSON.parse(readFileSync(path, "utf-8")) as Country[];

  console.log(`Seeding ${countries.length} countries…`);

  for (const c of countries) {
    const kb = c.knowledgeBase as KnowledgeBase | null;
    const hasKbContent = kb
      ? KB_KEYS.some((k) => kb[k]?.content?.trim())
      : false;

    await prisma.country.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        code: c.code,
        name: c.name,
        region: c.region,
        eligible: c.eligible,
        alpacaRiskLevel: c.alpacaRiskLevel,
        currency: c.currency,
        ineligibilityReason: c.ineligibilityReason,
        ineligibilityCategory: c.ineligibilityCategory,
        managedInvesting: c.managedInvesting ?? undefined,
        fees: c.fees ?? undefined,
        userStats: c.userStats ?? undefined,
        contentSource: hasKbContent
          ? ContentSource.AI_GENERATED
          : ContentSource.AI_GENERATED,
        kbSections: kb
          ? {
              create: KB_KEYS.map((key) => ({
                sectionKey: key,
                status: kb[key]?.status ?? "draft",
                content: kb[key]?.content ?? "",
                contentSource: kb[key]?.content?.trim()
                  ? ContentSource.AI_GENERATED
                  : ContentSource.AI_GENERATED,
              })),
            }
          : undefined,
      },
      update: {
        code: c.code,
        name: c.name,
        region: c.region,
        eligible: c.eligible,
        alpacaRiskLevel: c.alpacaRiskLevel,
        currency: c.currency,
        ineligibilityReason: c.ineligibilityReason,
        ineligibilityCategory: c.ineligibilityCategory,
        managedInvesting: c.managedInvesting ?? undefined,
        fees: c.fees ?? undefined,
        userStats: c.userStats ?? undefined,
      },
    });

    if (kb && c.eligible) {
      const country = await prisma.country.findUnique({
        where: { slug: c.slug },
      });
      if (!country) continue;

      for (const key of KB_KEYS) {
        await prisma.kBSection.upsert({
          where: {
            countryId_sectionKey: {
              countryId: country.id,
              sectionKey: key,
            },
          },
          create: {
            countryId: country.id,
            sectionKey: key,
            status: kb[key]?.status ?? "draft",
            content: kb[key]?.content ?? "",
            contentSource: ContentSource.AI_GENERATED,
          },
          update: {
            status: kb[key]?.status ?? "draft",
            content: kb[key]?.content ?? "",
          },
        });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
