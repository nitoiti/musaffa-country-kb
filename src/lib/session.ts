import { auth } from "@/auth";
import { canEditContent, canManageUsers } from "@/lib/permissions";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireEditor() {
  const user = await getSessionUser();
  if (!user || !canEditContent(user.role)) {
    return null;
  }
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !canManageUsers(user.role)) {
    return null;
  }
  return user;
}
