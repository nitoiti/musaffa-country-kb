import type { CountryFeeProfile } from "@/types/fee-profiles";

const zeroFx = { fxSpreadPercent: 0, correspondentFee: 0 };

export const US_FEE_PROFILE: CountryFeeProfile = {
  currency: "USD",
  alpaca: { depositFee: 0, withdrawalWireFee: 25, currencyCloudFee: 0 },
  methods: [
    {
      id: "ach",
      label: "ACH (Plaid)",
      description: "Default for U.S. residents. Linked bank account via Plaid. No Alpaca fee.",
      deposit: true,
      withdraw: true,
      recommended: true,
    },
    {
      id: "domestic_wire",
      label: "Domestic wire",
      description: "U.S. bank wire to Alpaca. Use when ACH is unavailable.",
      deposit: true,
      withdraw: true,
    },
    {
      id: "international_wire",
      label: "International wire",
      description: "SWIFT from a U.S. bank. Rare for U.S. residents; higher bank fees.",
      deposit: true,
      withdraw: true,
    },
  ],
  banks: [
    {
      id: "chase",
      name: "Chase",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx, notes: "Preferred method. No Chase fee on standard ACH." },
        domestic_wire: { depositFee: 25, withdrawalFee: 25, incomingFee: 15, ...zeroFx, notes: "$25 online outgoing; $35 in branch; $15 incoming wire." },
        international_wire: { depositFee: 40, withdrawalFee: 50, incomingFee: 15, ...zeroFx, notes: "$40 online / $50 branch international outgoing. USD wire — no FX markup." },
      },
    },
    {
      id: "bofa",
      name: "Bank of America",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 30, withdrawalFee: 30, incomingFee: 15, ...zeroFx, notes: "$30 domestic wire (online)." },
        international_wire: { depositFee: 45, withdrawalFee: 45, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "wells-fargo",
      name: "Wells Fargo",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 25, withdrawalFee: 25, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 40, withdrawalFee: 45, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "citi",
      name: "Citibank",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 25, withdrawalFee: 25, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 35, withdrawalFee: 35, incomingFee: 15, fxSpreadPercent: 0, correspondentFee: 20 },
      },
    },
    {
      id: "usbank",
      name: "U.S. Bank",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 20, withdrawalFee: 20, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 40, withdrawalFee: 50, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "pnc",
      name: "PNC Bank",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 15, withdrawalFee: 15, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 45, withdrawalFee: 45, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "truist",
      name: "Truist",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 25, withdrawalFee: 25, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 45, withdrawalFee: 45, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "capital-one",
      name: "Capital One",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 30, withdrawalFee: 30, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 40, withdrawalFee: 40, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "td",
      name: "TD Bank",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx },
        domestic_wire: { depositFee: 15, withdrawalFee: 15, incomingFee: 15, ...zeroFx },
        international_wire: { depositFee: 40, withdrawalFee: 40, incomingFee: 15, ...zeroFx },
      },
    },
    {
      id: "ally",
      name: "Ally Bank",
      methods: {
        ach: { depositFee: 0, withdrawalFee: 0, ...zeroFx, notes: "Online bank — ACH only for most customers." },
        domestic_wire: { depositFee: 0, withdrawalFee: 20, incomingFee: 0, ...zeroFx, notes: "Outgoing wire $20; incoming wires not accepted." },
        international_wire: { depositFee: 0, withdrawalFee: 0, ...zeroFx, notes: "Not available at Ally." },
      },
    },
  ],
};

const sepaRail = (deposit: number, withdrawal: number, fx = 0.008, notes?: string) => ({
  sepa_local_rail: { depositFee: deposit, withdrawalFee: withdrawal, fxSpreadPercent: fx, correspondentFee: 0, notes },
  international_swift: {
    depositFee: deposit + 10,
    withdrawalFee: withdrawal + 15,
    fxSpreadPercent: fx + 0.003,
    correspondentFee: 25,
    notes: "Higher cost than local rail — use as fallback.",
  },
});

