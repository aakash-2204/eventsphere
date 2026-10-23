import { Suspense } from "react";
import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { ReviewRequestButtons } from "@/components/admin/review-request-buttons";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Organizer requests — EventSphere" };

export default function OrganizerRequestsPage() {
  return (
    <Container>
      <h1 className="text-3xl font-bold tracking-tight text-white">Organizer requests</h1>
      <p className="mt-2 text-sm text-slate-400">Approving a request changes that user&apos;s role to organizer.</p>
      <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-2xl bg-white/5" />}>
        <PendingRequests />
      </Suspense>
    </Container>
  );
}

async function PendingRequests() {
  // Server-side check: non-admins are redirected to /dashboard.
  await requireRole(["admin"], "/admin/organizer-requests");

  const supabase = await createClient();
  const { data: requests, error } = await supabase
    .from("organizer_requests")
    .select("id, organization_name, reason, created_at, applicant:profiles!organizer_requests_user_id_fkey(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p role="alert" className="mt-8 text-sm text-rose-300">
        Could not load requests. Please refresh the page.
      </p>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
        <Inbox aria-hidden="true" className="size-10 text-slate-500" />
        <p className="mt-4 font-medium text-white">No pending requests</p>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-4">
      {requests.map((request) => (
        <li key={request.id} className="rounded-2xl border border-white/10 bg-navy-900/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-semibold text-white">{request.organization_name}</h2>
              <p className="mt-1 text-sm text-slate-400">
                From {request.applicant?.full_name || "Unnamed user"} ·{" "}
                <time dateTime={request.created_at}>
                  {new Date(request.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                </time>
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{request.reason}</p>
            </div>
            <ReviewRequestButtons requestId={request.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
