import type { Country, MarketingAccess } from "@/types/country";

/** EU member states — conditional access (popup confirmation required). */
const CONDITIONAL_SLUGS = new Set([
  "austria",
  "belgium",
  "bulgaria",
  "croatia",
  "cyprus",
  "czech-republic",
  "denmark",
  "estonia",
  "finland",
  "france",
  "germany",
  "greece",
  "hungary",
  "ireland",
  "italy",
  "latvia",
  "lithuania",
  "luxembourg",
  "malta",
  "netherlands",
  "poland",
  "portugal",
  "romania",
  "slovakia",
  "slovenia",
  "spain",
  "sweden",
  "kuwait",
  "singapore",
  "malaysia",
  "united-arab-emirates",
]);

/** Hard block — no popup, no onboarding. */
const RESTRICTED_SLUGS = new Set([
  "australia",
  "united-kingdom",
  "india",
  "saudi-arabia",
]);

const RESTRICTED_CODES = new Set(["AUS", "GBR", "IND", "SAU", "UNI"]);

export const MARKETING_ACCESS_LABELS: Record<
  MarketingAccess,
  { label: string; description: string }
> = {
  open: {
    label: "Open",
    description: "Musaffa may actively promote to users in this country.",
  },
  conditional: {
    label: "Conditional",
    description:
      "Musaffa cannot promote to this country. Users who find the platform may proceed after signing a confirmation popup.",
  },
  restricted: {
    label: "Marketing Block",
    description:
      "Hard block — no popup, no onboarding. Musaffa cannot serve users from this country.",
  },
};

export function getMarketingAccess(
  country: Pick<Country, "slug" | "code">,
): MarketingAccess {
  if (RESTRICTED_SLUGS.has(country.slug) || RESTRICTED_CODES.has(country.code)) {
    return "restricted";
  }
  if (CONDITIONAL_SLUGS.has(country.slug)) {
    return "conditional";
  }
  return "open";
}
