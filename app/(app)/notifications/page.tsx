import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { markNotificationsReadAction } from "@/lib/bookings/actions";
import { formatEventDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications — EventSphere" };

export default function NotificationsPage() {
  return (
    <Container className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
        <form action={markNotificationsReadAction}>
          <SubmitButton pendingLabel="Marking…" variant="secondary">Mark all read</SubmitButton>
        </form>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <NotificationList />
      </Suspense>
    </Container>
  );
}

async function NotificationList() {
  const user = await requireUser("/notifications");
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return <div className="mt-6"><ErrorState message="Could not load notifications." /></div>;
  if (items.length === 0) return <div className="mt-6"><EmptyState title="You're all caught up" /></div>;

  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item.id} className={`rounded-2xl border p-4 ${item.read_at ? "border-white/10 bg-navy-900/40" : "border-violet-500/40 bg-violet-500/10"}`}>
          <p className="font-medium text-white">{item.title}</p>
          <p className="mt-1 text-sm text-slate-300">{item.body}</p>
          <p className="mt-2 flex gap-3 text-xs text-slate-500">
            {formatEventDate(item.created_at)}
            {item.link ? <Link href={item.link} className="text-violet-300 hover:text-violet-200">Open</Link> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
