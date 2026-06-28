import type { CountryTier } from "@/lib/country-tiers";
import type { DashboardStatus, MarketingAccess } from "@/types/country";

const styles: Record<
  DashboardStatus,
  { label: string; className: string }
> = {
  eligible: {
    label: "Eligible",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  not_eligible: {
    label: "Not Eligible",
    className: "bg-slate-100 text-slate-600 ring-slate-500/10",
  },
  prohibited: {
    label: "Prohibited",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  restricted: {
    label: "Restricted",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  high_risk: {
    label: "High Risk",
    className: "bg-orange-50 text-orange-800 ring-orange-600/20",
  },
  regulatory_restrictions: {
    label: "Regulatory",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
};

export function StatusBadge({ status }: { status: DashboardStatus }) {
  const { label, className } = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

const marketingStyles: Record<
  MarketingAccess,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  conditional: {
    label: "Conditional",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
  restricted: {
    label: "Marketing Block",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
};

export function MarketingAccessBadge({
  access,
}: {
  access: MarketingAccess;
}) {
  const { label, className } = marketingStyles[access];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: CountryTier }) {
  const isPriority = tier === 1;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isPriority
          ? "bg-musaffa-50 text-musaffa-800 ring-musaffa-600/20"
          : "bg-slate-100 text-slate-600 ring-slate-500/10"
      }`}
    >
      T{tier}
    </span>
  );
}

export function RiskBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const colors: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    medium: "bg-amber-50 text-amber-800 ring-amber-600/20",
    high: "bg-red-50 text-red-700 ring-red-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${colors[level] ?? "bg-slate-100 text-slate-600 ring-slate-500/10"}`}
    >
      {level} risk
    </span>
  );
}
