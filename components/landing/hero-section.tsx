import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";

const highlights = [
  { icon: Sparkles, label: "Curated events" },
  { icon: CalendarDays, label: "Live seat availability" },
  { icon: QrCode, label: "QR e-tickets" },
];

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden pb-24 pt-16 sm:pt-24">
      {/* Decorative violet glow behind the heading */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
      />

      <Container className="relative text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          <Sparkles aria-hidden="true" className="size-4" />
          Discover what&apos;s happening near you
        </p>

        <h1
          id="hero-heading"
          className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Book unforgettable{" "}
          <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            live experiences
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          From concerts and conferences to food walks and theatre, EventSphere helps you find
          events, reserve seats and keep every ticket in one place.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/50 transition hover:bg-violet-500"
          >
            Explore events
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-white/15 px-6 py-3 font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            How it works
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
          {highlights.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon aria-hidden="true" className="size-4 text-violet-400" />
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
