import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
import { canManageUsers } from "@/lib/permissions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canManageUsers(session.user.role)) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage who can edit country data on this knowledge base.
        </p>
      </div>
      <AdminUsersPanel />
    </div>
  );
}
