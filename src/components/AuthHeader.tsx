"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs text-slate-400">…</span>;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-musaffa-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-musaffa-700"
      >
        Sign in
      </Link>
    );
  }

  const { user } = session;
  const canEdit = user.role === "ADMIN" || user.role === "EDITOR";

  return (
    <div className="flex items-center gap-3">
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="text-sm text-slate-600 hover:text-musaffa-700"
        >
          Admin
        </Link>
      )}
      {canEdit && (
        <span className="hidden rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 sm:inline">
          Can edit
        </span>
      )}
      <span className="hidden max-w-[140px] truncate text-sm text-slate-600 sm:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ redirectTo: "/login" })}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Sign out
      </button>
    </div>
  );
}

export function LoginButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
    >
      <GoogleIcon />
      Sign in with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
