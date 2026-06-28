import type {
  CountryFeeProfile,
  FeeCalculationInput,
  FeeCalculationResult,
  FlowStep,
  CommissionBearer,
  MethodBankFees,
  TransactionDirection,
} from "@/types/fee-profiles";
import { getBankMethodFees } from "@/lib/fee-profiles";
import { FALLBACK_RATES_TO_USD } from "@/lib/fx-rates";

const ACCOUNT_CCY = "USD";

/** @deprecated Use exchange rate API date instead — kept for fallback display */
export const FX_RATES_AS_OF = "2025-06-01";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatUsd(amount: number): string {
  return formatMoney(amount, "USD");
}

function fxRate(profile: CountryFeeProfile, transferCcy: string): number {
  if (transferCcy === ACCOUNT_CCY) return 1;
  return profile.fxRateToUsd ?? FALLBACK_RATES_TO_USD[transferCcy] ?? 1;
}

/** Suggested extra USD on withdraw when FX applies — settlement rate may differ from estimate */
export const FX_WITHDRAW_BUFFER_USD = { min: 5, max: 10 } as const;

export function getReceiveCurrencyOptions(
  profile: CountryFeeProfile,
  methodId: string,
): string[] {
  const transfer = getTransferCurrency(profile, methodId);
  const options = new Set<string>([transfer]);
  if (profile.currency !== transfer) {
    options.add(profile.currency);
  }
  if (
    (methodId.includes("swift") || methodId === "international_swift") &&
    transfer !== "USD"
  ) {
    options.add("USD");
  }
  return [...options];
}

export function getTransferCurrency(
  profile: CountryFeeProfile,
  methodId: string,
): string {
  const method = profile.methods.find((m) => m.id === methodId);
  if (method?.transferCurrency) return method.transferCurrency;
  if (methodId === "swift_usd") return "USD";
  return profile.currency;
}

function needsFx(transferCcy: string): boolean {
  return transferCcy !== ACCOUNT_CCY;
}

export function getIndicativeFxRate(
  profile: CountryFeeProfile,
  transferCcy: string,
): { rate: number; asOf: string; isLive: false } {
  return {
    rate: fxRate(profile, transferCcy),
    asOf: FX_RATES_AS_OF,
    isLive: false,
  };
}

function isLocalRailMethod(methodId: string): boolean {
  return (
    methodId === "sepa_local_rail" ||
    methodId === "local_rail_withdraw" ||
    methodId === "remit"
  );
}

function brokerFeeForMethod(
  profile: CountryFeeProfile,
  methodId: string,
  direction: TransactionDirection,
): number {
  if (methodId === "ach" || methodId === "local_transfer") return 0;
  if (isLocalRailMethod(methodId)) {
    return direction === "withdraw"
      ? (profile.alpaca.withdrawalLocalRailFee ?? profile.alpaca.withdrawalWireFee)
      : profile.alpaca.depositFee;
  }
  if (methodId.includes("wire") || methodId.includes("swift")) {
    return direction === "withdraw"
      ? profile.alpaca.withdrawalWireFee
      : profile.alpaca.depositFee;
  }
  return 0;
}

export function getBrokerFeeLabel(
  methodId: string,
  direction: TransactionDirection,
): string {
  if (direction === "deposit") return "Alpaca deposit fee";
  if (isLocalRailMethod(methodId)) return "Alpaca withdrawal fee (local rail)";
  if (methodId.includes("wire") || methodId.includes("swift")) {
    return "Alpaca withdrawal fee (wire)";
  }
  return "Broker processing fee";
}

export function getBrokerFeeDetail(
  methodId: string,
  direction: TransactionDirection,
): string {
  if (direction === "deposit") {
    return "Funding Wallet deposits are free per Alpaca; Musaffa contract rate shown if non-zero.";
  }
  if (isLocalRailMethod(methodId)) {
    return "Alpaca charges a withdrawal fee on local rails (amount varies by rail and broker contract).";
  }
  return "Outgoing wire processing fee per Musaffa–Alpaca agreement.";
}

function isSwiftMethod(methodId: string): boolean {
  return (
    methodId.includes("swift") ||
    methodId.includes("wire") ||
    methodId === "international_swift"
  );
}

