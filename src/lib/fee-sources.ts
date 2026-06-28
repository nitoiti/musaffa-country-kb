/** Official references shown in the fee calculator */
export const FEE_SOURCE_LINKS = {
  alpacaFundingWallets: {
    label: "Alpaca — Funding Wallets FAQ",
    href: "https://alpaca.markets/support/funding-wallets-for-broker-api-2",
    note: "Deposits to Funding Wallets are free. Withdrawals incur a fee that varies by payment rail (local_rails vs swift_wire). Non-USD transfers include FX conversion.",
  },
  alpacaFundingWalletsDocs: {
    label: "Alpaca — Funding Wallets docs",
    href: "https://docs.alpaca.markets/docs/funding-wallets",
    note: "Local rail deposit and withdrawal flows; Belgium is in the supported regions list.",
  },
  alpacaWithdrawalApi: {
    label: "Alpaca — Create withdrawal API",
    href: "https://docs.alpaca.markets/reference/createfundingwalletwithdrawal",
    note: "payment_type: local_rails or swift_wire.",
  },
  alpacaWireFees: {
    label: "Alpaca — Outgoing wire fees",
    href: "https://docs.alpaca.markets/docs/funding-accounts",
    note: "Outgoing domestic/international wire fees (Transfers API) — separate from Funding Wallet local rails but same broker contract context.",
  },
} as const;
