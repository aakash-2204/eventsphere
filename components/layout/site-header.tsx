"use client";

// Client component because the mobile menu needs to open and close.

import { useState, type ReactNode } from "react";
import { Menu, Ticket, X } from "lucide-react";
import { Container } from "@/components/ui/container";

type SiteHeaderProps = {
  /** Log In / Sign Up or Dashboard links, rendered on the server by the page. */
  desktopAuthLinks: ReactNode;
  mobileAuthLinks: ReactNode;
};

export function SiteHeader({ desktopAuthLinks, mobileAuthLinks }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/80 backdrop-blur-lg">
      <Container>
        <nav aria-label="Main" className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600">
              <Ticket aria-hidden="true" className="size-5" />
            </span>
            EventSphere
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Explore Events scrolls to the events on this page; a dedicated /events route comes later. */}
            <a
              href="#featured-events"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Explore Events
            </a>
            {desktopAuthLinks}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white md:hidden"
          >
            {isMenuOpen ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
          </button>
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen ? (
          <div id="mobile-menu" className="flex flex-col gap-2 border-t border-white/10 py-4 md:hidden">
            <a
              href="#featured-events"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Explore Events
            </a>
            {mobileAuthLinks}
          </div>
        ) : null}
      </Container>
    </header>
  );
}
