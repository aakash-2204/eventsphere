import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/dal";
import { formatEventDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My bookings — EventSphere" };

export default function BookingsPage() {
  return (
    <Container>
      <h1 className="text-3xl font-bold tracking-tight text-white">My bookings</h1>
      <Suspense fallback={<ListSkeleton />}>
        <BookingList />
      </Suspense>
    </Container>
  );
}

async function BookingList() {
  const user = await requireUser("/bookings");
  const supabase = await createClient();
  await supabase.rpc("release_expired_holds");
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, status, quantity, total_amount, created_at, event:events(title, starts_at), ticket_type:ticket_types(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return <div className="mt-6"><ErrorState message="Could not load your bookings." /></div>;
  if (bookings.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState title="No bookings yet">
          <Link href="/events" className="text-violet-300 hover:text-violet-200">Explore events</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {bookings.map((booking) => (
        <li key={booking.id}>
          <Link
            href={booking.status === "held" ? `/checkout/${booking.id}` : `/bookings/${booking.id}`}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-navy-900/70 p-5 hover:border-violet-500/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-white">{booking.event?.title}</p>
              <p className="text-sm text-slate-400">
                {booking.event ? formatEventDate(booking.event.starts_at) : null} · {booking.quantity} × {booking.ticket_type?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{formatPrice(Number(booking.total_amount))}</span>
              <StatusBadge status={booking.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
