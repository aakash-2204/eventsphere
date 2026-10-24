import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReviewEventForm } from "@/components/admin/admin-forms";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/dal";
import { categoryName } from "@/lib/events/constants";
import { formatEventDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Event approvals — EventSphere" };

export default function AdminEventsPage() {
  return (
    <Container>
      <Link href="/admin" className="text-sm text-violet-300 hover:text-violet-200">← Admin</Link>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Event approvals</h1>
      <Suspense fallback={<ListSkeleton />}>
        <PendingEvents />
      </Suspense>
    </Container>
  );
}

async function PendingEvents() {
  const user = await requireRole(["admin"], "/admin/events");
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, description, category, starts_at, venue, city, is_online, organizer_id, ticket_types(name, price, quantity)")
    .eq("review_status", "pending")
    .order("created_at");

  if (error) return <div className="mt-6"><ErrorState message="Could not load pending events." /></div>;
  if (events.length === 0) return <div className="mt-6"><EmptyState title="No events waiting for approval" /></div>;

  return (
    <ul className="mt-6 space-y-4">
      {events.map((event) => (
        <li key={event.id} className="grid gap-5 rounded-2xl border border-white/10 bg-navy-900/70 p-6 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs text-slate-400">{categoryName(event.category)} · {formatEventDate(event.starts_at)}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{event.title}</h2>
            <p className="text-sm text-slate-400">{event.is_online ? "Online" : `${event.venue}, ${event.city}`}</p>
            <p className="mt-3 line-clamp-4 text-sm text-slate-300">{event.description}</p>
            <p className="mt-3 text-xs text-slate-400">
              Tickets: {event.ticket_types.map((t) => `${t.name} ₹${t.price} × ${t.quantity}`).join(" · ")}
            </p>
          </div>
          {event.organizer_id === user.id ? (
            <p className="text-sm text-amber-200">This is your own event — another admin must review it.</p>
          ) : (
            <ReviewEventForm eventId={event.id} />
          )}
        </li>
      ))}
    </ul>
  );
}
