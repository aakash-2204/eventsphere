"use server";

// Server Actions for sign up, log in, log out and password reset.
// They run only on the server. The browser just submits the form.

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type FormState, getText, safeRedirectPath } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

const NOT_CONFIGURED: FormState = {
  status: "error",
  message: "Supabase is not configured yet. Follow SUPABASE_SETUP.md, then restart the dev server.",
};

/** The site's base URL, used to build links inside emails. */
async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const origin = (await headers()).get("origin");
  return origin ?? "http://localhost:3000";
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: getText(formData, "fullName"), email: getText(formData, "email") };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: getText(formData, "password"),
    confirmPassword: getText(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Stored as user metadata. The database trigger copies the name into
      // profiles, and always sets the role to "attendee".
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await getSiteUrl()}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    const message =
      error.code === "weak_password"
        ? "That password is too weak. Try a longer one."
        : error.code === "over_email_send_rate_limit"
          ? "Too many emails sent. Please wait a few minutes and try again."
          : "We could not create your account. Please try again.";
    return { status: "error", message, values };
  }

  // Supabase returns success even if the email is already registered, so we
  // never reveal which emails have accounts.
  return {
    status: "success",
    message: `Check ${parsed.data.email} for a verification link to activate your account.`,
  };
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: getText(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: getText(formData, "password") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Please verify your email first. Check your inbox for the link we sent."
        : error.code === "invalid_credentials"
          ? "Incorrect email or password."
          : "We could not log you in. Please try again.";
    return { status: "error", message, values };
  }

  // redirect() must be outside try/catch: it works by throwing.
  redirect(safeRedirectPath(getText(formData, "next")));
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: getText(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getSiteUrl()}/auth/confirm?next=/reset-password`,
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { status: "error", message: "Too many emails sent. Please wait a few minutes.", values };
  }

  // Same message whether or not the account exists, so emails stay private.
  return {
    status: "success",
    message: "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: getText(formData, "password"),
    confirmPassword: getText(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  // The reset email link signs the user in (see app/auth/confirm/route.ts).
  // Without that session, the link was not used or has expired.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return {
      status: "error",
      message: "Your reset link has expired or was already used. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "Choose a password different from your current one."
        : "We could not update your password. Please try again.";
    return { status: "error", message };
  }

  return { status: "success", message: "Your password has been updated." };
}
