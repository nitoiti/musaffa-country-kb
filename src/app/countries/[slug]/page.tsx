import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CountryEditor } from "@/components/CountryEditor";
import { CountryStatusBar } from "@/components/CountryStatusBar";
import { ContentSourceBadge } from "@/components/ContentSourceBadge";
import { FeeCalculator } from "@/components/FeeCalculator";
import { KnowledgeBasePanel } from "@/components/KnowledgeBasePanel";
import { UserStatsPanel } from "@/components/UserStatsPanel";
import { getCountryBySlug } from "@/lib/countries";
import { canEditContent } from "@/lib/permissions";
import { getCountryTier, getTierLabel } from "@/lib/country-tiers";
import { INELIGIBILITY_LABELS } from "@/types/country";

export const dynamic = "force-dynamic";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  const session = await auth();

  if (!country) notFound();

  const tier = getCountryTier(country.slug);
  const canEdit = canEditContent(session?.user?.role);
  const extended = country as typeof country & {
    contentSource?: "ai_generated" | "human_verified";
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-musaffa-700 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {country.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {tier && (
                <>
                  <span className="font-medium text-musaffa-700">
                    {getTierLabel(tier)}
                  </span>
                  {" · "}
                </>
              )}
              {country.code}
              {country.region !== "Unknown" && ` · ${country.region}`}
              {country.currency && ` · ${country.currency}`}
            </p>
          </div>
          {extended.contentSource && (
            <ContentSourceBadge source={extended.contentSource} />
          )}
        </div>
      </div>

      <CountryEditor country={extended} canEdit={canEdit} />

      <CountryStatusBar country={country} />

      {!country.eligible ? (
        <IneligibleNotice country={country} />
      ) : (
        <>
          <FeeCalculator country={country} />
          {country.knowledgeBase && (
            <KnowledgeBasePanel kb={country.knowledgeBase} />
          )}
          {country.userStats && <UserStatsPanel stats={country.userStats} />}
        </>
      )}
    </div>
  );
}

function IneligibleNotice({
  country,
}: {
  country: NonNullable<Awaited<ReturnType<typeof getCountryBySlug>>>;
}) {
  const category = country.ineligibilityCategory;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">
        No country data available
      </h2>
      {category && (
        <p className="mt-1 text-sm font-medium text-red-700">
          {INELIGIBILITY_LABELS[category]}
        </p>
      )}
      <p className="mx-auto mt-3 max-w-md text-sm text-red-800">
        {country.ineligibilityReason}
      </p>
    </div>
  );
}
