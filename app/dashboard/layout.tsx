import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 py-10">{children}</main>
    </>
  );
}
