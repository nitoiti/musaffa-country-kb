import { STAGE_LABELS } from "@/types/country";
import type { UserStats } from "@/types/country";

export function UserStatsPanel({ stats }: { stats: UserStats }) {
  const maxStage = Math.max(...Object.values(stats.stages), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-75">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">User Overview</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-slate-500">Users by onboarding stage</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-musaffa-700">{stats.totalUsers}</p>
          <p className="text-xs text-slate-500">Total users</p>
        </div>
      </div>

      <div className="space-y-4">
        {STAGE_LABELS.map(({ key, label }) => {
          const count = stats.stages[key];
          const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
          const barPct = (count / maxStage) * 100;

          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700">{label}</span>
                <span className="font-medium text-slate-900">
                  {count}
                  {stats.totalUsers > 0 && (
                    <span className="ml-1 text-slate-400">({pct.toFixed(0)}%)</span>
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-musaffa-500 transition-all"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
