// Shared layout for the signed-in app and public event pages.
// "(app)" is a route group, so it does not appear in URLs.

import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 py-10">{children}</main>
    </>
  );
}
