import countriesData from "../../data/countries.json";
import { compareCountryPriority, getCountryTier } from "@/lib/country-tiers";
import { mapCountryRow } from "@/lib/country-mapper";
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
  const countries = await loadCountries();
  const eligible = countries.filter((c) => c.eligible).length;
  return {
    total: countries.length,
    eligible,
    notEligible: countries.length - eligible,
  };
}

export { type DashboardStatus };