export function calculateProfileFees(
  input: FeeCalculationInput,
): FeeCalculationResult | null {
  const { profile, methodId, bankId, direction, amount, commissionBearer, receiveCurrency: receiveCurrencyInput, exchangeRate: liveRate, exchangeRateDate, exchangeRateSource } =
    input;
  const method = profile.methods.find((m) => m.id === methodId);
  const bank = profile.banks.find((b) => b.id === bankId);
  if (!method || !bank) return null;

  const bankFees = getBankMethodFees(bank, methodId);
  if (!bankFees) return null;

  const transferCcy = getTransferCurrency(profile, methodId);
  const receiveCurrency = receiveCurrencyInput ?? transferCcy;
  if (
    direction === "withdraw" &&
    commissionBearer === "sender" &&
    receiveCurrency !== transferCcy
  ) {
    return null;
  }

  const rate = liveRate ?? fxRate(profile, transferCcy);
  const fxSpread = needsFx(transferCcy) ? bankFees.fxSpreadPercent : 0;
  const brokerFee = brokerFeeForMethod(profile, methodId, direction);
  const ccFee = profile.alpaca.currencyCloudFee;
  const swiftFee =
    isSwiftMethod(methodId) && bankFees.correspondentFee > 0
      ? bankFees.correspondentFee
      : 0;

  const ctx = {
    amount: Math.max(0, amount),
    commissionBearer,
    transferCcy,
    rate,
    fxSpread,
    bankFees,
    bankName: bank.name,
    methodLabel: method.label,
    methodId,
    brokerFee,
    ccFee,
    swiftFee,
    methodNotes: bankFees.notes,
    direction,
    exchangeRateDate,
    exchangeRateSource,
  };

  const exchangeRateInfo =
    needsFx(transferCcy) && exchangeRateDate && exchangeRateSource
      ? {
          from: transferCcy,
          to: ACCOUNT_CCY,
          rate,
          date: exchangeRateDate,
          source: exchangeRateSource,
        }
      : needsFx(transferCcy)
        ? {
            from: transferCcy,
            to: ACCOUNT_CCY,
            rate,
            date: FX_RATES_AS_OF,
            source: "fallback" as const,
          }
        : undefined;

  const attachMeta = (result: FeeCalculationResult): FeeCalculationResult => ({
    ...result,
    exchangeRateInfo,
  });

  if (direction === "deposit") {
    return attachMeta(
      commissionBearer === "sender"
        ? calcDepositSenderPays(ctx)
        : calcDepositReceiverPays(ctx),
    );
  }
  return attachMeta(
    commissionBearer === "sender"
      ? calcWithdrawSenderPays(ctx)
      : calcWithdrawReceiverPays(ctx),
  );
}

interface CalcCtx {
  amount: number;
  commissionBearer: CommissionBearer;
  transferCcy: string;
  rate: number;
  fxSpread: number;
  bankFees: MethodBankFees;
  bankName: string;
  methodLabel: string;
  methodId: string;
  brokerFee: number;
  ccFee: number;
  swiftFee: number;
  methodNotes?: string;
  direction: TransactionDirection;
  exchangeRateDate?: string;
  exchangeRateSource?: "frankfurter" | "fallback";
}

function brokerFeeStep(ctx: CalcCtx): FlowStep {
  return {
    kind: "broker_fee",
    label: getBrokerFeeLabel(ctx.methodId, ctx.direction),
    amount: ctx.brokerFee,
    currency: ACCOUNT_CCY,
    detail: getBrokerFeeDetail(ctx.methodId, ctx.direction),
    isDeduction: true,
  };
}

function usdFees(ctx: CalcCtx): number {
  return ctx.brokerFee + ctx.ccFee + ctx.swiftFee;
}

/** Local currency → USD after bank FX markup (single round at end) */
function convertLocalToUsd(
  localAmount: number,
  fxSpread: number,
  rate: number,
): number {
  return round2(localAmount * (1 - fxSpread) * rate);
}

/** USD → local currency after bank FX markup (single round at end) */
function convertUsdToLocal(
  usdAmount: number,
  fxSpread: number,
  rate: number,
): number {
  return round2((usdAmount * (1 - fxSpread)) / rate);
}

