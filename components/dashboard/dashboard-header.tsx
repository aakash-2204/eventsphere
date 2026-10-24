import { Suspense } from "react";
import Link from "next/link";
import { Bell, LogOut, Ticket } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Container } from "@/components/ui/container";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/dal";

const linkClass = "rounded-full px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white";

/** Top bar for every page except the landing page. */
export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-navy-950/80 backdrop-blur-lg">
      <Container>
        <nav aria-label="Main" className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600">
              <Ticket aria-hidden="true" className="size-5" />
            </span>
            <span className="hidden sm:inline">EventSphere</span>
          </Link>
          <div className="flex flex-wrap items-center gap-1">
            <Link href="/events" className={linkClass}>
              Explore
            </Link>
            {/* Account links depend on the session, so they stream in. */}
            <Suspense fallback={null}>
              <AccountLinks />
            </Suspense>
          </div>
        </nav>
      </Container>
    </header>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className={linkClass}>
          Log In
        </Link>
        <Link href="/signup" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
          Sign Up
        </Link>
      </>
    );
  }

  const role = user.profile?.role;
  return (
    <>
      <Link href="/bookings" className={linkClass}>
        Bookings
      </Link>
      <Link href="/tickets" className={linkClass}>
        Tickets
      </Link>
      {role === "organizer" || role === "admin" ? (
        <Link href="/organizer/events" className={linkClass}>
          My events
        </Link>
      ) : null}
      {role === "admin" ? (
        <Link href="/admin" className={linkClass}>
          Admin
        </Link>
      ) : null}
      <Link href="/dashboard" className={linkClass}>
        Dashboard
      </Link>
      <Link href="/notifications" className={linkClass} aria-label="Notifications">
        <Bell aria-hidden="true" className="size-4" />
      </Link>
      <form action={signOutAction}>
        <SubmitButton pendingLabel="…" variant="secondary" className="rounded-full! px-3! py-2!">
          <LogOut aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">Log out</span>
        </SubmitButton>
      </form>
    </>
  );
}
