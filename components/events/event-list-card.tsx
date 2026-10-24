import Link from "next/link";
import { CalendarDays, MapPin, Wifi } from "lucide-react";
import { categoryStyles } from "@/components/events/category-style";
import { categoryName } from "@/lib/events/constants";
import { formatEventDate, formatPrice } from "@/lib/format";
import type { EventCategoryId } from "@/types/event";
import type { EventRow } from "@/types/database";

/** Card for a database event. Links to its detail page. */
export function EventListCard({ event }: { event: EventRow }) {
  const style = categoryStyles[event.category as EventCategoryId] ?? categoryStyles.music;
  const Icon = style.icon;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-900/70 transition hover:-translate-y-1 hover:border-violet-500/50 focus-visible:outline-2 focus-visible:outline-violet-400"
    >
      <div className={`relative flex h-36 items-center justify-center bg-linear-to-br ${style.gradient}`}>
        {event.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banners from Supabase Storage
          <img src={event.banner_url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Icon aria-hidden="true" className="size-12 text-white/80" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-navy-950/70 px-3 py-1 text-xs font-medium text-white">
          {categoryName(event.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-white group-hover:text-violet-200">{event.title}</h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays aria-hidden="true" className="size-4 text-violet-400" />
          <time dateTime={event.starts_at}>{formatEventDate(event.starts_at)}</time>
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
          {event.is_online ? (
            <Wifi aria-hidden="true" className="size-4 text-violet-400" />
          ) : (
            <MapPin aria-hidden="true" className="size-4 text-violet-400" />
          )}
          {event.is_online ? "Online event" : `${event.venue}, ${event.city}`}
        </p>
        <p className="mt-auto pt-4 text-lg font-bold text-white">
          <span className="mr-1 text-xs font-normal text-slate-500">From</span>
          {formatPrice(Number(event.price_from))}
        </p>
      </div>
    </Link>
  );
}
