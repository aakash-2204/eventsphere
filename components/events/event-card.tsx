import { CalendarDays, MapPin, Users } from "lucide-react";
import { formatEventDate, formatPrice } from "@/lib/format";
import type { EventCategory, EventSummary } from "@/types/event";
import { categoryStyles } from "./category-style";

type EventCardProps = {
  event: EventSummary;
  category: EventCategory;
};

export function EventCard({ event, category }: EventCardProps) {
  const style = categoryStyles[event.categoryId];
  const Icon = style.icon;
  const isAlmostFull = event.seatsLeft <= 30;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-900/70 transition hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-950/40">
      {/* Gradient cover stands in for event images until real ones are uploaded. */}
      <div className={`relative flex h-36 items-center justify-center bg-linear-to-br ${style.gradient}`}>
        <Icon aria-hidden="true" className="size-12 text-white/80 transition group-hover:scale-110" />
        <span className="absolute left-3 top-3 rounded-full bg-navy-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-white">{event.title}</h3>
        <p className="mt-1 text-sm text-slate-400">by {event.organizer}</p>

        <dl className="mt-4 space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Date and time</dt>
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-violet-400" />
            <dd>
              <time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Venue</dt>
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-violet-400" />
            <dd>
              {event.venue}, {event.city}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Availability</dt>
            <Users aria-hidden="true" className="size-4 shrink-0 text-violet-400" />
            <dd className={isAlmostFull ? "text-amber-300" : undefined}>
              {event.seatsLeft} seats left
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
          <p>
            <span className="block text-xs text-slate-500">From</span>
            <span className="text-lg font-bold text-white">{formatPrice(event.priceFrom)}</span>
          </p>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            Booking opens soon
          </span>
        </div>
      </div>
    </article>
  );
}
