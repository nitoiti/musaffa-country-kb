"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

export function AdminUsersPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function setRole(userId: string, role: AdminUser["role"]) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update role");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u)),
    );
    router.refresh();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading users…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Team access</h2>
        <p className="text-sm text-slate-500">
          Only @musaffa.com accounts can sign in. Grant Editor to allow country
          edits; Admin can manage access.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-3 text-slate-800">{user.email}</td>
              <td className="px-6 py-3 text-slate-600">{user.name ?? "—"}</td>
              <td className="px-6 py-3">
                <select
                  value={user.role}
                  onChange={(e) =>
                    setRole(user.id, e.target.value as AdminUser["role"])
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  <option value="VIEWER">Viewer (read only)</option>
                  <option value="EDITOR">Editor (can edit)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="px-6 py-8 text-center text-sm text-slate-500">
          No users yet. Sign in with Google to create your account.
        </p>
      )}
    </div>
  );
}
