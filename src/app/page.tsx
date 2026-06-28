import { CountryDashboard } from "@/components/CountryDashboard";
import { getCountryListItems, getCountrySummary } from "@/lib/countries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countries = await getCountryListItems();
  const summary = await getCountrySummary();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Country Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Musaffa KYC and funding knowledge base. Select a country to view
          managed investing details, user statistics, fees, and support
          documentation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Countries" value={summary.total} />
        <StatCard label="Eligible" value={summary.eligible} accent="emerald" />
        <StatCard label="Not Eligible" value={summary.notEligible} accent="slate" />
      </div>

      <CountryDashboard countries={countries} />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "musaffa",
}: {
  label: string;
  value: number;
  accent?: "musaffa" | "emerald" | "slate";
}) {
  const valueColor = {
    musaffa: "text-musaffa-700",
    emerald: "text-emerald-700",
    slate: "text-slate-700",
  }[accent];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
