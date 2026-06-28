export type IneligibilityCategory =
  | "prohibited"
  | "restricted"
  | "high_risk"
  | "regulatory_restrictions";

export type MarketingAccess = "open" | "conditional" | "restricted";

export type KBSectionKey =
  | "accountOpening"
  | "kyc"
  | "riskAssessment"
  | "funding"
  | "fees"
  | "withdrawals"
  | "portfolioInformation"
  | "troubleshooting"
  | "generalFaqs";

export type KBSectionStatus = "draft" | "published" | "needs_review";

export interface KBSection {
  status: KBSectionStatus;
  content: string;
  contentSource?: "ai_generated" | "human_verified";
  updatedAt?: string;
  updatedByName?: string | null;
}

export interface UserStages {
  accountOpening: number;
  kyc: number;
  riskAssessment: number;
  funding: number;
  active: number;
}

export interface UserStats {
  totalUsers: number;
  stages: UserStages;
}

export interface AlpacaFees {
  depositWireDomestic: string;
  depositWireInternational: string;
  withdrawalWireDomestic: string;
  withdrawalWireInternational: string;
  fundingWalletLocalRail: string;
  notes: string;
}

export interface LocalBankFees {
  depositFee: string;
  withdrawalFee: string;
  fxConversionFee: string;
  notes: string;
}

export interface CountryFees {
  alpaca: AlpacaFees;
  localBank: LocalBankFees;
  /** Numeric rates for the fee calculator — optional, defaults used if missing */
  rates?: import("@/types/fees").FeeRates;
}

export interface ManagedInvesting {
  enabled: boolean;
  provider: string;
  notes: string;
}

export interface KnowledgeBase {
  accountOpening: KBSection;
  kyc: KBSection;
  riskAssessment: KBSection;
  funding: KBSection;
  fees: KBSection;
  withdrawals: KBSection;
  portfolioInformation: KBSection;
  troubleshooting: KBSection;
  generalFaqs: KBSection;
}

export interface Country {
  code: string;
  name: string;
  slug: string;
  region: string;
  eligible: boolean;
  alpacaRiskLevel: string | null;
  currency: string | null;
  ineligibilityReason: string | null;
  ineligibilityCategory: IneligibilityCategory | null;
  managedInvesting: ManagedInvesting | null;
  userStats: UserStats | null;
  fees: CountryFees | null;
  knowledgeBase: KnowledgeBase | null;
}

/** Lightweight shape for dashboard — avoids sending full KB to the client */
export interface CountryListItem {
  slug: string;
  name: string;
  code: string;
  region: string;
  eligible: boolean;
  alpacaRiskLevel: string | null;
  currency: string | null;
  ineligibilityCategory: IneligibilityCategory | null;
  tier: import("@/lib/country-tiers").CountryTier | null;
  contentSource: "ai_generated" | "human_verified";
}

export type DashboardStatus =
  | "eligible"
  | "not_eligible"
  | "prohibited"
  | "high_risk"
  | "restricted"
  | "regulatory_restrictions";

export const KB_SECTIONS: { key: KBSectionKey; label: string }[] = [
  { key: "accountOpening", label: "Account Opening" },
  { key: "kyc", label: "KYC" },
  { key: "riskAssessment", label: "Risk Assessment" },
  { key: "funding", label: "Funding" },
  { key: "fees", label: "Fees" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "portfolioInformation", label: "Portfolio Information" },
  { key: "troubleshooting", label: "Troubleshooting" },
  { key: "generalFaqs", label: "General FAQs" },
];

export const STAGE_LABELS: { key: keyof UserStages; label: string }[] = [
  { key: "accountOpening", label: "Account Opening" },
  { key: "kyc", label: "KYC" },
  { key: "riskAssessment", label: "Risk Assessment" },
  { key: "funding", label: "Funding" },
  { key: "active", label: "Active" },
];

export const INELIGIBILITY_LABELS: Record<IneligibilityCategory, string> = {
  prohibited: "Prohibited",
  restricted: "Restricted",
  high_risk: "High Risk",
  regulatory_restrictions: "Regulatory Restrictions",
};
