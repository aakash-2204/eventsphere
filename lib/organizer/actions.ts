"use server";

// Organizer Server Actions. Each one re-checks the role on the server, and
// RLS / database functions check ownership again.

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { dbMessage } from "@/lib/events/constants";
import { type FormState, getText } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { CheckInResult } from "@/types/database";

const categoryIds = ["music", "tech", "sports", "arts", "food", "business"] as const;

/** datetime-local inputs have no time zone; EventSphere treats them as IST. */
function istToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  return new Date(`${value}:00+05:30`).toISOString();
}

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title needs at least 3 characters.").max(150),
    description: z.string().trim().max(5000).default(""),
    category: z.enum(categoryIds, "Choose a category."),
    isOnline: z.boolean(),
    venue: z.string().trim().max(150),
    city: z.string().trim().max(80),
    onlineUrl: z.string().trim().max(500),
    startsAt: z.string().transform((value, ctx) => {
      const iso = istToIso(value);
      if (!iso) ctx.addIssue({ code: "custom", message: "Choose a start date and time." });
      return iso ?? "";
    }),
    endsAt: z.string().transform((value) => (value ? istToIso(value) : null)),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(100000),
  })
  .superRefine((data, ctx) => {
    if (data.isOnline && !/^https:\/\/\S+$/.test(data.onlineUrl)) {
      ctx.addIssue({ code: "custom", path: ["onlineUrl"], message: "Enter an https:// link for the online event." });
    }
    if (!data.isOnline && data.venue.length < 2) ctx.addIssue({ code: "custom", path: ["venue"], message: "Enter the venue." });
    if (!data.isOnline && data.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter the city." });
    if (data.startsAt && new Date(data.startsAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "The event must start in the future." });
    }
    if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after the start time." });
    }
  });

function readEvent(formData: FormData) {
  const values = {
    title: getText(formData, "title"),
    description: getText(formData, "description"),
    category: getText(formData, "category"),
    venue: getText(formData, "venue"),
    city: getText(formData, "city"),
    onlineUrl: getText(formData, "onlineUrl"),
    startsAt: getText(formData, "startsAt"),
    endsAt: getText(formData, "endsAt"),
    capacity: getText(formData, "capacity"),
    isOnline: getText(formData, "isOnline") === "on" ? "on" : "",
  };
  return { values, parsed: eventSchema.safeParse({ ...values, isOnline: values.isOnline === "on" }) };
}

/** Uploads an optional banner image to Supabase Storage and returns its public URL. */
async function uploadBanner(formData: FormData, userId: string, eventId: string): Promise<string | null | "error"> {
  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) return "error";
  const supabase = await createClient();
  const extension = file.type.split("/")[1];
  const path = `${userId}/${eventId}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("event-banners").upload(path, file, { contentType: file.type });
  if (error) return "error";
  return supabase.storage.from("event-banners").getPublicUrl(path).data.publicUrl;
}

export async function saveEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(["organizer"], "/organizer/events/new");
  const eventId = getText(formData, "eventId");
  const { values, parsed } = readEvent(formData);
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const data = parsed.data;
  const row = {
    title: data.title,
    description: data.description,
    category: data.category,
    is_online: data.isOnline,
    venue: data.isOnline ? "Online" : data.venue,
    city: data.isOnline ? "Online" : data.city,
    online_url: data.isOnline ? data.onlineUrl : null,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    capacity: data.capacity,
  };

  const supabase = await createClient();
  let id = eventId;
  if (id) {
    // RLS only allows this while the event is a draft that is not under review.
    const { data: updated, error } = await supabase.from("events").update(row).eq("id", id).select("id");
    if (error || !updated?.length) return { status: "error", message: "This event can no longer be edited.", values };
  } else {
    const { data: created, error } = await supabase.from("events").insert(row).select("id").single();
    if (error || !created) return { status: "error", message: "Could not create the event. Please try again.", values };
    id = created.id;
  }

  const bannerUrl = await uploadBanner(formData, user.id, id);
  if (bannerUrl === "error") {
    return { status: "error", message: "Event saved, but the banner must be a JPG, PNG or WebP under 4 MB.", values };
  }
  if (bannerUrl) await supabase.from("events").update({ banner_url: bannerUrl }).eq("id", id);

  if (!eventId) redirect(`/organizer/events/${id}`);
  refresh();
  return { status: "success", message: "Event saved." };
}

const ticketSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(2, "Name the ticket type.").max(60),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(1000000),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(100000),
  saleStartsAt: z.string().transform((value) => (value ? istToIso(value) : null)),
  saleEndsAt: z.string().transform((value) => (value ? istToIso(value) : null)),
});

export async function addTicketTypeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["organizer"]);
  const values = {
    eventId: getText(formData, "eventId"),
    name: getText(formData, "name"),
    price: getText(formData, "price"),
    quantity: getText(formData, "quantity"),
    saleStartsAt: getText(formData, "saleStartsAt"),
    saleEndsAt: getText(formData, "saleEndsAt"),
  };
  const parsed = ticketSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { eventId, name, price, quantity, saleStartsAt, saleEndsAt } = parsed.data;
  if (saleStartsAt && saleEndsAt && saleEndsAt <= saleStartsAt) {
    return { status: "error", fieldErrors: { saleEndsAt: ["Sale end must be after sale start."] }, values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_types")
    .insert({ event_id: eventId, name, price, quantity, sale_starts_at: saleStartsAt, sale_ends_at: saleEndsAt });
  if (error) return { status: "error", message: "Ticket types can only be added to your draft events.", values };

  // Keep the "from" price on event cards in sync with the cheapest ticket.
  const { data: prices } = await supabase.from("ticket_types").select("price").eq("event_id", eventId);
  const lowest = Math.min(...(prices ?? []).map((p) => Number(p.price)));
  if (Number.isFinite(lowest)) await supabase.from("events").update({ price_from: lowest }).eq("id", eventId);

  refresh();
  return { status: "success", message: "Ticket type added." };
}

export async function deleteTicketTypeAction(formData: FormData): Promise<void> {
  await requireRole(["organizer"]);
  const id = z.uuid().safeParse(getText(formData, "ticketTypeId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("ticket_types").delete().eq("id", id.data);
  refresh();
}

export async function submitEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["organizer"]);
  const id = z.uuid().safeParse(getText(formData, "eventId"));
  if (!id.success) return { status: "error", message: "Invalid event." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_for_review", { p_event_id: id.data });
  if (error) return { status: "error", message: dbMessage(error, "Could not submit the event.") };
  refresh();
  return { status: "success", message: "Submitted. An admin will review it before it goes live." };
}

export async function cancelEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["organizer", "admin"]);
  const id = z.uuid().safeParse(getText(formData, "eventId"));
  const reason = getText(formData, "reason").trim().slice(0, 500);
  if (!id.success) return { status: "error", message: "Invalid event." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { p_event_id: id.data, p_reason: reason || null });
  if (error) return { status: "error", message: dbMessage(error, "Could not cancel the event.") };
  refresh();
  return { status: "success", message: "Event cancelled. Attendees have been notified in the app." };
}

export type CheckInState = { status: "idle" | "done" | "error"; result?: CheckInResult; message?: string };

export async function checkInAction(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  await requireRole(["organizer", "admin"], "/organizer/check-in");
  // Accept a bare ticket id or any text containing one (e.g. a scanned QR value).
  const match = getText(formData, "code").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!match) return { status: "error", message: "That is not a valid ticket code." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in_ticket", { p_ticket_id: match[0].toLowerCase() });
  if (error || !data) return { status: "error", message: "Check-in failed. Please try again." };
  return { status: "done", result: data };
}
