import type { UserRole } from "@prisma/client";

const MUSAFFA_DOMAIN = "musaffa.com";

export function isMusaffaEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${MUSAFFA_DOMAIN}`);
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdmin(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export function canEditContent(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}
