import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { formatEventDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My events — EventSphere" };

export default function OrganizerEventsPage() {
  return (
    <Container>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">My events</h1>
        <div className="flex gap-2">
          <Link href="/organizer/check-in" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
            <ScanLine aria-hidden="true" className="size-4" /> Check-in
          </Link>
          <Link href="/organizer/events/new" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
            <Plus aria-hidden="true" className="size-4" /> New event
          </Link>
        </div>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <EventsWithSales />
      </Suspense>
    </Container>
  );
}

async function EventsWithSales() {
  const user = await requireRole(["organizer", "admin"], "/organizer/events");
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, starts_at, status, review_status, ticket_types(quantity, sold, price)")
    .eq("organizer_id", user.id)
    .order("starts_at", { ascending: true });

  if (error) return <div className="mt-6"><ErrorState message="Could not load your events." /></div>;
  if (events.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState title="No events yet">
          {user.profile.role === "organizer" ? (
            <Link href="/organizer/events/new" className="text-violet-300 hover:text-violet-200">Create your first event</Link>
          ) : "Only organizers can create events."}
        </EmptyState>
      </div>
    );
  }

  const rows = events.map((event) => {
    const capacity = event.ticket_types.reduce((sum, t) => sum + t.quantity, 0);
    const sold = event.ticket_types.reduce((sum, t) => sum + t.sold, 0);
    const revenue = event.ticket_types.reduce((sum, t) => sum + t.sold * Number(t.price), 0);
    return { ...event, capacity, sold, revenue };
  });
  const totalSold = rows.reduce((sum, r) => sum + r.sold, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Events", String(rows.length)],
          ["Tickets sold", String(totalSold)],
          ["Revenue (simulated)", formatPrice(totalRevenue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-navy-900/70 p-5">
            <dt className="text-sm text-slate-400">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-6 space-y-3">
        {rows.map((event) => {
          const percent = event.capacity ? Math.round((event.sold / event.capacity) * 100) : 0;
          const status = event.status === "draft" ? event.review_status : event.status;
          return (
            <li key={event.id}>
              <Link href={`/organizer/events/${event.id}`} className="block rounded-2xl border border-white/10 bg-navy-900/70 p-5 hover:border-violet-500/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-sm text-slate-400">{formatEventDate(event.starts_at)}</p>
                  </div>
                  <StatusBadge status={status === "not_submitted" ? "draft" : status} />
                </div>
                {/* Simple sales bar chart: tickets sold vs total inventory. */}
                <div className="mt-4" aria-label={`${event.sold} of ${event.capacity} tickets sold`}>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {event.sold} / {event.capacity} sold · {formatPrice(event.revenue)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
