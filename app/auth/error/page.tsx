import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Link problem — EventSphere" };

// Shown when an email verification or password reset link fails.
export default function AuthErrorPage() {
  return (
    <AuthShell>
      <LinkIcon aria-hidden="true" className="mb-4 size-10 text-amber-300" />
      <AuthHeading
        title="This link didn't work"
        description="Email links expire after a while and can only be used once. If you already verified your email, just log in."
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="flex-1 rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-violet-500"
        >
          Log in
        </Link>
        <Link
          href="/forgot-password"
          className="flex-1 rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-white/5"
        >
          Send a new reset link
        </Link>
      </div>
    </AuthShell>
  );
}
