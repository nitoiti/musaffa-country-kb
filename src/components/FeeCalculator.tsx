"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateProfileFees,
  currencySymbol,
  formatMoney,
  FX_RATES_AS_OF,
  getFeeSummaryLines,
  getIndicativeFxRate,
  getInputCurrency,
  getTransferCurrency,
} from "@/lib/fee-calculator";
import { FEE_SOURCE_LINKS } from "@/lib/fee-sources";
import {
  getBanksForProfile,
  getFeeProfile,
  getMethodsForDirection,
} from "@/lib/fee-profiles";
import type { Country } from "@/types/country";
import type {
  CommissionBearer,
  FlowStep,
  TransactionDirection,
} from "@/types/fee-profiles";

export function FeeCalculator({ country }: { country: Country }) {
  const profile = getFeeProfile(country.slug);
  const banks = getBanksForProfile(profile);

  const [direction, setDirection] = useState<TransactionDirection>("deposit");
  const [commissionBearer, setCommissionBearer] =
    useState<CommissionBearer>("sender");
  const [amount, setAmount] = useState("1000");

  const methods = useMemo(
    () => getMethodsForDirection(profile, direction),
    [profile, direction],
  );

  const defaultMethodId =
    methods.find((m) => m.recommended)?.id ?? methods[0]?.id ?? "";

  const [methodId, setMethodId] = useState(defaultMethodId);
  const [bankId, setBankId] = useState("");

  const banksForMethod = useMemo(
    () => banks.filter((b) => b.methods[methodId || defaultMethodId]),
    [banks, methodId, defaultMethodId],
  );

  const resolvedMethodId = methodId || defaultMethodId;
  const resolvedBankId =
    bankId || banksForMethod[0]?.id || "";

  useEffect(() => {
    setMethodId(defaultMethodId);
  }, [defaultMethodId]);

  useEffect(() => {
    if (!resolvedMethodId) return;
    const supported = banks.filter((b) => b.methods[resolvedMethodId]);
    if (!supported.find((b) => b.id === bankId)) {
      setBankId(supported[0]?.id ?? "");
    }
  }, [resolvedMethodId, banks, bankId]);

  const parsedAmount = parseFloat(amount) || 0;

  const inputCurrency = resolvedMethodId
    ? getInputCurrency(profile, resolvedMethodId, direction, commissionBearer)
    : profile.currency;

  const result = useMemo(() => {
    if (!resolvedMethodId || !resolvedBankId) return null;
    return calculateProfileFees({
      direction,
      amount: parsedAmount,
      commissionBearer,
      methodId: resolvedMethodId,
      bankId: resolvedBankId,
      profile,
    });
  }, [
    direction,
    parsedAmount,
    commissionBearer,
    resolvedMethodId,
    resolvedBankId,
    profile,
  ]);

  const banksForMethodSelect = useMemo(
    () => banks.filter((b) => b.methods[resolvedMethodId]),
    [banks, resolvedMethodId],
  );

  const inputLabel =
    commissionBearer === "sender"
      ? direction === "deposit"
        ? "Amount to land on account (USD)"
        : `Amount user receives (${inputCurrency})`
      : direction === "deposit"
        ? `Amount user sends (${inputCurrency})`
        : "Amount withdrawn from account (USD)";

  const bearerHint =
    commissionBearer === "sender"
      ? "Fees added on top — user sends/pays more than lands or is received."
      : "Fees deducted from transfer — user sends exact amount, less lands or is received.";

  const headline = result ? buildHeadline(result, direction) : null;
  const feeLines = result ? getFeeSummaryLines(result.steps) : [];
  const transferCcy = resolvedMethodId
    ? getTransferCurrency(profile, resolvedMethodId)
    : profile.currency;
  const fxInfo =
    resolvedMethodId && transferCcy !== "USD"
      ? getIndicativeFxRate(profile, transferCcy)
      : null;
  const isLocalRail = resolvedMethodId.includes("local_rail") ||
    resolvedMethodId === "sepa_local_rail" ||
    resolvedMethodId === "remit";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Fee Calculator</h2>
        <p className="text-sm text-slate-500">
          Internal estimate for {country.name}
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        <div className="space-y-6 border-b border-slate-200 p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
          <FieldGroup label="Transaction">
            <SegmentedControl
              options={[
                { value: "deposit", label: "Deposit" },
                { value: "withdraw", label: "Withdraw" },
              ]}
              value={direction}
              onChange={(v) => setDirection(v as TransactionDirection)}
            />
          </FieldGroup>

          <FieldGroup label="Transfer method">
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    resolvedMethodId === m.id
                      ? "border-musaffa-500 bg-musaffa-50 ring-1 ring-musaffa-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {m.label}
                    </span>
                    {m.recommended && (
                      <span className="rounded bg-musaffa-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{m.description}</p>
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Bank">
            <select
              value={resolvedBankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-musaffa-500 focus:outline-none focus:ring-2 focus:ring-musaffa-500/20"
            >
              {banksForMethodSelect.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Commission paid by">
            <SegmentedControl
              options={[
                { value: "sender", label: "Sender (user)" },
                { value: "receiver", label: "Receiver (deducted)" },
              ]}
              value={commissionBearer}
              onChange={(v) => setCommissionBearer(v as CommissionBearer)}
            />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {bearerHint}
            </p>
          </FieldGroup>

          <FieldGroup label={inputLabel}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {currencySymbol(inputCurrency)}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-musaffa-500 focus:outline-none focus:ring-2 focus:ring-musaffa-500/20"
              />
            </div>
          </FieldGroup>
        </div>

        <div className="bg-slate-50 p-6 lg:col-span-3">
          {result && headline ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-600">
                  {result.methodLabel} · {result.bankName}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {headline}
                </p>
              </div>

              <ol className="space-y-0 rounded-lg border border-slate-200 bg-white">
                {result.steps.map((step, i) => (
                  <FlowStepRow
                    key={`${step.kind}-${step.label}-${i}`}
                    step={step}
                    index={i + 1}
                    isLast={i === result.steps.length - 1}
                  />
                ))}
              </ol>

              {feeLines.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fees deducted
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {feeLines.map((f) => (
                      <li key={f.label} className="flex justify-between gap-4">
                        <span>{f.label}</span>
                        <span className="shrink-0 tabular-nums font-medium text-slate-900">
                          −{formatMoney(f.amount, f.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.methodNotes && (
                <p className="text-xs leading-relaxed text-slate-500">
                  {result.bankName}: {result.methodNotes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a method and bank to see the breakdown.
            </p>
          )}
        </div>
      </div>

      <FeeSourcesPanel
        direction={direction}
        isLocalRail={isLocalRail}
        transferCcy={transferCcy}
        fxInfo={fxInfo}
        brokerFeeUsd={profile.alpaca.withdrawalLocalRailFee ?? profile.alpaca.withdrawalWireFee}
      />
    </div>
  );
}

function FeeSourcesPanel({
  direction,
  isLocalRail,
  transferCcy,
  fxInfo,
  brokerFeeUsd,
}: {
  direction: TransactionDirection;
  isLocalRail: boolean;
  transferCcy: string;
  fxInfo: ReturnType<typeof getIndicativeFxRate> | null;
  brokerFeeUsd: number;
}) {
  const fxAsOf = new Date(FX_RATES_AS_OF).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-relaxed text-slate-600">
      <p className="font-semibold text-slate-800">Sources &amp; assumptions</p>

      <ul className="mt-2 space-y-2">
        {isLocalRail && direction === "withdraw" && (
          <li>
            <strong className="text-slate-700">Alpaca local-rail withdrawal:</strong>{" "}
            Alpaca charges a withdrawal fee on <code className="text-[11px]">local_rails</code>{" "}
            (not just SWIFT). Deposits to Funding Wallets are free. This calculator uses{" "}
            <strong>${brokerFeeUsd}</strong> from the Musaffa–Alpaca contract — confirm with your
            agreement.{" "}
            <SourceLink link={FEE_SOURCE_LINKS.alpacaFundingWallets} />
          </li>
        )}
        {isLocalRail && direction === "deposit" && (
          <li>
            <strong className="text-slate-700">Alpaca local-rail deposit:</strong>{" "}
            No Alpaca deposit fee on Funding Wallets; EUR is converted to USD on receipt.{" "}
            <SourceLink link={FEE_SOURCE_LINKS.alpacaFundingWallets} />
          </li>
        )}
        {fxInfo && transferCcy !== "USD" && (
          <li>
            <strong className="text-slate-700">FX rate:</strong>{" "}
            Indicative snapshot — 1 {transferCcy} = ${fxInfo.rate.toFixed(4)} USD
            (as of {fxAsOf}). This is <strong>not a live market feed</strong>; bank markups are
            applied separately. Rates change daily — refresh the profile or verify before quoting
            customers.
          </li>
        )}
        <li>
          <strong className="text-slate-700">References:</strong>{" "}
          <SourceLink link={FEE_SOURCE_LINKS.alpacaFundingWalletsDocs} /> ·{" "}
          <SourceLink link={FEE_SOURCE_LINKS.alpacaWithdrawalApi} /> ·{" "}
          <SourceLink link={FEE_SOURCE_LINKS.alpacaWireFees} />
        </li>
      </ul>
    </div>
  );
}

function SourceLink({
  link,
}: {
  link: { label: string; href: string };
}) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-musaffa-700 hover:underline"
    >
      {link.label}
    </a>
  );
}

function buildHeadline(
  result: NonNullable<ReturnType<typeof calculateProfileFees>>,
  direction: TransactionDirection,
): string {
  if (direction === "deposit") {
    return `User sends ${formatMoney(result.userTransferAmount, result.userTransferCurrency)} → ${formatMoney(result.netAmount, "USD")} lands on account`;
  }
  const receiveStep = result.steps.find((s) => s.kind === "user_receives");
  const receiveCcy = receiveStep?.currency ?? "USD";
  return `${formatMoney(result.userTransferAmount, "USD")} debited → user receives ${formatMoney(result.netAmount, receiveCcy)}`;
}

function FlowStepRow({
  step,
  index,
  isLast,
}: {
  step: FlowStep;
  index: number;
  isLast: boolean;
}) {
  const isFinal =
    isLast ||
    step.kind === "account_credit" ||
    step.kind === "user_receives";
  const isDeduction = step.isDeduction;

  return (
    <li
      className={`flex gap-3 px-4 py-3 ${
        !isLast ? "border-b border-slate-100" : ""
      } ${isFinal ? "bg-musaffa-50/50" : ""}`}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span
            className={`text-sm ${isFinal ? "font-semibold text-slate-900" : "text-slate-700"}`}
          >
            {step.label}
          </span>
          <span
            className={`tabular-nums text-sm ${
              isDeduction
                ? "text-red-600"
                : isFinal
                  ? "font-bold text-slate-900"
                  : "font-medium text-slate-900"
            }`}
          >
            {isDeduction ? "−" : ""}
            {formatMoney(step.amount, step.currency)}
          </span>
        </div>
        {step.detail && (
          <p className="mt-0.5 text-xs text-slate-400">{step.detail}</p>
        )}
      </div>
    </li>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
