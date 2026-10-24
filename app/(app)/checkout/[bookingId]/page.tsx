import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MockPaymentForm } from "@/components/bookings/mock-payment-form";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { formatEventDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout — EventSphere" };

export default function CheckoutPage({ params, searchParams }: PageProps<"/checkout/[bookingId]">) {
  return (
    <Container className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-white">Checkout</h1>
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <Checkout params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Checkout({
  params,
  searchParams,
}: {
  params: PageProps<"/checkout/[bookingId]">["params"];
  searchParams: PageProps<"/checkout/[bookingId]">["searchParams"];
}) {
  const { bookingId } = await params;
  const { failed } = await searchParams;
  await requireUser(`/checkout/${bookingId}`);
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) notFound();

  const supabase = await createClient();
  // Expire any old holds first so the status shown is accurate.
  await supabase.rpc("release_expired_holds");
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, event:events(title, starts_at, venue, city, is_online), ticket_type:ticket_types(name)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) notFound();

  const summary = (
    <div className="rounded-2xl border border-white/10 bg-navy-900/70 p-6 text-sm">
      <h2 className="text-lg font-semibold text-white">{booking.event?.title}</h2>
      <p className="mt-1 text-slate-400">{booking.event ? formatEventDate(booking.event.starts_at) : null}</p>
      <dl className="mt-4 space-y-2 text-slate-300">
        <div className="flex justify-between">
          <dt>
            {booking.quantity} × {booking.ticket_type?.name}
          </dt>
          <dd>{formatPrice(Number(booking.unit_price))} each</dd>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
          <dt>Total</dt>
          <dd>{formatPrice(Number(booking.total_amount))}</dd>
        </div>
      </dl>
    </div>
  );

  if (booking.status === "confirmed") {
    return (
      <div className="mt-6 space-y-4">
        {summary}
        <Link href={`/bookings/${booking.id}`} className="inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
          This booking is confirmed — view tickets
        </Link>
      </div>
    );
  }

  if (booking.status !== "held") {
    return (
      <div className="mt-6 space-y-4">
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          {failed
            ? "Payment failed (simulated). Your seats were released and you were not charged."
            : booking.status === "expired"
              ? "Your 10-minute hold expired, so the seats were released."
              : "This checkout was cancelled."}
        </p>
        {summary}
        <Link href={`/events/${booking.event_id}`} className="inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
          Try booking again
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {summary}
      <div className="rounded-2xl border border-white/10 bg-navy-900/70 p-6">
        <MockPaymentForm bookingId={booking.id} expiresAt={booking.hold_expires_at} />
      </div>
    </div>
  );
}
