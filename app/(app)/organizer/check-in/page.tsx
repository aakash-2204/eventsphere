import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckInForm } from "@/components/organizer/check-in-form";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Check-in — EventSphere" };

export default function CheckInPage() {
  return (
    <Container className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-white">Ticket check-in</h1>
      <p className="mt-2 text-sm text-slate-400">Scan an attendee&apos;s QR code or type the ticket ID. Each ticket works only once.</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/70 p-6">
        <Suspense fallback={<ListSkeleton rows={1} />}>
          <Guarded />
        </Suspense>
      </div>
    </Container>
  );
}

async function Guarded() {
  await requireRole(["organizer", "admin"], "/organizer/check-in");
  return <CheckInForm />;
}
