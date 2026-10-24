import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ticket — EventSphere" };

export default function TicketDetailPage({ params }: PageProps<"/tickets/[id]">) {
  return (
    <Container className="max-w-2xl">
      <Suspense fallback={<ListSkeleton rows={1} />}>
        <TicketDetail params={params} />
      </Suspense>
    </Container>
  );
}

async function TicketDetail({ params }: { params: PageProps<"/tickets/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser(`/tickets/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, status, checked_in_at, event:events(title, starts_at, venue, city, is_online, online_url, status), ticket_type:ticket_types(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ticket) notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-white">Your ticket</h1>
      <TicketCard ticket={ticket} large />
      <p className="mt-4 text-sm text-slate-400">Show this QR code at the entrance. Each ticket can be checked in only once.</p>
    </>
  );
}
