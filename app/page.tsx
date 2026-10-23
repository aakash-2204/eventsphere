import { CategoriesSection } from "@/components/landing/categories-section";
import { EventDiscovery } from "@/components/landing/event-discovery";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
// Phase 1: sample data only. This import will be swapped for a Supabase query later.
import { sampleCategories, sampleEvents } from "@/lib/sample-data/events";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top" className="flex-1">
        <HeroSection />
        <EventDiscovery events={sampleEvents} categories={sampleCategories} />
        <CategoriesSection categories={sampleCategories} events={sampleEvents} />
        <HowItWorksSection />
      </main>
      <SiteFooter />
    </>
  );
}
