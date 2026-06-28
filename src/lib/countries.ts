import countriesData from "../../data/countries.json";
import { compareCountryPriority, getCountryTier } from "@/lib/country-tiers";
import { dbSourceToLabel, mapCountryRow } from "@/lib/country-mapper";
import { prisma } from "@/lib/db";
import type { Country, CountryListItem, DashboardStatus } from "@/types/country";

const jsonCountries = countriesData as Country[];

export function getDashboardStatus(
  country: Pick<Country, "eligible" | "ineligibilityCategory">,
): DashboardStatus {
  if (country.eligible) return "eligible";
  const cat = country.ineligibilityCategory;
  if (
    cat === "prohibited" ||
    cat === "restricted" ||
    cat === "high_risk" ||
    cat === "regulatory_restrictions"
  ) {
    return cat;
  }
  return "not_eligible";
}

const countryInclude = {
  kbSections: {
    include: { updatedBy: { select: { name: true } } },
  },
  updatedBy: { select: { name: true } },
} as const;

function fromJson(): Country[] {
  return jsonCountries;
}

async function fromDb(): Promise<Country[]> {
  const rows = await prisma.country.findMany({
    include: countryInclude,
    orderBy: { name: "asc" },
  });
  return rows.map(mapCountryRow);
}

async function loadCountries(): Promise<Country[]> {
  if (!process.env.DATABASE_URL) {
    return fromJson();
  }
  try {
    const count = await prisma.country.count();
    if (count === 0) return fromJson();
    return fromDb();
  } catch {
    return fromJson();
  }
}

export async function getAllCountries(): Promise<Country[]> {
  return loadCountries();
}

export async function getCountryListItems(): Promise<CountryListItem[]> {
  if (process.env.DATABASE_URL) {
    try {
      const count = await prisma.country.count();
      if (count > 0) {
        const rows = await prisma.country.findMany({
          select: {
            slug: true,
            name: true,
            code: true,
            region: true,
            eligible: true,
            alpacaRiskLevel: true,
            currency: true,
            ineligibilityCategory: true,
            contentSource: true,
          },
          orderBy: { name: "asc" },
        });
        return rows
          .map((r) => ({
            slug: r.slug,
            name: r.name,
            code: r.code,
            region: r.region,
            eligible: r.eligible,
            alpacaRiskLevel: r.alpacaRiskLevel,
            currency: r.currency,
            ineligibilityCategory:
              r.ineligibilityCategory as CountryListItem["ineligibilityCategory"],
            tier: getCountryTier(r.slug),
            contentSource: dbSourceToLabel(r.contentSource),
          }))
          .sort(compareCountryPriority);
      }
    } catch {
      /* fallback */
    }
  }

  const countries = await loadCountries();
  return countries
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      code: c.code,
      region: c.region,
      eligible: c.eligible,
      alpacaRiskLevel: c.alpacaRiskLevel,
      currency: c.currency,
      ineligibilityCategory: c.ineligibilityCategory,
      tier: getCountryTier(c.slug),
      contentSource: "ai_generated" as const,
    }))
    .sort(compareCountryPriority);
}

export async function getCountryBySlug(slug: string): Promise<Country | undefined> {
  if (!process.env.DATABASE_URL) {
    return jsonCountries.find((c) => c.slug === slug);
  }
  try {
    const row = await prisma.country.findUnique({
      where: { slug },
      include: countryInclude,
    });
    if (row) return mapCountryRow(row);
  } catch {
    /* fallback */
  }
  return jsonCountries.find((c) => c.slug === slug);
}

export async function getCountrySummary() {
  if (process.env.DATABASE_URL) {
    try {
      const count = await prisma.country.count();
      if (count > 0) {
        const [total, aiGenerated, teamVerified] = await Promise.all([
          prisma.country.count(),
          prisma.country.count({ where: { contentSource: "AI_GENERATED" } }),
          prisma.country.count({ where: { contentSource: "HUMAN_VERIFIED" } }),
        ]);
        return { total, aiGenerated, teamVerified };
      }
    } catch {
      /* fallback */
    }
  }

  const countries = await loadCountries();
  return {
    total: countries.length,
    aiGenerated: countries.length,
    teamVerified: 0,
  };
}

export { type DashboardStatus };
