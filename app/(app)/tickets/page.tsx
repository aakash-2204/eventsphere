import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "My tickets — EventSphere" };

export default function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  return (
    <Container className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-white">My tickets</h1>
      <Suspense fallback={<ListSkeleton />}>
        <TicketList searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function TicketList({ searchParams }: { searchParams: PageProps<"/tickets">["searchParams"] }) {
  const { tab } = await searchParams;
  const showPast = tab === "past";
  const user = await requireUser("/tickets");
  const supabase = await createClient();
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, status, checked_in_at, event:events(title, starts_at, venue, city, is_online, online_url, status), ticket_type:ticket_types(name)")
    .eq("user_id", user.id);

  const now = nowMs();
  const list = (tickets ?? [])
    .filter((ticket) => ticket.event && (new Date(ticket.event.starts_at).getTime() < now) === showPast)
    .sort((a, b) => (a.event!.starts_at < b.event!.starts_at ? -1 : 1) * (showPast ? -1 : 1));

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-white/5"}`;

  return (
    <>
      <nav aria-label="Ticket tabs" className="mt-6 flex gap-2">
        <Link href="/tickets" className={tabClass(!showPast)} aria-current={!showPast ? "page" : undefined}>
          Upcoming
        </Link>
        <Link href="/tickets?tab=past" className={tabClass(showPast)} aria-current={showPast ? "page" : undefined}>
          Past
        </Link>
      </nav>
      <div className="mt-6 space-y-4">
        {error ? (
          <ErrorState message="Could not load your tickets." />
        ) : list.length === 0 ? (
          <EmptyState title={showPast ? "No past tickets" : "No upcoming tickets"}>
            <Link href="/events" className="text-violet-300 hover:text-violet-200">Explore events</Link>
          </EmptyState>
        ) : (
          list.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
      </div>
    </>
  );
}
