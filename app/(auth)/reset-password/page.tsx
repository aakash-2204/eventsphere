import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SupabaseNotConfigured } from "@/components/auth/supabase-not-configured";

export const metadata: Metadata = { title: "Choose a new password — EventSphere" };

// Users arrive here from the reset email link (via /auth/confirm), which signs
// them in. The Server Action checks that session before changing the password.
export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password" description="Pick something you haven't used here before." />
      <SupabaseNotConfigured />
      <ResetPasswordForm />
    </>
  );
}
