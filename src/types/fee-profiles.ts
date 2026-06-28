export type TransactionDirection = "deposit" | "withdraw";

/** Who bears bank/transfer commission */
export type CommissionBearer = "sender" | "receiver";

export interface TransferMethodDef {
  id: string;
  label: string;
  description: string;
  deposit: boolean;
  withdraw: boolean;
  recommended?: boolean;
  /** Currency the user sends (deposit) or receives (withdraw). Defaults to profile currency. */
  transferCurrency?: string;
}

export interface MethodBankFees {
  depositFee: number;
  withdrawalFee: number;
  incomingFee?: number;
  /** Bank FX markup when converting to/from USD. Zero for same-currency USD transfers. */
  fxSpreadPercent: number;
  correspondentFee: number;
  notes?: string;
}

export interface BankDef {
  id: string;
  name: string;
  methods: Record<string, MethodBankFees>;
}

export interface AlpacaFeeConfig {
  depositFee: number;
  withdrawalWireFee: number;
  currencyCloudFee: number;
}

export interface CountryFeeProfile {
  /** User's local bank currency */
  currency: string;
  /** Indicative rate: 1 local currency unit → USD (for internal estimates only) */
  fxRateToUsd?: number;
  methods: TransferMethodDef[];
  banks: BankDef[];
  alpaca: AlpacaFeeConfig;
}

export type FlowStepKind =
  | "user_sends"
  | "user_receives"
  | "account_debit"
  | "account_credit"
  | "bank_fee"
  | "fx_conversion"
  | "broker_fee"
  | "swift_fee"
  | "total_fees";

export interface FlowStep {
  kind: FlowStepKind;
  label: string;
  amount: number;
  currency: string;
  detail?: string;
  isDeduction?: boolean;
  /** Separate fee component (e.g. FX markup taken before conversion) */
  feeDeduction?: { amount: number; currency: string };
}

export interface FeeCalculationInput {
  direction: TransactionDirection;
  amount: number;
  commissionBearer: CommissionBearer;
  methodId: string;
  bankId: string;
  profile: CountryFeeProfile;
}

export interface FeeCalculationResult {
  direction: TransactionDirection;
  commissionBearer: CommissionBearer;
  methodLabel: string;
  bankName: string;
  inputAmount: number;
  inputCurrency: string;
  /** Brokerage account currency — always USD */
  accountCurrency: "USD";
  accountAmount: number;
  netAmount: number;
  userTransferAmount: number;
  userTransferCurrency: string;
  totalFees: number;
  steps: FlowStep[];
  methodNotes?: string;
}
