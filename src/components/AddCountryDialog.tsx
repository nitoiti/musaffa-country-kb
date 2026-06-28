"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const REGIONS = [
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Middle East",
  "Oceania",
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AddCountryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[3]);
  const [currency, setCurrency] = useState("");
  const [eligible, setEligible] = useState(true);
  const [slugOverride, setSlugOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugOverride.trim() || slugify(name);

  const canSubmit = useMemo(
    () => name.trim() && /^[A-Za-z]{3}$/.test(code.trim()) && region && slug,
    [name, code, region, slug],
  );

  function resetForm() {
    setName("");
    setCode("");
    setRegion(REGIONS[3]);
    setCurrency("");
    setEligible(true);
    setSlugOverride("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          region,
          slug,
          currency: currency.trim() || null,
          eligible,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create country.");
        return;
      }

      setOpen(false);
      resetForm();
      router.push(`/countries/${data.slug}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-musaffa-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-musaffa-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add country
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="add-country-title"
          >
            <h2 id="add-country-title" className="text-lg font-semibold text-slate-900">
              Add country
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Creates a new country profile with empty knowledge-base sections.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field label="Country name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Belgium"
                  className={inputClass}
                  autoFocus
                />
              </Field>

              <Field label="ISO code" required>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="e.g. BEL"
                  maxLength={3}
                  className={inputClass}
                />
              </Field>

              <Field label="Region" required>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Currency">
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="e.g. EUR"
                  maxLength={3}
                  className={inputClass}
                />
              </Field>

              <Field label="URL slug">
                <input
                  type="text"
                  value={slugOverride}
                  onChange={(e) => setSlugOverride(e.target.value)}
                  placeholder={slug || "auto-from-name"}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-500">
                  /countries/{slug || "…"}
                </p>
              </Field>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={eligible}
                  onChange={(e) => setEligible(e.target.checked)}
                  className="rounded border-slate-300 text-musaffa-600 focus:ring-musaffa-500"
                />
                Alpaca eligible
              </label>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="rounded-lg bg-musaffa-600 px-4 py-2 text-sm font-medium text-white hover:bg-musaffa-700 disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create country"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-musaffa-500 focus:outline-none focus:ring-2 focus:ring-musaffa-500/20";
