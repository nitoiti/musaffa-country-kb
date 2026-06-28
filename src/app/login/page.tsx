import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginButton } from "@/components/AuthHeader";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md pt-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Internal Musaffa tool. Use your{" "}
          <strong>@musaffa.com</strong> Google account.
        </p>

        {error === "AccessDenied" && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            Only @musaffa.com email addresses are allowed.
          </p>
        )}

        <div className="mt-6">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
