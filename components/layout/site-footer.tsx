import Link from "next/link";
import { Mail, Ticket } from "lucide-react";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 py-12">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600">
              <Ticket aria-hidden="true" className="size-4" />
            </span>
            EventSphere
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Event booking and ticketing, built as an evaluation project.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-white">On this page</p>
          <Link href="/events" className="text-slate-400 hover:text-white">
            Explore Events
          </Link>
          <a href="#how-it-works" className="text-slate-400 hover:text-white">
            How it works
          </a>
        </nav>

        <div className="text-sm">
          <p className="font-semibold text-white">Contact</p>
          <p className="mt-2 flex items-center gap-2 text-slate-400">
            <Mail aria-hidden="true" className="size-4" />
            support@eventsphere.example
          </p>
        </div>
      </Container>

      <Container className="mt-10 border-t border-white/5 pt-6">
        <p className="text-xs text-slate-500">
          © 2026 EventSphere. Events shown are sample data for demonstration only.
        </p>
      </Container>
    </footer>
  );
}
