import { CategoriesSection } from "@/components/landing/categories-section";
import { EventDiscovery } from "@/components/landing/event-discovery";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { Suspense } from "react";
import { GuestAuthLinks, HeaderAuthLinks } from "@/components/layout/header-auth-links";
import { SiteHeader } from "@/components/layout/site-header";
// Phase 1: sample data only. This import will be swapped for a Supabase query later.
import { sampleCategories, sampleEvents } from "@/lib/sample-data/events";

export default function Home() {
  return (
    <>
      {/* The rest of the page stays static; only the auth links wait for the session. */}
      <SiteHeader
        desktopAuthLinks={
          <Suspense fallback={<GuestAuthLinks layout="desktop" />}>
            <HeaderAuthLinks layout="desktop" />
          </Suspense>
        }
        mobileAuthLinks={
          <Suspense fallback={<GuestAuthLinks layout="mobile" />}>
            <HeaderAuthLinks layout="mobile" />
          </Suspense>
        }
      />
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
