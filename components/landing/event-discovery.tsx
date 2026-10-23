"use client";

// Search panel + featured events grid. They live in one component because the
// search filters the cards shown below it. In Phase 1 the search only filters
// the local sample data; a later phase will query the database instead.

import { useMemo, useState, type FormEvent } from "react";
import { Search, SearchX } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { EventCategory, EventCategoryId, EventSummary } from "@/types/event";

type EventDiscoveryProps = {
  events: EventSummary[];
  categories: EventCategory[];
};

const ALL = "all";

const fieldClasses =
  "w-full rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40";

export function EventDiscovery({ events, categories }: EventDiscoveryProps) {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState(ALL);
  const [categoryId, setCategoryId] = useState<EventCategoryId | typeof ALL>(ALL);

  const cities = useMemo(
    () => Array.from(new Set(events.map((event) => event.city))).sort(),
    [events],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredEvents = events.filter((event) => {
    const query = keyword.trim().toLowerCase();
    const matchesKeyword =
      query === "" ||
      event.title.toLowerCase().includes(query) ||
      event.organizer.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query);
    const matchesCity = city === ALL || event.city === city;
    const matchesCategory = categoryId === ALL || event.categoryId === categoryId;
    return matchesKeyword && matchesCity && matchesCategory;
  });

  const hasFilters = keyword !== "" || city !== ALL || categoryId !== ALL;

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    // Filtering already happens as the user types, so there is nothing to submit.
    formEvent.preventDefault();
  }

  function clearFilters() {
    setKeyword("");
    setCity(ALL);
    setCategoryId(ALL);
  }

  return (
    <>
      {/* Search panel — overlaps the bottom of the hero section. */}
      <Container className="relative z-10 -mt-12">
        <form
          role="search"
          aria-label="Search events"
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-2xl border border-white/10 bg-navy-900/90 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-5 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <div>
            <label htmlFor="search-keyword" className="sr-only">
              Event name, organizer or venue
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              />
              <input
                id="search-keyword"
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search events, organizers, venues"
                className={`${fieldClasses} pl-11`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="search-city" className="sr-only">
              City
            </label>
            <select
              id="search-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={fieldClasses}
            >
              <option value={ALL}>All cities</option>
              {cities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="search-category" className="sr-only">
              Category
            </label>
            <select
              id="search-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as EventCategoryId | typeof ALL)}
              className={fieldClasses}
            >
              <option value={ALL}>All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-violet-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </form>
      </Container>

      {/* Featured events */}
      <section aria-labelledby="featured-events-heading" id="featured-events" className="scroll-mt-24 py-20">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="featured-events-heading"
              eyebrow="Featured"
              title="Upcoming events"
              description="Hand-picked experiences happening across India."
            />
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {filteredEvents.length} of {events.length} sample events
            </p>
          </div>

          {filteredEvents.length > 0 ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.map((event) => {
                const category = categoryById.get(event.categoryId);
                if (!category) return null;
                return (
                  <li key={event.id}>
                    <EventCard event={event} category={category} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
              <SearchX aria-hidden="true" className="size-10 text-slate-500" />
              <p className="mt-4 font-medium text-white">No events match your search</p>
              <p className="mt-1 text-sm text-slate-400">Try a different keyword, city or category.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Clear filters
              </button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
