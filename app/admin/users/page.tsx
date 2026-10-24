import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RoleForm } from "@/components/admin/admin-forms";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { Container } from "@/components/ui/container";
import { ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/dal";
import { formatEventDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users — EventSphere" };

export default function AdminUsersPage() {
  return (
    <Container>
      <Link href="/admin" className="text-sm text-violet-300 hover:text-violet-200">← Admin</Link>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Users</h1>
      <p className="mt-2 text-sm text-slate-400">Switch users between attendee and organizer. The admin role can only be granted in the database.</p>
      <Suspense fallback={<ListSkeleton />}>
        <UserTable />
      </Suspense>
    </Container>
  );
}

async function UserTable() {
  const me = await requireRole(["admin"], "/admin/users");
  const supabase = await createClient();
  const { data: users, error } = await supabase.rpc("admin_list_users");
  if (error || !users) return <div className="mt-6"><ErrorState message="Could not load users." /></div>;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-navy-900/70">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th><th className="p-4">Action</th></tr>
        </thead>
        <tbody className="text-slate-200">
          {users.map((u) => (
            <tr key={u.id} className="border-t border-white/5">
              <td className="p-4">{u.full_name || "—"}</td>
              <td className="p-4">{u.email}</td>
              <td className="p-4"><RoleBadge role={u.role} /></td>
              <td className="p-4 text-slate-400">{formatEventDate(u.created_at)}</td>
              <td className="p-4">{u.role !== "admin" && u.id !== me.id ? <RoleForm userId={u.id} role={u.role} /> : <span className="text-xs text-slate-500">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
