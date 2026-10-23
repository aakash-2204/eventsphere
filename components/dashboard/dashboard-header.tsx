import Link from "next/link";
import { LogOut, Ticket } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Container } from "@/components/ui/container";
import { signOutAction } from "@/lib/auth/actions";

/** Top bar for signed-in pages (/dashboard and /admin). */
export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-navy-950/80 backdrop-blur-lg">
      <Container>
        <nav aria-label="Account" className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600">
              <Ticket aria-hidden="true" className="size-5" />
            </span>
            <span className="hidden sm:inline">EventSphere</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Dashboard
            </Link>
            <form action={signOutAction}>
              <SubmitButton pendingLabel="Logging out…" variant="secondary" className="rounded-full! py-2!">
                <LogOut aria-hidden="true" className="size-4" />
                Log out
              </SubmitButton>
            </form>
          </div>
        </nav>
      </Container>
    </header>
  );
}
