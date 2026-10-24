import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/forms/submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { EventForm } from "@/components/organizer/event-form";
import { CancelEventForm, SubmitForReviewButton, TicketTypeForm } from "@/components/organizer/event-controls";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { remaining } from "@/lib/events/constants";
import { formatEventDate, formatPrice } from "@/lib/format";
import { deleteTicketTypeAction } from "@/lib/organizer/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Manage event — EventSphere" };

/** ISO -> "YYYY-MM-DDTHH:mm" in IST for datetime-local inputs. */
function toIstInput(iso: string | null): string {
  if (!iso) return "";
  const ist = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

export default function ManageEventPage({ params }: PageProps<"/organizer/events/[id]">) {
  return (
    <Container>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <ManageEvent params={params} />
      </Suspense>
    </Container>
  );
}

async function ManageEvent({ params }: { params: PageProps<"/organizer/events/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireRole(["organizer", "admin"], `/organizer/events/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event || (event.organizer_id !== user.id && user.profile.role !== "admin")) notFound();

  const { data: types } = await supabase.from("ticket_types").select("*").eq("event_id", id).order("price");
  const { data: attendees } = await supabase
    .from("tickets")
    .select("id, status, checked_in_at, user_id, ticket_type:ticket_types(name)")
    .eq("event_id", id)
    .order("created_at");
  const names = new Map<string, string>();
  if (attendees?.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...new Set(attendees.map((a) => a.user_id))]);
    profiles?.forEach((p) => names.set(p.id, p.full_name));
  }

  const isOwner = event.organizer_id === user.id;
  const editable = isOwner && event.status === "draft" && event.review_status !== "pending";
  const sold = (types ?? []).reduce((sum, t) => sum + t.sold, 0);
  const revenue = (types ?? []).reduce((sum, t) => sum + t.sold * Number(t.price), 0);
  const checkedIn = (attendees ?? []).filter((a) => a.checked_in_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/organizer/events" className="text-sm text-violet-300 hover:text-violet-200">← My events</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{event.title}</h1>
          <p className="text-sm text-slate-400">{formatEventDate(event.starts_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={event.status} />
          {event.status === "draft" ? <StatusBadge status={event.review_status} /> : null}
        </div>
      </div>

      {event.review_status === "rejected" && event.review_note ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">Admin feedback: {event.review_note}</p>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-3">
        {[["Tickets sold", String(sold)], ["Revenue (simulated)", formatPrice(revenue)], ["Checked in", String(checkedIn)]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-navy-900/70 p-5">
            <dt className="text-sm text-slate-400">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Ticket types" description={editable ? "Add at least one before submitting." : "Ticket types are locked once submitted."}>
          <ul className="space-y-2">
            {(types ?? []).map((type) => (
              <li key={type.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium text-white">{type.name}</span>{" "}
                  <span className="text-slate-400">· {formatPrice(Number(type.price))} · {type.sold} sold · {remaining(type)} left</span>
                </span>
                {editable ? (
                  <form action={deleteTicketTypeAction}>
                    <input type="hidden" name="ticketTypeId" value={type.id} />
                    <SubmitButton pendingLabel="…" variant="danger" className="px-3! py-1.5!">Remove</SubmitButton>
                  </form>
                ) : null}
              </li>
            ))}
            {types?.length ? null : <li className="text-sm text-slate-400">No ticket types yet.</li>}
          </ul>
          {editable ? <div className="mt-5"><TicketTypeForm eventId={event.id} /></div> : null}
        </DashboardCard>

        <DashboardCard title="Publishing">
          {editable ? (
            <SubmitForReviewButton eventId={event.id} />
          ) : event.review_status === "pending" ? (
            <p className="text-sm text-amber-200">Waiting for admin approval. You&apos;ll get a notification.</p>
          ) : event.status === "published" ? (
            <p className="text-sm text-emerald-200">
              Live. <Link href={`/events/${event.id}`} className="underline">View public page</Link>
            </p>
          ) : (
            <p className="text-sm text-slate-400">This event is {event.status}.</p>
          )}
          {event.status !== "cancelled" ? (
            <div className="mt-6 border-t border-white/10 pt-5">
              <CancelEventForm eventId={event.id} />
            </div>
          ) : null}
        </DashboardCard>
      </div>

      {editable ? (
        <DashboardCard title="Edit details">
          <EventForm
            defaults={{
              id: event.id,
              title: event.title,
              description: event.description,
              category: event.category,
              isOnline: event.is_online,
              venue: event.is_online ? "" : event.venue,
              city: event.is_online ? "" : event.city,
              onlineUrl: event.online_url ?? "",
              startsAt: toIstInput(event.starts_at),
              endsAt: toIstInput(event.ends_at),
              capacity: String(event.capacity),
            }}
          />
        </DashboardCard>
      ) : null}

      <DashboardCard title="Attendees" description={`${attendees?.length ?? 0} tickets issued`}>
        {attendees?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Ticket</th><th className="py-2 pr-4">Status</th><th className="py-2">Ticket ID</th></tr>
              </thead>
              <tbody className="text-slate-200">
                {attendees.map((a) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="py-2 pr-4">{names.get(a.user_id) || "—"}</td>
                    <td className="py-2 pr-4">{a.ticket_type?.name}</td>
                    <td className="py-2 pr-4"><StatusBadge status={a.status === "cancelled" ? "cancelled" : a.checked_in_at ? "checked_in" : "valid"} /></td>
                    <td className="py-2 font-mono text-xs text-slate-500">{a.id.slice(0, 8)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No tickets sold yet.</p>
        )}
      </DashboardCard>
    </div>
  );
}
