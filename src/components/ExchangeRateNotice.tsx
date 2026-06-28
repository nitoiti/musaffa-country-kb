import {
  EXCHANGE_RATE_DISCLAIMER,
  EXCHANGE_RATE_SOURCE_LABEL,
  type ExchangeRateResult,
} from "@/lib/fx-rates";

export function ExchangeRateNotice({
  rateInfo,
  loading,
}: {
  rateInfo: Pick<ExchangeRateResult, "from" | "to" | "rate" | "date" | "source"> | null;
  loading?: boolean;
}) {
  if (!rateInfo && !loading) return null;

  const dateLabel = rateInfo?.date
    ? new Date(rateInfo.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
      role="note"
      aria-label="Exchange rate disclaimer"
    >
      <InfoIcon />
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-slate-900">About currency conversion</p>
        {loading && !rateInfo ? (
          <p className="text-xs text-slate-500">Loading average exchange rate…</p>
        ) : rateInfo ? (
          <p className="text-xs leading-relaxed text-slate-600">
            Using an average market rate:{" "}
            <strong>
              1 {rateInfo.from} = {rateInfo.rate.toFixed(4)} {rateInfo.to}
            </strong>
            {dateLabel && <> (updated {dateLabel})</>}. Source:{" "}
            {rateInfo.source === "frankfurter"
              ? EXCHANGE_RATE_SOURCE_LABEL
              : "internal fallback"}
            .
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-slate-500">
          {EXCHANGE_RATE_DISCLAIMER} Bank markups in the steps below are applied
          on top of this average.
        </p>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </span>
  );
}
