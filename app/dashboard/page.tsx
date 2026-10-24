import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
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

      <AttendeeSummary userId={user.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Your profile" description={`Signed in as ${user.email}`}>
          <ProfileForm fullName={profile.full_name} />
        </DashboardCard>

        <DashboardCard title="Change password">
          <ChangePasswordForm />
        </DashboardCard>

        {profile.role === "attendee" ? <OrganizerAccessCard /> : null}

        {profile.role === "organizer" ? (
          <DashboardCard title="Organizer tools" description="Create events, track sales and check in attendees.">
            <div className="flex flex-wrap gap-2">
              <Link href="/organizer/events" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500">
                <Sparkles aria-hidden="true" className="size-4" />
                My events & sales
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/organizer/check-in" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5">
                Check-in
              </Link>
            </div>
          </DashboardCard>
        ) : null}

        {profile.role === "admin" ? (
          <DashboardCard title="Admin" description="Approve events, review organizer requests and manage users.">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              Admin overview
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </DashboardCard>
        ) : null}
      </div>
    </div>
  );
}

/** Attendee summary: upcoming tickets, bookings and unread notifications. */
async function AttendeeSummary({ userId }: { userId: string }) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [bookings, upcoming, unread] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "confirmed"),
    supabase
      .from("tickets")
      .select("id, events!inner(starts_at)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "valid")
      .gte("events.starts_at", nowIso),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);

  const cards: [string, number | null, string][] = [
    ["Confirmed bookings", bookings.count, "/bookings"],
    ["Upcoming tickets", upcoming.count, "/tickets"],
    ["Unread notifications", unread.count, "/notifications"],
  ];
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {cards.map(([label, value, href]) => (
        <Link key={label} href={href} className="rounded-2xl border border-white/10 bg-navy-900/70 p-5 hover:border-violet-500/50">
          <dt className="text-sm text-slate-400">{label}</dt>
          <dd className="mt-1 text-2xl font-bold text-white">{value ?? "—"}</dd>
        </Link>
      ))}
    </dl>
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
