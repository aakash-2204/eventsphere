import { MousePointerClick, QrCode, Search, Ticket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Search by name, city or category to find events that match your plans.",
  },
  {
    icon: MousePointerClick,
    title: "Choose tickets",
    description: "Pick a ticket type and quantity, and see the total before you continue.",
  },
  {
    icon: Ticket,
    title: "Confirm booking",
    description: "Sign in, confirm your details and get an instant booking confirmation.",
  },
  {
    icon: QrCode,
    title: "Show your QR code",
    description: "Every ticket comes with a unique QR code that is scanned at the venue.",
  },
];

export function HowItWorksSection() {
  return (
    <section aria-labelledby="how-it-works-heading" id="how-it-works" className="scroll-mt-24 py-20">
      <Container>
        <SectionHeading
          id="how-it-works-heading"
          eyebrow="How it works"
          title="From discovery to doorstep in four steps"
        />

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative rounded-2xl border border-white/10 bg-navy-900/70 p-6">
              <span className="absolute right-5 top-5 text-4xl font-black text-white/5" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 font-semibold text-white">
                <span className="sr-only">Step {index + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
