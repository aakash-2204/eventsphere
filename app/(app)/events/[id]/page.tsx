import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, User, Wifi } from "lucide-react";
import { BookingForm } from "@/components/bookings/booking-form";
import { categoryStyles } from "@/components/events/category-style";
import { Container } from "@/components/ui/container";
import { ListSkeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth/dal";
import { categoryName, remaining } from "@/lib/events/constants";
import { formatEventDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/time";
import type { EventCategoryId } from "@/types/event";

export const metadata: Metadata = { title: "Event — EventSphere" };

export default function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  return (
    <Container>
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <EventDetail params={params} />
      </Suspense>
    </Container>
  );
}

async function EventDetail({ params }: { params: PageProps<"/events/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  // RLS: guests see published events; organizers/admins also see their own drafts.
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const { data: types } = await supabase.from("ticket_types").select("*").eq("event_id", id).order("price");
  const { data: organizer } = await supabase.from("profiles").select("full_name").eq("id", event.organizer_id).maybeSingle();
  const user = await getCurrentUser();
  const now = nowMs();

  const options = (types ?? []).map((type) => ({
    id: type.id,
    name: type.name,
    price: Number(type.price),
    left: remaining(type),
    onSale:
      (!type.sale_starts_at || new Date(type.sale_starts_at).getTime() <= now) &&
      (!type.sale_ends_at || new Date(type.sale_ends_at).getTime() > now),
  }));
  const style = categoryStyles[event.category as EventCategoryId] ?? categoryStyles.music;
  const bookable = event.status === "published" && new Date(event.starts_at).getTime() > now;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <article>
        <div className={`relative h-56 overflow-hidden rounded-2xl bg-linear-to-br sm:h-72 ${style.gradient}`}>
          {event.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner
            <img src={event.banner_url} alt={`${event.title} banner`} className="size-full object-cover" />
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{categoryName(event.category)}</span>
          {event.status !== "published" ? <StatusBadge status={event.status} /> : null}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{event.title}</h1>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4 text-violet-400" />
            <time dateTime={event.starts_at}>{formatEventDate(event.starts_at)}</time>
            {event.ends_at ? <> – {formatEventDate(event.ends_at)}</> : null}
          </li>
          <li className="flex items-center gap-2">
            {event.is_online ? <Wifi aria-hidden="true" className="size-4 text-violet-400" /> : <MapPin aria-hidden="true" className="size-4 text-violet-400" />}
            {event.is_online ? "Online event — the joining link appears on your ticket" : `${event.venue}, ${event.city}`}
          </li>
          <li className="flex items-center gap-2">
            <User aria-hidden="true" className="size-4 text-violet-400" />
            Organized by {organizer?.full_name || "EventSphere organizer"}
          </li>
        </ul>
        {event.status === "cancelled" ? (
          <p role="alert" className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            This event has been cancelled{event.cancel_reason ? `: ${event.cancel_reason}` : "."}
          </p>
        ) : null}
        <p className="mt-6 whitespace-pre-line leading-7 text-slate-300">{event.description}</p>
      </article>

      <aside className="h-fit rounded-2xl border border-white/10 bg-navy-900/70 p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold text-white">Tickets</h2>
        <div className="mt-4">
          {!bookable ? (
            <p className="text-sm text-slate-400">Tickets are not available for this event.</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-slate-400">No ticket types yet.</p>
          ) : !user ? (
            <Link
              href={`/login?next=/events/${event.id}`}
              className="flex w-full justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Log in to book
            </Link>
          ) : (
            <BookingForm eventId={event.id} options={options} />
          )}
        </div>
      </aside>
    </div>
  );
}
