// Shared event types. Phase 1 fills these from sample data; a later phase
// will fill them from Supabase, so the UI components will not need to change.

export type EventCategoryId =
  | "music"
  | "tech"
  | "sports"
  | "arts"
  | "food"
  | "business";

export type EventCategory = {
  id: EventCategoryId;
  name: string;
  description: string;
};

export type EventSummary = {
  id: string;
  title: string;
  categoryId: EventCategoryId;
  venue: string;
  city: string;
  /** ISO 8601 date-time string, e.g. "2026-11-14T18:30:00+05:30" */
  startsAt: string;
  /** Lowest ticket price in Indian rupees. 0 means the event is free. */
  priceFrom: number;
  organizer: string;
  seatsLeft: number;
};
