import { auth } from "@/auth";
import { AddCountryDialog } from "@/components/AddCountryDialog";
import { CountryDashboard } from "@/components/CountryDashboard";
import { canEditContent } from "@/lib/permissions";
import { getCountryListItems, getCountrySummary } from "@/lib/countries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [countries, summary, session] = await Promise.all([
    getCountryListItems(),
    getCountrySummary(),
    auth(),
  ]);
  const canEdit = Boolean(session?.user && canEditContent(session.user.role));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
        {canEdit && <AddCountryDialog />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total countries"
          value={summary.total}
          hint="In the knowledge base"
        />
        <StatCard
          label="AI draft"
          value={summary.aiGenerated}
          accent="violet"
          hint="Needs team review"
        />
        <StatCard
          label="Team verified"
          value={summary.teamVerified}
          accent="blue"
          hint="Confirmed by Musaffa staff"
        />
      </div>

      <CountryDashboard countries={countries} />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent = "musaffa",
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "musaffa" | "violet" | "blue";
}) {
  const valueColor = {
    musaffa: "text-musaffa-700",
    violet: "text-violet-700",
    blue: "text-blue-700",
  }[accent];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
