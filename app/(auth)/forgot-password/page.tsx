import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SupabaseNotConfigured } from "@/components/auth/supabase-not-configured";

export const metadata: Metadata = { title: "Forgot password — EventSphere" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter your account email and we'll send you a link to choose a new password."
      />
      <SupabaseNotConfigured />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Back to log in
        </Link>
      </p>
    </>
  );
}
