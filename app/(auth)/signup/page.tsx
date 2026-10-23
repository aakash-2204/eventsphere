import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { SupabaseNotConfigured } from "@/components/auth/supabase-not-configured";

export const metadata: Metadata = { title: "Sign up — EventSphere" };

export default function SignupPage() {
  return (
    <>
      <AuthHeading title="Create your account" description="Discover events and keep all your tickets in one place." />
      <SupabaseNotConfigured />
      <SignupForm />
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Log in
        </Link>
      </p>
    </>
  );
}
