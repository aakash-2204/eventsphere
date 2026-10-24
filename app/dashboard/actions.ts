"use server";

// Dashboard Server Actions. Each one:
//   1. checks who is signed in (and their role) on the server, then
//   2. writes to Supabase, where Row Level Security checks again.

import { z } from "zod";
import { refresh } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/dal";
import { fullNameSchema, organizerRequestSchema } from "@/lib/auth/schemas";
import { type FormState, getText } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = { fullName: getText(formData, "fullName") };

  const parsed = fullNameSchema.safeParse(values.fullName);
  if (!parsed.success) {
    return { status: "error", fieldErrors: { fullName: z.flattenError(parsed.error).formErrors }, values };
  }

  const supabase = await createClient();
  // Only full_name is sent. Even if someone added "role" to this request, the
  // database only lets users update full_name (see the migration).
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data }).eq("id", user.id);

  if (error) return { status: "error", message: "We could not save your name. Please try again.", values };

  refresh();
  return { status: "success", message: "Your name has been updated." };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Use 72 characters or fewer.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

/** Logged-in password change. The current password is verified first. */
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: getText(formData, "currentPassword"),
    password: getText(formData, "password"),
    confirmPassword: getText(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword });
  if (verifyError) return { status: "error", fieldErrors: { currentPassword: ["Your current password is incorrect."] } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: "error",
      message: error.code === "same_password" ? "Choose a password different from your current one." : "We could not change your password.",
    };
  }
  return { status: "success", message: "Your password has been changed." };
}

export async function requestOrganizerAccessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["attendee"]);
  const values = {
    organizationName: getText(formData, "organizationName"),
    reason: getText(formData, "reason"),
  };

  const parsed = organizerRequestSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizer_requests").insert({
    organization_name: parsed.data.organizationName,
    reason: parsed.data.reason,
  });

  if (error) {
    // 23505 = unique violation: a pending request already exists.
    const message =
      error.code === "23505"
        ? "You already have a request waiting for review."
        : "We could not send your request. Please try again.";
    return { status: "error", message, values };
  }

  refresh();
  return { status: "success", message: "Request sent. An admin will review it soon." };
}

export async function reviewOrganizerRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["admin"], "/admin/organizer-requests");

  const requestId = z.uuid().safeParse(getText(formData, "requestId"));
  const decision = getText(formData, "decision");
  if (!requestId.success || (decision !== "approve" && decision !== "reject")) {
    return { status: "error", message: "Invalid request." };
  }

  const supabase = await createClient();
  // The database function checks again that the caller is an admin.
  const { error } = await supabase.rpc("review_organizer_request", {
    request_id: requestId.data,
    approve: decision === "approve",
  });

  if (error) {
    return { status: "error", message: "This request could not be updated. It may already have been reviewed." };
  }

  refresh();
  return { status: "success", message: decision === "approve" ? "Approved." : "Rejected." };
}
