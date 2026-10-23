import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseNotConfigured } from "@/components/auth/supabase-not-configured";

export const metadata: Metadata = { title: "Log in — EventSphere" };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Welcome back" description="Log in to manage your bookings and events." />
      <SupabaseNotConfigured />
      {/* LoginForm reads ?next= from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/5" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-400">
        New to EventSphere?{" "}
        <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">
          Create an account
        </Link>
      </p>
    </>
  );
}
