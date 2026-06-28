export type TransactionDirection = "deposit" | "withdraw";

/** Who pays Alpaca wire fees — maps to fee_payment_method: user | invoice */
export type FeePayer = "user" | "musaffa";

export interface FeeRates {
  /** Alpaca international wire withdrawal fee (USD flat) */
  alpacaWithdrawalWire: number;
  /** Alpaca deposit / incoming wire fee (USD flat, usually 0) */
  alpacaDepositWire: number;
  /** Local bank flat fee on deposit (USD equivalent) */
  localBankDeposit: number;
  /** Local bank flat fee on withdrawal (USD equivalent) */
  localBankWithdrawal: number;
  /** FX spread as decimal, e.g. 0.008 = 0.8% */
  fxSpreadPercent: number;
  /** SWIFT correspondent / intermediary bank fee (USD flat) */
  correspondentBankFee: number;
  /** Currency Cloud conversion fee on deposit (USD flat, if applicable) */
  currencyCloudConversion: number;
}

export interface FeeLineItem {
  label: string;
  amount: number;
  paidBy: "user" | "musaffa";
  description?: string;
}

export interface FeeCalculationResult {
  direction: TransactionDirection;
  feePayer: FeePayer;
  /** What the user typed — meaning depends on direction + feePayer */
  inputAmount: number;
  /** Amount credited to / debited from Alpaca account */
  accountAmount: number;
  /** Final amount user receives (withdraw) or lands on account (deposit) */
  netAmount: number;
  /** Total user pays out of pocket */
  userTotalCost: number;
  /** Total Musaffa absorbs (invoiced separately) */
  musaffaTotalCost: number;
  lineItems: FeeLineItem[];
  summary: string;
}

export const DEFAULT_FEE_RATES: FeeRates = {
  alpacaWithdrawalWire: 50,
  alpacaDepositWire: 0,
  localBankDeposit: 15,
  localBankWithdrawal: 25,
  fxSpreadPercent: 0.008,
  correspondentBankFee: 20,
  currencyCloudConversion: 0,
};

export const UAE_FEE_RATES: FeeRates = {
  alpacaWithdrawalWire: 50,
  alpacaDepositWire: 0,
  localBankDeposit: 7,
  localBankWithdrawal: 27,
  fxSpreadPercent: 0.008,
  correspondentBankFee: 25,
  currencyCloudConversion: 0,
};
