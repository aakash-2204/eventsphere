"use server";

// Booking Server Actions. All seat and payment logic lives in database
// functions (see supabase/migrations/20261024080000_booking_ticketing.sql);
// these actions validate input, check the session and call them.

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { dbMessage } from "@/lib/events/constants";
import { type FormState, getText } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

const holdSchema = z.object({
  eventId: z.uuid(),
  ticketTypeId: z.uuid("Choose a ticket type."),
  quantity: z.coerce.number().int().min(1, "Choose at least 1 ticket.").max(10, "You can book up to 10 tickets."),
});

export async function createHoldAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const eventId = getText(formData, "eventId");
  await requireUser(`/events/${eventId}`);

  const parsed = holdSchema.safeParse({
    eventId,
    ticketTypeId: getText(formData, "ticketTypeId"),
    quantity: getText(formData, "quantity"),
  });
  if (!parsed.success) {
    return { status: "error", message: z.flattenError(parsed.error).fieldErrors.ticketTypeId?.[0] ?? "Check your selection." };
  }

  const supabase = await createClient();
  const { data: bookingId, error } = await supabase.rpc("create_booking_hold", {
    p_ticket_type_id: parsed.data.ticketTypeId,
    p_quantity: parsed.data.quantity,
  });
  if (error || !bookingId) {
    return { status: "error", message: dbMessage(error, "We could not reserve these tickets. Please try again.") };
  }
  redirect(`/checkout/${bookingId}`);
}

export async function confirmPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const bookingId = z.uuid().safeParse(getText(formData, "bookingId"));
  const method = getText(formData, "method");
  if (!bookingId.success || (method !== "card" && method !== "upi")) {
    return { status: "error", message: "Choose a payment method." };
  }

  // Simulated processing time so the user sees a loading state. No real
  // payment happens and no card or UPI details are ever sent to the server.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("confirm_booking_payment", {
    p_booking_id: bookingId.data,
    p_method: method,
  });
  if (error) return { status: "error", message: dbMessage(error, "Payment could not be completed. Please try again.") };
  if (result === "expired") {
    refresh();
    return { status: "error", message: "Your 10-minute hold expired, so the seats were released. Please book again." };
  }
  redirect(`/checkout/${bookingId.data}/success`);
}

export async function failPaymentAction(formData: FormData): Promise<void> {
  await requireUser();
  const bookingId = z.uuid().safeParse(getText(formData, "bookingId"));
  if (!bookingId.success) return;
  const supabase = await createClient();
  await supabase.rpc("cancel_booking_hold", { p_booking_id: bookingId.data });
  redirect(`/checkout/${bookingId.data}?failed=1`);
}

export async function cancelBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const bookingId = z.uuid().safeParse(getText(formData, "bookingId"));
  if (!bookingId.success) return { status: "error", message: "Invalid booking." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId.data });
  if (error) return { status: "error", message: dbMessage(error, "This booking could not be cancelled.") };

  refresh();
  return { status: "success", message: "Booking cancelled. Your seats have been released." };
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/notifications");
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  refresh();
}
