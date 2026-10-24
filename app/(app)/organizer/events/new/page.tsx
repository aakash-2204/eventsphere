import { Suspense } from "react";
import type { Metadata } from "next";
import { EventForm } from "@/components/organizer/event-form";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New event — EventSphere" };

export default function NewEventPage() {
  return (
    <Container className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-white">Create an event</h1>
      <p className="mt-2 text-sm text-slate-400">Save a draft, add ticket types, then submit it for admin approval.</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/70 p-6">
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <Guarded />
        </Suspense>
      </div>
    </Container>
  );
}

async function Guarded() {
  await requireRole(["organizer"], "/organizer/events/new");
  return <EventForm />;
}
