import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Payment successful — EventSphere" };

export default function PaymentSuccessPage({ params }: PageProps<"/checkout/[bookingId]/success">) {
  return (
    <Container className="max-w-xl">
      <Suspense fallback={<ListSkeleton rows={1} />}>
        <Success params={params} />
      </Suspense>
    </Container>
  );
}

async function Success({ params }: { params: PageProps<"/checkout/[bookingId]/success">["params"] }) {
  const { bookingId } = await params;
  await requireUser(`/checkout/${bookingId}/success`);
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, quantity, total_amount, payment_reference, event:events(title)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.status !== "confirmed") notFound();

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-navy-900/70 p-8 text-center">
      <CircleCheck aria-hidden="true" className="mx-auto size-14 text-emerald-300" />
      <h1 className="mt-4 text-2xl font-bold text-white">Payment successful</h1>
      <p className="mt-2 text-sm text-slate-400">
        {booking.quantity} ticket(s) for <strong className="text-white">{booking.event?.title}</strong> are confirmed.
      </p>
      <p className="mt-4 text-sm text-slate-300">
        Paid {formatPrice(Number(booking.total_amount))} (simulated) · Reference {booking.payment_reference}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/tickets" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500">
          View my tickets
        </Link>
        <Link href={`/bookings/${booking.id}`} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5">
          Booking details
        </Link>
      </div>
    </div>
  );
}
