export function ContentSourceBadge({
  source,
  compact,
}: {
  source: "ai_generated" | "human_verified";
  compact?: boolean;
}) {
  const isHuman = source === "human_verified";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      } ${
        isHuman
          ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
          : "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
      }`}
      title={
        isHuman
          ? "Reviewed and updated by the Musaffa team"
          : "AI-generated draft — verify before relying on this"
      }
    >
      {isHuman ? "Verified" : "AI draft"}
    </span>
  );
}