function forwardDepositLands(ctx: CalcCtx, userSends: number): number {
  const { transferCcy, rate, fxSpread, bankFees } = ctx;
  const afterBank = userSends - bankFees.depositFee;
  const usd = needsFx(transferCcy)
    ? afterBank * (1 - fxSpread) * rate
    : afterBank;
  return round2(Math.max(0, usd - usdFees(ctx)));
}

function solveUserSendsForDepositTarget(
  ctx: CalcCtx,
  targetUsd: number,
): number {
  const { bankFees, transferCcy, rate, fxSpread } = ctx;
  if (!needsFx(transferCcy)) {
    return round2(targetUsd + usdFees(ctx) + bankFees.depositFee);
  }

  const grossUsd = targetUsd + usdFees(ctx);
  let userSends = round2(
    grossUsd / (rate * (1 - fxSpread)) + bankFees.depositFee,
  );

  while (forwardDepositLands(ctx, userSends) < targetUsd) {
    userSends = round2(userSends + 0.01);
    if (userSends > targetUsd * 5) break;
  }

  return userSends;
}

function fxRateDetail(
  spread: number,
  rate: number,
  toCcy: string,
  ctx: Pick<CalcCtx, "exchangeRateDate" | "exchangeRateSource">,
): string {
  const pct = (spread * 100).toFixed(2);
  const dateStr = ctx.exchangeRateDate ?? FX_RATES_AS_OF;
  const asOf = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const rateType =
    ctx.exchangeRateSource === "frankfurter"
      ? "average market rate"
      : "estimated rate";
  if (spread > 0) {
    return `1 ${toCcy} = ${formatUsd(rate)} (${rateType}, ${asOf}) · bank markup ${pct}%`;
  }
  return `1 ${toCcy} = ${formatUsd(rate)} (${rateType}, ${asOf})`;
}

function fxStepToUsd(
  fromAmount: number,
  fromCcy: string,
  toAmount: number,
  spread: number,
  rate: number,
  ctx: Pick<CalcCtx, "exchangeRateDate" | "exchangeRateSource">,
): FlowStep {
  const spreadCost = round2(fromAmount * spread);
  return {
    kind: "fx_conversion",
    label: `Currency conversion: ${fromCcy} → USD`,
    amount: toAmount,
    currency: ACCOUNT_CCY,
    detail: fxRateDetail(spread, rate, fromCcy, ctx),
    isDeduction: false,
    feeDeduction:
      spread > 0 ? { amount: spreadCost, currency: fromCcy } : undefined,
  };
}

function fxStepFromUsd(
  usdAmount: number,
  toCcy: string,
  toAmount: number,
  spread: number,
  rate: number,
  ctx: Pick<CalcCtx, "exchangeRateDate" | "exchangeRateSource">,
): FlowStep {
  const spreadCost = round2(usdAmount * spread);
  return {
    kind: "fx_conversion",
    label: `Currency conversion: USD → ${toCcy}`,
    amount: toAmount,
    currency: toCcy,
    detail: fxRateDetail(spread, rate, toCcy, ctx),
    isDeduction: false,
    feeDeduction:
      spread > 0 ? { amount: spreadCost, currency: ACCOUNT_CCY } : undefined,
  };
}

