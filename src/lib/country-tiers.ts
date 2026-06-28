/** Musaffa country priority tiers — lower number = higher priority. */

export type CountryTier = 1 | 3 | 4 | 5 | 6;

const TIER_BY_SLUG: Record<string, CountryTier> = {
  // Tier 1
  "switzerland": 1,
  "united-states-of-america": 1,
  "france": 1,
  "united-kingdom": 1,
  "ireland": 1,
  "singapore": 1,
  "germany": 1,
  "netherlands": 1,
  "sweden": 1,
  "belgium": 1,
  // Tier 3
  "canada": 3,
  "australia": 3,
  "united-arab-emirates": 3,
  "qatar": 3,
  "saudi-arabia": 3,
  "bahrain": 3,
  // Tier 4
  "oman": 4,
  "japan": 4,
  // Tier 5
  "kuwait": 5,
  "malaysia": 5,
  // Tier 6
  "thailand": 6,
  "morocco": 6,
  "turkey": 6,
  "indonesia": 6,
  "jordan": 6,
  "uzbekistan": 6,
  "egypt": 6,
  "india": 6,
  "pakistan": 6,
  "bangladesh": 6,
};

export function getCountryTier(slug: string): CountryTier | null {
  return TIER_BY_SLUG[slug] ?? null;
}

export function getTierLabel(tier: CountryTier): string {
  return `Tier ${tier}`;
}

/** Sort: eligible first, then tier (1→6), untiered last, then name. */
export function compareCountryPriority<
  T extends { slug: string; name: string; eligible: boolean },
>(a: T, b: T): number {
  if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;

  const tierA = getCountryTier(a.slug) ?? 99;
  const tierB = getCountryTier(b.slug) ?? 99;
  if (tierA !== tierB) return tierA - tierB;

  return a.name.localeCompare(b.name);
}

export const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "1", label: "Tier 1" },
  { value: "3", label: "Tier 3" },
  { value: "4", label: "Tier 4" },
  { value: "5", label: "Tier 5" },
  { value: "6", label: "Tier 6" },
];

export const TIER_1_SLUGS = Object.entries(TIER_BY_SLUG)
  .filter(([, t]) => t === 1)
  .map(([slug]) => slug);
