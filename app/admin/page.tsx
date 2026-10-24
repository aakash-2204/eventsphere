import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin — EventSphere" };

export default function AdminPage() {
  return (
    <Container>
      <h1 className="text-3xl font-bold tracking-tight text-white">Admin overview</h1>
      <nav aria-label="Admin" className="mt-4 flex flex-wrap gap-2">
        {[
          ["/admin/events", "Event approvals"],
          ["/admin/organizer-requests", "Organizer requests"],
          ["/admin/users", "Users"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            {label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <Stats />
      </Suspense>
    </Container>
  );
}

async function Stats() {
  await requireRole(["admin"], "/admin");
  const supabase = await createClient();
  const { data: stats, error } = await supabase.rpc("admin_platform_stats");
  if (error || !stats) return <div className="mt-6"><ErrorState message="Could not load platform stats." /></div>;

  const cards: [string, string][] = [
    ["Users", String(stats.users)],
    ["Organizers", String(stats.organizers)],
    ["Published events", String(stats.events_published)],
    ["Events awaiting approval", String(stats.events_pending)],
    ["Confirmed bookings", String(stats.bookings_confirmed)],
    ["Valid tickets", String(stats.tickets_sold)],
    ["Checked in", String(stats.checked_in)],
    ["Revenue (simulated)", formatPrice(Number(stats.revenue))],
  ];
  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-navy-900/70 p-5">
          <dt className="text-sm text-slate-400">{label}</dt>
          <dd className="mt-1 text-2xl font-bold text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