function calcDepositReceiverPays(ctx: CalcCtx): FeeCalculationResult {
  const steps: FlowStep[] = [];
  const { transferCcy, rate, fxSpread, bankFees, bankName } = ctx;
  const userSends = ctx.amount;

  steps.push({
    kind: "user_sends",
    label: "User sends from bank",
    amount: userSends,
    currency: transferCcy,
  });

  let localRemaining = userSends;

  if (bankFees.depositFee > 0) {
    steps.push({
      kind: "bank_fee",
      label: `${bankName} outgoing fee`,
      amount: bankFees.depositFee,
      currency: transferCcy,
      detail: "Bank charge for sending the transfer",
      isDeduction: true,
    });
    localRemaining = round2(localRemaining - bankFees.depositFee);
  }

  let usdAfterConversion = localRemaining;

  if (needsFx(transferCcy) && fxSpread > 0) {
    usdAfterConversion = convertLocalToUsd(localRemaining, fxSpread, rate);
    steps.push(
      fxStepToUsd(localRemaining, transferCcy, usdAfterConversion, fxSpread, rate, ctx),
    );
  } else if (needsFx(transferCcy)) {
    usdAfterConversion = round2(localRemaining * rate);
    steps.push(
      fxStepToUsd(localRemaining, transferCcy, usdAfterConversion, 0, rate, ctx),
    );
  } else {
    usdAfterConversion = localRemaining;
  }

  let lands = usdAfterConversion;

  if (ctx.brokerFee > 0) {
    steps.push(brokerFeeStep(ctx));
    lands = round2(lands - ctx.brokerFee);
  }

  if (ctx.swiftFee > 0) {
    steps.push({
      kind: "swift_fee",
      label: "SWIFT correspondent fee",
      amount: ctx.swiftFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
    lands = round2(lands - ctx.swiftFee);
  }

  if (ctx.ccFee > 0) {
    steps.push({
      kind: "broker_fee",
      label: "Currency conversion fee",
      amount: ctx.ccFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
    lands = round2(lands - ctx.ccFee);
  }

  lands = Math.max(0, lands);

  steps.push({
    kind: "account_credit",
    label: "Lands on brokerage account",
    amount: lands,
    currency: ACCOUNT_CCY,
  });

  const feeSummary = sumDeductionSteps(steps);

  return {
    direction: "deposit",
    commissionBearer: "receiver",
    methodLabel: ctx.methodLabel,
    bankName: ctx.bankName,
    inputAmount: userSends,
    inputCurrency: transferCcy,
    accountCurrency: ACCOUNT_CCY,
    accountAmount: lands,
    netAmount: lands,
    userTransferAmount: userSends,
    userTransferCurrency: transferCcy,
    totalFees: feeSummary,
    steps,
    methodNotes: ctx.methodNotes,
  };
}

function calcDepositSenderPays(ctx: CalcCtx): FeeCalculationResult {
  const targetUsd = ctx.amount;
  const userSendsCcy = needsFx(ctx.transferCcy) ? ctx.transferCcy : ACCOUNT_CCY;
  const userSends = solveUserSendsForDepositTarget(ctx, targetUsd);

  const orderedSteps = buildDepositSenderSteps(ctx, userSends, userSendsCcy);
  const creditStep = orderedSteps.find((s) => s.kind === "account_credit");
  if (creditStep) creditStep.amount = targetUsd;

  const feeSummary = sumDeductionSteps(orderedSteps);

  return {
    direction: "deposit",
    commissionBearer: "sender",
    methodLabel: ctx.methodLabel,
    bankName: ctx.bankName,
    inputAmount: targetUsd,
    inputCurrency: ACCOUNT_CCY,
    accountCurrency: ACCOUNT_CCY,
    accountAmount: targetUsd,
    netAmount: targetUsd,
    userTransferAmount: userSends,
    userTransferCurrency: userSendsCcy,
    totalFees: feeSummary,
    steps: orderedSteps,
    methodNotes: ctx.methodNotes,
  };
}

function buildDepositSenderSteps(
  ctx: CalcCtx,
  userSends: number,
  userSendsCcy: string,
): FlowStep[] {
  const steps: FlowStep[] = [];
  const { transferCcy, rate, fxSpread, bankFees, bankName } = ctx;

  steps.push({
    kind: "user_sends",
    label: "User sends from bank",
    amount: userSends,
    currency: userSendsCcy,
  });

  let running = userSends;

  if (bankFees.depositFee > 0) {
    steps.push({
      kind: "bank_fee",
      label: `${bankName} outgoing fee`,
      amount: bankFees.depositFee,
      currency: userSendsCcy,
      detail: "Bank charge for sending the transfer",
      isDeduction: true,
    });
    running = round2(running - bankFees.depositFee);
  }

  if (needsFx(transferCcy)) {
    const convertedUsd = convertLocalToUsd(running, fxSpread, rate);
    steps.push(fxStepToUsd(running, transferCcy, convertedUsd, fxSpread, rate, ctx));
    running = convertedUsd;
  }

  if (ctx.brokerFee > 0) {
    steps.push(brokerFeeStep(ctx));
    running = round2(running - ctx.brokerFee);
  }

  if (ctx.swiftFee > 0) {
    steps.push({
      kind: "swift_fee",
      label: "SWIFT correspondent fee",
      amount: ctx.swiftFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
    running = round2(running - ctx.swiftFee);
  }

  if (ctx.ccFee > 0) {
    steps.push({
      kind: "broker_fee",
      label: "Currency conversion fee",
      amount: ctx.ccFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
    running = round2(running - ctx.ccFee);
  }

  steps.push({
    kind: "account_credit",
    label: "Lands on brokerage account",
    amount: running,
    currency: ACCOUNT_CCY,
  });

  return steps;
}

function calcWithdrawReceiverPays(ctx: CalcCtx): FeeCalculationResult {
  const steps: FlowStep[] = [];
  const { transferCcy, rate, fxSpread, bankFees, bankName } = ctx;
  const debitedUsd = ctx.amount;

  steps.push({
    kind: "account_debit",
    label: "Withdrawn from brokerage account",
    amount: debitedUsd,
    currency: ACCOUNT_CCY,
  });

  let usdRemaining = debitedUsd;

  if (ctx.brokerFee > 0) {
    steps.push(brokerFeeStep(ctx));
    usdRemaining = round2(usdRemaining - ctx.brokerFee);
  }

  if (ctx.ccFee > 0) {
    steps.push({
      kind: "broker_fee",
      label: "Currency conversion fee",
      amount: ctx.ccFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
    usdRemaining = round2(usdRemaining - ctx.ccFee);
  }

  let userReceives = usdRemaining;
  let receiveCcy = ACCOUNT_CCY;

  if (needsFx(transferCcy)) {
    const localAmount = convertUsdToLocal(usdRemaining, fxSpread, rate);
    steps.push(
      fxStepFromUsd(usdRemaining, transferCcy, localAmount, fxSpread, rate, ctx),
    );
    userReceives = localAmount;
    receiveCcy = transferCcy;
  }

  if (bankFees.withdrawalFee > 0) {
    steps.push({
      kind: "bank_fee",
      label: `${bankName} receiving fee`,
      amount: bankFees.withdrawalFee,
      currency: receiveCcy,
      detail: "Charged by user's bank on receipt",
      isDeduction: true,
    });
    userReceives = round2(Math.max(0, userReceives - bankFees.withdrawalFee));
  }

  if (ctx.swiftFee > 0) {
    steps.push({
      kind: "swift_fee",
      label: "SWIFT correspondent fee",
      amount: ctx.swiftFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
  }

  steps.push({
    kind: "user_receives",
    label: "User receives in bank",
    amount: userReceives,
    currency: receiveCcy,
  });

  const feeSummary = sumDeductionSteps(steps);

  return {
    direction: "withdraw",
    commissionBearer: "receiver",
    methodLabel: ctx.methodLabel,
    bankName: ctx.bankName,
    inputAmount: debitedUsd,
    inputCurrency: ACCOUNT_CCY,
    accountCurrency: ACCOUNT_CCY,
    accountAmount: debitedUsd,
    netAmount: userReceives,
    userTransferAmount: debitedUsd,
    userTransferCurrency: ACCOUNT_CCY,
    totalFees: feeSummary,
    steps,
    methodNotes: ctx.methodNotes,
  };
}

function calcWithdrawSenderPays(ctx: CalcCtx): FeeCalculationResult {
  const steps: FlowStep[] = [];
  const { transferCcy, rate, fxSpread, bankFees, bankName } = ctx;
  const targetReceive = ctx.amount;
  const receiveCcy = needsFx(transferCcy) ? transferCcy : ACCOUNT_CCY;

  steps.push({
    kind: "user_receives",
    label: "Target in user's bank",
    amount: targetReceive,
    currency: receiveCcy,
  });

  let localNeeded = targetReceive;
  if (bankFees.withdrawalFee > 0) {
    localNeeded = round2(targetReceive + bankFees.withdrawalFee);
  }

  let usdNeeded: number;
  if (needsFx(transferCcy)) {
    usdNeeded = round2((localNeeded * rate) / (1 - fxSpread));
  } else {
    usdNeeded = localNeeded;
  }

  const debitedUsd = round2(usdNeeded + usdFees(ctx));

  // Build forward display
  const orderedSteps: FlowStep[] = [];

  orderedSteps.push({
    kind: "account_debit",
    label: "Withdraw from brokerage account",
    amount: debitedUsd,
    currency: ACCOUNT_CCY,
    detail: `Minimum to reach ${formatMoney(targetReceive, receiveCcy)} in the user's bank`,
  });

  if (ctx.brokerFee > 0) {
    orderedSteps.push(brokerFeeStep(ctx));
  }

  if (ctx.ccFee > 0) {
    orderedSteps.push({
      kind: "broker_fee",
      label: "Currency conversion fee",
      amount: ctx.ccFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
  }

  if (ctx.swiftFee > 0) {
    orderedSteps.push({
      kind: "swift_fee",
      label: "SWIFT correspondent fee",
      amount: ctx.swiftFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
  }

  if (needsFx(transferCcy)) {
    const afterBroker = debitedUsd - usdFees(ctx);
    const localOut = convertUsdToLocal(afterBroker, fxSpread, rate);
    orderedSteps.push(
      fxStepFromUsd(afterBroker, transferCcy, localOut, fxSpread, rate, ctx),
    );
  }

  if (bankFees.withdrawalFee > 0) {
    orderedSteps.push({
      kind: "bank_fee",
      label: `${bankName} receiving fee`,
      amount: bankFees.withdrawalFee,
      currency: receiveCcy,
      detail: "Charged by user's bank on receipt",
      isDeduction: true,
    });
  }

  orderedSteps.push({
    kind: "user_receives",
    label: "User receives in bank",
    amount: targetReceive,
    currency: receiveCcy,
  });

  const feeSummary = sumDeductionSteps(orderedSteps);

  const withdrawAdvice = needsFx(transferCcy)
    ? {
        bufferMinUsd: FX_WITHDRAW_BUFFER_USD.min,
        bufferMaxUsd: FX_WITHDRAW_BUFFER_USD.max,
        debitWithBufferMinUsd: round2(debitedUsd + FX_WITHDRAW_BUFFER_USD.min),
        debitWithBufferMaxUsd: round2(debitedUsd + FX_WITHDRAW_BUFFER_USD.max),
      }
    : undefined;

  return {
    direction: "withdraw",
    commissionBearer: "sender",
    methodLabel: ctx.methodLabel,
    bankName: ctx.bankName,
    inputAmount: targetReceive,
    inputCurrency: receiveCcy,
    accountCurrency: ACCOUNT_CCY,
    accountAmount: debitedUsd,
    netAmount: targetReceive,
    userTransferAmount: debitedUsd,
    userTransferCurrency: ACCOUNT_CCY,
    totalFees: feeSummary,
    steps: orderedSteps,
    methodNotes: ctx.methodNotes,
    withdrawAdvice,
  };
}

function sumDeductionSteps(steps: FlowStep[]): number {
  return round2(
    steps
      .filter((s) => s.isDeduction && s.kind !== "fx_conversion")
      .reduce((sum, s) => sum + s.amount, 0),
  );
}

export function getFeeSummaryLines(
  steps: FlowStep[],
): { label: string; amount: number; currency: string }[] {
  const lines: { label: string; amount: number; currency: string }[] = [];
  for (const s of steps) {
    if (s.isDeduction && s.kind !== "fx_conversion") {
      lines.push({ label: s.label, amount: s.amount, currency: s.currency });
    }
    if (s.feeDeduction) {
      lines.push({
        label: `${s.label} (markup)`,
        amount: s.feeDeduction.amount,
        currency: s.feeDeduction.currency,
      });
    }
  }
  return lines;
}

export function getInputCurrency(
  profile: CountryFeeProfile,
  methodId: string,
  direction: TransactionDirection,
  commissionBearer: CommissionBearer,
  receiveCurrency?: string,
): string {
  const transferCcy = getTransferCurrency(profile, methodId);
  if (commissionBearer === "sender") {
    if (direction === "deposit") return ACCOUNT_CCY;
    return receiveCurrency ?? transferCcy;
  }
  return direction === "deposit" ? transferCcy : ACCOUNT_CCY;
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    CHF: "CHF ",
    SEK: "kr ",
    AED: "AED ",
    SGD: "S$",
    GBP: "£",
  };
  return symbols[currency] ?? `${currency} `;
}
