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

const ACCOUNT_CCY = "USD";

const FX_RATES: Record<string, number> = {
  EUR: 1.08,
  CHF: 1.12,
  SEK: 0.096,
  AED: 0.27,
  SGD: 0.74,
  GBP: 1.27,
};

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
  return profile.fxRateToUsd ?? FX_RATES[transferCcy] ?? 1;
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

function brokerFeeForMethod(
  profile: CountryFeeProfile,
  methodId: string,
  direction: TransactionDirection,
): number {
  if (methodId === "ach" || methodId === "local_transfer") return 0;
  if (
    methodId === "sepa_local_rail" ||
    methodId === "local_rail_withdraw" ||
    methodId === "remit"
  ) {
    return direction === "withdraw"
      ? profile.alpaca.withdrawalWireFee
      : profile.alpaca.depositFee;
  }
  if (methodId.includes("wire") || methodId.includes("swift")) {
    return direction === "withdraw"
      ? profile.alpaca.withdrawalWireFee
      : profile.alpaca.depositFee;
  }
  return 0;
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
  const { profile, methodId, bankId, direction, amount, commissionBearer } =
    input;
  const method = profile.methods.find((m) => m.id === methodId);
  const bank = profile.banks.find((b) => b.id === bankId);
  if (!method || !bank) return null;

  const bankFees = getBankMethodFees(bank, methodId);
  if (!bankFees) return null;

  const transferCcy = getTransferCurrency(profile, methodId);
  const rate = fxRate(profile, transferCcy);
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
    brokerFee,
    ccFee,
    swiftFee,
    methodNotes: bankFees.notes,
    direction,
  };

  if (direction === "deposit") {
    return commissionBearer === "sender"
      ? calcDepositSenderPays(ctx)
      : calcDepositReceiverPays(ctx);
  }
  return commissionBearer === "sender"
    ? calcWithdrawSenderPays(ctx)
    : calcWithdrawReceiverPays(ctx);
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
  brokerFee: number;
  ccFee: number;
  swiftFee: number;
  methodNotes?: string;
  direction: TransactionDirection;
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

function fxStepToUsd(
  fromAmount: number,
  fromCcy: string,
  toAmount: number,
  spread: number,
  rate: number,
): FlowStep {
  const pct = (spread * 100).toFixed(2);
  const spreadCost = round2(fromAmount * spread);
  return {
    kind: "fx_conversion",
    label: `${fromCcy} → USD`,
    amount: toAmount,
    currency: ACCOUNT_CCY,
    detail:
      spread > 0
        ? `1 ${fromCcy} = ${formatUsd(rate)} · bank markup ${pct}%`
        : `1 ${fromCcy} = ${formatUsd(rate)} (indicative)`,
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
): FlowStep {
  const pct = (spread * 100).toFixed(2);
  const spreadCost = round2(usdAmount * spread);
  return {
    kind: "fx_conversion",
    label: `USD → ${toCcy}`,
    amount: toAmount,
    currency: toCcy,
    detail:
      spread > 0
        ? `1 ${toCcy} = ${formatUsd(rate)} · bank markup ${pct}%`
        : `1 ${toCcy} = ${formatUsd(rate)} (indicative)`,
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
      fxStepToUsd(localRemaining, transferCcy, usdAfterConversion, fxSpread, rate),
    );
  } else if (needsFx(transferCcy)) {
    usdAfterConversion = round2(localRemaining * rate);
    steps.push(
      fxStepToUsd(localRemaining, transferCcy, usdAfterConversion, 0, rate),
    );
  } else {
    usdAfterConversion = localRemaining;
  }

  let lands = usdAfterConversion;

  if (ctx.brokerFee > 0) {
    steps.push({
      kind: "broker_fee",
      label: "Broker processing fee",
      amount: ctx.brokerFee,
      currency: ACCOUNT_CCY,
      detail: "Wire processing fee",
      isDeduction: true,
    });
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
    steps.push(fxStepToUsd(running, transferCcy, convertedUsd, fxSpread, rate));
    running = convertedUsd;
  }

  if (ctx.brokerFee > 0) {
    steps.push({
      kind: "broker_fee",
      label: "Broker processing fee",
      amount: ctx.brokerFee,
      currency: ACCOUNT_CCY,
      detail: "Wire processing fee",
      isDeduction: true,
    });
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
    steps.push({
      kind: "broker_fee",
      label: "Broker processing fee",
      amount: ctx.brokerFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
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
      fxStepFromUsd(usdRemaining, transferCcy, localAmount, fxSpread, rate),
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
    label: "Debited from brokerage account",
    amount: debitedUsd,
    currency: ACCOUNT_CCY,
  });

  if (ctx.brokerFee > 0) {
    orderedSteps.push({
      kind: "broker_fee",
      label: "Broker processing fee",
      amount: ctx.brokerFee,
      currency: ACCOUNT_CCY,
      isDeduction: true,
    });
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
      fxStepFromUsd(afterBroker, transferCcy, localOut, fxSpread, rate),
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
): string {
  const transferCcy = getTransferCurrency(profile, methodId);
  if (commissionBearer === "sender") {
    return direction === "deposit" ? ACCOUNT_CCY : transferCcy;
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
