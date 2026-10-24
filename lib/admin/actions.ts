"use server";

// Admin Server Actions. requireRole checks on the server, and every database
// function checks is_admin() again.

import { z } from "zod";
import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { dbMessage } from "@/lib/events/constants";
import { type FormState, getText } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function reviewEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["admin"], "/admin/events");
  const id = z.uuid().safeParse(getText(formData, "eventId"));
  const decision = getText(formData, "decision");
  const note = getText(formData, "note").trim().slice(0, 500);
  if (!id.success || (decision !== "approve" && decision !== "reject")) return { status: "error", message: "Invalid request." };
  if (decision === "reject" && note.length < 3) return { status: "error", message: "Add a short reason when rejecting." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_event", { p_event_id: id.data, p_approve: decision === "approve", p_note: note || null });
  if (error) return { status: "error", message: dbMessage(error, "Could not review this event.") };
  refresh();
  return { status: "success", message: decision === "approve" ? "Approved and published." : "Rejected." };
}

export async function setUserRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["admin"], "/admin/users");
  const userId = z.uuid().safeParse(getText(formData, "userId"));
  const role = getText(formData, "role");
  if (!userId.success || (role !== "attendee" && role !== "organizer")) return { status: "error", message: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId.data, p_role: role });
  if (error) return { status: "error", message: dbMessage(error, "Could not change this role.") };
  refresh();
  return { status: "success", message: "Role updated." };
}
