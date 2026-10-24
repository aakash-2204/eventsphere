import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventListCard } from "@/components/events/event-list-card";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { categories } from "@/lib/events/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Explore events — EventSphere" };

type Filters = { q?: string; category?: string; city?: string; from?: string; maxPrice?: string; sort?: string };

const field =
  "w-full rounded-xl border border-white/10 bg-navy-950/80 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40";

export default function EventsPage({ searchParams }: PageProps<"/events">) {
  return (
    <Container>
      <h1 className="text-3xl font-bold tracking-tight text-white">Explore events</h1>
      <p className="mt-2 text-sm text-slate-400">Search approved events. Your filters are saved in the page URL.</p>
      <Suspense fallback={<ListSkeleton />}>
        <FilteredEvents searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

function pick(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text?.trim() ? text.trim().slice(0, 80) : undefined;
}

async function FilteredEvents({ searchParams }: { searchParams: PageProps<"/events">["searchParams"] }) {
  const raw = await searchParams;
  const filters: Filters = {
    q: pick(raw.q),
    category: pick(raw.category),
    city: pick(raw.city),
    from: pick(raw.from),
    maxPrice: pick(raw.maxPrice),
    sort: pick(raw.sort),
  };

  return (
    <>
      {/* A plain GET form puts every filter in the URL, so results can be shared and bookmarked. */}
      <form
        role="search"
        method="get"
        className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-navy-900/70 p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="lg:col-span-2">
          <span className="sr-only">Search by name</span>
          <input name="q" defaultValue={filters.q} placeholder="Search by event name" className={field} />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={filters.category ?? ""} className={field}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">City</span>
          <input name="city" defaultValue={filters.city} placeholder="City" className={field} />
        </label>
        <label>
          <span className="sr-only">From date</span>
          <input name="from" type="date" defaultValue={filters.from} className={field} />
        </label>
        <label>
          <span className="sr-only">Maximum price</span>
          <input name="maxPrice" type="number" min="0" step="100" defaultValue={filters.maxPrice} placeholder="Max ₹" className={field} />
        </label>
        <label className="lg:col-span-2">
          <span className="sr-only">Sort</span>
          <select name="sort" defaultValue={filters.sort ?? "date"} className={field}>
            <option value="date">Sort: soonest first</option>
            <option value="price_asc">Sort: price low to high</option>
            <option value="price_desc">Sort: price high to low</option>
          </select>
        </label>
        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          <Link href="/events" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
            Clear
          </Link>
          <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
            Apply filters
          </button>
        </div>
      </form>

      <div className="mt-8">
        <Results filters={filters} />
      </div>
    </>
  );
}

async function Results({ filters }: { filters: Filters }) {
  if (!isSupabaseConfigured()) return <ErrorState message="Supabase is not configured yet." />;

  const supabase = await createClient();
  // RLS only returns published events to the public; we also hide past ones.
  let query = supabase.from("events").select("*").eq("status", "published").gte("starts_at", new Date().toISOString());

  if (filters.q) query = query.ilike("title", `%${filters.q.replace(/[%_]/g, "")}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.city) query = query.ilike("city", `%${filters.city.replace(/[%_]/g, "")}%`);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) query = query.gte("starts_at", `${filters.from}T00:00:00+05:30`);
  const maxPrice = Number(filters.maxPrice);
  if (filters.maxPrice && Number.isFinite(maxPrice)) query = query.lte("price_from", maxPrice);

  if (filters.sort === "price_asc") query = query.order("price_from", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price_from", { ascending: false });
  else query = query.order("starts_at", { ascending: true });

  const { data: events, error } = await query.limit(60);
  if (error) return <ErrorState message="Could not load events. Please refresh the page." />;
  if (events.length === 0) {
    return (
      <EmptyState title="No events match your filters">
        <Link href="/events" className="text-violet-300 hover:text-violet-200">
          Clear filters
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-slate-400" aria-live="polite">
        {events.length} {events.length === 1 ? "event" : "events"} found
      </p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventListCard event={event} />
          </li>
        ))}
      </ul>
    </>
  );
}
