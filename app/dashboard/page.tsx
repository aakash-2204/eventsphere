import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { OrganizerRequestForm } from "@/components/dashboard/organizer-request-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard — EventSphere" };

export default function DashboardPage() {
  return (
    <Container>
      {/* Reading the session must happen inside Suspense (Cache Components rule). */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </Container>
  );
}

async function DashboardContent() {
  // Server-side check: guests are redirected to /login.
  const user = await requireUser("/dashboard");
  const profile = user.profile;

  if (!profile) {
    return (
      <div role="alert" className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>
          You are signed in, but no profile was found. Make sure the database migration in{" "}
          <code>supabase/migrations</code> was run before this account was created (see SUPABASE_SETUP.md).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">{profile.full_name || user.email}</h1>
        </div>
        <RoleBadge role={profile.role} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Your profile" description={`Signed in as ${user.email}`}>
          <ProfileForm fullName={profile.full_name} />
        </DashboardCard>

        {profile.role === "attendee" ? <OrganizerAccessCard /> : null}

        {profile.role === "organizer" ? (
          <DashboardCard title="Organizer tools" description="Your account can host events.">
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <Sparkles aria-hidden="true" className="size-4 text-violet-300" />
              Creating and managing events arrives in the next phase.
            </p>
          </DashboardCard>
        ) : null}

        {profile.role === "admin" ? (
          <DashboardCard title="Admin" description="Review requests from attendees who want to host events.">
            <Link
              href="/admin/organizer-requests"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              Review organizer requests
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </DashboardCard>
        ) : null}
      </div>
    </div>
  );
}

async function OrganizerAccessCard() {
  const supabase = await createClient();
  // RLS only returns this user's own requests.
  const { data: latestRequest } = await supabase
    .from("organizer_requests")
    .select("status, organization_name, admin_note, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRequest?.status === "pending") {
    return (
      <DashboardCard title="Organizer access" description="Want to host your own events?">
        <p role="status" className="flex items-center gap-2 text-sm text-amber-200">
          <Clock aria-hidden="true" className="size-4" />
          Your request for <strong className="font-semibold">{latestRequest.organization_name}</strong> is waiting
          for admin review.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Become an organizer"
      description="Tell us about the events you want to host. An admin will review your request."
    >
      {latestRequest?.status === "rejected" ? (
        <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Your previous request was not approved
          {latestRequest.admin_note ? `: ${latestRequest.admin_note}` : "."} You can apply again.
        </p>
      ) : null}
      <OrganizerRequestForm />
    </DashboardCard>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your dashboard" className="space-y-8">
      <div className="h-16 w-64 animate-pulse rounded-xl bg-white/5" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
