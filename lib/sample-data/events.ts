// SAMPLE DATA — Phase 1 (UI foundation) only.
//
// These events are made up so the landing page has something realistic to
// show. They are not stored anywhere and cannot be booked. In a later phase
// this file will be replaced by queries to the Supabase database.

import type { EventCategory, EventSummary } from "@/types/event";

export const sampleCategories: EventCategory[] = [
  {
    id: "music",
    name: "Music & Concerts",
    description: "Live gigs, festivals and intimate acoustic nights.",
  },
  {
    id: "tech",
    name: "Tech & Startups",
    description: "Conferences, hackathons and developer meetups.",
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    description: "Marathons, match screenings and outdoor adventures.",
  },
  {
    id: "arts",
    name: "Arts & Theatre",
    description: "Plays, stand-up comedy, exhibitions and dance.",
  },
  {
    id: "food",
    name: "Food & Drink",
    description: "Tasting menus, food walks and cooking workshops.",
  },
  {
    id: "business",
    name: "Business & Networking",
    description: "Workshops, summits and professional mixers.",
  },
];

export const sampleEvents: EventSummary[] = [
  {
    id: "sample-1",
    title: "Monsoon Beats Live: Indie Night",
    categoryId: "music",
    venue: "Phoenix Arena",
    city: "Mumbai",
    startsAt: "2026-11-14T19:00:00+05:30",
    priceFrom: 1499,
    organizer: "Soundscape Collective",
    seatsLeft: 120,
  },
  {
    id: "sample-2",
    title: "Bengaluru DevSummit 2026",
    categoryId: "tech",
    venue: "KTPO Convention Centre",
    city: "Bengaluru",
    startsAt: "2026-11-21T09:30:00+05:30",
    priceFrom: 2499,
    organizer: "Open Source India Forum",
    seatsLeft: 340,
  },
  {
    id: "sample-3",
    title: "Delhi Winter Half Marathon",
    categoryId: "sports",
    venue: "Jawaharlal Nehru Stadium",
    city: "New Delhi",
    startsAt: "2026-12-06T05:45:00+05:30",
    priceFrom: 899,
    organizer: "RunDelhi Club",
    seatsLeft: 58,
  },
  {
    id: "sample-4",
    title: "The Lost Letters — A Stage Play",
    categoryId: "arts",
    venue: "Ranga Shankara",
    city: "Bengaluru",
    startsAt: "2026-11-28T18:30:00+05:30",
    priceFrom: 600,
    organizer: "Curtain Call Theatre Co.",
    seatsLeft: 24,
  },
  {
    id: "sample-5",
    title: "Old Delhi Street Food Walk",
    categoryId: "food",
    venue: "Chandni Chowk Meeting Point",
    city: "New Delhi",
    startsAt: "2026-11-15T16:00:00+05:30",
    priceFrom: 1200,
    organizer: "Tasting Trails",
    seatsLeft: 15,
  },
  {
    id: "sample-6",
    title: "Founders' Breakfast & Pitch Hour",
    categoryId: "business",
    venue: "WeWork Galaxy",
    city: "Pune",
    startsAt: "2026-12-03T08:00:00+05:30",
    priceFrom: 0,
    organizer: "Pune Startup Circle",
    seatsLeft: 40,
  },
  {
    id: "sample-7",
    title: "Sunburn Arena: Electronic Nights",
    categoryId: "music",
    venue: "HITEX Exhibition Centre",
    city: "Hyderabad",
    startsAt: "2026-12-19T20:00:00+05:30",
    priceFrom: 2999,
    organizer: "Pulse Live Events",
    seatsLeft: 410,
  },
  {
    id: "sample-8",
    title: "Design Systems Workshop",
    categoryId: "tech",
    venue: "91springboard Koramangala",
    city: "Bengaluru",
    startsAt: "2026-11-08T10:00:00+05:30",
    priceFrom: 1799,
    organizer: "Product Craft Guild",
    seatsLeft: 30,
  },
];