export const IE_FEE_PROFILE: CountryFeeProfile = {
  currency: "EUR",
  fxRateToUsd: 1.08,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "EUR local rail", description: "Funding Wallet SEPA/local rail — recommended.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International SWIFT", description: "SWIFT wire in EUR or USD.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "aib", name: "AIB", methods: sepaRail(15, 22.5, 0.008, "Non-urgent outgoing €15; urgent €22.50; incoming intl from €6.35.") },
    { id: "bank-of-ireland", name: "Bank of Ireland", methods: sepaRail(12, 20, 0.008) },
    { id: "revolut", name: "Revolut", methods: sepaRail(0, 0, 0.006, "SEPA often free; FX at interbank + markup.") },
    { id: "ptsb", name: "Permanent TSB", methods: sepaRail(10, 18, 0.009) },
  ],
};

export const DE_FEE_PROFILE: CountryFeeProfile = {
  currency: "EUR",
  fxRateToUsd: 1.08,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "EUR local rail", description: "Funding Wallet local rail — default route.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International SWIFT", description: "Fallback when local rail unavailable.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "deutsche-bank", name: "Deutsche Bank", methods: sepaRail(10, 25, 0.008, "SWIFT OUR: ≥€10 + €1.55 + €25 foreign-bank before FX.") },
    { id: "commerzbank", name: "Commerzbank", methods: sepaRail(8, 20, 0.008) },
    { id: "ing-de", name: "ING Germany", methods: sepaRail(0, 0, 0.007, "SEPA transfers often free.") },
    { id: "dkb", name: "DKB", methods: sepaRail(0, 0, 0.006) },
    { id: "n26", name: "N26", methods: sepaRail(0, 0, 0.006) },
  ],
};

export const NL_FEE_PROFILE: CountryFeeProfile = {
  currency: "EUR",
  fxRateToUsd: 1.08,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "EUR local rail", description: "Recommended — low FX markup.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International SWIFT", description: "Higher FX and correspondent fees.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "ing", name: "ING", methods: sepaRail(0, 0, 0.0085, "0.85% FX mark-up on 19 currencies for intl transfers.") },
    { id: "abn", name: "ABN AMRO", methods: sepaRail(5, 10, 0.008) },
    { id: "rabobank", name: "Rabobank", methods: sepaRail(8, 12, 0.008) },
    { id: "bunq", name: "bunq", methods: sepaRail(0, 0, 0.007) },
  ],
};

export const FR_FEE_PROFILE: CountryFeeProfile = {
  currency: "EUR",
  fxRateToUsd: 1.08,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "EUR local rail", description: "Funding Wallet local rail.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International SWIFT", description: "SWIFT fallback.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "bnp", name: "BNP Paribas", methods: sepaRail(0, 0, 0.007, "Free if beneficiary currency + full details; else €15 + correspondent.") },
    { id: "socgen", name: "Société Générale", methods: sepaRail(8, 12, 0.008) },
    { id: "credit-agricole", name: "Crédit Agricole", methods: sepaRail(5, 10, 0.008) },
    { id: "boursorama", name: "Boursorama", methods: sepaRail(0, 0, 0.006) },
  ],
};

export const CH_FEE_PROFILE: CountryFeeProfile = {
  currency: "CHF",
  fxRateToUsd: 1.12,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "swift_chf", label: "SWIFT (CHF)", description: "Primary funding route for Swiss users.", deposit: true, withdraw: true, recommended: true },
    { id: "swift_usd", label: "SWIFT (USD)", description: "USD wire from Swiss bank — no FX conversion.", deposit: true, withdraw: true, transferCurrency: "USD" },
  ],
  banks: [
    {
      id: "ubs",
      name: "UBS",
      methods: {
        swift_chf: { depositFee: 66, withdrawalFee: 20, fxSpreadPercent: 0.012, correspondentFee: 20, notes: "Incoming non-SEPA CHF ~CHF 66 (SHA/BEN). OUR adds CHF 20." },
        swift_usd: { depositFee: 66, withdrawalFee: 20, fxSpreadPercent: 0.01, correspondentFee: 25, notes: "FX surcharge applies on conversion." },
      },
    },
    {
      id: "credit-suisse",
      name: "Credit Suisse (UBS)",
      methods: {
        swift_chf: { depositFee: 55, withdrawalFee: 18, fxSpreadPercent: 0.012, correspondentFee: 18 },
        swift_usd: { depositFee: 55, withdrawalFee: 18, fxSpreadPercent: 0.01, correspondentFee: 22 },
      },
    },
    { id: "postfinance", name: "PostFinance", methods: {
        swift_chf: { depositFee: 40, withdrawalFee: 15, fxSpreadPercent: 0.01, correspondentFee: 15 },
        swift_usd: { depositFee: 45, withdrawalFee: 15, fxSpreadPercent: 0.01, correspondentFee: 20 },
      }},
    { id: "raiffeisen", name: "Raiffeisen", methods: {
        swift_chf: { depositFee: 35, withdrawalFee: 12, fxSpreadPercent: 0.011, correspondentFee: 12 },
        swift_usd: { depositFee: 40, withdrawalFee: 12, fxSpreadPercent: 0.011, correspondentFee: 18 },
      }},
  ],
};

