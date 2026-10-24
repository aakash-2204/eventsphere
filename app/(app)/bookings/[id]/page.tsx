import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/dal";
import { formatEventDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Booking — EventSphere" };

export default function BookingDetailPage({ params }: PageProps<"/bookings/[id]">) {
  return (
    <Container className="max-w-3xl">
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <BookingDetail params={params} />
      </Suspense>
    </Container>
  );
}

async function BookingDetail({ params }: { params: PageProps<"/bookings/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser(`/bookings/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  // Filtering by user_id as well as RLS: attendees only ever see their own bookings.
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, event:events(title, starts_at, venue, city, is_online, online_url, status), ticket_type:ticket_types(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking) notFound();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, status, checked_in_at, event:events(title, starts_at, venue, city, is_online, online_url, status), ticket_type:ticket_types(name)")
    .eq("booking_id", booking.id)
    .order("created_at");

  const canCancel =
    booking.status === "confirmed" && booking.event && new Date(booking.event.starts_at).getTime() > nowMs();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{booking.event?.title}</h1>
          <p className="text-sm text-slate-400">{booking.event ? formatEventDate(booking.event.starts_at) : null}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="grid gap-3 rounded-2xl border border-white/10 bg-navy-900/70 p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Tickets</dt><dd className="text-white">{booking.quantity} × {booking.ticket_type?.name}</dd></div>
        <div><dt className="text-slate-500">Total (simulated)</dt><dd className="text-white">{formatPrice(Number(booking.total_amount))}</dd></div>
        <div><dt className="text-slate-500">Payment</dt><dd className="text-white">{booking.payment_method ? `${booking.payment_method.toUpperCase()} · ${booking.payment_reference}` : "—"}</dd></div>
        <div><dt className="text-slate-500">Booked</dt><dd className="text-white">{formatEventDate(booking.created_at)}</dd></div>
      </dl>

      {canCancel ? <CancelBookingButton bookingId={booking.id} /> : null}

      {tickets && tickets.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Tickets</h2>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
