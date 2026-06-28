"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ROLE_LABELS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
} as const;

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" aria-hidden />
    );
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

  return <UserMenu user={session.user} />;
}

function UserMenu({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "ADMIN" | "EDITOR" | "VIEWER";
  };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-left shadow-sm transition-colors hover:bg-slate-50"
      >
        <UserAvatar image={user.image} initials={initials} name={displayName} />
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:inline">
          {displayName}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                image={user.image}
                initials={initials}
                name={displayName}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <RoleBadge role={user.role} />
              </div>
            </div>
            {user.email && (
              <p className="mt-2 truncate text-xs text-slate-500">{user.email}</p>
            )}
          </div>

          <div className="py-1">
            {user.role === "ADMIN" && (
              <MenuLink href="/admin" onSelect={() => setOpen(false)}>
                <AdminIcon />
                Admin dashboard
              </MenuLink>
            )}
            <MenuButton
              onClick={() => {
                setOpen(false);
                signOut({ redirectTo: "/login" });
              }}
            >
              <SignOutIcon />
              Sign out
            </MenuButton>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAvatar({
  image,
  initials,
  name,
  size = "sm",
}: {
  image?: string | null;
  initials: string;
  name: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-musaffa-100 font-semibold text-musaffa-800`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function RoleBadge({ role }: { role: keyof typeof ROLE_LABELS }) {
  const styles = {
    ADMIN: "bg-musaffa-50 text-musaffa-800 ring-musaffa-200",
    EDITOR: "bg-blue-50 text-blue-800 ring-blue-200",
    VIEWER: "bg-slate-100 text-slate-600 ring-slate-200",
  }[role];

  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function MenuLink({
  href,
  children,
  onSelect,
}: {
  href: string;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

function getDisplayName(user: {
  name?: string | null;
  email?: string | null;
}): string {
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0] ?? "Account";
  return "Account";
}

function getInitials(user: {
  name?: string | null;
  email?: string | null;
}): string {
  const source = user.name?.trim() || user.email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
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
