import type { Country, DashboardStatus, MarketingAccess } from "@/types/country";
import { getDashboardStatus } from "@/lib/countries";
import { getMarketingAccess } from "@/lib/marketing-access";

type StatusTone = "success" | "warning" | "error" | "neutral";

const ALPACA_LABEL: Record<DashboardStatus, string> = {
  eligible: "Allows onboarding",
  prohibited: "Prohibited",
  restricted: "Restricted",
  high_risk: "High risk",
  regulatory_restrictions: "Regulatory block",
  not_eligible: "Not eligible",
};

const MARKETING_LABEL: Record<MarketingAccess, string> = {
  open: "Open",
  conditional: "Conditional",
  restricted: "Blocked",
};

const RISK_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function alpacaTone(status: DashboardStatus): StatusTone {
  if (status === "eligible") return "success";
  if (status === "high_risk") return "warning";
  return "error";
}

function marketingTone(access: MarketingAccess): StatusTone {
  if (access === "open") return "success";
  if (access === "conditional") return "warning";
  return "error";
}

function riskTone(level: string | null): StatusTone {
  if (!level) return "neutral";
  if (level === "low") return "success";
  if (level === "medium") return "warning";
  return "error";
}

const cardStyles: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  error: "border-red-200 bg-red-50",
  neutral: "border-slate-200 bg-slate-50",
};

const valueStyles: Record<StatusTone, string> = {
  success: "text-emerald-800",
  warning: "text-amber-900",
  error: "text-red-800",
  neutral: "text-slate-600",
};

export function CountryStatusBar({ country }: { country: Country }) {
  const alpaca = getDashboardStatus(country);
  const marketing = getMarketingAccess(country);
  const risk = country.alpacaRiskLevel;

  return (
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Country status">
      <StatusCard
        title="Alpaca"
        value={ALPACA_LABEL[alpaca]}
        tone={alpacaTone(alpaca)}
      />
      <StatusCard
        title="Marketing"
        value={MARKETING_LABEL[marketing]}
        tone={marketingTone(marketing)}
      />
      <StatusCard
        title="Risk"
        value={risk ? RISK_LABEL[risk] ?? risk : "N/A"}
        tone={riskTone(risk)}
      />
    </div>
  );
}

function StatusCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${cardStyles[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className={`mt-1 text-sm font-semibold capitalize ${valueStyles[tone]}`}>
        {value}
      </p>
    </div>
  );
}
