"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentSourceBadge } from "@/components/ContentSourceBadge";
import {
  INELIGIBILITY_LABELS,
  KB_SECTIONS,
  type Country,
  type KnowledgeBase,
  type KBSectionKey,
} from "@/types/country";

const statusStyles = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-50 text-emerald-700",
  needs_review: "bg-amber-50 text-amber-800",
};

type EditableCountry = Country & {
  contentSource?: "ai_generated" | "human_verified";
  updatedAt?: string;
  updatedByName?: string | null;
};

export function CountryEditor({
  country,
  canEdit,
}: {
  country: EditableCountry;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => structuredClone(country));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        code: form.code,
        region: form.region,
        eligible: form.eligible,
        alpacaRiskLevel: form.alpacaRiskLevel,
        currency: form.currency,
        ineligibilityReason: form.ineligibilityReason,
        ineligibilityCategory: form.ineligibilityCategory,
        managedInvesting: form.managedInvesting,
        fees: form.fees,
        contentSource: "human_verified",
        knowledgeBase: form.knowledgeBase
          ? Object.fromEntries(
              KB_SECTIONS.map(({ key }) => [
                key,
                {
                  ...form.knowledgeBase![key],
                  contentSource: "human_verified",
                },
              ]),
            )
          : undefined,
      };

      const res = await fetch(`/api/countries/${country.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }

      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateKb(key: KBSectionKey, patch: Partial<KnowledgeBase[KBSectionKey]>) {
    if (!form.knowledgeBase) return;
    setForm({
      ...form,
      knowledgeBase: {
        ...form.knowledgeBase,
        [key]: { ...form.knowledgeBase[key], ...patch },
      },
    });
  }

  if (!canEdit) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {country.contentSource && (
            <ContentSourceBadge source={country.contentSource} />
          )}
          {country.updatedByName && (
            <span className="text-xs text-slate-400">
              Last updated by {country.updatedByName}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setForm(structuredClone(country));
                  setEditing(false);
                  setError(null);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-musaffa-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-musaffa-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-musaffa-200 bg-musaffa-50 px-3 py-1.5 text-sm font-medium text-musaffa-800 hover:bg-musaffa-100"
            >
              Edit country
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {editing && (
        <div className="mt-6 space-y-8 border-t border-slate-100 pt-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Country details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Code">
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Region">
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Currency">
                <input
                  value={form.currency ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value || null })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Alpaca risk">
                <select
                  value={form.alpacaRiskLevel ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      alpacaRiskLevel: e.target.value || null,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Eligible">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.eligible}
                    onChange={(e) =>
                      setForm({ ...form, eligible: e.target.checked })
                    }
                  />
                  Allows onboarding
                </label>
              </Field>
            </div>

            {!form.eligible && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ineligibility category">
                  <select
                    value={form.ineligibilityCategory ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ineligibilityCategory: (e.target.value ||
                          null) as EditableCountry["ineligibilityCategory"],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {Object.entries(INELIGIBILITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ineligibility reason" className="sm:col-span-2">
                  <textarea
                    value={form.ineligibilityReason ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ineligibilityReason: e.target.value || null,
                      })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </section>

          {form.eligible && form.managedInvesting && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Managed investing
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Enabled">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.managedInvesting!.enabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          managedInvesting: {
                            ...form.managedInvesting!,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    Enabled
                  </label>
                </Field>
                <Field label="Provider">
                  <input
                    value={form.managedInvesting!.provider}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        managedInvesting: {
                          ...form.managedInvesting!,
                          provider: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <textarea
                    value={form.managedInvesting!.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        managedInvesting: {
                          ...form.managedInvesting!,
                          notes: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>
          )}

          {form.eligible && form.knowledgeBase && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Knowledge base
              </h3>
              <p className="text-xs text-slate-500">
                Saving marks all sections as team-verified.
              </p>
              {KB_SECTIONS.map(({ key, label }) => {
                const section = form.knowledgeBase![key];
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{label}</span>
                      <select
                        value={section.status}
                        onChange={(e) =>
                          updateKb(key, {
                            status: e.target.value as typeof section.status,
                          })
                        }
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="needs_review">Needs review</option>
                      </select>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateKb(key, { content: e.target.value })}
                      rows={6}
                      placeholder={`${label} content…`}
                      className={`${inputClass} font-mono text-xs`}
                    />
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-musaffa-500 focus:outline-none focus:ring-2 focus:ring-musaffa-500/20";
