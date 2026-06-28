"use client";

import { useState } from "react";
import { ContentSourceBadge } from "@/components/ContentSourceBadge";
import { KB_SECTIONS } from "@/types/country";
import type { KnowledgeBase, KBSectionKey } from "@/types/country";

const statusStyles = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-50 text-emerald-700",
  needs_review: "bg-amber-50 text-amber-800",
};

export function KnowledgeBasePanel({ kb }: { kb: KnowledgeBase }) {
  const [active, setActive] = useState<KBSectionKey>("accountOpening");
  const section = kb[active];
  const meta = KB_SECTIONS.find((s) => s.key === active)!;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Knowledge Base</h2>
        <p className="text-sm text-slate-500">
          KYC, funding, and support documentation for this country
        </p>
      </div>

      <div className="flex flex-col lg:flex-row">
        <nav className="border-b border-slate-200 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
          <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-x-visible">
            {KB_SECTIONS.map(({ key, label }) => {
              const s = kb[key];
              return (
                <li key={key} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => setActive(key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active === key
                        ? "bg-musaffa-50 font-medium text-musaffa-800"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="whitespace-nowrap lg:whitespace-normal">
                      {label}
                    </span>
                    <span
                      className={`ml-2 hidden rounded px-1.5 py-0.5 text-[10px] font-medium capitalize lg:inline ${statusStyles[s.status]}`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">{meta.label}</h3>
            <div className="flex items-center gap-2">
              {section.contentSource && (
                <ContentSourceBadge source={section.contentSource} compact />
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[section.status]}`}
              >
                {section.status.replace("_", " ")}
              </span>
            </div>
          </div>
          {section.content ? (
            <div className="prose prose-sm max-w-none text-slate-700">
              {section.content.split("\n").map((line, i) => (
                <p key={i} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">No content yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Add documentation for {meta.label.toLowerCase()} in this country.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