export const UAE_FEE_PROFILE: CountryFeeProfile = {
  currency: "AED",
  fxRateToUsd: 0.27,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "international_swift", label: "International SWIFT", description: "Primary route — AED/USD wire to Funding Wallet.", deposit: true, withdraw: true, recommended: true },
    { id: "local_transfer", label: "Local bank transfer", description: "Domestic UAE transfer where supported.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "enbd", name: "Emirates NBD", methods: {
        international_swift: { depositFee: 25, withdrawalFee: 50, fxSpreadPercent: 0.008, correspondentFee: 25, notes: "AED 25 outgoing typical; SWIFT correspondent fees apply." },
        local_transfer: { depositFee: 25, withdrawalFee: 50, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
    { id: "adcb", name: "ADCB", methods: {
        international_swift: { depositFee: 25, withdrawalFee: 55, fxSpreadPercent: 0.008, correspondentFee: 25 },
        local_transfer: { depositFee: 25, withdrawalFee: 50, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
    { id: "fab", name: "First Abu Dhabi Bank", methods: {
        international_swift: { depositFee: 25, withdrawalFee: 50, fxSpreadPercent: 0.008, correspondentFee: 25 },
        local_transfer: { depositFee: 25, withdrawalFee: 50, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
    { id: "mashreq", name: "Mashreq", methods: {
        international_swift: { depositFee: 20, withdrawalFee: 45, fxSpreadPercent: 0.008, correspondentFee: 20 },
        local_transfer: { depositFee: 20, withdrawalFee: 45, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
  ],
};

export const SG_FEE_PROFILE: CountryFeeProfile = {
  currency: "SGD",
  fxRateToUsd: 0.74,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "remit", label: "Remittance (DBS Remit etc.)", description: "Same-day remit corridors — often low fee.", deposit: true, withdraw: false, recommended: true },
    { id: "swift", label: "Telegraphic transfer (SWIFT)", description: "Traditional SWIFT — higher fees.", deposit: true, withdraw: true },
    { id: "local_rail_withdraw", label: "Local rail withdrawal", description: "Funding Wallet local-rail payout.", deposit: false, withdraw: true, recommended: true },
  ],
  banks: [
    { id: "dbs", name: "DBS", methods: {
        remit: { depositFee: 0, withdrawalFee: 0, fxSpreadPercent: 0.005, correspondentFee: 0, notes: "DBS Remit: zero fee USD to USA on eligible corridors." },
        swift: { depositFee: 20, withdrawalFee: 25, fxSpreadPercent: 0.008, correspondentFee: 15 },
        local_rail_withdraw: { depositFee: 0, withdrawalFee: 10, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
    { id: "ocbc", name: "OCBC", methods: {
        remit: { depositFee: 5, withdrawalFee: 0, fxSpreadPercent: 0.006, correspondentFee: 0 },
        swift: { depositFee: 25, withdrawalFee: 30, fxSpreadPercent: 0.008, correspondentFee: 15 },
        local_rail_withdraw: { depositFee: 0, withdrawalFee: 12, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
    { id: "uob", name: "UOB", methods: {
        remit: { depositFee: 5, withdrawalFee: 0, fxSpreadPercent: 0.006, correspondentFee: 0 },
        swift: { depositFee: 25, withdrawalFee: 30, fxSpreadPercent: 0.008, correspondentFee: 15 },
        local_rail_withdraw: { depositFee: 0, withdrawalFee: 12, fxSpreadPercent: 0.005, correspondentFee: 0 },
      }},
  ],
};

export const BE_FEE_PROFILE: CountryFeeProfile = {
  currency: "EUR",
  fxRateToUsd: 1.08,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "EUR local rail", description: "Funding Wallet local rail.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International SWIFT", description: "SWIFT fallback.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "bnp-fortis", name: "BNP Paribas Fortis", methods: sepaRail(0, 3, 0.008, "Free if beneficiary currency; else €3–€15.") },
    { id: "kbc", name: "KBC", methods: sepaRail(5, 10, 0.008, "Processing fee + exchange-rate difference.") },
    { id: "ing-be", name: "ING Belgium", methods: sepaRail(0, 0, 0.007) },
  ],
};

export const SE_FEE_PROFILE: CountryFeeProfile = {
  currency: "SEK",
  fxRateToUsd: 0.096,
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "sepa_local_rail", label: "Local rail (SEK/EUR)", description: "Recommended local-rail route.", deposit: true, withdraw: true, recommended: true },
    { id: "international_swift", label: "International payment", description: "Higher Nordea intl fees.", deposit: true, withdraw: true },
  ],
  banks: [
    { id: "nordea", name: "Nordea", methods: {
        sepa_local_rail: { depositFee: 0, withdrawalFee: 0, fxSpreadPercent: 0.008, correspondentFee: 0, notes: "Use local rail — not 60 SEK intl payment." },
        international_swift: { depositFee: 60, withdrawalFee: 60, fxSpreadPercent: 0.01, correspondentFee: 250, notes: "Online intl 60 SEK; beneficiary abroad 250 SEK." },
      }},
    { id: "seb", name: "SEB", methods: sepaRail(0, 0, 0.008) },
    { id: "swedbank", name: "Swedbank", methods: sepaRail(0, 0, 0.008) },
  ],
};

export const DEFAULT_FEE_PROFILE: CountryFeeProfile = {
  currency: "USD",
  alpaca: { depositFee: 0, withdrawalWireFee: 50, currencyCloudFee: 0 },
  methods: [
    { id: "international_swift", label: "International SWIFT", description: "Wire to/from Alpaca Funding Wallet.", deposit: true, withdraw: true, recommended: true },
  ],
  banks: [
    { id: "avg-major", name: "Major retail bank (avg.)", methods: {
        international_swift: { depositFee: 25, withdrawalFee: 35, fxSpreadPercent: 0.008, correspondentFee: 20, notes: "Average estimate — configure bank-specific rates." },
      }},
    { id: "avg-digital", name: "Digital bank (avg.)", methods: {
        international_swift: { depositFee: 15, withdrawalFee: 25, fxSpreadPercent: 0.006, correspondentFee: 15 },
      }},
  ],
};

const PROFILES: Record<string, CountryFeeProfile> = {
  "united-states-of-america": US_FEE_PROFILE,
  ireland: IE_FEE_PROFILE,
  germany: DE_FEE_PROFILE,
  netherlands: NL_FEE_PROFILE,
  france: FR_FEE_PROFILE,
  belgium: BE_FEE_PROFILE,
  sweden: SE_FEE_PROFILE,
  switzerland: CH_FEE_PROFILE,
  "united-arab-emirates": UAE_FEE_PROFILE,
  singapore: SG_FEE_PROFILE,
};

export function getFeeProfile(slug: string): CountryFeeProfile {
  return PROFILES[slug] ?? DEFAULT_FEE_PROFILE;
}

/** Banks available for display — max 10, or all if fewer */
export function getBanksForProfile(profile: CountryFeeProfile): CountryFeeProfile["banks"] {
  return profile.banks.slice(0, 10);
}

export function getMethodsForDirection(
  profile: CountryFeeProfile,
  direction: "deposit" | "withdraw",
): CountryFeeProfile["methods"] {
  return profile.methods.filter((m) => (direction === "deposit" ? m.deposit : m.withdraw));
}

export function getBankMethodFees(
  bank: CountryFeeProfile["banks"][0],
  methodId: string,
): import("@/types/fee-profiles").MethodBankFees | undefined {
  return bank.methods[methodId];
}
