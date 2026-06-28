"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarketingAccessBadge, RiskBadge, StatusBadge, TierBadge } from "@/components/StatusBadge";
import { getDashboardStatus } from "@/lib/countries";
import { compareCountryPriority, TIER_OPTIONS } from "@/lib/country-tiers";
import { getMarketingAccess } from "@/lib/marketing-access";
import type { CountryListItem, DashboardStatus, MarketingAccess } from "@/types/country";

const ALPACA_FILTERS: { value: DashboardStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "eligible", label: "Eligible" },
  { value: "prohibited", label: "Prohibited" },
  { value: "restricted", label: "Restricted" },
  { value: "high_risk", label: "High Risk" },
  { value: "regulatory_restrictions", label: "Regulatory" },
];

const MARKETING_FILTERS: { value: MarketingAccess | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "conditional", label: "Conditional" },
  { value: "restricted", label: "Marketing Block" },
];

export function CountryDashboard({ countries }: { countries: CountryListItem[] }) {
  const [query, setQuery] = useState("");
  const [alpacaFilter, setAlpacaFilter] = useState<DashboardStatus | "all">("all");
  const [marketingFilter, setMarketingFilter] = useState<MarketingAccess | "all">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries
      .filter((c) => {
        const alpacaStatus = getDashboardStatus(c);
        const marketing = getMarketingAccess(c);
        if (alpacaFilter !== "all" && alpacaStatus !== alpacaFilter) return false;
        if (marketingFilter !== "all" && marketing !== marketingFilter) return false;
        if (tierFilter !== "all" && c.tier !== Number(tierFilter)) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
        );
      })
      .sort(compareCountryPriority);
  }, [countries, query, alpacaFilter, marketingFilter, tierFilter]);

  const alpacaLabel = ALPACA_FILTERS.find((f) => f.value === alpacaFilter)?.label;
  const marketingLabel = MARKETING_FILTERS.find((f) => f.value === marketingFilter)?.label;
  const tierLabel = TIER_OPTIONS.find((f) => f.value === tierFilter)?.label;
  const hasFilters =
    alpacaFilter !== "all" || marketingFilter !== "all" || tierFilter !== "all";

  function clearAllFilters() {
    setAlpacaFilter("all");
    setMarketingFilter("all");
    setTierFilter("all");
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search by country, code, or region…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-musaffa-500 focus:outline-none focus:ring-2 focus:ring-musaffa-500/20 sm:max-w-md"
      />

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {alpacaFilter !== "all" && alpacaLabel && (
            <FilterChip
              label={`Alpaca: ${alpacaLabel}`}
              onRemove={() => setAlpacaFilter("all")}
            />
          )}
          {marketingFilter !== "all" && marketingLabel && (
            <FilterChip
              label={`Marketing: ${marketingLabel}`}
              onRemove={() => setMarketingFilter("all")}
            />
          )}
          {tierFilter !== "all" && tierLabel && (
            <FilterChip
              label={tierLabel}
              onRemove={() => setTierFilter("all")}
            />
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="text-sm text-slate-500">
        Showing {filtered.length} of {countries.length} countries
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-fixed divide-y divide-slate-200">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[7%]" />
            <col className="hidden w-[7%] sm:table-column" />
            <col className="hidden w-[12%] md:table-column" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="hidden w-[12%] lg:table-column" />
            <col className="hidden w-[8%] lg:table-column" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Country
              </th>
              <th className="px-4 py-3 text-left">
                <ColumnFilterHeader
                  label="Tier"
                  isActive={tierFilter !== "all"}
                  activeSelection={tierLabel}
                  options={TIER_OPTIONS}
                  value={tierFilter}
                  onChange={(v) => setTierFilter(v)}
                />
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                Code
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                Region
              </th>
              <th className="px-4 py-3 text-left">
                <ColumnFilterHeader
                  label="Alpaca"
                  isActive={alpacaFilter !== "all"}
                  activeSelection={alpacaLabel}
                  options={ALPACA_FILTERS}
                  value={alpacaFilter}
                  onChange={(v) => setAlpacaFilter(v as DashboardStatus | "all")}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <ColumnFilterHeader
                  label="Marketing"
                  isActive={marketingFilter !== "all"}
                  activeSelection={marketingLabel}
                  options={MARKETING_FILTERS}
                  value={marketingFilter}
                  onChange={(v) => setMarketingFilter(v as MarketingAccess | "all")}
                />
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                Risk
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                Currency
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((country) => (
              <tr
                key={country.slug}
                className="transition-colors hover:bg-slate-50/80"
              >
                <td className="truncate px-4 py-3">
                  <Link
                    href={`/countries/${country.slug}`}
                    className="font-medium text-slate-900 hover:text-musaffa-700"
                    title={country.name}
                  >
                    {country.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {country.tier ? (
                    <TierBadge tier={country.tier} />
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden truncate px-4 py-3 text-sm text-slate-500 sm:table-cell">
                  {country.code}
                </td>
                <td className="hidden truncate px-4 py-3 text-sm text-slate-500 md:table-cell">
                  {country.region}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={getDashboardStatus(country)} />
                </td>
                <td className="px-4 py-3">
                  <MarketingAccessBadge access={getMarketingAccess(country)} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <RiskBadge level={country.alpacaRiskLevel} />
                </td>
                <td className="hidden truncate px-4 py-3 text-sm text-slate-500 lg:table-cell">
                  {country.currency ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No countries match your search.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-xs text-slate-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-slate-200"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

function ColumnFilterHeader<T extends string>({
  label,
  isActive,
  activeSelection,
  options,
  value,
  onChange,
}: {
  label: string;
  isActive: boolean;
  activeSelection?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const ariaLabel = isActive && activeSelection
    ? `${label}, filtered by ${activeSelection}`
    : `${label}, filter`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
          isActive ? "text-musaffa-700" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {isActive && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-musaffa-600" aria-hidden />
        )}
        <span className="truncate">{label}</span>
        <svg
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={`${label} options`}
          className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  value === opt.value
                    ? "bg-musaffa-50 font-medium text-musaffa-800"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex w-4 shrink-0 justify-center">
                  {value === opt.value && (
                    <svg className="h-3.5 w-3.5 text-musaffa-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
