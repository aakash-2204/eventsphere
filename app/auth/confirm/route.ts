// Handles links from Supabase emails (verify email, reset password).
//
// Two link formats are supported:
//   ?token_hash=...&type=...  — recommended email templates (SUPABASE_SETUP.md).
//                                Works even if the link opens in another browser.
//   ?code=...                 — Supabase's default templates. Only works in the
//                                same browser that started the sign-up/reset.

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) redirect("/auth/error");

  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  // Password-reset links always continue to the reset form.
  const next =
    type === "recovery" ? "/reset-password" : safeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  redirect("/auth/error");
}
